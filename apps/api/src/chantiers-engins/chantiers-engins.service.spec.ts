import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SiteWorkspaceService } from './services/site-workspace.service';
import { AssetAssignmentService } from './services/asset-assignment.service';
import { EngineHoursService } from './services/engine-hours.service';
import { TransferChecklistService } from './services/transfer-checklist.service';
import { SiteProfitabilityService } from './services/site-profitability.service';
import { SiteStatus, EngineHourSource } from '@docteurflotte/contracts';

describe('Module A — Chantiers & Engins BTP (Asset-Centric & Maintenance 5.0)', () => {
  let siteService: SiteWorkspaceService;
  let assignmentService: AssetAssignmentService;
  let engineHoursService: EngineHoursService;
  let transferService: TransferChecklistService;
  let profitabilityService: SiteProfitabilityService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const otherTenantId = '99999999-9999-9999-9999-999999999999';
  const assetId = '11111111-1111-1111-1111-111111111111';
  const siteId = '22222222-2222-2222-2222-222222222222';
  const destSiteId = '33333333-3333-3333-3333-333333333333';

  // Mock DB flexible
  const mockDb = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiteWorkspaceService,
        AssetAssignmentService,
        EngineHoursService,
        TransferChecklistService,
        SiteProfitabilityService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    siteService = module.get<SiteWorkspaceService>(SiteWorkspaceService);
    assignmentService = module.get<AssetAssignmentService>(AssetAssignmentService);
    engineHoursService = module.get<EngineHoursService>(EngineHoursService);
    transferService = module.get<TransferChecklistService>(TransferChecklistService);
    profitabilityService = module.get<SiteProfitabilityService>(SiteProfitabilityService);

    jest.clearAllMocks();
  });

  describe('1. Intégrité Racine Asset & Affectations aux Chantiers', () => {
    it('refuse une affectation sans assetId', async () => {
      await expect(
        assignmentService.assignAssetToSite(tenantId, {
          assetId: '',
          siteId,
          startDate: '2026-11-16',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse une affectation si l’actif n’existe pas', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // asset check
      await expect(
        assignmentService.assignAssetToSite(tenantId, {
          assetId,
          siteId,
          startDate: '2026-11-16',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuse une affectation si l’actif appartient à un autre tenant (fuite inter-tenant)', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: otherTenantId, code: 'ENG-01', name: 'Bulldozer D8', status: 'IN_SERVICE' }],
      });
      await expect(
        assignmentService.assignAssetToSite(tenantId, {
          assetId,
          siteId,
          startDate: '2026-11-16',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse une affectation si l’actif est décommissionné', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, code: 'ENG-01', name: 'Bulldozer D8', status: 'DECOMMISSIONED' }],
      });
      await expect(
        assignmentService.assignAssetToSite(tenantId, {
          assetId,
          siteId,
          startDate: '2026-11-16',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse une affectation si l’actif est déjà activement affecté ailleurs', async () => {
      // 1. Asset check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, code: 'ENG-01', name: 'Bulldozer D8', status: 'IN_SERVICE' }],
      });
      // 2. Site check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: siteId, name: 'Chantier RN1 Transsaharienne', status: 'ACTIVE' }],
      });
      // 3. Active assignment check: conflit
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'ass-active-prev' }],
      });

      await expect(
        assignmentService.assignAssetToSite(tenantId, {
          assetId,
          siteId,
          startDate: '2026-11-16',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('affecte avec succès un actif éligible à un chantier ouvert', async () => {
      // 1. Asset OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, code: 'ENG-01', name: 'Bulldozer D8', status: 'IN_SERVICE' }],
      });
      // 2. Site OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: siteId, name: 'Chantier Autoroute Est-Ouest', status: 'ACTIVE' }],
      });
      // 3. Pas d'affectation active
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // 4. Insert assignment RETURNING
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'ass-new-01',
            tenant_id: tenantId,
            asset_id: assetId,
            site_id: siteId,
            assigned_by_user_id: 'user-01',
            start_date: '2026-11-16T08:00:00Z',
            expected_end_date: null,
            actual_end_date: null,
            internal_daily_rate_dzd: '45000',
            start_meter_hours: '1250.5',
            end_meter_hours: null,
            status: 'ACTIVE',
            notes: 'Affectation terrassement PK 142',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const res = await assignmentService.assignAssetToSite(
        tenantId,
        {
          assetId,
          siteId,
          startDate: '2026-11-16',
          internalDailyRateDzd: 45000,
          startMeterHours: 1250.5,
        },
        'user-01',
      );

      expect(res.id).toBe('ass-new-01');
      expect(res.assetId).toBe(assetId);
      expect(res.internalDailyRateDzd).toBe(45000);
      expect(res.startMeterHours).toBe(1250.5);
    });
  });

  describe('2. Contrôle Anti-Régression des Heures Moteur', () => {
    it('enregistre un premier relevé horaire avec delta = 0', async () => {
      // 1. Asset OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, status: 'IN_SERVICE' }],
      });
      // 2. Site OK
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: siteId }] });
      // 3. Pas d'ancien log
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // 4. Fuel price lookup
      mockDb.query.mockResolvedValueOnce({ rows: [{ price_per_liter_dzd: '29.01' }] });
      // 5. Insert log
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'log-01',
            tenant_id: tenantId,
            asset_id: assetId,
            site_id: siteId,
            recorded_at: new Date().toISOString(),
            hours_value: '1200.0',
            delta_hours_since_last: '0',
            source: EngineHourSource.MANUAL,
            fuel_consumed_liters: '80',
            fuel_cost_dzd: '2320.8',
            work_description: 'Nivellement piste',
            operator_name: 'Mourad',
            is_validated: true,
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 6. Meter readings sync
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const log = await engineHoursService.recordEngineHours(tenantId, {
        assetId,
        siteId,
        hoursValue: 1200,
        fuelConsumedLiters: 80,
      });

      expect(log.hoursValue).toBe(1200);
      expect(log.deltaHoursSinceLast).toBe(0);
      expect(log.fuelCostDzd).toBe(2320.8);
    });

    it('calcule le delta horaire exact sur un relevé subséquent', async () => {
      // 1. Asset OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, status: 'IN_SERVICE' }],
      });
      // 2. Site OK
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: siteId }] });
      // 3. Dernier relevé à 1200 h
      mockDb.query.mockResolvedValueOnce({ rows: [{ hours_value: '1200.0' }] });
      // 4. Fuel price lookup
      mockDb.query.mockResolvedValueOnce({ rows: [{ price_per_liter_dzd: '29.01' }] });
      // 5. Insert log avec 1208.5 h (delta 8.5)
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'log-02',
            tenant_id: tenantId,
            asset_id: assetId,
            site_id: siteId,
            recorded_at: new Date().toISOString(),
            hours_value: '1208.5',
            delta_hours_since_last: '8.5',
            source: EngineHourSource.CAN_J1939,
            fuel_consumed_liters: '110',
            fuel_cost_dzd: '3191.1',
            work_description: 'Excavation rocheuse',
            operator_name: null,
            is_validated: true,
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 5. Meter readings sync
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const log = await engineHoursService.recordEngineHours(tenantId, {
        assetId,
        siteId,
        hoursValue: 1208.5,
        source: EngineHourSource.CAN_J1939,
        fuelConsumedLiters: 110,
      });

      expect(log.hoursValue).toBe(1208.5);
      expect(log.deltaHoursSinceLast).toBe(8.5);
    });

    it('déclenche le pontage fiscal automatique du carburant engin consommé', async () => {
      const mockBridge = { bridgeEngineHoursFuel: jest.fn().mockResolvedValue({}) };
      const customHoursService = new EngineHoursService(mockDb as any, mockBridge as any);

      // 1. Asset check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, status: 'OPERATIONAL' }],
      });
      // 2. Site check OK
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: siteId }] });
      // 3. Pas d'ancien log
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // 4. Fuel price lookup
      mockDb.query.mockResolvedValueOnce({ rows: [{ price_per_liter_dzd: '29.01' }] });
      // 5. Insert
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'log-bridge-fuel',
            tenant_id: tenantId,
            asset_id: assetId,
            site_id: siteId,
            recorded_at: new Date().toISOString(),
            hours_value: '50',
            delta_hours_since_last: '0',
            source: EngineHourSource.MANUAL,
            fuel_consumed_liters: '80',
            fuel_cost_dzd: '2320.8',
            work_description: null,
            operator_name: null,
            is_validated: true,
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 6. Meter readings
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await customHoursService.recordEngineHours(tenantId, {
        assetId,
        siteId,
        hoursValue: 50,
        fuelConsumedLiters: 80,
      });

      expect(mockBridge.bridgeEngineHoursFuel).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          assetId,
          siteId,
          fuelConsumedLiters: 80,
        }),
      );
    });

    it('interdit toute régression du compteur horaire avec BadRequestException', async () => {
      // 1. Asset OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, status: 'IN_SERVICE' }],
      });
      // 2. Site OK
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: siteId }] });
      // 3. Dernier relevé à 1208.5 h
      mockDb.query.mockResolvedValueOnce({ rows: [{ hours_value: '1208.5' }] });

      // Tentative frauduleuse ou erronée de saisir 1150 h
      await expect(
        engineHoursService.recordEngineHours(tenantId, {
          assetId,
          siteId,
          hoursValue: 1150,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Checklists de Transfert & Création Automatique d’Ordre de Travail', () => {
    it('génère automatiquement un Work Order prioritaire si l’engin nécessite réparation', async () => {
      // 1. Asset OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, code: 'ENG-03', name: 'Pelle Sur Chenille 330D', status: 'IN_SERVICE' }],
      });
      // 2. Destination site OK
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: destSiteId, name: 'Chantier Hassi Messaoud' }] });
      // 3. Work Order créé automatiquement
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'wo-auto-generated-01' }] });
      // 4. Insert checklist RETURNING
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'chk-01',
            tenant_id: tenantId,
            asset_id: assetId,
            from_site_id: siteId,
            to_site_id: destSiteId,
            transfer_date: new Date().toISOString(),
            transferred_by: 'Chef de Parc Nord',
            received_by: null,
            meter_hours_departure: '3450.0',
            meter_hours_arrival: null,
            general_state: 'REQUIRES_REPAIR',
            accessories_checked: { godet: true, brise_roche: false },
            photos_urls: ['https://s3.local/photo1.webp'],
            signature_departure_svg: '<svg>sign</svg>',
            signature_arrival_svg: null,
            requires_immediate_work_order: true,
            generated_work_order_id: 'wo-auto-generated-01',
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 5. Update previous assignment status to TRANSFERRED
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const res = await transferService.createDepartureChecklist(tenantId, {
        assetId,
        fromSiteId: siteId,
        toSiteId: destSiteId,
        transferredBy: 'Chef de Parc Nord',
        meterHoursDeparture: 3450,
        generalState: 'REQUIRES_REPAIR',
        accessoriesChecked: { godet: true, brise_roche: false },
        requiresImmediateWorkOrder: true,
      });

      expect(res.requiresImmediateWorkOrder).toBe(true);
      expect(res.generatedWorkOrderId).toBe('wo-auto-generated-01');
      expect(res.meterHoursDeparture).toBe(3450);
    });

    it('interdit un compteur d’arrivée inférieur au compteur de départ', async () => {
      // 1. Checklist existante avec départ à 3450 h
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'chk-01',
            tenant_id: tenantId,
            asset_id: assetId,
            to_site_id: destSiteId,
            meter_hours_departure: '3450.0',
          },
        ],
      });

      // Tentative de saisie d'arrivée à 3400 h
      await expect(
        transferService.completeArrivalChecklist(tenantId, 'chk-01', {
          receivedBy: 'Chef Sud',
          meterHoursArrival: 3400,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Rentabilité Financière de Chantier (DZD)', () => {
    it('calcule la marge brute et le bilan direct du chantier', async () => {
      // 1. Chantier avec CA = 2 500 000 DZD
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: siteId,
            code: 'CH-RN1',
            name: 'Chantier RN1',
            wilaya_code: 47,
            start_date: '2026-10-01',
            actual_end_date: '2026-10-31',
            total_revenue_dzd: '2500000',
          },
        ],
      });
      // 2. Affectations internes : 1 engin à 30 000 DA/j pendant 30 j = 900 000 DZD
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: assetId,
            internal_daily_rate_dzd: '30000',
            start_date: '2026-10-01',
            actual_end_date: '2026-10-31',
          },
        ],
      });
      // 3. Consommation carburant : 150 000 DZD
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            asset_id: assetId,
            asset_code: 'ENG-01',
            total_hours: '180',
            total_fuel: '5170',
            total_cost: '150000',
          },
        ],
      });
      // 4. Maintenance OTs : 120 000 DZD
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: '120000' }],
      });

      const prof = await profitabilityService.getSiteProfitability(tenantId, siteId);

      expect(prof.siteCode).toBe('CH-RN1');
      expect(prof.billedRevenueDzd).toBe(2500000);
      expect(prof.internalAssetBillingDzd).toBe(900000);
      expect(prof.fuelCostDzd).toBe(150000);
      expect(prof.maintenanceCostDzd).toBe(120000);
      expect(prof.totalDirectCostDzd).toBe(1170000);
      expect(prof.grossMarginDzd).toBe(1330000); // 2 500 000 - 1 170 000
      expect(prof.grossMarginPct).toBeCloseTo(53.2, 1);
    });
  });

  describe('5. Situations de Travaux & Pontage Fiscal', () => {
    it('enregistre une situation de travaux et invoque bridgeSiteSituation', async () => {
      const mockBridge = {
        bridgeSiteSituation: jest.fn().mockResolvedValue({
          fiscalDocument: { id: 'doc-sit-01' },
          fiscalEvent: { id: 'evt-sit-01' },
          updatedSite: { id: siteId, totalRevenueDzd: 15000000 },
        }),
      };
      const customSiteService = new SiteWorkspaceService(mockDb as any, mockBridge as any);

      const result = await customSiteService.recordSiteSituation(tenantId, {
        siteId,
        situationNumber: 'SIT-2026-01',
        amountHtDzd: 5000000,
        vatRatePct: 19.0,
      });

      expect(mockBridge.bridgeSiteSituation).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          siteId,
          situationNumber: 'SIT-2026-01',
          amountHtDzd: 5000000,
        }),
      );
      expect(result.updatedSite.totalRevenueDzd).toBe(15000000);
    });

    it('refuse une situation de travaux sans numéro ou avec un montant nul/négatif', async () => {
      await expect(
        siteService.recordSiteSituation(tenantId, {
          siteId,
          situationNumber: '',
          amountHtDzd: 100000,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        siteService.recordSiteSituation(tenantId, {
          siteId,
          situationNumber: 'SIT-02',
          amountHtDzd: -50,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
