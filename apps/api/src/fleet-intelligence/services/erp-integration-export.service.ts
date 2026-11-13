import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ErpExportFormat,
  ErpWorkOrderExportPayload,
  ErpExportResult,
  ALGERIA_FISCAL_RATES,
} from '@docteurflotte/contracts';

export interface ErpExportAccountConfig {
  defaultTvaRatePercent?: number;
  pcComptaAccounts?: {
    maintenanceExpenseAccount?: string; // Défaut '615200' (Entretien matériel roulant)
    tvaDeductibleAccount?: string;      // Défaut '445660' (TVA déductible)
    supplierAccount?: string;           // Défaut '401100' (Fournisseurs)
    journalCode?: string;               // Défaut 'ACH'
  };
  sageAccounts?: {
    journalCode?: string;               // Défaut 'HA'
    expenseAccount?: string;            // Défaut '615000'
    tvaAccount?: string;                // Défaut '445660'
    supplierAccount?: string;           // Défaut '401000'
  };
}

@Injectable()
export class ErpIntegrationExportService {
  private readonly logger = new Logger(ErpIntegrationExportService.name);

  /**
   * Construit et formate un export standardisé d'Ordre de Travail pour les ERPs du marché algérien.
   * Aucune constante fiscale en dur : taux de TVA et comptes SCF configurables.
   */
  exportWorkOrder(
    payload: Omit<ErpWorkOrderExportPayload, 'subtotalDzd' | 'taxAmountDzd' | 'totalDzd' | 'integritySha256'>,
    accountConfig?: ErpExportAccountConfig,
  ): ErpExportResult {
    const defaultTva =
      accountConfig?.defaultTvaRatePercent ?? ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE * 100;

    let subtotalDzd = 0;
    let taxAmountDzd = 0;

    payload.lines.forEach((l) => {
      subtotalDzd += l.totalLineDzd;
      const rate = l.taxRatePercent ?? defaultTva;
      taxAmountDzd += Math.round(((l.totalLineDzd * rate) / 100) * 100) / 100;
    });

    subtotalDzd = Math.round(subtotalDzd * 100) / 100;
    taxAmountDzd = Math.round(taxAmountDzd * 100) / 100;
    const totalDzd = Math.round((subtotalDzd + taxAmountDzd) * 100) / 100;

    const hashData = `${payload.workOrderNumber}|${payload.assetCode}|${payload.exportedAt}|${totalDzd}|${payload.tenantId}`;
    const integritySha256 = crypto.createHash('sha256').update(hashData).digest('hex');

    const fullPayload: ErpWorkOrderExportPayload = {
      ...payload,
      subtotalDzd,
      taxAmountDzd,
      totalDzd,
      integritySha256,
    };

    switch (payload.exportFormat) {
      case ErpExportFormat.PC_COMPTA_CSV:
        return this.formatPcComptaCsv(fullPayload, accountConfig);
      case ErpExportFormat.SAGE_CSV:
        return this.formatSageCsv(fullPayload, accountConfig);
      case ErpExportFormat.ODOO_JSON:
        return this.formatOdooJson(fullPayload);
      case ErpExportFormat.SAP_REST_JSON:
      default:
        return this.formatSapJson(fullPayload);
    }
  }

  /**
   * Format PC Compta (Journal SCF Algérie)
   */
  private formatPcComptaCsv(p: ErpWorkOrderExportPayload, cfg?: ErpExportAccountConfig): ErpExportResult {
    const headers = [
      'Date',
      'Journal',
      'Compte',
      'Libelle',
      'Debit_DZD',
      'Credit_DZD',
      'Piece_Ref',
      'NIF_Fournisseur',
      'Matricule_Vehicule',
    ];

    const dateFormatted = p.exportedAt.substring(0, 10).replace(/-/g, '/');
    const journal = cfg?.pcComptaAccounts?.journalCode ?? 'ACH';
    const expenseAcc = cfg?.pcComptaAccounts?.maintenanceExpenseAccount ?? '615200';
    const tvaAcc = cfg?.pcComptaAccounts?.tvaDeductibleAccount ?? '445660';
    const supplierAcc = cfg?.pcComptaAccounts?.supplierAccount ?? '401100';

    const rows: string[] = [];

    // Débit HT : Entretien véhicule
    rows.push(
      [
        dateFormatted,
        journal,
        expenseAcc,
        `Entretien ${p.assetCode} - ${p.workOrderNumber}`,
        p.subtotalDzd.toFixed(2),
        '0.00',
        p.workOrderNumber,
        p.tenantFiscalIdNif || '',
        p.assetCode,
      ].join(';'),
    );

    // Débit TVA : TVA Récupérable
    rows.push(
      [
        dateFormatted,
        journal,
        tvaAcc,
        `TVA ${p.workOrderNumber}`,
        p.taxAmountDzd.toFixed(2),
        '0.00',
        p.workOrderNumber,
        p.tenantFiscalIdNif || '',
        p.assetCode,
      ].join(';'),
    );

    // Crédit TTC : Fournisseur
    rows.push(
      [
        dateFormatted,
        journal,
        supplierAcc,
        `Facture Atelier ${p.workOrderNumber}`,
        '0.00',
        p.totalDzd.toFixed(2),
        p.workOrderNumber,
        p.tenantFiscalIdNif || '',
        p.assetCode,
      ].join(';'),
    );

    const content = `${headers.join(';')}\r\n${rows.join('\r\n')}`;
    const filename = `PC_COMPTA_${p.workOrderNumber}_${Date.now()}.csv`;

    return {
      format: ErpExportFormat.PC_COMPTA_CSV,
      filename,
      mimeType: 'text/csv; charset=utf-8',
      content,
      integrityHash: p.integritySha256,
      linesCount: p.lines.length,
      totalAmountDzd: p.totalDzd,
    };
  }

  /**
   * Format Sage 100 Algérie
   */
  private formatSageCsv(p: ErpWorkOrderExportPayload, cfg?: ErpExportAccountConfig): ErpExportResult {
    const headers = [
      'CODE_JOURNAL',
      'DATE_PIECE',
      'NUMERO_COMPTE',
      'NUMERO_PIECE',
      'LIBELLE_ECRITURE',
      'MONTANT_DEBIT',
      'MONTANT_CREDIT',
      'REF_MATRICULE',
    ];

    const dateFormatted = p.exportedAt.substring(0, 10).replace(/-/g, '');
    const journal = cfg?.sageAccounts?.journalCode ?? 'HA';
    const expenseAcc = cfg?.sageAccounts?.expenseAccount ?? '615000';
    const tvaAcc = cfg?.sageAccounts?.tvaAccount ?? '445660';
    const supplierAcc = cfg?.sageAccounts?.supplierAccount ?? '401000';

    const rows = [
      [
        journal,
        dateFormatted,
        expenseAcc,
        p.workOrderNumber,
        `MAINTENANCE ${p.assetCode}`,
        p.subtotalDzd.toFixed(2),
        '0.00',
        p.assetCode,
      ].join(';'),
      [
        journal,
        dateFormatted,
        tvaAcc,
        p.workOrderNumber,
        `TVA ${p.workOrderNumber}`,
        p.taxAmountDzd.toFixed(2),
        '0.00',
        p.assetCode,
      ].join(';'),
      [
        journal,
        dateFormatted,
        supplierAcc,
        p.workOrderNumber,
        `FOURNISSEUR ATELIER ${p.workOrderNumber}`,
        '0.00',
        p.totalDzd.toFixed(2),
        p.assetCode,
      ].join(';'),
    ];

    const content = `${headers.join(';')}\r\n${rows.join('\r\n')}`;
    const filename = `SAGE_${p.workOrderNumber}_${Date.now()}.csv`;

    return {
      format: ErpExportFormat.SAGE_CSV,
      filename,
      mimeType: 'text/csv; charset=utf-8',
      content,
      integrityHash: p.integritySha256,
      linesCount: p.lines.length,
      totalAmountDzd: p.totalDzd,
    };
  }

  /**
   * Format Odoo
   */
  private formatOdooJson(p: ErpWorkOrderExportPayload): ErpExportResult {
    const odooPayload = {
      model: 'fleet.vehicle.log.services',
      values: {
        vehicle_license_plate: p.assetCode,
        odometer: p.currentOdometerKm,
        date: p.exportedAt.substring(0, 10),
        description: `DocteurFlotte OT 5.0: ${p.workOrderNumber} (Resp: ${p.technicianName})`,
        cost_subtype_id: 'Maintenance Préventive XAI',
        amount: p.subtotalDzd,
        total_amount_dzd: p.totalDzd,
        tax_amount_dzd: p.taxAmountDzd,
        notes: `Empreinte SHA-256 DocteurFlotte: ${p.integritySha256}`,
        service_lines: p.lines.map((l) => ({
          product_code: l.partNumberOem || 'SERVICE-MAIN-DOEUVRE',
          name: l.description,
          quantity: l.quantity,
          price_unit_dzd: l.unitPriceDzd,
          price_subtotal_dzd: l.totalLineDzd,
        })),
      },
    };

    const content = JSON.stringify(odooPayload, null, 2);
    const filename = `ODOO_${p.workOrderNumber}_${Date.now()}.json`;

    return {
      format: ErpExportFormat.ODOO_JSON,
      filename,
      mimeType: 'application/json',
      content,
      integrityHash: p.integritySha256,
      linesCount: p.lines.length,
      totalAmountDzd: p.totalDzd,
    };
  }

  /**
   * Format SAP Plant Maintenance (PM)
   */
  private formatSapJson(p: ErpWorkOrderExportPayload): ErpExportResult {
    const sapPayload = {
      d: {
        MaintenanceOrder: p.workOrderNumber,
        MaintenanceOrderType: 'PM01',
        TechnicalObject: p.assetCode,
        Equipment: p.assetVin || p.assetCode,
        OrderDescription: `DocteurFlotte XAI ${p.workOrderNumber}`,
        ScheduledStartDate: p.exportedAt,
        TotalEstimatedCostDZD: p.totalDzd,
        Currency: 'DZD',
        SecurityHash: p.integritySha256,
        Components: p.lines.map((l, idx) => ({
          ItemNumber: (idx + 1) * 10,
          MaterialNumber: l.partNumberOem || 'GEN_PART',
          MaterialDescription: l.description,
          RequirementQuantity: l.quantity,
          UnitOfMeasure: l.unitOfMeasure,
          NetPriceDZD: l.unitPriceDzd,
        })),
      },
    };

    const content = JSON.stringify(sapPayload, null, 2);
    const filename = `SAP_PM_${p.workOrderNumber}_${Date.now()}.json`;

    return {
      format: ErpExportFormat.SAP_REST_JSON,
      filename,
      mimeType: 'application/json',
      content,
      integrityHash: p.integritySha256,
      linesCount: p.lines.length,
      totalAmountDzd: p.totalDzd,
    };
  }
}
