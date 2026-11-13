/**
 * Sérialisation JSON Canonique conforme à la RFC 8785 (JSON Canonicalization Scheme - JCS)
 * 
 * Permet un hachage cryptographique et une signature numérique déterministes
 * quel que soit l'ordre d'insertion des propriétés dans les objets.
 */

export function canonicalizeJson(obj: unknown): string {
  if (obj === null) {
    return 'null';
  }

  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }

  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      throw new Error(`Valeur numérique non représentable en JSON canonique : ${obj}`);
    }
    // RFC 8785 : -0 est sérialisé comme 0
    if (Object.is(obj, -0)) {
      return '0';
    }
    return JSON.stringify(obj);
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const elements = obj.map((item) => {
      const serialized = canonicalizeJson(item);
      return serialized === undefined ? 'null' : serialized;
    });
    return `[${elements.join(',')}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>).sort((a, b) => {
      // Tri par unités de code UTF-16 conforme à la RFC 8785
      return a < b ? -1 : a > b ? 1 : 0;
    });

    const entries: string[] = [];
    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key];
      // Ignorer les valeurs undefined (non sérialisables en JSON)
      if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
        const serializedVal = canonicalizeJson(val);
        if (serializedVal !== undefined) {
          entries.push(`${JSON.stringify(key)}:${serializedVal}`);
        }
      }
    }
    return `{${entries.join(',')}}`;
  }

  return undefined as unknown as string;
}

export const canonicalJson = canonicalizeJson;


