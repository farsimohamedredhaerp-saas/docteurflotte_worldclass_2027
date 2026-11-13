import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ErpExportFormat,
  ErpWorkOrderExportPayload,
  ErpExportResult,
  ErpWorkOrderLine,
} from '@docteurflotte/contracts';

@Injectable()
export class ErpIntegrationExportService {
  private readonly logger = new Logger(ErpIntegrationExportService.name);

  /**
   * Construit et formate un export standardisé d'Ordre de Travail pour les ERPs du marché algérien
   */
  exportWorkOrder(
    payload: Omit<ErpWorkOrderExportPayload, 'subtotalDzd' | 'taxAmountDzd' | 'totalDzd' | 'integritySha256'>,
  ): ErpExportResult {
    // Calcul des totaux financiers en DZD
    let subtotalDzd = 0;
    let taxAmountDzd = 0;

    payload.lines.forEach((l) => {
      subtotalDzd += l.totalLineDzd;
      taxAmountDzd += Math.round(((l.totalLineDzd * (l.taxRatePercent ?? 19.0)) / 100) * 100) / 100;
    });

    subtotalDzd = Math.round(subtotalDzd * 100) / 100;
    taxAmountDzd = Math.round(taxAmountDzd * 100) / 100;
    const totalDzd = Math.round((subtotalDzd + taxAmountDzd) * 100) / 100;

    // Empreinte SHA-256 de traçabilité
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
        return this.formatPcComptaCsv(fullPayload);
      case ErpExportFormat.SAGE_CSV:
        return this.formatSageCsv(fullPayload);
      case ErpExportFormat.ODOO_JSON:
        return this.formatOdooJson(fullPayload);
      case ErpExportFormat.SAP_REST_JSON:
      default:
        return this.formatSapJson(fullPayload);
    }
  }

  /**
   * Format PC Compta (Logiciel DGI de comptabilité le plus répandu en Algérie)
   * Journal OD / Achats pièces avec ventilation compte 615 (Entretien et réparations) et 4456 (TVA déductible 19%)
   */
  private formatPcComptaCsv(p: ErpWorkOrderExportPayload): ErpExportResult {
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
    const rows: string[] = [];

    // Ligne Débit HT : Entretien véhicule (Compte 615200)
    rows.push(
      [
        dateFormatted,
        'ACH',
        '615200',
        `Entretien ${p.assetCode} - ${p.workOrderNumber}`,
        p.subtotalDzd.toFixed(2),
        '0.00',
        p.workOrderNumber,
        p.tenantFiscalIdNif || '',
        p.assetCode,
      ].join(';'),
    );

    // Ligne Débit TVA : TVA Récupérable 19% (Compte 445660)
    rows.push(
      [
        dateFormatted,
        'ACH',
        '445660',
        `TVA 19% ${p.workOrderNumber}`,
        p.taxAmountDzd.toFixed(2),
        '0.00',
        p.workOrderNumber,
        p.tenantFiscalIdNif || '',
        p.assetCode,
      ].join(';'),
    );

    // Ligne Crédit TTC : Fournisseur pièces / Compte tiers (Compte 401100)
    rows.push(
      [
        dateFormatted,
        'ACH',
        '401100',
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
   * Format Sage 100 Algérie (Format CSV paramétrable)
   */
  private formatSageCsv(p: ErpWorkOrderExportPayload): ErpExportResult {
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
    const rows = [
      [
        'HA',
        dateFormatted,
        '615000',
        p.workOrderNumber,
        `MAINTENANCE ${p.assetCode}`,
        p.subtotalDzd.toFixed(2),
        '0.00',
        p.assetCode,
      ].join(';'),
      [
        'HA',
        dateFormatted,
        '445660',
        p.workOrderNumber,
        `TVA 19% ${p.workOrderNumber}`,
        p.taxAmountDzd.toFixed(2),
        '0.00',
        p.assetCode,
      ].join(';'),
      [
        'HA',
        dateFormatted,
        '401000',
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
   * Format Odoo (Payload JSON pour endpoints xmlrpc ou controllers REST)
   * Modèles Odoo cibles: fleet.vehicle.log.services et mrp.workorder
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

