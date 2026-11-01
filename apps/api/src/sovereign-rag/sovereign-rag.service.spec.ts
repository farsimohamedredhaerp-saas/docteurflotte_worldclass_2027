// Fichier : apps/api/src/sovereign-rag/sovereign-rag.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SovereignRagService } from './sovereign-rag.service';
import { DatabaseService } from '../database/database.service';
import { OllamaSovereignService } from '../copilot/ollama-sovereign.service';
import { KnowledgeCategory, VehicleSubsystem } from './dto/sovereign-rag.dto';
import { OEM_ENACTA_SEEDS } from './seeds/oem-enacta-knowledge.seed';

describe('Pilier 3 : RAG Souverain Hybride & Coffre-Fort OEM/ENACTA (sovereign_knowledge_vault)', () => {
  let service: SovereignRagService;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockOllamaService: Partial<OllamaSovereignService>;
  let mockPool: { query: jest.Mock };

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    mockDatabaseService = {
      getPool: jest.fn().mockReturnValue(mockPool),
    };

    mockOllamaService = {
      generate: jest.fn().mockResolvedValue('Synthèse technique générée par Qwen 2.5 local.'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SovereignRagService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: OllamaSovereignService, useValue: mockOllamaService },
      ],
    }).compile();

    service = module.get<SovereignRagService>(SovereignRagService);
  });

  it('should be properly initialized', () => {
    expect(service).toBeDefined();
  });

  describe('1. Ingestion Structurée & Catalogue Algérie-First (Seeds)', () => {
    it('should ingest a technical item with structured JSONB specs', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' }],
      });

      const sampleItem = OEM_ENACTA_SEEDS[0];
      const resultId = await service.ingestItem(sampleItem);

      expect(resultId).toBe('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sovereign_knowledge_vault'),
        expect.arrayContaining([
          null,
          sampleItem.category,
          sampleItem.manufacturer,
          sampleItem.model_series,
          sampleItem.subsystem,
          sampleItem.section_title,
          sampleItem.content,
          expect.stringContaining('step1_torque_nm'),
        ]),
      );
    });

    it('should seed official OEM and ENACTA knowledge catalog idempotently', async () => {
      // Simulate not existing for all checks, then count
      mockPool.query.mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT id FROM sovereign_knowledge_vault')) {
          return { rows: [] }; // Doesn't exist
        }
        if (sql.includes('INSERT INTO sovereign_knowledge_vault')) {
          return { rows: [{ id: 'mock-uuid' }] };
        }
        if (sql.includes('SELECT count(*)')) {
          return { rows: [{ count: 62 }] };
        }
        return { rows: [] };
      });

      const seedResult = await service.seedKnowledgeVault();
      expect(seedResult.inserted).toBeGreaterThanOrEqual(8);
      expect(seedResult.total).toBeGreaterThanOrEqual(8);
    });
  });

  describe('2. Résolution Précise de DTC (Diagnostic Trouble Codes)', () => {
    it('should resolve SPN 3216 FMI 14 on Renault Kerax with electrical diagnostic values', async () => {
      const mockDtcRow = {
        id: 'uuid-dtc-3216',
        category: KnowledgeCategory.DTC_INDEX,
        manufacturer: 'RENAULT_TRUCKS',
        model_series: 'Kerax 440 DXi 11 Euro 3/5',
        subsystem: VehicleSubsystem.ECHAPPEMENT_FAP,
        section_title: 'DTC SPN 3216 FMI 14 — Sonde NOx Amont Défaillante / Dérive',
        content: 'Code défaut diagnostic SPN 3216 FMI 14 : Capteur NOx amont...',
        structured_specs: {
          dtc_codes: ['SPN 3216 FMI 14'],
          sensor_supply_voltage_v: 24,
          can_bus_resistance_ohms: 60,
          impact: 'Perte de puissance 40%',
        },
        rank_lex: 1,
        rank_sem: 1,
        rrf_score: '0.03279',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockDtcRow] });

      const res = await service.searchHybrid({
        query: 'SPN 3216 FMI 14',
        manufacturer: 'RENAULT_TRUCKS',
        limit: 1,
      });

      expect(res.total_found).toBe(1);
      const topMatch = res.results[0];
      expect(topMatch.section_title).toContain('SPN 3216');
      expect(topMatch.structured_specs.can_bus_resistance_ohms).toBe(60);
      expect(topMatch.structured_specs.sensor_supply_voltage_v).toBe(24);
      expect(topMatch.rrf_score).toBeGreaterThan(0.03);
    });

    it('should resolve Common Rail DTC P0087 on Shacman Weichai WP12', async () => {
      const mockP0087Row = {
        id: 'uuid-dtc-p0087',
        category: KnowledgeCategory.DTC_INDEX,
        manufacturer: 'SHACMAN',
        model_series: 'X3000 Weichai WP12.430 Euro 3/4',
        subsystem: VehicleSubsystem.INJECTION_CARBURANT,
        section_title: 'DTC P0087 — Pression Rail Inférieure à la Consigne',
        content: 'Code défaut P0087 : Rail Fuel Pressure Too Low...',
        structured_specs: {
          rail_pressure_max_bar: 1600,
          max_injector_leak_ml_per_min: 25,
          filter_porosity_microns: 30,
        },
        rank_lex: 1,
        rank_sem: 2,
        rrf_score: '0.03252',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockP0087Row] });

      const res = await service.searchHybrid({
        query: 'P0087 pression rampe faible',
        subsystem: 'INJECTION_CARBURANT',
      });

      expect(res.results.length).toBe(1);
      expect(res.results[0].structured_specs.rail_pressure_max_bar).toBe(1600);
      expect(res.results[0].structured_specs.max_injector_leak_ml_per_min).toBe(25);
    });
  });

  describe('3. Spécifications Mécaniques Déterministes & Couples de Serrage', () => {
    it('should extract exact torque specs for Kerax 440 DXi 11 cylinder head without LLM', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            section_title: 'Culasse DXi 11 — Procédure et Couples de Serrage Angulaire',
            structured_specs: {
              step1_torque_nm: 60,
              step2_torque_nm: 150,
              step3_angle_deg: 270,
              intake_clearance_mm: 0.4,
              exhaust_clearance_mm: 1.6,
            },
          },
        ],
      });

      const specs = await service.getExactSpecs('RENAULT_TRUCKS', 'MOTEUR', 'Kerax 440');

      expect(specs.length).toBe(1);
      const culasse = specs[0].structured_specs;
      expect(culasse.step1_torque_nm).toBe(60);
      expect(culasse.step2_torque_nm).toBe(150);
      expect(culasse.step3_angle_deg).toBe(270);
      expect(culasse.intake_clearance_mm).toBe(0.4);
    });
  });

  describe('4. Réglementation ENACTA Algérie & Contrôle Technique', () => {
    it('should return exact regulatory thresholds for heavy vehicle brake inspection (ENACTA Point 1.1)', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-enacta-brake',
            category: KnowledgeCategory.ENACTA_REGULATION,
            manufacturer: 'ENACTA_DZ',
            model_series: 'Barème Réglementaire 133 Points (Poids Lourds)',
            subsystem: VehicleSubsystem.SECURITE_HOMOLOGATION,
            section_title: 'ENACTA Point 1.1 — Efficacité et Déséquilibre de Freinage',
            content: 'Prescriptions techniques du contrôle technique périodique...',
            structured_specs: {
              min_service_brake_efficiency_pct: 50.0,
              max_steering_axle_imbalance_pct: 20.0,
              max_rear_axle_imbalance_pct: 30.0,
              retest_deadline_days: 15,
            },
            rank_lex: 1,
            rank_sem: 1,
            rrf_score: '0.03279',
          },
        ],
      });

      const res = await service.searchHybrid({
        query: 'seuil déséquilibre freinage essieu avant',
        category: KnowledgeCategory.ENACTA_REGULATION,
      });

      expect(res.results.length).toBe(1);
      const enactaItem = res.results[0];
      expect(enactaItem.structured_specs.min_service_brake_efficiency_pct).toBe(50.0);
      expect(enactaItem.structured_specs.max_steering_axle_imbalance_pct).toBe(20.0);
      expect(enactaItem.structured_specs.max_rear_axle_imbalance_pct).toBe(30.0);
      expect(enactaItem.structured_specs.retest_deadline_days).toBe(15);
    });
  });

  describe('5. RRF Fusion & Isolation Multi-Tenant', () => {
    it('should execute single unified SQL query with RRF formula', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-doc-1',
            category: 'OEM_MANUAL',
            manufacturer: 'MERCEDES_BENZ',
            model_series: 'Actros 3340',
            subsystem: 'FREINAGE',
            section_title: 'Disques Knorr SN7',
            content: 'Épaisseur neuve 21mm, usure max 3mm...',
            structured_specs: { pad_thickness_min_wear_mm: 3.0 },
            rank_lex: 1,
            rank_sem: 2,
            rrf_score: '0.03252',
          },
        ],
      });

      const res = await service.searchHybrid(
        { query: 'usure plaquettes actros' },
        'tenant-00000000-0000-0000-0000-000000000001',
      );

      expect(res.rrf_fused).toBe(true);
      expect(res.results[0].rrf_score).toBe(0.03252);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ROUND(( (1.0 / (60.0 + rank_lex)) + (1.0 / (60.0 + rank_sem)) )::numeric, 5) as rrf_score'),
        expect.arrayContaining(['usure plaquettes actros', 'tenant-00000000-0000-0000-0000-000000000001']),
      );
    });
  });
});
