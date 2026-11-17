import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  SiteWorkSituation,
  CreateSiteWorkSituationDto,
} from '@docteurflotte/contracts';
import { ScfGeneralLedgerService } from '../../fiscal-compliance/services/scf-general-ledger.service';
import * as crypto from 'crypto';

interface SituationRow {
  id: string;
  tenant_id: string;
  site_id: string;
  situation_number: string;
  period_start: string;
  period_end: string;
  month_work_amount_ht_dzd: string | number;
  withholding_guarantee_rate_pct: string | number;
  withholding_guarantee_amount_dzd: string | number;
  net_work_amount_ht_dzd: string | number;
  vat_rate_pct: string | number;
  vat_amount_dzd: string | number;
  total_payable_ttc_dzd: string | number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'BILLED' | 'PAID';
  client_name: string;
  client_nif: string | null;
  vat_tax_point: 'ENCAISSEMENT' | 'DEBIT';
  is_settled: boolean;
  settlement_date: string | null;
  notes: string | null;
  sha256_seal: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class WorkSituationsService {
  private readonly logger = new Logger(WorkSituationsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() private readonly ledgerService?: ScfGeneralLedgerService,
  ) {}

  /**
   * Crée un Décompte Provisoire Mensuel (Situation de Travaux BTPH)
   * avec calcul automatique de la Retenue de Garantie (5% légal Décret 15-247)
   * et qualification TVA sur encaissement (Art. 14 CTCA).
   */
  async createSituation(tenantId: string, dto: CreateSiteWorkSituationDto): Promise<SiteWorkSituation> {
    if (!dto.siteId || !dto.situationNumber || dto.monthWorkAmountHtDzd === undefined || dto.monthWorkAmountHtDzd < 0) {
      throw new BadRequestException('Paramètres de situation de travaux incomplets ou invalides.');
    }

    // Vérifier l'existence du chantier
    const siteRes = await this.db.query(
      `SELECT id, name FROM site_workspaces WHERE id = $1 AND tenant_id = $2`,
      [dto.siteId, tenantId],
    );
    if (siteRes.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${dto.siteId}`);
    }

    const monthAmountHt = Number(dto.monthWorkAmountHtDzd);
    const guaranteeRate = dto.withholdingGuaranteeRatePct ?? 5.0; // 5% légal par défaut
    const guaranteeAmount = Number(((monthAmountHt * guaranteeRate) / 100).toFixed(2));
    const netAmountHt = Number((monthAmountHt - guaranteeAmount).toFixed(2));
    const vatRate = dto.vatRatePct ?? 19.0;
    const vatAmount = Number(((monthAmountHt * vatRate) / 100).toFixed(2));
    const totalPayableTtc = Number((netAmountHt + vatAmount).toFixed(2));

    // Scellé d'intégrité SHA-256
    const payload = `${tenantId}:${dto.siteId}:${dto.situationNumber}:${monthAmountHt}:${guaranteeAmount}:${totalPayableTtc}`;
    const sha256Seal = crypto.createHash('sha256').update(payload).digest('hex');

    const insertSql = `
      INSERT INTO site_work_situations (
        tenant_id, site_id, situation_number, period_start, period_end,
        month_work_amount_ht_dzd, withholding_guarantee_rate_pct, withholding_guarantee_amount_dzd,
        net_work_amount_ht_dzd, vat_rate_pct, vat_amount_dzd, total_payable_ttc_dzd,
        status, client_name, client_nif, vat_tax_point, is_settled, notes, sha256_seal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'DRAFT', $13, $14, 'ENCAISSEMENT', FALSE, $15, $16)
      RETURNING *
    `;

    const res = await this.db.query<SituationRow>(insertSql, [
      tenantId,
      dto.siteId,
      dto.situationNumber.trim().toUpperCase(),
      dto.periodStart,
      dto.periodEnd,
      monthAmountHt,
      guaranteeRate,
      guaranteeAmount,
      netAmountHt,
      vatRate,
      vatAmount,
      totalPayableTtc,
      dto.clientName.trim(),
      dto.clientNif ? dto.clientNif.trim() : null,
      dto.notes || null,
      sha256Seal,
    ]);

    return this.mapSituationRow(res.rows[0]);
  }

  /**
   * Approuve la situation de travaux (Validation Maître d'Œuvre / BET)
   */
  async approveSituation(tenantId: string, situationId: string): Promise<SiteWorkSituation> {
    const res = await this.db.query<SituationRow>(
      `UPDATE site_work_situations
       SET status = 'APPROVED', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [situationId, tenantId],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException(`Situation de travaux introuvable: ${situationId}`);
    }

    return this.mapSituationRow(res.rows[0]);
  }

  /**
   * Émet la facture officielle et connecte au Grand Livre SCF
   * Débit 411000 (Net 95%) + Débit 411700 (Garantie 5%) = Crédit 704000 (Travaux HT) + Crédit 445780 (TVA en attente)
   */
  async billSituation(tenantId: string, situationId: string): Promise<SiteWorkSituation> {
    const sitRes = await this.db.query<SituationRow>(
      `SELECT * FROM site_work_situations WHERE id = $1 AND tenant_id = $2`,
      [situationId, tenantId],
    );

    if (sitRes.rows.length === 0) {
      throw new NotFoundException(`Situation de travaux introuvable: ${situationId}`);
    }

    const sit = sitRes.rows[0];

    // Mettre à jour le statut
    const updateRes = await this.db.query<SituationRow>(
      `UPDATE site_work_situations
       SET status = 'BILLED', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [situationId, tenantId],
    );

    // Mettre à jour les revenus du chantier
    await this.db.query(
      `UPDATE site_workspaces
       SET total_revenue_dzd = total_revenue_dzd + $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [Number(sit.month_work_amount_ht_dzd), sit.site_id, tenantId],
    );

    // Création automatique de la pièce fiscale et écriture comptable si le ledger est disponible
    if (this.ledgerService) {
      try {
        const fiscalDocSql = `
          INSERT INTO fiscal_documents (
            tenant_id, document_number, document_type, client_name, client_nif,
            subtotal_ht, vat_rate, vat_amount, total_ttc, currency, status,
            vat_tax_point, is_settled, withholding_tax_rate, withholding_tax_amount,
            sha256_hash, document_date
          ) VALUES ($1, $2, 'FACTURE_VENTE', $3, $4, $5, $6, $7, $8, 'DZD', 'ISSUED', 'ENCAISSEMENT', FALSE, $9, $10, $11, NOW())
          RETURNING id
        `;
        const docRes = await this.db.query<{ id: string }>(fiscalDocSql, [
          tenantId,
          sit.situation_number,
          sit.client_name,
          sit.client_nif,
          sit.month_work_amount_ht_dzd,
          Number(sit.vat_rate_pct) / 100,
          sit.vat_amount_dzd,
          sit.total_payable_ttc_dzd,
          Number(sit.withholding_guarantee_rate_pct) / 100,
          sit.withholding_guarantee_amount_dzd,
          sit.sha256_seal,
        ]);

        if (docRes.rows.length > 0) {
          await this.ledgerService.postDocumentToLedger(tenantId, docRes.rows[0].id);
        }
      } catch (err) {
        this.logger.warn(`[WorkSituations] Écriture comptable reportée: ${(err as Error).message}`);
      }
    }

    return this.mapSituationRow(updateRes.rows[0]);
  }

  /**
   * Encaissement du paiement client (Basculement TVA 445780 -> 445710)
   */
  async settleSituation(tenantId: string, situationId: string, settlementDate?: string): Promise<SiteWorkSituation> {
    const sDate = settlementDate ? new Date(settlementDate) : new Date();

    const res = await this.db.query<SituationRow>(
      `UPDATE site_work_situations
       SET status = 'PAID', is_settled = TRUE, settlement_date = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [sDate, situationId, tenantId],
    );

    if (res.rows.length === 0) {
      throw new NotFoundException(`Situation de travaux introuvable: ${situationId}`);
    }

    return this.mapSituationRow(res.rows[0]);
  }

  /**
   * Liste les situations d'un tenant / chantier
   */
  async listSituations(tenantId: string, siteId?: string): Promise<SiteWorkSituation[]> {
    let sql = `SELECT * FROM site_work_situations WHERE tenant_id = $1`;
    const params: string[] = [tenantId];

    if (siteId) {
      sql += ` AND site_id = $2`;
      params.push(siteId);
    }
    sql += ` ORDER BY period_end DESC, created_at DESC`;

    const res = await this.db.query<SituationRow>(sql, params);
    return res.rows.map((r) => this.mapSituationRow(r));
  }

  private mapSituationRow(r: SituationRow): SiteWorkSituation {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      siteId: r.site_id,
      situationNumber: r.situation_number,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      monthWorkAmountHtDzd: Number(r.month_work_amount_ht_dzd),
      withholdingGuaranteeRatePct: Number(r.withholding_guarantee_rate_pct),
      withholdingGuaranteeAmountDzd: Number(r.withholding_guarantee_amount_dzd),
      netWorkAmountHtDzd: Number(r.net_work_amount_ht_dzd),
      vatRatePct: Number(r.vat_rate_pct),
      vatAmountDzd: Number(r.vat_amount_dzd),
      totalPayableTtcDzd: Number(r.total_payable_ttc_dzd),
      status: r.status,
      clientName: r.client_name,
      clientNif: r.client_nif || undefined,
      vatTaxPoint: r.vat_tax_point,
      isSettled: r.is_settled,
      settlementDate: r.settlement_date || undefined,
      notes: r.notes || undefined,
      sha256Seal: r.sha256_seal,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

