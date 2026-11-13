import { ErpIntegrationExportService } from './erp-integration-export.service';
import { ErpExportFormat } from '@docteurflotte/contracts';

describe('ErpIntegrationExportService', () => {
  let service: ErpIntegrationExportService;

  beforeEach(() => {
    service = new ErpIntegrationExportService();
  });

  const sampleWorkOrder = {
    exportBatchId: 'e2a5f573-04bc-4679-b14e-f2dbf88c8052',
    tenantId: '1a56110a-e325-4fc1-a9f7-640a24ef5455',
    tenantFiscalIdNif: '001616098765432',
    workOrderId: '3b879c29-37e4-4d83-99b3-ecae98e29dc1',
    workOrderNumber: 'OT-2026-1042',
    assetId: '4c98ab38-23e5-4a61-9c12-3498acde1200',
    assetCode: '16-118-09',
    currentOdometerKm: 185200,
    technicianName: 'Mourad Chef Atelier',
    workOrderType: 'PREVENTIVE_MAINTENANCE_5_0',
    priority: 'HIGH',
    lines: [
      {
        lineNumber: 1,
        itemType: 'PART' as const,
        partNumberOem: 'WEICHAI-612600081334',
        description: 'Filtre à huile Weichai Heavy Duty',
        quantity: 2,
        unitOfMeasure: 'U',
        unitPriceDzd: 4200.0,
        taxRatePercent: 19.0,
        totalLineDzd: 8400.0,
      },
      {
        lineNumber: 2,
        itemType: 'PART' as const,
        partNumberOem: 'NAFTAL-LUB-15W40',
        description: 'Huile Naftal Chems 15W40 CI-4 (Vrac)',
        quantity: 36,
        unitOfMeasure: 'L',
        unitPriceDzd: 450.0,
        taxRatePercent: 19.0,
        totalLineDzd: 16200.0,
      },
      {
        lineNumber: 3,
        itemType: 'LABOR' as const,
        description: 'Main d oeuvre vidange et contrôle 5.0',
        quantity: 3.5,
        unitOfMeasure: 'H',
        unitPriceDzd: 1800.0,
        taxRatePercent: 19.0,
        totalLineDzd: 6300.0,
      },
    ],
  };

  it('doit générer un export PC Compta CSV conforme au plan comptable algérien (Comptes 615, 4456, 401)', () => {
    const result = service.exportWorkOrder({
      ...sampleWorkOrder,
      exportFormat: ErpExportFormat.PC_COMPTA_CSV,
      exportedAt: '2026-11-04T10:00:00Z',
    });

    expect(result.format).toBe(ErpExportFormat.PC_COMPTA_CSV);
    expect(result.mimeType).toContain('text/csv');
    expect(result.totalAmountDzd).toBe(36771.0); // (8400 + 16200 + 6300) * 1.19 = 30900 * 1.19 = 36771
    expect(result.content).toContain('615200'); // Débit Entretien
    expect(result.content).toContain('445660'); // Débit TVA 19%
    expect(result.content).toContain('401100'); // Crédit Fournisseur
    expect(result.content).toContain('OT-2026-1042');
    expect(result.content).toContain('001616098765432'); // NIF
    expect(result.integrityHash).toHaveLength(64);
  });

  it('doit générer un export JSON conforme aux webservices Odoo Fleet & Services', () => {
    const result = service.exportWorkOrder({
      ...sampleWorkOrder,
      exportFormat: ErpExportFormat.ODOO_JSON,
      exportedAt: '2026-11-04T10:00:00Z',
    });

    expect(result.format).toBe(ErpExportFormat.ODOO_JSON);
    expect(result.mimeType).toBe('application/json');

    const parsed = JSON.parse(result.content);
    expect(parsed.model).toBe('fleet.vehicle.log.services');
    expect(parsed.values.vehicle_license_plate).toBe('16-118-09');
    expect(parsed.values.service_lines).toHaveLength(3);
    expect(parsed.values.amount).toBe(30900);
    expect(parsed.values.total_amount_dzd).toBe(36771);
  });

  it('doit générer un export SAP PM standard REST JSON', () => {
    const result = service.exportWorkOrder({
      ...sampleWorkOrder,
      exportFormat: ErpExportFormat.SAP_REST_JSON,
      exportedAt: '2026-11-04T10:00:00Z',
    });

    expect(result.format).toBe(ErpExportFormat.SAP_REST_JSON);
    const parsed = JSON.parse(result.content);
    expect(parsed.d.MaintenanceOrder).toBe('OT-2026-1042');
    expect(parsed.d.Currency).toBe('DZD');
    expect(parsed.d.Components).toHaveLength(3);
  });
});

