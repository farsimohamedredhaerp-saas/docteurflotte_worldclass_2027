export type FeedbackVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * Styles de conteneur d'alerte / notification compatibles Thème Clair & Sombre
 */
export function feedbackContainerStyles(variant: FeedbackVariant): string {
  switch (variant) {
    case 'success':
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200';
    case 'warning':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200';
    case 'error':
      return 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200';
    case 'info':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200';
    case 'neutral':
    default:
      return 'bg-slate-500/10 border-slate-500/30 text-slate-800 dark:text-slate-200';
  }
}

/**
 * Styles d'icônes pour statuts sémantiques
 */
export function feedbackIconStyles(variant: FeedbackVariant): string {
  switch (variant) {
    case 'success':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'warning':
      return 'text-amber-600 dark:text-amber-400';
    case 'error':
      return 'text-rose-600 dark:text-rose-400';
    case 'info':
      return 'text-blue-600 dark:text-blue-400';
    case 'neutral':
    default:
      return 'text-slate-500 dark:text-slate-400';
  }
}

/**
 * Styles de pilules / badges de statut haute lisibilité
 */
export function feedbackBadgeStyles(variant: FeedbackVariant): string {
  switch (variant) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
    case 'error':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
    case 'info':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
    case 'neutral':
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800';
  }
}

