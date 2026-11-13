/**
 * Interprète AST de Référence (Évaluateur Pur & Déterministe)
 * 
 * RÈGLES D'OR :
 * - Aucune horloge, aucun hasard non injecté, aucun accès base.
 * - Respect du budget d'opérations (maxOperations <= 100 000).
 * - Utilisation systématique de Decimal pour les calculs numériques.
 * - Traces d'audit configurables ('off' | 'summary' | 'full').
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { AlgeriaCalendar } from '../time/algeria-time';
import {
  AST_BUDGETS,
  AstEvaluationContext,
  AstEvaluationOptions,
  AstEvaluationResult,
  AstEvaluationTraceStep,
  AstNode,
} from './ast-types';
import { safeResolvePath } from './security-path';

export class AstInterpreter {
  /**
   * Évalue un nœud AST avec contexte et options donnés.
   */
  static evaluate<T = unknown>(
    node: AstNode,
    context: AstEvaluationContext,
    options: AstEvaluationOptions = {}
  ): AstEvaluationResult<T> {
    const maxOps = options.maxOperations || AST_BUDGETS.MAX_OPERATIONS;
    const missingPolicy = options.missingVariablePolicy || 'FAIL';
    const traceMode = options.traceMode || 'off';

    let opCounter = 0;
    const traceSteps: AstEvaluationTraceStep[] = [];
    const t0 = performance.now();

    function toDecimal(val: unknown): DecimalValue {
      if (val instanceof EngineDecimal) return val;
      if (typeof val === 'number') return new EngineDecimal(val);
      if (typeof val === 'string') return EngineMath.from(val);
      throw new Error(`Conversion en Decimal impossible pour la valeur de type ${typeof val} : ${val}`);
    }

    function evalInternal(curr: AstNode, scope: Record<string, unknown>): unknown {
      opCounter++;
      if (opCounter > maxOps) {
        throw new Error(
          `Dépassement du budget d'opérations d'évaluation : limite maximale de ${maxOps} opérations atteinte.`
        );
      }

      const stepStart = traceMode === 'full' ? performance.now() : 0;
      let result: unknown;

      switch (curr.type) {
        case 'const':
          if (curr.valueType === 'DEC') {
            result = toDecimal(curr.value);
          } else {
            result = curr.value;
          }
          break;

        case 'var': {
          // 1. Chercher d'abord dans le scope local (LET/FILTER/MAP)
          if (scope && Object.hasOwn(scope, curr.path)) {
            result = scope[curr.path];
          } else {
            // 2. Chercher dans les variables du contexte
            result = safeResolvePath(context.variables, curr.path, missingPolicy, curr.fallback);
          }
          break;
        }

        case 'param': {
          if (!context.parameters || !Object.hasOwn(context.parameters, curr.paramCode)) {
            throw new Error(`Paramètre réglementaire introuvable dans le pack : "${curr.paramCode}".`);
          }
          const rawParam = context.parameters[curr.paramCode];
          result = typeof rawParam === 'string' || typeof rawParam === 'number'
            ? toDecimal(rawParam)
            : rawParam;
          break;
        }

        // --- Opérateurs arithmétiques ---
        case 'ADD': {
          const l = toDecimal(evalInternal(curr.left, scope));
          const r = toDecimal(evalInternal(curr.right, scope));
          result = l.plus(r);
          break;
        }

        case 'SUB': {
          const l = toDecimal(evalInternal(curr.left, scope));
          const r = toDecimal(evalInternal(curr.right, scope));
          result = l.minus(r);
          break;
        }

        case 'MUL': {
          const l = toDecimal(evalInternal(curr.left, scope));
          const r = toDecimal(evalInternal(curr.right, scope));
          result = l.times(r);
          break;
        }

        case 'DIV': {
          const l = toDecimal(evalInternal(curr.left, scope));
          const r = toDecimal(evalInternal(curr.right, scope));
          result = EngineMath.divide(l, r, curr.on_zero);
          break;
        }

        case 'MIN': {
          const l = toDecimal(evalInternal(curr.left, scope));
          const r = toDecimal(evalInternal(curr.right, scope));
          result = EngineDecimal.min(l, r);
          break;
        }

        case 'MAX': {
          const l = toDecimal(evalInternal(curr.left, scope));
          const r = toDecimal(evalInternal(curr.right, scope));
          result = EngineDecimal.max(l, r);
          break;
        }

        case 'ABS': {
          const val = toDecimal(evalInternal(curr.operand, scope));
          result = val.abs();
          break;
        }

        case 'NEG': {
          const val = toDecimal(evalInternal(curr.operand, scope));
          result = val.neg();
          break;
        }

        case 'ROUND': {
          const val = toDecimal(evalInternal(curr.operand, scope));
          result = EngineMath.round(val, curr.scale, curr.mode);
          break;
        }

        // --- Comparaisons ---
        case 'EQ': {
          const l = evalInternal(curr.left, scope);
          const r = evalInternal(curr.right, scope);
          if (l instanceof EngineDecimal || r instanceof EngineDecimal) {
            result = toDecimal(l).equals(toDecimal(r));
          } else {
            result = l === r;
          }
          break;
        }

        case 'NEQ': {
          const l = evalInternal(curr.left, scope);
          const r = evalInternal(curr.right, scope);
          if (l instanceof EngineDecimal || r instanceof EngineDecimal) {
            result = !toDecimal(l).equals(toDecimal(r));
          } else {
            result = l !== r;
          }
          break;
        }

        case 'LT': {
          const l = evalInternal(curr.left, scope);
          const r = evalInternal(curr.right, scope);
          if (l instanceof EngineDecimal || r instanceof EngineDecimal) {
            result = toDecimal(l).lessThan(toDecimal(r));
          } else {
            result = (l as any) < (r as any);
          }
          break;
        }

        case 'LTE': {
          const l = evalInternal(curr.left, scope);
          const r = evalInternal(curr.right, scope);
          if (l instanceof EngineDecimal || r instanceof EngineDecimal) {
            result = toDecimal(l).lessThanOrEqualTo(toDecimal(r));
          } else {
            result = (l as any) <= (r as any);
          }
          break;
        }

        case 'GT': {
          const l = evalInternal(curr.left, scope);
          const r = evalInternal(curr.right, scope);
          if (l instanceof EngineDecimal || r instanceof EngineDecimal) {
            result = toDecimal(l).greaterThan(toDecimal(r));
          } else {
            result = (l as any) > (r as any);
          }
          break;
        }

        case 'GTE': {
          const l = evalInternal(curr.left, scope);
          const r = evalInternal(curr.right, scope);
          if (l instanceof EngineDecimal || r instanceof EngineDecimal) {
            result = toDecimal(l).greaterThanOrEqualTo(toDecimal(r));
          } else {
            result = (l as any) >= (r as any);
          }
          break;
        }

        case 'BETWEEN': {
          const val = toDecimal(evalInternal(curr.value, scope));
          const min = toDecimal(evalInternal(curr.min, scope));
          const max = toDecimal(evalInternal(curr.max, scope));
          result = val.greaterThanOrEqualTo(min) && val.lessThanOrEqualTo(max);
          break;
        }

        // --- Logique booléenne ---
        case 'AND': {
          const l = Boolean(evalInternal(curr.left, scope));
          if (!l) {
            result = false;
          } else {
            result = Boolean(evalInternal(curr.right, scope));
          }
          break;
        }

        case 'OR': {
          const l = Boolean(evalInternal(curr.left, scope));
          if (l) {
            result = true;
          } else {
            result = Boolean(evalInternal(curr.right, scope));
          }
          break;
        }

        case 'NOT': {
          result = !Boolean(evalInternal(curr.operand, scope));
          break;
        }

        // --- Conditionnel & Portée locale ---
        case 'COND': {
          const cond = Boolean(evalInternal(curr.condition, scope));
          result = cond
            ? evalInternal(curr.thenBranch, scope)
            : evalInternal(curr.elseBranch, scope);
          break;
        }

        case 'LET': {
          const newScope = { ...scope };
          for (const [varName, bindingNode] of Object.entries(curr.bindings)) {
            newScope[varName] = evalInternal(bindingNode, newScope);
          }
          result = evalInternal(curr.in, newScope);
          break;
        }

        // --- Opérations temporelles ---
        case 'DAYS_BETWEEN': {
          const d1 = String(evalInternal(curr.date1, scope));
          const d2 = String(evalInternal(curr.date2, scope));
          result = new EngineDecimal(AlgeriaCalendar.daysBetween(d1, d2));
          break;
        }

        case 'ADD_DAYS': {
          const d = String(evalInternal(curr.date, scope));
          const daysDec = toDecimal(evalInternal(curr.days, scope));
          result = AlgeriaCalendar.addDays(d, daysDec.toNumber());
          break;
        }

        case 'IN_RANGE': {
          const d = String(evalInternal(curr.date, scope));
          const start = String(evalInternal(curr.startDate, scope));
          const end = String(evalInternal(curr.endDate, scope));
          result = AlgeriaCalendar.isDateInRange(d, start, end);
          break;
        }

        // --- Opérations de listes ---
        case 'SUM': {
          const list = evalInternal(curr.list, scope);
          if (!Array.isArray(list)) throw new Error('SUM requiert une liste.');
          let total = new EngineDecimal(0);
          for (const item of list) {
            total = total.plus(toDecimal(item));
          }
          result = total;
          break;
        }

        case 'COUNT': {
          const list = evalInternal(curr.list, scope);
          if (!Array.isArray(list)) throw new Error('COUNT requiert une liste.');
          result = new EngineDecimal(list.length);
          break;
        }

        case 'FILTER': {
          const list = evalInternal(curr.list, scope);
          if (!Array.isArray(list)) throw new Error('FILTER requiert une liste.');
          const filtered: unknown[] = [];
          for (const item of list) {
            const itemScope = { ...scope, [curr.predicateVar]: item };
            if (Boolean(evalInternal(curr.predicate, itemScope))) {
              filtered.push(item);
            }
          }
          result = filtered;
          break;
        }

        case 'MAP': {
          const list = evalInternal(curr.list, scope);
          if (!Array.isArray(list)) throw new Error('MAP requiert une liste.');
          const mapped: unknown[] = [];
          for (const item of list) {
            const itemScope = { ...scope, [curr.itemVar]: item };
            mapped.push(evalInternal(curr.transform, itemScope));
          }
          result = mapped;
          break;
        }

        case 'GROUP_BY': {
          const list = evalInternal(curr.list, scope);
          if (!Array.isArray(list)) throw new Error('GROUP_BY requiert une liste.');
          const groups: Record<string, unknown[]> = {};
          for (const item of list) {
            const itemScope = { ...scope, [curr.keyVar]: item };
            const groupKey = String(evalInternal(curr.keySelector, itemScope));
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
          }
          result = groups;
          break;
        }

        default:
          throw new Error(`Nœud AST non supporté : ${(curr as any).type}`);
      }

      if (traceMode === 'full') {
        const stepDuration = Number(((performance.now() - stepStart) * 1000).toFixed(2));
        traceSteps.push({
          stepIndex: opCounter,
          nodeType: curr.type,
          result,
          elapsedUs: stepDuration,
        });
      }

      return result;
    }

    const value = evalInternal(node, context.localScope || {}) as T;
    const durationUs = Number(((performance.now() - t0) * 1000).toFixed(2));

    return {
      value,
      operationsCount: opCounter,
      durationUs,
      traceSteps: traceMode === 'full' ? traceSteps : undefined,
    };
  }

  /**
   * Évalue un lot d'arbres ou de contextes (Batch).
   */
  static evaluateBatch<T = unknown>(
    nodes: AstNode[],
    contexts: AstEvaluationContext[],
    options: AstEvaluationOptions = {}
  ): AstEvaluationResult<T>[] {
    const results: AstEvaluationResult<T>[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const ctx = contexts[i] || contexts[0];
      results.push(this.evaluate<T>(node, ctx, options));
    }
    return results;
  }
}

