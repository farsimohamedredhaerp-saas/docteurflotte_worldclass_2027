import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RentalContractService } from './services/rental-contract.service';
import { RentalCheckInOutService } from './services/rental-check-in-out.service';
import { RentalInvoiceService } from './services/rental-invoice.service';
import { RentalDisputeService } from './services/rental-dispute.service';
import { CheckInOutType, RentalContractStatus } from '@docteurflotte/contracts';

describe('Module B — Rental (Location Flotte & Règle 0 DA au Garage)', () => {
  let contractService: RentalContractService;
  let checkInOutService: RentalCheckInOutService;
  let invoiceService: RentalInvoiceService;
  let disputeService: RentalDisputeService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const otherTenantId = '99999999-9999-9999-9999-999999999999';
  const assetId = '11111111-1111-1111-1111-111111111111';
  const contractId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const mockDb = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalContractService,
        RentalCheckInOutService,
        RentalInvoiceService,
        RentalDisputeService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    contractService = module.get<RentalContractService>(RentalContractService);
    checkInOutService = module.get<RentalCheckInOutService>(RentalCheckInOutService);
    invoiceService = module.get<RentalInvoiceService>(RentalInvoiceService);
    disputeService = module.get<RentalDisputeService>(RentalDisputeService);

    jest.clearAllMocks();
  });

  describe('1. Intégrité Asset Racine & Règle du Garage à 0 DA', () => {
    it('refuse la création sans assetId', async () => {
      await expect(
        contractService.createContract(tenantId, {
          assetId: '',
          customerName: 'SARL Transport Centre',
          customerPhoneDz: '0550123456',
          startDate: '2026-11-20',
          endDate: '2026-11-25',
          dailyRateDzd: 15000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse la location si l’actif appartient à un autre tenant', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: otherTenantId, code: 'VEH-01', status: 'OPERATIONAL' }],
      });
      await expect(
        contractService.createContract(tenantId, {
          assetId,
          customerName: 'SARL Transport Centre',
          customerPhoneDz: '0550123456',
          startDate: '2026-11-20',
          endDate: '2026-11-25',
          dailyRateDzd: 15000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuse la location si l’actif est au garage (DOWN ou MAINTENANCE_REQUIRED) — Règle 0 DA', async () => {
      // Actif immobilisé pour panne ou révision atelier
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, code: 'VEH-DOWN', status: 'DOWN' }],
      });

      await expect(
        contractService.createContract(tenantId, {
          assetId,
          customerName: 'SARL Transport Centre',
          customerPhoneDz: '0550123456',
          startDate: '2026-11-20',
          endDate: '2026-11-25',
          dailyRateDzd: 15000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée avec succès un contrat au statut RESERVED pour un actif disponible', async () => {
      // 1. Asset check OK (OPERATIONAL)
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: assetId, tenant_id: tenantId, code: 'VEH-02', status: 'OPERATIONAL' }],
      });
      // 2. Conflict check OK (aucun conflit)
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // 3. Count seq
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });
      // 4. Insert contract
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'ctr-01',
            tenant_id: tenantId,
            contract_number: 'CTR-2026-0006',
            asset_id: assetId,
            customer_name: 'SARL Logistique Oran',
            customer_nif: '001216012345678',
            customer_phone_dz: '0550987654',
            start_date: '2026-11-20',
            end_date: '2026-11-25',
            actual_return_date: null,
            daily_rate_dzd: '20000',
            included_km_or_hours_per_day: '200',
            extra_unit_rate_dzd: '50',
            fuel_refill_rate_per_liter_dzd: '45',
            deposit_amount_dzd: '100000',
            status: RentalContractStatus.RESERVED,
            notes: 'Location 5 jours sans chauffeur',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const res = await contractService.createContract(tenantId, {
        assetId,
        customerName: 'SARL Logistique Oran',
        customerNif: '001216012345678',
        customerPhoneDz: '0550987654',
        startDate: '2026-11-20',
        endDate: '2026-11-25',
        dailyRateDzd: 20000,
        depositAmountDzd: 100000,
      });

      expect(res.contractNumber).toBe('CTR-2026-0006');
      expect(res.status).toBe(RentalContractStatus.RESERVED);
      expect(res.depositAmountDzd).toBe(100000);
    });
  });

  describe('2. Check-Out & Check-In Numérique avec Scellement SHA-256', () => {
    it('enregistre le Check-Out et bascule le contrat en ACTIVE', async () => {
      // 1. Contract check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: contractId, asset_id: assetId, status: 'RESERVED', start_date: '2026-11-20' }],
      });
      // 2. Existing check-out check : none
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      // 3. Insert check-out
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'chk-out-01',
            tenant_id: tenantId,
            contract_id: contractId,
            asset_id: assetId,
            type: CheckInOutType.CHECK_OUT,
            performed_at: new Date().toISOString(),
            performed_by: 'Agent Alger',
            customer_signatory_name: 'Karim',
            meter_value: '54200.0',
            fuel_level_quarter: 4, // Plein
            cleanliness_state: 'CLEAN',
            accessories_present: { roue_secours: true },
            damages_notes: null,
            photos_urls: [],
            signature_svg: '<svg>sig</svg>',
            sha256_proof: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 4. Update contract status to ACTIVE
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const checkOut = await checkInOutService.recordCheckInOut(
        tenantId,
        {
          contractId,
          type: CheckInOutType.CHECK_OUT,
          customerSignatoryName: 'Karim',
          meterValue: 54200,
          fuelLevelQuarter: 4,
          cleanlinessState: 'CLEAN',
          signatureSvg: '<svg>sig</svg>',
        },
        'Agent Alger',
      );

      expect(checkOut.type).toBe(CheckInOutType.CHECK_OUT);
      expect(checkOut.meterValue).toBe(54200);
      expect(checkOut.sha256Proof).toBeDefined();
    });

    it('interdit un Check-In avec un compteur inférieur au Check-Out', async () => {
      // 1. Contract check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: contractId, asset_id: assetId, status: 'ACTIVE', start_date: '2026-11-20' }],
      });
      // 2. Departure check-out found at 54200 km
      mockDb.query.mockResolvedValueOnce({
        rows: [{ meter_value: '54200.0' }],
      });

      // Tentative de Check-In avec 54000 km (recul du compteur)
      await expect(
        checkInOutService.recordCheckInOut(
          tenantId,
          {
            contractId,
            type: CheckInOutType.CHECK_IN,
            customerSignatoryName: 'Karim',
            meterValue: 54000,
            fuelLevelQuarter: 3,
            cleanlinessState: 'CLEAN',
            signatureSvg: '<svg>sig</svg>',
          },
          'Agent Alger',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Facturation de Location & TVA 19% DGI', () => {
    it('calcule la facture complète avec dépassement km et pénalité carburant', async () => {
      // 1. Contrat : 5 jours à 20 000 DA/j, 200 km/j inclus (1000 km inclus), 50 DA/km supp, 40 DA/L essence
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: contractId,
            asset_id: assetId,
            customer_name: 'SARL BTP Oran',
            customer_nif: '001216000000001',
            start_date: '2026-11-10',
            end_date: '2026-11-15',
            actual_return_date: '2026-11-15',
            daily_rate_dzd: '20000',
            included_km_or_hours_per_day: '200',
            extra_unit_rate_dzd: '50',
            fuel_refill_rate_per_liter_dzd: '40',
            deposit_amount_dzd: '100000',
            status: 'RETURNED',
          },
        ],
      });
      // 2. Check-Out : 50 000 km, plein (4/4)
      mockDb.query.mockResolvedValueOnce({
        rows: [{ meter_value: '50000', fuel_level_quarter: 4 }],
      });
      // 3. Check-In : 51 200 km (1200 km parcourus -> 200 km dépassement), 3/4 réservoir (1 quart manquant = 20 L)
      mockDb.query.mockResolvedValueOnce({
        rows: [{ meter_value: '51200', fuel_level_quarter: 3 }],
      });
      // 4. Count invoices seq
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '12' }] });
      // 5. Insert invoice RETURNING
      // Base HT: 5 * 20000 = 100 000 DA
      // Dépassement: 200 km * 50 DA = 10 000 DA
      // Carburant: 20 L * 40 DA = 800 DA
      // Total HT: 110 800 DA
      // TVA 19%: 21 052 DA
      // Total TTC: 131 852 DA
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-01',
            tenant_id: tenantId,
            invoice_number: 'FAC-LOC-2026-0013',
            contract_id: contractId,
            asset_id: assetId,
            customer_name: 'SARL BTP Oran',
            customer_nif: '001216000000001',
            base_days_billed: 5,
            base_rental_ht_dzd: '100000',
            extra_km_or_hours_billed: '200',
            extra_units_amount_dzd: '10000',
            fuel_penalty_amount_dzd: '800',
            damages_deductions_dzd: '0',
            total_ht_dzd: '110800',
            vat_rate_pct: '19.00',
            vat_amount_dzd: '21052',
            stamp_duty_dzd: '0',
            total_ttc_dzd: '131852',
            is_paid: false,
            issued_at: new Date().toISOString(),
            paid_at: null,
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 6. Update contract to INVOICED
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const invoice = await invoiceService.generateRentalInvoice(tenantId, contractId);

      expect(invoice.baseRentalHtDzd).toBe(100000);
      expect(invoice.extraKmOrHoursBilled).toBe(200);
      expect(invoice.extraUnitsAmountDzd).toBe(10000);
      expect(invoice.fuelPenaltyAmountDzd).toBe(800);
      expect(invoice.totalHtDzd).toBe(110800);
      expect(invoice.vatAmountDzd).toBe(21052);
      expect(invoice.totalTtcDzd).toBe(131852);
    });

    it('déclenche le pontage fiscal automatique via OperationalFiscalBridgeService', async () => {
      const mockBridge = { bridgeRentalInvoice: jest.fn().mockResolvedValue({}) };
      const customInvoiceService = new RentalInvoiceService(mockDb as any, mockBridge as any);

      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: contractId,
            asset_id: assetId,
            customer_name: 'SARL BTP Oran',
            customer_nif: '001216000000001',
            start_date: '2026-11-10',
            end_date: '2026-11-15',
            actual_return_date: '2026-11-15',
            daily_rate_dzd: '20000',
            included_km_or_hours_per_day: '200',
            extra_unit_rate_dzd: '50',
            fuel_refill_rate_per_liter_dzd: '40',
            deposit_amount_dzd: '100000',
            status: 'RETURNED',
          },
        ],
      });
      mockDb.query.mockResolvedValueOnce({ rows: [{ meter_value: '50000', fuel_level_quarter: 4 }] });
      mockDb.query.mockResolvedValueOnce({ rows: [{ meter_value: '50000', fuel_level_quarter: 4 }] });
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'inv-bridge-01',
            tenant_id: tenantId,
            invoice_number: 'FAC-LOC-2026-0002',
            contract_id: contractId,
            asset_id: assetId,
            customer_name: 'SARL BTP Oran',
            customer_nif: '001216000000001',
            base_days_billed: 5,
            base_rental_ht_dzd: '100000',
            extra_km_or_hours_billed: '0',
            extra_units_amount_dzd: '0',
            fuel_penalty_amount_dzd: '0',
            damages_deductions_dzd: '0',
            total_ht_dzd: '100000',
            vat_rate_pct: '19.00',
            vat_amount_dzd: '19000',
            stamp_duty_dzd: '0',
            total_ttc_dzd: '119000',
            is_paid: false,
            issued_at: new Date().toISOString(),
            paid_at: null,
            created_at: new Date().toISOString(),
          },
        ],
      });
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await customInvoiceService.generateRentalInvoice(tenantId, contractId);
      expect(mockBridge.bridgeRentalInvoice).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          invoiceNumber: 'FAC-LOC-2026-0002',
          totalHtDzd: 100000,
          vatAmountDzd: 19000,
        }),
      );
    });
  });

  describe('4. Litiges & Opposabilité Juridique Algérie', () => {
    it('enregistre un litige avec scellement SHA-256 et passe le contrat à DISPUTED', async () => {
      // 1. Contract check OK
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: contractId, asset_id: assetId, deposit_amount_dzd: '100000' }],
      });
      // 2. Dispute count seq
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      // 3. Insert dispute
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'disp-01',
            tenant_id: tenantId,
            contract_id: contractId,
            asset_id: assetId,
            dispute_ref: 'LIT-LOC-2026-0003',
            claimant: 'LANDLORD',
            dispute_reason: 'Rétroviseur droit cassé et rayure profonde aile arrière',
            claimed_amount_dzd: '45000',
            retained_deposit_dzd: '45000',
            status: 'OPEN',
            sha256_legal_dossier: 'a1b2c3d4e5f6',
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 4. Update contract status to DISPUTED
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const dispute = await disputeService.createDispute(tenantId, {
        contractId,
        claimant: 'LANDLORD',
        disputeReason: 'Rétroviseur droit cassé et rayure profonde aile arrière',
        claimedAmountDzd: 45000,
        retainedDepositDzd: 45000,
      });

      expect(dispute.disputeRef).toBe('LIT-LOC-2026-0003');
      expect(dispute.claimedAmountDzd).toBe(45000);
      expect(dispute.sha256LegalDossier).toBeDefined();
    });
  });
});

