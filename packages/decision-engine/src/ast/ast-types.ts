/**
 * Grammaire Typée et Définitions de l'AST du Moteur Décisionnel
 * 
 * RÈGLES FORMELLES :
 * - Types de données : DEC (décimal exact), STR (chaîne), BOOL (booléen), DATE (YYYY-MM-DD), LIST (liste).
 * - DIV exige obligatoirement une politique on_zero ('ERROR' | 'ZERO' | 'NULL').
 * - Budgets : profondeur <= 32, noeuds <= 2 000, opérations <= 100 000.
 * - Aucune récursion, aucun appel à eval() ou Function().
 */

import { DecimalValue, DivisionOnZeroPolicy } from '../math/decimal';

export type AstDataType = 'DEC' | 'STR' | 'BOOL' | 'DATE' | 'LIST';

export type RoundingMode = 'HALF_UP' | 'HALF_DOWN' | 'HALF_EVEN' | 'FLOOR' | 'CEIL';

export type MissingVariablePolicy = 'FAIL' | 'NULL';

export type TraceMode = 'off' | 'summary' | 'full';

export const AST_BUDGETS = {
  MAX_DEPTH: 32,
  MAX_NODES: 2000,
  MAX_OPERATIONS: 100000,
} as const;

export type AstNode =
  // 1. Constantes et accès aux données
  | { type: 'const'; valueType: AstDataType; value: unknown }
  | { type: 'var'; path: string; fallback?: unknown }
  | { type: 'param'; paramCode: string }

  // 2. Arithmétique décimale
  | { type: 'ADD'; left: AstNode; right: AstNode }
  | { type: 'SUB'; left: AstNode; right: AstNode }
  | { type: 'MUL'; left: AstNode; right: AstNode }
  | { type: 'DIV'; left: AstNode; right: AstNode; on_zero: DivisionOnZeroPolicy }
  | { type: 'MIN'; left: AstNode; right: AstNode }
  | { type: 'MAX'; left: AstNode; right: AstNode }
  | { type: 'ABS'; operand: AstNode }
  | { type: 'NEG'; operand: AstNode }
  | { type: 'ROUND'; operand: AstNode; scale: number; mode: RoundingMode }

  // 3. Comparaisons & Relatifs
  | { type: 'EQ'; left: AstNode; right: AstNode }
  | { type: 'NEQ'; left: AstNode; right: AstNode }
  | { type: 'LT'; left: AstNode; right: AstNode }
  | { type: 'LTE'; left: AstNode; right: AstNode }
  | { type: 'GT'; left: AstNode; right: AstNode }
  | { type: 'GTE'; left: AstNode; right: AstNode }
  | { type: 'BETWEEN'; value: AstNode; min: AstNode; max: AstNode }

  // 4. Logique booléenne
  | { type: 'AND'; left: AstNode; right: AstNode }
  | { type: 'OR'; left: AstNode; right: AstNode }
  | { type: 'NOT'; operand: AstNode }

  // 5. Conditionnel & Portée locale
  | { type: 'COND'; condition: AstNode; thenBranch: AstNode; elseBranch: AstNode }
  | { type: 'LET'; bindings: Record<string, AstNode>; in: AstNode }

  // 6. Opérateurs temporels (Fuseau Africa/Algiers)
  | { type: 'DAYS_BETWEEN'; date1: AstNode; date2: AstNode }
  | { type: 'ADD_DAYS'; date: AstNode; days: AstNode }
  | { type: 'IN_RANGE'; date: AstNode; startDate: AstNode; endDate: AstNode }

  // 7. Opérations sur listes bornées
  | { type: 'SUM'; list: AstNode }
  | { type: 'COUNT'; list: AstNode }
  | { type: 'FILTER'; list: AstNode; predicateVar: string; predicate: AstNode }
  | { type: 'MAP'; list: AstNode; itemVar: string; transform: AstNode }
  | { type: 'GROUP_BY'; list: AstNode; keyVar: string; keySelector: AstNode };

export interface AstEvaluationContext {
  variables: Record<string, unknown>;
  parameters: Record<string, unknown>;
  localScope?: Record<string, unknown>;
}

export interface AstEvaluationOptions {
  traceMode?: TraceMode;
  missingVariablePolicy?: MissingVariablePolicy;
  maxOperations?: number;
}

export interface AstEvaluationTraceStep {
  stepIndex: number;
  nodeType: string;
  result: unknown;
  elapsedUs: number;
}

export interface AstEvaluationResult<T = unknown> {
  value: T;
  operationsCount: number;
  durationUs: number;
  traceSteps?: AstEvaluationTraceStep[];
}

