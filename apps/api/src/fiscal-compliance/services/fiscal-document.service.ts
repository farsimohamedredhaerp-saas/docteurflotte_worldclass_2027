import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { createHash } from 'crypto';
import {
  FiscalDocument,
  CreateFiscalDocumentDto,
  FiscalDocumentType,
  FiscalVerificationStatus,
  AssetCategory,
  ALGERIA_FISCAL_RATES,
  isValidAlgerianNif,
  isValidAlgerianRc,
  isValidAlgerianArticleImposition,
} from '@docteurflotte/contracts';

export interface FiscalDocumentDbRow {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  cnrc_activity_id?: string | null;
  cost_center_type?: string;
  document_type: string;
  document_number: string;
  document_date: string | Date;
  payment_method?: string;
  third_party_name: string | null;
  third_party_nif: string | null;
  third_party_nis?: string | null;
  third_party_rc?: string | null;
  article_imposition_third_party?: string | null;
  amount_ht_dzd: string | number;
  vat_rate_pct: string | number;
  vat_amount_dzd: string | number;
  stamp_duty_dzd: string | number;
  total_ttc_dzd: string | number;
  is_vat_exempt_f20?: boolean;
  f20_certificate_number?: string | null;
  is_vat_deductible: boolean;
  deductibility_rationale: string | null;
  withholding_tax_rate_pct?: string | number;
  withholding_tax_amount_dzd?: string | number;
  vat_tax_point?: string;
  is_settled?: boolean;
  settlement_date?: string | Date | null;
  verification_status: string;
  rejection_reason: string | null;
  sha256_fingerprint: string;
  created_at: string | Date;
  updated_at: string | Date;
  asset_code?: string;
  asset_name?: string;
  asset_category?: string;
}

@Injectable()
export class FiscalDocumentService {
  private readonly logger = new Logger(FiscalDocumentService.name);

  constructor(private readonly db: DatabaseService) { }

  /**
   * Crée et qualifie fiscalement une pièce justificative rattachée à un actif racine.
   */
  async createDocument(tenantId: string, dto: CreateFiscalDocumentDto): Promise<FiscalDocument> {
    if (!dto.assetId && (!dto.costCenterType || dto.costCenterType === 'FLEET_ASSET')) {
      throw new BadRequestException('Un document fiscal d\'exploitation de flotte doit obligatoirement être rattaché à un asset_id valide.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      let asset: { id: string; code: string; category: string; status: string; physics_state?: Record<string, unknown> } | null = null;

      // 1. Contrôle d'intégrité Asset-Centric si assetId est renseigné
      if (dto.assetId) {
        const assetRes = await client.query(
          'SELECT id, code, category, status, physics_state FROM assets WHERE id = $1 AND tenant_id = $2',
          [dto.assetId, tenantId],
        );

        if (assetRes.rowCount === 0) {
          throw new NotFoundException(`L'actif racine ${dto.assetId} n'existe pas ou n'appartient pas à l'organisation ${tenantId}.`);
        }

        asset = assetRes.rows[0];
        if (asset!.status === 'DECOMMISSIONED') {
          throw new BadRequestException(`L'actif ${asset!.code} est décommissionné / réformé. Aucune nouvelle dépense fiscale ne peut y être affectée.`);
        }
      }

      // 2. Vérification des doublons (tenant_id + document_type + document_number)
      const dupCheck = await client.query(
        'SELECT id FROM fiscal_documents WHERE tenant_id = $1 AND document_type = $2 AND document_number = $3',
        [tenantId, dto.documentType, dto.documentNumber.trim()],
      );

      if (dupCheck.rowCount && dupCheck.rowCount > 0) {
        throw new ConflictException(`La pièce justificative ${dto.documentType} n° ${dto.documentNumber} a déjà été enregistrée.`);
      }

      // 3. Qualification Fiscale Déterministe basée sur la doctrine DGI & CIDTA
      const amountHt = Number(dto.amountHtDzd);
      let vatRate = dto.vatRatePct != null ? Number(dto.vatRatePct) : ALGERIA_FISCAL_RATES.STANDARD_VAT_PERCENT;
      let vatAmount = dto.vatAmountDzd != null ? Number(dto.vatAmountDzd) : (amountHt * vatRate) / 100;
      let stampDuty = dto.stampDutyDzd != null ? Number(dto.stampDutyDzd) : 0;
      let isDeductible = dto.isVatDeductible !== undefined ? dto.isVatDeductible : true;
      let rationale = dto.deductibilityRationale || 'Déductibilité standard d\'exploitation';

      // Règle Franchise TVA (Attestation F20/F21 AAPI/Exportateurs)
      if (dto.isVatExemptF20) {
        vatRate = 0;
        vatAmount = 0;
        isDeductible = false;
        rationale = `Attestation F20/F21 n°${dto.f20CertificateNumber || 'AAPI'} : Achat en franchise de TVA.`;
      } else if (
        dto.documentType === FiscalDocumentType.CONTRAT_LOCATION ||
        dto.documentType === FiscalDocumentType.FACTURE_CLIENT ||
        dto.documentType === FiscalDocumentType.SITUATION_TRAVAUX
      ) {
        // Ventes / Prestations : TVA collectée (non déductible en amont, car taxe collectée en aval)
        isDeductible = false;
        rationale =
          dto.documentType === FiscalDocumentType.SITUATION_TRAVAUX
            ? 'Art. 21 TCA : TVA collectée sur situation de travaux BTPH.'
            : 'Art. 21 TCA : TVA collectée sur prestations de location et services de transport.';
      } else if (asset && asset.category === AssetCategory.ROAD_VEHICLE && dto.documentType === FiscalDocumentType.TICKET_NAFTAL) {
        // Règle 1 : Véhicules de Tourisme (VP) — Art. 30 Code TCA (TVA exclue sauf dérogation outil de travail Art. 41 TCA & 141-2 CIDTA)
        const isCoreTool = Boolean(
          asset.physics_state?.is_core_business_tool ||
          asset.physics_state?.fiscal_usage_purpose === 'EXPLOITATION_PRINCIPALE'
        );

        if (isCoreTool) {
          isDeductible = true;
          rationale = 'Art. 41 TCA & Art. 141-2 CIDTA : Dérogation outil de travail principal (Location / Auto-école / Transport) - TVA 100% déductible.';
        } else {
          isDeductible = false;
          rationale = 'Art. 30 Code TCA : Exclusion du droit à déduction de la TVA sur carburant pour véhicules de tourisme.';
        }
      } else if (dto.documentType === FiscalDocumentType.AMENDE) {
        // Règle 2 : Amendes et pénalités de circulation — Art. 169 CIDTA (Charges non déductibles)
        vatRate = 0;
        vatAmount = 0;
        isDeductible = false;
        rationale = 'Art. 169 CIDTA : Amendes, contraventions et pénalités non déductibles de l\'assiette de l\'IBS.';
      }

      const totalTtc = dto.totalTtcDzd != null ? Number(dto.totalTtcDzd) : amountHt + vatAmount + stampDuty;

      let verificationStatus: FiscalVerificationStatus = FiscalVerificationStatus.VALIDATED;
      let rejectionReason: string | null = null;

      // Règle 5 : Plafond légal de paiement en espèces (Art. 30 TCA & CIDTA LF 2024-2026)
      const paymentMethod = dto.paymentMethod || 'BANK_TRANSFER';
      const cashCeilingDzd = ALGERIA_FISCAL_RATES.CASH_PAYMENT_LEGAL_CEILING_DZD;
      if (paymentMethod === 'CASH' && totalTtc > cashCeilingDzd) {
        isDeductible = false;
        verificationStatus = FiscalVerificationStatus.SUSPICIOUS;
        rejectionReason =
          `CASH_THRESHOLD_EXCEEDED: Facture réglée en espèces excédant le seuil légal de ${cashCeilingDzd.toLocaleString('fr-DZ')} DZD TTC (Art. 30 TCA & CIDTA). Déductibilité TVA et charge réintégrée.`;
        rationale = `Art. 30 TCA & CIDTA : Plafond espèces dépassé (> ${cashCeilingDzd.toLocaleString('fr-DZ')} DZD TTC). Exclusion du droit à déduction TVA et charge.`;
      }

      // Règle 6 : Conformité des mentions légales obligatoires du Tiers (Art. 64 CPF)
      // Une facture fournisseur au régime réel ne peut ouvrir droit à déduction de TVA que si
      // third_party_nif (15 ou 20 chiffres), third_party_rc et article_imposition sont valides.
      const isSupplierExpenseClaimingVat =
        isDeductible &&
        (dto.documentType === FiscalDocumentType.FACTURE_FOURNISSEUR ||
          dto.documentType === FiscalDocumentType.ORDRE_TRAVAIL);

      if (isSupplierExpenseClaimingVat) {
        const nifRaw = (dto.thirdPartyNif || '').trim();
        const rcRaw = (dto.thirdPartyRc || '').trim();
        const aiRaw = (dto.articleImpositionThirdParty || '').trim();

        const isNifValid = isValidAlgerianNif(nifRaw);
        const isRcValid = isValidAlgerianRc(rcRaw);
        const isAiValid = isValidAlgerianArticleImposition(aiRaw);

        if (!isNifValid || !isRcValid || !isAiValid) {
          isDeductible = false;
          verificationStatus = FiscalVerificationStatus.SUSPICIOUS;
          const missingDetails: string[] = [];
          if (!isNifValid) missingDetails.push(`NIF invalide ou absent (${nifRaw || 'non renseigné'}, 15 ou 20 chiffres requis)`);
          if (!isRcValid) missingDetails.push(`RC absent ou trop court (${rcRaw || 'non renseigné'})`);
          if (!isAiValid) missingDetails.push(`Article d'imposition absent (${aiRaw || 'non renseigné'})`);

          rejectionReason = `MISSING_LEGAL_MENTIONS_ART_64_CPF: Mentions légales du tiers non conformes (${missingDetails.join(', ')} selon Art. 64 CPF).`;
          rationale = 'Art. 64 CPF : Mentions légales obligatoires du tiers manquantes ou non conformes. Droit à déduction TVA suspendu.';
        }
      }

      // Règle 7 : Fait générateur de la TVA hybride (Débit vs Encaissement - Art. 13 & 14 Code TCA)
      let vatTaxPoint: 'DEBIT' | 'ENCAISSEMENT' = dto.vatTaxPoint || 'DEBIT';
      if (!dto.vatTaxPoint) {
        if (
          dto.documentType === FiscalDocumentType.SITUATION_TRAVAUX ||
          dto.documentType === FiscalDocumentType.CONTRAT_LOCATION ||
          dto.documentType === FiscalDocumentType.ORDRE_TRAVAIL ||
          dto.costCenterType === 'BTP_CHANTIER'
        ) {
          vatTaxPoint = 'ENCAISSEMENT';
        } else {
          vatTaxPoint = 'DEBIT';
        }
      }

      const isSettled = dto.isSettled !== undefined ? Boolean(dto.isSettled) : vatTaxPoint === 'DEBIT';
      const settlementDate = dto.settlementDate || (isSettled ? dto.documentDate : null);

      // 4. Calcul de l'empreinte cryptographique SHA-256 infalsifiable
      const canonicalPayload = JSON.stringify({
        tenantId,
        assetId: dto.assetId || null,
        assetCode: asset?.code || null,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber.trim(),
        documentDate: dto.documentDate,
        amountHt,
        vatAmount,
        totalTtc,
      });

      const sha256Fingerprint = createHash('sha256').update(canonicalPayload).digest('hex');

      // 5. Insertion en base avec RLS
      const res = await client.query<FiscalDocumentDbRow>(
        `INSERT INTO fiscal_documents (
          tenant_id, asset_id, cnrc_activity_id, cost_center_type, payment_method,
          document_type, document_number, document_date,
          third_party_name, third_party_nif, third_party_nis, third_party_rc, article_imposition_third_party,
          amount_ht_dzd, vat_rate_pct, vat_amount_dzd, stamp_duty_dzd, total_ttc_dzd,
          is_vat_exempt_f20, f20_certificate_number, is_vat_deductible,
          withholding_tax_rate_pct, withholding_tax_amount_dzd,
          vat_tax_point, is_settled, settlement_date,
          deductibility_rationale, verification_status, rejection_reason, sha256_fingerprint
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21,
          $22, $23,
          $24, $25, $26,
          $27, $28, $29, $30
        )
        RETURNING *`,
        [
          tenantId,
          dto.assetId || null,
          dto.cnrcActivityId || null,
          dto.costCenterType || 'FLEET_ASSET',
          paymentMethod,
          dto.documentType,
          dto.documentNumber.trim(),
          dto.documentDate,
          dto.thirdPartyName || null,
          dto.thirdPartyNif || null,
          dto.thirdPartyNis || null,
          dto.thirdPartyRc || null,
          dto.articleImpositionThirdParty || null,
          amountHt,
          vatRate,
          vatAmount,
          stampDuty,
          totalTtc,
          Boolean(dto.isVatExemptF20),
          dto.f20CertificateNumber || null,
          isDeductible,
          dto.withholdingTaxRatePct || 0,
          dto.withholdingTaxAmountDzd || 0,
          vatTaxPoint,
          isSettled,
          settlementDate,
          rationale,
          verificationStatus,
          rejectionReason,
          sha256Fingerprint,
        ],
      );

      this.logger.log(
        `[FiscalDocument] Document ${dto.documentType} n°${dto.documentNumber} créé pour l'actif ${asset?.code || 'Hors-flotte'} (Statut: ${verificationStatus}, FaitGénérateur: ${vatTaxPoint}, SHA-256: ${sha256Fingerprint.substring(0, 12)}...)`,
      );
      return this.mapDocument({ ...res.rows[0], asset_code: asset?.code });
    });
  }

  /**
   * Liste les documents fiscaux de l'organisation tenant avec filtrage optionnel par asset_id.
   */
  async listDocuments(
    tenantId: string,
    assetId?: string,
    documentType?: FiscalDocumentType,
  ): Promise<FiscalDocument[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      let query = `
        SELECT fd.*, a.code as asset_code, a.name as asset_name, a.category as asset_category
        FROM fiscal_documents fd
        LEFT JOIN assets a ON a.id = fd.asset_id
        WHERE fd.tenant_id = $1
      `;
      const params: (string | FiscalDocumentType)[] = [tenantId];

      if (assetId) {
        params.push(assetId);
        query += ` AND fd.asset_id = $${params.length}`;
      }

      if (documentType) {
        params.push(documentType);
        query += ` AND fd.document_type = $${params.length}`;
      }

      query += ' ORDER BY fd.document_date DESC, fd.created_at DESC';
      const res = await client.query<FiscalDocumentDbRow>(query, params);
      return res.rows.map((r) => this.mapDocument(r));
    });
  }

  /**
   * Obtient un document fiscal par son ID.
   */
  async getDocumentById(tenantId: string, id: string): Promise<FiscalDocument> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query<FiscalDocumentDbRow>(
        `SELECT fd.*, a.code as asset_code, a.name as asset_name, a.category as asset_category
         FROM fiscal_documents fd
         LEFT JOIN assets a ON a.id = fd.asset_id
         WHERE fd.id = $1 AND fd.tenant_id = $2`,
        [id, tenantId],
      );

      if (res.rowCount === 0) {
        throw new NotFoundException('Document fiscal introuvable.');
      }

      return this.mapDocument(res.rows[0]);
    });
  }

  private mapDocument(row: FiscalDocumentDbRow): FiscalDocument {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id || undefined,
      assetCode: row.asset_code || undefined,
      cnrcActivityId: row.cnrc_activity_id || undefined,
      costCenterType: row.cost_center_type || undefined,
      documentType: row.document_type as FiscalDocumentType,
      documentNumber: row.document_number,
      documentDate: typeof row.document_date === 'string' ? row.document_date : new Date(row.document_date).toISOString().split('T')[0],
      paymentMethod: row.payment_method || undefined,
      thirdPartyName: row.third_party_name || undefined,
      thirdPartyNif: row.third_party_nif || undefined,
      thirdPartyNis: row.third_party_nis || undefined,
      thirdPartyRc: row.third_party_rc || undefined,
      articleImpositionThirdParty: row.article_imposition_third_party || undefined,
      amountHtDzd: Number(row.amount_ht_dzd),
      vatRatePct: Number(row.vat_rate_pct),
      vatAmountDzd: Number(row.vat_amount_dzd),
      stampDutyDzd: Number(row.stamp_duty_dzd),
      totalTtcDzd: Number(row.total_ttc_dzd),
      isVatExemptF20: Boolean(row.is_vat_exempt_f20),
      f20CertificateNumber: row.f20_certificate_number || undefined,
      isVatDeductible: Boolean(row.is_vat_deductible),
      deductibilityRationale: row.deductibility_rationale || undefined,
      withholdingTaxRatePct: row.withholding_tax_rate_pct != null ? Number(row.withholding_tax_rate_pct) : undefined,
      withholdingTaxAmountDzd: row.withholding_tax_amount_dzd != null ? Number(row.withholding_tax_amount_dzd) : undefined,
      vatTaxPoint: (row.vat_tax_point as 'DEBIT' | 'ENCAISSEMENT') || 'DEBIT',
      isSettled: row.is_settled !== false,
      settlementDate: row.settlement_date ? (typeof row.settlement_date === 'string' ? row.settlement_date : new Date(row.settlement_date).toISOString().split('T')[0]) : undefined,
      verificationStatus: row.verification_status as FiscalVerificationStatus,
      rejectionReason: row.rejection_reason || undefined,
      sha256Fingerprint: row.sha256_fingerprint,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}

