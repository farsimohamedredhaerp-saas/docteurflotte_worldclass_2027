/**
 * Balance Générale des Comptes (Avant et Après Inventaire)
 * 
 * Aggrège les débits, crédits et soldes du Grand Livre en respectant
 * l'égalité arithmétique fondamentale :
 * Total Mouvements Débit == Total Mouvements Crédit
 * Total Soldes Débiteurs == Total Soldes Créditeurs
 */

import { EngineDecimal, DecimalValue } from '../math/decimal.js';
import { LedgerEntry } from '../ledger/ledger-types.js';
import { AccountRole } from '../types/ontology.js';

export interface GeneralBalanceLine {
  accountNumber: string;
  accountRole: AccountRole;
  label: string;
  totalDebit: string;
  totalCredit: string;
  debitBalance: string | null;
  creditBalance: string | null;
}

export interface GeneralBalanceReport {
  fiscalYear: number;
  periodCode: string;
  isPostInventory: boolean;
  lines: GeneralBalanceLine[];
  grandTotalDebitMovements: string;
  grandTotalCreditMovements: string;
  grandTotalDebitBalances: string;
  grandTotalCreditBalances: string;
  isBalanced: boolean;
}

export class GeneralBalanceEngine {
  /**
   * Calcule la balance générale à partir d'une collection d'écritures du Grand Livre
   */
  public static computeBalance(
    entries: LedgerEntry[],
    meta: { fiscalYear: number; periodCode: string; isPostInventory?: boolean }
  ): GeneralBalanceReport {
    // Filtrer les pièces annulées (VOID)
    const validEntries = entries.filter((e) => e.status !== 'VOID');

    interface AccountAccumulator {
      accountNumber: string;
      accountRole: AccountRole;
      label: string;
      totalDebit: DecimalValue;
      totalCredit: DecimalValue;
    }

    const accMap = new Map<string, AccountAccumulator>();

    for (const entry of validEntries) {
      const key = `${entry.accountNumber}:${entry.accountRole}`;
      let acc = accMap.get(key);
      if (!acc) {
        acc = {
          accountNumber: entry.accountNumber,
          accountRole: entry.accountRole,
          label: entry.label,
          totalDebit: new EngineDecimal('0'),
          totalCredit: new EngineDecimal('0'),
        };
        accMap.set(key, acc);
      }

      if (entry.debit) {
        acc.totalDebit = acc.totalDebit.plus(new EngineDecimal(entry.debit));
      }
      if (entry.credit) {
        acc.totalCredit = acc.totalCredit.plus(new EngineDecimal(entry.credit));
      }
    }

    const lines: GeneralBalanceLine[] = [];
    let sumDebitMovements = new EngineDecimal('0');
    let sumCreditMovements = new EngineDecimal('0');
    let sumDebitBalances = new EngineDecimal('0');
    let sumCreditBalances = new EngineDecimal('0');

    // Tri par numéro de compte
    const sortedKeys = Array.from(accMap.keys()).sort();

    for (const key of sortedKeys) {
      const acc = accMap.get(key)!;
      sumDebitMovements = sumDebitMovements.plus(acc.totalDebit);
      sumCreditMovements = sumCreditMovements.plus(acc.totalCredit);

      let debitBalance: string | null = null;
      let creditBalance: string | null = null;

      if (acc.totalDebit.greaterThan(acc.totalCredit)) {
        const bal = acc.totalDebit.minus(acc.totalCredit).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        debitBalance = bal.toFixed(2);
        sumDebitBalances = sumDebitBalances.plus(bal);
      } else if (acc.totalCredit.greaterThan(acc.totalDebit)) {
        const bal = acc.totalCredit.minus(acc.totalDebit).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);
        creditBalance = bal.toFixed(2);
        sumCreditBalances = sumCreditBalances.plus(bal);
      }

      lines.push({
        accountNumber: acc.accountNumber,
        accountRole: acc.accountRole,
        label: acc.label,
        totalDebit: acc.totalDebit.toFixed(2),
        totalCredit: acc.totalCredit.toFixed(2),
        debitBalance,
        creditBalance,
      });
    }

    const movementsDiff = sumDebitMovements.minus(sumCreditMovements).abs();
    const balancesDiff = sumDebitBalances.minus(sumCreditBalances).abs();
    const isBalanced = movementsDiff.isZero() && balancesDiff.isZero();

    return {
      fiscalYear: meta.fiscalYear,
      periodCode: meta.periodCode,
      isPostInventory: !!meta.isPostInventory,
      lines,
      grandTotalDebitMovements: sumDebitMovements.toFixed(2),
      grandTotalCreditMovements: sumCreditMovements.toFixed(2),
      grandTotalDebitBalances: sumDebitBalances.toFixed(2),
      grandTotalCreditBalances: sumCreditBalances.toFixed(2),
      isBalanced,
    };
  }
}

