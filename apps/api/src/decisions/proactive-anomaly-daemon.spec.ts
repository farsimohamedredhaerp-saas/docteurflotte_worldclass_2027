// Fichier : apps/api/src/decisions/proactive-anomaly-daemon.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProactiveAnomalyDaemonService,
  TelemetryDriftEvent,
} from './services/proactive-anomaly-daemon.service';
import { DatabaseService } from '../database/database.service';

describe('Pilier 7 : Daemon Proactif de 08h00 & Machine à États Anti-Echo Storm (72h Cooldown)', () => {
  let service: ProactiveAnomalyDaemonService;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockPool: { query: jest.Mock };

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    };

    mockDatabaseService = {
      getPool: jest.fn().mockReturnValue(mockPool),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProactiveAnomalyDaemonService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<ProactiveAnomalyDaemonService>(ProactiveAnomalyDaemonService);
  });

  const sampleThermalDrift: TelemetryDriftEvent = {
    vehicleId: 'veh-actros-00412',
    vehiclePlate: '00412-116-17',
    subsystem: 'MOTEUR',
    anomalyType: 'DERIVE_THERMIQUE_LENTE_RADIATEUR',
    severity: 'WARNING',
    evidence: {
      metricName: 'engine_coolant_temperature_celsius',
      baselineValue: 88.0,
      currentValue: 92.5,
      driftDelta: 4.5,
      driftPeriodDays: 10,
      physicalLaw: 'Dérive progressive du coefficient de transfert thermique (encrassement faisceau radiateur saharien)',
      explanation: 'Hausse continue de 4.5°C à charge moteur équivalente observée sur 10 jours.',
    },
    recommendedAction: 'Détartrage et soufflage sous pression du faisceau de radiateur en atelier',
    estimatedActionCostDzd: 18000,
    inactionRiskCostDzd: 350000, // Joint de culasse ou surchauffe en plein désert
  };

  it('should be properly defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Émission Initiale de Carte Proactive à 08h00', () => {
    it('should emit a proactive card when no work order is open and no active cooldown exists', async () => {
      // 1. Check open work order -> None
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // 2. Check active cooldown -> None
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // 3. Insert into ledger -> Success
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'card-uuid-101' }] });

      const res = await service.processDetectedDrift('tenant-dz-01', sampleThermalDrift);

      expect(res.emitted).toBe(true);
      expect(res.card).toBeDefined();
      expect(res.card?.id).toBe('card-uuid-101');
      expect(res.card?.anomalyType).toBe('DERIVE_THERMIQUE_LENTE_RADIATEUR');
      expect(res.card?.status).toBe('ACTIVE_CARD');
      expect(new Date(res.card!.cooldownUntil).getTime()).toBeGreaterThan(Date.now() + 71 * 3600 * 1000);
    });
  });

  describe('2. Verrou Anti-Echo Storm (Cooldown 72h)', () => {
    it('should suppress alert if an identical anomaly was emitted and is still under 72h cooldown', async () => {
      // 1. Check open work order -> None
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      // 2. Check active cooldown -> Found active card
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-card-01', cooldown_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString() }],
      });

      const res = await service.processDetectedDrift('tenant-dz-01', sampleThermalDrift);

      expect(res.emitted).toBe(false);
      expect(res.suppressionReason).toBe('ACTIVE_72H_COOLDOWN_IN_EFFECT');
      expect(res.card).toBeUndefined();
    });
  });

  describe('3. Verrou Dédoublonnage Ordre de Travail (Work Order)', () => {
    it('should suppress alert if a Work Order is already scheduled or in progress for this subsystem', async () => {
      // 1. Check open work order -> Found scheduled work order
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'wo-0098', status: 'SCHEDULED', title: 'Révision générale MOTEUR' }],
      });

      const res = await service.processDetectedDrift('tenant-dz-01', sampleThermalDrift);

      expect(res.emitted).toBe(false);
      expect(res.suppressionReason).toBe('WORK_ORDER_ALREADY_OPEN_ON_MOTEUR');
      expect(mockPool.query).toHaveBeenCalledTimes(1); // Arrêt immédiat sans même interroger le cooldown
    });
  });

  describe('4. Transition d État : Snooze et Association d OT', () => {
    it('should snooze a card and extend cooldown by 72h', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const success = await service.snoozeCard('tenant-dz-01', 'card-uuid-101', 72);

      expect(success).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'SNOOZED'"),
        expect.arrayContaining(['card-uuid-101', 'tenant-dz-01']),
      );
    });

    it('should attach a created work order and transition status to WORK_ORDER_CREATED', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const success = await service.attachWorkOrder('tenant-dz-01', 'card-uuid-101', 'wo-9912');

      expect(success).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'WORK_ORDER_CREATED', work_order_id = $1"),
        expect.arrayContaining(['wo-9912', 'card-uuid-101', 'tenant-dz-01']),
      );
    });
  });
});
