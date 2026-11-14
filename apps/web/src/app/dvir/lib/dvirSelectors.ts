import {
  DVIRChecklistItem,
  DVIRItemStatus,
  DVIRInspectionReport,
  DvirKpiSummary,
} from '../types';

/**
 * Détermine si au moins un point d'inspection présente une défaillance critique (immobilisation requise).
 */
export function hasCriticalFailure(items: DVIRChecklistItem[]): boolean {
  return items.some((item) => item.status === DVIRItemStatus.FAIL_CRITICAL);
}

/**
 * Comptabilise les défaillances par niveau de sévérité.
 */
export function countChecklistDefects(items: DVIRChecklistItem[]): {
  pass: number;
  minor: number;
  critical: number;
} {
  let pass = 0;
  let minor = 0;
  let critical = 0;

  for (const item of items) {
    if (item.status === DVIRItemStatus.PASS) pass++;
    else if (item.status === DVIRItemStatus.FAIL_MINOR) minor++;
    else if (item.status === DVIRItemStatus.FAIL_CRITICAL) critical++;
  }

  return { pass, minor, critical };
}

/**
 * Détermine si l'inspection est conforme pour départ immédiat (zéro défaut critique).
 */
export function isInspectionCompliant(items: DVIRChecklistItem[]): boolean {
  return !hasCriticalFailure(items);
}

/**
 * Calcule les indicateurs clés de performance (KPIs) des rapports DVIR.
 */
export function computeDvirKpis(reports: DVIRInspectionReport[]): DvirKpiSummary {
  let passCount = 0;
  let criticalCount = 0;

  for (const r of reports) {
    if (r.isCompliant && !r.hasCriticalFailures) {
      passCount++;
    }
    if (r.hasCriticalFailures) {
      criticalCount++;
    }
  }

  return {
    totalCount: reports.length,
    passCount,
    criticalCount,
  };
}
