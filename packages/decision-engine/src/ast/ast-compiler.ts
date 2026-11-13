/**
 * Compilateur AST en Closures d'Ordre Supérieur (Haute Performance)
 * 
 * RÈGLE FONDAMENTALE : Zéro eval(), zéro new Function().
 * Compilation pure par composition fonctionnelle en closures JavaScript natives.
 * Sémantique strictement identique à l'AstInterpreter de référence.
 */

import { EngineDecimal, DecimalValue, EngineMath } from '../math/decimal';
import { AlgeriaCalendar } from '../time/algeria-time';
import {
  AstEvaluationContext,
  AstNode,
  MissingVariablePolicy,
} from './ast-types';
import { safeResolvePath } from './security-path';

export type CompiledClosure<T = unknown> = (
  context: AstEvaluationContext,
  scope?: Record<string, unknown>
) => T;

export class AstCompiler {
  /**
   * Compile un nœud AST en une closure JS native pure et composable.
   */
  static compile<T = unknown>(
    node: AstNode,
    missingPolicy: MissingVariablePolicy = 'FAIL'
  ): CompiledClosure<T> {
    function toDecimal(val: unknown): DecimalValue {
      if (val instanceof EngineDecimal) return val;
      if (typeof val === 'number') return new EngineDecimal(val);
      if (typeof val === 'string') return EngineMath.from(val);
      throw new Error(`Conversion en Decimal impossible : ${val}`);
    }

    switch (node.type) {
      case 'const': {
        const val = node.valueType === 'DEC' ? toDecimal(node.value) : node.value;
        return () => val as T;
      }

      case 'var': {
        const path = node.path;
        const fallback = node.fallback;
        return (ctx, scope) => {
          if (scope && Object.hasOwn(scope, path)) {
            return scope[path] as T;
          }
          return safeResolvePath(ctx.variables, path, missingPolicy, fallback) as T;
        };
      }

      case 'param': {
        const paramCode = node.paramCode;
        return (ctx) => {
          if (!ctx.parameters || !Object.hasOwn(ctx.parameters, paramCode)) {
            throw new Error(`Paramètre réglementaire introuvable dans le pack : "${paramCode}".`);
          }
          const raw = ctx.parameters[paramCode];
          return (typeof raw === 'string' || typeof raw === 'number'
            ? toDecimal(raw)
            : raw) as T;
        };
      }

      case 'ADD': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => toDecimal(l(ctx, scope)).plus(toDecimal(r(ctx, scope))) as T;
      }

      case 'SUB': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => toDecimal(l(ctx, scope)).minus(toDecimal(r(ctx, scope))) as T;
      }

      case 'MUL': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => toDecimal(l(ctx, scope)).times(toDecimal(r(ctx, scope))) as T;
      }

      case 'DIV': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        const onZero = node.on_zero;
        return (ctx, scope) => EngineMath.divide(toDecimal(l(ctx, scope)), toDecimal(r(ctx, scope)), onZero) as T;
      }

      case 'MIN': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => EngineDecimal.min(toDecimal(l(ctx, scope)), toDecimal(r(ctx, scope))) as T;
      }

      case 'MAX': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => EngineDecimal.max(toDecimal(l(ctx, scope)), toDecimal(r(ctx, scope))) as T;
      }

      case 'ABS': {
        const op = this.compile(node.operand, missingPolicy);
        return (ctx, scope) => toDecimal(op(ctx, scope)).abs() as T;
      }

      case 'NEG': {
        const op = this.compile(node.operand, missingPolicy);
        return (ctx, scope) => toDecimal(op(ctx, scope)).neg() as T;
      }

      case 'ROUND': {
        const op = this.compile(node.operand, missingPolicy);
        const scale = node.scale;
        const mode = node.mode;
        return (ctx, scope) => EngineMath.round(toDecimal(op(ctx, scope)), scale, mode) as T;
      }

      case 'EQ': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => {
          const lVal = l(ctx, scope);
          const rVal = r(ctx, scope);
          if (lVal instanceof EngineDecimal || rVal instanceof EngineDecimal) {
            return toDecimal(lVal).equals(toDecimal(rVal)) as T;
          }
          return (lVal === rVal) as T;
        };
      }

      case 'NEQ': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => {
          const lVal = l(ctx, scope);
          const rVal = r(ctx, scope);
          if (lVal instanceof EngineDecimal || rVal instanceof EngineDecimal) {
            return (!toDecimal(lVal).equals(toDecimal(rVal))) as T;
          }
          return (lVal !== rVal) as T;
        };
      }

      case 'LT': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => {
          const lVal = l(ctx, scope);
          const rVal = r(ctx, scope);
          if (lVal instanceof EngineDecimal || rVal instanceof EngineDecimal) {
            return toDecimal(lVal).lessThan(toDecimal(rVal)) as T;
          }
          return ((lVal as any) < (rVal as any)) as T;
        };
      }

      case 'LTE': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => {
          const lVal = l(ctx, scope);
          const rVal = r(ctx, scope);
          if (lVal instanceof EngineDecimal || rVal instanceof EngineDecimal) {
            return toDecimal(lVal).lessThanOrEqualTo(toDecimal(rVal)) as T;
          }
          return ((lVal as any) <= (rVal as any)) as T;
        };
      }

      case 'GT': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => {
          const lVal = l(ctx, scope);
          const rVal = r(ctx, scope);
          if (lVal instanceof EngineDecimal || rVal instanceof EngineDecimal) {
            return toDecimal(lVal).greaterThan(toDecimal(rVal)) as T;
          }
          return ((lVal as any) > (rVal as any)) as T;
        };
      }

      case 'GTE': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => {
          const lVal = l(ctx, scope);
          const rVal = r(ctx, scope);
          if (lVal instanceof EngineDecimal || rVal instanceof EngineDecimal) {
            return toDecimal(lVal).greaterThanOrEqualTo(toDecimal(rVal)) as T;
          }
          return ((lVal as any) >= (rVal as any)) as T;
        };
      }

      case 'BETWEEN': {
        const v = this.compile(node.value, missingPolicy);
        const min = this.compile(node.min, missingPolicy);
        const max = this.compile(node.max, missingPolicy);
        return (ctx, scope) => {
          const valDec = toDecimal(v(ctx, scope));
          const minDec = toDecimal(min(ctx, scope));
          const maxDec = toDecimal(max(ctx, scope));
          return (valDec.greaterThanOrEqualTo(minDec) && valDec.lessThanOrEqualTo(maxDec)) as T;
        };
      }

      case 'AND': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => (Boolean(l(ctx, scope)) && Boolean(r(ctx, scope))) as T;
      }

      case 'OR': {
        const l = this.compile(node.left, missingPolicy);
        const r = this.compile(node.right, missingPolicy);
        return (ctx, scope) => (Boolean(l(ctx, scope)) || Boolean(r(ctx, scope))) as T;
      }

      case 'NOT': {
        const op = this.compile(node.operand, missingPolicy);
        return (ctx, scope) => (!Boolean(op(ctx, scope))) as T;
      }

      case 'COND': {
        const cond = this.compile(node.condition, missingPolicy);
        const thenB = this.compile(node.thenBranch, missingPolicy);
        const elseB = this.compile(node.elseBranch, missingPolicy);
        return (ctx, scope) => (Boolean(cond(ctx, scope)) ? thenB(ctx, scope) : elseB(ctx, scope)) as T;
      }

      case 'LET': {
        const compiledBindings: Record<string, CompiledClosure> = {};
        for (const [k, v] of Object.entries(node.bindings)) {
          compiledBindings[k] = this.compile(v, missingPolicy);
        }
        const inFn = this.compile(node.in, missingPolicy);
        return (ctx, scope) => {
          const newScope = { ...(scope || {}) };
          for (const [k, fn] of Object.entries(compiledBindings)) {
            newScope[k] = fn(ctx, newScope);
          }
          return inFn(ctx, newScope) as T;
        };
      }

      case 'DAYS_BETWEEN': {
        const d1 = this.compile(node.date1, missingPolicy);
        const d2 = this.compile(node.date2, missingPolicy);
        return (ctx, scope) =>
          new EngineDecimal(
            AlgeriaCalendar.daysBetween(String(d1(ctx, scope)), String(d2(ctx, scope)))
          ) as T;
      }

      case 'ADD_DAYS': {
        const d = this.compile(node.date, missingPolicy);
        const days = this.compile(node.days, missingPolicy);
        return (ctx, scope) =>
          AlgeriaCalendar.addDays(String(d(ctx, scope)), toDecimal(days(ctx, scope)).toNumber()) as T;
      }

      case 'IN_RANGE': {
        const d = this.compile(node.date, missingPolicy);
        const s = this.compile(node.startDate, missingPolicy);
        const e = this.compile(node.endDate, missingPolicy);
        return (ctx, scope) =>
          AlgeriaCalendar.isDateInRange(
            String(d(ctx, scope)),
            String(s(ctx, scope)),
            String(e(ctx, scope))
          ) as T;
      }

      case 'SUM': {
        const listFn = this.compile(node.list, missingPolicy);
        return (ctx, scope) => {
          const list = listFn(ctx, scope);
          if (!Array.isArray(list)) throw new Error('SUM requiert une liste.');
          let sum = new EngineDecimal(0);
          for (const item of list) {
            sum = sum.plus(toDecimal(item));
          }
          return sum as T;
        };
      }

      case 'COUNT': {
        const listFn = this.compile(node.list, missingPolicy);
        return (ctx, scope) => {
          const list = listFn(ctx, scope);
          if (!Array.isArray(list)) throw new Error('COUNT requiert une liste.');
          return new EngineDecimal(list.length) as T;
        };
      }

      case 'FILTER': {
        const listFn = this.compile(node.list, missingPolicy);
        const predFn = this.compile(node.predicate, missingPolicy);
        const predVar = node.predicateVar;
        return (ctx, scope) => {
          const list = listFn(ctx, scope);
          if (!Array.isArray(list)) throw new Error('FILTER requiert une liste.');
          const res: unknown[] = [];
          for (const item of list) {
            const itemScope = { ...(scope || {}), [predVar]: item };
            if (Boolean(predFn(ctx, itemScope))) res.push(item);
          }
          return res as T;
        };
      }

      case 'MAP': {
        const listFn = this.compile(node.list, missingPolicy);
        const transformFn = this.compile(node.transform, missingPolicy);
        const itemVar = node.itemVar;
        return (ctx, scope) => {
          const list = listFn(ctx, scope);
          if (!Array.isArray(list)) throw new Error('MAP requiert une liste.');
          return list.map((item) => {
            const itemScope = { ...(scope || {}), [itemVar]: item };
            return transformFn(ctx, itemScope);
          }) as T;
        };
      }

      case 'GROUP_BY': {
        const listFn = this.compile(node.list, missingPolicy);
        const keyFn = this.compile(node.keySelector, missingPolicy);
        const keyVar = node.keyVar;
        return (ctx, scope) => {
          const list = listFn(ctx, scope);
          if (!Array.isArray(list)) throw new Error('GROUP_BY requiert une liste.');
          const groups: Record<string, unknown[]> = {};
          for (const item of list) {
            const itemScope = { ...(scope || {}), [keyVar]: item };
            const k = String(keyFn(ctx, itemScope));
            if (!groups[k]) groups[k] = [];
            groups[k].push(item);
          }
          return groups as T;
        };
      }

      default:
        throw new Error(`Type de nœud non supporté pour la compilation : ${(node as any).type}`);
    }
  }
}
