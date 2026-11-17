import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EngineRulesConfigService } from './engine-rules.service';
import { DatabaseService } from '../database/database.service';

describe('EngineRulesConfigService — Matrice de Paramétrage Déterministe Zéro Hardcode', () => {
  let service: EngineRulesConfigService;
  let mockDb: {
    query: jest.Mock;
    withTenantContext: jest.Mock;
  };

  beforeEach(async () => {
    mockDb = {
      query: jest.fn(),
      withTenantContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngineRulesConfigService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get<EngineRulesConfigService>(EngineRulesConfigService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  describe('Pilier 1 : Paramètres Fiscaux Déterministes (DGI & SCF)', () => {
    it('doit charger les paramètres de retenue à la source (RAS 30% & TVA 19% autoliquidée)', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ param_value: 0.30, is_locked_by_law: true }] }) // ras_default_rate
        .mockResolvedValueOnce({ rows: [{ param_value: 0.19, is_locked_by_law: true }] }) // vat_reverse_charge_rate
        .mockResolvedValueOnce({ rows: [{ param_value: '447200', is_locked_by_law: false }] }) // account_ras
        .mockResolvedValueOnce({ rows: [{ param_value: '445660', is_locked_by_law: false }] }) // account_vat_reciprocal_deductible
        .mockResolvedValueOnce({ rows: [{ param_value: '445760', is_locked_by_law: false }] }); // account_vat_reciprocal_due

      const params = await service.getFiscalRasParams();

      expect(params.rasDefaultRate).toBe(0.30);
      expect(params.vatReverseChargeRate).toBe(0.19);
      expect(params.accountRas).toBe('447200');
      expect(params.accountVatReciprocalDeductible).toBe('445660');
      expect(params.accountVatReciprocalDue).toBe('445760');
    });

    it('doit charger la retenue de garantie BTPH 5% et le compte d attente TVA 445780', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ param_value: 0.05, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 12, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: '411700', is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: '445780', is_locked_by_law: false }] });

      const params = await service.getGuaranteeWithholdingParams();

      expect(params.guaranteeWithholdingRate).toBe(0.05);
      expect(params.guaranteeReleaseMonths).toBe(12);
      expect(params.accountGuarantee).toBe('411700');
      expect(params.accountVatPending).toBe('445780');
    });

    it('doit charger le barème progressif de droit de timbre Art. 258 et le plafond espèces 1M DZD', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ param_value: 1_000_000, is_locked_by_law: true }] })
        .mockResolvedValueOnce({
          rows: [
            {
              param_value: [
                { min: 0, max: 300, rate: 0.0 },
                { min: 301, max: 30000, rate: 0.01 },
                { min: 30001, max: 100000, rate: 0.015 },
                { min: 100001, max: null, rate: 0.02 },
              ],
              is_locked_by_law: true,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ param_value: 5, is_locked_by_law: true }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 10_000, is_locked_by_law: true }] })
        .mockResolvedValueOnce({ rows: [{ param_value: '445790', is_locked_by_law: false }] });

      const params = await service.getStampDutyParams();

      expect(params.cashTaxDeductionCeilingDzd).toBe(1_000_000);
      expect(params.stampDutyBrackets).toHaveLength(4);
      expect(params.stampDutyMinDzd).toBe(5);
      expect(params.stampDutyMaxDzd).toBe(10_000);
    });

    it('doit charger la forclusion TVA Art. 34 (20 Décembre N+1)', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ param_value: 12, is_locked_by_law: true }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 20, is_locked_by_law: true }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 1, is_locked_by_law: true }] });

      const params = await service.getVatForfeitureParams();

      expect(params.vatForfeitureDeadlineMonth).toBe(12);
      expect(params.vatForfeitureDeadlineDay).toBe(20);
      expect(params.vatForfeitureAdditionalYears).toBe(1);
    });
  });

  describe('Pilier 2 : Paramètres Télématiques & Physiques (J1939)', () => {
    it('doit charger le coefficient de dilatation thermique du gasoil (0.00083/°C)', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ param_value: 0.00083, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 3.5, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 15.0, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 2.5, is_locked_by_law: false }] });

      const params = await service.getTelematicsCusumParams();

      expect(params.fuelThermalExpansionCoeff).toBe(0.00083);
      expect(params.cusumSensitivityKLiters).toBe(3.5);
      expect(params.cusumThresholdHLiters).toBe(15.0);
    });

    it('doit charger la double condition de protection culasse (Delta-T 30°C et eau 103°C)', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ param_value: 30.0, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 103.0, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 0.15, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 180, is_locked_by_law: false }] });

      const params = await service.getCylinderHeadParams();

      expect(params.engineTempDeltaThresholdCelsius).toBe(30.0);
      expect(params.engineCoolantCriticalCelsius).toBe(103.0);
      expect(params.engineCoolantGradientThreshold).toBe(0.15);
      expect(params.engineTempSustainSeconds).toBe(180);
    });
  });

  describe('Pilier 4 : Achats PDR & Contrôle 3-Way Matching', () => {
    it('doit charger la tolérance d arrondi de 1.00 DZD sur le 3-Way matching', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ param_value: 0.0, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: 1.00, is_locked_by_law: false }] })
        .mockResolvedValueOnce({ rows: [{ param_value: true, is_locked_by_law: false }] });

      const params = await service.getThreeWayMatchParams();

      expect(params.threeWayMatchingQtyTolerancePct).toBe(0.0);
      expect(params.threeWayMatchingRoundingToleranceDzd).toBe(1.00);
      expect(params.requireNifActiveStatusBeforePo).toBe(true);
    });

    it('doit interdire la modification d un paramètre verrouillé par la loi au niveau du tenant', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ is_locked_by_law: true }] });

      await expect(
        service.setTenantParam(
          'tenant-uuid-1',
          'FISCAL',
          'RULE_11_STAMP_DUTY',
          'cash_tax_deduction_ceiling_dzd',
          5_000_000,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
