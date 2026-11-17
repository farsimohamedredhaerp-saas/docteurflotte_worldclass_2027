import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  TenantFiscalProfile,
  UpdateTenantFiscalProfileDto,
  TenantCnrcActivity,
  CreateTenantCnrcActivityDto,
  TaxRegimeDZ,
} from '@docteurflotte/contracts';

export interface TenantFiscalProfileDbRow {
  id: string;
  tenant_id: string;
  legal_name: string;
  legal_form?: string;
  profit_tax_type?: string;
  nif: string;
  nis: string | null;
  rc_number: string | null;
  article_imposition: string | null;
  tax_regime: string;
  is_vat_subject: boolean;
  vat_declaration_frequency: string;
  vat_prorata_pct?: number | string;
  aapi_exemption_active?: boolean;
  aapi_exemption_end_date?: string | Date | null;
  wilaya_code: number;
  fiscal_center: string | null;
  is_configured: boolean;
  version: number;
  created_at: string | Date;
  updated_at: string | Date;
}

@Injectable()
export class FiscalProfileService {
  private readonly logger = new Logger(FiscalProfileService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Récupère le profil fiscal de l'organisation tenant.
   * Retourne un profil par défaut non configuré si absent.
   */
  async getProfile(tenantId: string): Promise<TenantFiscalProfile> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query<TenantFiscalProfileDbRow>(
        'SELECT * FROM tenant_fiscal_profile WHERE tenant_id = $1',
        [tenantId],
      );

      if (res.rowCount === 0) {
        // Obtenir le nom de l'organisation pour pré-remplir
        const tenantRes = await client.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
        const legalName = tenantRes.rows[0]?.name || 'Organisation Non Configurée';

        return {
          id: '00000000-0000-0000-0000-000000000000',
          tenantId,
          legalName,
          legalForm: 'SARL',
          profitTaxType: 'IBS',
          nif: '',
          nis: undefined,
          rcNumber: undefined,
          articleImposition: undefined,
          taxRegime: TaxRegimeDZ.REEL_NORMAL,
          isVatSubject: true,
          vatDeclarationFrequency: 'MONTHLY',
          vatProrataPct: 100,
          aapiExemptionActive: false,
          wilayaCode: 16, // Alger par défaut
          fiscalCenter: undefined,
          isConfigured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return this.mapProfile(res.rows[0]);
    });
  }

  /**
   * Met à jour ou initialise le profil fiscal du tenant.
   */
  async updateProfile(tenantId: string, dto: UpdateTenantFiscalProfileDto): Promise<TenantFiscalProfile> {
    // Validation du NIF algérien (15 ou 20 chiffres) si fourni
    if (dto.nif && !/^\d{15,20}$/.test(dto.nif.trim())) {
      throw new BadRequestException('Le Numéro d\'Identification Fiscale (NIF) algérien doit comporter 15 à 20 chiffres.');
    }

    if (dto.wilayaCode && (dto.wilayaCode < 1 || dto.wilayaCode > 58)) {
      throw new BadRequestException('Le code Wilaya algérien doit être compris entre 1 et 58.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      const tenantRes = await client.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
      const defaultName = tenantRes.rows[0]?.name || 'Société Flotte Algérie';
      const legalName = dto.legalName || defaultName;

      const res = await client.query<TenantFiscalProfileDbRow>(
        `INSERT INTO tenant_fiscal_profile (
          tenant_id, legal_name, legal_form, profit_tax_type, nif, nis, rc_number, article_imposition,
          tax_regime, is_vat_subject, vat_declaration_frequency, vat_prorata_pct,
          aapi_exemption_active, aapi_exemption_end_date, wilaya_code,
          fiscal_center, is_configured, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, NOW())
        ON CONFLICT (tenant_id) DO UPDATE SET
          legal_name = COALESCE($2, tenant_fiscal_profile.legal_name),
          legal_form = COALESCE($3, tenant_fiscal_profile.legal_form),
          profit_tax_type = COALESCE($4, tenant_fiscal_profile.profit_tax_type),
          nif = COALESCE($5, tenant_fiscal_profile.nif),
          nis = COALESCE($6, tenant_fiscal_profile.nis),
          rc_number = COALESCE($7, tenant_fiscal_profile.rc_number),
          article_imposition = COALESCE($8, tenant_fiscal_profile.article_imposition),
          tax_regime = COALESCE($9, tenant_fiscal_profile.tax_regime),
          is_vat_subject = COALESCE($10, tenant_fiscal_profile.is_vat_subject),
          vat_declaration_frequency = COALESCE($11, tenant_fiscal_profile.vat_declaration_frequency),
          vat_prorata_pct = COALESCE($12, tenant_fiscal_profile.vat_prorata_pct),
          aapi_exemption_active = COALESCE($13, tenant_fiscal_profile.aapi_exemption_active),
          aapi_exemption_end_date = COALESCE($14, tenant_fiscal_profile.aapi_exemption_end_date),
          wilaya_code = COALESCE($15, tenant_fiscal_profile.wilaya_code),
          fiscal_center = COALESCE($16, tenant_fiscal_profile.fiscal_center),
          is_configured = true,
          version = tenant_fiscal_profile.version + 1,
          updated_at = NOW()
        RETURNING *`,
        [
          tenantId,
          legalName,
          dto.legalForm || 'SARL',
          dto.profitTaxType || 'IBS',
          dto.nif ? dto.nif.trim() : '000000000000000',
          dto.nis ? dto.nis.trim() : null,
          dto.rcNumber ? dto.rcNumber.trim() : null,
          dto.articleImposition ? dto.articleImposition.trim() : null,
          dto.taxRegime || TaxRegimeDZ.REEL_NORMAL,
          dto.isVatSubject !== undefined ? dto.isVatSubject : true,
          dto.vatDeclarationFrequency || 'MONTHLY',
          dto.vatProrataPct !== undefined ? dto.vatProrataPct : 100.0,
          dto.aapiExemptionActive !== undefined ? dto.aapiExemptionActive : false,
          dto.aapiExemptionEndDate ? new Date(dto.aapiExemptionEndDate) : null,
          dto.wilayaCode || 16,
          dto.fiscalCenter || null,
        ],
      );

      this.logger.log(`[FiscalProfile] Profil fiscal mis à jour pour le tenant ${tenantId} (NIF: ${res.rows[0].nif})`);
      return this.mapProfile(res.rows[0]);
    });
  }

  /**
   * Récupère la liste des activités CNRC déclarées par le tenant.
   */
  async getCnrcActivities(tenantId: string): Promise<TenantCnrcActivity[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        'SELECT * FROM tenant_cnrc_activities WHERE tenant_id = $1 ORDER BY is_primary DESC, cnrc_code ASC',
        [tenantId],
      );
      return res.rows.map((r) => ({
        id: r.id,
        tenantId: r.tenant_id,
        cnrcCode: r.cnrc_code,
        activityLabel: r.activity_label,
        fiscalSegment: r.fiscal_segment,
        ifuSegment: r.ifu_segment || undefined,
        isSubjectToTls: Boolean(r.is_subject_to_tls),
        isPrimary: Boolean(r.is_primary),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    });
  }

  /**
   * Ajoute une activité CNRC au profil fiscal de l'organisation.
   */
  async createCnrcActivity(tenantId: string, dto: CreateTenantCnrcActivityDto): Promise<TenantCnrcActivity> {
    if (!dto.cnrcCode || !dto.activityLabel) {
      throw new BadRequestException('Le code CNRC et le libellé d\'activité sont obligatoires.');
    }

    return this.db.withTenantContext(tenantId, async (client) => {
      if (dto.isPrimary) {
        // Désactiver le flag primaire sur les autres activités
        await client.query(
          'UPDATE tenant_cnrc_activities SET is_primary = FALSE WHERE tenant_id = $1',
          [tenantId],
        );
      }

      const res = await client.query(
        `INSERT INTO tenant_cnrc_activities (
          tenant_id, cnrc_code, activity_label, fiscal_segment, ifu_segment, is_subject_to_tls, is_primary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tenant_id, cnrc_code) DO UPDATE SET
          activity_label = EXCLUDED.activity_label,
          fiscal_segment = EXCLUDED.fiscal_segment,
          ifu_segment = EXCLUDED.ifu_segment,
          is_subject_to_tls = EXCLUDED.is_subject_to_tls,
          is_primary = EXCLUDED.is_primary
        RETURNING *`,
        [
          tenantId,
          dto.cnrcCode.trim(),
          dto.activityLabel.trim(),
          dto.fiscalSegment || 'COMMERCE_SERVICES',
          dto.ifuSegment || null,
          Boolean(dto.isSubjectToTls),
          Boolean(dto.isPrimary),
        ],
      );

      const r = res.rows[0];
      return {
        id: r.id,
        tenantId: r.tenant_id,
        cnrcCode: r.cnrc_code,
        activityLabel: r.activity_label,
        fiscalSegment: r.fiscal_segment,
        ifuSegment: r.ifu_segment || undefined,
        isSubjectToTls: Boolean(r.is_subject_to_tls),
        isPrimary: Boolean(r.is_primary),
        createdAt: new Date(r.created_at).toISOString(),
      };
    });
  }

  /**
   * Supprime une activité CNRC.
   */
  async deleteCnrcActivity(tenantId: string, activityId: string): Promise<boolean> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        'DELETE FROM tenant_cnrc_activities WHERE id = $1 AND tenant_id = $2',
        [activityId, tenantId],
      );
      return (res.rowCount ?? 0) > 0;
    });
  }

  /**
   * Vérifie si le profil fiscal du tenant est configuré.
   * Utilisé par les guards et l'orchestrateur.
   */
  async isConfigured(tenantId: string): Promise<boolean> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query(
        'SELECT is_configured FROM tenant_fiscal_profile WHERE tenant_id = $1',
        [tenantId],
      );
      return Boolean(res.rows[0]?.is_configured);
    });
  }

  private mapProfile(row: TenantFiscalProfileDbRow): TenantFiscalProfile {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      legalName: row.legal_name,
      legalForm: row.legal_form || 'SARL',
      profitTaxType: row.profit_tax_type || 'IBS',
      nif: row.nif,
      nis: row.nis || undefined,
      rcNumber: row.rc_number || undefined,
      articleImposition: row.article_imposition || undefined,
      taxRegime: (row.tax_regime as TaxRegimeDZ) || TaxRegimeDZ.REEL_NORMAL,
      isVatSubject: Boolean(row.is_vat_subject),
      vatDeclarationFrequency: (row.vat_declaration_frequency as 'MONTHLY' | 'TRIMESTRIAL') || 'MONTHLY',
      vatProrataPct: row.vat_prorata_pct ? Number(row.vat_prorata_pct) : 100.0,
      aapiExemptionActive: Boolean(row.aapi_exemption_active),
      aapiExemptionEndDate: row.aapi_exemption_end_date ? new Date(row.aapi_exemption_end_date).toISOString().slice(0, 10) : undefined,
      wilayaCode: Number(row.wilaya_code),
      fiscalCenter: row.fiscal_center || undefined,
      isConfigured: Boolean(row.is_configured),
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}

