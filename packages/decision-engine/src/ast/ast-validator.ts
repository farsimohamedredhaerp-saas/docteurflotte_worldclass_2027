/**
 * Vérificateur Statique d'Arbre AST (Validation à la Publication)
 * 
 * VÉRIFICATIONS :
 * 1. Respect strict des budgets : Profondeur <= 32, Nombre de nœuds <= 2 000.
 * 2. Clause on_zero obligatoire sur toute opération DIV.
 * 3. Validation de sécurité sur les chemins de variables (interdiction __proto__, constructor, prototype).
 * 4. Présence de tous les paramètres référencés par les nœuds 'param'.
 */

import { AST_BUDGETS, AstNode } from './ast-types';
import { SecurityViolationError } from './security-path';

export interface AstValidationReport {
  isValid: boolean;
  depth: number;
  nodeCount: number;
  errors: string[];
  referencedParameters: string[];
}

export class AstStaticValidator {
  /**
   * Analyse statique exhaustive d'un arbre d'expression AST.
   */
  static validate(node: AstNode, availableParamCodes?: Set<string>): AstValidationReport {
    const errors: string[] = [];
    const referencedParams = new Set<string>();
    let totalNodes = 0;

    function traverse(current: AstNode, currentDepth: number): number {
      totalNodes++;
      if (currentDepth > AST_BUDGETS.MAX_DEPTH) {
        errors.push(`Dépassement du budget de profondeur : profondeur maximale autorisée ${AST_BUDGETS.MAX_DEPTH}, constatée > ${currentDepth}.`);
        return currentDepth;
      }

      if (totalNodes > AST_BUDGETS.MAX_NODES) {
        errors.push(`Dépassement du budget de complexité : nombre maximal de nœuds ${AST_BUDGETS.MAX_NODES} dépassé.`);
        return currentDepth;
      }

      if (!current || typeof current !== 'object' || !('type' in current)) {
        errors.push(`Nœud AST invalide ou mal formé rencontré à la profondeur ${currentDepth}.`);
        return currentDepth;
      }

      let maxSubDepth = currentDepth;

      switch (current.type) {
        case 'const':
          break;

        case 'var':
          if (
            current.path.includes('__proto__') ||
            current.path.includes('constructor') ||
            current.path.includes('prototype')
          ) {
            errors.push(`Violation de sécurité dans le chemin de variable "${current.path}".`);
          }
          break;

        case 'param':
          referencedParams.add(current.paramCode);
          if (availableParamCodes && !availableParamCodes.has(current.paramCode)) {
            errors.push(`Paramètre introuvable dans le pack : "${current.paramCode}".`);
          }
          break;

        case 'DIV':
          if (!current.on_zero || !['ERROR', 'ZERO', 'NULL'].includes(current.on_zero)) {
            errors.push('Opérateur DIV sans politique on_zero valide (ERROR, ZERO, NULL requis).');
          }
          maxSubDepth = Math.max(
            traverse(current.left, currentDepth + 1),
            traverse(current.right, currentDepth + 1)
          );
          break;

        case 'ADD':
        case 'SUB':
        case 'MUL':
        case 'MIN':
        case 'MAX':
        case 'EQ':
        case 'NEQ':
        case 'LT':
        case 'LTE':
        case 'GT':
        case 'GTE':
        case 'AND':
        case 'OR':
          maxSubDepth = Math.max(
            traverse(current.left, currentDepth + 1),
            traverse(current.right, currentDepth + 1)
          );
          break;

        case 'DAYS_BETWEEN':
          maxSubDepth = Math.max(
            traverse(current.date1, currentDepth + 1),
            traverse(current.date2, currentDepth + 1)
          );
          break;

        case 'ADD_DAYS':
          maxSubDepth = Math.max(
            traverse(current.date, currentDepth + 1),
            traverse(current.days, currentDepth + 1)
          );
          break;

        case 'ABS':
        case 'NEG':
        case 'ROUND':
        case 'NOT':
          maxSubDepth = traverse(current.operand, currentDepth + 1);
          break;

        case 'BETWEEN':
          maxSubDepth = Math.max(
            traverse(current.value, currentDepth + 1),
            traverse(current.min, currentDepth + 1),
            traverse(current.max, currentDepth + 1)
          );
          break;

        case 'COND':
          maxSubDepth = Math.max(
            traverse(current.condition, currentDepth + 1),
            traverse(current.thenBranch, currentDepth + 1),
            traverse(current.elseBranch, currentDepth + 1)
          );
          break;

        case 'LET':
          for (const bindingNode of Object.values(current.bindings)) {
            maxSubDepth = Math.max(maxSubDepth, traverse(bindingNode, currentDepth + 1));
          }
          maxSubDepth = Math.max(maxSubDepth, traverse(current.in, currentDepth + 1));
          break;

        case 'IN_RANGE':
          maxSubDepth = Math.max(
            traverse(current.date, currentDepth + 1),
            traverse(current.startDate, currentDepth + 1),
            traverse(current.endDate, currentDepth + 1)
          );
          break;

        case 'SUM':
        case 'COUNT':
          maxSubDepth = traverse(current.list, currentDepth + 1);
          break;

        case 'FILTER':
          maxSubDepth = Math.max(
            traverse(current.list, currentDepth + 1),
            traverse(current.predicate, currentDepth + 1)
          );
          break;

        case 'MAP':
          maxSubDepth = Math.max(
            traverse(current.list, currentDepth + 1),
            traverse(current.transform, currentDepth + 1)
          );
          break;

        case 'GROUP_BY':
          maxSubDepth = Math.max(
            traverse(current.list, currentDepth + 1),
            traverse(current.keySelector, currentDepth + 1)
          );
          break;

        default:
          errors.push(`Type de nœud AST inconnu ou non supporté : "${(current as any).type}".`);
      }

      return maxSubDepth;
    }

    const calculatedDepth = traverse(node, 1);

    return {
      isValid: errors.length === 0,
      depth: calculatedDepth,
      nodeCount: totalNodes,
      errors,
      referencedParameters: Array.from(referencedParams),
    };
  }
}
