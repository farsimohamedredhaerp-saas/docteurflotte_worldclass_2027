/**
 * Détecteur d'Indices de Fractionnement de Factures (Abus de Droit)
 * 
 * Base légale : Article 19 bis du Code des Procédures Fiscales (CPF).
 * 
 * RÈGLE NON NÉGOCIABLE :
 * L'ontologie est du code, les valeurs sont des données (zéro seuil en dur).
 * RÈGLE 6 : Indicateur d'indice d'abus de droit, JAMAIS réintégration automatique
 * ni accusation de mauvaise foi sans instruction contradictoire.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export interface AuditInvoiceItem {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  partnerName?: string;
  issueDate: string; // YYYY-MM-DD
  amountTtc: DecimalValue | string;
  paymentMethod?: string; // ex: 'CASH', 'TRANSFER', 'CHECK'
}

export interface SplittingConfig {
  thresholdAmount: DecimalValue | string; // Seuil légal visé (ex: seuil espèces déductibilité IBS)
  windowDays?: number; // Fenêtre glissante d'analyse en jours (ex: 30)
  marginRatio?: DecimalValue | string; // Marge sous le seuil (ex: 0.20 pour détecter de 80% à 100% du seuil)
  minClusterSize?: number; // Nombre minimal de factures rapprochées (ex: 2)
}

export interface SplittingCluster {
  clusterId: string;
  partnerId: string;
  partnerName?: string;
  invoiceCount: number;
  invoices: AuditInvoiceItem[];
  totalCumulativeAmount: string;
  startDate: string;
  endDate: string;
  timeSpanDays: number;
  suspectedTargetThreshold: string;
  legalQualificationFr: string;
  riskSeverity: Severity;
}

export interface SplittingDetectionResult {
  hasSuspiciousSplitting: boolean;
  totalClustersFound: number;
  clusters: SplittingCluster[];
  totalExposedAmount: string;
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class InvoiceSplittingDetector {
  /**
   * Détecte les regroupements de factures suspectes de fractionnement
   */
  public static detect(
    invoices: AuditInvoiceItem[],
    config: SplittingConfig,
    packVersion = 'DZ_AUDIT_2026_V1'
  ): SplittingDetectionResult {
    const startTime = Date.now();
    const threshold = EngineMath.from(config.thresholdAmount);
    const windowDays = config.windowDays ?? 30;
    const marginRatio = config.marginRatio ? EngineMath.from(config.marginRatio) : EngineMath.from('0.20');
    const minClusterSize = config.minClusterSize ?? 2;

    // Seuil plancher de détection sous le seuil cible
    // floorAmount = threshold * (1 - marginRatio)
    const floorAmount = threshold.times(new EngineDecimal('1').minus(marginRatio));

    // Regrouper les factures par partenaire
    const byPartner = new Map<string, AuditInvoiceItem[]>();
    for (const inv of invoices) {
      const list = byPartner.get(inv.partnerId) ?? [];
      list.push(inv);
      byPartner.set(inv.partnerId, list);
    }

    const clusters: SplittingCluster[] = [];
    let totalExposed = new EngineDecimal('0');

    let clusterSeq = 1;

    for (const [partnerId, partnerInvoices] of byPartner.entries()) {
      // Trier par date croissante
      partnerInvoices.sort((a, b) => a.issueDate.localeCompare(b.issueDate));

      // Filtrer les factures éligibles (montant compris entre floorAmount et threshold)
      const nearThresholdInvoices = partnerInvoices.filter((inv) => {
        const amt = EngineMath.from(inv.amountTtc);
        return amt.greaterThanOrEqualTo(floorAmount) && amt.lessThanOrEqualTo(threshold);
      });

      if (nearThresholdInvoices.length < minClusterSize) {
        continue;
      }

      // Recherche de grappes temporelles dans la fenêtre glissante
      let i = 0;
      while (i < nearThresholdInvoices.length) {
        const clusterInvoices: AuditInvoiceItem[] = [nearThresholdInvoices[i]];
        const startDate = new Date(nearThresholdInvoices[i].issueDate);

        let j = i + 1;
        while (j < nearThresholdInvoices.length) {
          const nextDate = new Date(nearThresholdInvoices[j].issueDate);
          const diffDays = Math.round((nextDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

          if (diffDays <= windowDays) {
            clusterInvoices.push(nearThresholdInvoices[j]);
            j++;
          } else {
            break;
          }
        }

        if (clusterInvoices.length >= minClusterSize) {
          // Calculer le total cumulé du cluster
          let clusterTotal = new EngineDecimal('0');
          for (const cInv of clusterInvoices) {
            clusterTotal = clusterTotal.plus(EngineMath.from(cInv.amountTtc));
          }

          // Le cumul doit dépasser le seuil individuel pour caractériser le contournement
          if (clusterTotal.greaterThan(threshold)) {
            const firstInv = clusterInvoices[0];
            const lastInv = clusterInvoices[clusterInvoices.length - 1];
            const firstDate = new Date(firstInv.issueDate);
            const lastDate = new Date(lastInv.issueDate);
            const spanDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));

            totalExposed = totalExposed.plus(clusterTotal);

            clusters.push({
              clusterId: `SPLIT-CLUSTER-${clusterSeq++}`,
              partnerId,
              partnerName: firstInv.partnerName,
              invoiceCount: clusterInvoices.length,
              invoices: clusterInvoices,
              totalCumulativeAmount: clusterTotal.toFixed(2),
              startDate: firstInv.issueDate,
              endDate: lastInv.issueDate,
              timeSpanDays: spanDays,
              suspectedTargetThreshold: threshold.toFixed(2),
              legalQualificationFr: 'Indice d abus de droit (art. 19 bis CPF) : fractionnement potentiel de facturation pour contournement de seuil légal.',
              riskSeverity: Severity.MAJEUR,
            });

            // Sauter les éléments inclus dans ce cluster pour éviter les doublons redondants
            i = j;
            continue;
          }
        }
        i++;
      }
    }

    const hasSuspicious = clusters.length > 0;
    const outcome = hasSuspicious ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      hasSuspiciousSplitting: hasSuspicious,
      totalClustersFound: clusters.length,
      clusters,
      totalExposedAmount: totalExposed.toFixed(2),
      trace: {
        ruleCode: 'AUDIT_INVOICE_SPLITTING_DETECTOR',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          totalInvoicesAnalyzed: invoices.length,
          partnerCount: byPartner.size,
          windowDays,
          thresholdAmount: threshold.toFixed(2),
          marginRatio: marginRatio.toFixed(2),
        },
        parametersRead: {
          targetThreshold: threshold.toFixed(2),
          floorAmount: floorAmount.toFixed(2),
        },
        legalRef: 'Article 19 bis du Code des Procédures Fiscales (CPF)',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: hasSuspicious,
        notes: hasSuspicious
          ? `${clusters.length} grappe(s) de factures identifiées à proximité du seuil. Examen contradictoire obligatoire sans réintégration automatique.`
          : 'Aucun schéma atypique de fractionnement constaté.',
      },
      summaryFr: hasSuspicious
        ? `Détection de ${clusters.length} faisceau(x) d indices de fractionnement (montant total exposé : ${totalExposed.toFixed(2)} DA) nécessitant revue contradictoire selon l art. 19 bis CPF.`
        : 'Aucun indice de fractionnement de factures relevé.',
    };
  }
}
