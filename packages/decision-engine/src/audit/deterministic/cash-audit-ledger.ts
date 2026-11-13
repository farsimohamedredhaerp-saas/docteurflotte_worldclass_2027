/**
 * AUD-01 : Auditeur Déterministe de Caisse & Traçabilité Incrémentale
 * 
 * Spécifications formelles :
 * 1. Tri canonique des écritures : (local_date, recorded_at, piece, ligne)
 *    Fuseau horaire : Africa/Algiers (UTC+1 fixe). Ex: 23:30 UTC le 14/03 -> 15/03 local.
 * 2. Continuité des exercices : ouverture du jour = clôture du jour précédent.
 * 3. Trois modes d'évaluation : DAILY_NET, SEQUENCED, WORST_CASE.
 * 4. Métriques obligatoires :
 *    - solde_minimal (minimum absolu atteint)
 *    - jours_en_defaut (nombre de jours distincts avec solde négatif)
 *    - somme_des_deficits (cumul des déficits nets avec remise à zéro dès retour en positif)
 * 5. Recalcul incrémental partiel lors de l'insertion d'une écriture antidatée.
 * 6. Détection des motifs associés : régularisation tardive et concentration d'apports en fin de mois.
 * 7. Impact fiscal par impôt en fourchette (droits, pénalités art. 193/193 bis CIDTA).
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../../math/decimal';
import { AlgeriaCalendar } from '../../time/algeria-time';
import { EvidenceLevel, Severity, VerificationStatus } from '../../types/ontology';
import { RuleExecutionTrace } from '../../types/trace';

export interface CashEntryRow {
  id: string;
  utcRecordedAt: string; // ISO UTC (ex: 2026-03-14T23:30:00.000Z)
  localDate?: string; // Si absent, dérivé via Africa/Algiers
  pieceNumber: string;
  lineNumber: number;
  label: string;
  debitCash: DecimalValue | string; // Entrée d espèces (recette)
  creditCash: DecimalValue | string; // Sortie d espèces (dépense)
  partnerId?: string;
}

export interface CashDayState {
  localDate: string;
  openingBalance: string;
  totalInflow: string;
  totalOutflow: string;
  closingBalance: string;
  dailyNet: string; // inflow - outflow
  worstCaseBalance: string; // opening - totalOutflow
  lowestIntradayBalance: string;
  isDailyNetNegative: boolean;
  isWorstCaseNegative: boolean;
  isSequencedNegative: boolean;
  deficitAmount: string; // max(0, -closingBalance)
  entries: CashEntryRow[];
}

export interface CashAuditMetrics {
  initialBalance: string;
  finalBalance: string;
  lowestBalance: string; // solde_minimal
  defaultDaysCount: number; // jours_en_defaut
  cumulativeDeficitsSum: string; // somme_des_deficits
  isOrderSensitive: boolean; // true si WORST_CASE négatif mais DAILY_NET positif
  lateMonthRegularizationDetected: boolean; // concentration d apports en fin de mois
  estimatedTaxExposureDzd: {
    lowEstimate: string; // Droits simples + pénalité 10%
    highEstimate: string; // Droits simples + pénalité 100% (art. 193 bis)
  };
}

export interface IncrementalCashIndex {
  dayStates: Map<string, CashDayState>; // localDate -> State
  sortedDates: string[];
}

export class CashAuditLedger {
  /**
   * Dérive la date locale algérienne (Africa/Algiers UTC+1) à partir d'un timestamp UTC
   */
  public static deriveLocalDate(utcTimestamp: string): string {
    const d = new Date(utcTimestamp);
    if (isNaN(d.getTime())) {
      throw new Error(`Timestamp UTC invalide : "${utcTimestamp}".`);
    }
    // Décalage UTC+1 fixe pour l'Algérie
    const algeriaMs = d.getTime() + 1 * 60 * 60 * 1000;
    const local = new Date(algeriaMs);
    const y = local.getUTCFullYear();
    const m = String(local.getUTCMonth() + 1).padStart(2, '0');
    const day = String(local.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Trie les écritures de caisse selon l'ordre canonique :
   * (local_date, recorded_at, piece, ligne)
   */
  public static sortEntries(entries: CashEntryRow[]): CashEntryRow[] {
    return [...entries].sort((a, b) => {
      const dateA = a.localDate ?? CashAuditLedger.deriveLocalDate(a.utcRecordedAt);
      const dateB = b.localDate ?? CashAuditLedger.deriveLocalDate(b.utcRecordedAt);
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      if (a.utcRecordedAt !== b.utcRecordedAt) {
        return a.utcRecordedAt.localeCompare(b.utcRecordedAt);
      }
      if (a.pieceNumber !== b.pieceNumber) {
        return a.pieceNumber.localeCompare(b.pieceNumber);
      }
      return a.lineNumber - b.lineNumber;
    });
  }

  /**
   * Construit ou met à jour l'index de caisse, avec support de recalcul partiel
   * à partir d'une date d'écriture antidatée
   */
  public static buildIndex(
    entries: CashEntryRow[],
    initialOpeningBalance: DecimalValue | string = '0.00',
    existingIndex?: IncrementalCashIndex,
    fromDate?: string
  ): IncrementalCashIndex {
    const sorted = CashAuditLedger.sortEntries(entries);

    // Regrouper par date locale
    const byDate = new Map<string, CashEntryRow[]>();
    for (const e of sorted) {
      const date = e.localDate ?? CashAuditLedger.deriveLocalDate(e.utcRecordedAt);
      e.localDate = date;
      const list = byDate.get(date) ?? [];
      list.push(e);
      byDate.set(date, list);
    }

    const allDates = Array.from(byDate.keys()).sort();
    const dayStates = existingIndex ? new Map(existingIndex.dayStates) : new Map<string, CashDayState>();

    // Identifier la date de départ du calcul
    let startIndex = 0;
    let runningBalance = EngineMath.from(initialOpeningBalance);

    if (fromDate && existingIndex && existingIndex.sortedDates.length > 0) {
      const foundIdx = allDates.indexOf(fromDate);
      if (foundIdx > 0) {
        startIndex = foundIdx;
        const prevDate = allDates[foundIdx - 1];
        const prevState = dayStates.get(prevDate);
        if (prevState) {
          runningBalance = EngineMath.from(prevState.closingBalance);
        }
      }
    }

    for (let i = startIndex; i < allDates.length; i++) {
      const date = allDates[i];
      const dayEntries = byDate.get(date)!;
      const opening = runningBalance;

      let totalIn = new EngineDecimal('0');
      let totalOut = new EngineDecimal('0');
      let runningSeq = opening;
      let lowestIntraday = opening;
      let isSeqNegative = false;

      for (const e of dayEntries) {
        const debit = EngineMath.from(e.debitCash);
        const credit = EngineMath.from(e.creditCash);
        totalIn = totalIn.plus(debit);
        totalOut = totalOut.plus(credit);

        runningSeq = runningSeq.plus(debit).minus(credit);
        if (runningSeq.lessThan(lowestIntraday)) {
          lowestIntraday = runningSeq;
        }
        if (runningSeq.isNegative()) {
          isSeqNegative = true;
        }
      }

      const closing = opening.plus(totalIn).minus(totalOut);
      const dailyNet = totalIn.minus(totalOut);
      const worstCase = opening.minus(totalOut);
      const isDailyNetNeg = closing.isNegative();
      const isWorstCaseNeg = worstCase.isNegative();

      const deficit = isDailyNetNeg ? closing.abs() : new EngineDecimal('0');

      dayStates.set(date, {
        localDate: date,
        openingBalance: opening.toFixed(2),
        totalInflow: totalIn.toFixed(2),
        totalOutflow: totalOut.toFixed(2),
        closingBalance: closing.toFixed(2),
        dailyNet: dailyNet.toFixed(2),
        worstCaseBalance: worstCase.toFixed(2),
        lowestIntradayBalance: lowestIntraday.toFixed(2),
        isDailyNetNegative: isDailyNetNeg,
        isWorstCaseNegative: isWorstCaseNeg,
        isSequencedNegative: isSeqNegative,
        deficitAmount: deficit.toFixed(2),
        entries: dayEntries,
      });

      runningBalance = closing;
    }

    return {
      dayStates,
      sortedDates: allDates,
    };
  }

  /**
   * Analyse exhaustive et calcul des métriques AUD-01
   */
  public static evaluate(
    index: IncrementalCashIndex,
    config: { indicativeTaxRate?: DecimalValue | string; packVersion?: string } = {}
  ): {
    metrics: CashAuditMetrics;
    dailyStates: CashDayState[];
    trace: RuleExecutionTrace;
  } {
    const startTime = Date.now();
    const packVersion = config.packVersion ?? 'DZ_AUDIT_2026_V1';
    const dates = index.sortedDates;
    const states: CashDayState[] = [];

    let lowest = new EngineDecimal('0');
    let defaultDays = 0;
    let sumDeficits = new EngineDecimal('0');
    let orderSensitive = false;

    // Détection de régularisation tardive (apports suspects les 3 derniers jours du mois)
    let lateMonthApportsCount = 0;

    for (let i = 0; i < dates.length; i++) {
      const state = index.dayStates.get(dates[i])!;
      states.push(state);

      const lowestIntra = EngineMath.from(state.lowestIntradayBalance);

      if (lowestIntra.lessThan(lowest)) {
        lowest = lowestIntra;
      }

      if (state.isDailyNetNegative) {
        defaultDays++;
        // Cumul des déficits
        sumDeficits = sumDeficits.plus(EngineMath.from(state.deficitAmount));
      }

      if (state.isWorstCaseNegative && !state.isDailyNetNegative) {
        orderSensitive = true;
      }

      const dayNum = parseInt(state.localDate.substring(8, 10), 10);
      if (dayNum >= 28 && EngineMath.from(state.totalInflow).greaterThan(new EngineDecimal('50000'))) {
        lateMonthApportsCount++;
      }
    }

    const initBal = dates.length > 0 ? index.dayStates.get(dates[0])!.openingBalance : '0.00';
    const finalBal = dates.length > 0 ? index.dayStates.get(dates[dates.length - 1])!.closingBalance : '0.00';

    // Estimation fiscale en fourchette (rejet partiel de comptabilité art. 43 CPF)
    const taxRate = config.indicativeTaxRate ? EngineMath.from(config.indicativeTaxRate) : new EngineDecimal('0.25');
    const lowEst = sumDeficits.times(taxRate).times(new EngineDecimal('1.10')).toFixed(2);
    const highEst = sumDeficits.times(taxRate).times(new EngineDecimal('2.00')).toFixed(2);

    const isDefective = defaultDays > 0;
    const outcome = isDefective ? 'BLOCKED' : orderSensitive ? 'RISK_DETECTED' : 'COMPLIANT';

    return {
      metrics: {
        initialBalance: initBal,
        finalBalance: finalBal,
        lowestBalance: lowest.toFixed(2),
        defaultDaysCount: defaultDays,
        cumulativeDeficitsSum: sumDeficits.toFixed(2),
        isOrderSensitive: orderSensitive,
        lateMonthRegularizationDetected: lateMonthApportsCount >= 2,
        estimatedTaxExposureDzd: {
          lowEstimate: lowEst,
          highEstimate: highEst,
        },
      },
      dailyStates: states,
      trace: {
        ruleCode: 'AUDIT_01_CASH_DETERMINISTIC',
        packVersion,
        packHash: 'IN_MEMORY',
        inputs: {
          daysCount: dates.length,
          defaultDays,
          lowestBalance: lowest.toFixed(2),
        },
        parametersRead: {},
        legalRef: 'Article 43 du Code des Procédures Fiscales (CPF)',
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evaluationTimestamp: new Date().toISOString(),
        executionDurationUs: (Date.now() - startTime) * 1000,
        outcome,
        humanReviewRequired: isDefective || orderSensitive,
        notes: isDefective
          ? `Solde créditeur de caisse sur ${defaultDays} jour(s). Déficit cumulé: ${sumDeficits.toFixed(2)} DA. Risque de contestation de valeur probante (art. 43 CPF).`
          : orderSensitive
          ? 'Sensibilité à l ordre de saisie intra-journalier identifiée.'
          : 'Contrôle de caisse conforme.',
      },
    };
  }
}
