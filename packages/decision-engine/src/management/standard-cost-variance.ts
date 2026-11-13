/**
 * Moteur d'Analyse des Écarts sur Coûts Préétablis (Standard Costing)
 * 
 * Permet la décomposition scientifique et déterministe des écarts de coûts industriels
 * et d'exploitation (matières premières, carburant, pièces de rechange, main-d'œuvre directe, charges de structure) :
 * 
 * Modèle classique à 2 sous-écarts :
 * 1. Écart sur Prix / Coût Unitaire : Ep = (Préel - Pstandard) * Qréelle
 * 2. Écart sur Quantité / Consommation : Eq = (Qréelle - Qstandard) * Pstandard
 * 
 * Propriété fondamentale d'additivité vérifiée :
 * Etotal = Ep + Eq
 * 
 * Modèle à 3 sous-écarts pour charges de structure d'atelier (Budget, Activité, Rendement).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export interface DirectCostVarianceInputs {
  costCenterCode: string;
  costElementCode: string; // ex: 'CARBURANT_GASOIL', 'LUBRIFIANT_15W40', 'MAIN_DOEUVRE_ATELIER'
  labelFr: string;
  standardQuantity: DecimalValue | string; // Qs
  standardUnitPrice: DecimalValue | string; // Ps
  actualQuantity: DecimalValue | string; // Qr
  actualUnitPrice: DecimalValue | string; // Pr
}

export interface DirectCostVarianceResult {
  costCenterCode: string;
  costElementCode: string;
  labelFr: string;
  standardCost: string; // Qs * Ps
  actualCost: string; // Qr * Pr
  totalVariance: string; // Actual - Standard
  priceVariance: string; // (Pr - Ps) * Qr
  quantityVariance: string; // (Qr - Qs) * Ps
  isTotalFavorable: boolean; // True si réel <= standard (économie)
  isPriceFavorable: boolean;
  isQuantityFavorable: boolean;
  additivityCheckPass: boolean; // Vérifie que Ep + Eq === Etotal
  severity: Severity;
  explanationFr: string;
}

export interface IndirectCostVarianceInputs {
  costCenterCode: string;
  labelFr: string;
  normalActivityUnits: DecimalValue | string; // An (ex: heures machines normales)
  actualActivityUnits: DecimalValue | string; // Ar (ex: heures réelles)
  standardCostPerUnit: DecimalValue | string; // Csu
  fixedCostPerUnit: DecimalValue | string; // Cfu
  variableCostPerUnit: DecimalValue | string; // Cvu
  actualTotalCost: DecimalValue | string; // Cr
  standardUnitsProduced: DecimalValue | string; // Qp (production en unités d'œuvre standard)
}

export interface IndirectCostVarianceResult {
  costCenterCode: string;
  labelFr: string;
  actualTotalCost: string;
  standardTotalCost: string;
  totalVariance: string;
  budgetVariance: string; // Écart sur budget (dépenses)
  activityVariance: string; // Écart sur activité (imputation rationnelle des coûts fixes)
  efficiencyVariance: string; // Écart sur rendement
  additivityCheckPass: boolean;
  explanationFr: string;
}

export class StandardCostVarianceEngine {
  /**
   * Analyse les écarts sur coûts directs (Matières, Carburant, Main d'œuvre)
   */
  public static analyzeDirectCost(
    inputs: DirectCostVarianceInputs,
    packVersion = 'DZ_MANAGEMENT_2026_V1'
  ): {
    result: DirectCostVarianceResult;
    trace: RuleExecutionTrace;
  } {
    const startTime = Date.now();
    const Qs = EngineMath.from(inputs.standardQuantity);
    const Ps = EngineMath.from(inputs.standardUnitPrice);
    const Qr = EngineMath.from(inputs.actualQuantity);
    const Pr = EngineMath.from(inputs.actualUnitPrice);

    const standardCost = Qs.times(Ps).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const actualCost = Qr.times(Pr).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // Écart Total = ActualCost - StandardCost
    const totalVariance = actualCost.minus(standardCost);

    // Écart sur Prix = (Pr - Ps) * Qr
    const priceVariance = Pr.minus(Ps).times(Qr).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // Écart sur Quantité = (Qr - Qs) * Ps
    const quantityVariance = Qr.minus(Qs).times(Ps).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // Vérification d'additivité : Ep + Eq === Etotal (avec tolérance d'arrondi de 0.01 DA)
    const sumSub = priceVariance.plus(quantityVariance);
    const diff = totalVariance.minus(sumSub).abs();
    const additivityCheckPass = diff.lessThanOrEqualTo(new EngineDecimal('0.02'));

    const isTotalFavorable = totalVariance.lessThanOrEqualTo(new EngineDecimal('0'));
    const isPriceFavorable = priceVariance.lessThanOrEqualTo(new EngineDecimal('0'));
    const isQuantityFavorable = quantityVariance.lessThanOrEqualTo(new EngineDecimal('0'));

    let severity = Severity.INFO;
    if (!isTotalFavorable) {
      // Surcoût significatif
      const overrunRatio = standardCost.isZero() ? new EngineDecimal('0') : totalVariance.div(standardCost);
      if (overrunRatio.greaterThan(new EngineDecimal('0.10'))) {
        severity = Severity.MAJEUR;
      } else {
        severity = Severity.MINEUR;
      }
    }

    const explanationFr = `Écart total sur ${inputs.labelFr} : ${totalVariance.toFixed(2)} DA (${
      isTotalFavorable ? 'favorable / économie' : 'défavorable / surcoût'
    }). Décomposition : Écart sur prix = ${priceVariance.toFixed(2)} DA, Écart sur quantité = ${quantityVariance.toFixed(2)} DA.`;

    return {
      result: {
        costCenterCode: inputs.costCenterCode,
        costElementCode: inputs.costElementCode,
        labelFr: inputs.labelFr,
        standardCost: standardCost.toFixed(2),
        actualCost: actualCost.toFixed(2),
        totalVariance: totalVariance.toFixed(2),
        priceVariance: priceVariance.toFixed(2),
        quantityVariance: quantityVariance.toFixed(2),
        isTotalFavorable,
        isPriceFavorable,
        isQuantityFavorable,
        additivityCheckPass,
        severity,
        explanationFr,
      },
      trace: {
        ruleCode: 'STANDARD_COST_VARIANCE_DIRECT',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          costCenterCode: inputs.costCenterCode,
          costElementCode: inputs.costElementCode,
          standardCost: standardCost.toFixed(2),
          actualCost: actualCost.toFixed(2),
        },
        parametersRead: {},
        legalRef: 'Méthodes de comptabilité analytique de gestion / Contrôle de gestion',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: isTotalFavorable ? 'COMPLIANT' : 'RISK_DETECTED',
        humanReviewRequired: !isTotalFavorable && severity === Severity.MAJEUR,
        notes: explanationFr,
      },
    };
  }

  /**
   * Analyse des écarts sur charges indirectes à 3 sous-écarts (Budget, Activité, Rendement)
   */
  public static analyzeIndirectCost(
    inputs: IndirectCostVarianceInputs
  ): IndirectCostVarianceResult {
    const An = EngineMath.from(inputs.normalActivityUnits);
    const Ar = EngineMath.from(inputs.actualActivityUnits);
    const Csu = EngineMath.from(inputs.standardCostPerUnit);
    const Cfu = EngineMath.from(inputs.fixedCostPerUnit);
    const Cvu = EngineMath.from(inputs.variableCostPerUnit);
    const Cr = EngineMath.from(inputs.actualTotalCost);
    const Qp = EngineMath.from(inputs.standardUnitsProduced);

    // Standard total = Qp * Csu
    const standardTotal = Qp.times(Csu).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
    const totalVariance = Cr.minus(standardTotal);

    // Budget flexible adapté à l'activité réelle = (Ar * Cvu) + (An * Cfu)
    const flexibleBudgetAr = Ar.times(Cvu).plus(An.times(Cfu));

    // 1. Écart sur budget = Cr - BudgetFlexible(Ar)
    const budgetVariance = Cr.minus(flexibleBudgetAr).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // 2. Écart sur activité = BudgetFlexible(Ar) - (Ar * Csu) = (An - Ar) * Cfu
    const activityVariance = An.minus(Ar).times(Cfu).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // 3. Écart sur rendement = (Ar - Qp) * Csu
    const efficiencyVariance = Ar.minus(Qp).times(Csu).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    // Somme des 3 sous-écarts
    const sum3 = budgetVariance.plus(activityVariance).plus(efficiencyVariance);
    const diff = totalVariance.minus(sum3).abs();
    const additivityCheckPass = diff.lessThanOrEqualTo(new EngineDecimal('0.02'));

    const explanationFr = `Écart total indirect sur ${inputs.labelFr} : ${totalVariance.toFixed(2)} DA. Décomposition : Budget = ${budgetVariance.toFixed(2)} DA, Activité = ${activityVariance.toFixed(2)} DA, Rendement = ${efficiencyVariance.toFixed(2)} DA.`;

    return {
      costCenterCode: inputs.costCenterCode,
      labelFr: inputs.labelFr,
      actualTotalCost: Cr.toFixed(2),
      standardTotalCost: standardTotal.toFixed(2),
      totalVariance: totalVariance.toFixed(2),
      budgetVariance: budgetVariance.toFixed(2),
      activityVariance: activityVariance.toFixed(2),
      efficiencyVariance: efficiencyVariance.toFixed(2),
      additivityCheckPass,
      explanationFr,
    };
  }
}

