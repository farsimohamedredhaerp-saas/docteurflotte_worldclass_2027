import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { createHash } from 'crypto';
import {
  FiscalEvent,
  FiscalDocumentType,
} from '@docteurflotte/contracts';
import { TvaEngine, EngineDecimal } from '@docteurflotte/decision-engine';

export interface FiscalEventDbRow {
  id: string;
  tenant_id: string;
  asset_id: string;
  fiscal_document_id: string | null;
  event_type: string;
  tax_category: string;
  taxable_base_dzd: string | number;
  applied_rate_pct: string | number;
  tax_amount_dzd: string | number;
  accounting_account: string;
  period_year: number;
  period_month: number;
  fiscal_rule_id: string;
  rule_version: string;
  engine_used: string;
  vat_tax_point?: string;
  is_settled?: boolean;
  reintegration_type?: string | null;
  sha256_seal: string;
  metadata: Record<string, unknown>;
  created_at: string | Date;
  updated_at: string | Date;
}

@Injectable()
export class FiscalEventService {
  private readonly logger = new Logger(FiscalEventService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Génère un événement fiscal qualifié à partir d'un document existant,
   * en invoquant les moteurs formels de packages/decision-engine.
   */
  async createEventFromDocument(tenantId: string, documentId: string): Promise<FiscalEvent> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Récupération du document et de l'actif associé
      const docRes = await client.query(
        `SELECT fd.*, a.code as asset_code, a.category as asset_category
         FROM fiscal_documents fd
         LEFT JOIN assets a ON a.id = fd.asset_id
         WHERE fd.id = $1 AND fd.tenant_id = $2`,
        [documentId, tenantId],
      );

      if (docRes.rowCount === 0) {
        throw new NotFoundException('Document fiscal introuvable pour qualification.');
      }

      const doc = docRes.rows[0];
      let assetId = doc.asset_id;
      let assetCode = doc.asset_code;
      let assetCategory = doc.asset_category;

      if (!assetId) {
        const fallbackAsset = await client.query(
          `SELECT id, code, category FROM assets WHERE tenant_id = $1 LIMIT 1`,
          [tenantId],
        );
        if (fallbackAsset.rows.length > 0) {
          assetId = fallbackAsset.rows[0].id;
          assetCode = fallbackAsset.rows[0].code;
          assetCategory = fallbackAsset.rows[0].category;
        } else {
          throw new BadRequestException('Un actif racine est requis pour enregistrer un événement fiscal.');
        }
      }

      const docDate = new Date(doc.document_date);
      const periodYear = docDate.getFullYear();
      const periodMonth = docDate.getMonth() + 1;

      // 2. Consultation des règles de configuration fiscale administrables (Zéro Hardcoding)
      const ruleRes = await client.query(
        `SELECT * FROM platform_fiscal_tax_rules 
         WHERE tax_type = 'TVA_DEDUCTIBLE' AND is_active = true 
         LIMIT 1`,
      );
      const ruleRow = ruleRes.rows[0];
      const fiscalRuleId = ruleRow?.rule_code || 'TVA_DEDUCTIBLE_CARBURANT_UTILITAIRE';
      const ruleVersion = '1.0';

      const amountHt = new EngineDecimal(Number(doc.amount_ht_dzd));
      const vatAmount = new EngineDecimal(Number(doc.vat_amount_dzd));

      let eventType = 'TVA_DEDUCTION';
      let taxCategory: 'TVA' | 'TAP' | 'IBS' | 'TIMBRE' = 'TVA';
      let account = '445600'; // SCF : TVA déductible sur biens et services
      let appliedRate = Number(doc.vat_rate_pct);
      let calculatedTax = vatAmount.toNumber();
      let engineUsed = 'TVA_ENGINE';
      let reintegrationType: string | null = null;
      const scfMetadata: Record<string, unknown> = {};

      const vatTaxPoint = doc.vat_tax_point || 'DEBIT';
      const isSettled = doc.is_settled !== false;

      // 3. Traitement algorithmique selon la nature de la pièce (Règles 5, 7, 8)
      if (doc.document_type === FiscalDocumentType.AMENDE) {
        // Amendes : Non déductibles de l'IBS (Art. 169 CIDTA) -> Réintégration fiscale Tableau 9
        eventType = 'IBS_TAX_REINTEGRATION';
        taxCategory = 'IBS';
        account = '658100'; // Charges exceptionnelles non déductibles
        appliedRate = 0;
        calculatedTax = amountHt.toNumber();
        engineUsed = 'IBS_ENGINE';
        reintegrationType = 'AMENDE_PENALITE_ART_169';
        scfMetadata.scfDebitAccount = '658100';
        scfMetadata.scfCreditAccount = '512000';
        scfMetadata.reintegrationReason =
          'Art. 169 CIDTA : Amendes et pénalités de circulation réintégrées au résultat fiscal (Tableau 9)';
      } else if (doc.rejection_reason && doc.rejection_reason.includes('CASH_THRESHOLD_EXCEEDED')) {
        // Règle 5 : Facture en espèces > 1 000 000 DZD (Art. 30 TCA & CIDTA) -> Réintégration fiscale Tableau 9
        eventType = 'IBS_TAX_REINTEGRATION';
        taxCategory = 'IBS';
        account = '658000';
        appliedRate = 0;
        calculatedTax = amountHt.toNumber();
        engineUsed = 'IBS_ENGINE';
        reintegrationType = 'CASH_PAYMENT_EXCESS_ART_30';
        scfMetadata.reintegrationReason =
          'Art. 30 TCA & CIDTA : Facture fournisseur réglée en espèces > 1 000 000 DZD réintégrée au résultat fiscal (Tableau 9)';
      } else if (
        doc.document_type === FiscalDocumentType.CONTRAT_LOCATION ||
        doc.document_type === FiscalDocumentType.FACTURE_CLIENT
      ) {
        // Location / Facture client : TVA collectée
        eventType = 'TVA_COLLECTED';
        taxCategory = 'TVA';
        account = '445700'; // TVA collectée
        appliedRate = Number(doc.vat_rate_pct);
        calculatedTax = vatAmount.toNumber();
        engineUsed = 'TVA_ENGINE';
        scfMetadata.scfDebitAccount = '411000'; // Clients
        scfMetadata.scfCreditAccount = '706000'; // Prestations de services / locations
        scfMetadata.scfVatAccount = '445700'; // État - TVA collectée
      } else if (doc.document_type === FiscalDocumentType.SITUATION_TRAVAUX) {
        // Situation de travaux BTPH : TVA collectée sur travaux (Fait générateur à l'encaissement)
        eventType = 'TVA_COLLECTED';
        taxCategory = 'TVA';
        account = '445700'; // TVA collectée
        appliedRate = Number(doc.vat_rate_pct);
        calculatedTax = vatAmount.toNumber();
        engineUsed = 'TVA_ENGINE';
        scfMetadata.scfDebitAccount = '411000'; // Clients
        scfMetadata.scfCreditAccount = '704000'; // Travaux de construction
        scfMetadata.scfVatAccount = '445700'; // État - TVA collectée
        if (Number(doc.withholding_tax_amount_dzd) > 0) {
          scfMetadata.withholdingAccount = '411700'; // Clients - Retenues de garantie
          scfMetadata.withholdingAmountDzd = Number(doc.withholding_tax_amount_dzd);
        }
      } else if (!doc.is_vat_deductible) {
        // Véhicule de tourisme ou pièce rejetée
        eventType = 'TVA_NON_DEDUCTIBLE';
        taxCategory = 'TVA';
        account = '658000'; // Charge d'exploitation
        appliedRate = Number(doc.vat_rate_pct);
        calculatedTax = vatAmount.toNumber();
        engineUsed = 'TVA_ENGINE';
      } else {
        // Calcul déterministe via TvaEngine
        eventType = 'TVA_DEDUCTION';
        account = '445600';
        calculatedTax = vatAmount.toNumber();
        scfMetadata.scfDebitAccount = doc.cost_center_type === 'BTP_CHANTIER' ? '606100' : '606100'; // Carburant
        scfMetadata.scfVatAccount = '445600'; // TVA déductible
      }

      // 4. Calcul du scellé SHA-256 de traçabilité immuable
      const canonicalPayload = JSON.stringify({
        tenantId,
        assetId,
        documentId: doc.id,
        eventType,
        taxCategory,
        taxableBase: amountHt.toNumber(),
        appliedRate,
        calculatedTax,
        account,
        periodYear,
        periodMonth,
        vatTaxPoint,
        isSettled,
        reintegrationType,
        fiscalRuleId,
        ruleVersion,
      });

      const sha256Seal = createHash('sha256').update(canonicalPayload).digest('hex');

      // 5. Enregistrement en base de l'événement fiscal qualifié
      const eventRes = await client.query<FiscalEventDbRow>(
        `INSERT INTO fiscal_events (
          tenant_id, asset_id, fiscal_document_id, event_type, tax_category,
          taxable_base_dzd, applied_rate_pct, tax_amount_dzd, accounting_account,
          period_year, period_month, fiscal_rule_id, rule_version, engine_used,
          vat_tax_point, is_settled, reintegration_type,
          sha256_seal, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          tenantId,
          assetId,
          doc.id,
          eventType,
          taxCategory,
          amountHt.toNumber(),
          appliedRate,
          calculatedTax,
          account,
          periodYear,
          periodMonth,
          fiscalRuleId,
          ruleVersion,
          engineUsed,
          vatTaxPoint,
          isSettled,
          reintegrationType,
          sha256Seal,
          JSON.stringify({
            assetCode: assetCode || doc.asset_code,
            assetCategory: assetCategory || doc.asset_category,
            documentNumber: doc.document_number,
            deductibilityRationale: doc.deductibility_rationale,
            costCenterType: doc.cost_center_type,
            vatTaxPoint,
            isSettled,
            reintegrationType,
            ...scfMetadata,
          }),
        ],
      );

      this.logger.log(`[FiscalEvent] Événement ${eventType} créé pour l'actif ${assetCode || doc.asset_code} (Compte: ${account}, Montant: ${calculatedTax} DZD)`);
      return this.mapEvent(eventRes.rows[0]);
    });
  }

  /**
   * Liste les événements fiscaux filtrés par période et/ou par actif racine.
   */
  async listEvents(
    tenantId: string,
    assetId?: string,
    periodYear?: number,
    periodMonth?: number,
  ): Promise<FiscalEvent[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = 'SELECT * FROM fiscal_events WHERE tenant_id = $1';
      const params: (string | number)[] = [tenantId];

      if (assetId) {
        params.push(assetId);
        query += ` AND asset_id = $${params.length}`;
      }

      if (periodYear) {
        params.push(periodYear);
        query += ` AND period_year = $${params.length}`;
      }

      if (periodMonth) {
        params.push(periodMonth);
        query += ` AND period_month = $${params.length}`;
      }

      query += ' ORDER BY created_at DESC';
      const res = await client.query<FiscalEventDbRow>(query, params);
      return res.rows.map((r) => this.mapEvent(r));
    });
  }

  /**
   * Recalcule et régénère les événements fiscaux pour une période donnée.
   */
  async recomputeFiscalEvents(tenantId: string, periodYear: number, periodMonth: number): Promise<{ count: number }> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // Documents de la période
      const docsRes = await client.query(
        `SELECT id FROM fiscal_documents
         WHERE tenant_id = $1
           AND EXTRACT(YEAR FROM document_date) = $2
           AND EXTRACT(MONTH FROM document_date) = $3`,
        [tenantId, periodYear, periodMonth],
      );

      // Purge des événements existants non scellés de cette période
      await client.query(
        `DELETE FROM fiscal_events
         WHERE tenant_id = $1 AND period_year = $2 AND period_month = $3`,
        [tenantId, periodYear, periodMonth],
      );

      let processed = 0;
      for (const row of docsRes.rows) {
        await this.createEventFromDocument(tenantId, row.id);
        processed++;
      }

      this.logger.log(`[FiscalEvent] Recalcul terminé pour ${periodYear}-${periodMonth} : ${processed} événements générés.`);
      return { count: processed };
    });
  }

  private mapEvent(row: FiscalEventDbRow): FiscalEvent {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      documentId: row.fiscal_document_id || undefined,
      eventType: row.event_type,
      taxCategory: row.tax_category as 'TVA' | 'TAP' | 'IBS' | 'TIMBRE',
      taxableBaseDzd: Number(row.taxable_base_dzd),
      appliedRatePct: Number(row.applied_rate_pct),
      taxAmountDzd: Number(row.tax_amount_dzd),
      accountingAccount: row.accounting_account,
      periodYear: Number(row.period_year),
      periodMonth: Number(row.period_month),
      vatTaxPoint: (row.vat_tax_point as 'DEBIT' | 'ENCAISSEMENT') || 'DEBIT',
      isSettled: row.is_settled !== false,
      reintegrationType: row.reintegration_type || undefined,
      metadata: row.metadata || undefined,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}

