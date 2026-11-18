import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { MiningSitesService } from './services/mining-sites.service';
import { OtrTiresService } from './services/otr-tires.service';
import { DumperHaulingService } from './services/dumper-hauling.service';
import {
  MiningSiteType,
  OtrTirePosition,
  OtrTireStatus,
} from '@docteurflotte/contracts';

describe('MiningQuarries & OTR Tires (Phase 4 Multi-Métiers)', () => {
  let sitesService: MiningSitesService;
  let tiresService: OtrTiresService;
  let haulingService: DumperHaulingService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      withTenantContext: jest.fn().mockImplementation((tenantId, cb) => {
        const mockClient = {
          query: jest.fn().mockImplementation((queryText: string, params: any[]) => {
            if (queryText.includes('INSERT INTO mining_sites')) {
              return {
                rows: [
                  {
                    id: 'site-mock-1',
                    tenant_id: tenantId,
                    code: params[1],
                    name: params[2],
                    wilaya_code: params[3],
                    commune: params[4],
                    site_type: params[5],
                    ambient_temp_summer_c: params[6],
                    average_haul_distance_km: params[7],
                    piste_gradient_max_pct: params[8],
                    created_at: new Date(),
                    updated_at: new Date(),
                  },
                ],
              };
            }
            if (queryText.includes('INSERT INTO otr_tires')) {
              return {
                rows: [
                  {
                    id: 'tire-mock-1',
                    tenant_id: tenantId,
                    asset_id: params[1],
                    serial_number: params[2],
                    brand: params[3],
                    model_pattern: params[4],
                    dimension: params[5],
                    position: params[6],
                    nominal_tkph: params[7],
                    purchase_cost_dzd: params[8],
                    tread_depth_initial_mm: params[9],
                    tread_depth_current_mm: params[10],
                    current_pressure_bar: 7.2,
                    current_temp_c: 65.0,
                    total_operating_hours: 0,
                    status: OtrTireStatus.MOUNTED,
                    created_at: new Date(),
                    updated_at: new Date(),
                  },
                ],
              };
            }
            if (queryText.includes('INSERT INTO dumper_hauling_cycles')) {
              return {
                rows: [
                  {
                    id: 'cycle-mock-1',
                    tenant_id: tenantId,
                    site_id: params[1],
                    asset_id: params[2],
                    driver_id: params[3],
                    cycle_timestamp: new Date(),
                    cycle_duration_minutes: params[4],
                    cycle_distance_km: params[5],
                    payload_metric_tons: params[6],
                    fuel_consumed_liters: params[7],
                    calculated_tkph: params[8],
                    tkph_admissible: params[9],
                    is_tkph_exceeded: params[10],
                    cost_per_ton_dzd: params[11],
                    cooling_standby_recommended: params[12],
                    created_at: new Date(),
                  },
                ],
              };
            }
            return { rows: [] };
          }),
        };
        return cb(mockClient);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiningSitesService,
        OtrTiresService,
        DumperHaulingService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    sitesService = module.get<MiningSitesService>(MiningSitesService);
    tiresService = module.get<OtrTiresService>(OtrTiresService);
    haulingService = module.get<DumperHaulingService>(DumperHaulingService);
  });

  describe('1. Physique Déterministe TKPH (Tonnes-Kilomètres Par Heure)', () => {
    it('doit calculer le TKPH exact selon la norme mondiale Michelin / Bridgestone', () => {
      // Dumper 100T : 95T payload, 65T tare à vide, 4 km aller, 24 minutes de cycle
      const tkph = haulingService.calculateTkph(95, 65, 4.0, 24.0);

      // Charge moyenne par pneu (6 pneus) = (65/6 + 160/6) / 2 = 18.75 Tonnes
      // Vitesse moyenne = (4km * 2) / (24/60 h) = 8 / 0.4 = 20.0 km/h
      // TKPH = 18.75 * 20.0 = 375.0 TKPH
      expect(tkph).toBe(375.0);
    });

    it('doit appliquer la décote thermique estivale saharienne au-delà de 38°C', () => {
      const nominalTkph = 350;

      // À 38°C nominal : aucun derating
      const tkphRef = haulingService.calculateAdmissibleTkph(nominalTkph, 38.0);
      expect(tkphRef).toBe(350);

      // À 48°C (Sahara Gâra Djebilet / Tindouf, delta +10°C)
      // Derating = 1 - (0.0075 * 10) = 0.925
      // Admissible = 350 * 0.925 = 323.75
      const tkphSahara = haulingService.calculateAdmissibleTkph(nominalTkph, 48.0);
      expect(tkphSahara).toBe(323.75);
    });

    it('doit déclencher l’alerte de dépassement TKPH et recommander le Standby Refroidissement', async () => {
      const cycle = await haulingService.recordCycle('demo-tenant-dz', {
        siteId: 'site-gara-djebilet-01',
        assetId: 'DUMPER-CAT-777-01',
        driverId: 'DRV-AMAR',
        cycleDurationMinutes: 24.0,
        cycleDistanceKm: 4.0,
        payloadMetricTons: 95.0,
        fuelConsumedLiters: 45.0,
        emptyWeightTons: 65.0,
        ambientTempC: 48.0, // Chaleur caniculaire
        nominalTkph: 350,
      });

      // TKPH calculé = 375 > TKPH admissible = 323.75
      expect(cycle.calculatedTkph).toBe(375.0);
      expect(cycle.tkphAdmissible).toBe(323.75);
      expect(cycle.isTkphExceeded).toBe(true);
      expect(cycle.coolingStandbyRecommended).toBe(true);
    });
  });

  describe('2. Calcul Économique du Coût par Tonne Transportée (DZD / Tonne)', () => {
    it('doit chiffrer le coût unitaire en combinant gasoil à 29 DZD et amortissement train de pneus', () => {
      // 95T payload, 45L fuel, 24 min cycle
      const costPerTon = haulingService.calculateCostPerTon(95, 45, 24);

      // Fuel = 45 * 29 = 1305 DZD
      // Tire = (16 800 000 / 6000) * (24/60) = 2800 * 0.4 = 1120 DZD
      // Total = 1305 + 1120 = 2425 DZD
      // Coût/Tonne = 2425 / 95 = 25.53 DZD/Tonne
      expect(costPerTon).toBe(25.53);
    });
  });

  describe('3. Gestion des Pneumatiques OTR & Sites Miniers', () => {
    it('doit enregistrer un site minier et un pneu géant 27.00R49', async () => {
      const site = await sitesService.createSite('demo-tenant-dz', {
        code: 'MINE-TIN-01',
        name: 'Gisement de Fer Gâra Djebilet',
        wilayaCode: 50,
        siteType: MiningSiteType.IRON_ORE,
        ambientTempSummerC: 49.0,
        averageHaulDistanceKm: 4.5,
        pisteGradientMaxPct: 8.5,
      });

      expect(site.code).toBe('MINE-TIN-01');
      expect(site.wilayaCode).toBe(50);

      const tire = await tiresService.createTire('demo-tenant-dz', {
        serialNumber: 'MICH-XDR3-2026-9041',
        brand: 'Michelin',
        modelPattern: 'XDR 3',
        dimension: '27.00R49',
        position: OtrTirePosition.RLO,
        nominalTkph: 360,
        purchaseCostDzd: 3200000,
        treadDepthInitialMm: 88.0,
      });

      expect(tire.serialNumber).toBe('MICH-XDR3-2026-9041');
      expect(tire.nominalTkph).toBe(360);
      expect(tire.position).toBe(OtrTirePosition.RLO);
    });
  });
});

