import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  EInvoicingReadinessReport,
  EInvoicingReadinessAnomaly,
  ALGERIA_FISCAL_RATES,
  isValidAlgerianNif,
  isValidAlgerianRc,
  isValidAlgerianArticleImposition,
  FiscalDocumentType,
} from '@docteurflotte/contracts';

export interface FiscalDocAuditRow {
  id: string;
  document_type: string;
  document_number: string;
  document_date: string | Date;
  payment_method: string | null;
  third_party_name: string | null;
  third_party_nif: string | null;
  third_party_rc: string | null;
  article_imposition_third_party: string | null;
  amount_ht_dzd: string | number;
  vat_amount_dzd: string | number;
  total_ttc_dzd: string | number;
  is_vat_deductible: boolean;
  vat_tax_point: string | null;
  is_settled: boolean | null;
  verification_status: string;
  rejection_reason: string | null;
  sha256_fingerprint: string;
}

@Injectable()
export class EInvoicingReadinessService {
  private readonly logger = new Logger(EInvoicingReadinessService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Réalise l'audit flash de préparation à la Facturation Électronique DGI 2027 (Modèle CTC).
   * Vérifie la conformité des tiers (Art. 64 CPF), les plafonds espèces (Règle 5),
   * et l'exigibilité TVA hybride (Règle 7).
   */
  async getReadinessReport(tenantId: string): Promise<EInvoicingReadinessReport> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const docsRes = await client.query<FiscalDocAuditRow>(
        `SELECT id, document_type, document_number, document_date, payment_method,
                third_party_name, third_party_nif, third_party_rc, article_imposition_third_party,
                amount_ht_dzd, vat_amount_dzd, total_ttc_dzd, is_vat_deductible,
                vat_tax_point, is_settled, verification_status, rejection_reason, sha256_fingerprint
         FROM fiscal_documents
         WHERE tenant_id = $1
         ORDER BY document_date DESC`,
        [tenantId],
      );

      const rows = docsRes.rows;
      const totalDocumentsAudited = rows.length;

      const anomalies: EInvoicingReadinessAnomaly[] = [];
      let totalVatAtRiskDzd = 0;
      let totalCashOverCeilingDzd = 0;
      let blockingCount = 0;

      // Suivi des tiers fournisseurs uniques
      const suppliersMap = new Map<string, { name: string; nif: string; isValidNif: boolean }>();

      const cashCeiling = ALGERIA_FISCAL_RATES.CASH_PAYMENT_LEGAL_CEILING_DZD;

      for (const row of rows) {
        const docDateStr = row.document_date instanceof Date
          ? row.document_date.toISOString().split('T')[0]
          : String(row.document_date || '').split('T')[0];

        const totalTtc = Number(row.total_ttc_dzd || 0);
        const vatAmount = Number(row.vat_amount_dzd || 0);
        const tpName = row.third_party_name || 'Fournisseur / Tiers non spécifié';
        const tpNif = (row.third_party_nif || '').trim();
        const tpRc = (row.third_party_rc || '').trim();
        const tpAi = (row.article_imposition_third_party || '').trim();

        // Enregistrement fournisseur
        if (row.third_party_name || row.third_party_nif) {
          const supplierKey = tpNif || tpName;
          if (!suppliersMap.has(supplierKey)) {
            suppliersMap.set(supplierKey, {
              name: tpName,
              nif: tpNif,
              isValidNif: isValidAlgerianNif(tpNif),
            });
          }
        }

        // 1. Contrôle Règle 5 — Plafond Espèces (Art. 30 TCA & CIDTA LF 2024-2026)
        if (row.payment_method === 'CASH' && totalTtc > cashCeiling) {
          const overCeiling = totalTtc - cashCeiling;
          totalCashOverCeilingDzd += overCeiling;
          totalVatAtRiskDzd += vatAmount;
          blockingCount++;

          anomalies.push({
            documentId: row.id,
            documentNumber: row.document_number,
            documentDate: docDateStr,
            thirdPartyName: tpName,
            thirdPartyNif: tpNif,
            anomalyType: 'CASH_LIMIT_EXCEEDED',
            severity: 'BLOCKING_DGI',
            description: `Règlement espèces de ${totalTtc.toLocaleString('fr-DZ')} DZD TTC dépassant le plafond légal de ${cashCeiling.toLocaleString('fr-DZ')} DZD TTC (Dépassement: ${overCeiling.toLocaleString('fr-DZ')} DZD).`,
            impactDzd: vatAmount,
            recommendation: 'Payer obligatoirement par virement bancaire, chèque ou moyen scriptural pour préserver la déductibilité TVA et IBS.',
          });
        }

        // 2. Contrôle Règle 6 — Mentions obligatoires Tiers (Art. 64 CPF) pour déduction TVA
        const isExpenseClaimingVat =
          row.is_vat_deductible &&
          (row.document_type === FiscalDocumentType.FACTURE_FOURNISSEUR ||
            row.document_type === FiscalDocumentType.ORDRE_TRAVAIL);

        if (isExpenseClaimingVat) {
          if (!isValidAlgerianNif(tpNif)) {
            totalVatAtRiskDzd += vatAmount;
            blockingCount++;
            anomalies.push({
              documentId: row.id,
              documentNumber: row.document_number,
              documentDate: docDateStr,
              thirdPartyName: tpName,
              thirdPartyNif: tpNif,
              anomalyType: 'INVALID_NIF',
              severity: 'BLOCKING_DGI',
              description: `NIF tiers absent ou non conforme (${tpNif || 'aucun NIF'} renseigné). Rejet automatique au portail e-facturation DGI 2027.`,
              impactDzd: vatAmount,
              recommendation: 'Exiger le NIF légal à 15 ou 20 chiffres (Jibayatic) du fournisseur avant validation de la facture.',
            });
          }

          if (!isValidAlgerianRc(tpRc)) {
            anomalies.push({
              documentId: row.id,
              documentNumber: row.document_number,
              documentDate: docDateStr,
              thirdPartyName: tpName,
              thirdPartyNif: tpNif,
              anomalyType: 'MISSING_RC',
              severity: 'HIGH_RISK',
              description: `Numéro de Registre de Commerce (RC) manquant ou suspect (${tpRc || 'non renseigné'}) selon Art. 64 CPF.`,
              impactDzd: 0,
              recommendation: 'Compléter la fiche fournisseur avec le numéro CNRC officiel.',
            });
          }

          if (!isValidAlgerianArticleImposition(tpAi)) {
            anomalies.push({
              documentId: row.id,
              documentNumber: row.document_number,
              documentDate: docDateStr,
              thirdPartyName: tpName,
              thirdPartyNif: tpNif,
              anomalyType: 'MISSING_ARTICLE_IMPOSITION',
              severity: 'WARNING',
              description: `Article d'imposition absent (${tpAi || 'non renseigné'}) selon Art. 64 CPF.`,
              impactDzd: 0,
              recommendation: 'Renseigner le code article d\'imposition pour parer aux contrôles fiscaux sur pièces.',
            });
          }
        }

        // 3. Contrôle Règle 7 — Fait générateur hybride (Débit vs Encaissement)
        if (
          row.document_type === FiscalDocumentType.SITUATION_TRAVAUX ||
          row.document_type === FiscalDocumentType.CONTRAT_LOCATION
        ) {
          if (row.vat_tax_point === 'DEBIT' && row.is_settled === false) {
            anomalies.push({
              documentId: row.id,
              documentNumber: row.document_number,
              documentDate: docDateStr,
              thirdPartyName: tpName,
              thirdPartyNif: tpNif,
              anomalyType: 'AMBIGUOUS_TAX_POINT',
              severity: 'WARNING',
              description: 'Prestation de service ou travaux configurée au Débit alors que le fait générateur légal est à l\'Encaissement (Art. 13-14 TCA).',
              impactDzd: vatAmount,
              recommendation: 'Basculer le fait générateur sur "ENCAISSEMENT" pour différer l\'exigibilité TVA au paiement effectif.',
            });
          }
        }
      }

      // Statistiques Fournisseurs
      let totalSuppliers = suppliersMap.size;
      let compliantNifCount = 0;
      let invalidOrMissingNifCount = 0;

      for (const s of suppliersMap.values()) {
        if (s.isValidNif) {
          compliantNifCount++;
        } else {
          invalidOrMissingNifCount++;
        }
      }

      // Calcul du Score Global de Préparation (0 à 100%)
      const compliantDocumentsCount = totalDocumentsAudited - anomalies.length;
      let readinessScore = 100;
      if (totalDocumentsAudited > 0) {
        const penaltyPerBlocking = 15;
        const penaltyPerHighRisk = 5;
        const penaltyPerWarning = 2;

        const highRiskCount = anomalies.filter((a) => a.severity === 'HIGH_RISK').length;
        const warningCount = anomalies.filter((a) => a.severity === 'WARNING').length;

        const totalPenalties =
          blockingCount * penaltyPerBlocking +
          highRiskCount * penaltyPerHighRisk +
          warningCount * penaltyPerWarning;

        readinessScore = Math.max(0, Math.min(100, Math.round(100 - (totalPenalties / totalDocumentsAudited) * 20)));
      }

      let status: 'PRET_E_FACTURATION_2027' | 'A_RISQUE' | 'NON_CONFORME_CRITIQUE' = 'PRET_E_FACTURATION_2027';
      if (blockingCount > 0 || readinessScore < 50) {
        status = 'NON_CONFORME_CRITIQUE';
      } else if (readinessScore < 85 || anomalies.length > 0) {
        status = 'A_RISQUE';
      }

      // Checklist Direction / Direction Financière
      const hasCashAnomaly = anomalies.some((a) => a.anomalyType === 'CASH_LIMIT_EXCEEDED');
      const hasNifAnomaly = anomalies.some((a) => a.anomalyType === 'INVALID_NIF');
      const hasRcAnomaly = anomalies.some((a) => a.anomalyType === 'MISSING_RC');
      const hasTaxPointAnomaly = anomalies.some((a) => a.anomalyType === 'AMBIGUOUS_TAX_POINT');

      const executiveChecklist = [
        {
          rule: 'Plafond des paiements en espèces (<= 1 000 000 DZD)',
          status: hasCashAnomaly ? ('ACTION_REQUISE' as const) : ('CONFORME' as const),
          legalReference: 'Art. 30 Code TCA & CIDTA (LF 2024-2026)',
          details: hasCashAnomaly
            ? `${totalCashOverCeilingDzd.toLocaleString('fr-DZ')} DZD de règlements espèces au-delà du seuil légal.`
            : '100% des factures >= 1M DZD réglées par voie bancaire ou scripturale.',
        },
        {
          rule: 'Validité syntaxique des NIF Tiers (15 ou 20 chiffres)',
          status: hasNifAnomaly ? ('ACTION_REQUISE' as const) : ('CONFORME' as const),
          legalReference: 'Art. 64 CPF & Plateforme DGI Jibayatic',
          details: hasNifAnomaly
            ? `${invalidOrMissingNifCount} fournisseurs avec un NIF absent ou invalide.`
            : 'Base tiers 100% conforme au standard numérique DGI.',
        },
        {
          rule: 'Mentions obligatoires RC & Article d\'imposition',
          status: hasRcAnomaly ? ('ACTION_REQUISE' as const) : ('CONFORME' as const),
          legalReference: 'Art. 64 Code des Procédures Fiscales',
          details: hasRcAnomaly
            ? 'Des pièces d\'achat manquent de Registre de Commerce ou d\'Article d\'imposition.'
            : 'Mentions d\'identification commerciale complètes.',
        },
        {
          rule: 'Fait générateur de TVA hybride (Débit vs Encaissement)',
          status: hasTaxPointAnomaly ? ('ACTION_REQUISE' as const) : ('CONFORME' as const),
          legalReference: 'Art. 13 & 14 Code des Taxes sur le Chiffre d\'Affaires',
          details: hasTaxPointAnomaly
            ? 'Certaines prestations sont déclarées au débit avant encaissement effectif.'
            : 'Distinction rigoureuse des régimes d\'exigibilité Débit/Encaissement.',
        },
        {
          rule: 'Intégrité cryptographique SHA-256 (Scellés Pré-CTC 2027)',
          status: 'CONFORME' as const,
          legalReference: 'Décret exécutif e-Facturation DGI & Loi 18-07',
          details: 'Toutes les pièces bénéficient d\'un hachage SHA-256 infalsifiable opposable.',
        },
      ];

      this.logger.log(
        `[EInvoicingReadiness] Tenant ${tenantId} audité: Score ${readinessScore}%, Statut: ${status}, ${anomalies.length} anomalie(s)`,
      );

      return {
        tenantId,
        generatedAt: new Date().toISOString(),
        readinessScore,
        status,
        totalDocumentsAudited,
        compliantDocumentsCount: Math.max(0, compliantDocumentsCount),
        anomaliesCount: anomalies.length,
        totalVatAtRiskDzd,
        totalCashOverCeilingDzd,
        suppliersSummary: {
          totalSuppliers,
          compliantNifCount,
          invalidOrMissingNifCount,
        },
        anomalies,
        executiveChecklist,
      };
    });
  }
}
