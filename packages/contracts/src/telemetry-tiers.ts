import { z } from 'zod';

export enum TelemetryTier {
  MODE_0_DECLARATIVE = 'MODE_0_DECLARATIVE',
  MODE_1_GNSS = 'MODE_1_GNSS',
  MODE_2_CAN_J1939 = 'MODE_2_CAN_J1939',
}

export const TelemetryTierSchema = z.nativeEnum(TelemetryTier);

export interface TelemetryTierCapabilities {
  tier: TelemetryTier;
  labelFr: string;
  labelDarja: string;
  supportsCusumFuelSiphonExact: boolean;
  supportsArrheniusRealtimeOilTemp: boolean;
  supportsValhallaTopographicReconciliation: boolean;
  supportsJ1939EngineLoad: boolean;
  supportsDvirOfflinePwa: boolean;
  supportsErpWorkOrderExport: boolean;
  supportsDirectTorqueLookup: boolean;
  descriptionFr: string;
}

export const TELEMETRY_TIER_CAPABILITIES: Record<TelemetryTier, TelemetryTierCapabilities> = {
  [TelemetryTier.MODE_0_DECLARATIVE]: {
    tier: TelemetryTier.MODE_0_DECLARATIVE,
    labelFr: 'Mode 0 — Déclaratif & Logistique (Zéro Boîtier)',
    labelDarja: 'Mode 0 — Bla boîtier (Naftal w Papiers)',
    supportsCusumFuelSiphonExact: false, // Pas de détection de siphonnage au litre près en déclaratif pur
    supportsArrheniusRealtimeOilTemp: false, // Arrhenius estimé par climat wilaya uniquement
    supportsValhallaTopographicReconciliation: true, // Réconciliation odomètre vs réseau routier Valhalla
    supportsJ1939EngineLoad: false,
    supportsDvirOfflinePwa: true,
    supportsErpWorkOrderExport: true,
    supportsDirectTorqueLookup: true,
    descriptionFr: 'Exploitation sans boîtier IoT. Basé sur les relevés Naftal, saisies DVIR et routage Valhalla.',
  },
  [TelemetryTier.MODE_1_GNSS]: {
    tier: TelemetryTier.MODE_1_GNSS,
    labelFr: 'Mode 1 — GNSS Standard (Position, Vitesse, Corridors)',
    labelDarja: 'Mode 1 — GPS Standard (Tracé w Sor3a)',
    supportsCusumFuelSiphonExact: false, // Macro-détection possible si sonde additionnelle, mais pas de CAN direct
    supportsArrheniusRealtimeOilTemp: false,
    supportsValhallaTopographicReconciliation: true,
    supportsJ1939EngineLoad: false,
    supportsDvirOfflinePwa: true,
    supportsErpWorkOrderExport: true,
    supportsDirectTorqueLookup: true,
    descriptionFr: 'Boîtier GPS classique. Tracé haute fréquence, corridors 58 Wilayas et détection de sur-vitesse.',
  },
  [TelemetryTier.MODE_2_CAN_J1939]: {
    tier: TelemetryTier.MODE_2_CAN_J1939,
    labelFr: 'Mode 2 — Full CAN / J1939 (Télémétrie Moteur Profonde)',
    labelDarja: 'Mode 2 — CAN Moteur Kamel (Zit, Skhouna w Jauge)',
    supportsCusumFuelSiphonExact: true, // CUSUM haute résolution compensé en pente Valhalla
    supportsArrheniusRealtimeOilTemp: true, // Arrhenius sur température réelle d'huile (SPN 175)
    supportsValhallaTopographicReconciliation: true,
    supportsJ1939EngineLoad: true, // Couple SPN 513 et régime SPN 190
    supportsDvirOfflinePwa: true,
    supportsErpWorkOrderExport: true,
    supportsDirectTorqueLookup: true,
    descriptionFr: 'Boîtier connecté au bus CAN/J1939. Détection siphonnage infaillible, températures et usures physiques réelles.',
  },
};

export function getTelemetryTierCapabilities(tier: TelemetryTier | string | undefined | null): TelemetryTierCapabilities {
  if (!tier || !(tier in TELEMETRY_TIER_CAPABILITIES)) {
    return TELEMETRY_TIER_CAPABILITIES[TelemetryTier.MODE_0_DECLARATIVE];
  }
  return TELEMETRY_TIER_CAPABILITIES[tier as TelemetryTier];
}

export function assertTierSupportsFeature(
  tier: TelemetryTier,
  feature: keyof Omit<TelemetryTierCapabilities, 'tier' | 'labelFr' | 'labelDarja' | 'descriptionFr'>,
  assetCode?: string,
): void {
  const caps = getTelemetryTierCapabilities(tier);
  if (!caps[feature]) {
    throw new Error(
      `[Honnêteté Palier Télématique] L'actif ${assetCode || ''} est en palier ${tier} qui ne supporte pas la fonctionnalité "${String(feature)}". Équipement requis supérieur.`,
    );
  }
}

