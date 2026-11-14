import { z } from 'zod';

/**
 * Pack Réglementaire, Arbitrage Financier (DZD) & Continuité Opérationnelle Algérie
 * Conforme à MASTER_SPEC.md v2.0+ (Section 5) & AGENTS.md v3.0 (World-Class DZ-First)
 * 
 * Références Légales & Réglementaires Opposables :
 * - Décret exécutif n° 03-223 du 10 juin 2003 & Décret exécutif n° 17-255 du 18 septembre 2017 (Contrôle technique ENACTA)
 * - Arrêté interministériel du 6 mai 2004 (Tarifs des prestations de contrôle technique automobile)
 * - Ordonnance n° 03-12 du 26 août 2003 (Assurance obligatoire CatNat et RC automobile)
 * - Décret exécutif n° 16-235 du 6 septembre 2016 (Brevet Professionnel de Conducteur - BPC)
 * - Arrêté interministériel des tarifs Naftal en vigueur au 1er janvier 2026 (Gasoil 31.00 DA, Essence 47.00 DA, Sirghaz 12.00 DA)
 * - Code des Impôts Directs et Taxes Assimilées (NIF 15 chiffres, NIS, RC, AI, TVA 19%, Timbre fiscal progressif)
 * - Article 81 de la Loi de Finances pour 2020 & Circulaire DGD n° 02/DGD/SP/D110/2020 (Taxe carburant transfrontalière)
 * - Loi n° 18-07 du 10 juin 2018 relative à la protection des données à caractère personnel (ANPDP)
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
  periodicityMonthsUnder4Years?: number; // B1: VUL neufs (< 4 ans) = 24 mois
  ageThresholdYears?: number; // B1: 4 ans pour VUL
  firstControlAfterYears?: number; // B2: 2 ans pour véhicules légers particuliers
  requiresAnnualTankCertificate?: boolean; // M1: Certificat de citerne annuel obligatoire
  warningOnly?: boolean; // B2: Avertissement gestionnaire sans fourrière
  preAlertDays: number[];
  blockingAction: DispatchState;
  sanctionDescriptionFr: string;
  sanctionDescriptionAr: string;
  asOf?: string;
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
    asOf: '2026-01-01',
  },
  [EnactaVehicleCategory.TRACTOR_TRAILER]: {
    ruleCode: 'ENACTA-TT-6M',
    legalReference: 'Décret exécutif 03-223 Art. 7',
    periodicityMonths: 6,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Immobilisation administrative et mise en fourrière (Tracteur routier semi-remorque)',
    sanctionDescriptionAr: 'حجز إداري وتوقيف في المحشر (جرار طريقي نصف مقطورة)',
    asOf: '2026-01-01',
  },
  [EnactaVehicleCategory.BUS_PUBLIC_TRANSPORT]: {
    ruleCode: 'ENACTA-BUS-6M',
    legalReference: 'Décret exécutif 03-223 Art. 8',
    periodicityMonths: 6,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Retrait immédiat de l autorisation de circuler (Transport de personnes)',
    sanctionDescriptionAr: 'سحب فوري لرخصة السير (نقل الأشخاص والمسافرين)',
    asOf: '2026-01-01',
  },
  [EnactaVehicleCategory.HAZMAT_TANKER]: {
    ruleCode: 'ENACTA-HAZMAT-6M',
    legalReference: 'Décret 03-223 & Arrêté interministériel TMD',
    periodicityMonths: 6,
    requiresAnnualTankCertificate: true,
    preAlertDays: [45, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Interdiction absolue de chargement en raffinerie / centre de distribution Naftal',
    sanctionDescriptionAr: 'منع بات من الشحن بمصافي ومستودعات نفطال وسوناطراك',
    asOf: '2026-01-01',
  },
  [EnactaVehicleCategory.REEFER_TRUCK]: {
    ruleCode: 'ENACTA-REEFER-6M',
    legalReference: 'Décret 03-223 & Norme ATP Froid',
    periodicityMonths: 6,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Interdiction de transport sous température dirigée et mise en fourrière',
    sanctionDescriptionAr: 'منع نقل المواد الحساسة لدرجة الحرارة والحجز',
    asOf: '2026-01-01',
  },
  [EnactaVehicleCategory.COMMERCIAL_VAN_VUL]: {
    ruleCode: 'ENACTA-VUL-12M',
    legalReference: 'Décret exécutif 03-223 Art. 16 & Décret 17-255',
    periodicityMonths: 12,
    periodicityMonthsUnder4Years: 24, // B1: VUL neufs (< 4 ans) = 2 ans
    ageThresholdYears: 4,
    preAlertDays: [30, 15, 7, 0],
    blockingAction: DispatchState.BLOCKED_REGULATORY,
    sanctionDescriptionFr: 'Amende légale et défaut d opposabilité de l assurance en cas de sinistre',
    sanctionDescriptionAr: 'غرامة مالية وعدم سريان التأمين في حال وقوع حادث',
    asOf: '2026-01-01',
  },
  [EnactaVehicleCategory.LIGHT_PASSENGER]: {
    ruleCode: 'ENACTA-VL-12M',
    legalReference: 'Décret exécutif 03-223 Art. 10 & Décret 17-255',
    periodicityMonths: 12,
    firstControlAfterYears: 2, // B2: Exempté < 2 ans
    periodicityMonthsUnder4Years: 24, // De 2 à 6 ans = 2 ans
    preAlertDays: [15, 7, 0],
    blockingAction: DispatchState.MAINTENANCE_WARN, // B2: Avertissement gestionnaire
    warningOnly: true,
    sanctionDescriptionFr: 'Défaut de contrôle technique obligatoire après 2 ans d âge (Avertissement gestionnaire)',
    sanctionDescriptionAr: 'تنبيه إداري: الفحص التقني الدوري الإجباري بعد سنتين من السير',
    asOf: '2026-01-01',
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
  if (norm.includes('SANS_PLOMB') || norm.includes('ESSENCE') || norm.includes('SUPER')) {
    return (
      dynamicTariffs?.['ESSENCE_SANS_PLOMB'] ??
      dynamicTariffs?.['ESSENCE'] ??
      dynamicTariffs?.['SUPER'] ??
      NAFTAL_FUEL_PRICES_DZD.ESSENCE_SANS_PLOMB
    );
  }
  if (norm.includes('GPL') || norm.includes('SIRGHAZ')) {
    return (
      dynamicTariffs?.['SIRGHAZ_GPL'] ??
      dynamicTariffs?.['SIRGHAZ'] ??
      dynamicTariffs?.['GPL'] ??
      NAFTAL_FUEL_PRICES_DZD.SIRGHAZ_GPL
    );
  }
  return (
    dynamicTariffs?.['GASOIL'] ??
    dynamicTariffs?.['DIESEL'] ??
    dynamicTariffs?.['DIESEL_GASOIL'] ??
    NAFTAL_FUEL_PRICES_DZD.GASOIL
  );
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
  asOf?: string;
  legalReference?: string;
}

export const PREDICTIVE_FAILURE_MODES_CATALOG: Record<string, ComponentFailureProfile> = {
  THERMAL_OVERHEAT_HEAD_GASKET: {
    code: 'THERMAL_OVERHEAT_HEAD_GASKET',
    nameFr: 'Casse joint de culasse et surchauffe bloc moteur',
    nameAr: 'تلف جوان كيلاس وسخونة مفرطة لكتلة المحرك',
    costPartsDzd: 185 * K_DZD,
    laborHours: 18,
    downtimeDays: 4,
    asOf: '2026-01-01',
    legalReference: 'Barème moyen pièces et main d œuvre atelier algérien',
  },
  ENGINE_SEIZURE_OIL_BREAKDOWN: {
    code: 'ENGINE_SEIZURE_OIL_BREAKDOWN',
    nameFr: 'Serrage moteur par perte de viscosité huile (Loi Arrhenius)',
    nameAr: 'تلف كلي للمحرك وفقدان لزوجة الزيت (قانون أرهينيوس)',
    costPartsDzd: 520 * K_DZD,
    laborHours: 35,
    downtimeDays: 7,
    asOf: '2026-01-01',
    legalReference: 'Barème moyen pièces et main d œuvre atelier algérien',
  },
  BATTERY_STARTER_CRITICAL_DROP: {
    code: 'BATTERY_STARTER_CRITICAL_DROP',
    nameFr: 'Défaillance totale batterie et démarreur calciné',
    nameAr: 'عطل كامل للبطارية وتلف المارش',
    costPartsDzd: 45000,
    laborHours: 3,
    downtimeDays: 1,
    asOf: '2026-01-01',
    legalReference: 'Barème moyen pièces et main d œuvre atelier algérien',
  },
  BRAKE_PAD_ROTOR_DESTRUCTION: {
    code: 'BRAKE_PAD_ROTOR_DESTRUCTION',
    nameFr: 'Destruction garnitures et disques de freins (Loi Archard)',
    nameAr: 'تلف صفائح وأقراص الفرامل بالكامل (قانون آركارد)',
    costPartsDzd: 85000,
    laborHours: 6,
    downtimeDays: 2,
    asOf: '2026-01-01',
    legalReference: 'Barème moyen pièces et main d œuvre atelier algérien',
  },
  DPF_INJECTOR_BURNOUT: {
    code: 'DPF_INJECTOR_BURNOUT',
    nameFr: 'Colmatage critique FAP et dérive sévère injecteurs',
    nameAr: 'انسداد مصفي الجسيمات وتلف بخاخات الديزل',
    costPartsDzd: 140 * K_DZD,
    laborHours: 8,
    downtimeDays: 3,
    asOf: '2026-01-01',
    legalReference: 'Barème moyen pièces et main d œuvre atelier algérien',
  },
};

/**
 * Taux journalier d'immobilisation commerciale selon la catégorie en DZD
 * Clés normalisées EnactaVehicleCategory et clés historiques (B3)
 */
export const DAILY_DOWNTIME_COST_DZD: Record<string, number> = {
  // Clés génériques historiques
  HEAVY_TRUCK: 60000,
  COMMERCIAL_VAN: 25000,
  LIGHT_VEHICLE: 12000,
  BUS: 40000,
  CONSTRUCTION: 75000,
  AGRI_TRACTOR: 20000,
  // Clés conformes EnactaVehicleCategory (B3)
  [EnactaVehicleCategory.HEAVY_TRUCK_RIGID]: 60000,
  [EnactaVehicleCategory.TRACTOR_TRAILER]: 70000,
  [EnactaVehicleCategory.BUS_PUBLIC_TRANSPORT]: 40000,
  [EnactaVehicleCategory.HAZMAT_TANKER]: 85000,
  [EnactaVehicleCategory.REEFER_TRUCK]: 65000,
  [EnactaVehicleCategory.COMMERCIAL_VAN_VUL]: 25000,
  [EnactaVehicleCategory.LIGHT_PASSENGER]: 12000,
};

/**
 * Résout le coût journalier d'immobilisation commerciale de façon résiliente (B3)
 */
export function resolveDailyDowntimeCostDzd(category?: string): number {
  if (!category) return DAILY_DOWNTIME_COST_DZD.HEAVY_TRUCK;
  if (DAILY_DOWNTIME_COST_DZD[category] !== undefined) {
    return DAILY_DOWNTIME_COST_DZD[category];
  }
  const norm = category.toUpperCase();
  if (norm.includes('VAN') || norm.includes('VUL') || norm.includes('LCV')) {
    return DAILY_DOWNTIME_COST_DZD.COMMERCIAL_VAN;
  }
  if (norm.includes('LIGHT') || norm.includes('PASSENGER') || norm.includes('TOURISM') || norm.includes('VL')) {
    return DAILY_DOWNTIME_COST_DZD.LIGHT_VEHICLE;
  }
  if (norm.includes('BUS')) {
    return DAILY_DOWNTIME_COST_DZD.BUS;
  }
  if (norm.includes('TANKER') || norm.includes('HAZMAT')) {
    return DAILY_DOWNTIME_COST_DZD[EnactaVehicleCategory.HAZMAT_TANKER];
  }
  if (norm.includes('TRACTOR_TRAILER') || norm.includes('SEMI')) {
    return DAILY_DOWNTIME_COST_DZD[EnactaVehicleCategory.TRACTOR_TRAILER];
  }
  return DAILY_DOWNTIME_COST_DZD.HEAVY_TRUCK;
}

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
 * Intègre les ratios d'usure d'huile et de freinage (M6) et plafonne la distance à 2.2x pour le Sahara (M5)
 */
export function computeFailureProbability(
  vhi: number,
  missionDistanceKm: number,
  climateZone: ClimateZoneDZType,
  coolingResidualC = 0,
  batterySohPct = 100,
  oilDegradationRatio = 0,
  brakeWearRatio = 0,
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

  // Prise en compte de la dégradation de l'huile moteur (M6)
  if (oilDegradationRatio > 0.85) {
    baseP += 0.25;
  } else if (oilDegradationRatio > 0.70) {
    baseP += 0.12;
  }

  // Prise en compte de l'usure tribologique des freins (M6)
  if (brakeWearRatio > 0.85) {
    baseP += 0.20;
  } else if (brakeWearRatio > 0.70) {
    baseP += 0.10;
  }

  // Multiplicateur climatique aligné sur la sévérité k_usure = 1/alpha (M4)
  const climateMultiplier =
    climateZone === ClimateZoneDZType.SAHARA_SOUTH
      ? 1.35
      : climateZone === ClimateZoneDZType.HIGH_PLATEAUS
        ? 1.15
        : 1.0;

  // Plafond relevé à 2.2 pour les traversées sahariennes longues (> 1 500 km) (M5)
  const distanceMultiplier = Math.min(2.2, 0.8 + missionDistanceKm / 1000.0);

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
    input.oilDegradationRatio,
    input.brakeWearRatio,
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
  } else if ((input.oilDegradationRatio ?? 0) > 0.70 && input.climateZone === ClimateZoneDZType.SAHARA_SOUTH) {
    // Sélection explicite de DPF_INJECTOR_BURNOUT pour les cas d'encrassement sévère saharien (M9)
    failureProfile = PREDICTIVE_FAILURE_MODES_CATALOG.DPF_INJECTOR_BURNOUT;
    actionPartsDzd = 42000;
    actionHours = 3.5;
    actionFr = 'Régénération forcée FAP et nettoyage des injecteurs en atelier spécialisé';
    actionAr = 'تجديد إجباري لمصفي الجسيمات FAP وتنظيف حاقنات الديزل في الورشة';
  }

  const hourlyRate = input.hourlyLaborRateDzd ?? 1500;
  const towCost = REGIONAL_TOWING_RATES_DZD[input.climateZone] ?? 45000;
  // Résolution résiliente du coût journalier d'immobilisation commerciale (B3)
  const dailyDowntimeRate = resolveDailyDowntimeCostDzd(input.vehicleCategory);
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
    insuranceExpiresAt?: string; // M3: Date d'expiration de la police d'assurance
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
 * Conforme à la minimisation ANPDP Loi 18-07 et échappement anti-collision de pipes (B4, M8)
 */
export function buildMissionOrderQrString(order: {
  orderNumber: string;
  registrationPlate: string;
  driverNin: string;
  originWilaya: number;
  destWilaya: number;
  validUntil: string;
  cargoNature: string;
  offlineSignatureToken?: string;
  jti?: string;
}): string {
  const safeCargo = (order.cargoNature || 'FRET').replace(/\|/g, '-');
  const basePayload = `DZOM|${order.orderNumber}|${order.registrationPlate}|${order.driverNin}|${order.originWilaya}|${order.destWilaya}|${order.validUntil}|${safeCargo}`;
  const jtiPart = order.jti ? `|${order.jti}` : '';
  const sigPart = order.offlineSignatureToken ? `|${order.offlineSignatureToken.slice(0, 32)}` : '';
  return `${basePayload}${jtiPart}${sigPart}`;
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
 * Taux de TVA, Droit de Timbre et Barèmes Fiscaux Officiels Algériens (DGI / Code des Impôts Directs)
 * Conforme au Code des Taxes sur le Chiffre d'Affaires et Code du Timbre (Art. 252) (B6, m3)
 */
export const ALGERIA_FISCAL_RATES = {
  STANDARD_VAT_RATE: 0.19, // TVA standard 19%
  REDUCED_VAT_RATE: 0.09, // TVA réduite 9%
  CORPORATE_TAX_RATE: 0.19, // IBS taux standard production & services
  CORPORATE_TAX_RATE_GOODS_SERVICES: 0.19, // IBS standard production et services (19%)
  CORPORATE_TAX_RATE_OTHER: 0.23, // IBS autres activités / BTP (23%)
  PASSENGER_VEHICLE_AMORTIZATION_CEILING_DZD: 3_000_000, // Plafond amortissement VL Art. 141 CIDTA
  CASH_STAMP_DUTY_RATE: 0.01, // Droit de timbre fiscal (1% pour règlements en espèces)
  CASH_STAMP_DUTY_MIN_DZD: 100, // Plancher légal 100 DA
  CASH_STAMP_DUTY_MAX_DZD: 2500, // Plafond légal 2 500 DA (Art. 252 Code du Timbre)
  asOf: '2026-01-01',
  legalReference: 'Code des Impôts Directs et Taxes Assimilées & Code du Timbre',
} as const;

// ---------------------------------------------------------------------------
// Schémas de Validation Stricte Zod (Algérie DGI & Réglementaire) (B6)
// ---------------------------------------------------------------------------
export const algerianNifSchema = z
  .string()
  .regex(/^[0-9]{15}$/, 'Le NIF algérien doit comporter exactement 15 chiffres');

export const algerianRcSchema = z
  .string()
  .regex(
    /^[0-9]{2}\/[0-9]{2}-[0-9]{7}[A-Z][0-9]{2}$/,
    'Format Registre de Commerce algérien invalide (ex: 16/00-1234567B22)',
  );

export const algerianPlateSchema = z
  .string()
  .regex(
    /^[0-9]{4,6}-[0-9]{3}-(0[1-9]|[1-4][0-9]|5[0-8])$/,
    'Format matricule algérien invalide (ex: 02410-117-22 ou 00123-324-16)',
  );

export const algerianArticleImpositionSchema = z
  .string()
  .regex(/^[0-9]{11}$/, "L'Article d'Imposition (AI) doit comporter exactement 11 chiffres");

// ---------------------------------------------------------------------------
// Tarifs Officiels ENACTA (Arrêté interministériel du 6 mai 2004) vs Provisions TCO (A)
// ---------------------------------------------------------------------------
export const ENACTA_OFFICIAL_FEES_DZD = {
  LIGHT_PASSENGER_HT: 1268.84,
  LIGHT_PASSENGER_TTC: 1510.0,
  COMMERCIAL_VAN_VUL_HT: 1802.9,
  COMMERCIAL_VAN_VUL_TTC: 2145.45,
  TAXI_HT: 1359.49,
  TAXI_TTC: 1617.79,
  HEAVY_TRUCK_RIGID_HT: 2450.0,
  HEAVY_TRUCK_RIGID_TTC: 2915.5,
  TRACTOR_TRAILER_HT: 2800.0,
  TRACTOR_TRAILER_TTC: 3332.0,
  BUS_PUBLIC_TRANSPORT_HT: 2600.0,
  BUS_PUBLIC_TRANSPORT_TTC: 3094.0,
  HAZMAT_TANKER_HT: 2800.0,
  HAZMAT_TANKER_TTC: 3332.0,
  asOf: '2026-01-01',
  legalReference: 'Arrêté interministériel du 6 mai 2004 fixant les tarifs des prestations du contrôle technique automobile & Décret 03-223',
} as const;

export const ENACTA_INTERNAL_TCO_PROVISIONS_DZD = {
  LIGHT_PASSENGER: 3500.0,
  COMMERCIAL_VAN_VUL: 5500.0,
  TAXI: 4000.0,
  HEAVY_TRUCK_RIGID: 8500.0,
  TRACTOR_TRAILER: 11000.0,
  BUS_PUBLIC_TRANSPORT: 9000.0,
  HAZMAT_TANKER: 18500.0,
  notes: 'Tarif officiel ENACTA + pré-contrôle atelier + immobilisation chauffeur',
} as const;

// ---------------------------------------------------------------------------
// Taxe Carburant Transfrontalière (Sortie des Frontières Terrestres) (B)
// ---------------------------------------------------------------------------
export const ALGERIA_TRANSBORDER_FUEL_TAX_DZD = {
  PASSENGER_CAR: 500,
  LCV_AND_TRUCKS_UNDER_10T: 3500,
  HEAVY_TRUCKS_10T_PLUS_AND_BUS: 12000,
  asOf: '2026-01-01',
  legalReference: 'Article 81 Loi de Finances pour 2020 (Loi n° 19-14 du 11 décembre 2019) & Circulaire DGD n° 02/DGD/SP/D110/2020',
} as const;

// ---------------------------------------------------------------------------
// Barème Lubrifiants Naftal [STATUT: INDICATIF / PROVISOIRE] (C)
// ---------------------------------------------------------------------------
export const NAFTAL_LUBRICANTS_INDICATIVE_DZD = {
  NAFTALIA_15W40_MINERAL_LITER_TTC: 280,
  NAFTALIA_15W40_BIDON_5L_TTC: 1350,
  NAFTAL_SYNTHESE_5W40_LITER_TTC: 750,
  NAFTAL_SYNTHESE_5W40_BIDON_5L_TTC: 3650,
  NAFTAL_TRANS_80W90_LITER_TTC: 310,
  status: 'INDICATIF_PROVISOIRE',
  notes: 'Les prix effectifs sont injectés dynamiquement via la console /admin/fiscal ou les bordereaux atelier',
} as const;

// ---------------------------------------------------------------------------
// Fonctions Déterministes de Résolution d'Âge et de Périodicité ENACTA (B1, B2, F)
// ---------------------------------------------------------------------------

/**
 * Résout l'âge en années d'un véhicule algérien.
 * Priorité 1 (Exacte) : Date de première mise en circulation.
 * Repli de secours (Fallback documenté) : Extraction depuis le matricule national.
 */
export function resolveVehicleAgeYears(
  firstRegistrationDate?: string,
  registrationPlate?: string,
): number | undefined {
  if (firstRegistrationDate) {
    const diffMs = Date.now() - new Date(firstRegistrationDate).getTime();
    if (!Number.isNaN(diffMs) && diffMs >= 0) {
      return Number((diffMs / (1000 * 3600 * 24 * 365.25)).toFixed(2));
    }
  }
  // Source secondaire de repli (Fallback documenté basé sur le matricule)
  if (registrationPlate) {
    const match = registrationPlate.match(/^[0-9]{4,6}-[0-9]([0-9]{2})-[0-9]{2}$/);
    if (match) {
      const yearDigits = parseInt(match[1], 10);
      const currentYear = new Date().getFullYear();
      const fullYear = yearDigits > 50 ? 1900 + yearDigits : 2000 + yearDigits;
      if (fullYear <= currentYear) {
        return currentYear - fullYear;
      }
    }
  }
  return undefined;
}

/**
 * Détermine la périodicité et le plafond légal de validité ENACTA selon l'âge et la catégorie (B1, B2)
 */
export function resolveEnactaPeriodicity(
  category: EnactaVehicleCategory | string,
  vehicleAgeYears?: number,
): {
  periodicityMonths: number;
  maxLegalDays: number;
  legalReference: string;
  isWarningOnly: boolean;
} {
  const cat = category as EnactaVehicleCategory;
  if (
    cat === EnactaVehicleCategory.HEAVY_TRUCK_RIGID ||
    cat === EnactaVehicleCategory.TRACTOR_TRAILER ||
    cat === EnactaVehicleCategory.BUS_PUBLIC_TRANSPORT ||
    cat === EnactaVehicleCategory.HAZMAT_TANKER ||
    cat === EnactaVehicleCategory.REEFER_TRUCK
  ) {
    return {
      periodicityMonths: 6,
      maxLegalDays: 186,
      legalReference: 'Décret exécutif 03-223 Art. 7 & 8 (Poids Lourds semestriel)',
      isWarningOnly: false,
    };
  }

  if (cat === EnactaVehicleCategory.COMMERCIAL_VAN_VUL) {
    if (vehicleAgeYears !== undefined && vehicleAgeYears < 4) {
      return {
        periodicityMonths: 24,
        maxLegalDays: 732,
        legalReference: 'Décret exécutif 03-223 Art. 16 & Décret 17-255 (VUL neuf < 4 ans biannuel)',
        isWarningOnly: false,
      };
    }
    return {
      periodicityMonths: 12,
      maxLegalDays: 366,
      legalReference: 'Décret exécutif 03-223 Art. 16 (VUL âgé >= 4 ans annuel)',
      isWarningOnly: false,
    };
  }

  if (cat === EnactaVehicleCategory.LIGHT_PASSENGER) {
    if (vehicleAgeYears !== undefined && vehicleAgeYears < 2) {
      return {
        periodicityMonths: 24,
        maxLegalDays: 732,
        legalReference: 'Décret exécutif 17-255 (Véhicule particulier neuf < 2 ans exempté)',
        isWarningOnly: true,
      };
    }
    if (vehicleAgeYears !== undefined && vehicleAgeYears < 6) {
      return {
        periodicityMonths: 24,
        maxLegalDays: 732,
        legalReference: 'Décret exécutif 17-255 (Véhicule particulier 2 à 6 ans biannuel)',
        isWarningOnly: true,
      };
    }
    return {
      periodicityMonths: 12,
      maxLegalDays: 366,
      legalReference: 'Décret exécutif 17-255 (Véhicule particulier > 6 ans annuel)',
      isWarningOnly: true,
    };
  }

  return {
    periodicityMonths: 12,
    maxLegalDays: 366,
    legalReference: 'Décret exécutif 03-223 (Périodicité standard annuelle)',
    isWarningOnly: false,
  };
}


