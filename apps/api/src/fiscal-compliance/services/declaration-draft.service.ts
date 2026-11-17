import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { createHash } from 'crypto';
import {
  FiscalDeclarationDraft,
  FiscalDeclarationStatus,
  FiscalAuditSeal,
  Tableau9Scf,
  ALGERIA_FISCAL_RATES,
} from '@docteurflotte/contracts';

export interface FiscalDeclarationDraftDbRow {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  period_year: number;
  period_month: number;
  declaration_type: string;
  total_taxable_revenue_dzd: string | number;
  total_vat_collected_dzd: string | number;
  total_vat_deductible_dzd: string | number;
  net_vat_payable_dzd: string | number;
  tap_amount_dzd: string | number;
  stamp_duty_total_dzd: string | number;
  total_due_dzd: string | number;
  status: string;
  breakdown_by_asset: Record<string, any>;
  missing_receipts_count: number;
  fiscal_audit_seal_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

@Injectable()
export class DeclarationDraftService {
  private readonly logger = new Logger(DeclarationDraftService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Obtient tous les brouillons de déclaration du tenant.
   */
  async getDrafts(tenantId: string, periodYear?: number): Promise<FiscalDeclarationDraft[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = 'SELECT * FROM fiscal_declaration_drafts WHERE tenant_id = $1';
      const params: (string | number)[] = [tenantId];

      if (periodYear) {
        params.push(periodYear);
        query += ` AND period_year = $${params.length}`;
      }

      query += ' ORDER BY period_year DESC, period_month DESC';
      const res = await client.query<FiscalDeclarationDraftDbRow>(query, params);
      return res.rows.map((r) => this.mapDraft(r));
    });
  }

  /**
   * Obtient un brouillon par son ID.
   */
  async getDraftById(tenantId: string, id: string): Promise<FiscalDeclarationDraft> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query<FiscalDeclarationDraftDbRow>(
        'SELECT * FROM fiscal_declaration_drafts WHERE id = $1 AND tenant_id = $2',
        [id, tenantId],
      );

      if (res.rowCount === 0) {
        throw new NotFoundException('Brouillon de déclaration fiscale introuvable.');
      }

      return this.mapDraft(res.rows[0]);
    });
  }

  /**
   * Génère ou actualise le brouillon de déclaration mensuelle G50
   * en consolidant les événements fiscaux qualifiés de la flotte.
   */
  async generateMonthlyDraft(
    tenantId: string,
    periodYear: number,
    periodMonth: number,
  ): Promise<FiscalDeclarationDraft> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Agrégation des événements fiscaux de la période
      const eventsRes = await client.query(
        `SELECT fe.*, a.code as asset_code
         FROM fiscal_events fe
         JOIN assets a ON a.id = fe.asset_id
         WHERE fe.tenant_id = $1 AND fe.period_year = $2 AND fe.period_month = $3`,
        [tenantId, periodYear, periodMonth],
      );

      let totalTaxableRevenue = 0;
      let totalVatCollected = 0;
      let totalVatDeductible = 0;
      let tapAmount = 0;
      let stampDutyTotal = 0;

      const breakdownByAsset: Record<string, {
        assetCode: string;
        vatDeductibleDzd: number;
        vatExcludedDzd: number;
        totalExpenseDzd: number;
        itemsCount: number;
      }> = {};

      for (const row of eventsRes.rows) {
        const assetId = row.asset_id;
        const assetCode = row.asset_code;
        const taxAmount = Number(row.tax_amount_dzd);
        const taxableBase = Number(row.taxable_base_dzd);

        if (!breakdownByAsset[assetId]) {
          breakdownByAsset[assetId] = {
            assetCode,
            vatDeductibleDzd: 0,
            vatExcludedDzd: 0,
            totalExpenseDzd: 0,
            itemsCount: 0,
          };
        }

        breakdownByAsset[assetId].totalExpenseDzd += taxableBase;
        breakdownByAsset[assetId].itemsCount += 1;

        if (row.event_type === 'TVA_DEDUCTION') {
          totalVatDeductible += taxAmount;
          breakdownByAsset[assetId].vatDeductibleDzd += taxAmount;
        } else if (row.event_type === 'TVA_COLLECTED') {
          // Règle 7 : Fait générateur hybride (Débit vs Encaissement - Art. 13 & 14 Code TCA)
          // La TVA n'est exigible au titre de la période que si le fait générateur est au Débit (immédiat)
          // OU s'il est à l'Encaissement et que la pièce est effectivement réglée/encaissée.
          const isTaxExigible = row.vat_tax_point !== 'ENCAISSEMENT' || row.is_settled === true;
          if (isTaxExigible) {
            totalVatCollected += taxAmount;
            totalTaxableRevenue += taxableBase;
          }
        } else if (row.event_type === 'TVA_NON_DEDUCTIBLE') {
          breakdownByAsset[assetId].vatExcludedDzd += taxAmount;
        }
      }

      // 2. Vérification des pièces justificatives non validées (pièces manquantes)
      const missingRes = await client.query(
        `SELECT COUNT(*) as count FROM fiscal_documents
         WHERE tenant_id = $1
           AND EXTRACT(YEAR FROM document_date) = $2
           AND EXTRACT(MONTH FROM document_date) = $3
           AND verification_status IN ('PENDING_AUDIT', 'SUSPICIOUS')`,
        [tenantId, periodYear, periodMonth],
      );
      const missingCount = Number(missingRes.rows[0]?.count || 0);

      // Calcul net TVA à payer ou crédit
      const netVatPayable = Math.max(0, totalVatCollected - totalVatDeductible);
      const totalDue = netVatPayable + tapAmount + stampDutyTotal;
      const status = missingCount > 0 ? FiscalDeclarationStatus.DRAFT : FiscalDeclarationStatus.VALIDATED;

      // 3. Sauvegarde ou mise à jour du brouillon
      const res = await client.query<FiscalDeclarationDraftDbRow>(
        `INSERT INTO fiscal_declaration_drafts (
          tenant_id, period_year, period_month, declaration_type,
          total_taxable_revenue_dzd, total_vat_collected_dzd, total_vat_deductible_dzd,
          net_vat_payable_dzd, tap_amount_dzd, stamp_duty_total_dzd, total_due_dzd,
          status, breakdown_by_asset, missing_receipts_count, updated_at
        ) VALUES ($1, $2, $3, 'G50_MONTHLY', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (tenant_id, period_year, period_month, declaration_type) DO UPDATE SET
          total_taxable_revenue_dzd = EXCLUDED.total_taxable_revenue_dzd,
          total_vat_collected_dzd = EXCLUDED.total_vat_collected_dzd,
          total_vat_deductible_dzd = EXCLUDED.total_vat_deductible_dzd,
          net_vat_payable_dzd = EXCLUDED.net_vat_payable_dzd,
          tap_amount_dzd = EXCLUDED.tap_amount_dzd,
          stamp_duty_total_dzd = EXCLUDED.stamp_duty_total_dzd,
          total_due_dzd = EXCLUDED.total_due_dzd,
          status = CASE WHEN fiscal_declaration_drafts.status = 'SEALED' THEN 'SEALED' ELSE EXCLUDED.status END,
          breakdown_by_asset = EXCLUDED.breakdown_by_asset,
          missing_receipts_count = EXCLUDED.missing_receipts_count,
          updated_at = NOW()
        RETURNING *`,
        [
          tenantId,
          periodYear,
          periodMonth,
          totalTaxableRevenue,
          totalVatCollected,
          totalVatDeductible,
          netVatPayable,
          tapAmount,
          stampDutyTotal,
          totalDue,
          status,
          JSON.stringify(breakdownByAsset),
          missingCount,
        ],
      );

      this.logger.log(`[DeclarationDraft] Brouillon G50 ${periodYear}-${periodMonth} généré (TVA Déductible: ${totalVatDeductible} DZD, Net dû: ${netVatPayable} DZD)`);
      return this.mapDraft(res.rows[0]);
    });
  }

  /**
   * Scelle définitivement une déclaration avec scellé cryptographique SHA-256.
   * Interdit le scellement s'il reste des pièces manquantes ou suspectes.
   */
  async sealDeclaration(
    tenantId: string,
    declarationId: string,
    userId: string,
  ): Promise<{ draft: FiscalDeclarationDraft; seal: FiscalAuditSeal }> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const draftRes = await client.query<FiscalDeclarationDraftDbRow>(
        'SELECT * FROM fiscal_declaration_drafts WHERE id = $1 AND tenant_id = $2',
        [declarationId, tenantId],
      );

      if (draftRes.rowCount === 0) {
        throw new NotFoundException('Brouillon de déclaration introuvable.');
      }

      const draft = draftRes.rows[0];
      if (draft.status === FiscalDeclarationStatus.SEALED) {
        throw new BadRequestException('Cette déclaration fiscale est déjà scellée et immuable.');
      }

      if (Number(draft.missing_receipts_count) > 0) {
        throw new BadRequestException(
          `Scellement impossible : il reste ${draft.missing_receipts_count} pièce(s) manquante(s) ou suspecte(s) à régulariser.`,
        );
      }

      // Construction du payload canonique
      const canonicalPayload = JSON.stringify({
        tenantId,
        declarationId: draft.id,
        declarationType: draft.declaration_type,
        periodYear: draft.period_year,
        periodMonth: draft.period_month,
        totalTaxableRevenue: Number(draft.total_taxable_revenue_dzd),
        totalVatCollected: Number(draft.total_vat_collected_dzd),
        totalVatDeductible: Number(draft.total_vat_deductible_dzd),
        netVatPayable: Number(draft.net_vat_payable_dzd),
        totalDue: Number(draft.total_due_dzd),
        breakdownByAsset: draft.breakdown_by_asset,
        sealedAt: new Date().toISOString(),
        sealedByUserId: userId,
      });

      const sha256Hash = createHash('sha256').update(canonicalPayload).digest('hex');
      const merkleLeaf = createHash('sha256').update(`${sha256Hash}:${canonicalPayload}`).digest('hex');

      // Création du scellé immuable
      const sealRes = await client.query(
        `INSERT INTO fiscal_audit_seals (
          tenant_id, declaration_id, target_type, target_id, sealed_by_user_id,
          canonical_payload, sha256_hash, merkle_leaf
        ) VALUES ($1, $2, 'DECLARATION_G50', $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          tenantId,
          draft.id,
          `${draft.period_year}-${draft.period_month}`,
          userId,
          canonicalPayload,
          sha256Hash,
          merkleLeaf,
        ],
      );

      const sealId = sealRes.rows[0].id;

      // Mise à jour du statut du brouillon en SEALED
      const updatedDraftRes = await client.query<FiscalDeclarationDraftDbRow>(
        `UPDATE fiscal_declaration_drafts
         SET status = 'SEALED', fiscal_audit_seal_id = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [sealId, draft.id],
      );

      const seal: FiscalAuditSeal = {
        id: sealId,
        tenantId,
        declarationId: draft.id,
        sealedByUserId: userId,
        sealedAt: new Date(sealRes.rows[0].sealed_at).toISOString(),
        canonicalPayload,
        sha256Hash,
        merkleLeaf,
      };

      this.logger.log(`[DeclarationDraft] Déclaration G50 ${draft.period_year}-${draft.period_month} SCELLÉE par ${userId} (SHA-256: ${sha256Hash})`);

      return {
        draft: this.mapDraft(updatedDraftRes.rows[0]),
        seal,
      };
    });
  }

  /**
   * Règle 8 : Génération automatique du Tableau 9 de la liasse fiscale SCF
   * Détermination du résultat fiscal imposable à l'IBS (Lignes 1 à 12 du Tableau 9 DGI).
   */
  async generateTableau9(tenantId: string, fiscalYear: number): Promise<Tableau9Scf> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Profil fiscal et activités CNRC du tenant
      const profileRes = await client.query(
        `SELECT * FROM tenant_fiscal_profile WHERE tenant_id = $1`,
        [tenantId],
      );
      const profile = profileRes.rows[0];

      const cnrcRes = await client.query(
        `SELECT * FROM tenant_cnrc_activities WHERE tenant_id = $1`,
        [tenantId],
      );

      // Résolution du taux d'IBS applicable (Art. 150 CIDTA)
      let appliedIbsRatePct: number = ALGERIA_FISCAL_RATES.CORPORATE_TAX_RATE_COMMERCE_SERVICES_PERCENT; // Commerce / Services / Transport par défaut
      const activities = cnrcRes.rows;
      if (activities.some((a) => a.fiscal_segment === 'PRODUCTION')) {
        appliedIbsRatePct = ALGERIA_FISCAL_RATES.CORPORATE_TAX_RATE_PRODUCTION_PERCENT;
      } else if (activities.some((a) => a.fiscal_segment === 'BTPH_TOURISME')) {
        appliedIbsRatePct = ALGERIA_FISCAL_RATES.CORPORATE_TAX_RATE_BTPH_PERCENT;
      }

      // 2. Récupération des événements de réintégration de l'exercice
      const eventsRes = await client.query(
        `SELECT fe.*, a.code as asset_code, a.category as asset_category, a.physics_state
         FROM fiscal_events fe
         JOIN assets a ON a.id = fe.asset_id
         WHERE fe.tenant_id = $1 AND fe.period_year = $2`,
        [tenantId, fiscalYear],
      );

      let penaltiesAndFinesDzd = 0;
      let cashPaymentsOverCeilingDzd = 0;
      let nonDeductibleTvaDzd = 0;
      let excessDepreciationVpDzd = 0;
      let otherReintegrationsDzd = 0;

      for (const ev of eventsRes.rows) {
        const amount = Number(ev.taxable_base_dzd || ev.tax_amount_dzd || 0);
        if (ev.reintegration_type === 'AMENDE_PENALITE_ART_169' || ev.event_type === 'NON_DEDUCTIBLE_PENALTY') {
          penaltiesAndFinesDzd += amount;
        } else if (ev.reintegration_type === 'CASH_PAYMENT_EXCESS_ART_30') {
          cashPaymentsOverCeilingDzd += amount;
        } else if (ev.reintegration_type === 'EXCESS_DEPRECIATION_VP_ART_141_2') {
          excessDepreciationVpDzd += Number(ev.tax_amount_dzd);
        } else if (ev.event_type === 'TVA_NON_DEDUCTIBLE') {
          nonDeductibleTvaDzd += Number(ev.tax_amount_dzd);
        } else if (ev.event_type === 'IBS_TAX_REINTEGRATION') {
          otherReintegrationsDzd += amount;
        }
      }

      // 3. Calcul de l'amortissement excédentaire sur les véhicules de tourisme (Art. 141-2 CIDTA)
      // Plafond d'amortissement fiscal déductible résolu depuis ALGERIA_FISCAL_RATES
      const vpFiscalCeilingDzd = ALGERIA_FISCAL_RATES.PASSENGER_VEHICLE_AMORTIZATION_CEILING_DZD;
      const vpAmortizationDurationYears = ALGERIA_FISCAL_RATES.PASSENGER_VEHICLE_AMORTIZATION_DURATION_YEARS;
      const vpAssetsRes = await client.query(
        `SELECT id, code, category, physics_state FROM assets
         WHERE tenant_id = $1 AND category = 'ROAD_VEHICLE'`,
        [tenantId],
      );

      for (const asset of vpAssetsRes.rows) {
        const isCoreTool = Boolean(
          asset.physics_state?.is_core_business_tool ||
          asset.physics_state?.fiscal_usage_purpose === 'EXPLOITATION_PRINCIPALE'
        );
        if (!isCoreTool) {
          const acqCost = Number(asset.physics_state?.acquisition_cost_dzd || 0);
          if (acqCost > vpFiscalCeilingDzd) {
            const annualAccountingDepr = acqCost / vpAmortizationDurationYears;
            const annualFiscalCeiling = vpFiscalCeilingDzd / vpAmortizationDurationYears;
            const excessAnnual = annualAccountingDepr - annualFiscalCeiling;
            excessDepreciationVpDzd += excessAnnual;
          }
        }
      }

      // 4. Agrégation des revenus imposables de l'exercice (Résultat comptable)
      const draftsRes = await client.query(
        `SELECT SUM(total_taxable_revenue_dzd) as total_rev
         FROM fiscal_declaration_drafts
         WHERE tenant_id = $1 AND period_year = $2`,
        [tenantId, fiscalYear],
      );
      const totalRevenueYear = Number(draftsRes.rows[0]?.total_rev || 0);

      // Résultat comptable estimé (base paramétrée dans ALGERIA_FISCAL_RATES)
      const accountingProfitRatio = ALGERIA_FISCAL_RATES.ACCOUNTING_PROFIT_RATIO_FALLBACK;
      const accountingNetProfitDzd = Math.max(0, totalRevenueYear * accountingProfitRatio);

      const totalReintegrationsDzd =
        penaltiesAndFinesDzd +
        excessDepreciationVpDzd +
        cashPaymentsOverCeilingDzd +
        nonDeductibleTvaDzd +
        otherReintegrationsDzd;

      const totalDeductionsDzd = 0; // Déductions extracomptables
      const taxableProfitIbsDzd = Math.max(0, accountingNetProfitDzd + totalReintegrationsDzd - totalDeductionsDzd);
      const grossIbsDueDzd = Math.round((taxableProfitIbsDzd * appliedIbsRatePct) / 100);

      const canonicalPayload = JSON.stringify({
        tenantId,
        fiscalYear,
        accountingNetProfitDzd,
        totalReintegrationsDzd,
        taxableProfitIbsDzd,
        appliedIbsRatePct,
        grossIbsDueDzd,
      });
      const sha256Seal = createHash('sha256').update(canonicalPayload).digest('hex');

      return {
        tenantId,
        fiscalYear,
        legalName: profile?.legal_name || 'Entreprise Algérienne',
        nif: profile?.nif || '000000000000000',
        taxRegime: profile?.tax_regime || 'REEL_NORMAL',
        accountingNetProfitDzd,
        reintegrations: {
          penaltiesAndFinesDzd,
          excessDepreciationVpDzd,
          cashPaymentsOverCeilingDzd,
          nonDeductibleTvaDzd,
          otherReintegrationsDzd,
          totalReintegrationsDzd,
        },
        deductions: {
          taxExemptionsDzd: 0,
          otherDeductionsDzd: 0,
          totalDeductionsDzd,
        },
        taxableProfitIbsDzd,
        appliedIbsRatePct,
        grossIbsDueDzd,
        sha256Seal,
        generatedAt: new Date().toISOString(),
      };
    });
  }

  private mapDraft(row: FiscalDeclarationDraftDbRow): FiscalDeclarationDraft {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      periodYear: Number(row.period_year),
      periodMonth: Number(row.period_month),
      declarationType: row.declaration_type,
      totalTaxableRevenueDzd: Number(row.total_taxable_revenue_dzd),
      totalVatCollectedDzd: Number(row.total_vat_collected_dzd),
      totalVatDeductibleDzd: Number(row.total_vat_deductible_dzd),
      netVatPayableDzd: Number(row.net_vat_payable_dzd),
      tapAmountDzd: Number(row.tap_amount_dzd),
      stampDutyTotalDzd: Number(row.stamp_duty_total_dzd),
      totalDueDzd: Number(row.total_due_dzd),
      status: row.status as FiscalDeclarationStatus,
      breakdownByAsset: row.breakdown_by_asset || {},
      missingReceiptsCount: Number(row.missing_receipts_count),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}

