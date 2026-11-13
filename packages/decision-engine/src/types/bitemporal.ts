/**
 * Coordonnées Bi-temporelles et Résolution Historique
 * 
 * RÈGLE 2 : Bi-temporalité stricte.
 * - valid_from / valid_to : date d'effet légale (temps des événements dans le monde réel)
 * - recorded_at / superseded_at : date de connaissance dans le système (temps transactionnel)
 */

export interface BiTemporalCoordinates {
  /** Date d'effet légale de début (YYYY-MM-DD, fuseau Africa/Algiers) */
  validFrom: string;
  /** Date d'effet légale de fin (YYYY-MM-DD, fuseau Africa/Algiers) ou null si actif indéfiniment */
  validTo: string | null;
  /** Horodatage UTC auquel cette version est devenue connue du système */
  recordedAt: string;
  /** Horodatage UTC auquel cette version a été remplacée/corrigée ou null si version courante */
  supersededAt: string | null;
}

export interface BiTemporalQuery {
  /** Date d'effet légale de l'opération (temps métier, YYYY-MM-DD) */
  asOf: string;
  /** Date de connaissance du système (temps d'audit, ISO 8601 UTC) */
  knownAt: string;
}

export interface VersionedEntity<T> extends BiTemporalCoordinates {
  id: string;
  data: T;
  contentHash: string;
}

/**
 * Prédicat pur vérifiant si un enregistrement bi-temporel est visible à la coordonnée de requête.
 */
export function isBiTemporallyActive(
  record: BiTemporalCoordinates,
  query: BiTemporalQuery
): boolean {
  // 1. Validité système (Connaissance à la date knownAt)
  const isKnown = record.recordedAt <= query.knownAt;
  const isNotSuperseded = record.supersededAt === null || record.supersededAt > query.knownAt;
  if (!isKnown || !isNotSuperseded) {
    return false;
  }

  // 2. Validité légale (Effet à la date asOf)
  const isAfterValidFrom = record.validFrom <= query.asOf;
  const isBeforeValidTo = record.validTo === null || record.validTo > query.asOf;
  return isAfterValidFrom && isBeforeValidTo;
}

