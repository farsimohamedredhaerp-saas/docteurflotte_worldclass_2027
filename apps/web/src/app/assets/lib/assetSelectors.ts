import { Asset, AssetCategory, AssetStatus, MeterType } from '@docteurflotte/contracts';

export type TelemetryTier = 'MODE_0_DECLARATIVE' | 'MODE_1_GNSS' | 'MODE_2_CAN_J1939';

export interface AssetWithTelemetry extends Asset {
  telemetryTier?: TelemetryTier;
  canProtocolSupported?: boolean;
  traccarDeviceId?: string | number;
}

/**
 * Détermine le palier télématique d'un actif selon ses capteurs et son protocole d'ingestion.
 */
export function getTelemetryTier(asset: Asset | AssetWithTelemetry): TelemetryTier {
  const ext = asset as AssetWithTelemetry;
  if (ext.telemetryTier) {
    return ext.telemetryTier;
  }
  // Si l'actif dispose d'une jauge télématique CAN active ou est un poids lourd
  if (ext.canProtocolSupported || asset.category === AssetCategory.HEAVY_TRUCK) {
    return 'MODE_2_CAN_J1939';
  }
  // Si l'actif est équipé d'un traceur GNSS ou d'un odomètre kilométrique
  if (ext.traccarDeviceId || asset.primaryMeterType === MeterType.ODOMETER_KM) {
    return 'MODE_1_GNSS';
  }
  // Mode 0 déclaratif par défaut (reçus Naftal & DVIR offline)
  return 'MODE_0_DECLARATIVE';
}

/**
 * Retourne l'unité de mesure du compteur principal ('km' ou 'h').
 */
export function getPrimaryMeterLabel(meterType: MeterType): string {
  return meterType === MeterType.ENGINE_HOURS ? 'h' : 'km';
}

/**
 * Détecte si un actif a dépassé son échéance de maintenance préventive.
 */
export function isMaintenanceDue(asset: Asset): boolean {
  if (asset.status === AssetStatus.MAINTENANCE_REQUIRED || asset.status === AssetStatus.DOWN) {
    return true;
  }
  if (asset.nextMaintenanceMeterValue && asset.currentMeterValue !== undefined) {
    return asset.currentMeterValue >= asset.nextMaintenanceMeterValue;
  }
  return false;
}

/**
 * Calcule le pourcentage de progression vers la prochaine maintenance.
 */
export function computeMeterProgressPercent(asset: Asset): number {
  if (!asset.maintenanceIntervalValue || asset.maintenanceIntervalValue <= 0) {
    return 0;
  }
  const nextTarget = asset.nextMaintenanceMeterValue || asset.maintenanceIntervalValue;
  const current = asset.currentMeterValue || 0;
  const lastTarget = nextTarget - asset.maintenanceIntervalValue;
  const elapsed = current - lastTarget;

  if (elapsed <= 0) return 0;
  const pct = Math.round((elapsed / asset.maintenanceIntervalValue) * 100);
  return Math.min(100, Math.max(0, pct));
}

/**
 * Formate une valeur de compteur avec son unité et séparateurs de milliers.
 */
export function formatMeterValue(value: number | undefined, meterType: MeterType): string {
  if (value === undefined || value === null) return '0';
  const formatted = value.toLocaleString('fr-DZ');
  const unit = getPrimaryMeterLabel(meterType);
  return `${formatted} ${unit}`;
}

/**
 * Formate le libellé utilisateur d'une catégorie d'actif.
 */
export function formatCategoryLabel(category: AssetCategory): string {
  switch (category) {
    case AssetCategory.HEAVY_TRUCK:
      return 'Poids Lourd (Tracteur/Porteur)';
    case AssetCategory.ROAD_VEHICLE:
      return 'Véhicule Utilitaire / Léger';
    case AssetCategory.CONSTRUCTION_EQUIPMENT:
      return 'Engin BTP / Minier';
    case AssetCategory.INDUSTRIAL_MACHINE:
      return 'Machine Industrielle';
    case AssetCategory.TECHNICAL_DEVICE:
      return 'Dispositif Technique';
    case AssetCategory.OTHER:
      return 'Autre Équipement';
    default:
      return String(category);
  }
}
