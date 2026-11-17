import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { createHash } from 'crypto';
import {
  FiscalAuditSeal,
  AssetFiscalSummary,
  AssetCategory,
} from '@docteurflotte/contracts';
import { TvaEngine } from '@docteurflotte/decision-engine';

export interface FiscalAuditSealDbRow {
  id: string;
  tenant_id: string;
  declaration_id: string;
  target_type: string;
  target_id: string;
  sealed_by_user_id: string;
  sealed_at: string | Date;
  canonical_payload: string;
  sha256_hash: string;
  merkle_leaf: string;
}

@Injectable()
export class FiscalAuditService {
  private readonly logger = new Logger(FiscalAuditService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Obtient tous les scellés cryptographiques du tenant.
   */
  async getAuditSeals(tenantId: string): Promise<FiscalAuditSeal[]> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query<FiscalAuditSealDbRow>(
        'SELECT * FROM fiscal_audit_seals WHERE tenant_id = $1 ORDER BY sealed_at DESC',
        [tenantId],
      );

      return res.rows.map((r) => this.mapSeal(r));
    });
  }

  /**
   * Vérifie formellement l'intégrité cryptographique d'un scellé SHA-256 (Anti-tampering).
   */
  async verifySealIntegrity(tenantId: string, sealId: string): Promise<{
    isValid: boolean;
    computedHash: string;
    storedHash: string;
    sealedAt: string;
    sealedBy: string;
  }> {
    return this.db.withTenantContext(tenantId, async (client) => {
      const res = await client.query<FiscalAuditSealDbRow>(
        'SELECT * FROM fiscal_audit_seals WHERE id = $1 AND tenant_id = $2',
        [sealId, tenantId],
      );

      if (res.rowCount === 0) {
        throw new NotFoundException('Scellé fiscal introuvable.');
      }

      const seal = res.rows[0];
      const computedHash = createHash('sha256').update(seal.canonical_payload).digest('hex');
      const isValid = computedHash === seal.sha256_hash;

      return {
        isValid,
        computedHash,
        storedHash: seal.sha256_hash,
        sealedAt: new Date(seal.sealed_at).toISOString(),
        sealedBy: seal.sealed_by_user_id,
      };
    });
  }

  /**
   * Synthèse fiscale complète pour un actif racine (Asset).
   */
  async getAssetFiscalSummary(tenantId: string, assetId: string): Promise<AssetFiscalSummary> {
    return this.db.withTenantContext(tenantId, async (client) => {
      // 1. Contrôle d'existence de l'actif
      const assetRes = await client.query(
        'SELECT id, code, category, year FROM assets WHERE id = $1 AND tenant_id = $2',
        [assetId, tenantId],
      );

      if (assetRes.rowCount === 0) {
        throw new NotFoundException(`L'actif ${assetId} n'existe pas.`);
      }

      const asset = assetRes.rows[0];
      const isVatDeductibleClass = asset.category !== AssetCategory.ROAD_VEHICLE;

      // 2. Agrégation des documents et événements fiscaux
      const docsRes = await client.query(
        `SELECT 
          COUNT(*) as doc_count,
          COALESCE(SUM(amount_ht_dzd), 0) as total_expenses,
          COALESCE(SUM(CASE WHEN is_vat_deductible = true THEN vat_amount_dzd ELSE 0 END), 0) as vat_deducted,
          COALESCE(SUM(CASE WHEN is_vat_deductible = false THEN vat_amount_dzd ELSE 0 END), 0) as vat_excluded,
          COALESCE(SUM(CASE WHEN document_type = 'AMENDE' THEN amount_ht_dzd ELSE 0 END), 0) as penalties_total
         FROM fiscal_documents
         WHERE tenant_id = $1 AND asset_id = $2`,
        [tenantId, assetId],
      );

      const d = docsRes.rows[0];

      // 3. Évaluation de la régularisation quinquennale via TvaEngine
      const acquisitionYear = asset.year ? Number(asset.year) : new Date().getFullYear() - 2;
      const currentYear = new Date().getFullYear();
      let quinquennialAdjustmentRequired = false;

      if (currentYear - acquisitionYear < 5) {
        const initialVat = Number(d.vat_deducted);
        if (initialVat > 0) {
          const adj = TvaEngine.computeQuinquennialAdjustment({
            assetId: asset.id,
            label: asset.code,
            acquisitionYear,
            initialDeductedTva: initialVat.toString(),
            disposalYear: currentYear,
            isDisposalExempt: true,
          });
          quinquennialAdjustmentRequired = adj.isAdjustmentRequired;
        }
      }

      return {
        assetId: asset.id,
        assetCode: asset.code,
        category: asset.category,
        isVatDeductibleClass,
        totalExpensesDzd: Number(d.total_expenses),
        vatDeductedDzd: Number(d.vat_deducted),
        vatNonDeductibleDzd: Number(d.vat_excluded),
        penaltiesNonDeductibleDzd: Number(d.penalties_total),
        documentsCount: Number(d.doc_count),
        quinquennialAdjustmentRequired,
      };
    });
  }

  private mapSeal(row: FiscalAuditSealDbRow): FiscalAuditSeal {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      declarationId: row.declaration_id,
      sealedByUserId: row.sealed_by_user_id,
      sealedAt: new Date(row.sealed_at).toISOString(),
      canonicalPayload: row.canonical_payload,
      sha256Hash: row.sha256_hash,
      merkleLeaf: row.merkle_leaf,
    };
  }
}

