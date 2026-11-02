import { Injectable, Logger } from '@nestjs/common';
import {
  DVIRChecklistItem,
  DVIRInspectionReport,
  DVIRInspectionType,
  DVIRItemStatus,
  DVIRResolveBlockDto,
  DVIRResolveBlockResult,
  DVIRSubmissionDto,
  DVIRSyncBatchDto,
  DVIRSyncBatchResult,
} from '@docteurflotte/contracts';

@Injectable()
export class DvirService {
  private readonly logger = new Logger(DvirService.name);
  private readonly reportsStore: DVIRInspectionReport[] = [];
  private readonly maxReportsPerTenant = 250;

  submitReport(dto: DVIRSubmissionDto, tenantId: string = 'tenant-demo'): DVIRInspectionReport {
    // Vérifier idempotence sur assetId + submittedAt
    const submittedAt = dto.submittedAt || new Date().toISOString();
    const existing = this.reportsStore.find(
      (r) =>
        r.tenantId === tenantId &&
        r.assetId === dto.assetId &&
        r.submittedAt === submittedAt,
    );
    if (existing) {
      this.logger.log(`[DVIR IDEMPOTENT] Rapport déjà ingéré pour l'actif ${dto.assetId} à ${submittedAt}.`);
      return existing;
    }

    const hasCriticalFailures = (dto.items || []).some((item: DVIRChecklistItem) => {
      const legacyItem = item as DVIRChecklistItem & { severity?: string };
      return item.status === DVIRItemStatus.FAIL_CRITICAL || legacyItem.severity === 'CRITICAL';
    });
    const isCompliant = !hasCriticalFailures;

    let generatedWorkOrderId: string | undefined = undefined;

    if (hasCriticalFailures) {
      generatedWorkOrderId = `ot-dvir-${dto.assetId}-${Date.parse(submittedAt).toString().slice(-6)}`;
      this.logger.warn(
        `[DVIR CRITIQUE] Actif ${dto.assetId} recalé par l'inspection ${dto.inspectionType}. Ordre de travail généré : ${generatedWorkOrderId}`,
      );
    }

    const report: DVIRInspectionReport = {
      id: `dvir-${Date.parse(submittedAt).toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
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
      signatureDataUrl: dto.signatureDataUrl,
      generatedWorkOrderId,
      submittedAt,
    };

    this.reportsStore.unshift(report);
    if (this.reportsStore.length > this.maxReportsPerTenant * 10) {
      this.reportsStore.pop();
    }
    return report;
  }

  /**
   * Synchronisation en rafale différée des fiches DVIR prises en mode hors-ligne
   * Respecte le contrat Store-and-Forward : tri chronologique par device_timestamp
   * pour éviter d'écraser un état récent par un état antérieur.
   */
  syncOfflineReports(dto: DVIRSyncBatchDto, tenantId: string = 'tenant-demo'): DVIRSyncBatchResult {
    const rawReports = dto.reports || [];
    this.logger.log(
      `[DVIR STORE-AND-FORWARD] Réception d'un lot de ${rawReports.length} fiches hors-ligne (Device: ${dto.syncDeviceId || 'PWA-Offline'})`,
    );

    // Tri chronologique strict croissant selon le timestamp de l'appareil
    const sortedSubmissions = [...rawReports].sort((a, b) => {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return timeA - timeB;
    });

    const processedReports: DVIRInspectionReport[] = [];
    const generatedWorkOrderIds: string[] = [];

    for (const sub of sortedSubmissions) {
      const report = this.submitReport(sub, tenantId);
      processedReports.push(report);
      if (report.generatedWorkOrderId && !generatedWorkOrderIds.includes(report.generatedWorkOrderId)) {
        generatedWorkOrderIds.push(report.generatedWorkOrderId);
      }
    }

    const criticalCount = processedReports.filter((r) => r.hasCriticalFailures).length;

    return {
      totalReceived: rawReports.length,
      syncedCount: processedReports.length,
      criticalFailuresCount: criticalCount,
      generatedWorkOrderIds,
      processedReports,
    };
  }

  /**
   * Vérifie si un véhicule est actuellement sous interdiction de départ DVIR
   */
  hasActiveCriticalDvirBlock(assetId: string, tenantId: string = 'tenant-demo'): boolean {
    const assetReports = this.getReportsByAsset(assetId, tenantId);
    if (assetReports.length === 0) return false;
    // Les rapports sont triés par récence (unshift)
    const latest = assetReports[0];
    return latest.hasCriticalFailures;
  }

  /**
   * Clôture / Levée de consignation suite à intervention certifiée d'atelier.
   * Réconcilie l'Ordre de Travail avec le rapport d'inspection DVIR défaillant.
   */
  resolveDvirBlock(
    assetId: string,
    workOrderId?: string,
    tenantId: string = 'tenant-demo',
    resolutionNotes?: string,
  ): DVIRResolveBlockResult {
    const unblockedAt = new Date().toISOString();
    let resolved = false;

    // Récupérer tous les rapports de l'actif pour ce tenant ayant des défaillances critiques actives
    const reportsToResolve = this.reportsStore.filter(
      (r) => r.tenantId === tenantId && r.assetId === assetId && r.hasCriticalFailures,
    );

    for (const rep of reportsToResolve) {
      rep.hasCriticalFailures = false;
      rep.isCompliant = true;
      rep.resolvedAt = unblockedAt;
      rep.resolvedByWorkOrderId = workOrderId || rep.generatedWorkOrderId;
      rep.resolutionNotes = resolutionNotes || 'Anomalie critique résolue et certifiée conforme par l\'atelier.';
      resolved = true;
    }

    if (resolved) {
      this.logger.log(
        `[LEVÉE CONSIGNATION DVIR] Actif ${assetId} déconsigné suite à clôture OT ${workOrderId || 'ATELIER'}. Prêt pour réaffectation dispatch TOPSIS.`,
      );
    } else {
      this.logger.log(
        `[DVIR AUCUN BLOCAGE] Aucun blocage critique actif à lever pour l'actif ${assetId} (Tenant: ${tenantId}).`,
      );
    }

    const activeBlockRemaining = this.hasActiveCriticalDvirBlock(assetId, tenantId);

    return {
      resolved,
      assetId,
      unblockedAt,
      resolvedWorkOrderId: workOrderId,
      activeBlockRemaining,
    };
  }

  getReportsByAsset(assetId: string, tenantId?: string): DVIRInspectionReport[] {
    return this.reportsStore.filter(
      (r) => r.assetId === assetId && (!tenantId || r.tenantId === tenantId),
    );
  }

  clearStore(): void {
    this.reportsStore.length = 0;
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
