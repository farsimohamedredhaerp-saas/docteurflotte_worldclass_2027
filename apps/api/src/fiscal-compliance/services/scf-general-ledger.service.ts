import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { createHash } from 'crypto';
import {
  LedgerEntry,
  ScfTrialBalance,
  ScfTrialBalanceAccount,
  DEFAULT_ALGERIA_SCF_ACCOUNTS,
  FiscalDocumentType,
} from '@docteurflotte/contracts';

interface LedgerRow {
  id: string;
  tenant_id: string;
  entry_number: string;
  journal_code: string;
  entry_date: string | Date;
  fiscal_document_id: string | null;
  asset_id: string | null;
  asset_code?: string | null;
  site_id: string | null;
  site_code?: string | null;
  cnrc_activity_id: string | null;
  cnrc_activity_code?: string | null;
  account_code: string;
  account_label: string;
  description: string;
  debit_dzd: string | number;
  credit_dzd: string | number;
  third_party_name: string | null;
  third_party_nif: string | null;
  is_validated: boolean;
  sha256_hash: string;
  previous_entry_hash: string | null;
  created_at: string | Date;
}

@Injectable()
export class ScfGeneralLedgerService {
  private readonly logger = new Logger(ScfGeneralLedgerService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Initialise le plan de comptes officiel SCF algérien s'il n'est pas encore amorcé.
   */
  async seedChartOfAccountsIfEmpty(): Promise<number> {
    return this.db.withSystemContext(async (client) => {
      let insertedCount = 0;
      for (const acc of DEFAULT_ALGERIA_SCF_ACCOUNTS) {
        const res = await client.query(
          `INSERT INTO scf_chart_of_accounts (code, label, account_class, account_category, is_tax_account, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (code) DO NOTHING`,
          [acc.code, acc.label, acc.accountClass, acc.accountCategory, acc.isTaxAccount, acc.isActive],
        );
        if (res.rowCount && res.rowCount > 0) {
          insertedCount++;
        }
      }
      if (insertedCount > 0) {
        this.logger.log(`[SCF] Plan de comptes algérien amorcé avec succès (${insertedCount} comptes créés).`);
      }
      return insertedCount;
    });
  }

  /**
   * Génère les écritures comptables du Grand Livre en partie double équilibrée
   * à partir d'une pièce justificative validée (`fiscal_documents`).
   */
  async postDocumentToLedger(tenantId: string, documentId: string): Promise<LedgerEntry[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Vérifier si des écritures existent déjà pour ce document (Idempotence)
      const existingRes = await client.query<LedgerRow>(
        `SELECT l.*, a.code as asset_code, s.code as site_code, c.code as cnrc_activity_code
         FROM accounting_ledger_entries l
         LEFT JOIN assets a ON a.id = l.asset_id
         LEFT JOIN site_workspaces s ON s.id = l.site_id
         LEFT JOIN tenant_cnrc_activities c ON c.id = l.cnrc_activity_id
         WHERE l.tenant_id = $1 AND l.fiscal_document_id = $2
         ORDER BY l.entry_number ASC, l.debit_dzd DESC`,
        [tenantId, documentId],
      );

      if (existingRes.rowCount && existingRes.rowCount > 0) {
        return existingRes.rows.map((r) => this.mapLedgerRow(r));
      }

      // 2. Charger le document fiscal source
      const docRes = await client.query(
        `SELECT fd.*, a.code as asset_code
         FROM fiscal_documents fd
         LEFT JOIN assets a ON a.id = fd.asset_id
         WHERE fd.id = $1 AND fd.tenant_id = $2`,
        [documentId, tenantId],
      );

      if (docRes.rowCount === 0) {
        throw new NotFoundException(`Document fiscal introuvable: ${documentId}`);
      }

      const doc = docRes.rows[0];
      const docDate = doc.document_date instanceof Date
        ? doc.document_date.toISOString().split('T')[0]
        : String(doc.document_date).split('T')[0];
      const docYear = new Date(docDate).getFullYear();

      const amountHt = Number(doc.amount_ht_dzd || 0);
      const vatAmount = Number(doc.vat_amount_dzd || 0);
      const stampDuty = Number(doc.stamp_duty_dzd || 0);
      const totalTtc = Number(doc.total_ttc_dzd || 0);

      const isSale =
        doc.document_type === FiscalDocumentType.FACTURE_CLIENT ||
        doc.document_type === FiscalDocumentType.SITUATION_TRAVAUX ||
        doc.document_type === FiscalDocumentType.CONTRAT_LOCATION;

      const journalCode = isSale ? 'VTE' : 'ACH';

      // 3. Récupérer le dernier hash chaîné pour garantir l'inaltérabilité (Blockchain-like ledger)
      const lastHashRes = await client.query<{ sha256_hash: string }>(
        `SELECT sha256_hash FROM accounting_ledger_entries
         WHERE tenant_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId],
      );
      let previousHash = lastHashRes.rows[0]?.sha256_hash || '0000000000000000000000000000000000000000000000000000000000000000';

      // 4. Générer le numéro de pièce séquentiel
      const seqRes = await client.query<{ count: string }>(
        `SELECT COUNT(DISTINCT fiscal_document_id) as count FROM accounting_ledger_entries
         WHERE tenant_id = $1 AND journal_code = $2 AND EXTRACT(YEAR FROM entry_date) = $3`,
        [tenantId, journalCode, docYear],
      );
      const seqIndex = Number(seqRes.rows[0]?.count || 0) + 1;
      const baseEntryNumber = `${journalCode}-${docYear}-${String(seqIndex).padStart(5, '0')}`;

      // 5. Construire les lignes Débit/Crédit (Partie double stricte)
      const linesToInsert: Array<{
        accountCode: string;
        accountLabel: string;
        description: string;
        debitDzd: number;
        creditDzd: number;
      }> = [];

      const assetPrefix = doc.asset_code ? `[${doc.asset_code}] ` : '';
      const thirdParty = doc.third_party_name || 'TIERS';

      if (isSale) {
        // Journal des Ventes (VTE)
        const withholdingAmount = Number(doc.withholding_tax_amount_dzd || 0);

        if (withholdingAmount > 0) {
          // Règle 10 : Retenue de garantie BTPH (5% Décret 15-247)
          const clientNetTtc = totalTtc - withholdingAmount;
          linesToInsert.push({
            accountCode: '411000',
            accountLabel: 'Clients (Créances d\'exploitation nettes)',
            description: `${assetPrefix}Facturation nette ${doc.document_number} — ${thirdParty}`,
            debitDzd: clientNetTtc,
            creditDzd: 0,
          });

          linesToInsert.push({
            accountCode: '411700',
            accountLabel: 'Clients - Retenues de garantie BTPH',
            description: `${assetPrefix}Retenue de garantie 5% sur ${doc.document_number}`,
            debitDzd: withholdingAmount,
            creditDzd: 0,
          });
        } else {
          // 1. Débit Client standard (411000) pour le total TTC
          linesToInsert.push({
            accountCode: '411000',
            accountLabel: 'Clients (Créances d\'exploitation)',
            description: `${assetPrefix}Facturation ${doc.document_number} — ${thirdParty}`,
            debitDzd: totalTtc,
            creditDzd: 0,
          });
        }

        // 2. Crédit Compte de Produit (704000 BTP ou 706000 Services/Fret ou 708000 Location)
        let revenueAccount = '706000';
        let revenueLabel = 'Prestations de transport de fret et logistique';
        if (doc.document_type === FiscalDocumentType.SITUATION_TRAVAUX || doc.cost_center_type === 'BTP_CHANTIER') {
          revenueAccount = '704000';
          revenueLabel = 'Travaux BTPH et situations de chantier';
        } else if (doc.document_type === FiscalDocumentType.CONTRAT_LOCATION) {
          revenueAccount = '708000';
          revenueLabel = 'Locations d\'engins et mises à disposition de matériel';
        }

        linesToInsert.push({
          accountCode: revenueAccount,
          accountLabel: revenueLabel,
          description: `${assetPrefix}Produit HT ${doc.document_number}`,
          debitDzd: 0,
          creditDzd: amountHt,
        });

        // 3. Crédit TVA Collectée (445700 ou 445780 si TVA en attente d'encaissement - Art. 14 TCA)
        if (vatAmount > 0) {
          const isPendingEncaissement = doc.vat_tax_point === 'ENCAISSEMENT' && !doc.is_settled;
          const vatAccount = isPendingEncaissement ? '445780' : '445700';
          const vatLabel = isPendingEncaissement
            ? 'État, TVA sur encaissements en attente (Art. 14 TCA)'
            : 'État, TVA collectée (Art. 21 TCA)';

          linesToInsert.push({
            accountCode: vatAccount,
            accountLabel: vatLabel,
            description: `${assetPrefix}${vatLabel} ${doc.vat_rate_pct}% sur ${doc.document_number}`,
            debitDzd: 0,
            creditDzd: vatAmount,
          });
        }

        // 4. Crédit Droit de timbre fiscal (445790) si espèces
        if (stampDuty > 0) {
          linesToInsert.push({
            accountCode: '445790',
            accountLabel: 'Droit de timbre fiscal à reverser DGI',
            description: `${assetPrefix}Timbre fiscal sur quittance espèces ${doc.document_number}`,
            debitDzd: 0,
            creditDzd: stampDuty,
          });
        }
      } else {
        // Journal des Achats (ACH)
        // Déterminer le compte de charge Classe 6
        let chargeAccount = '606100';
        let chargeLabel = 'Carburant Naftal (Gasoil, Essence, Sirghaz)';

        if (doc.document_type === FiscalDocumentType.ORDRE_TRAVAIL) {
          chargeAccount = '615000';
          chargeLabel = 'Entretien et réparations d\'atelier';
        } else if (doc.document_type === FiscalDocumentType.AMENDE) {
          chargeAccount = '658000';
          chargeLabel = 'Charges diverses, amendes et pénalités (Art. 169 CIDTA)';
        } else if (doc.cost_center_type === 'BTP_CHANTIER') {
          chargeAccount = '605000';
          chargeLabel = 'Achats de matériel, équipements et fournitures BTP';
        }

        // Si la TVA n'est pas déductible (ex: véhicule tourisme ou plafond espèces dépassé), elle est incorporée à la charge
        const effectiveChargeAmount = doc.is_vat_deductible ? amountHt : amountHt + vatAmount;

        // 1. Débit Compte de Charge (Classe 6)
        linesToInsert.push({
          accountCode: chargeAccount,
          accountLabel: chargeLabel,
          description: `${assetPrefix}Charge ${doc.document_number} — ${thirdParty}`,
          debitDzd: effectiveChargeAmount,
          creditDzd: 0,
        });

        // 2. Débit TVA Déductible (445600) si applicable
        if (doc.is_vat_deductible && vatAmount > 0) {
          linesToInsert.push({
            accountCode: '445600',
            accountLabel: 'État, TVA déductible (Art. 30 TCA)',
            description: `${assetPrefix}TVA déductible ${doc.vat_rate_pct}% sur ${doc.document_number}`,
            debitDzd: vatAmount,
            creditDzd: 0,
          });
        }

        // 3. Crédit Fournisseur (401000) et Retenue à la source (447200) si applicable
        const withholdingAmount = Number(doc.withholding_tax_amount_dzd || 0);
        if (withholdingAmount > 0) {
          // Règle 9 : Retenue à la source IBS (30% Art. 156 CIDTA)
          const supplierNetPayable = totalTtc - withholdingAmount;
          linesToInsert.push({
            accountCode: '401000',
            accountLabel: 'Fournisseurs (Net à payer)',
            description: `${assetPrefix}Fournisseur net ${thirdParty} — Pièce ${doc.document_number}`,
            debitDzd: 0,
            creditDzd: supplierNetPayable,
          });

          linesToInsert.push({
            accountCode: '447200',
            accountLabel: 'État, Retenue à la source IBS étrangers (Art. 156 CIDTA)',
            description: `${assetPrefix}Retenue à la source IBS sur ${doc.document_number}`,
            debitDzd: 0,
            creditDzd: withholdingAmount,
          });
        } else {
          linesToInsert.push({
            accountCode: '401000',
            accountLabel: 'Fournisseurs de biens et services',
            description: `${assetPrefix}Fournisseur ${thirdParty} — Pièce ${doc.document_number}`,
            debitDzd: 0,
            creditDzd: totalTtc,
          });
        }
      }

      // 6. Validation de l'Équilibre Mathématique Débit === Crédit
      const totalDebit = linesToInsert.reduce((sum, l) => sum + l.debitDzd, 0);
      const totalCredit = linesToInsert.reduce((sum, l) => sum + l.creditDzd, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new BadRequestException(
          `Déséquilibre comptable détecté sur la pièce ${doc.document_number} : Débit (${totalDebit.toFixed(2)} DZD) != Crédit (${totalCredit.toFixed(2)} DZD)`,
        );
      }

      // 7. Insertion persistée avec chaînage SHA-256
      const createdEntries: LedgerEntry[] = [];
      let lineIndex = 1;

      for (const line of linesToInsert) {
        const linePayload = JSON.stringify({
          tenantId,
          baseEntryNumber,
          lineIndex,
          journalCode,
          entryDate: docDate,
          accountCode: line.accountCode,
          debitDzd: line.debitDzd,
          creditDzd: line.creditDzd,
          previousHash,
        });

        const sha256Hash = createHash('sha256').update(linePayload).digest('hex');

        const insertRes = await client.query<LedgerRow>(
          `INSERT INTO accounting_ledger_entries (
            tenant_id, entry_number, journal_code, entry_date,
            fiscal_document_id, asset_id, site_id, cnrc_activity_id,
            account_code, account_label, description,
            debit_dzd, credit_dzd, third_party_name, third_party_nif,
            is_validated, sha256_hash, previous_entry_hash
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING *`,
          [
            tenantId,
            `${baseEntryNumber}-${lineIndex}`,
            journalCode,
            docDate,
            doc.id,
            doc.asset_id || null,
            doc.cost_center_type === 'BTP_CHANTIER' ? doc.asset_id : null,
            doc.cnrc_activity_id || null,
            line.accountCode,
            line.accountLabel,
            line.description,
            line.debitDzd,
            line.creditDzd,
            doc.third_party_name || null,
            doc.third_party_nif || null,
            true,
            sha256Hash,
            previousHash,
          ],
        );

        previousHash = sha256Hash;
        lineIndex++;

        createdEntries.push(
          this.mapLedgerRow({
            ...insertRes.rows[0],
            asset_code: doc.asset_code,
          }),
        );
      }

      this.logger.log(
        `[SCF] ${createdEntries.length} écritures passées au Grand Livre (${journalCode}) pour la pièce ${doc.document_number} (Équilibre Débit/Crédit: ${totalDebit.toFixed(2)} DZD)`,
      );

      return createdEntries;
    });
  }

  /**
   * Obtient les écritures du Grand Livre avec filtres analytiques optionnels.
   */
  async getGeneralLedger(
    tenantId: string,
    filters?: {
      journalCode?: string;
      assetId?: string;
      siteId?: string;
      accountCode?: string;
      year?: number;
      month?: number;
      limit?: number;
    },
  ): Promise<LedgerEntry[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `
        SELECT l.*, a.code as asset_code, s.code as site_code, c.code as cnrc_activity_code
        FROM accounting_ledger_entries l
        LEFT JOIN assets a ON a.id = l.asset_id
        LEFT JOIN site_workspaces s ON s.id = l.site_id
        LEFT JOIN tenant_cnrc_activities c ON c.id = l.cnrc_activity_id
        WHERE l.tenant_id = $1
      `;
      const params: any[] = [tenantId];

      if (filters?.journalCode) {
        params.push(filters.journalCode);
        query += ` AND l.journal_code = $${params.length}`;
      }

      if (filters?.assetId) {
        params.push(filters.assetId);
        query += ` AND l.asset_id = $${params.length}`;
      }

      if (filters?.siteId) {
        params.push(filters.siteId);
        query += ` AND l.site_id = $${params.length}`;
      }

      if (filters?.accountCode) {
        params.push(`${filters.accountCode}%`);
        query += ` AND l.account_code LIKE $${params.length}`;
      }

      if (filters?.year) {
        params.push(filters.year);
        query += ` AND EXTRACT(YEAR FROM l.entry_date) = $${params.length}`;
      }

      if (filters?.month) {
        params.push(filters.month);
        query += ` AND EXTRACT(MONTH FROM l.entry_date) = $${params.length}`;
      }

      query += ` ORDER BY l.entry_date DESC, l.entry_number DESC`;

      if (filters?.limit) {
        params.push(filters.limit);
        query += ` LIMIT $${params.length}`;
      }

      const res = await client.query<LedgerRow>(query, params);
      return res.rows.map((r) => this.mapLedgerRow(r));
    });
  }

  /**
   * Génère la Balance Générale des Comptes SCF (Comptes 1 à 7)
   * avec vérification mathématique rigoureuse de l'égalité Total Débit === Total Crédit.
   */
  async getTrialBalance(tenantId: string, year: number, month?: number): Promise<ScfTrialBalance> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `
        SELECT l.account_code, l.account_label,
               COALESCE(SUM(l.debit_dzd), 0) as total_debit,
               COALESCE(SUM(l.credit_dzd), 0) as total_credit
        FROM accounting_ledger_entries l
        WHERE l.tenant_id = $1 AND EXTRACT(YEAR FROM l.entry_date) = $2
      `;
      const params: any[] = [tenantId, year];

      if (month) {
        params.push(month);
        query += ` AND EXTRACT(MONTH FROM l.entry_date) = $${params.length}`;
      }

      query += ` GROUP BY l.account_code, l.account_label ORDER BY l.account_code ASC`;

      const res = await client.query<{
        account_code: string;
        account_label: string;
        total_debit: string | number;
        total_credit: string | number;
      }>(query, params);

      let totalDebitSum = 0;
      let totalCreditSum = 0;

      const accounts: ScfTrialBalanceAccount[] = res.rows.map((r) => {
        const totalDebit = Number(r.total_debit || 0);
        const totalCredit = Number(r.total_credit || 0);
        totalDebitSum += totalDebit;
        totalCreditSum += totalCredit;

        const debitBalance = Math.max(0, totalDebit - totalCredit);
        const creditBalance = Math.max(0, totalCredit - totalDebit);
        const accountClass = parseInt(r.account_code.charAt(0), 10) || 4;

        return {
          accountCode: r.account_code,
          accountLabel: r.account_label,
          accountClass,
          totalDebitDzd: totalDebit,
          totalCreditDzd: totalCredit,
          debitBalanceDzd: Math.round(debitBalance * 100) / 100,
          creditBalanceDzd: Math.round(creditBalance * 100) / 100,
        };
      });

      const discrepancy = Math.abs(totalDebitSum - totalCreditSum);
      const isBalanced = discrepancy < 0.05; // Tolérance d'arrondi centimes

      return {
        tenantId,
        periodYear: year,
        periodMonth: month,
        generatedAt: new Date().toISOString(),
        accounts,
        totalDebitSumDzd: Math.round(totalDebitSum * 100) / 100,
        totalCreditSumDzd: Math.round(totalCreditSum * 100) / 100,
        isBalanced,
        discrepancyDzd: Math.round(discrepancy * 100) / 100,
      };
    });
  }

  /**
   * Synthèse Comptable d'un Actif Racine spécifique.
   * Répond avec certitude à : "Combien cet actif a-t-il coûté et rapporté en comptabilité générale SCF ?"
   */
  async getAssetLedger(tenantId: string, assetId: string, year: number) {
    return this.db.withTenantContext(tenantId, async (client) => {
      const assetRes = await client.query('SELECT id, code, name FROM assets WHERE id = $1 AND tenant_id = $2', [assetId, tenantId]);
      if (assetRes.rowCount === 0) {
        throw new NotFoundException(`Actif introuvable: ${assetId}`);
      }
      const asset = assetRes.rows[0];

      const entries = await this.getGeneralLedger(tenantId, { assetId, year });

      let totalExpensesDzd = 0;
      let totalRevenuesDzd = 0;

      for (const e of entries) {
        if (e.accountCode.startsWith('6')) {
          totalExpensesDzd += e.debitDzd;
        } else if (e.accountCode.startsWith('7')) {
          totalRevenuesDzd += e.creditDzd;
        }
      }

      const netOperatingMarginDzd = totalRevenuesDzd - totalExpensesDzd;

      return {
        assetId: asset.id,
        assetCode: asset.code,
        assetName: asset.name,
        fiscalYear: year,
        entriesCount: entries.length,
        totalExpensesDzd: Math.round(totalExpensesDzd * 100) / 100,
        totalRevenuesDzd: Math.round(totalRevenuesDzd * 100) / 100,
        netOperatingMarginDzd: Math.round(netOperatingMarginDzd * 100) / 100,
        entries,
      };
    });
  }

  private mapLedgerRow(row: LedgerRow): LedgerEntry {
    const entryDateStr = row.entry_date instanceof Date
      ? row.entry_date.toISOString().split('T')[0]
      : String(row.entry_date).split('T')[0];

    return {
      id: row.id,
      tenantId: row.tenant_id,
      entryNumber: row.entry_number,
      journalCode: row.journal_code,
      entryDate: entryDateStr,
      fiscalDocumentId: row.fiscal_document_id,
      assetId: row.asset_id,
      assetCode: row.asset_code,
      siteId: row.site_id,
      siteCode: row.site_code,
      cnrcActivityId: row.cnrc_activity_id,
      cnrcActivityCode: row.cnrc_activity_code,
      accountCode: row.account_code,
      accountLabel: row.account_label,
      description: row.description,
      debitDzd: Number(row.debit_dzd || 0),
      creditDzd: Number(row.credit_dzd || 0),
      thirdPartyName: row.third_party_name,
      thirdPartyNif: row.third_party_nif,
      isValidated: Boolean(row.is_validated),
      sha256Hash: row.sha256_hash,
      previousEntryHash: row.previous_entry_hash,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
  }
}

