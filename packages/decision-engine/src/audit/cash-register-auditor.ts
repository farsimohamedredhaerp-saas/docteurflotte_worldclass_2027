/**
 * Auditeur de Caisse & Détection des Soldes Créditeurs
 * 
 * Base légale : Article 43 du Code des Procédures Fiscales (CPF).
 * En doctrine comptable et fiscale algérienne, une caisse physique ne peut en aucun cas
 * présenter un solde créditeur (négatif), une telle anomalie privant les écritures de valeur probante.
 * 
 * Trois modes d'évaluation intra-journée :
 * 1. DAILY_NET : Contrôle du solde net en fin de journée calendaire.
 * 2. SEQUENCED : Contrôle chronologique strict selon l'horodatage ou le numéro de séquence intra-journée.
 * 3. WORST_CASE_WITHIN_DAY : Scénario le plus défavorable (toutes les sorties avant les entrées)
 *    pour mettre en évidence la sensibilité à l'ordre de saisie.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { EvidenceLevel, Severity, VerificationStatus } from '../types/ontology';
import { RuleExecutionTrace } from '../types/trace';

export type CashAuditMode = 'DAILY_NET' | 'SEQUENCED' | 'WORST_CASE_WITHIN_DAY';

export interface CashMovement {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp?: string; // ISO ou HH:mm:ss
  sequenceNumber?: number;
  label: string;
  inflow: DecimalValue | string; // Entrée d espèces (recette)
  outflow: DecimalValue | string; // Sortie d espèces (dépense)
  pieceRef?: string;
}

export interface CashDayAnomaly {
  date: string;
  mode: CashAuditMode;
  openingBalance: string;
  totalInflow: string;
  totalOutflow: string;
  closingBalance: string;
  lowestIntradayBalance: string;
  hasNegativeBalance: boolean;
  hasOrderSensitivity: boolean;
  failingMovementId?: string;
  failingTimestamp?: string;
  severity: Severity;
  descriptionFr: string;
}

export interface CashAuditConfig {
  initialBalance?: DecimalValue | string;
  auditModes?: CashAuditMode[];
}

export interface CashAuditResult {
  isCompliant: boolean;
  hasCriticalNegativeBalance: boolean;
  hasOrderSensitivity: boolean;
  finalBalance: string;
  totalMovements: number;
  daysAnalyzed: number;
  daysWithAnomalies: number;
  anomalies: CashDayAnomaly[];
  trace: RuleExecutionTrace;
  summaryFr: string;
}

export class CashRegisterAuditor {
  /**
   * Analyse l'intégrité d'une série de mouvements de caisse
   */
  public static audit(
    movements: CashMovement[],
    config: CashAuditConfig = {},
    packVersion = 'DZ_AUDIT_2026_V1'
  ): CashAuditResult {
    const startTime = Date.now();
    let currentBalance = config.initialBalance ? EngineMath.from(config.initialBalance) : new EngineDecimal('0');
    const initialBalanceSnapshot = currentBalance.toFixed(2);

    const modes = config.auditModes ?? ['DAILY_NET', 'SEQUENCED', 'WORST_CASE_WITHIN_DAY'];

    // Regrouper les mouvements par date locale (YYYY-MM-DD)
    const byDate = new Map<string, CashMovement[]>();
    for (const mov of movements) {
      const list = byDate.get(mov.date) ?? [];
      list.push(mov);
      byDate.set(mov.date, list);
    }

    // Trier les dates chronologiquement
    const sortedDates = Array.from(byDate.keys()).sort();

    const anomalies: CashDayAnomaly[] = [];
    let hasCritical = false;
    let hasOrderSens = false;

    for (const date of sortedDates) {
      const dayMovements = byDate.get(date)!;
      const dayOpening = currentBalance;

      let dayInflow = new EngineDecimal('0');
      let dayOutflow = new EngineDecimal('0');

      for (const m of dayMovements) {
        dayInflow = dayInflow.plus(EngineMath.from(m.inflow));
        dayOutflow = dayOutflow.plus(EngineMath.from(m.outflow));
      }

      const dayClosing = dayOpening.plus(dayInflow).minus(dayOutflow);

      // 1. Mode DAILY_NET
      const isDailyNetNegative = dayClosing.isNegative();

      // 2. Mode SEQUENCED
      let sequencedLowest = dayOpening;
      let sequencedFailingMovement: CashMovement | undefined;
      let runningSequenced = dayOpening;

      const sortedDayMovements = [...dayMovements].sort((a, b) => {
        if (a.sequenceNumber !== undefined && b.sequenceNumber !== undefined) {
          return a.sequenceNumber - b.sequenceNumber;
        }
        if (a.timestamp && b.timestamp) {
          return a.timestamp.localeCompare(b.timestamp);
        }
        return 0;
      });

      for (const m of sortedDayMovements) {
        const inf = EngineMath.from(m.inflow);
        const outf = EngineMath.from(m.outflow);
        runningSequenced = runningSequenced.plus(inf).minus(outf);
        if (runningSequenced.lessThan(sequencedLowest)) {
          sequencedLowest = runningSequenced;
        }
        if (runningSequenced.isNegative() && !sequencedFailingMovement) {
          sequencedFailingMovement = m;
        }
      }

      // 3. Mode WORST_CASE_WITHIN_DAY (toutes les sorties avant les entrées)
      const worstCaseLowest = dayOpening.minus(dayOutflow);
      const isWorstCaseNegative = worstCaseLowest.isNegative();
      const orderSensitivityDetected = !isDailyNetNegative && isWorstCaseNegative;

      // Évaluation des modes actifs
      if (modes.includes('DAILY_NET') && isDailyNetNegative) {
        hasCritical = true;
        anomalies.push({
          date,
          mode: 'DAILY_NET',
          openingBalance: dayOpening.toFixed(2),
          totalInflow: dayInflow.toFixed(2),
          totalOutflow: dayOutflow.toFixed(2),
          closingBalance: dayClosing.toFixed(2),
          lowestIntradayBalance: dayClosing.toFixed(2),
          hasNegativeBalance: true,
          hasOrderSensitivity: false,
          severity: Severity.BLOQUANT,
          descriptionFr: `Solde de caisse créditeur en fin de journée du ${date} : ${dayClosing.toFixed(2)} DA (motif de contestation de régularité art. 43 CPF).`,
        });
      } else if (modes.includes('SEQUENCED') && sequencedFailingMovement) {
        hasCritical = true;
        anomalies.push({
          date,
          mode: 'SEQUENCED',
          openingBalance: dayOpening.toFixed(2),
          totalInflow: dayInflow.toFixed(2),
          totalOutflow: dayOutflow.toFixed(2),
          closingBalance: dayClosing.toFixed(2),
          lowestIntradayBalance: sequencedLowest.toFixed(2),
          hasNegativeBalance: true,
          hasOrderSensitivity: false,
          failingMovementId: sequencedFailingMovement.id,
          failingTimestamp: sequencedFailingMovement.timestamp,
          severity: Severity.BLOQUANT,
          descriptionFr: `Découvert intra-journalier constaté le ${date} lors de l opération ${sequencedFailingMovement.id} (solde descendu à ${sequencedLowest.toFixed(2)} DA).`,
        });
      } else if (modes.includes('WORST_CASE_WITHIN_DAY') && orderSensitivityDetected) {
        hasOrderSens = true;
        anomalies.push({
          date,
          mode: 'WORST_CASE_WITHIN_DAY',
          openingBalance: dayOpening.toFixed(2),
          totalInflow: dayInflow.toFixed(2),
          totalOutflow: dayOutflow.toFixed(2),
          closingBalance: dayClosing.toFixed(2),
          lowestIntradayBalance: worstCaseLowest.toFixed(2),
          hasNegativeBalance: false,
          hasOrderSensitivity: true,
          severity: Severity.MAJEUR,
          descriptionFr: `Sensibilité à l ordre de saisie identifiée le ${date} : le total des sorties (${dayOutflow.toFixed(2)} DA) excède le solde initial (${dayOpening.toFixed(2)} DA). Risque de découvert si les décaissements ont précédé les recettes.`,
        });
      }

      currentBalance = dayClosing;
    }

    const isCompliant = !hasCritical && !hasOrderSens;
    const outcome = hasCritical ? 'BLOCKED' : hasOrderSens ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      isCompliant,
      hasCriticalNegativeBalance: hasCritical,
      hasOrderSensitivity: hasOrderSens,
      finalBalance: currentBalance.toFixed(2),
      totalMovements: movements.length,
      daysAnalyzed: sortedDates.length,
      daysWithAnomalies: anomalies.length,
      anomalies,
      trace: {
        ruleCode: 'AUDIT_CASH_REGISTER_SOLVENCY',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          totalMovements: movements.length,
          daysAnalyzed: sortedDates.length,
          initialBalance: initialBalanceSnapshot,
          auditModes: modes,
        },
        parametersRead: {},
        legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: !isCompliant,
        notes: hasCritical
          ? 'Présence de soldes créditeurs de caisse compromettant le caractère probant des écritures (art. 43 CPF).'
          : hasOrderSens
          ? 'Sensibilité à l ordre intra-journalier détectée : vérification de l ordonnancement physique des pièces de caisse requise.'
          : 'Tenue de caisse conforme sans anomalie de solde négatif.',
      },
      summaryFr: hasCritical
        ? `Alerte majeure : solde créditeur de caisse détecté sur ${anomalies.filter(a => a.hasNegativeBalance).length} journée(s) (violation art. 43 CPF).`
        : hasOrderSens
        ? `Attention : ${anomalies.filter(a => a.hasOrderSensitivity).length} journée(s) sensible(s) à l ordre de saisie intra-journalier.`
        : `Contrôle de caisse satisfaisant sur ${sortedDates.length} jour(s) (solde final : ${currentBalance.toFixed(2)} DA).`,
    };
  }
}
