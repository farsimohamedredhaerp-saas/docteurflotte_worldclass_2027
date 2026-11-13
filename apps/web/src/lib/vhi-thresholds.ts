import {
  VhiThresholds,
  VhiThresholdTier,
  DEFAULT_VHI_THRESHOLDS,
} from '@docteurflotte/contracts';

/**
 * Retourne le palier VHI correspondant au score donné.
 */
export function getVhiTier(
  score: number,
  thresholds: VhiThresholds = DEFAULT_VHI_THRESHOLDS
): VhiThresholdTier {
  const sortedTiers = [...thresholds.tiers].sort((a, b) => b.minScore - a.minScore);
  for (const tier of sortedTiers) {
    if (score >= tier.minScore) {
      return tier;
    }
  }
  return sortedTiers[sortedTiers.length - 1];
}

/**
 * Retourne la couleur hexadécimale associée au score VHI.
 */
export function getVhiColor(
  score: number,
  thresholds: VhiThresholds = DEFAULT_VHI_THRESHOLDS
): string {
  if (score >= thresholds.healthyMin) {
    return '#10b981'; // Vert succès / santé
  }
  if (score >= thresholds.warningMin) {
    return '#f59e0b'; // Ambre vigilance
  }
  return '#ef4444'; // Rouge critique
}

/**
 * Retourne la clé de traduction du statut de santé VHI.
 */
export function getVhiStatusLabelKey(
  score: number,
  thresholds: VhiThresholds = DEFAULT_VHI_THRESHOLDS
): string {
  const tier = getVhiTier(score, thresholds);
  return tier.statusKey;
}

