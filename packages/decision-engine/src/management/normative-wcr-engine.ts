/**
 * Moteur de Calcul du BFR Normatif (Besoin en Fonds de Roulement en Jours de Chiffre d'Affaires)
 * 
 * Méthode normative des experts-comptables :
 * Pour chaque poste d'exploitation (Stocks, Créances, Dettes fournisseurs, Fiscal/Social) :
 * BFR_composante = Temps d'Écoulement (TE en jours) * Coefficient de Structure (CS)
 * 
 * BFR_jours = Somme(Emplois en jours) - Somme(Ressources en jours)
 * BFR_valeur = BFR_jours * (CA_HT / 365)
 * 
 * Trésorerie Nette Prévisionnelle = FRNG - BFR_valeur
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export type WcrItemNature = 'ASSET_USE' | 'LIABILITY_RESOURCE'; // Emploi (Actif) vs Ressource (Passif)

export interface WcrComponentInput {
  code: string;
  labelFr: string;
  nature: WcrItemNature;
  rotationDays: number; // Temps d'écoulement TE en jours (ex: 60 jours clients)
  annualFlowAmount: DecimalValue | string; // Flux annuel de référence (ex: Achats TTC, Salaires)
}

export interface NormativeWcrInputs {
  annualRevenueHt: DecimalValue | string; // Chiffre d'affaires annuel HT
  components: WcrComponentInput[];
  workingCapitalFrng?: DecimalValue | string; // Fonds de Roulement Net Global (si disponible)
}

export interface WcrComponentResult {
  code: string;
  labelFr: string;
  nature: WcrItemNature;
  rotationDays: number;
  structureCoefficient: string; // CS = Flux / CA HT
  wcrDays: string; // TE * CS
  wcrValueDzd: string; // Montant équivalent en DA
}

export interface NormativeWcrResult {
  annualRevenueHt: string;
  totalAssetUsesDays: string; // Total emplois en jours de CA
  totalLiabilityResourcesDays: string; // Total ressources en jours de CA
  netWcrDays: string; // BFR en jours de CA HT
  netWcrDzd: string; // BFR en DA
  workingCapitalFrngDzd?: string;
  netForecastCashDzd?: string; // Trésorerie nette prévisionnelle = FRNG - BFR
  components: WcrComponentResult[];
  isDeficitRisk: boolean;
  severity: Severity;
  summaryFr: string;
}

export class NormativeWcrEngine {
  /**
   * Calcule le BFR normatif selon la méthode des composantes en jours de CA
   */
  public static calculate(
    inputs: NormativeWcrInputs,
    packVersion = 'DZ_MANAGEMENT_2026_V1'
  ): {
    result: NormativeWcrResult;
    trace: RuleExecutionTrace;
  } {
    const startTime = Date.now();
    const caHt = EngineMath.from(inputs.annualRevenueHt);
    if (caHt.isZero()) {
      throw new Error('Le chiffre d affaires annuel HT ne peut être nul pour le calcul du BFR normatif.');
    }

    const dailyCa = EngineMath.divide(caHt, new EngineDecimal('365'), 'ERROR')!;

    let totalUsesDays = new EngineDecimal('0');
    let totalResourcesDays = new EngineDecimal('0');

    const componentsResults: WcrComponentResult[] = [];

    for (const comp of inputs.components) {
      const flow = EngineMath.from(comp.annualFlowAmount);
      // CS = Flux / CA_HT
      const cs = EngineMath.divide(flow, caHt, 'ERROR')!;
      const te = new EngineDecimal(String(comp.rotationDays));
      // BFR composante en jours = TE * CS
      const wcrDays = te.times(cs).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
      // Montant en DA = wcrDays * dailyCa
      const wcrVal = wcrDays.times(dailyCa).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

      if (comp.nature === 'ASSET_USE') {
        totalUsesDays = totalUsesDays.plus(wcrDays);
      } else {
        totalResourcesDays = totalResourcesDays.plus(wcrDays);
      }

      componentsResults.push({
        code: comp.code,
        labelFr: comp.labelFr,
        nature: comp.nature,
        rotationDays: comp.rotationDays,
        structureCoefficient: cs.toFixed(4),
        wcrDays: wcrDays.toFixed(2),
        wcrValueDzd: wcrVal.toFixed(2),
      });
    }

    // BFR net en jours = Total Emplois - Total Ressources
    const netWcrDays = totalUsesDays.minus(totalResourcesDays);
    const netWcrDzd = netWcrDays.times(dailyCa).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

    let frngDzd: string | undefined;
    let forecastCash: DecimalValue | undefined;
    let isDeficitRisk = false;

    if (inputs.workingCapitalFrng !== undefined) {
      const frng = EngineMath.from(inputs.workingCapitalFrng);
      frngDzd = frng.toFixed(2);
      forecastCash = frng.minus(netWcrDzd);
      isDeficitRisk = forecastCash.isNegative();
    }

    let severity = Severity.INFO;
    if (isDeficitRisk) {
      severity = Severity.MAJEUR; // BFR excède le FRNG : trésorerie prévisionnelle négative
    }

    const summaryFr = `BFR Normatif : ${netWcrDays.toFixed(1)} jours de CA HT (${netWcrDzd.toFixed(2)} DA). Emplois : ${totalUsesDays.toFixed(1)}j, Ressources : ${totalResourcesDays.toFixed(1)}j.${
      forecastCash !== undefined
        ? ` Trésorerie nette prévisionnelle : ${forecastCash.toFixed(2)} DA ${
            isDeficitRisk ? '(Tension de trésorerie : besoin de concours bancaires)' : '(Trésorerie saine)'
          }.`
        : ''
    }`;

    return {
      result: {
        annualRevenueHt: caHt.toFixed(2),
        totalAssetUsesDays: totalUsesDays.toFixed(2),
        totalLiabilityResourcesDays: totalResourcesDays.toFixed(2),
        netWcrDays: netWcrDays.toFixed(2),
        netWcrDzd: netWcrDzd.toFixed(2),
        workingCapitalFrngDzd: frngDzd,
        netForecastCashDzd: forecastCash ? forecastCash.toFixed(2) : undefined,
        components: componentsResults,
        isDeficitRisk,
        severity,
        summaryFr,
      },
      trace: {
        ruleCode: 'NORMATIVE_WCR_CALCULATION',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          annualRevenueHt: caHt.toFixed(2),
          componentsCount: inputs.components.length,
          workingCapitalFrng: frngDzd,
        },
        parametersRead: {},
        legalRef: 'Méthode normative du Conseil Supérieur de l Ordre des Experts-Comptables / SCF',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: isDeficitRisk ? 'RISK_DETECTED' : 'COMPLIANT',
        humanReviewRequired: isDeficitRisk,
        notes: summaryFr,
      },
    };
  }
}
