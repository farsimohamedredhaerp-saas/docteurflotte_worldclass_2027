/**
 * Gestion du Temps Légal & Fuseau Algérie (Africa/Algiers — UTC+1)
 * 
 * RÈGLE 4 : Dates métier = dates locales Africa/Algiers.
 * INTERDIT : toISOString().slice(0,10) pour dériver un jour métier.
 * Exemple canonique : 23:30 UTC le 14/03 correspond au 15/03 à 00:30 en Algérie.
 */

export const ALGERIA_TIMEZONE = 'Africa/Algiers';

const algeriaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ALGERIA_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const algeriaDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ALGERIA_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export class AlgeriaCalendar {
  /**
   * Dérive la date locale algérienne (YYYY-MM-DD) depuis un timestamp UTC ou Date.
   * Conforme à la règle : 23:30 UTC le 14/03 -> 15/03 en Algérie.
   */
  static toLocalDate(dateOrIso: Date | string | number): string {
    const d = typeof dateOrIso === 'string' || typeof dateOrIso === 'number'
      ? new Date(dateOrIso)
      : dateOrIso;

    if (isNaN(d.getTime())) {
      throw new Error(`Horodatage invalide transmis pour conversion de date locale : "${dateOrIso}"`);
    }

    // en-CA produit le format standard ISO YYYY-MM-DD dans le fuseau spécifié
    return algeriaDateFormatter.format(d);
  }

  /**
   * Formate l'horodatage complet dans le fuseau algérien.
   */
  static toLocalDateTime(dateOrIso: Date | string | number): string {
    const d = typeof dateOrIso === 'string' || typeof dateOrIso === 'number'
      ? new Date(dateOrIso)
      : dateOrIso;

    if (isNaN(d.getTime())) {
      throw new Error(`Horodatage invalide transmis pour conversion locale : "${dateOrIso}"`);
    }

    return algeriaDateTimeFormatter.format(d);
  }

  /**
   * Nombre de jours calendaires entre deux dates YYYY-MM-DD.
   */
  static daysBetween(fromLocalDate: string, toLocalDate: string): number {
    const t1 = Date.parse(`${fromLocalDate}T00:00:00Z`);
    const t2 = Date.parse(`${toLocalDate}T00:00:00Z`);
    if (isNaN(t1) || isNaN(t2)) {
      throw new Error(`Format de date invalide pour calcul d'écart : "${fromLocalDate}" -> "${toLocalDate}"`);
    }
    const diffMs = t2 - t1;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Ajoute n jours calendaires à une date locale YYYY-MM-DD.
   */
  static addDays(localDate: string, days: number): string {
    const t = Date.parse(`${localDate}T00:00:00Z`);
    if (isNaN(t)) {
      throw new Error(`Format de date invalide : "${localDate}"`);
    }
    const result = new Date(t + days * 24 * 60 * 60 * 1000);
    return result.toISOString().slice(0, 10);
  }

  /**
   * Vérifie si une date locale est comprise dans un intervalle fermé [start, end].
   */
  static isDateInRange(targetLocalDate: string, startLocalDate: string, endLocalDate: string): boolean {
    return targetLocalDate >= startLocalDate && targetLocalDate <= endLocalDate;
  }
}

