import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { AdminTenantsService } from './services/admin-tenants.service';
import { AdminDecisionEngineService } from './services/admin-decision-engine.service';
import { AdminFiscalService } from './services/admin-fiscal.service';
import { UserRole } from '@docteurflotte/contracts';

describe('AdminControlPlane (Unit Tests)', () => {
  describe('PlatformAdminGuard', () => {
    let guard: PlatformAdminGuard;

    beforeEach(() => {
      guard = new PlatformAdminGuard();
    });

    it('devrait autoriser un utilisateur ayant le rôle PLATFORM_ADMIN', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'u-1', email: 'admin@farsi.dz', role: UserRole.PLATFORM_ADMIN },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('devrait interdire un utilisateur ayant le rôle TENANT_ADMIN', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'u-2', email: 'manager@fleet.dz', role: UserRole.TENANT_ADMIN },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('devrait rejeter une requête sans utilisateur authentifié', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });

  describe('AdminTenantsService', () => {
    it('devrait agréger les KPIs de vue d ensemble', async () => {
      const mockPool = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('platform_tenants')) {
            return Promise.resolve({ rows: [{ total: '5', active: '4', trial: '1' }] });
          }
          if (sql.includes('assets')) {
            return Promise.resolve({ rows: [{ total: '42' }] });
          }
          if (sql.includes('users')) {
            return Promise.resolve({ rows: [{ total: '12' }] });
          }
          if (sql.includes('platform_config_publications')) {
            return Promise.resolve({ rows: [{ version: 'v2.0-PROD-BASELINE', scope_key: 'ALGERIA_CORE_DECISION' }] });
          }
          if (sql.includes('platform_fiscal_fuel_prices')) {
            return Promise.resolve({ rows: [{ total: '3' }] });
          }
          if (sql.includes('platform_telematics_gateways')) {
            return Promise.resolve({ rows: [{ total: '2' }] });
          }
          if (sql.includes('platform_audit_logs')) {
            return Promise.resolve({ rows: [{ action: 'ACTIVATE_CONFIG', created_at: new Date().toISOString() }] });
          }
          return Promise.resolve({ rows: [] });
        }),
      };

      const mockDbService = { getPool: () => mockPool } as any;
      const service = new AdminTenantsService(mockDbService);

      const kpis = await service.getPlatformOverview();
      expect(kpis.totalTenants).toBe(5);
      expect(kpis.activeTenants).toBe(4);
      expect(kpis.totalVehicles).toBe(42);
      expect(kpis.activeDecisionConfigVersion).toBe('v2.0-PROD-BASELINE');
      expect(kpis.healthyGatewaysCount).toBe(2);
    });
  });

  describe('AdminFiscalService', () => {
    it('devrait formater les prix de carburants', async () => {
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              id: 'f-1',
              fuel_type: 'DIESEL',
              label_fr: 'Gasoil',
              price_per_liter_dzd: '31.00',
              tva_rate_pct: '19.00',
              is_tva_deductible: true,
              official_reference_joradp: 'Décret 2026',
              effective_date: '2026-01-01',
              is_active: true,
              author_email: 'admin@farsi.dz',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      };

      const mockDbService = { getPool: () => mockPool } as any;
      const service = new AdminFiscalService(mockDbService);

      const fuels = await service.getFuelPrices();
      expect(fuels.length).toBe(1);
      expect(fuels[0].price_per_liter_dzd).toBe(31.0);
      expect(fuels[0].tva_rate_pct).toBe(19.0);
      expect(fuels[0].is_active).toBe(true);
    });
  });

  describe('AdminDecisionEngineService (Lifecycle & Simulation)', () => {
    it('devrait calculer un hash canonique SHA-256 déterministe de 64 caractères', () => {
      const mockDbService = { getPool: () => ({}) } as any;
      const service = new AdminDecisionEngineService(mockDbService);

      const hash = service.computeCanonicalHash({
        version: 'v2.1-TEST',
        scope_key: 'ALGERIA_CORE_DECISION',
        arrhenius_activation_energy: 6500,
        arrhenius_ref_temp_c: 90,
        arrhenius_idle_degradation_factor: 1.8,
        battery_crit_voltage_mv_12v: 9600,
        battery_crit_voltage_mv_24v: 19200,
        battery_temp_comp_factor: 15,
        cooling_ewma_alpha: 0.15,
        cooling_overheat_threshold_c: 11,
        cooling_clogging_threshold_c: 7.5,
        cooling_thermostat_stuck_threshold_c: -12,
        brake_wear_energy_per_mm_mj: 25,
        brake_min_thickness_mm: 3,
        dpf_soot_limit_grams: 45,
        dpf_backpressure_limit_mbar: 300,
        fuel_siphon_stop_liters: 15,
        fuel_cusum_slack_liters: 0.6,
        fuel_cusum_alarm_ratio: 0.05,
        inaction_risk_multiplier: 3.5,
      });

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64);
    });

    it('devrait simuler le comportement physique sur les véhicules étalons', () => {
      const mockDbService = { getPool: () => ({}) } as any;
      const service = new AdminDecisionEngineService(mockDbService);

      const sim = service.simulateConfig({
        arrhenius_activation_energy: 6500,
        arrhenius_ref_temp_c: 90,
        arrhenius_idle_degradation_factor: 1.8,
        battery_crit_voltage_mv_12v: 9600,
        battery_crit_voltage_mv_24v: 19200,
        battery_temp_comp_factor: 15,
        cooling_ewma_alpha: 0.15,
        cooling_overheat_threshold_c: 11,
        cooling_clogging_threshold_c: 7.5,
        brake_wear_energy_per_mm_mj: 25,
        brake_min_thickness_mm: 3,
        dpf_soot_limit_grams: 45,
        fuel_siphon_stop_liters: 15,
        fuel_cusum_slack_liters: 0.6,
        inaction_risk_multiplier: 3.5,
      });

      expect(sim.benchmarks.length).toBe(3);

      // Kangoo 1.5 dCi Arrhenius test (1h à 110°C correspond à ~254.5 km)
      const kangoo = sim.benchmarks.find((b) => b.vehicleModel.includes('Kangoo'));
      expect(kangoo).toBeDefined();
      expect(kangoo!.arrheniusOilEquivalentKmAt110C).toBeCloseTo(254.5, 0);
      expect(kangoo!.batteryCrankingDropAtMinus5C_mV).toBe(9150); // 9600 - 30*15

      // MAN TGX 24V test
      const man = sim.benchmarks.find((b) => b.vehicleModel.includes('MAN TGX'));
      expect(man).toBeDefined();
      expect(man!.projectedInactionRiskDzd).toBe(157500); // 45000 * 3.5
    });

    it('devrait refuser la mise à jour d une configuration non-DRAFT (Immuabilité)', async () => {
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rowCount: 1,
          rows: [
            {
              id: 'cfg-approved',
              version: 'v2.0-PROD',
              status: 'APPROVED',
              author_email: 'architecte@docteurflotte.dz',
            },
          ],
        }),
      };

      const mockDbService = { getPool: () => mockPool } as any;
      const service = new AdminDecisionEngineService(mockDbService);

      await expect(
        service.updateDraftConfig(
          'cfg-approved',
          { arrhenius_activation_energy: 7000 },
          'admin@farsi.dz'
        )
      ).rejects.toThrow('Seules les versions DRAFT peuvent être modifiées');
    });
  });

  describe('AdminFiscalService (Dynamic Tariffs & ENACTA)', () => {
    it('devrait retourner les règles ENACTA avec les tarifs HT/TTC et provision TCO', async () => {
      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              id: 'enacta-rule-1',
              asset_category: 'HEAVY_TRUCK',
              label_fr: 'Poids Lourds',
              periodicity_months: '6',
              first_inspection_months: '6',
              tariff_base_ht_dzd: '2600.00',
              tva_rate_pct: '19.00',
              tariff_total_ttc_dzd: '3094.00',
              internal_tco_provision_dzd: '9000.00',
              official_decree_ref: 'Décret exécutif 03-223',
            },
          ],
        }),
      };

      const mockDbService = { getPool: () => mockPool } as any;
      const service = new AdminFiscalService(mockDbService);

      const rules = await service.getEnactaRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].tariff_base_ht_dzd).toBe(2600);
      expect(rules[0].tva_rate_pct).toBe(19);
      expect(rules[0].tariff_total_ttc_dzd).toBe(3094);
      expect(rules[0].internal_tco_provision_dzd).toBe(9000);
      expect(rules[0].periodicity_months).toBe(6);
    });

    it('devrait mettre à jour un barème ENACTA et inscrire une piste d audit immuable', async () => {
      const mockPool = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rowCount: 1,
            rows: [
              {
                id: 'enacta-rule-1',
                asset_category: 'HEAVY_TRUCK',
                label_fr: 'Poids Lourds',
                tariff_base_ht_dzd: '3000.00',
                tva_rate_pct: '19.00',
                tariff_total_ttc_dzd: '3570.00',
                internal_tco_provision_dzd: '10000.00',
                periodicity_months: '6',
                first_inspection_months: '6',
              },
            ],
          })
          .mockResolvedValueOnce({ rowCount: 1 }), // Audit log
      };

      const mockDbService = { getPool: () => mockPool } as any;
      const service = new AdminFiscalService(mockDbService);

      const updated = await service.updateEnactaRule(
        'enacta-rule-1',
        {
          tariff_base_ht_dzd: 3000,
          tva_rate_pct: 19,
          internal_tco_provision_dzd: 10000,
          justification: 'Ajustement barème ENACTA 2026',
        },
        'superadmin@docteurflotte.dz'
      );

      expect(updated.tariff_base_ht_dzd).toBe(3000);
      expect(updated.tariff_total_ttc_dzd).toBe(3570);
      expect(updated.internal_tco_provision_dzd).toBe(10000);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });
});
