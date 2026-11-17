/**
 * Contrats du Moteur de Règles Déterministes & Paramétrage Dynamique (Zéro Hardcode)
 * RÈGLE D'INGÉNIERIE ABSOLUE :
 * Aucun taux fiscal, seuil de température, durée de ralenti ou tolérance ne doit être codé en dur.
 * Toutes les variables sont gérées via les configurations SuperAdmin (National DZ) et Tenant.
 */

export type EngineRuleCategory =
  | 'FISCAL'
  | 'TELEMATICS_PHYSICS'
  | 'REGULATORY'
  | 'PROCUREMENT_WORKSHOP';

export type EngineRuleCode =
  // Pilier 1 : Fiscal & Comptable
  | 'RULE_09_RAS'
  | 'RULE_10_GUARANTEE_WITHHOLDING'
  | 'RULE_11_STAMP_DUTY'
  | 'RULE_12_F20_FRANCHISE'
  | 'RULE_13_VAT_FORFEITURE'
  // Pilier 2 : Télématique & Physique
  | 'RULE_T01_CUSUM'
  | 'RULE_T02_GHOST_REFUEL'
  | 'RULE_T03_CYLINDER_HEAD'
  | 'RULE_T04_IDLE_WASTE'
  | 'RULE_T05_CLUTCH_SLIP'
  // Pilier 3 : Réglementaire & Sécurité
  | 'RULE_R01_ENACTA'
  | 'RULE_R02_DRIVING_HOURS'
  | 'RULE_R03_COLD_CHAIN'
  // Pilier 4 : Achats & Atelier
  | 'RULE_A01_THREE_WAY_MATCH'
  | 'RULE_A02_SPARE_PARTS_SERIAL'
  | 'RULE_A03_ODOMETER_CHECK';

export interface EngineRuleConfigEntry<T = unknown> {
  id?: string;
  tenantId?: string | null; // null = Paramètre Global National (Pack Algérie SuperAdmin)
  ruleCategory: EngineRuleCategory;
  ruleCode: EngineRuleCode;
  paramKey: string;
  paramValue: T;
  isLockedByLaw: boolean; // Si true, verrouillé par la loi d'ordre public (inviolable par le tenant)
  description?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StampDutyBracket {
  min: number;
  max: number | null;
  rate: number;
}

// Paramètres typés par règle
export interface FiscalRasParams {
  rasDefaultRate: number; // 0.30 (Art. 156 CIDTA)
  vatReverseChargeRate: number; // 0.19 (Art. 83 CTCA)
  accountRas: string; // '447200'
  accountVatReciprocalDeductible: string; // '445660'
  accountVatReciprocalDue: string; // '445760'
}

export interface GuaranteeWithholdingParams {
  guaranteeWithholdingRate: number; // 0.05 (Décret 15-247)
  guaranteeReleaseMonths: number; // 12 mois
  accountGuarantee: string; // '411700'
  accountVatPending: string; // '445780'
}

export interface StampDutyParams {
  cashTaxDeductionCeilingDzd: number; // 1 000 000 DZD (Art. 169 CIDTA)
  stampDutyBrackets: StampDutyBracket[]; // Art. 258 Code du Timbre
  stampDutyMinDzd: number; // 5 DZD
  stampDutyMaxDzd: number; // 10 000 DZD
  accountStampDuty: string; // '445790'
}

export interface F20FranchiseParams {
  f20ValidationEnforced: boolean; // true
  f20CheckAmountCeiling: boolean; // true
}

export interface VatForfeitureParams {
  vatForfeitureDeadlineMonth: number; // 12 (Décembre)
  vatForfeitureDeadlineDay: number; // 20
  vatForfeitureAdditionalYears: number; // 1 (N+1, Art. 34 CTCA)
}

export interface TelematicsCusumParams {
  fuelThermalExpansionCoeff: number; // 0.00083 / °C
  cusumSensitivityKLiters: number; // 3.5 L
  cusumThresholdHLiters: number; // 15.0 L
  topographicPitchToleranceDeg: number; // 2.5°
}

export interface GhostRefuelParams {
  tankCapacityOverflowTolerancePct: number; // 0.03 (3%)
  valhallaSpeedViolationThresholdKmh: number; // 115.0 km/h
}

export interface CylinderHeadProtectionParams {
  engineTempDeltaThresholdCelsius: number; // 30.0 °C
  engineCoolantCriticalCelsius: number; // 103.0 °C
  engineCoolantGradientThreshold: number; // 0.15 °C/s
  engineTempSustainSeconds: number; // 180 s
}

export interface IdleWasteParams {
  idleRpmMin: number; // 550 RPM
  idleRpmMax: number; // 850 RPM
  idleMaxAllowedMinutes: number; // 20 min
}

export interface ClutchSlipParams {
  clutchSlipEngineLoadPct: number; // 70%
  clutchSlipRatioTolerancePct: number; // 8%
  clutchSlipDurationSeconds: number; // 5.0 s
}

export interface EnactaParams {
  enactaPeriodicityMonthsByCategory: Record<string, number>; // VL: 12, VUL: 6, PL: 6, TMD: 6
  dispatchLockOnExpiry: boolean; // true
  enactaAlertDaysBefore: number[]; // [30, 15, 7]
}

export interface DrivingHoursParams {
  maxContinuousDrivingMinutes: number; // 270 (4h30)
  minBreakDurationMinutes: number; // 45
  maxDailyDrivingHours: number; // 9
  minDailyRestHours: number; // 11
}

export interface ColdChainParams {
  coldChainDoorSensorEnforced: boolean; // true
  coldChainThermalInertiaMinutes: number; // 25
  coldChainTempToleranceCelsius: number; // 2.0 °C
}

export interface ThreeWayMatchParams {
  threeWayMatchingQtyTolerancePct: number; // 0.0%
  threeWayMatchingRoundingToleranceDzd: number; // 1.00 DZD
  requireNifActiveStatusBeforePo: boolean; // true
}

export interface SparePartsSerialParams {
  sparePartsAbnormalConsumptionFactor: number; // 2.5x
  serializedTrackingCategories: string[]; // ['PNEUMATIQUE', 'BATTERIE', 'INJECTEUR', 'TURBOCOMPRESSEUR', 'FILTRE_FAP']
  blockWoCloseIfSerialMismatch: boolean; // true
}

export interface OdometerCheckParams {
  odometerVarianceAllowedKm: number; // 50 km
  photoProofRequiredOnVariance: boolean; // true
}

export interface UpdateEngineRuleParamDto {
  ruleCategory: EngineRuleCategory;
  ruleCode: EngineRuleCode;
  paramKey: string;
  paramValue: unknown;
  description?: string;
}

export interface BatchUpdateEngineRulesDto {
  params: UpdateEngineRuleParamDto[];
}

