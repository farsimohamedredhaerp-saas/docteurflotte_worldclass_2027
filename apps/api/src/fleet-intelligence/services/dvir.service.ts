import { Injectable, Logger } from '@nestjs/common';
import {
  DVIRInspectionReport,
  DVIRInspectionType,
  DVIRItemStatus,
  DVIRSubmissionDto,
} from '@docteurflotte/contracts';

@Injectable()
export class DvirService {
  private readonly logger = new Logger(DvirService.name);
  private readonly reportsStore: DVIRInspectionReport[] = [];
  private readonly maxReportsPerTenant = 250;

  submitReport(dto: DVIRSubmissionDto, tenantId: string = 'tenant-demo'): DVIRInspectionReport {
    const hasCriticalFailures = dto.items.some(
      (item) => item.status === DVIRItemStatus.FAIL_CRITICAL,
    );
    const isCompliant = !hasCriticalFailures;

    let generatedWorkOrderId: string | undefined = undefined;

    if (hasCriticalFailures) {
      generatedWorkOrderId = `ot-dvir-${Date.now().toString().slice(-6)}`;
      this.logger.warn(
        `[DVIR CRITIQUE] Actif ${dto.assetId} recalé par l'inspection ${dto.inspectionType}. Ordre de travail généré : ${generatedWorkOrderId}`,
      );
    }

    const report: DVIRInspectionReport = {
      id: `dvir-${Date.now().toString().slice(-6)}`,
      tenantId,
      assetId: dto.assetId,
      assetCode: `DZ-${dto.assetId.slice(-4).toUpperCase()}`,
      assetName: `Véhicule ${dto.assetId}`,
      driverId: dto.driverId,
      driverName: dto.driverName,
      inspectionType: dto.inspectionType,
      isCompliant,
      hasCriticalFailures,
      odometerKm: dto.odometerKm,
      items: dto.items,
      generatedWorkOrderId,
      submittedAt: dto.submittedAt || new Date().toISOString(),
    };

    this.reportsStore.unshift(report);
    if (this.reportsStore.length > this.maxReportsPerTenant * 10) {
      this.reportsStore.pop();
    }
    return report;
  }

  getReportsByAsset(assetId: string, tenantId?: string): DVIRInspectionReport[] {
    return this.reportsStore.filter(
      (r) => r.assetId === assetId && (!tenantId || r.tenantId === tenantId),
    );
  }

  getRecentReports(tenantId: string = 'tenant-demo'): DVIRInspectionReport[] {
    const tenantReports = this.reportsStore.filter((r) => r.tenantId === tenantId);
    if (tenantReports.length === 0) {
      const demoOdoA = 185.4 * 1000;
      const demoOdoB = 94.2 * 1000;
      return [
        {
          id: 'dvir-demo-01',
          tenantId,
          assetId: 'ast-t480-01',
          assetCode: 'DZ-T480-16',
          assetName: 'Renault Trucks T 480',
          driverId: 'drv-01',
          driverName: 'Mourad Belkacem',
          inspectionType: DVIRInspectionType.PRE_TRIP,
          isCompliant: true,
          hasCriticalFailures: false,
          odometerKm: demoOdoA,
          items: [
            { code: 'TIRES', category: 'TIRES_BRAKES', label: 'État et pression des pneus', status: DVIRItemStatus.PASS },
            { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Frein de service et de parc', status: DVIRItemStatus.PASS },
            { code: 'OIL_LEVEL', category: 'MECHANICAL', label: 'Niveau huile moteur', status: DVIRItemStatus.PASS },
            { code: 'FIRE_EXT', category: 'SAFETY_EQUIPMENT', label: 'Extincteur vérifié à jour', status: DVIRItemStatus.PASS },
            { code: 'ENACTA_DOC', category: 'REGULATORY_DOCS', label: 'PV Contrôle ENACTA en cabine', status: DVIRItemStatus.PASS },
          ],
          submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: 'dvir-demo-02',
          tenantId,
          assetId: 'ast-x3000-02',
          assetCode: 'DZ-X3000-31',
          assetName: 'Shacman X3000 6x4',
          driverId: 'drv-03',
          driverName: 'Sofiane Feghouli',
          inspectionType: DVIRInspectionType.PRE_TRIP,
          isCompliant: false,
          hasCriticalFailures: true,
          odometerKm: demoOdoB,
          items: [
            { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneu AVG hernie profonde', status: DVIRItemStatus.FAIL_CRITICAL, comment: 'Coupure flanc pneu avant gauche suite chantier' },
            { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Freinage pneumatique', status: DVIRItemStatus.PASS },
            { code: 'OIL_LEVEL', category: 'MECHANICAL', label: 'Niveau huile', status: DVIRItemStatus.PASS },
            { code: 'FIRE_EXT', category: 'SAFETY_EQUIPMENT', label: 'Extincteur', status: DVIRItemStatus.PASS },
            { code: 'ENACTA_DOC', category: 'REGULATORY_DOCS', label: 'PV Contrôle ENACTA', status: DVIRItemStatus.PASS },
          ],
          generatedWorkOrderId: 'ot-dvir-99104',
          submittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
      ];
    }
    return tenantReports.slice(0, this.maxReportsPerTenant);
  }
}
