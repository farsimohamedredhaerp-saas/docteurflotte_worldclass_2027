import {
  DriverRecord,
  DriverCategory,
  DriverStatus,
  DriversKpiSummary,
  DriverCategoryFilter,
  DriverStatusFilter,
} from '../types';

/**
 * Détermine si le permis de conduire est expiré par rapport à une date de référence (défaut : aujourd'hui).
 */
export function isLicenseExpired(expiryStr: string, referenceDate: Date = new Date()): boolean {
  if (!expiryStr) return false;
  const expiry = new Date(expiryStr);
  return expiry.getTime() < referenceDate.getTime();
}

/**
 * Détermine si la visite médicale obligatoire arrive à échéance dans les X prochains jours.
 */
export function isMedicalCheckExpiringSoon(
  expiryStr: string,
  daysThreshold: number = 30,
  referenceDate: Date = new Date()
): boolean {
  if (!expiryStr) return false;
  const expiry = new Date(expiryStr);
  const diffTime = expiry.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold;
}

/**
 * Retourne le libellé officiel d'une catégorie de permis selon le Code de la Route algérien.
 */
export function formatLicenseCategoryLabel(category: DriverCategory): string {
  switch (category) {
    case 'E':
      return 'Permis E (Semi-remorques & Trains routiers)';
    case 'C2':
      return 'Permis C2 (Poids Lourds > 19t)';
    case 'C1':
      return 'Permis C1 (Porteurs 3.5t à 19t)';
    case 'D':
      return 'Permis D (Transport en commun)';
    case 'BTP_ENGIN':
      return 'CACES / Habilitation Engins BTP & Mines';
    case 'B':
      return 'Permis B (Véhicules Utilitaires Légers)';
    default:
      return `Permis ${category}`;
  }
}

/**
 * Configuration visuelle accessible du statut opérationnel du conducteur.
 */
export function getDriverStatusBadgeConfig(status: DriverStatus): {
  label: string;
  dotColor: string;
  containerClass: string;
} {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Disponible',
        dotColor: 'bg-emerald-500',
        containerClass:
          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      };
    case 'ON_DUTY':
      return {
        label: 'En Mission',
        dotColor: 'bg-blue-500',
        containerClass:
          'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      };
    case 'LICENSE_WARNING':
      return {
        label: 'Alerte Visite',
        dotColor: 'bg-amber-500',
        containerClass:
          'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      };
    case 'REST':
    default:
      return {
        label: 'Repos Légal',
        dotColor: 'bg-slate-400',
        containerClass:
          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      };
  }
}

/**
 * Moteur de filtrage pur des conducteurs.
 */
export function filterDrivers(
  drivers: DriverRecord[],
  categoryFilter: string,
  statusFilter: string,
  searchQuery: string
): DriverRecord[] {
  return drivers.filter((d) => {
    if (categoryFilter !== 'ALL') {
      if (
        categoryFilter === 'HEAVY' &&
        d.licenseCategory !== 'C1' &&
        d.licenseCategory !== 'C2' &&
        d.licenseCategory !== 'E'
      ) {
        return false;
      }
      if (categoryFilter === 'BTP' && d.licenseCategory !== 'BTP_ENGIN') {
        return false;
      }
      if (categoryFilter === 'LIGHT' && d.licenseCategory !== 'B') {
        return false;
      }
    }
    if (statusFilter !== 'ALL' && d.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        d.name.toLowerCase().includes(q) ||
        d.matriculeNumber.toLowerCase().includes(q) ||
        d.assignedVehiclePlate.toLowerCase().includes(q) ||
        d.currentSiteOrCorridor.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

/**
 * Calcul déterministe des indicateurs clés (KPIs) des effectifs.
 */
export function computeDriversKpiSummary(drivers: DriverRecord[]): DriversKpiSummary {
  let onDutyCount = 0;
  let availableCount = 0;
  let warningCount = 0;

  for (const d of drivers) {
    if (d.status === 'ON_DUTY') onDutyCount++;
    else if (d.status === 'AVAILABLE') availableCount++;
    else if (d.status === 'LICENSE_WARNING') warningCount++;
  }

  return {
    totalCount: drivers.length,
    onDutyCount,
    availableCount,
    warningCount,
  };
}
