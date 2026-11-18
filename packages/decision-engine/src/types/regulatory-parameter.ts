/**
 * Modèle Universel des Paramètres Réglementaires & Métiers (Control Plane)
 * 
 * RÈGLE D'OR : Le code est un interpréteur sémantique pur.
 * Toutes les valeurs fiscales, sociales et économiques sont des données
 * bitemporelles administrables par le SuperAdmin et résolues au runtime.
 */

export type RegulatoryParameterType =
  | 'TAUX'            // Ratio décimal (ex: "0.19", "0.005", "0.345")
  | 'MONTANT_DZD'     // Montant absolu en dinars algériens (ex: "30000", "10000")
  | 'SEUIL_DZD'       // Seuil de déclenchement ou plafond (ex: "8000000", "1000000")
  | 'TRANCHE'         // Élément constitutif d'un barème progressif (IRG, Timbre)
  | 'FORFAIT'         // Montant forfaitaire unitaire
  | 'CODE'            // Valeur de bascule ou catégorie sémantique
  | 'LISTE_SECTEURS'; // Tableau JSON de codes CNRC/NAA éligibles (ex: TVA 9%)

export type ParameterUnit =
  | 'DZD'
  | 'POURCENT'
  | 'DZD_PAR_JOUR'
  | 'ANNEES'
  | 'MOIS'
  | 'RATIO';

export interface TrancheDefinition {
  readonly trancheIndex: number;
  readonly minAmountDzd: string;
  readonly maxAmountDzd: string | null; // null = pas de plafond supérieur
  readonly rateOrDuty: string;          // Pourcentage (ex: "0.23") ou montant unitaire (ex: "1.5")
  readonly calculationType: 'POURCENTAGE' | 'MONTANT_PAR_TRANCHE_100_DA';
}

export interface RegulatoryParameterItemPayload {
  readonly parameterKey: string;
  readonly parameterGroup?: string;
  readonly type: RegulatoryParameterType;
  readonly value: string; // Pour les tranches ou listes, chaîne JSON sérialisée
  readonly unit?: ParameterUnit;
  readonly labelFr: string;
  readonly descriptionFr?: string;
  readonly tranches?: TrancheDefinition[];
  readonly sectorCodes?: string[];
}

export interface RegulatoryParameter {
  readonly parameterKey: string;
  readonly parameterGroup?: string;
  readonly labelFr: string;
  readonly type: RegulatoryParameterType;
  readonly value: string;
  readonly unit?: ParameterUnit;
  readonly tranches?: TrancheDefinition[];
  readonly sectorCodes?: string[];
  
  // Coordonnées Bi-temporelles strictes
  readonly applicableFrom: string;         // Date d'effet juridique (valid_from)
  readonly applicableTo: string | null;    // null = en vigueur
  readonly recordedAt: string;             // Date d'enregistrement dans le système
  readonly supersededAt: string | null;    // Date de remplacement par une nouvelle version
  
  // Opposabilité & Source juridique
  readonly legalReference: string;         // Ex: "Art. 282 quater CIDTA, LF 2025"
  readonly joradpCitation?: string;        // Ex: "JORADP N° 86 du 31/12/2025"
  readonly sourceHash: string;             // SHA-256 du texte officiel
  readonly previousParameterHash?: string; // Chaînage d'audit
  readonly packId: string;                 // Identifiant du Pack (ex: "DZ_LF_2026_OFFICIAL")
}

/**
 * Paramètre Métier (Niveau 2)
 * Valeurs opérationnelles avec bornes [Min, Max] contrôlées par le SuperAdmin
 * et personnalisables par le Tenant dans sa plage autorisée.
 */
export interface BusinessParameterDefinition {
  readonly parameterKey: string;
  readonly labelFr: string;
  readonly defaultUniversalValue: string;
  readonly unit: ParameterUnit;
  readonly allowedRange: {
    readonly minAllowed: string;
    readonly maxAllowed: string;
  };
  readonly tenantOverridable: boolean;
  readonly descriptionFr?: string;
}
