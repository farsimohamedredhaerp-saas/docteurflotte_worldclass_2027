/**
 * Pack Réglementaire, Arbitrage Financier (DZD) & Continuité Opérationnelle Algérie
 * Conforme à MASTER_SPEC.md v2.0+ (Section 5) & AGENTS.md v3.0 (World-Class DZ-First)
 * 
 * Références Légales & Réglementaires Opposables :
 * - Décret exécutif n° 03-223 du 10 juin 2003 (Contrôle technique automobile ENACTA)
 * - Ordonnance n° 03-12 du 26 août 2003 (Assurance obligatoire CatNat et RC automobile)
 * - Décret exécutif n° 16-235 du 6 septembre 2016 (Brevet Professionnel de Conducteur - BPC)
 * - Arrêté interministériel des tarifs Naftal (Gasoil 29.01 DA, Essence 45.97 DA, Sirghaz 9.00 DA)
 * - Code des Impôts Directs et Taxes Assimilées (NIF, NIS, RC, AI, TVA 19%, Timbre fiscal progressif)
 */

export enum EnactaVehicleCategory {
  HEAVY_TRUCK_RIGID = 'HEAVY_TRUCK_RIGID',
  TRACTOR_TRAILER = 'TRACTOR_TRAILER',
  BUS_PUBLIC_TRANSPORT = 'BUS_PUBLIC_TRANSPORT',
  HAZMAT_TANKER = 'HAZMAT_TANKER',
  REEFER_TRUCK = 'REEFER_TRUCK',
  COMMERCIAL_VAN_VUL = 'COMMERCIAL_VAN_VUL',
  LIGHT_PASSENGER = 'LIGHT_PASSENGER',
}

export enum ClimateZoneDZType {
  TELL_URBAN = 'TELL_URBAN',
  HIGH_PLATEAUS = 'HIGH_PLATEAUS',
  SAHARA_SOUTH = 'SAHARA_SOUTH',
}

export enum DispatchState {
  AVAILABLE = 'AVAILABLE',
  IN_MISSION = 'IN_MISSION',
  MAINTENANCE_WARN = 'MAINTENANCE_WARN',
  BLOCKED_SAFETY = 'BLOCKED_SAFETY',
  BLOCKED_REGULATORY = 'BLOCKED_REGULATORY',
}

export interface RegulatoryRuleMetadata {
  ruleCode: string;
  legalReference: string;
  periodicityMonths: number;
  preAlertDays: number[];
  blockingAction: DispatchState;
  sanctionDescriptionFr: string;
  sanctionDescriptionAr: string;
}

export const ENACTA_REGULATORY_MATRIX: Record<EnactaVehicleCategory, RegulatoryRuleMetadata> = {
  [EnactaVehicleCategory.HEAVY_TRUCK_RIGID]: {
    ruleCode: 'ENACTA-PL-6M',
    legalReference: 'Décret exécutif 03-223 Art. 7',
    periodicityMonths: 6,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Immobilisation administrative et mise en fourrière (Poids Lourd > 3.5T)',
    sanctionDescriptionAr: 'حجز إداري وتوقيف في المحشر (مركبة ذات وزن ثقيل > 3.5 طن)',
  },
  [EnactaVehicleCategory.TRACTOR_TRAILER]: {
    ruleCode: 'ENACTA-TT-6M',
    legalReference: 'Décret exécutif 03-223 Art. 7',
    periodicityMonths: 6,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Immobilisation administrative et mise en fourrière (Tracteur routier semi-remorque)',
    sanctionDescriptionAr: 'حجز إداري وتوقيف في المحشر (جرار طريقي نصف مقطورة)',
  },
  [EnactaVehicleCategory.BUS_PUBLIC_TRANSPORT]: {
    ruleCode: 'ENACTA-BUS-6M',
    legalReference: 'Décret exécutif 03-223 Art. 8',
    periodicityMonths: 6,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Retrait immédiat de l autorisation de circuler (Transport de personnes)',
    sanctionDescriptionAr: 'سحب فوري لرخصة السير (نقل الأشخاص والمسافرين)',
  },
  [EnactaVehicleCategory.HAZMAT_TANKER]: {
    ruleCode: 'ENACTA-HAZMAT-6M',
    legalReference: 'Décret 03-223 & Arrêté interministériel TMD',
    periodicityMonths: 6,
    preAlertDays: [45, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Interdiction absolue de chargement en raffinerie / centre de distribution Naftal',
    sanctionDescriptionAr: 'منع بات من الشحن بمصافي ومستودعات نفطال وسوناطراك',
  },
  [EnactaVehicleCategory.REEFER_TRUCK]: {
    ruleCode: 'ENACTA-REEFER-6M',
    legalReference: 'Décret 03-223 & Norme ATP Froid',
    periodicityMonths: 6,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Interdiction de transport sous température dirigée et mise en fourrière',
    sanctionDescriptionAr: 'منع نقل المواد الحساسة لدرجة الحرارة والحجز',
  },
  [EnactaVehicleCategory.COMMERCIAL_VAN_VUL]: {
    ruleCode: 'ENACTA-VUL-12M',
    legalReference: 'Décret exécutif 03-223 Art. 9',
    periodicityMonths: 12,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Amende légale et défaut d opposabilité de l assurance en cas de sinistre',
    sanctionDescriptionAr: 'غرامة مالية وعدم سريان التأمين في حال وقوع حادث',
  },
  [EnactaVehicleCategory.LIGHT_PASSENGER]: {
    ruleCode: 'ENACTA-VL-12M',
    legalReference: 'Décret exécutif 03-223 Art. 10',
    periodicityMonths: 12,
    preAlertDays: [15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Défaut de contrôle technique obligatoire après 2 ans d âge',
    sanctionDescriptionAr: 'مخالفة عدم إجراء الفحص التقني الإجباري بعد سنتين من السير',
  },
};

/**
 * Barème des Carburants Officiels Naftal Algérie (DZD / Litre)
 * Aligné sur la table administrable platform_fiscal_fuel_prices (Loi de Finances en vigueur)
 */
export const NAFTAL_FUEL_PRICES_DZD = {
  GASOIL: 31.00,
  ESSENCE_SANS_PLOMB: 47.00,
  SIRGHAZ_GPL: 12.00,
} as const;

/**
 * Résout le tarif officiel de carburant en priorisant la configuration dynamique de l'organisation
 */
export function resolveFuelPrice(
  fuelType: string,
  dynamicTariffs?: Record<string, number> | null,
): number {
  const norm = fuelType.toUpperCase();
  if (dynamicTariffs && dynamicTariffs[norm] !== undefined) {
    return dynamicTariffs[norm];
  }
  if (norm.includes('SANS_PLOMB') || norm.includes('ESSENCE')) {
    return dynamicTariffs?.['ESSENCE_SANS_PLOMB'] ?? NAFTAL_FUEL_PRICES_DZD.ESSENCE_SANS_PLOMB;
  }
  if (norm.includes('GPL') || norm.includes('SIRGHAZ')) {
    return dynamicTariffs?.['SIRGHAZ_GPL'] ?? NAFTAL_FUEL_PRICES_DZD.SIRGHAZ_GPL;
  }
  return dynamicTariffs?.['GASOIL'] ?? NAFTAL_FUEL_PRICES_DZD.GASOIL;
}

/**
 * Coûts moyens de remorquage lourd par zone géographique en DZD
 */
const K_DZD = 1000;

export const REGIONAL_TOWING_RATES_DZD: Record<ClimateZoneDZType, number> = {
  [ClimateZoneDZType.TELL_URBAN]: 35 * K_DZD,
  [ClimateZoneDZType.HIGH_PLATEAUS]: 65 * K_DZD,
  [ClimateZoneDZType.SAHARA_SOUTH]: 150 * K_DZD,
};

/**
 * Catalogue des pannes prédictives et coûts moyens d'immobilisation en Algérie (DZD)
 */
export interface ComponentFailureProfile {
  code: string;
  nameFr: string;
  nameAr: string;
  costPartsDzd: number;
  laborHours: number;
  downtimeDays: number;
}

export const PREDICTIVE_FAILURE_MODES_CATALOG: Record<string, ComponentFailureProfile> = {
  THERMAL_OVERHEAT_HEAD_GASKET: {
    code: 'THERMAL_OVERHEAT_HEAD_GASKET',
    nameFr: 'Casse joint de culasse et surchauffe bloc moteur',
    nameAr: 'تلف جوان كيلاس وسخونة مفرطة لكتلة المحرك',
    costPartsDzd: 185 * K_DZD,
    laborHours: 18,
    downtimeDays: 4,
  },
  ENGINE_SEIZURE_OIL_BREAKDOWN: {
    code: 'ENGINE_SEIZURE_OIL_BREAKDOWN',
    nameFr: 'Serrage moteur par perte de viscosité huile (Loi Arrhenius)',
    nameAr: 'تلف كلي للمحرك وفقدان لزوجة الزيت (قانون أرهينيوس)',
    costPartsDzd: 520 * K_DZD,
    laborHours: 35,
    downtimeDays: 7,
  },
  BATTERY_STARTER_CRITICAL_DROP: {
    code: 'BATTERY_STARTER_CRITICAL_DROP',
    nameFr: 'Défaillance totale batterie et démarreur calciné',
    nameAr: 'عطل كامل للبطارية وتلف المارش',
    costPartsDzd: 45000,
    laborHours: 3,
    downtimeDays: 1,
  },
  BRAKE_PAD_ROTOR_DESTRUCTION: {
    code: 'BRAKE_PAD_ROTOR_DESTRUCTION',
    nameFr: 'Destruction garnitures et disques de freins (Loi Archard)',
    nameAr: 'تلف صفائح وأقراص الفرامل بالكامل (قانون آركارد)',
    costPartsDzd: 85000,
    laborHours: 6,
    downtimeDays: 2,
  },
  DPF_INJECTOR_BURNOUT: {
    code: 'DPF_INJECTOR_BURNOUT',
    nameFr: 'Colmatage critique FAP et dérive sévère injecteurs',
    nameAr: 'انسداد مصفي الجسيمات وتلف بخاخات الديزل',
    costPartsDzd: 140 * K_DZD,
    laborHours: 8,
    downtimeDays: 3,
  },
};

/**
 * Taux journalier d'immobilisation commerciale selon la catégorie en DZD
 */
export const DAILY_DOWNTIME_COST_DZD: Record<string, number> = {
  HEAVY_TRUCK: 60000,
  COMMERCIAL_VAN: 25000,
  LIGHT_VEHICLE: 12000,
};

/**
 * Structure de calcul du Risque d'Inaction Financier (SAD -> ADS)
 */
export interface InactionRiskCalculationInput {
  missionDistanceKm: number;
  climateZone: ClimateZoneDZType;
  vehicleCategory: string;
  vehicleHealthIndex: number;
  coolingResidualC?: number;
  batterySohPct?: number;
  oilDegradationRatio?: number;
  brakeWearRatio?: number;
  hourlyLaborRateDzd?: number;
  clientPenaltyPerHourDzd?: number;
  expectedDelayHours?: number;
}

export interface InactionRiskBreakdown {
  failureProbability: number; // P_panne (0.00 à 1.00)
  failureModeCode: string;
  failureModeFr: string;
  failureModeAr: string;
  estimatedComponentRepairCostDzd: number;
  regionalTowingCostDzd: number;
  downtimeDays: number;
  downtimeCostDzd: number;
  clientPenaltyCostDzd: number;
  totalInactionRiskDzd: number; // Risque_Inaction(DZD)
}

export interface PreventiveActionBreakdown {
  recommendedActionFr: string;
  recommendedActionAr: string;
  partsCostDzd: number;
  laborHours: number;
  laborCostDzd: number;
  totalPreventiveActionCostDzd: number; // C_action(DZD)
  workshopDowntimeHours: number;
}

export interface FinancialArbitrageDecision {
  vehicleId: string;
  missionId: string;
  vehicleHealthIndex: number;
  inactionRisk: InactionRiskBreakdown;
  preventiveAction: PreventiveActionBreakdown;
  netExpectedSavingsDzd: number; // Risque_Inaction - C_action
  roiRatio: number; // Risque / Action
  decisionRecommendation: 'PROCEED_PREVENTIVE_MAINTENANCE' | 'AUTHORIZE_MISSION_WITH_MONITORING';
  executiveSummaryFr: string;
  executiveSummaryAr: string;
}

/**
 * Calcul déterministe de la probabilité de panne P_panne(d_mission)
 */
export function computeFailureProbability(
  vhi: number,
  missionDistanceKm: number,
  climateZone: ClimateZoneDZType,
  coolingResidualC = 0,
  batterySohPct = 100,
): number {
  let baseP = Math.max(0.0, (80.0 - vhi) / 80.0) * 0.65;

  if (coolingResidualC >= 11.0) {
    baseP += 0.35;
  } else if (coolingResidualC >= 7.5) {
    baseP += 0.20;
  }

  if (batterySohPct < 40.0) {
    baseP += 0.25;
  } else if (batterySohPct < 60.0) {
    baseP += 0.10;
  }

  const climateMultiplier =
    climateZone === ClimateZoneDZType.SAHARA_SOUTH
      ? 1.35
      : climateZone === ClimateZoneDZType.HIGH_PLATEAUS
        ? 1.15
        : 1.0;

  const distanceMultiplier = Math.min(1.5, 0.8 + missionDistanceKm / 1000.0);

  const finalP = Math.min(0.98, Math.max(0.02, baseP * climateMultiplier * distanceMultiplier));
  return Number(finalP.toFixed(4));
}

/**
 * Calcul complet de l'arbitrage financier SAD -> ADS en Dinars Algériens (DZD)
 */
export function evaluateFinancialArbitrageDzd(
  input: InactionRiskCalculationInput,
  vehicleId = 'asset-dz-01',
  missionId = 'mis-dz-01',
): FinancialArbitrageDecision {
  const pFail = computeFailureProbability(
    input.vehicleHealthIndex,
    input.missionDistanceKm,
    input.climateZone,
    input.coolingResidualC,
    input.batterySohPct,
  );

  let failureProfile = PREDICTIVE_FAILURE_MODES_CATALOG.THERMAL_OVERHEAT_HEAD_GASKET;
  let actionPartsDzd = 18500; // Pompe à eau + thermostat
  let actionHours = 3.0;
  let actionFr = 'Remplacer préventivement la pompe à eau et le thermostat (atelier Alger)';
  let actionAr = 'استبدال وقائي لمضخة الماء والترموستات (ورشة الجزائر العاصمة)';

  if ((input.coolingResidualC ?? 0) >= 7.5) {
    failureProfile = PREDICTIVE_FAILURE_MODES_CATALOG.THERMAL_OVERHEAT_HEAD_GASKET;
    actionPartsDzd = 18500;
    actionHours = 3.0;
    actionFr = 'Remplacement préventif pompe à eau et détartrage radiateur avant départ';
    actionAr = 'استبدال وقائي لمضخة الماء وتنظيف الرادياتور قبل الانطلاق';
  } else if ((input.batterySohPct ?? 100) < 55.0) {
    failureProfile = PREDICTIVE_FAILURE_MODES_CATALOG.BATTERY_STARTER_CRITICAL_DROP;
    actionPartsDzd = 28000;
    actionHours = 1.0;
    actionFr = 'Remplacement batterie 24V renforcée grand froid/chaleur saharienne';
    actionAr = 'استبدال البطارية 24V بنوعية معززة مقاومة للحرارة الصحراوية';
  } else if ((input.oilDegradationRatio ?? 0) > 0.85) {
    failureProfile = PREDICTIVE_FAILURE_MODES_CATALOG.ENGINE_SEIZURE_OIL_BREAKDOWN;
    actionPartsDzd = 24000;
    actionHours = 1.5;
    actionFr = 'Vidange d huile moteur Naftal 15W40 et cartouche filtre neuve';
    actionAr = 'تغيير زيت المحرك نفطال 15W40 ومصفي الزيت الجديد';
  } else if ((input.brakeWearRatio ?? 0) > 0.85) {
    failureProfile = PREDICTIVE_FAILURE_MODES_CATALOG.BRAKE_PAD_ROTOR_DESTRUCTION;
    actionPartsDzd = 32000;
    actionHours = 2.5;
    actionFr = 'Remplacement des plaquettes de freins avant usure complète du disque';
    actionAr = 'استبدال صفائح الفرامل قبل تآكل الأقراص المعدنية';
  }

  const hourlyRate = input.hourlyLaborRateDzd ?? 1500;
  const towCost = REGIONAL_TOWING_RATES_DZD[input.climateZone] ?? 45000;
  const dailyDowntimeRate =
    DAILY_DOWNTIME_COST_DZD[input.vehicleCategory] ?? DAILY_DOWNTIME_COST_DZD.HEAVY_TRUCK;
  const totalDowntimeCost = failureProfile.downtimeDays * dailyDowntimeRate;
  const clientPenaltyPerHour = input.clientPenaltyPerHourDzd ?? 15000;
  const expectedDelayHours = input.expectedDelayHours ?? failureProfile.downtimeDays * 8;
  const clientPenaltyCost = clientPenaltyPerHour * expectedDelayHours;

  const totalRawBreakdownLoss =
    failureProfile.costPartsDzd + towCost + totalDowntimeCost + clientPenaltyCost;
  const totalInactionRiskDzd = Math.round(pFail * totalRawBreakdownLoss);

  const actionLaborCost = Math.round(actionHours * hourlyRate);
  const totalActionCost = actionPartsDzd + actionLaborCost;

  const netSavings = totalInactionRiskDzd - totalActionCost;
  const roiRatio = totalActionCost > 0 ? Number((totalInactionRiskDzd / totalActionCost).toFixed(2)) : 1.0;

  const shouldPrevent = netSavings > 0 || input.vehicleHealthIndex < 65;

  const summaryFr = `Arbitrage Économique DZD : Immobiliser ${actionHours}h à l atelier (${totalActionCost.toLocaleString('fr-DZ')} DZD) vs Risque à ${(pFail * 100).toFixed(0)}% de panne ${failureProfile.nameFr} sur trajet (${totalInactionRiskDzd.toLocaleString('fr-DZ')} DZD). Économie nette attendue : ${Math.max(0, netSavings).toLocaleString('fr-DZ')} DZD (ROI x${roiRatio}).`;

  const summaryAr = `القرار الاقتصادي بالدينار الجزائري: التوقيف لمدة ${actionHours} سا في الورشة (${totalActionCost.toLocaleString('fr-DZ')} دج) مقابل خطر بنسبة ${(pFail * 100).toFixed(0)}% لحدوث ${failureProfile.nameAr} في الطريق (خطر مقدر بـ ${totalInactionRiskDzd.toLocaleString('fr-DZ')} دج). الوفر الصافي المتوقع: ${Math.max(0, netSavings).toLocaleString('fr-DZ')} دج (مردودية x${roiRatio}).`;

  return {
    vehicleId,
    missionId,
    vehicleHealthIndex: input.vehicleHealthIndex,
    inactionRisk: {
      failureProbability: pFail,
      failureModeCode: failureProfile.code,
      failureModeFr: failureProfile.nameFr,
      failureModeAr: failureProfile.nameAr,
      estimatedComponentRepairCostDzd: failureProfile.costPartsDzd,
      regionalTowingCostDzd: towCost,
      downtimeDays: failureProfile.downtimeDays,
      downtimeCostDzd: totalDowntimeCost,
      clientPenaltyCostDzd: clientPenaltyCost,
      totalInactionRiskDzd,
    },
    preventiveAction: {
      recommendedActionFr: actionFr,
      recommendedActionAr: actionAr,
      partsCostDzd: actionPartsDzd,
      laborHours: actionHours,
      laborCostDzd: actionLaborCost,
      totalPreventiveActionCostDzd: totalActionCost,
      workshopDowntimeHours: actionHours,
    },
    netExpectedSavingsDzd: netSavings,
    roiRatio,
    decisionRecommendation: shouldPrevent
      ? 'PROCEED_PREVENTIVE_MAINTENANCE'
      : 'AUTHORIZE_MISSION_WITH_MONITORING',
    executiveSummaryFr: summaryFr,
    executiveSummaryAr: summaryAr,
  };
}

/**
 * Ordre de Mission (OM) Réglementaire Algérien avec empreinte cryptographique hors-ligne
 */
export type MissionOrderCompanyInfo = {
  legalName: string;
  tradeName?: string;
  nif: string;
  nis: string;
  rcNumber: string;
  aiNumber: string;
  headquartersWilayaCode: number;
  headquartersWilayaName: string;
};

export interface RegulatoryMissionOrderData {
  orderNumber: string; // Ex: OM-2026-160012
  issueDateIso: string;
  validUntilIso: string;
  companyInfo: MissionOrderCompanyInfo;
  vehicle: {
    vehicleId: string;
    registrationPlate: string;
    makeModel: string;
    chassisVin: string;
    category: EnactaVehicleCategory;
    enactaExpiryDate: string;
    insurancePolicyNumber: string;
    insuranceCompany: string;
  };
  driver: {
    driverId: string;
    fullName: string;
    nationalIdNumber: string; // NIN
    licenseCategory: string;
    brevetProfessionnelNumber?: string;
    adrHazmatCertificateNumber?: string;
  };
  mission: {
    missionId: string;
    originName: string;
    originWilayaCode: number;
    destinationName: string;
    destinationWilayaCode: number;
    transitWilayaCodes: number[];
    cargoNature: string;
    cargoWeightTons: number;
    routeDistanceKm: number;
    departureTimeUtc: string;
  };
  qrVerificationPayload: string;
  offlineSignatureToken: string;
}

/**
 * Génère le payload compact de vérification hors-ligne pour QR Code (Gendarmerie Nationale / DGSN)
 */
export function buildMissionOrderQrString(order: {
  orderNumber: string;
  registrationPlate: string;
  driverNin: string;
  originWilaya: number;
  destWilaya: number;
  validUntil: string;
  cargoNature: string;
}): string {
  // Format compact sans PII superflue : OM|NUM|PLATE|NIN|W_ORIG|W_DEST|VALID_DATE|CARGO
  return `DZOM|${order.orderNumber}|${order.registrationPlate}|${order.driverNin}|${order.originWilaya}|${order.destWilaya}|${order.validUntil}|${order.cargoNature}`;
}

/**
 * Modèle de Substitution Multicritère TOPSIS / Score Pondéré (Section 5.2 MASTER_SPEC)
 */
export interface CandidateAssetForSubstitution {
  vehicleId: string;
  registrationPlate: string;
  makeModel: string;
  category: EnactaVehicleCategory;
  maxPayloadTons: number;
  hasReefer: boolean;
  hasPto: boolean;
  hasAdrCert: boolean;
  currentWilayaCode: number;
  currentLat: number;
  currentLon: number;
  vehicleHealthIndex: number; // 0-100
  effectiveRulKm: number;
  tcoPerKmDzd: number;
  ytdDrivenKm: number;
  annualTargetKm: number;
  enactaExpiresAt: string;
  insuranceExpiresAt: string;
  dispatchStatus: DispatchState;
}

export interface CandidateDriverForSubstitution {
  driverId: string;
  fullName: string;
  nin: string;
  licenseCategories: string[];
  hasBrevetProfessionnel: boolean;
  hasAdrCert: boolean;
  continuousHoursDriven: number;
  dailyHoursDriven: number;
  safetyScore: number;
  isAvailable: boolean;
}

export interface SubstitutionScoringWeights {
  weightVhi: number; // Def: 0.35
  weightTcoEconomy: number; // Def: 0.25
  weightApproachDist: number; // Def: 0.25
  weightFleetBalance: number; // Def: 0.15
}

export const DEFAULT_SUBSTITUTION_WEIGHTS: SubstitutionScoringWeights = {
  weightVhi: 0.35,
  weightTcoEconomy: 0.25,
  weightApproachDist: 0.25,
  weightFleetBalance: 0.15,
};

/**
 * Taux de TVA et Barèmes Fiscaux Officiels Algériens (DGI / Code des Impôts Directs)
 */
export const ALGERIA_FISCAL_RATES = {
  STANDARD_VAT_RATE: 0.19, // TVA standard 19%
  REDUCED_VAT_RATE: 0.09, // TVA réduite 9%
  CORPORATE_TAX_RATE: 0.19, // IBS taux standard
  PASSENGER_VEHICLE_AMORTIZATION_CEILING_DZD: 3_000_000, // Plafond amortissement VL Art. 141 CIDTA
} as const;


