import { Test, TestingModule } from '@nestjs/testing';
import { WorkshopVoiceService, DARJA_MECHANICAL_DICTIONARY } from './workshop-voice.service';
import { DatabaseService } from '../database/database.service';

describe('WorkshopVoiceService (Pilier 5 — Vocal Atelier & Glossaire Darja)', () => {
  let service: WorkshopVoiceService;
  let mockDbService: Partial<DatabaseService>;
  let mockPool: any;

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    mockDbService = {
      getPool: jest.fn().mockReturnValue(mockPool),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopVoiceService,
        {
          provide: DatabaseService,
          useValue: mockDbService,
        },
      ],
    }).compile();

    service = module.get<WorkshopVoiceService>(WorkshopVoiceService);
  });

  it('devrait retourner le dictionnaire complet des termes mécaniques en Darja algérienne', () => {
    const dict = service.getDictionary();
    expect(dict.length).toBeGreaterThanOrEqual(7);
    expect(dict.some((d) => d.darjaTerm === 'zeyer culasse')).toBe(true);
    expect(dict.some((d) => d.darjaTerm === 'chhal zit')).toBe(true);
    expect(dict.some((d) => d.darjaTerm === 'injecteur m grippi')).toBe(true);
    expect(dict.some((d) => d.darjaTerm === 'disques farih')).toBe(true);
  });

  describe('normalizeIntent (Détection Phonétique & Flotte)', () => {
    it('devrait identifier "zeyer culasse" et le constructeur Renault Kerax', () => {
      const result = service.normalizeIntent('kifech zeyer culasse ta3 kerax 440');
      expect(result.matchedEntry).toBeDefined();
      expect(result.matchedEntry?.darjaTerm).toBe('zeyer culasse');
      expect(result.detectedVehicle).toBe('RENAULT_TRUCKS');
    });

    it('devrait identifier "chhal zit" et le constructeur Shacman Weichai', () => {
      const result = service.normalizeIntent('chhal zit moteur shacman wp12 saharienne');
      expect(result.matchedEntry).toBeDefined();
      expect(result.matchedEntry?.darjaTerm).toBe('chhal zit');
      expect(result.detectedVehicle).toBe('SHACMAN');
    });

    it('devrait identifier "injecteur m grippi" pour diagnostic Common Rail', () => {
      const result = service.normalizeIntent('3andi injecteur mgrippi fel actros');
      expect(result.matchedEntry).toBeDefined();
      expect(result.matchedEntry?.darjaTerm).toBe('injecteur m grippi');
      expect(result.detectedVehicle).toBe('MERCEDES_BENZ');
    });

    it('devrait identifier "freinage enacta" pour conformité réglementaire', () => {
      const result = service.normalizeIntent('seuil desequilibre frein enacta visite');
      expect(result.matchedEntry).toBeDefined();
      expect(result.matchedEntry?.darjaTerm).toBe('freinage enacta');
      expect(result.detectedVehicle).toBe('ENACTA_DZ');
    });
  });

  describe('processVoiceQuery (Short-Circuit Déterministe < 400 ms)', () => {
    it('devrait résoudre immédiatement une demande de serrage culasse sans passer par le LLM', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            section_title: 'Culasse DXi 11 — Procédure et Couples de Serrage Angulaire',
            content: 'Procédure Renault Kerax DXi 11...',
            manufacturer: 'RENAULT_TRUCKS',
            model_series: 'Kerax 440 DXi 11 Euro 3/5',
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

      const res = await service.processVoiceQuery({
        transcribedText: 'kifech zeyer culasse kerax 440',
      });

      expect(res.isDeterministicShortCircuit).toBe(true);
      expect(res.vehicleDetected).toBe('RENAULT_TRUCKS');
      expect(res.subsystemDetected).toBe('MOTEUR');
      expect(res.spokenResponseFr).toContain('60 Newton-mètres');
      expect(res.spokenResponseFr).toContain('150 Newton-mètres');
      expect(res.spokenResponseFr).toContain('270 degrés');
      expect(res.spokenResponseDarja).toContain('60 Nm');
      expect(res.spokenResponseDarja).toContain('270 daraja');
      expect(res.structuredData?.step1_torque_nm).toBe(60);
      expect(res.executionMs).toBeLessThan(400);
    });

    it('devrait résoudre la capacité d’huile pour Shacman WP12 avec préconisation saharienne', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            section_title: 'Moteur Weichai WP12 — Spécifications Lubrification Saharienne',
            content: 'Vidange huile moteur...',
            manufacturer: 'SHACMAN',
            model_series: 'X3000 WP12.430',
            structured_specs: {
              oil_capacity_liters: 36.0,
              oil_viscosity: '15W-40',
              oil_standard: 'API CI-4',
              severe_interval_km: 15000,
            },
          },
        ],
      });

      const res = await service.processVoiceQuery({
        transcribedText: 'chhal zit moteur shacman x3000',
      });

      expect(res.isDeterministicShortCircuit).toBe(true);
      expect(res.vehicleDetected).toBe('SHACMAN');
      expect(res.spokenResponseFr).toContain('36 Litres');
      expect(res.spokenResponseFr).toContain('15W-40');
      expect(res.spokenResponseFr).toContain('API CI-4');
      expect(res.spokenResponseDarja).toContain('36 litres');
      expect(res.structuredData?.oil_capacity_liters).toBe(36.0);
    });

    it('devrait basculer proprement vers le copilote pour une requête libre non répertoriée', async () => {
      const res = await service.processVoiceQuery({
        transcribedText: 'programme de révision du pont arrière après 200 000 km',
      });

      expect(res.isDeterministicShortCircuit).toBe(false);
      expect(res.normalizedIntent).toBe('REQUETE_EXPLORATOIRE_ATELIER');
      expect(res.spokenResponseFr).toContain('Copilote décisionnel');
    });
  });
});
