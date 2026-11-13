import { z } from 'zod';

export enum ErpExportFormat {
  ODOO_JSON = 'ODOO_JSON',
  SAP_REST_JSON = 'SAP_REST_JSON',
  SAGE_CSV = 'SAGE_CSV',
  PC_COMPTA_CSV = 'PC_COMPTA_CSV',
}

export const ErpExportFormatSchema = z.nativeEnum(ErpExportFormat);

export const ErpWorkOrderLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  itemType: z.enum(['PART', 'LABOR', 'EXTERNAL_SERVICE']),
  partNumberOem: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitOfMeasure: z.string().default('U'), // 'U', 'L', 'H'
  unitPriceDzd: z.number().nonnegative(),
  taxRatePercent: z.number().nonnegative().default(19.0), // TVA Algérie 19%
  totalLineDzd: z.number().nonnegative(),
});

export type ErpWorkOrderLine = z.infer<typeof ErpWorkOrderLineSchema>;

export const ErpWorkOrderExportPayloadSchema = z.object({
  exportFormat: ErpExportFormatSchema,
  exportedAt: z.string(),
  exportBatchId: z.string().uuid(),
  tenantId: z.string().uuid(),
  tenantFiscalIdNif: z.string().optional(), // NIF Entreprise algérienne
  workOrderId: z.string().uuid(),
  workOrderNumber: z.string().min(1),       // ex: 'OT-2026-0842'
  assetId: z.string().uuid(),
  assetCode: z.string().min(1),             // Matricule ou Code Parc
  assetVin: z.string().optional(),
  currentOdometerKm: z.number().nonnegative(),
  currentEngineHours: z.number().nonnegative().optional(),
  technicianName: z.string().min(1),
  workOrderType: z.string().default('PREVENTIVE_MAINTENANCE_5_0'),
  priority: z.string(),
  closedLoopResetAlgorithm: z.string().optional(),
  lines: z.array(ErpWorkOrderLineSchema).min(1),
  subtotalDzd: z.number().nonnegative(),
  taxAmountDzd: z.number().nonnegative(),
  totalDzd: z.number().nonnegative(),
  integritySha256: z.string().length(64),
});

export type ErpWorkOrderExportPayload = z.infer<typeof ErpWorkOrderExportPayloadSchema>;

export interface ErpExportResult {
  format: ErpExportFormat;
  filename: string;
  mimeType: string;
  content: string; // Plain text / CSV ou JSON stringifié
  integrityHash: string;
  linesCount: number;
  totalAmountDzd: number;
}

