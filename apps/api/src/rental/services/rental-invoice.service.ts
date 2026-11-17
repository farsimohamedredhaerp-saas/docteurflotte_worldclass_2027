import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EngineDecimal } from '@docteurflotte/decision-engine';
import { OperationalFiscalBridgeService } from '../../fiscal-compliance/services/operational-fiscal-bridge.service';
import {
  AssetRentalInvoice,
  RentalContractStatus,
  ALGERIA_FISCAL_RATES,
} from '@docteurflotte/contracts';

interface InvoiceRow {
  id: string;
  tenant_id: string;
  invoice_number: string;
  contract_id: string;
  asset_id: string;
  customer_name: string;
  customer_nif: string | null;
  base_days_billed: number;
  base_rental_ht_dzd: string | number;
  extra_km_or_hours_billed: string | number;
  extra_units_amount_dzd: string | number;
  fuel_penalty_amount_dzd: string | number;
  damages_deductions_dzd: string | number;
  total_ht_dzd: string | number;
  vat_rate_pct: string | number;
  vat_amount_dzd: string | number;
  stamp_duty_dzd: string | number;
  total_ttc_dzd: string | number;
  is_paid: boolean;
  issued_at: string;
  paid_at: string | null;
  created_at: string;
}

@Injectable()
export class RentalInvoiceService {
  private readonly logger = new Logger(RentalInvoiceService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly fiscalBridge?: OperationalFiscalBridgeService,
  ) {}

  async generateRentalInvoice(
    tenantId: string,
    contractId: string,
    options?: {
      damagesDeductionsDzd?: number;
      applyStampDuty?: boolean;
    },
  ): Promise<AssetRentalInvoice> {
    // 1. Récupération du contrat
    const contractRes = await this.db.query<{
      id: string;
      asset_id: string;
      customer_name: string;
      customer_nif: string | null;
      start_date: string;
      end_date: string;
      actual_return_date: string | null;
      daily_rate_dzd: string | number;
      included_km_or_hours_per_day: string | number;
      extra_unit_rate_dzd: string | number;
      fuel_refill_rate_per_liter_dzd: string | number;
      deposit_amount_dzd: string | number;
      status: RentalContractStatus;
    }>(
      `SELECT * FROM asset_rental_contracts WHERE tenant_id = $1 AND id = $2`,
      [tenantId, contractId],
    );

    if (contractRes.rows.length === 0) {
      throw new NotFoundException(`Contrat introuvable: ${contractId}`);
    }
    const contract = contractRes.rows[0];

    // Vérification état des lieux Check-Out et Check-In
    const checkOutRes = await this.db.query<{ meter_value: string | number; fuel_level_quarter: number }>(
      `SELECT meter_value, fuel_level_quarter FROM asset_rental_check_ins_outs
       WHERE tenant_id = $1 AND contract_id = $2 AND type = 'CHECK_OUT'`,
      [tenantId, contractId],
    );
    if (checkOutRes.rows.length === 0) {
      throw new BadRequestException('Impossible de facturer : aucun état des lieux de départ (Check-Out) enregistré.');
    }

    const checkInRes = await this.db.query<{ meter_value: string | number; fuel_level_quarter: number }>(
      `SELECT meter_value, fuel_level_quarter FROM asset_rental_check_ins_outs
       WHERE tenant_id = $1 AND contract_id = $2 AND type = 'CHECK_IN'`,
      [tenantId, contractId],
    );
    if (checkInRes.rows.length === 0) {
      throw new BadRequestException('Impossible de facturer : aucun état des lieux de retour (Check-In) enregistré.');
    }

    const checkOut = checkOutRes.rows[0];
    const checkIn = checkInRes.rows[0];

    // 2. Calcul du nombre de jours
    const start = new Date(contract.start_date).getTime();
    const returnDate = contract.actual_return_date ? new Date(contract.actual_return_date).getTime() : new Date(contract.end_date).getTime();
    const baseDays = Math.max(1, Math.round((returnDate - start) / (1000 * 60 * 60 * 24)));

    // 3. Calculs HT par EngineDecimal
    const dailyRate = new EngineDecimal(contract.daily_rate_dzd);
    const baseRentalHt = dailyRate.mul(baseDays);

    // Dépassements kilométriques / horaires
    const totalUnits = Number(checkIn.meter_value) - Number(checkOut.meter_value);
    const allowedUnits = baseDays * Number(contract.included_km_or_hours_per_day);
    const extraUnits = Math.max(0, totalUnits - allowedUnits);
    const extraRate = new EngineDecimal(contract.extra_unit_rate_dzd);
    const extraUnitsAmount = extraRate.mul(extraUnits);

    // Pénalités carburant
    let fuelPenaltyAmount = new EngineDecimal(0);
    const fuelDiffQuarters = checkOut.fuel_level_quarter - checkIn.fuel_level_quarter;
    if (fuelDiffQuarters > 0) {
      // 1 quart = ~20 litres standard réservoir utilitaire
      const missingLiters = fuelDiffQuarters * 20;
      const refillRate = new EngineDecimal(contract.fuel_refill_rate_per_liter_dzd);
      fuelPenaltyAmount = refillRate.mul(missingLiters);
    }

    const damagesDeductions = new EngineDecimal(options?.damagesDeductionsDzd || 0);

    const totalHt = baseRentalHt
      .add(extraUnitsAmount)
      .add(fuelPenaltyAmount)
      .add(damagesDeductions);

    // 4. Calcul de la TVA (résolue dynamiquement depuis ALGERIA_FISCAL_RATES)
    const vatRate = ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE;
    const vatRatePct = vatRate * 100;
    const vatAmount = totalHt.mul(vatRate);

    // 5. Timbre fiscal (Art. 55 LF 2025 : 1% si espèces, min 50 DA, max 10 000 DA)
    let stampDuty = new EngineDecimal(0);
    if (options?.applyStampDuty) {
      const stampCalc = totalHt.add(vatAmount).mul(0.01);
      const stampVal = Math.min(10000, Math.max(50, Math.round(stampCalc.toNumber())));
      stampDuty = new EngineDecimal(stampVal);
    }

    const totalTtc = totalHt.add(vatAmount).add(stampDuty);

    // 6. Numéro séquentiel de facture
    const invCountRes = await this.db.query<{ count: string | number }>(
      `SELECT COUNT(*)::int as count FROM asset_rental_invoices WHERE tenant_id = $1`,
      [tenantId],
    );
    const seq = Number(invCountRes.rows[0].count) + 1;
    const invoiceNumber = `FAC-LOC-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    // 7. Insertion facture
    const insertSql = `
      INSERT INTO asset_rental_invoices (
        tenant_id, invoice_number, contract_id, asset_id, customer_name, customer_nif,
        base_days_billed, base_rental_ht_dzd, extra_km_or_hours_billed, extra_units_amount_dzd,
        fuel_penalty_amount_dzd, damages_deductions_dzd, total_ht_dzd, vat_rate_pct,
        vat_amount_dzd, stamp_duty_dzd, total_ttc_dzd, is_paid
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, FALSE)
      RETURNING *
    `;
    const params = [
      tenantId,
      invoiceNumber,
      contractId,
      contract.asset_id,
      contract.customer_name,
      contract.customer_nif,
      baseDays,
      baseRentalHt.toNumber(),
      extraUnits,
      extraUnitsAmount.toNumber(),
      fuelPenaltyAmount.toNumber(),
      damagesDeductions.toNumber(),
      totalHt.toNumber(),
      vatRatePct,
      vatAmount.toNumber(),
      stampDuty.toNumber(),
      totalTtc.toNumber(),
    ];

    const res = await this.db.query<InvoiceRow>(insertSql, params);

    // 8. Mise à jour du contrat
    await this.db.query(
      `UPDATE asset_rental_contracts SET status = 'INVOICED', updated_at = NOW() WHERE id = $1`,
      [contractId],
    );

    const invoice = this.mapRow(res.rows[0]);

    // 9. Pontage comptable et fiscal automatique (TVA collectée 445700, 706000, 411000)
    if (this.fiscalBridge) {
      try {
        await this.fiscalBridge.bridgeRentalInvoice(tenantId, invoice);
      } catch (err) {
        this.logger.warn(
          `[RentalInvoice] Erreur de pontage fiscal automatique pour la facture ${invoice.invoiceNumber}: ${(err as Error).message}`,
        );
      }
    }

    return invoice;
  }

  async listInvoices(tenantId: string, contractId?: string): Promise<AssetRentalInvoice[]> {
    let sql = `SELECT * FROM asset_rental_invoices WHERE tenant_id = $1`;
    const params: string[] = [tenantId];
    if (contractId) {
      sql += ` AND contract_id = $2`;
      params.push(contractId);
    }
    sql += ` ORDER BY issued_at DESC`;
    const res = await this.db.query<InvoiceRow>(sql, params);
    return res.rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: InvoiceRow): AssetRentalInvoice {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      invoiceNumber: r.invoice_number,
      contractId: r.contract_id,
      assetId: r.asset_id,
      customerName: r.customer_name,
      customerNif: r.customer_nif || undefined,
      baseDaysBilled: Number(r.base_days_billed),
      baseRentalHtDzd: Number(r.base_rental_ht_dzd),
      extraKmOrHoursBilled: Number(r.extra_km_or_hours_billed),
      extraUnitsAmountDzd: Number(r.extra_units_amount_dzd),
      fuelPenaltyAmountDzd: Number(r.fuel_penalty_amount_dzd),
      damagesDeductionsDzd: Number(r.damages_deductions_dzd),
      totalHtDzd: Number(r.total_ht_dzd),
      vatRatePct: Number(r.vat_rate_pct),
      vatAmountDzd: Number(r.vat_amount_dzd),
      stampDutyDzd: Number(r.stamp_duty_dzd),
      totalTtcDzd: Number(r.total_ttc_dzd),
      isPaid: r.is_paid,
      issuedAt: r.issued_at,
      paidAt: r.paid_at || undefined,
      createdAt: r.created_at,
    };
  }
}

