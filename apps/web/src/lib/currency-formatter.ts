/**
 * Utilitaires de formatage monétaire et numérique configurables
 * Aucune locale ou devise n'est codée en dur.
 */

export function formatCurrency(
  amount: number,
  currency: string = 'DZD',
  locale: string = 'fr-DZ'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Si la locale ou devise n'est pas reconnue par le runtime
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatNumber(
  value: number,
  locale: string = 'fr-DZ',
  maxDecimals: number = 0
): string {
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: maxDecimals,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

