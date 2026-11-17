import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { FiscalDocumentService } from './fiscal-document.service';
import { FiscalEventService } from './fiscal-event.service';
import { FiscalProfileService } from './fiscal-profile.service';
import {
  AssetRentalInvoice,
  AssetEngineHourLog,
  RecordSiteSituationDto,
  FiscalDocument,
  FiscalEvent,
  FiscalDocumentType,
  SiteWorkspace,
  SiteStatus,
  ALGERIA_FISCAL_RATES,
} from '@docteurflotte/contracts';

function toIsoDate(d: unknown): string {
  if (!d) return new Date().toISOString().split('T')[0];
  if (d instanceof Date) return d.toISOString().split('T')[0];
  if (typeof d === 'string') return d.includes('T') ? d.split('T')[0] : d;
  try {
    return new Date(d as string | number).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export interface SiteWorkspaceDbRow {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  wilaya_code: number;
  location_details: string | null;
  client_name: string | null;
  manager_name: string | null;
  start_date: string;
  target_end_date: string | null;
  actual_end_date: string | null;
  status: SiteStatus;
  budget_allocated_dzd: string | number;
  total_expenses_dzd: string | number;
  total_revenue_dzd: string | number;
  active_assets_count?: string | number;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class OperationalFiscalBridgeService {
  private readonly logger = new Logger(OperationalFiscalBridgeService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly fiscalDocumentService: FiscalDocumentService,
    private readonly fiscalEventService: FiscalEventService,
    private readonly fiscalProfileService: FiscalProfileService,
  ) {}

  /**
   * Pont automatique pour les factures de location d'actifs (Module Rental -> Module Fiscal).
   * Génère une pièce justificative CONTRAT_LOCATION et un événement fiscal TVA_COLLECTED (SCF 445700 / 706000 / 411000).
   */
  async bridgeRentalInvoice(
    tenantId: string,
    invoice: AssetRentalInvoice,
  ): Promise<{ fiscalDocument: FiscalDocument; fiscalEvent: FiscalEvent }> {
    this.logger.log(
      `[FiscalBridge] Pontage facture de location ${invoice.invoiceNumber} (Actif: ${invoice.assetId}, Total HT: ${invoice.totalHtDzd} DZD)`,
    );

    // 1. Recherche d'activité CNRC principale si profil configuré
    let cnrcActivityId: string | undefined;
    try {
      const primaryActivityRes = await this.db.query<{ id: string }>(
        `SELECT id FROM tenant_cnrc_activities WHERE tenant_id = $1 AND is_primary = true LIMIT 1`,
        [tenantId],
      );
      if (primaryActivityRes.rows.length > 0) {
        cnrcActivityId = primaryActivityRes.rows[0].id;
      }
    } catch {
      // profil ou table absente
    }

    const docDate = toIsoDate(invoice.issuedAt);
    const paymentMethod = Number(invoice.stampDutyDzd) > 0 ? 'CASH' : 'BANK_TRANSFER';

    // 2. Création de la pièce justificative
    const fiscalDocument = await this.fiscalDocumentService.createDocument(tenantId, {
      assetId: invoice.assetId,
      cnrcActivityId,
      costCenterType: 'FLEET_ASSET',
      documentType: FiscalDocumentType.CONTRAT_LOCATION,
      documentNumber: invoice.invoiceNumber,
      documentDate: docDate,
      paymentMethod,
      thirdPartyName: invoice.customerName,
      thirdPartyNif: invoice.customerNif,
      amountHtDzd: Number(invoice.totalHtDzd),
      vatRatePct: Number(invoice.vatRatePct),
      vatAmountDzd: Number(invoice.vatAmountDzd),
      stampDutyDzd: Number(invoice.stampDutyDzd),
      totalTtcDzd: Number(invoice.totalTtcDzd),
      isVatDeductible: false,
      deductibilityRationale: 'Art. 21 TCA : Prestation de location de matériel et véhicules — TVA collectée 19%.',
    });

    // 3. Qualification formelle de l'événement fiscal
    const fiscalEvent = await this.fiscalEventService.createEventFromDocument(tenantId, fiscalDocument.id);

    this.logger.log(
      `[FiscalBridge] Facture ${invoice.invoiceNumber} enregistrée en comptabilité fiscale (Doc: ${fiscalDocument.id}, Event: ${fiscalEvent.id})`,
    );

    return { fiscalDocument, fiscalEvent };
  }

  /**
   * Pont automatique pour la consommation de carburant sur chantier (Module Chantiers -> Module Fiscal).
   * Génère un ticket Naftal de chantier déductible (Art. 30 TCA / 141-2 CIDTA) et un événement TVA_DEDUCTION (SCF 445600 / 606100).
   */
  async bridgeEngineHoursFuel(
    tenantId: string,
    log: AssetEngineHourLog,
    siteCode?: string,
  ): Promise<{ fiscalDocument: FiscalDocument; fiscalEvent: FiscalEvent } | null> {
    if (!log.fuelConsumedLiters || Number(log.fuelConsumedLiters) <= 0) {
      return null;
    }

    this.logger.log(
      `[FiscalBridge] Pontage carburant chantier pour l'engin ${log.assetId} (${log.fuelConsumedLiters} L)`,
    );

    // 1. Calcul du montant TTC et décomposition HT / TVA (Gasoil TTC barème officiel Naftal)
    let totalTtc = Number(log.fuelCostDzd);
    const standardVatPercent = ALGERIA_FISCAL_RATES.STANDARD_VAT_PERCENT;
    if (!totalTtc || totalTtc <= 0) {
      let gasoilPrice: number = ALGERIA_FISCAL_RATES.GASOIL_REFERENCE_PRICE_LITER_DZD;
      try {
        const priceRes = await this.db.query<{ price_per_liter_dzd: string | number }>(
          `SELECT price_per_liter_dzd FROM platform_fiscal_fuel_prices WHERE fuel_type = 'GASOIL' ORDER BY effective_date DESC LIMIT 1`,
        );
        if (priceRes.rows.length > 0) {
          gasoilPrice = Number(priceRes.rows[0].price_per_liter_dzd);
        }
      } catch {
        // fallback
      }
      totalTtc = Math.round(Number(log.fuelConsumedLiters) * gasoilPrice * 100) / 100;
    }

    const amountHt = Math.round((totalTtc / (1 + (standardVatPercent / 100))) * 100) / 100;
    const vatAmount = Math.round((totalTtc - amountHt) * 100) / 100;
    const docNumber = `BON-CARB-${log.id ? log.id.slice(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const docDate = toIsoDate(log.recordedAt);

    // 2. Recherche d'activité CNRC
    let cnrcActivityId: string | undefined;
    try {
      const primaryActivityRes = await this.db.query<{ id: string }>(
        `SELECT id FROM tenant_cnrc_activities WHERE tenant_id = $1 AND is_primary = true LIMIT 1`,
        [tenantId],
      );
      if (primaryActivityRes.rows.length > 0) {
        cnrcActivityId = primaryActivityRes.rows[0].id;
      }
    } catch {
      // Ignore
    }

    // 3. Création de la pièce justificative TICKET_NAFTAL
    const fiscalDocument = await this.fiscalDocumentService.createDocument(tenantId, {
      assetId: log.assetId,
      cnrcActivityId,
      costCenterType: 'BTP_CHANTIER',
      documentType: FiscalDocumentType.TICKET_NAFTAL,
      documentNumber: docNumber,
      documentDate: docDate,
      paymentMethod: 'CARD_CIB_EDAHABIA',
      thirdPartyName: 'NAFTAL / DISTRIBUTION CHANTIER',
      thirdPartyNif: '000016001205367',
      amountHtDzd: amountHt,
      vatRatePct: standardVatPercent,
      vatAmountDzd: vatAmount,
      stampDutyDzd: 0,
      totalTtcDzd: totalTtc,
      isVatDeductible: true,
      deductibilityRationale: 'Art. 30 TCA & Art. 141-2 CIDTA : Carburant engin de chantier BTPH — Déductibilité TVA 100%.',
    });

    // 4. Qualification de l'événement fiscal TVA_DEDUCTION
    const fiscalEvent = await this.fiscalEventService.createEventFromDocument(tenantId, fiscalDocument.id);

    // 5. Mise à jour des dépenses directes du chantier
    if (log.siteId) {
      try {
        await this.db.query(
          `UPDATE site_workspaces
           SET total_expenses_dzd = total_expenses_dzd + $1, updated_at = NOW()
           WHERE id = $2 AND tenant_id = $3`,
          [totalTtc, log.siteId, tenantId],
        );
      } catch (err) {
        this.logger.warn(`Impossible de mettre à jour total_expenses_dzd du chantier ${log.siteId}: ${(err as Error).message}`);
      }
    }

    return { fiscalDocument, fiscalEvent };
  }

  /**
   * Pont automatique pour l'enregistrement d'une situation de travaux / attachement BTPH.
   * Génère une pièce justificative SITUATION_TRAVAUX et un événement fiscal TVA_COLLECTED (SCF 445700 / 704000 / 411000 / 411700 RAS).
   */
  async bridgeSiteSituation(
    tenantId: string,
    dto: RecordSiteSituationDto,
  ): Promise<{ fiscalDocument: FiscalDocument; fiscalEvent: FiscalEvent; updatedSite: SiteWorkspace }> {
    this.logger.log(
      `[FiscalBridge] Pontage situation de travaux ${dto.situationNumber} pour le chantier ${dto.siteId} (${dto.amountHtDzd} DZD HT)`,
    );

    // 1. Vérification du chantier
    const siteRes = await this.db.query<SiteWorkspaceDbRow>(
      `SELECT * FROM site_workspaces WHERE id = $1 AND tenant_id = $2`,
      [dto.siteId, tenantId],
    );
    if (siteRes.rows.length === 0) {
      throw new NotFoundException(`Chantier introuvable: ${dto.siteId}`);
    }
    const site = siteRes.rows[0];

    // 2. Résolution Asset-Centric de l'actif racine lié
    let assetId = dto.assetId;
    if (!assetId) {
      const assignmentRes = await this.db.query<{ asset_id: string }>(
        `SELECT asset_id FROM asset_site_assignments 
         WHERE site_id = $1 AND tenant_id = $2 AND status = 'ACTIVE' 
         ORDER BY start_date DESC LIMIT 1`,
        [dto.siteId, tenantId],
      );
      if (assignmentRes.rows.length > 0) {
        assetId = assignmentRes.rows[0].asset_id;
      } else {
        const fallbackRes = await this.db.query<{ id: string }>(
          `SELECT id FROM assets WHERE tenant_id = $1 LIMIT 1`,
          [tenantId],
        );
        if (fallbackRes.rows.length > 0) {
          assetId = fallbackRes.rows[0].id;
        } else {
          throw new BadRequestException("Aucun actif racine n'a été trouvé pour rattacher la situation de travaux.");
        }
      }
    }

    // 3. Activité CNRC du tenant
    let cnrcActivityId: string | undefined;
    try {
      const primaryActivityRes = await this.db.query<{ id: string }>(
        `SELECT id FROM tenant_cnrc_activities WHERE tenant_id = $1 AND is_primary = true LIMIT 1`,
        [tenantId],
      );
      if (primaryActivityRes.rows.length > 0) {
        cnrcActivityId = primaryActivityRes.rows[0].id;
      }
    } catch {
      // Ignore
    }

    // 4. Calculs fiscaux (HT, TVA, Retenue de garantie RAS)
    const amountHt = Number(dto.amountHtDzd);
    const vatRate = dto.vatRatePct !== undefined ? Number(dto.vatRatePct) : ALGERIA_FISCAL_RATES.STANDARD_VAT_PERCENT;
    const vatAmount = Math.round(((amountHt * vatRate) / 100) * 100) / 100;
    const withholdingRate = dto.withholdingTaxRatePct ? Number(dto.withholdingTaxRatePct) : 0;
    const withholdingAmount = Math.round(((amountHt * withholdingRate) / 100) * 100) / 100;
    const totalTtc = amountHt + vatAmount;

    const docDate = toIsoDate(dto.situationDate);
    const clientName = dto.clientName || site.client_name || 'MAÎTRE DE L\'OUVRAGE';

    // 5. Enregistrement de la pièce justificative SITUATION_TRAVAUX
    const fiscalDocument = await this.fiscalDocumentService.createDocument(tenantId, {
      assetId,
      cnrcActivityId,
      costCenterType: 'BTP_CHANTIER',
      documentType: FiscalDocumentType.SITUATION_TRAVAUX,
      documentNumber: dto.situationNumber,
      documentDate: docDate,
      paymentMethod: 'BANK_TRANSFER',
      thirdPartyName: clientName,
      thirdPartyNif: dto.clientNif || undefined,
      amountHtDzd: amountHt,
      vatRatePct: vatRate,
      vatAmountDzd: vatAmount,
      stampDutyDzd: 0,
      totalTtcDzd: totalTtc,
      withholdingTaxRatePct: withholdingRate,
      withholdingTaxAmountDzd: withholdingAmount,
      isVatDeductible: false,
      deductibilityRationale: 'Art. 21 TCA & Code Marchés Publics : Situation de travaux BTPH — TVA collectée.',
    });

    // 6. Qualification de l'événement fiscal TVA_COLLECTED
    const fiscalEvent = await this.fiscalEventService.createEventFromDocument(tenantId, fiscalDocument.id);

    // 7. Mise à jour du chiffre d'affaires / revenus du chantier
    const updatedSiteRes = await this.db.query<SiteWorkspaceDbRow>(
      `UPDATE site_workspaces
       SET total_revenue_dzd = total_revenue_dzd + $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [amountHt, dto.siteId, tenantId],
    );

    return {
      fiscalDocument,
      fiscalEvent,
      updatedSite: this.mapSiteRow(updatedSiteRes.rows[0]),
    };
  }

  private mapSiteRow(r: SiteWorkspaceDbRow): SiteWorkspace {
    return {
      id: r.id,
      tenantId: r.tenant_id,
      code: r.code,
      name: r.name,
      wilayaCode: Number(r.wilaya_code),
      locationDetails: r.location_details || undefined,
      clientName: r.client_name || undefined,
      managerName: r.manager_name || undefined,
      startDate: r.start_date,
      targetEndDate: r.target_end_date || undefined,
      actualEndDate: r.actual_end_date || undefined,
      status: r.status,
      budgetAllocatedDzd: Number(r.budget_allocated_dzd),
      totalExpensesDzd: Number(r.total_expenses_dzd),
      totalRevenueDzd: Number(r.total_revenue_dzd),
      activeAssetsCount: r.active_assets_count ? Number(r.active_assets_count) : 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
