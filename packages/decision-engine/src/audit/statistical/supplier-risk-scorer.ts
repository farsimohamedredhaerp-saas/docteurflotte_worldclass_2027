/**
 * Pilier D2 : Fournisseurs à Examiner (Scoring Statistique Multi-Indicateurs)
 * 
 * Spécifications formelles :
 * 1. Indice de séquence anormale : factures aux numéros consécutifs (N, N+1)
 *    émises à plusieurs semaines d intervalle (indice de fournisseur dédié / coquille).
 * 2. Arrondis suspects : ratio élevé de montants parfaitement ronds (multiples de 1 000 DA, .00 centimes).
 * 3. Indice de fractionnement : regroupement de factures multiples sous les seuils réglementaires.
 * 4. Score de 0 à 100 avec décomposition transparente de la contribution de chaque indicateur.
 * 5. RÈGLE 6 & Déontologie :
 *    - Libellé obligatoire : « Fournisseur à examiner ».
 *    - Revue humaine obligatoire (humanReviewRequired = true).
 *    - JAMAIS d accusation directe.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export interface SupplierInvoiceItem {
  id: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  amountTtc: DecimalValue | string;
  paymentMethod?: string;
}

export interface SupplierAuditData {
  supplierId: string;
  supplierName: string;
  supplierNif?: string;
  invoices: SupplierInvoiceItem[];
}

export interface SupplierScorerWeights {
  sequenceWeight: number; // ex: 30
  roundAmountsWeight: number; // ex: 25
  splittingWeight: number; // ex: 25
  identifierWeight: number; // ex: 20
}

export interface SupplierScorerOptions {
  weights?: SupplierScorerWeights;
  minDaysGapForSequence?: number; // Nombre de jours minimum pour considérer l intervalle anormal (ex: 21 jours)
  minInvoiceCount?: number;
  reviewThreshold?: number; // Score au-dessus duquel la revue est requise (ex: 40)
  packVersion?: string;
}

export interface FactorContribution {
  indicatorCode: string;
  indicatorName: string;
  pointsContribution: number;
  maxPossiblePoints: number;
  rawMetricValue: string;
  isTriggered: boolean;
  explanationFr: string;
}

export interface SupplierAuditResult {
  supplierId: string;
  supplierName: string;
  supplierNif?: string;
  invoiceCount: number;
  totalVolumeTtcDzd: string;
  riskScore: number; // 0 à 100
  ratingLabel: 'FOURNISSEUR_A_EXAMINER' | 'FOURNISSEUR_CONFORME' | 'NON_EVALUABLE';
  humanReviewRequired: boolean;
  contributions: FactorContribution[];
  severity: Severity;
  evidenceLevel: EvidenceLevel;
  legalRef: string;
  explanationFr: string;
  trace: RuleExecutionTrace;
}

export class SupplierRiskScorer {
  /**
   * Évalue le profil de risque d'un fournisseur selon ses factures
   */
  public static evaluateSupplier(
    data: SupplierAuditData,
    options: SupplierScorerOptions = {}
  ): SupplierAuditResult {
    const startTime = Date.now();
    const packVersion = options.packVersion ?? 'DZ_AUDIT_2026_V1';
    const minDaysGap = options.minDaysGapForSequence ?? 21; // 3 semaines
    const minInvoices = options.minInvoiceCount ?? 3;
    const reviewThreshold = options.reviewThreshold ?? 40;

    const weights: SupplierScorerWeights = options.weights ?? {
      sequenceWeight: 30,
      roundAmountsWeight: 25,
      splittingWeight: 25,
      identifierWeight: 20,
    };

    const invList = data.invoices;
    const n = invList.length;

    // Calcul du volume total
    let totalVol = new EngineDecimal('0');
    for (const inv of invList) {
      totalVol = totalVol.plus(EngineMath.asAmount(inv.amountTtc));
    }

    // Si le nombre de factures est insuffisant pour une analyse statistique probante
    if (n < minInvoices) {
      const trace: RuleExecutionTrace = {
        ruleCode: 'AUD-SUPPLIER-SCORE',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: { supplierId: data.supplierId, invoiceCount: n },
        parametersRead: { minInvoices },
        legalRef: 'Normes d audit relatives aux tiers & art. 43 CPF',
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: 'NOT_APPLICABLE',
        humanReviewRequired: false,
        notes: `Échantillon insuffisant (${n} < ${minInvoices})`,
      };

      return {
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        supplierNif: data.supplierNif,
        invoiceCount: n,
        totalVolumeTtcDzd: totalVol.toFixed(2),
        riskScore: 0,
        ratingLabel: 'NON_EVALUABLE',
        humanReviewRequired: false,
        contributions: [],
        severity: Severity.INFO,
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        legalRef: 'Normes d audit relatives aux tiers',
        explanationFr: `Échantillon insuffisant pour le fournisseur ${data.supplierName} (${n} factures, minimum requis : ${minInvoices}).`,
        trace,
      };
    }

    const contributions: FactorContribution[] = [];

    // -----------------------------------------------------------------------
    // Indicateur 1 : Anomalie de séquence chronologique des numéros de facture
    // -----------------------------------------------------------------------
    let sequenceAnomalyFound = false;
    let sequenceAnomalyDetails = 'Numérotation séquentielle conforme aux dates d émission.';

    // Extraire les couples (numéro entier, date)
    const parsedInvoices = invList
      .map((inv) => {
        const match = inv.invoiceNumber.match(/(\d+)/);
        const seqNum = match ? parseInt(match[1], 10) : null;
        const time = new Date(inv.issueDate).getTime();
        return { ...inv, seqNum, time };
      })
      .filter((inv) => inv.seqNum !== null && !isNaN(inv.time))
      .sort((a, b) => (a.seqNum as number) - (b.seqNum as number));

    let anomalousGapsCount = 0;
    for (let i = 0; i < parsedInvoices.length - 1; i++) {
      const curr = parsedInvoices[i];
      const next = parsedInvoices[i + 1];
      if ((next.seqNum as number) === (curr.seqNum as number) + 1) {
        // Deux factures exactement consécutives (N et N+1)
        const daysDiff = Math.round(Math.abs(next.time - curr.time) / (1000 * 3600 * 24));
        if (daysDiff >= minDaysGap) {
          anomalousGapsCount++;
        }
      }
    }

    let sequencePoints = 0;
    if (anomalousGapsCount > 0) {
      sequenceAnomalyFound = true;
      sequencePoints = weights.sequenceWeight;
      sequenceAnomalyDetails = `Détection de ${anomalousGapsCount} paire(s) de factures consécutives (N et N+1) espacées de plus de ${minDaysGap} jours, suggérant une entreprise à client quasi-unique.`;
    }

    contributions.push({
      indicatorCode: 'IND_SEQUENCE',
      indicatorName: 'Séquence chronologique de facturation',
      pointsContribution: sequencePoints,
      maxPossiblePoints: weights.sequenceWeight,
      rawMetricValue: `${anomalousGapsCount} paires anormales`,
      isTriggered: sequenceAnomalyFound,
      explanationFr: sequenceAnomalyDetails,
    });

    // -----------------------------------------------------------------------
    // Indicateur 2 : Proportion de montants suspects / ronds
    // -----------------------------------------------------------------------
    let roundCount = 0;
    for (const inv of invList) {
      const amt = EngineMath.asAmount(inv.amountTtc);
      const centimes = amt.modulo(1);
      const isCentimesZero = centimes.isZero();
      // Multiple de 1 000 DA sans centimes
      const isThousandRound = amt.modulo(1000).isZero();
      if (isCentimesZero && isThousandRound) {
        roundCount++;
      }
    }

    const roundRatio = roundCount / n;
    let roundPoints = 0;
    let roundTriggered = false;
    let roundDetails = `Proportion de montants ronds normale (${(roundRatio * 100).toFixed(1)}%).`;

    if (roundRatio >= 0.50) {
      roundTriggered = true;
      roundPoints = weights.roundAmountsWeight;
      roundDetails = `Proportion anormalement élevée de montants ronds en milliers de DA (${roundCount}/${n} factures, ${(roundRatio * 100).toFixed(1)}%), atypique pour une activité commerciale réelle.`;
    }

    contributions.push({
      indicatorCode: 'IND_ROUND_AMOUNTS',
      indicatorName: 'Proportion de montants ronds',
      pointsContribution: roundPoints,
      maxPossiblePoints: weights.roundAmountsWeight,
      rawMetricValue: `${(roundRatio * 100).toFixed(1)}%`,
      isTriggered: roundTriggered,
      explanationFr: roundDetails,
    });

    // -----------------------------------------------------------------------
    // Indicateur 3 : Indice de fractionnement
    // -----------------------------------------------------------------------
    let splittingPoints = 0;
    let splittingTriggered = false;
    let splittingDetails = 'Aucun fractionnement suspect identifié.';

    // Détection sommaire : plusieurs factures de montants proches rapprochées
    const sortedByDate = [...invList].sort((a, b) => a.issueDate.localeCompare(b.issueDate));
    let clusterCount = 0;
    for (let i = 0; i < sortedByDate.length - 1; i++) {
      const d1 = new Date(sortedByDate[i].issueDate).getTime();
      const d2 = new Date(sortedByDate[i + 1].issueDate).getTime();
      const days = Math.round((d2 - d1) / (1000 * 3600 * 24));
      if (days <= 3) {
        clusterCount++;
      }
    }

    if (clusterCount >= 2) {
      splittingTriggered = true;
      splittingPoints = weights.splittingWeight;
      splittingDetails = `Multiplicité de factures rapprochées (${clusterCount} émissions à moins de 3 jours d intervalle) signalant un possible fractionnement.`;
    }

    contributions.push({
      indicatorCode: 'IND_SPLITTING',
      indicatorName: 'Rapprochement temporel d émissions',
      pointsContribution: splittingPoints,
      maxPossiblePoints: weights.splittingWeight,
      rawMetricValue: `${clusterCount} émissions rapprochées`,
      isTriggered: splittingTriggered,
      explanationFr: splittingDetails,
    });

    // -----------------------------------------------------------------------
    // Indicateur 4 : Identifiant fiscal (NIF absent ou incomplet)
    // -----------------------------------------------------------------------
    let idPoints = 0;
    let idTriggered = false;
    let idDetails = 'Identifiant fiscal renseigné.';

    const nif = data.supplierNif?.trim();
    if (!nif) {
      idTriggered = true;
      idPoints = weights.identifierWeight;
      idDetails = 'Numéro d identification fiscale (NIF) manquant ou non communiqué.';
    } else if (nif.length !== 15 && nif.length !== 20) {
      idTriggered = true;
      idPoints = weights.identifierWeight;
      idDetails = `Format de NIF non conforme (${nif.length} caractères, attendu 15 ou 20 chiffres).`;
    }

    contributions.push({
      indicatorCode: 'IND_IDENTIFIER',
      indicatorName: 'Conformité de l identification fiscale',
      pointsContribution: idPoints,
      maxPossiblePoints: weights.identifierWeight,
      rawMetricValue: nif ? `${nif.length} chiffres` : 'ABSENT',
      isTriggered: idTriggered,
      explanationFr: idDetails,
    });

    // -----------------------------------------------------------------------
    // Score global et qualification
    // -----------------------------------------------------------------------
    const totalScore = sequencePoints + roundPoints + splittingPoints + idPoints;
    const clampedScore = Math.min(100, Math.max(0, totalScore));

    const needsReview = clampedScore >= reviewThreshold;
    const ratingLabel = needsReview ? 'FOURNISSEUR_A_EXAMINER' : 'FOURNISSEUR_CONFORME';

    const explanationFr = needsReview
      ? `Signalement : le fournisseur ${data.supplierName} présente un score de risque de ${clampedScore}/100 justifiant une revue contradictoire de ses pièces (${contributions.filter((c) => c.isTriggered).map((c) => c.indicatorName).join(', ')}).`
      : `Conformité : le fournisseur ${data.supplierName} ne présente pas de signaux anormaux (score ${clampedScore}/100).`;

    const trace: RuleExecutionTrace = {
      ruleCode: 'AUD-SUPPLIER-SCORE',
      packVersion,
      packHash: 'IN_MEMORY',
      inputs: {
        supplierId: data.supplierId,
        invoiceCount: n,
        totalVolumeTtcDzd: totalVol.toFixed(2),
      },
      parametersRead: {
        weights,
        minDaysGap,
        reviewThreshold,
      },
      legalRef: 'Normes internationales d audit & art. 43 CPF',
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
      evaluationTimestamp: new Date().toISOString(),
      executionDurationUs: (Date.now() - startTime) * 1000,
      outcome: needsReview ? 'RISK_DETECTED' : 'COMPLIANT',
      humanReviewRequired: needsReview,
      notes: explanationFr,
    };

    return {
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      supplierNif: data.supplierNif,
      invoiceCount: n,
      totalVolumeTtcDzd: totalVol.toFixed(2),
      riskScore: clampedScore,
      ratingLabel,
      humanReviewRequired: needsReview,
      contributions,
      severity: needsReview ? Severity.MAJEUR : Severity.INFO,
      evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
      legalRef: 'Normes internationales d audit & art. 43 CPF',
      explanationFr,
      trace,
    };
  }
}
