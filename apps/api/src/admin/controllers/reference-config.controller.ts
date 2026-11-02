import { Controller, Get, Req } from '@nestjs/common';
import { AdminFiscalService } from '../services/admin-fiscal.service';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedRequest } from '../../auth/auth.guard';

export interface FuelPriceItem {
  fuelType: string;
  labelFr: string;
  pricePerLiterDzd: number;
  tvaRatePct: number;
}

export interface SystemReferenceTariffsResponse {
  fuelPrices: {
    diesel: number;
    gasolineSansPlomb: number;
    sirghazGpl: number;
    allActive: FuelPriceItem[];
  };
  fiscalRates: {
    standardVatPercent: number;
    reducedVatPercent: number;
    cashStampDutyPercent: number;
    minStampDutyDzd: number;
    maxStampDutyDzd: number;
  };
  currency: string;
  tenantEconomicRates?: {
    hourlyLaborRate: number;
    approvalExpenseThreshold: number;
    inactionRiskMultiplier: number;
    referenceFuelPricePerLiter: number;
  };
}

@Controller('api/v1/config')
export class ReferenceConfigController {
  constructor(
    private readonly fiscalService: AdminFiscalService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('reference-tariffs')
  async getReferenceTariffs(@Req() req: AuthenticatedRequest): Promise<SystemReferenceTariffsResponse> {
    const rawFuels = await this.fiscalService.getFuelPrices();
    const activeFuels = rawFuels.filter((f) => f.is_active);

    const findPrice = (typeKeywords: string[], defaultFallback: number): number => {
      const match = activeFuels.find((f) =>
        typeKeywords.some((kw) => f.fuel_type.toUpperCase().includes(kw)),
      );
      return match ? Number(match.price_per_liter_dzd) : defaultFallback;
    };

    const dieselPrice = findPrice(['DIESEL', 'GASOIL'], 31.0);
    const essencePrice = findPrice(['ESSENCE', 'SANS_PLOMB'], 47.0);
    const gplPrice = findPrice(['GPL', 'SIRGHAZ'], 12.0);

    const allActive: FuelPriceItem[] = activeFuels.map((f) => {
      let label = f.fuel_type;
      if (f.fuel_type.includes('DIESEL')) label = 'Gazole / Diesel Routier';
      else if (f.fuel_type.includes('SANS_PLOMB')) label = 'Essence Sans Plomb';
      else if (f.fuel_type.includes('SIRGHAZ') || f.fuel_type.includes('GPL')) label = 'GPL / Sirghaz';
      else if (f.fuel_type.includes('SUPER')) label = 'Essence Super';

      return {
        fuelType: f.fuel_type,
        labelFr: label,
        pricePerLiterDzd: Number(f.price_per_liter_dzd),
        tvaRatePct: Number(f.tva_rate_pct),
      };
    });

    let tenantRates: SystemReferenceTariffsResponse['tenantEconomicRates'];
    const headerTenant = req.headers?.['x-tenant-id'];
    const tenantId =
      (typeof headerTenant === 'string' ? headerTenant : undefined) ||
      req.user?.tenantId ||
      req.tenantId;

    if (tenantId) {
      try {
        const pool = this.databaseService.getPool();
        if (pool) {
          const res = await pool.query(
            'SELECT economic_rates FROM tenant_settings WHERE tenant_id = $1',
            [tenantId],
          );
          if (res.rows.length > 0 && res.rows[0].economic_rates) {
            const er = res.rows[0].economic_rates;
            tenantRates = {
              hourlyLaborRate: Number(er.hourlyLaborRate ?? 1500),
              approvalExpenseThreshold: Number(er.approvalExpenseThreshold ?? 50000),
              inactionRiskMultiplier: Number(er.inactionRiskMultiplier ?? 2.5),
              referenceFuelPricePerLiter: Number(er.referenceFuelPricePerLiter ?? dieselPrice),
            };
          }
        }
      } catch {
        // Fallback transparent
      }
    }

    return {
      fuelPrices: {
        diesel: dieselPrice,
        gasolineSansPlomb: essencePrice,
        sirghazGpl: gplPrice,
        allActive,
      },
      fiscalRates: {
        standardVatPercent: 19.0,
        reducedVatPercent: 9.0,
        cashStampDutyPercent: 1.0,
        minStampDutyDzd: 10.0,
        maxStampDutyDzd: 10000.0,
      },
      currency: 'DZD',
      tenantEconomicRates: tenantRates,
    };
  }
}
