/**
 * AUD-02 : Reconstitution Déterministe du Chiffre d'Affaires (Indice de Cohérence Matérielle)
 * 
 * Spécifications formelles :
 * 1. Négoce :
 *    CAMV = SI + achats + frais - SF - pertes_justifiées (par famille)
 *    CA reconstitué = Σ (CAMV × k)
 *    Une perte n'est « justifiée » que si la pièce justificative existe et est validée.
 * 2. Industrie (par intrant directeur et ratio d'énergie) :
 *    M_cons = Q_SI + Q_achats - Q_SF - Q_pertes_justifiées
 *    Q_produite = M_cons × (1 - alpha) ÷ q_std
 *    CA reconstitué = Q_produite × P_unitaire
 *    Contrôle croisé énergie : ratio (kWh / unités) comparé à [mu - k·sigma, mu + k·sigma]
 * 3. Services :
 *    Reconstitution par consommables traceurs : N_prestations = Q_consommable ÷ q_unitaire
 * 4. RÈGLE 6 & Cadre Légal :
 *    Il s'agit d'un INDICE de minoration éventuelle (art. 43 CPF), JAMAIS d'un redressement automatique.
 *    Revue humaine obligatoire (humanReviewRequired = true).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export type ActivitySectorType = 'COMMERCE_NEGOCE' | 'INDUSTRIE_PRODUCTION' | 'SERVICES';

export interface MerchandiseFamilyInput {
  familyCode: string;
  familyName: string;
  initialStockDzd: DecimalValue | string;
  purchasesDzd: DecimalValue | string;
  incomingFreightDzd?: DecimalValue | string; // Frais accessoires d achat
  finalStockDzd: DecimalValue | string;
  declaredLossesDzd?: DecimalValue | string; // Pertes, démarque, avaries
  isLossJustified?: boolean; // Justifiée par PV ou constat légal
  markupMultiplier: DecimalValue | string; // Coefficient multiplicateur (k = Prix Vente / Prix Achat)
}

export interface ManufacturingIntrantInput {
  materialCode: string;
  materialName: string;
  initialQuantity: DecimalValue | string;
  purchasedQuantity: DecimalValue | string;
  finalQuantity: DecimalValue | string;
  justifiedLossQuantity?: DecimalValue | string;
  normalScrapRate: DecimalValue | string; // alpha : taux de déchet technique normal
  standardUnitConsumption: DecimalValue | string; // q_std : quantité d intrant par unité finie
  averageSellingPriceDzd: DecimalValue | string;
  consumedKwh?: DecimalValue | string; // Énergie électrique consommée
  energyBench?: {
    meanKwhPerUnit: DecimalValue | string; // mu
    stdDevKwhPerUnit: DecimalValue | string; // sigma
    toleranceMultiplier: DecimalValue | string; // k (ex: 2.0 pour 2 sigma)
  };
}

export interface ServiceConsumableInput {
  tracerCode: string;
  tracerName: string;
  consumedQuantity: DecimalValue | string;
  standardDosePerService: DecimalValue | string; // q_unitaire
  averageServicePriceDzd: DecimalValue | string;
}

export interface RevenueReconstructionOptions {
  // Tolérance relative admise
  toleranceRatio?: DecimalValue | string;
  toleranceAmountDzd?: DecimalValue | string; // Seuil plancher de matérialité en DA
  packVersion?: string;
}

export interface FamilyReconstructionResult {
  familyCode: string;
  familyName: string;
  cogsDzd: string; // CAMV
  unjustifiedLossDzd: string;
  markupMultiplier: string;
  reconstructedRevenueDzd: string;
}

export interface RevenueReconstructionReport {
  sector: ActivitySectorType;
  declaredRevenueDzd: string;
  reconstructedRevenueDzd: string;
  varianceAmountDzd: string; // Reconstitué - Déclaré
  varianceRatio: string; // (Reconstitué - Déclaré) / Reconstitué
  isUnderdeclaredIndice: boolean; // Écart positif excédant la tolérance
  isWithinTolerance: boolean;
  toleranceRatio: string;
  toleranceAmountDzd: string;
  energyVarianceDetected?: boolean;
  energyExplanation?: string;
  familiesDetail?: FamilyReconstructionResult[];
  humanReviewRequired: boolean;
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  legalRef: string;
  explanationFr: string;
  trace: RuleExecutionTrace;
}

export class RevenueReconstructionEngine {
  /**
   * Reconstitution du CA pour les entreprises de négoce et distribution (CAMV par famille)
   */
  public static reconstructCommerce(
    declaredRevenueDzd: DecimalValue | string,
    families: MerchandiseFamilyInput[],
    options: RevenueReconstructionOptions = {}
  ): RevenueReconstructionReport {
    const startTime = Date.now();
    const packVersion = options.packVersion ?? 'DZ_AUDIT_2026_V1';
    const toleranceRatio = EngineMath.from(options.toleranceRatio ?? '0.04');
    const toleranceAmountDzd = EngineMath.from(options.toleranceAmountDzd ?? '50000.00');

    const declaredRev = EngineMath.asAmount(declaredRevenueDzd);
    let totalReconstructed = new EngineDecimal('0');
    const familiesDetail: FamilyReconstructionResult[] = [];

    for (const fam of families) {
      const si = EngineMath.asAmount(fam.initialStockDzd);
      const achats = EngineMath.asAmount(fam.purchasesDzd);
      const frais = EngineMath.asAmount(fam.incomingFreightDzd ?? '0.00');
      const sf = EngineMath.asAmount(fam.finalStockDzd);
      const declaredLoss = EngineMath.asAmount(fam.declaredLossesDzd ?? '0.00');
      const isJustified = fam.isLossJustified === true;

      // Une perte n est prise en compte que si elle est dûment justifiée par une pièce probante
      const justifiedLoss = isJustified ? declaredLoss : new EngineDecimal('0');
      const unjustifiedLoss = isJustified ? new EngineDecimal('0') : declaredLoss;

      // CAMV = SI + Achats + Frais - SF - Pertes justifiées
      // Si la perte n est pas justifiée, la marchandise est présumée vendue
      const cogs = si.plus(achats).plus(frais).minus(sf).minus(justifiedLoss);
      const safeCogs = cogs.isNegative() ? new EngineDecimal('0') : cogs;

      const k = EngineMath.from(fam.markupMultiplier);
      const familyReconstructed = safeCogs.times(k);

      totalReconstructed = totalReconstructed.plus(familyReconstructed);

      familiesDetail.push({
        familyCode: fam.familyCode,
        familyName: fam.familyName,
        cogsDzd: EngineMath.asAmount(safeCogs).toFixed(2),
        unjustifiedLossDzd: EngineMath.asAmount(unjustifiedLoss).toFixed(2),
        markupMultiplier: k.toFixed(4),
        reconstructedRevenueDzd: EngineMath.asAmount(familyReconstructed).toFixed(2),
      });
    }

    const reconstructedAmount = EngineMath.asAmount(totalReconstructed);
    const varianceAmount = reconstructedAmount.minus(declaredRev);

    let varianceRatio = new EngineDecimal('0');
    if (reconstructedAmount.greaterThan('0')) {
      varianceRatio = varianceAmount.dividedBy(reconstructedAmount);
    }

    // Un écart positif supérieur à la tolérance constitue un indice d audit
    const isExceedingRatio = varianceRatio.greaterThan(toleranceRatio);
    const isExceedingAmount = varianceAmount.greaterThan(toleranceAmountDzd);
    const isUnderdeclaredIndice = isExceedingRatio && isExceedingAmount;
    const isWithinTolerance = !isUnderdeclaredIndice;

    const explanationFr = isUnderdeclaredIndice
      ? `Indice de discordance de chiffre d affaires négoce : CA reconstitué sur la base des achats consommés et coefficients de vente (${reconstructedAmount.toFixed(2)} DA) supérieur au CA déclaré (${declaredRev.toFixed(2)} DA) d un écart de ${varianceAmount.toFixed(2)} DA (${varianceRatio.times(100).toFixed(2)}%), excédant la tolérance admise.`
      : `Conformité de cohérence de chiffre d affaires : le CA déclaré (${declaredRev.toFixed(2)} DA) est en adéquation avec le CA reconstitué (${reconstructedAmount.toFixed(2)} DA) dans les limites de tolérance.`;

    const trace: RuleExecutionTrace = {
      ruleCode: 'AUD02-RECON-COMMERCE',
      packVersion,
      packHash: 'IN_MEMORY',
      inputs: {
        declaredRevenueDzd: declaredRev.toFixed(2),
        familiesCount: families.length,
      },
      parametersRead: {
        toleranceRatio: toleranceRatio.toFixed(4),
        toleranceAmountDzd: toleranceAmountDzd.toFixed(2),
      },
      legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
      evaluationTimestamp: new Date().toISOString(),
      executionDurationUs: (Date.now() - startTime) * 1000,
      outcome: isUnderdeclaredIndice ? 'RISK_DETECTED' : 'COMPLIANT',
      humanReviewRequired: isUnderdeclaredIndice,
      notes: explanationFr,
    };

    return {
      sector: 'COMMERCE_NEGOCE',
      declaredRevenueDzd: declaredRev.toFixed(2),
      reconstructedRevenueDzd: reconstructedAmount.toFixed(2),
      varianceAmountDzd: varianceAmount.toFixed(2),
      varianceRatio: varianceRatio.toFixed(4),
      isUnderdeclaredIndice,
      isWithinTolerance,
      toleranceRatio: toleranceRatio.toFixed(4),
      toleranceAmountDzd: toleranceAmountDzd.toFixed(2),
      familiesDetail,
      humanReviewRequired: isUnderdeclaredIndice,
      severity: isUnderdeclaredIndice ? Severity.MAJEUR : Severity.INFO,
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
      explanationFr,
      trace,
    };
  }

  /**
   * Reconstitution du CA pour les entreprises industrielles et de production
   * (Intrant directeur + validation croisée ratio d intensité énergétique)
   */
  public static reconstructIndustry(
    declaredRevenueDzd: DecimalValue | string,
    intrant: ManufacturingIntrantInput,
    options: RevenueReconstructionOptions = {}
  ): RevenueReconstructionReport {
    const startTime = Date.now();
    const packVersion = options.packVersion ?? 'DZ_AUDIT_2026_V1';
    const toleranceRatio = EngineMath.from(options.toleranceRatio ?? '0.04');
    const toleranceAmountDzd = EngineMath.from(options.toleranceAmountDzd ?? '50000.00');

    const declaredRev = EngineMath.asAmount(declaredRevenueDzd);
    const qSi = EngineMath.asCostOrQuantity(intrant.initialQuantity);
    const qAchats = EngineMath.asCostOrQuantity(intrant.purchasedQuantity);
    const qSf = EngineMath.asCostOrQuantity(intrant.finalQuantity);
    const qLoss = EngineMath.asCostOrQuantity(intrant.justifiedLossQuantity ?? '0.00');

    // Quantité d intrant consommée = SI + Achats - SF - Pertes justifiées
    const mCons = qSi.plus(qAchats).minus(qSf).minus(qLoss);
    const safeMCons = mCons.isNegative() ? new EngineDecimal('0') : mCons;

    const alpha = EngineMath.from(intrant.normalScrapRate);
    const qStd = EngineMath.asCostOrQuantity(intrant.standardUnitConsumption);

    // Q_produite = M_cons × (1 - alpha) ÷ q_std
    let qProduced = new EngineDecimal('0');
    if (qStd.greaterThan('0')) {
      const netMaterial = safeMCons.times(new EngineDecimal('1').minus(alpha));
      qProduced = netMaterial.dividedBy(qStd);
    }

    const price = EngineMath.asAmount(intrant.averageSellingPriceDzd);
    const reconstructedAmount = EngineMath.asAmount(qProduced.times(price));
    const varianceAmount = reconstructedAmount.minus(declaredRev);

    let varianceRatio = new EngineDecimal('0');
    if (reconstructedAmount.greaterThan('0')) {
      varianceRatio = varianceAmount.dividedBy(reconstructedAmount);
    }

    const isExceedingRatio = varianceRatio.greaterThan(toleranceRatio);
    const isExceedingAmount = varianceAmount.greaterThan(toleranceAmountDzd);
    const isUnderdeclaredIndice = isExceedingRatio && isExceedingAmount;

    // Contrôle croisé énergétique
    let energyVarianceDetected = false;
    let energyExplanation: string | undefined;

    if (intrant.consumedKwh && intrant.energyBench && qProduced.greaterThan('0')) {
      const kwh = EngineMath.from(intrant.consumedKwh);
      const actualKwhPerUnit = kwh.dividedBy(qProduced);
      const mu = EngineMath.from(intrant.energyBench.meanKwhPerUnit);
      const sigma = EngineMath.from(intrant.energyBench.stdDevKwhPerUnit);
      const kFactor = EngineMath.from(intrant.energyBench.toleranceMultiplier);

      const lowerBound = mu.minus(sigma.times(kFactor));
      const upperBound = mu.plus(sigma.times(kFactor));

      if (actualKwhPerUnit.lessThan(lowerBound) || actualKwhPerUnit.greaterThan(upperBound)) {
        energyVarianceDetected = true;
        energyExplanation = `Anomalie d intensité énergétique constatée : ratio observé de ${actualKwhPerUnit.toFixed(2)} kWh/unité en dehors de la plage attendue [${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)} kWh/unité] (mu=${mu.toFixed(2)}, sigma=${sigma.toFixed(2)}).`;
      }
    }

    const explanationFr = isUnderdeclaredIndice
      ? `Indice d anomalie de production industrielle : le CA théorique issu de l intrant directeur (${reconstructedAmount.toFixed(2)} DA pour ${qProduced.toFixed(2)} unités) dépasse le CA déclaré (${declaredRev.toFixed(2)} DA) d un écart de ${varianceAmount.toFixed(2)} DA.${energyExplanation ? ' ' + energyExplanation : ''}`
      : `Cohérence de production industrielle validée : CA déclaré (${declaredRev.toFixed(2)} DA) cohérent avec le volume de matière première consommé.${energyExplanation ? ' ' + energyExplanation : ''}`;

    const trace: RuleExecutionTrace = {
      ruleCode: 'AUD02-RECON-INDUSTRIE',
      packVersion,
      packHash: 'IN_MEMORY',
      inputs: {
        declaredRevenueDzd: declaredRev.toFixed(2),
        materialCode: intrant.materialCode,
        mConsQuantity: safeMCons.toFixed(4),
        qProducedEstimated: qProduced.toFixed(2),
      },
      parametersRead: {
        toleranceRatio: toleranceRatio.toFixed(4),
      },
      legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
      evaluationTimestamp: new Date().toISOString(),
      executionDurationUs: (Date.now() - startTime) * 1000,
      outcome: isUnderdeclaredIndice || energyVarianceDetected ? 'RISK_DETECTED' : 'COMPLIANT',
      humanReviewRequired: isUnderdeclaredIndice || energyVarianceDetected,
      notes: explanationFr,
    };

    return {
      sector: 'INDUSTRIE_PRODUCTION',
      declaredRevenueDzd: declaredRev.toFixed(2),
      reconstructedRevenueDzd: reconstructedAmount.toFixed(2),
      varianceAmountDzd: varianceAmount.toFixed(2),
      varianceRatio: varianceRatio.toFixed(4),
      isUnderdeclaredIndice,
      isWithinTolerance: !isUnderdeclaredIndice && !energyVarianceDetected,
      toleranceRatio: toleranceRatio.toFixed(4),
      toleranceAmountDzd: toleranceAmountDzd.toFixed(2),
      energyVarianceDetected,
      energyExplanation,
      humanReviewRequired: isUnderdeclaredIndice || energyVarianceDetected,
      severity: isUnderdeclaredIndice || energyVarianceDetected ? Severity.MAJEUR : Severity.INFO,
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
      explanationFr,
      trace,
    };
  }

  /**
   * Reconstitution du CA pour les activités de services (par consommables traceurs)
   */
  public static reconstructServices(
    declaredRevenueDzd: DecimalValue | string,
    tracer: ServiceConsumableInput,
    options: RevenueReconstructionOptions = {}
  ): RevenueReconstructionReport {
    const startTime = Date.now();
    const packVersion = options.packVersion ?? 'DZ_AUDIT_2026_V1';
    const toleranceRatio = EngineMath.from(options.toleranceRatio ?? '0.04');
    const toleranceAmountDzd = EngineMath.from(options.toleranceAmountDzd ?? '50000.00');

    const declaredRev = EngineMath.asAmount(declaredRevenueDzd);
    const qConsumed = EngineMath.asCostOrQuantity(tracer.consumedQuantity);
    const dose = EngineMath.asCostOrQuantity(tracer.standardDosePerService);

    let serviceCount = new EngineDecimal('0');
    if (dose.greaterThan('0')) {
      serviceCount = qConsumed.dividedBy(dose);
    }

    const price = EngineMath.asAmount(tracer.averageServicePriceDzd);
    const reconstructedAmount = EngineMath.asAmount(serviceCount.times(price));
    const varianceAmount = reconstructedAmount.minus(declaredRev);

    let varianceRatio = new EngineDecimal('0');
    if (reconstructedAmount.greaterThan('0')) {
      varianceRatio = varianceAmount.dividedBy(reconstructedAmount);
    }

    const isExceedingRatio = varianceRatio.greaterThan(toleranceRatio);
    const isExceedingAmount = varianceAmount.greaterThan(toleranceAmountDzd);
    const isUnderdeclaredIndice = isExceedingRatio && isExceedingAmount;

    const explanationFr = isUnderdeclaredIndice
      ? `Indice de minoration en prestations de services : volume d actes reconstitué à partir du consommable traceur ${tracer.tracerName} (${serviceCount.toFixed(0)} actes soit ${reconstructedAmount.toFixed(2)} DA) supérieur au CA déclaré (${declaredRev.toFixed(2)} DA) d un écart de ${varianceAmount.toFixed(2)} DA.`
      : `Cohérence de l activité de services validée par le consommable traceur ${tracer.tracerName}.`;

    const trace: RuleExecutionTrace = {
      ruleCode: 'AUD02-RECON-SERVICES',
      packVersion,
      packHash: 'IN_MEMORY',
      inputs: {
        declaredRevenueDzd: declaredRev.toFixed(2),
        tracerCode: tracer.tracerCode,
        consumedQuantity: qConsumed.toFixed(2),
        estimatedServices: serviceCount.toFixed(0),
      },
      parametersRead: {
        toleranceRatio: toleranceRatio.toFixed(4),
      },
      legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
      evaluationTimestamp: new Date().toISOString(),
      executionDurationUs: (Date.now() - startTime) * 1000,
      outcome: isUnderdeclaredIndice ? 'RISK_DETECTED' : 'COMPLIANT',
      humanReviewRequired: isUnderdeclaredIndice,
      notes: explanationFr,
    };

    return {
      sector: 'SERVICES',
      declaredRevenueDzd: declaredRev.toFixed(2),
      reconstructedRevenueDzd: reconstructedAmount.toFixed(2),
      varianceAmountDzd: varianceAmount.toFixed(2),
      varianceRatio: varianceRatio.toFixed(4),
      isUnderdeclaredIndice,
      isWithinTolerance: !isUnderdeclaredIndice,
      toleranceRatio: toleranceRatio.toFixed(4),
      toleranceAmountDzd: toleranceAmountDzd.toFixed(2),
      humanReviewRequired: isUnderdeclaredIndice,
      severity: isUnderdeclaredIndice ? Severity.MAJEUR : Severity.INFO,
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
      explanationFr,
      trace,
    };
  }
}
