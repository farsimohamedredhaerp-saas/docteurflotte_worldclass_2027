import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { createHash } from 'crypto';
import {
  PartnerAccountingExport,
  FiscalDocumentType,
} from '@docteurflotte/contracts';

interface ExportDocRow {
  id: string;
  document_type: string;
  document_number: string;
  document_date: string | Date;
  third_party_name: string | null;
  third_party_nif: string | null;
  third_party_rc: string | null;
  article_imposition_third_party: string | null;
  amount_ht_dzd: string | number;
  vat_rate_pct: string | number;
  vat_amount_dzd: string | number;
  stamp_duty_dzd: string | number;
  total_ttc_dzd: string | number;
  is_vat_deductible: boolean;
  cost_center_type: string | null;
  asset_code: string | null;
  sha256_fingerprint: string;
}

@Injectable()
export class PartnerAccountingExportService {
  private readonly logger = new Logger(PartnerAccountingExportService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Génère l'export comptable certifié 1-clic pour les logiciels du marché algérien :
   * PC Compta (SCF DGI standard .txt/.csv), Odoo/Almawarid (JSON REST) ou Sage 100.
   */
  async exportAccounting(
    tenantId: string,
    format: 'PC_COMPTA_DGI' | 'ODOO_ALMAWARID_JSON' | 'SAGE_CSV',
    periodYear: number,
    periodMonth?: number,
  ): Promise<PartnerAccountingExport> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `
        SELECT fd.id, fd.document_type, fd.document_number, fd.document_date,
               fd.third_party_name, fd.third_party_nif, fd.third_party_rc, fd.article_imposition_third_party,
               fd.amount_ht_dzd, fd.vat_rate_pct, fd.vat_amount_dzd, fd.stamp_duty_dzd, fd.total_ttc_dzd,
               fd.is_vat_deductible, fd.cost_center_type, a.code as asset_code, fd.sha256_fingerprint
        FROM fiscal_documents fd
        LEFT JOIN assets a ON a.id = fd.asset_id
        WHERE fd.tenant_id = $1 AND EXTRACT(YEAR FROM fd.document_date) = $2
      `;
      const params: (string | number)[] = [tenantId, periodYear];

      if (periodMonth) {
        params.push(periodMonth);
        query += ` AND EXTRACT(MONTH FROM fd.document_date) = $${params.length}`;
      }

      query += ` ORDER BY fd.document_date ASC, fd.document_number ASC`;

      const res = await client.query<ExportDocRow>(query, params);
      const rows = res.rows;

      let rawContent = '';
      let entriesCount = 0;

      if (format === 'PC_COMPTA_DGI') {
        const lines: string[] = [];
        // Header PC Compta Standard
        lines.push('Date;Journal;Compte;Piece;Libelle;Debit;Credit');

        for (const r of rows) {
          const docDate = r.document_date instanceof Date
            ? r.document_date
            : new Date(r.document_date);
          const dateStr = `${String(docDate.getDate()).padStart(2, '0')}/${String(docDate.getMonth() + 1).padStart(2, '0')}/${docDate.getFullYear()}`;
          const piece = r.document_number.replace(/;/g, ' ');
          const thirdParty = (r.third_party_name || 'TIERS').replace(/;/g, ' ');
          const assetPrefix = r.asset_code ? `[${r.asset_code}] ` : '';

          const amountHt = Number(r.amount_ht_dzd || 0);
          const vatAmount = Number(r.vat_amount_dzd || 0);
          const stampDuty = Number(r.stamp_duty_dzd || 0);
          const totalTtc = Number(r.total_ttc_dzd || 0);

          const isSale =
            r.document_type === FiscalDocumentType.FACTURE_CLIENT ||
            r.document_type === FiscalDocumentType.SITUATION_TRAVAUX ||
            r.document_type === FiscalDocumentType.CONTRAT_LOCATION;

          if (isSale) {
            // Journal Ventes (VTE)
            const journal = 'VTE';
            // Débit Client 411000
            lines.push(`${dateStr};${journal};411000;${piece};${assetPrefix}${thirdParty};${totalTtc.toFixed(2)};0.00`);
            // Crédit Produit 706000
            lines.push(`${dateStr};${journal};706000;${piece};${assetPrefix}Prestations/Ventes;0.00;${amountHt.toFixed(2)}`);
            // Crédit TVA Collectée 445700
            if (vatAmount > 0) {
              lines.push(`${dateStr};${journal};445700;${piece};${assetPrefix}TVA Collectee;0.00;${vatAmount.toFixed(2)}`);
            }
            if (stampDuty > 0) {
              lines.push(`${dateStr};${journal};445790;${piece};${assetPrefix}Droit de timbre;0.00;${stampDuty.toFixed(2)}`);
            }
            entriesCount += 3;
          } else {
            // Journal Achats (ACH)
            const journal = 'ACH';
            let chargeAccount = '606100'; // Carburant par défaut
            if (r.document_type === FiscalDocumentType.ORDRE_TRAVAIL) {
              chargeAccount = '615000'; // Entretien et réparations
            } else if (r.document_type === FiscalDocumentType.AMENDE) {
              chargeAccount = '658000'; // Pénalités et amendes
            } else if (r.cost_center_type === 'BTP_CHANTIER') {
              chargeAccount = '605000'; // Matériel chantier
            }

            // Débit Charge Classe 6
            lines.push(`${dateStr};${journal};${chargeAccount};${piece};${assetPrefix}${thirdParty};${amountHt.toFixed(2)};0.00`);

            // Débit TVA Déductible 445600 si éligible
            if (r.is_vat_deductible && vatAmount > 0) {
              lines.push(`${dateStr};${journal};445600;${piece};${assetPrefix}TVA Deductible;${vatAmount.toFixed(2)};0.00`);
            } else if (vatAmount > 0) {
              // Si TVA non déductible, ajoutée à la charge
              lines.push(`${dateStr};${journal};${chargeAccount};${piece};${assetPrefix}TVA non deductible;${vatAmount.toFixed(2)};0.00`);
            }

            // Crédit Fournisseur 401000
            lines.push(`${dateStr};${journal};401000;${piece};${assetPrefix}${thirdParty};0.00;${totalTtc.toFixed(2)}`);
            entriesCount += 3;
          }
        }
        rawContent = lines.join('\r\n');
      } else if (format === 'ODOO_ALMAWARID_JSON') {
        const moves = rows.map((r) => {
          const isSale =
            r.document_type === FiscalDocumentType.FACTURE_CLIENT ||
            r.document_type === FiscalDocumentType.SITUATION_TRAVAUX ||
            r.document_type === FiscalDocumentType.CONTRAT_LOCATION;

          const docDateStr = r.document_date instanceof Date
            ? r.document_date.toISOString().split('T')[0]
            : String(r.document_date || '').split('T')[0];

          return {
            move_type: isSale ? 'out_invoice' : 'in_invoice',
            name: r.document_number,
            date: docDateStr,
            partner: {
              name: r.third_party_name || 'Inconnu',
              vat_nif: r.third_party_nif || '',
              company_registry_rc: r.third_party_rc || '',
              article_imposition: r.article_imposition_third_party || '',
            },
            currency: 'DZD',
            amount_untaxed: Number(r.amount_ht_dzd || 0),
            amount_tax: Number(r.vat_amount_dzd || 0),
            amount_total: Number(r.total_ttc_dzd || 0),
            is_vat_deductible: r.is_vat_deductible,
            asset_code: r.asset_code || null,
            fiscal_security_sha256: r.sha256_fingerprint,
          };
        });

        const exportPayload = {
          meta: {
            generator: 'DocteurFlotte 2027 World-Class Sovereign Gateway',
            schema: 'ALMAWARID_ODOO_DZ_SCF_V1',
            tenantId,
            periodYear,
            periodMonth: periodMonth || null,
            totalInvoices: moves.length,
            generatedAt: new Date().toISOString(),
          },
          invoices: moves,
        };

        rawContent = JSON.stringify(exportPayload, null, 2);
        entriesCount = moves.length;
      } else if (format === 'SAGE_CSV') {
        const lines: string[] = [];
        lines.push('DATE,JOURNAL,COMPTE,PIECE,LIBELLE,DEBIT,CREDIT');
        for (const r of rows) {
          const docDate = r.document_date instanceof Date
            ? r.document_date
            : new Date(r.document_date);
          const dateStr = `${docDate.getFullYear()}${String(docDate.getMonth() + 1).padStart(2, '0')}${String(docDate.getDate()).padStart(2, '0')}`;
          const piece = (r.document_number || '').replace(/,/g, ' ');
          const thirdParty = (r.third_party_name || 'TIERS').replace(/,/g, ' ');

          const amountHt = Number(r.amount_ht_dzd || 0);
          const totalTtc = Number(r.total_ttc_dzd || 0);

          lines.push(`${dateStr},ACH,606100,${piece},"${thirdParty}",${amountHt.toFixed(2)},0.00`);
          lines.push(`${dateStr},ACH,401000,${piece},"${thirdParty}",0.00,${totalTtc.toFixed(2)}`);
          entriesCount += 2;
        }
        rawContent = lines.join('\r\n');
      } else {
        throw new BadRequestException(`Format d'export non supporté: ${format}`);
      }

      const checksumSha256 = createHash('sha256').update(rawContent).digest('hex');

      this.logger.log(
        `[PartnerAccountingExport] Export ${format} généré pour ${tenantId} (${entriesCount} écritures, SHA: ${checksumSha256.substring(0, 10)})`,
      );

      return {
        tenantId,
        format,
        periodYear,
        periodMonth,
        entriesCount,
        checksumSha256,
        rawContent,
      };
    });
  }
}
