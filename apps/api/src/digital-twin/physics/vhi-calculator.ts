/**
 * vhi-calculator.ts — Calculateur VHI (Vehicle Health Index) en 3 Étages & XAI
 * Conforme à MASTER_SPEC v3.0 : Non-linéarité, Norme L_-p et Hard Veto Déterministe
 */

import {
  OrganId,
  OperationalStatus,
  VHIComponentDetail,
  VHIReport,
} from '@docteurflotte/contracts';

interface OrganConfigMetadata {
  nameFr: string;
  nameAr: string;
  weight: number;
  alpha: number;
  isVitalSafety: boolean;
  rulUnit: 'HOURS' | 'KM' | 'DAYS';
  nominalLifeValue: number;
}

const ORGAN_METADATA_REGISTRY: Record<OrganId, OrganConfigMetadata> = {
  cylinderHead: {
    nameFr: 'Thermique Culasse & Échangeur',
    nameAr: 'حرارة رأس الأسطوانة والمبادل',
    weight: 0.16,
    alpha: 0.8,
    isVitalSafety: true,
    rulUnit: 'HOURS',
    nominalLifeValue: 8000,
  },
  brakeTribology: {
    nameFr: 'Garnitures & Disques de Frein',
    nameAr: 'فحمات وأقراص الفرامل',
    weight: 0.14,
    alpha: 0.8,
    isVitalSafety: true,
    rulUnit: 'KM',
    nominalLifeValue: 65000,
  },
  engineOil: {
    nameFr: 'Lubrifiant Moteur (Arrhenius)',
    nameAr: 'زيت المحرك (أرهينيوس)',
    weight: 0.12,
    alpha: 0.8,
    isVitalSafety: true,
    rulUnit: 'KM',
    nominalLifeValue: 25000,
  },
  batteryCranking: {
    nameFr: 'Batterie & Démarreur',
    nameAr: 'البطارية وبادئ التشغيل',
    weight: 0.10,
    alpha: 0.8,
    isVitalSafety: true,
    rulUnit: 'DAYS',
    nominalLifeValue: 730, // 2 ans
  },
  injectionDrift: {
    nameFr: 'Injecteurs & Rampe Commune',
    nameAr: 'نظام الحقن وموزع الضغط',
    weight: 0.09,
    alpha: 1.5,
    isVitalSafety: false,
    rulUnit: 'KM',
    nominalLifeValue: 180000,
  },
  turbocharger: {
    nameFr: 'Turbocompresseur (CHRA)',
    nameAr: 'الشاحن التوربيني والمحامل',
    weight: 0.08,
    alpha: 0.8,
    isVitalSafety: true,
    rulUnit: 'HOURS',
    nominalLifeValue: 9000,
  },
  dpfFilter: {
    nameFr: 'Filtre à Particules (FAP)',
    nameAr: 'مرشح الجسيمات (FAP)',
    weight: 0.08,
    alpha: 1.5,
    isVitalSafety: false,
    rulUnit: 'KM',
    nominalLifeValue: 140000,
  },
  clutchWear: {
    nameFr: 'Disque d\'Embrayage',
    nameAr: 'قرص القابض (الدبرياج)',
    weight: 0.07,
    alpha: 1.5,
    isVitalSafety: false,
    rulUnit: 'KM',
    nominalLifeValue: 120000,
  },
  alternatorBelt: {
    nameFr: 'Alternateur & Courroie',
    nameAr: 'المولد وسير الملحقات',
    weight: 0.05,
    alpha: 1.5,
    isVitalSafety: false,
    rulUnit: 'HOURS',
    nominalLifeValue: 3500,
  },
  chassisFatigue: {
    nameFr: 'Fatigue Châssis & Suspension',
    nameAr: 'هيكل وشاسيه المركبة',
    weight: 0.04,
    alpha: 1.5,
    isVitalSafety: false,
    rulUnit: 'KM',
    nominalLifeValue: 350000,
  },
  tyreAbrasion: {
    nameFr: 'Usure Bandes de Roulement',
    nameAr: 'مداس الإطارات المطاطية',
    weight: 0.04,
    alpha: 1.5,
    isVitalSafety: false,
    rulUnit: 'KM',
    nominalLifeValue: 75000,
  },
  fuelAntiSiphon: {
    nameFr: 'Circuit Carburant & Intégrité',
    nameAr: 'دائرة الوقود ومكافحة السرقة',
    weight: 0.03,
    alpha: 1.5,
    isVitalSafety: false,
    rulUnit: 'HOURS',
    nominalLifeValue: 5000,
  },
};

export class VHICalculator {
  private static readonly RISK_AVERSION_P = 3.5;
  private static readonly HARD_VETO_MARGIN = 10.0;

  /**
   * Calcule le rapport complet VHI à partir du vecteur des 12 dégradations D_i
   */
  public static calculate(
    degradations: Record<OrganId, number>,
    timestamp: number = Math.floor(Date.now() / 1000),
  ): VHIReport {
    const organKeys = Object.keys(ORGAN_METADATA_REGISTRY) as OrganId[];
    const organDetails = {} as Record<OrganId, VHIComponentDetail>;

    let minScore = 100.0;
    let bottleneck: OrganId = 'cylinderHead';

    let lowestVitalScore = 100.0;
    let lowestVitalOrgan: OrganId = 'cylinderHead';

    // ------------------------------------------------------------------------
    // ÉTAGE 1 : TRANSFORMATION NON-LINÉAIRE (S_i en [1, 100])
    // S_i = max(1.0, 100 * (1 - clamp(D_i, 0, 1)^α_i))
    // ------------------------------------------------------------------------
    for (const key of organKeys) {
      const meta = ORGAN_METADATA_REGISTRY[key];
      const rawD = degradations[key] ?? 0.0;
      const clampedD = Math.max(0.0, Math.min(1.0, rawD));

      const nonLinearWear = Math.pow(clampedD, meta.alpha);
      const score = Math.max(1.0, Math.round(100.0 * (1.0 - nonLinearWear)));

      // Estimation RUL résiduelle proportionnelle
      const remainingRatio = Math.max(0.0, 1.0 - clampedD);
      const rulValue = Math.round(meta.nominalLifeValue * remainingRatio);

      organDetails[key] = {
        organId: key,
        nameFr: meta.nameFr,
        nameAr: meta.nameAr,
        degradationIndex: Number(clampedD.toFixed(4)),
        healthScore: score,
        weight: meta.weight,
        alphaNonLinearity: meta.alpha,
        isVitalSafetyOrgan: meta.isVitalSafety,
        rulEstimate: {
          value: rulValue,
          unit: meta.rulUnit,
        },
        physicalSummary: `D=${(clampedD * 100).toFixed(1)}% -> Score=${score}/100 (RUL: ${rulValue} ${meta.rulUnit})`,
      };

      if (score < minScore) {
        minScore = score;
        bottleneck = key;
      }

      if (meta.isVitalSafety && score < lowestVitalScore) {
        lowestVitalScore = score;
        lowestVitalOrgan = key;
      }
    }

    // ------------------------------------------------------------------------
    // ÉTAGE 2 : MOYENNE HARMONIQUE GÉNÉRALISÉE (NORME L_-p)
    // VHI_soft = ( ∑ w_i * S_i^(-p) )^(-1/p)
    // ------------------------------------------------------------------------
    const p = this.RISK_AVERSION_P;
    let weightedHarmonicSum = 0.0;

    for (const key of organKeys) {
      const detail = organDetails[key];
      const s = Math.max(1.0, detail.healthScore);
      weightedHarmonicSum += detail.weight * Math.pow(s, -p);
    }

    const vhiSoftRaw = Math.pow(weightedHarmonicSum, -1.0 / p);
    const vhiSoft = Number(Math.max(1.0, Math.min(100.0, vhiSoftRaw)).toFixed(1));

    // ------------------------------------------------------------------------
    // ÉTAGE 3 : COUPE-CIRCUIT DÉTERMINISTE ("HARD VETO")
    // VHI_final = min(VHI_soft, min_{c ∈ C}(S_c) + Marge_veto)
    // ------------------------------------------------------------------------
    const vetoCeiling = lowestVitalScore + this.HARD_VETO_MARGIN;
    let vhiFinal = vhiSoft;
    let hardVetoTriggered = false;
    let hardVetoOrgan: OrganId | null = null;

    if (vhiSoft > vetoCeiling || lowestVitalScore <= 35.0) {
      vhiFinal = Number(Math.max(1.0, Math.min(vhiSoft, vetoCeiling)).toFixed(1));
      hardVetoTriggered = true;
      hardVetoOrgan = lowestVitalOrgan;
    }

    // Qualification du statut opérationnel
    let operationalStatus: OperationalStatus = 'OPTIMAL';
    if (vhiFinal < 50.0 || (hardVetoTriggered && vhiFinal <= 35.0)) {
      operationalStatus = 'CRITIQUE_VETO';
    } else if (vhiFinal < 70.0) {
      operationalStatus = 'MAINTENANCE_REQUISE';
    } else if (vhiFinal < 85.0) {
      operationalStatus = 'SURVEILLANCE';
    } else {
      operationalStatus = 'OPTIMAL';
    }

    // Génération de la preuve et explication XAI (sans aucune boîte noire)
    const bottleneckDetail = organDetails[bottleneck];
    let explanation = `VHI: ${vhiFinal}/100 [${operationalStatus}]. Organe limitant: ${bottleneckDetail.nameFr} ` +
      `(${bottleneckDetail.healthScore}/100, Dégradation ${(bottleneckDetail.degradationIndex * 100).toFixed(1)}%).`;

    if (hardVetoTriggered && hardVetoOrgan) {
      explanation += ` ⚠️ HARD VETO ACTIF : L'organe vital '${organDetails[hardVetoOrgan].nameFr}' est dégradé ` +
        `à ${lowestVitalScore}/100, plafonnant le VHI à ${vhiFinal}/100 (Marge de sécurité +10 pts).`;
    }

    return {
      vhiFinal,
      vhiSoft,
      operationalStatus,
      bottleneckComponent: bottleneck,
      bottleneckScore: minScore,
      hardVetoTriggered,
      hardVetoOrgan,
      organDetails,
      timestamp,
      explanation,
    };
  }
}
