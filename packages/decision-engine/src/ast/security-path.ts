/**
 * Résolution Sécurisée de Chemins d'Objets & Protection Anti-Pollution de Prototype
 * 
 * RÈGLE DE SÉCURITÉ ABSOLUE :
 * - Navigation par Object.hasOwn().
 * - Rejet strict avec exception de sécurité sur __proto__, constructor et prototype.
 * - Respect de la politique de variable manquante (FAIL ou NULL).
 */

import { MissingVariablePolicy } from './ast-types';

export class SecurityViolationError extends Error {
  constructor(message: string) {
    super(`[VIOLATION_SÉCURITÉ] ${message}`);
    this.name = 'SecurityViolationError';
  }
}

const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export function safeResolvePath(
  root: unknown,
  path: string,
  missingPolicy: MissingVariablePolicy = 'FAIL',
  fallback?: unknown
): unknown {
  if (!path || typeof path !== 'string') {
    throw new Error('Chemin de variable invalide ou non renseigné.');
  }

  const segments = path.split('.');
  let current: any = root;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Détection immédiate de tentative de pollution de prototype
    if (FORBIDDEN_SEGMENTS.has(segment)) {
      throw new SecurityViolationError(
        `Accès interdit à une propriété réservée ("${segment}") dans le chemin "${path}".`
      );
    }

    if (current === null || current === undefined || typeof current !== 'object') {
      if (fallback !== undefined) return fallback;
      if (missingPolicy === 'NULL') return null;
      throw new Error(`Chemin incomplet "${path}" : impossible d'accéder au segment "${segment}" sur ${typeof current}.`);
    }

    if (Object.hasOwn(current, segment)) {
      current = current[segment];
    } else {
      if (fallback !== undefined) return fallback;
      if (missingPolicy === 'NULL') return null;
      throw new Error(`Variable ou propriété introuvable : segment "${segment}" dans le chemin "${path}".`);
    }
  }

  return current;
}

