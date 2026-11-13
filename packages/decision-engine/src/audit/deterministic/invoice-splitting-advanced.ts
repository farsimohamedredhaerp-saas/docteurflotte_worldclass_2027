/**
 * AUD-03 : Détection Avancée de Fractionnement de Factures (Abus de Droit art. 19 bis CPF)
 * 
 * Algorithme à deux pointeurs glissants par fournisseur :
 * - Indice FORT : cumul > seuil ET chaque facture située dans la bande basse du seuil
 *   (ex: entre seuil * (1 - highBandMargin) et seuil).
 * - Indice FAIBLE : cumul > seuil sur la fenêtre glissante avec des factures unitaires
 *   plus petites ou diffuses.
 * - Aucune alerte si les factures sont espacées au-delà de la fenêtre (ex: > 30 jours).
 * - Deux seuils distincts en données : seuil IBS (ex: 300 000 DA) et seuil TVA (ex: 100 000 DA).
 * - auto_reintegrate = false : le moteur n'opère jamais de réintégration d'office,
 *   l'indice devant être débattu contradictoirement.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export type SplittingSuspicionLevel = 'INDICE_FORT' | 'INDICE_FAIBLE' | 'AUCUN';

export interface AdvancedInvoiceItem {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  partnerName?: string;
  issueDate: string; // YYYY-MM-DD
  amountTtc: DecimalValue | string;
  amountHt?: DecimalValue | string;
  vatAmount?: DecimalValue | string;
}

export interface SplittingWindowConfig {
  thresholdIbsTtc: DecimalValue | string; // Seuil déductibilité IBS (ex: 300 000 DA)
  thresholdTvaTtc?: DecimalValue | string; // Seuil TVA distinct (ex: 100 000 DA)
  windowDays?: number; // Largeur de la fenêtre glissante (ex: 30 jours)
  highBandRatio?: DecimalValue | string; // Ratio définissant la bande haute (ex: 85% à 100% du seuil)
}

export interface AdvancedSplittingCluster {
  clusterId: string;
  partnerId: string;
  suspicionLevel: 'INDICE_FORT' | 'INDICE_FAIBLE';
  targetThresholdType: 'IBS' | 'TVA';
  thresholdValue: string;
  invoices: AdvancedInvoiceItem[];
  totalCumulativeTtc: string;
  timeSpanDays: number;
  startDate: string;
  endDate: string;
  autoReintegrate: boolean; // Toujours false
  legalRef: string;
  explanationFr: string;
}

export interface AdvancedSplittingReport {
  hasSuspiciousSplitting: boolean;
  totalClustersFound: number;
  strongClustersCount: number;
  weakClustersCount: number;
  clusters: AdvancedSplittingCluster[];
  autoReintegrate: boolean;
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class AdvancedInvoiceSplittingDetector {
  /**
   * Analyse les factures par fournisseur via un algorithme à deux pointeurs glissants
   */
  public static detect(
    invoices: AdvancedInvoiceItem[],
    config: SplittingWindowConfig,
    packVersion = 'DZ_AUDIT_2026_V1'
  ): AdvancedSplittingReport {
    const startTime = Date.now();
    const thresholdIbs = EngineMath.from(config.thresholdIbsTtc);
    const thresholdTva = config.thresholdTvaTtc ? EngineMath.from(config.thresholdTvaTtc) : null;
    const windowDays = config.windowDays ?? 30;
    const highBandRatio = config.highBandRatio ? EngineMath.from(config.highBandRatio) : new EngineDecimal('0.14');

    // Regrouper les factures par partenaire
    const byPartner = new Map<string, AdvancedInvoiceItem[]>();
    for (const inv of invoices) {
      const list = byPartner.get(inv.partnerId) ?? [];
      list.push(inv);
      byPartner.set(inv.partnerId, list);
    }

    const clusters: AdvancedSplittingCluster[] = [];
    let clusterCounter = 1;

    for (const [partnerId, partnerInvoices] of byPartner.entries()) {
      // Trier chronologiquement par date d émission
      partnerInvoices.sort((a, b) => a.issueDate.localeCompare(b.issueDate));

      // Évaluer contre le seuil IBS (priorité) puis le seuil TVA
      const thresholdsToTest: { type: 'IBS' | 'TVA'; threshold: DecimalValue }[] = [
        { type: 'IBS', threshold: thresholdIbs },
      ];
      if (thresholdTva) {
        thresholdsToTest.push({ type: 'TVA', threshold: thresholdTva });
      }

      for (const target of thresholdsToTest) {
        const targetThresh = target.threshold;
        const lowBandFloor = targetThresh.times(new EngineDecimal('1').minus(highBandRatio));

        // Algorithme de fenêtre glissante par deux pointeurs (i, j)
        let i = 0;
        while (i < partnerInvoices.length) {
          const firstInv = partnerInvoices[i];
          const firstDate = new Date(firstInv.issueDate).getTime();
          const firstAmt = EngineMath.from(firstInv.amountTtc);

          if (firstAmt.greaterThan(targetThresh)) {
            i++;
            continue;
          }

          let j = i + 1;
          const clusterInvoices: AdvancedInvoiceItem[] = [firstInv];
          let clusterSum = firstAmt;

          while (j < partnerInvoices.length) {
            const nextInv = partnerInvoices[j];
            const nextDate = new Date(nextInv.issueDate).getTime();
            const daysDiff = Math.round((nextDate - firstDate) / (1000 * 3600 * 24));

            if (daysDiff <= windowDays) {
              const nextAmt = EngineMath.from(nextInv.amountTtc);
              if (nextAmt.lessThanOrEqualTo(targetThresh)) {
                clusterInvoices.push(nextInv);
                clusterSum = clusterSum.plus(nextAmt);
                j++;
                continue;
              }
            }
            break;
          }

          if (clusterInvoices.length >= 2 && clusterSum.greaterThan(targetThresh)) {
            const allInHighBand = clusterInvoices.every((inv) => {
              const a = EngineMath.from(inv.amountTtc);
              return a.greaterThanOrEqualTo(lowBandFloor) && a.lessThanOrEqualTo(targetThresh);
            });

            const level: SplittingSuspicionLevel = allInHighBand ? 'INDICE_FORT' : 'INDICE_FAIBLE';
            const startDate = clusterInvoices[0].issueDate;
            const endDate = clusterInvoices[clusterInvoices.length - 1].issueDate;
            const spanDays = Math.round(
              (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)
            );

            clusters.push({
              clusterId: `AUD03-SPLIT-${clusterCounter++}`,
              partnerId,
              suspicionLevel: level,
              targetThresholdType: target.type,
              thresholdValue: targetThresh.toFixed(2),
              invoices: clusterInvoices,
              totalCumulativeTtc: clusterSum.toFixed(2),
              timeSpanDays: spanDays,
              startDate,
              endDate,
              autoReintegrate: false, // JAMAIS de réintégration automatique
              legalRef: 'Article 19 bis du Code des Procédures Fiscales (CPF)',
              explanationFr:
                level === 'INDICE_FORT'
                  ? `Indice FORT d abus de droit (art. 19 bis CPF) : ${clusterInvoices.length} factures émises en ${spanDays} jours, toutes situées dans la bande cible [${lowBandFloor.toFixed(2)} - ${targetThresh.toFixed(2)} DA], cumulant ${clusterSum.toFixed(2)} DA.`
                  : `Indice FAIBLE de fractionnement : ${clusterInvoices.length} factures étalées sur ${spanDays} jours pour un total de ${clusterSum.toFixed(2)} DA excédant le seuil de ${targetThresh.toFixed(2)} DA.`,
            });

            i = j;
            continue;
          }

          i++;
        }
      }
    }

    const strongCount = clusters.filter((c) => c.suspicionLevel === 'INDICE_FORT').length;
    const weakCount = clusters.filter((c) => c.suspicionLevel === 'INDICE_FAIBLE').length;
    const hasSuspicious = clusters.length > 0;

    return {
      hasSuspiciousSplitting: hasSuspicious,
      totalClustersFound: clusters.length,
      strongClustersCount: strongCount,
      weakClustersCount: weakCount,
      clusters,
      autoReintegrate: false,
      trace: {
        ruleCode: 'AUDIT_03_INVOICE_SPLITTING_ADVANCED',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          invoicesAnalyzed: invoices.length,
          partnersCount: byPartner.size,
          windowDays,
          thresholdIbs: thresholdIbs.toFixed(2),
        },
        parametersRead: {
          highBandRatio: highBandRatio.toFixed(2),
        },
        legalRef: 'Article 19 bis du Code des Procédures Fiscales (CPF)',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome: hasSuspicious ? 'RISK_DETECTED' : 'COMPLIANT',
        humanReviewRequired: hasSuspicious,
        notes: hasSuspicious
          ? `${strongCount} indice(s) fort(s) et ${weakCount} indice(s) faible(s). Revue contradictoire requise sans réintégration d office.`
          : 'Aucun schéma de fractionnement atypique détecté.',
      },
      summaryFr: hasSuspicious
        ? `Détection de ${clusters.length} faisceau(x) d indices de fractionnement (${strongCount} fort(s), ${weakCount} faible(s)). Examen contradictoire obligatoire sans réintégration automatique.`
        : 'Aucun indice de fractionnement détecté.',
    };
  }
}
