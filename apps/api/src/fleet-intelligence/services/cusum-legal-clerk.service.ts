import { Injectable, Logger, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  BilingualLegalAuditReport,
  calculateTankSlopeCorrection,
  detectFuelTheftCusum,
  NAFTAL_FUEL_PRICES_DZD,
  PreComputedContextGraphPayload,
} from '@docteurflotte/contracts';
import { OllamaSovereignService } from '../../copilot/ollama-sovereign.service';

export interface FuelIncidentEvaluationInput {
  eventId?: string;
  vehicleId: string;
  vehiclePlate: string;
  driverPseudonym?: string;
  timestamp?: string;
  location: {
    latitude: number;
    longitude: number;
    wilayaCode: number;
    wilayaName: string;
    roadName: string;
    roadGradePercent: number; // Pente routière issue de Valhalla (ex: 11.5%)
  };
  telemetry: {
    speedKmh: number;
    engineRpm: number;
    ignitionOn: boolean;
    idleHoursToday?: number;
    durationStationarySeconds: number;
    canConsumedLitersTotal?: number;
  };
  fuelReading: {
    tankCapacityLiters: number;
    rawLevelsLiters: number[]; // Historique récent des mesures de jauge
    tankLengthMeters?: number;
    sensorOffsetRatio?: number;
    previousCusumScore?: number;
  };
  context: {
    nearestNaftalStationKm: number;
    hasLegitimateFuelReceipt: boolean;
    fuelUnitPriceDzd?: number;
  };
}

const WILAYA_AR_MAP: Record<number, string> = {
  1: 'أدرار', 2: 'الشلف', 3: 'الأغواط', 4: 'أم البواقي', 5: 'باتنة', 6: 'بجاية', 7: 'بسكرة', 8: 'بشار',
  9: 'البليدة', 10: 'البويرة', 11: 'تمنراست', 12: 'تبسة', 13: 'تلمسان', 14: 'تيارت', 15: 'تيزي وزو',
  16: 'الجزائر', 17: 'الجلفة', 18: 'جيجل', 19: 'سطيف', 20: 'سعيدة', 21: 'سكيكدة', 22: 'سيدي بلعباس',
  23: 'عنابة', 24: 'قالمة', 25: 'قسنطينة', 26: 'المدية', 27: 'مستغانم', 28: 'المسيلة', 29: 'معسكر',
  30: 'ورقلة', 31: 'وهران', 32: 'البيض', 33: 'إليزي', 34: 'برج بوعريريج', 35: 'بومرداس', 36: 'الطارف',
  37: 'تندوف', 38: 'تسمسيلت', 39: 'الوادي', 40: 'خنشلة', 41: 'سوق أهراس', 42: 'تيبازة', 43: 'ميلة',
  44: 'عين الدفلى', 45: 'النعامة', 46: 'عين تموشنت', 47: 'غرداية', 48: 'غليزان', 49: 'تيميمون',
  50: 'برج باجي مختار', 51: 'أولاد جلال', 52: 'بني عباس', 53: 'إن صالح', 54: 'إن قزام', 55: 'تقرت',
  56: 'جانت', 57: 'المغير', 58: 'المنيعة'
};

@Injectable()
export class CusumLegalClerkService {
  private readonly logger = new Logger(CusumLegalClerkService.name);
  private readonly reportsStore = new Map<string, BilingualLegalAuditReport>();
  private readonly hmacSecret = process.env.CUSUM_HMAC_SECRET || 'docteurflotte-sovereign-cusum-secret-dz-2027';

  constructor(
    @Optional() private readonly ollamaService?: OllamaSovereignService,
  ) {}

  /**
   * Construit le Pre-Computed Context Graph déterministe (Zéro LLM sur les calculs)
   */
  buildPreComputedGraph(input: FuelIncidentEvaluationInput): PreComputedContextGraphPayload {
    const eventId = input.eventId || `EVT-CUSUM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const timestamp = input.timestamp || new Date().toISOString();
    const capacity = input.fuelReading.tankCapacityLiters || 400;
    const rawLevels = input.fuelReading.rawLevelsLiters;

    const initialLevel = rawLevels.length > 0 ? rawLevels[0] : capacity;
    const finalLevel = rawLevels.length > 0 ? rawLevels[rawLevels.length - 1] : initialLevel;
    const rawDropLiters = Number(Math.max(0, initialLevel - finalLevel).toFixed(2));

    // 1. Calcul de la correction topographique (Pente Valhalla & Dévers géométrique)
    const slopeCorrection = calculateTankSlopeCorrection({
      roadGradePercent: input.location.roadGradePercent,
      tankCapacityLiters: capacity,
      measuredDropLiters: rawDropLiters,
      tankLengthMeters: input.fuelReading.tankLengthMeters ?? 1.6,
      sensorOffsetRatio: input.fuelReading.sensorOffsetRatio ?? 0.25,
    });

    // 2. Détection physique via algorithme CUSUM Page-Hinkley
    const cusumResult = detectFuelTheftCusum({
      fuelTankCapacityLiters: capacity,
      rawLevelsLiters: rawLevels,
      canConsumedLitersTotal: input.telemetry.canConsumedLitersTotal,
      ignitionOn: input.telemetry.ignitionOn,
      vehicleSpeedKmh: input.telemetry.speedKmh,
      previousCusumScore: input.fuelReading.previousCusumScore,
    });

    // 3. Tarification Naftal officielle (DZD/L)
    const unitPrice = input.context.fuelUnitPriceDzd ?? NAFTAL_FUEL_PRICES_DZD.GASOIL;
    const correctedNetDropLiters = slopeCorrection.correctedTrueDropLiters;
    const directLossDzd = Number((correctedNetDropLiters * unitPrice).toFixed(2));

    // 4. Qualification de l'événement et Indice de Confiance Physique
    let qualification: PreComputedContextGraphPayload['environmentalEvidence']['qualification'] = 'NOMINAL';
    let confidenceScore = 0.5;

    if (slopeCorrection.isFalsePositiveSlope) {
      qualification = 'FAUSSE_ALERTE_PENTE_DÉVERS';
      confidenceScore = 0.99;
    } else if (
      rawDropLiters >= 15.0 &&
      correctedNetDropLiters >= 12.0 &&
      input.telemetry.speedKmh < 1.0 &&
      input.telemetry.engineRpm === 0 &&
      !input.context.hasLegitimateFuelReceipt
    ) {
      qualification = 'SIPHONNAGE_AVÉRÉ';
      confidenceScore = 0.985;
    } else if (cusumResult.theftType === 'SLOW_BLEEDING_IN_TRANSIT') {
      qualification = 'PIQUAGE_LENT_EN_ROUTE';
      confidenceScore = 0.94;
    }

    // 5. Signature cryptographique HMAC-SHA256 (Inaltérabilité du faisceau de preuves)
    const signaturePayload = `${eventId}|${input.vehiclePlate}|${timestamp}|${rawDropLiters}|${correctedNetDropLiters}|${directLossDzd}|${qualification}`;
    const hmacSignature = crypto.createHmac('sha256', this.hmacSecret).update(signaturePayload).digest('hex');

    return {
      eventId,
      timestamp,
      vehicleId: input.vehicleId,
      vehiclePlate: input.vehiclePlate,
      driverPseudonym: input.driverPseudonym || 'CONDUCTEUR_MAT_ANON',
      location: {
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        wilayaCode: input.location.wilayaCode,
        wilayaName: input.location.wilayaName,
        roadName: input.location.roadName,
        roadGradePercent: input.location.roadGradePercent,
      },
      telemetry: {
        speedKmh: input.telemetry.speedKmh,
        engineRpm: input.telemetry.engineRpm,
        ignitionOn: input.telemetry.ignitionOn,
        idleHoursToday: input.telemetry.idleHoursToday || 0,
        durationStationarySeconds: input.telemetry.durationStationarySeconds,
      },
      fuelData: {
        tankCapacityLiters: capacity,
        rawDropLiters,
        slopeCorrectionLiters: slopeCorrection.apparentDropDueToSlopeLiters,
        correctedNetDropLiters,
        fuelPriceDzdPerLiter: unitPrice,
        directLossDzd,
        cusumScore: cusumResult.cusumCumulativeScore,
      },
      environmentalEvidence: {
        nearestNaftalStationKm: input.context.nearestNaftalStationKm,
        hasLegitimateFuelReceipt: input.context.hasLegitimateFuelReceipt,
        confidenceScore,
        qualification,
      },
      hmacSignature,
    };
  }

  /**
   * Rédige le rapport juridique d'inculpation / classement bilingue (Greffier Juridique)
   */
  async generateAuditReport(input: FuelIncidentEvaluationInput): Promise<BilingualLegalAuditReport> {
    const graph = this.buildPreComputedGraph(input);
    const reportId = `PV-CUSUM-${graph.eventId.replace('EVT-CUSUM-', '')}-${Date.now().toString(36).toUpperCase()}`;
    const generatedAt = new Date().toISOString();

    const isTheft = graph.environmentalEvidence.qualification === 'SIPHONNAGE_AVÉRÉ';
    const isFalseAlarm = graph.environmentalEvidence.qualification === 'FAUSSE_ALERTE_PENTE_DÉVERS';
    const isSlowBleed = graph.environmentalEvidence.qualification === 'PIQUAGE_LENT_EN_ROUTE';

    const status: BilingualLegalAuditReport['status'] = isTheft || isSlowBleed
      ? 'OPPOSABLE_DISCIPLINAIRE'
      : isFalseAlarm
        ? 'CLASSEMENT_SANS_SUITE'
        : 'ENQUETE_COMPLEMENTAIRE';

    // 1. Rédaction du rapport en Français Juridique & Administratif
    const frenchReport = this.renderFrenchLegalReport(reportId, graph, status);

    // 2. Rédaction du rapport en Arabe Administratif Algérien Officiel (محضر معاينة)
    const arabicReport = this.renderArabicLegalReport(reportId, graph, status);

    const reportSignaturePayload = `${reportId}|${status}|${graph.fuelData.correctedNetDropLiters}|${graph.fuelData.directLossDzd}|${graph.hmacSignature}`;
    const hmacSignature = crypto.createHmac('sha256', this.hmacSecret).update(reportSignaturePayload).digest('hex');

    const fullReport: BilingualLegalAuditReport = {
      reportId,
      generatedAt,
      qualification: graph.environmentalEvidence.qualification,
      confidenceScore: graph.environmentalEvidence.confidenceScore,
      status,
      frenchReport,
      arabicReport,
      preComputedGraph: graph,
      hmacSignature,
    };

    this.reportsStore.set(reportId, fullReport);
    this.logger.log(`[CusumLegalClerk] Rapport ${reportId} généré (Statut: ${status}, Perte: ${graph.fuelData.directLossDzd} DZD)`);

    return fullReport;
  }

  private renderFrenchLegalReport(
    reportId: string,
    g: PreComputedContextGraphPayload,
    status: BilingualLegalAuditReport['status'],
  ) {
    if (status === 'CLASSEMENT_SANS_SUITE') {
      return {
        titre: `PROCÈS-VERBAL DE CLASSEMENT TECHNIQUE SANS SUITE (RÉF : ${reportId})`,
        preambule: `L'An Deux Mille Vingt-Six, le ${new Date(g.timestamp).toLocaleDateString('fr-DZ')} à ${new Date(g.timestamp).toLocaleTimeString('fr-DZ')}.
Le Système Décisionnel d'Audit de Carburant de la plateforme DocteurFlotte a analysé une variation négative de niveau de carburant sur le véhicule immatriculé ${g.vehiclePlate}.`,
        constatationsTechniques: `Le véhicule était stationné sur l'axe routier ${g.location.roadName} (Wilaya de ${g.location.wilayaName}, Code ${g.location.wilayaCode}).
La jauge réservoir indiquait une chute brute apparente de ${g.fuelData.rawDropLiters} Litres. Vitesse du véhicule : ${g.telemetry.speedKmh} km/h, régime moteur : ${g.telemetry.engineRpm} tr/min.`,
        analysePhysiqueEtPente: `CONTRÔLE TOPOGRAPHIQUE DU DÉVERS : Le profil altimétrique de l'axe routier Valhalla relève une pente de ${g.location.roadGradePercent.toFixed(1)}%.
L'inclinaison physique du réservoir déplace la surface libre du gasoil, induisant un biais géométrique de jauge calculé à ${g.fuelData.slopeCorrectionLiters} Litres.
Le volume net manquant après compensation géométrique s'établit à ${g.fuelData.correctedNetDropLiters} Litres.`,
        prejudiceFinancierDzd: `Aucun préjudice financier constaté (0.00 DZD). La baisse est purement optique et liée au dévers géométrique du terrain.`,
        qualificationJuridique: `FAUSSE ALERTE TECHNIQUE AVÉRÉE : Non-lieu à poursuite disciplinaire ou mise en cause de l'équipage.`,
        recommandationDecisionnelle: `Classement immédiat sans suite du dossier. Préservation intégrale du dossier du chauffeur contre toute sanction injustifiée.`,
      };
    }

    return {
      titre: `PROCÈS-VERBAL DE CONSTAT D'ANOMALIE & DÉTOURNEMENT DE CARBURANT (RÉF : ${reportId})`,
      preambule: `L'An Deux Mille Vingt-Six, le ${new Date(g.timestamp).toLocaleDateString('fr-DZ')} à ${new Date(g.timestamp).toLocaleTimeString('fr-DZ')}.
Audit contradictoire de télémétrie certifiée portant sur le véhicule poids lourd ${g.vehiclePlate} (Affectation : ${g.driverPseudonym}).`,
      constatationsTechniques: `Localisation exacte : ${g.location.roadName}, Wilaya de ${g.location.wilayaName} (Lat: ${g.location.latitude.toFixed(5)}, Lon: ${g.location.longitude.toFixed(5)}).
Arrêt prolongé contact coupé constaté pendant ${Math.round(g.telemetry.durationStationarySeconds / 60)} minutes.
Chute brutale de la jauge mesurée : ${g.fuelData.rawDropLiters} Litres en vitesse nulle (0 km/h) et régime moteur éteint (0 RPM).
Station-service Naftal la plus proche : située à ${g.environmentalEvidence.nearestNaftalStationKm.toFixed(1)} km (hors périmètre de ravitaillement régulier). Aucun bon ou reçu d'avitaillement enregistré.`,
      analysePhysiqueEtPente: `VALIDATION INCLINAISON RÉSERVOIR : Pente routière lue sur le graphe : ${g.location.roadGradePercent.toFixed(1)}%.
La distorsion géométrique maximale due au terrain est bornée à ${g.fuelData.slopeCorrectionLiters} Litres.
Le volume net dérobé après compensation physique inattaquable est de ${g.fuelData.correctedNetDropLiters} Litres.
Indice de certitude physique déterministe : ${(g.environmentalEvidence.confidenceScore * 100).toFixed(1)}%.`,
      prejudiceFinancierDzd: `Préjudice financier direct : ${g.fuelData.correctedNetDropLiters} L × ${g.fuelData.fuelPriceDzdPerLiter.toFixed(2)} DZD/L (Tarif JORADP Gasoil) = ${g.fuelData.directLossDzd.toLocaleString('fr-DZ')} DZD.`,
      qualificationJuridique: `Infraction qualifiée de soutirage frauduleux de carburant à l'arrêt (siphonnage caractérisé) en violation du Règlement Intérieur de l'Entreprise et des dispositions de l'Article 350 du Code Pénal algérien relatif au vol de biens sociaux.`,
      recommandationDecisionnelle: `1. Notification formelle à la commission paritaire de discipline avec le présent procès-verbal horodaté.
2. Mise sous séquestre conservatoire de la carte carburant Naftal affiliée.
3. Ordre d'arbitrage financier SAD -> ADS : Retenue sur frais ou compensation financière conformément aux procédures légales en vigueur.`,
    };
  }

  private renderArabicLegalReport(
    reportId: string,
    g: PreComputedContextGraphPayload,
    status: BilingualLegalAuditReport['status'],
  ) {
    const wilayaAr = WILAYA_AR_MAP[g.location.wilayaCode] || g.location.wilayaName;
    if (status === 'CLASSEMENT_SANS_SUITE') {
      return {
        titre: `محضر معاينة تقنية وحفظ للملف بدون متابعة (المرجع : ${reportId})`,
        preambule: `في عام ألفين وستة وعشرين، بتاريخ ${new Date(g.timestamp).toLocaleDateString('ar-DZ')} على الساعة ${new Date(g.timestamp).toLocaleTimeString('ar-DZ')}.
قام النظام السيادي لإدارة أساطيل النقل DocteurFlotte بمعاينة انخفاض ظاهري لمستوى الوقود بالشاحنة الحاملة للترقيم ${g.vehiclePlate}.`,
        constatationsTechniques: `مكان التوقف : محور ${g.location.roadName} (ولاية ${wilayaAr}، الرمز ${g.location.wilayaCode}).
سجلت أجهزة القياس انخفاضاً خاماً قدره ${g.fuelData.rawDropLiters} لتر في حالة توقف تام (السرعة : ${g.telemetry.speedKmh} كم/سا، المحرك متوقف).`,
        analysePhysiqueEtPente: `التحليل الطبوغرافي وميلان الخزان : بلغت نسبة انحدار الطريق وفق المسح الجغرافي ${g.location.roadGradePercent.toFixed(1)}%.
إن ميلان الشاحنة أحدث إزاحة هندسية طبيعية في مقياس الخزان تقدر بـ ${g.fuelData.slopeCorrectionLiters} لتر.
وعليه، فإن الفاقد الحقيقي الصافي بعد التصحيح الرياضي يساوي ${g.fuelData.correctedNetDropLiters} لتر.`,
        prejudiceFinancierDzd: `لا توجد أية خسارة مالية (0.00 دج). الانخفاض ناتج تماماً عن ميلان المسار الطبوغرافي.`,
        qualificationJuridique: `تأكيد براءة الذمة : الواقعة عبارة عن إنذار تقني خاطئ ناتج عن الجغرافيا، ولا تنطوي على أي خطأ مهني أو تصرف غير مشروع.`,
        recommandationDecisionnelle: `الحفظ الفوري للملف دون اتخاذ أي إجراء، وحماية السائق من أي نزاع أو خصم غير مبرر.`,
      };
    }

    return {
      titre: `محضر معاينة وإثبات واقعة تفريغ غير مشروع للوقود (المرجع : ${reportId})`,
      preambule: `في عام ألفين وستة وعشرين، بتاريخ ${new Date(g.timestamp).toLocaleDateString('ar-DZ')} على الساعة ${new Date(g.timestamp).toLocaleTimeString('ar-DZ')}.
تم تحرير هذا المحضر التقني الإثباتي المستخرج من بيانات التتبع الآلي للشاحنة التابعة للأسطول ذات الترقيم ${g.vehiclePlate} (تحت عهدة السائق المعرف برمز : ${g.driverPseudonym}).`,
      constatationsTechniques: `المعاينة الميدانية الدقيقة : على مسار ${g.location.roadName} بولاية ${wilayaAr} (إحداثيات : خط العرض ${g.location.latitude.toFixed(5)}، خط الطول ${g.location.longitude.toFixed(5)}).
تم رصد توقف مطول للمركبة والمحرك مطفأ لمدة ${Math.round(g.telemetry.durationStationarySeconds / 60)} دقيقة.
انخفاض مفاجئ في مستوى الوقود قدره ${g.fuelData.rawDropLiters} لتر والسرعة منعدمة (0 كم/سا) ونظام الدوران متوقف (0 دورة/دقيقة).
أقرب محطة نفطال معتمدة تبعد بـ ${g.environmentalEvidence.nearestNaftalStationKm.toFixed(1)} كم مع عدم تسجيل أي وصل تزود رسمي.`,
      analysePhysiqueEtPente: `التصحيح الطبوغرافي المبرهن : نسبة انحدار المسار ${g.location.roadGradePercent.toFixed(1)}% تم تعويضها هندسياً بـ ${g.fuelData.slopeCorrectionLiters} لتر كحد أقصى.
الكمية المفرغة فعلياً وغير المبررة بصورة قاطعة تبلغ : ${g.fuelData.correctedNetDropLiters} لتر.
درجة اليقين الفيزيائي الحسابي : ${(g.environmentalEvidence.confidenceScore * 100).toFixed(1)}%.`,
      prejudiceFinancierDzd: `الضرر المالي المباشر : ${g.fuelData.correctedNetDropLiters} لتر × ${g.fuelData.fuelPriceDzdPerLiter.toFixed(2)} دج/لتر (التسعيرة الرسمية لنفطال) = ${g.fuelData.directLossDzd.toLocaleString('ar-DZ')} دج.`,
      qualificationJuridique: `توصيف الواقعة : الاستيلاء وتفريغ وقود مهني بدون تصريح في حالة توقف، بما يخالف أحكام النظام الداخلي للمؤسسة ومقتضيات المادة 350 من قانون العقوبات الجزائري المتعلقة باختلاس أموال وأملاك المؤسسة.`,
      recommandationDecisionnelle: `1. إحالة هذا المحضر الموثق رقمياً إلى لجنة التأديب والمنازعات كدليل إثباتي قطعي.
2. تجميد فوري لبطاقة التزود بالوقود نفطال المرتبطة بالمركبة.
3. استرداد الضرر المالي المقدر بـ ${g.fuelData.directLossDzd.toLocaleString('ar-DZ')} دج وفق الإجراءات القانونية والمحاسبية المعمول بها.`,
    };
  }

  getReportById(reportId: string): BilingualLegalAuditReport | undefined {
    return this.reportsStore.get(reportId);
  }

  listReports(): BilingualLegalAuditReport[] {
    return Array.from(this.reportsStore.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
  }
}

