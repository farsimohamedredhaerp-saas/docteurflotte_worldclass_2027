/**
 * Moteur de Comptabilisation des Événements (Posting Engine)
 * 
 * Traduit un événement d'activité (BusinessEvent) en écritures de Grand Livre équilibrées
 * via l'exécution des expressions de schéma (POSTING_SCHEMA) par le moteur AST.
 */

import { AccountRole, BusinessEventType } from '../types/ontology.js';
import { EngineDecimal, DecimalValue } from '../math/decimal.js';
import { AstInterpreter } from '../ast/ast-interpreter.js';
import { AstNode } from '../ast/ast-types.js';
import {
  PostingSchemaItem,
  ChartOfAccounts,
  BusinessEvent,
  LedgerEntry,
  PaymentMode,
} from './ledger-types.js';
import { computeEntryHash } from './hashing.js';

export class UnmappedAccountRoleError extends Error {
  constructor(public readonly role: AccountRole, public readonly eventType: BusinessEventType) {
    super(`RÔLE DE COMPTE NON MAPPÉ : Le rôle '${role}' requis pour l'événement '${eventType}' n'est pas configuré dans le plan de comptes du pack réglementaire.`);
    this.name = 'UnmappedAccountRoleError';
  }
}

export class UnbalancedPieceError extends Error {
  constructor(
    public readonly pieceNumber: string,
    public readonly totalDebit: string,
    public readonly totalCredit: string,
    public readonly difference: string
  ) {
    super(`VIOLATION D ÉQUILIBRE COMPTABLE : La pièce '${pieceNumber}' est déséquilibrée (Débits: ${totalDebit} DA, Crédits: ${totalCredit} DA, Écart: ${difference} DA).`);
    this.name = 'UnbalancedPieceError';
  }
}

export interface PostingContext {
  tenantId: string;
  periodId: string;
  pieceNumber: string;
  localDate: string;
  recordedAt: string;
  packHash: string;
  lastHash: string;
}

export class PostingEngine {
  /**
   * Vérifie qu'un schéma de comptabilisation est entièrement résoluble
   * par un plan de comptes donné (Porte de publication du pack)
   */
  public static validateSchemaCompleteness(
    schema: PostingSchemaItem,
    chart: ChartOfAccounts
  ): { valid: boolean; missingRoles: AccountRole[] } {
    const missingRoles: AccountRole[] = [];

    for (const line of schema.lines) {
      if (!chart[line.role] || chart[line.role].trim() === '') {
        if (!missingRoles.includes(line.role)) {
          missingRoles.push(line.role);
        }
      }
    }

    return {
      valid: missingRoles.length === 0,
      missingRoles,
    };
  }

  /**
   * Évalue une expression AST dans le contexte d'un événement
   */
  private evaluateExpr(node: AstNode, variables: Record<string, unknown>): unknown {
    const result = AstInterpreter.evaluate(
      node,
      { variables, parameters: {} },
      { traceMode: 'off' }
    );
    return result.value;
  }

  /**
   * Génère les écritures comptables d'une pièce à partir d'un événement
   */
  public generateEntries(
    event: BusinessEvent,
    schema: PostingSchemaItem,
    chart: ChartOfAccounts,
    context: PostingContext
  ): LedgerEntry[] {
    // 1. Validation de l'existence de tous les comptes requis
    for (const line of schema.lines) {
      const acc = chart[line.role];
      if (!acc || acc.trim() === '') {
        throw new UnmappedAccountRoleError(line.role, schema.eventType);
      }
    }

    const astVariables: Record<string, unknown> = {
      payload: event.payload,
      event: {
        eventId: event.eventId,
        eventType: event.eventType,
        occurredAt: event.occurredAt,
        localDate: context.localDate,
        payload: event.payload,
      },
      context: {
        tenantId: context.tenantId,
        localDate: context.localDate,
      },
    };

    // 2. Évaluation des lignes éligibles
    interface CandidateLine {
      role: AccountRole;
      accountNumber: string;
      side: 'DEBIT' | 'CREDIT';
      amount: DecimalValue;
      amountHt?: string | null;
      vatAmount?: string | null;
      label: string;
      paymentMode?: PaymentMode;
      collectionDate?: string;
      segmentCode?: string;
    }

    const candidates: CandidateLine[] = [];

    for (const ruleLine of schema.lines) {
      // Évaluation conditionnelle de la ligne
      if (ruleLine.conditionExpr) {
        const condResult = this.evaluateExpr(ruleLine.conditionExpr, astVariables);
        if (!condResult) {
          continue;
        }
      }

      // Évaluation du montant
      const rawAmount = this.evaluateExpr(ruleLine.amountExpr, astVariables);
      const amountDec = (rawAmount instanceof EngineDecimal ? rawAmount : new EngineDecimal(String(rawAmount))).toDecimalPlaces(2, EngineDecimal.ROUND_HALF_UP);

      if (amountDec.isZero()) {
        continue;
      }
      if (amountDec.isNegative()) {
        throw new Error(`Montant négatif invalide pour la ligne ${ruleLine.role} : ${amountDec.toFixed(2)}`);
      }

      // Évaluation libellé
      let label = `${event.eventType} - ${context.pieceNumber}`;
      if (ruleLine.labelExpr) {
        label = String(this.evaluateExpr(ruleLine.labelExpr, astVariables));
      } else if (event.payload.label) {
        label = String(event.payload.label);
      }

      // Montant HT optionnel
      let amountHt: string | null = null;
      if (ruleLine.amountHtExpr) {
        const rawHt = this.evaluateExpr(ruleLine.amountHtExpr, astVariables);
        amountHt = (rawHt instanceof EngineDecimal ? rawHt : new EngineDecimal(String(rawHt))).toFixed(2);
      } else if (event.payload.amount_ht !== undefined) {
        amountHt = new EngineDecimal(String(event.payload.amount_ht)).toFixed(2);
      }

      // Montant TVA optionnel
      let vatAmount: string | null = null;
      if (ruleLine.vatAmountExpr) {
        const rawVat = this.evaluateExpr(ruleLine.vatAmountExpr, astVariables);
        vatAmount = (rawVat instanceof EngineDecimal ? rawVat : new EngineDecimal(String(rawVat))).toFixed(2);
      } else if (event.payload.vat_amount !== undefined) {
        vatAmount = new EngineDecimal(String(event.payload.vat_amount)).toFixed(2);
      }

      const paymentMode = (event.payload.payment_mode as PaymentMode) || undefined;
      const collectionDate = (event.payload.collection_date as string) || undefined;
      const segmentCode = (event.payload.segment_code as string) || undefined;

      candidates.push({
        role: ruleLine.role,
        accountNumber: chart[ruleLine.role],
        side: ruleLine.side,
        amount: amountDec,
        amountHt,
        vatAmount,
        label,
        paymentMode,
        collectionDate,
        segmentCode,
      });
    }

    if (candidates.length < 2) {
      throw new Error(`Écriture incomplète : une pièce comptable doit comporter au moins deux lignes débit/crédit (généré: ${candidates.length}).`);
    }

    // 3. Vérification de l'équilibre comptable (Débit = Crédit)
    let totalDebit = new EngineDecimal('0');
    let totalCredit = new EngineDecimal('0');

    for (const cand of candidates) {
      if (cand.side === 'DEBIT') {
        totalDebit = totalDebit.plus(cand.amount);
      } else {
        totalCredit = totalCredit.plus(cand.amount);
      }
    }

    const diff = totalDebit.minus(totalCredit).abs();
    if (!diff.isZero()) {
      throw new UnbalancedPieceError(
        context.pieceNumber,
        totalDebit.toFixed(2),
        totalCredit.toFixed(2),
        diff.toFixed(2)
      );
    }

    // 4. Chaînage SHA-256 et instanciation des LedgerEntry
    const entries: LedgerEntry[] = [];
    let currentPrevHash = context.lastHash;

    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      const lineNumber = i + 1;
      const debitStr = cand.side === 'DEBIT' ? cand.amount.toFixed(2) : null;
      const creditStr = cand.side === 'CREDIT' ? cand.amount.toFixed(2) : null;

      const hash = computeEntryHash({
        prevHash: currentPrevHash,
        tenantId: context.tenantId,
        pieceNumber: context.pieceNumber,
        lineNumber,
        localDate: context.localDate,
        accountNumber: cand.accountNumber,
        accountRole: cand.role,
        debit: debitStr,
        credit: creditStr,
        amountHt: cand.amountHt ?? null,
        vatAmount: cand.vatAmount ?? null,
        paymentMode: cand.paymentMode ?? null,
        collectionDate: cand.collectionDate ?? null,
        segmentCode: cand.segmentCode ?? null,
        packHash: context.packHash,
      });

      const entry: LedgerEntry = {
        id: `${context.pieceNumber}-${lineNumber}`,
        tenantId: context.tenantId,
        periodId: context.periodId,
        pieceNumber: context.pieceNumber,
        lineNumber,
        localDate: context.localDate,
        recordedAt: context.recordedAt,
        accountRole: cand.role,
        accountNumber: cand.accountNumber,
        label: cand.label,
        debit: debitStr,
        credit: creditStr,
        amountHt: cand.amountHt ?? null,
        vatAmount: cand.vatAmount ?? null,
        paymentMode: cand.paymentMode,
        collectionDate: cand.collectionDate,
        segmentCode: cand.segmentCode,
        tags: [],
        prevHash: currentPrevHash,
        hash,
        status: 'VALIDATED',
        eventId: event.eventId,
        packHash: context.packHash,
      };

      entries.push(entry);
      currentPrevHash = hash;
    }

    return entries;
  }
}
