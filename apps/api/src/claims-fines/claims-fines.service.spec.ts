import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { AccidentClaimService } from './services/accident-claim.service';
import { TrafficFineService } from './services/traffic-fine.service';
import { InsuranceCaseService } from './services/insurance-case.service';
import { RiskScoreService } from './services/risk-score.service';
import { ClaimSeverity, ClaimStatus } from '@docteurflotte/contracts';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('Module E — ClaimsFinesService (Sinistres, Amendes & Assurances)', () => {
  let accidentService: AccidentClaimService;
  let fineService: TrafficFineService;
  let insuranceService: InsuranceCaseService;
  let riskService: RiskScoreService;
  let db: { query: jest.Mock };

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const assetId = '22222222-2222-2222-2222-222222222222';
  const driverId = '33333333-3333-3333-3333-333333333333';
  const claimId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    db = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccidentClaimService,
        TrafficFineService,
        InsuranceCaseService,
        RiskScoreService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    accidentService = module.get<AccidentClaimService>(AccidentClaimService);
    fineService = module.get<TrafficFineService>(TrafficFineService);
    insuranceService = module.get<InsuranceCaseService>(InsuranceCaseService);
    riskService = module.get<RiskScoreService>(RiskScoreService);
  });

  describe('AccidentClaimService', () => {
    it('doit créer un sinistre et déclencher un Work Order de réparation pour sévérité SEVERE', async () => {
      // 1. Asset check
      db.query.mockResolvedValueOnce({
        rows: [{ id: assetId, code: 'AST-001', name: 'Shacman X3000', tenant_id: tenantId, status: 'OPERATIONAL' }],
      });
      // 2. Count for seq
      db.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });
      // 3. Work order creation
      db.query.mockResolvedValueOnce({ rows: [{ id: 'wo-claim-999' }] });
      // 4. Insert claim
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: claimId,
            tenant_id: tenantId,
            claim_number: 'SIN-2026-0001',
            asset_id: assetId,
            driver_id: driverId,
            driver_name: 'Karim Hadj',
            accident_date: '2026-11-16T08:00:00Z',
            wilaya_code: 16,
            location_details: 'Autoroute Est-Ouest, sortie Dar El Beïda',
            severity: ClaimSeverity.SEVERE,
            third_party_involved: true,
            third_party_details: {},
            police_report_ref: 'PV-POLICE-2026-44',
            estimated_damage_dzd: '450000.00',
            photos_urls: [],
            circumstances_description: 'Collision arrière par temps de pluie',
            status: ClaimStatus.REPORTED,
            work_order_id_generated: 'wo-claim-999',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const claim = await accidentService.createClaim(tenantId, {
        assetId,
        driverId,
        driverName: 'Karim Hadj',
        accidentDate: '2026-11-16T08:00:00Z',
        wilayaCode: 16,
        locationDetails: 'Autoroute Est-Ouest, sortie Dar El Beïda',
        severity: ClaimSeverity.SEVERE,
        thirdPartyInvolved: true,
        policeReportRef: 'PV-POLICE-2026-44',
        estimatedDamageDzd: 450000,
        circumstancesDescription: 'Collision arrière par temps de pluie',
      });

      expect(claim.claimNumber).toBe('SIN-2026-0001');
      expect(claim.workOrderIdGenerated).toBe('wo-claim-999');
      expect(claim.estimatedDamageDzd).toBe(450000);
      expect(claim.severity).toBe(ClaimSeverity.SEVERE);
    });

    it('doit rejeter la création si le code wilaya est invalide (> 58)', async () => {
      await expect(
        accidentService.createClaim(tenantId, {
          assetId,
          accidentDate: '2026-11-16T08:00:00Z',
          wilayaCode: 99,
          locationDetails: 'Inconnue',
          severity: ClaimSeverity.MINOR,
          circumstancesDescription: 'Choc léger',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('TrafficFineService', () => {
    it('doit imputer automatiquement l’amende au chauffeur actif sur la mission à l’instant t', async () => {
      const fineNotice = 'PV-DGSN-2026-888';
      const infractionDate = '2026-11-16T10:15:00Z';

      // 1. Asset check
      db.query.mockResolvedValueOnce({
        rows: [{ id: assetId, code: 'AST-001', name: 'Shacman X3000', tenant_id: tenantId }],
      });
      // 2. Auto-attribution via logistics_consignment_notes
      db.query.mockResolvedValueOnce({
        rows: [
          {
            driver_id: driverId,
            driver_name: 'Mourad Belkacem',
          },
        ],
      });
      // 3. Insert fine
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'fine-1',
            tenant_id: tenantId,
            fine_notice_number: fineNotice,
            asset_id: assetId,
            infraction_date: infractionDate,
            wilaya_code: 30, // Ouargla
            location_highway_code: 'RN3',
            infraction_nature: 'Excès de vitesse (> 80 km/h)',
            amount_dzd: '10000.00',
            due_date: '2026-12-16',
            is_paid: false,
            paid_at: null,
            attributed_driver_id: driverId,
            attributed_driver_name: 'Mourad Belkacem',
            attribution_source: 'MISSION_ORDER',
            is_contested: false,
            contest_reason: null,
            created_at: new Date().toISOString(),
          },
        ],
      });

      const fine = await fineService.recordFine(tenantId, {
        fineNoticeNumber: fineNotice,
        assetId,
        infractionDate,
        wilayaCode: 30,
        locationHighwayCode: 'RN3',
        infractionNature: 'Excès de vitesse (> 80 km/h)',
        amountDzd: 10000,
        dueDate: '2026-12-16',
      });

      expect(fine.attributedDriverId).toBe(driverId);
      expect(fine.attributedDriverName).toBe('Mourad Belkacem');
      expect(fine.attributionSource).toBe('MISSION_ORDER');
      expect(fine.amountDzd).toBe(10000);
      expect(fine.isPaid).toBe(false);
    });

    it('doit permettre de contester une amende avec motif', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'fine-1',
            tenant_id: tenantId,
            fine_notice_number: 'PV-001',
            asset_id: assetId,
            infraction_date: '2026-11-16T10:15:00Z',
            wilaya_code: 16,
            location_highway_code: 'A1',
            infraction_nature: 'Stationnement interdit',
            amount_dzd: '3000.00',
            due_date: '2026-12-16',
            is_paid: false,
            paid_at: null,
            attributed_driver_id: null,
            attributed_driver_name: null,
            attribution_source: 'MANUAL_DISPATCH',
            is_contested: true,
            contest_reason: 'Véhicule en panne avec feux de détresse et triangle',
            created_at: new Date().toISOString(),
          },
        ],
      });

      const updated = await fineService.contestFine(
        tenantId,
        'fine-1',
        'Véhicule en panne avec feux de détresse et triangle',
      );
      expect(updated.isContested).toBe(true);
      expect(updated.contestReason).toContain('feux de détresse');
    });
  });

  describe('InsuranceCaseService', () => {
    it('doit ouvrir un dossier assurance et passer le sinistre au statut INSURANCE_SUBMITTED', async () => {
      // 1. Claim parent check
      db.query.mockResolvedValueOnce({
        rows: [{ id: claimId, asset_id: assetId, status: ClaimStatus.REPORTED }],
      });
      // 2. Insert case
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'case-1',
            tenant_id: tenantId,
            claim_id: claimId,
            asset_id: assetId,
            insurance_policy_number: 'POL-SAA-2026-789',
            insurance_company: 'SAA Assurances',
            expert_name: 'Cabinet d’Expertise Alger-Centre',
            assessed_damage_dzd: '450000.00',
            deductible_dzd: '25000.00',
            approved_compensation_dzd: '0.00',
            payout_date: null,
            is_closed: false,
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 3. Update claim status
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const insCase = await insuranceService.openCase(tenantId, {
        claimId,
        insurancePolicyNumber: 'POL-SAA-2026-789',
        insuranceCompany: 'SAA Assurances',
        expertName: 'Cabinet d’Expertise Alger-Centre',
        assessedDamageDzd: 450000,
        deductibleDzd: 25000,
      });

      expect(insCase.insuranceCompany).toBe('SAA Assurances');
      expect(insCase.deductibleDzd).toBe(25000);
      expect(insCase.assessedDamageDzd).toBe(450000);
      expect(insCase.isClosed).toBe(false);
    });

    it('doit clôturer le dossier avec versement de l’indemnité et passer le sinistre à SETTLED', async () => {
      // 1. Update insurance case
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'case-1',
            tenant_id: tenantId,
            claim_id: claimId,
            asset_id: assetId,
            insurance_policy_number: 'POL-SAA-2026-789',
            insurance_company: 'SAA Assurances',
            expert_name: 'Cabinet d’Expertise Alger-Centre',
            assessed_damage_dzd: '450000.00',
            deductible_dzd: '25000.00',
            approved_compensation_dzd: '425000.00',
            payout_date: '2026-11-20',
            is_closed: true,
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 2. Update claim status to SETTLED
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const settled = await insuranceService.settleCase(tenantId, 'case-1', {
        approvedCompensationDzd: 425000,
        payoutDate: '2026-11-20',
      });

      expect(settled.isClosed).toBe(true);
      expect(settled.approvedCompensationDzd).toBe(425000);
      expect(settled.payoutDate).toBe('2026-11-20');
    });
  });

  describe('RiskScoreService', () => {
    it('doit calculer un score de risque CRITICAL si > 1 500 000 DZD de dégâts sinistres', async () => {
      // 1. Asset check
      db.query.mockResolvedValueOnce({
        rows: [{ id: assetId, code: 'AST-001', name: 'Shacman X3000' }],
      });
      // 2. Claims aggregation
      db.query.mockResolvedValueOnce({
        rows: [{ count: 2, total_damage: '1850000.00' }],
      });
      // 3. Fines aggregation
      db.query.mockResolvedValueOnce({
        rows: [{ count: 1, total_amount: '10000.00' }],
      });

      const score = await riskService.getAssetRiskScore(tenantId, assetId);

      expect(score.riskCategory).toBe('CRITICAL');
      expect(score.recommendedPremiumAdjustmentPct).toBe(40);
      expect(score.totalClaimsCostDzd).toBe(1850000);
      expect(score.claimsCountLast12m).toBe(2);
    });

    it('doit attribuer un score de risque LOW si 0 sinistre et <= 1 amende', async () => {
      // 1. Asset check
      db.query.mockResolvedValueOnce({
        rows: [{ id: assetId, code: 'AST-002', name: 'Renault C440' }],
      });
      // 2. Claims aggregation
      db.query.mockResolvedValueOnce({
        rows: [{ count: 0, total_damage: '0.00' }],
      });
      // 3. Fines aggregation
      db.query.mockResolvedValueOnce({
        rows: [{ count: 1, total_amount: '3000.00' }],
      });

      const score = await riskService.getAssetRiskScore(tenantId, assetId);

      expect(score.riskCategory).toBe('LOW');
      expect(score.recommendedPremiumAdjustmentPct).toBe(0);
    });
  });
});

