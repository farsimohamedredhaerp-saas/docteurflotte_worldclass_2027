/**
 * Ontologie de l'Identité Juridique et Fiscale Algérienne
 * 
 * RÈGLE D'OR : Zéro constante chiffrée dans les types.
 * Les catégories sont des qualificatifs sémantiques purs ;
 * les taux applicables sont résolus au runtime dans le RegPack bitemporel actif.
 */

export type LegalPersonalityType = 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';

export type LegalFormAlgeria = 
  // Personne Physique
  | 'AUTO_ENTREPRENEUR'
  | 'ENTREPRISE_INDIVIDUELLE'
  | 'PROFESSION_LIBERALE'
  // Personne Morale
  | 'EURL'
  | 'SARL'
  | 'SPA'
  | 'SNC'
  | 'GIE'
  | 'EPIC';

export type TaxRegimeAlgeria = 
  | 'FORFAIT_AUTO_ENTREPRENEUR' // Statut ANAE (Loi 22-23)
  | 'IFU_FORFAITAIRE'           // Impôt Forfaitaire Unique (Art. 282 bis CIDTA)
  | 'REEL_SIMPLIFIE'            // Déclaration contrôlée pour professions libérales / BIC
  | 'REEL_NORMAL'               // Système Comptable Financier (SCF) complet
  | 'GRANDES_ENTREPRISES_DGE';  // Direction des Grandes Entreprises

/**
 * Catégories sémantiques pures pour la détermination du taux d'IBS.
 * Les taux (ex: 19%, 23%, 26%) sont résolus dynamiquement selon l'exercice fiscal.
 */
export type IbsSectorCategory = 
  | 'IBS_PRODUCTION'       // Production de biens (étendu à l'agroalimentaire et ENR en 2026)
  | 'IBS_BTPH_TOURISME'    // BTPH, tourisme et thermalisme
  | 'IBS_AUTRES';          // Négoce, distribution, prestations de services

export interface LegalIdentityProfile {
  readonly tenantId: string;
  readonly personalityType: LegalPersonalityType;
  readonly legalForm: LegalFormAlgeria;
  readonly taxRegime: TaxRegimeAlgeria;
  
  // Identifiants fiscaux et commerciaux algériens
  readonly identifiers: {
    readonly nif: string;              // Numéro d'Identification Fiscale (15 chiffres)
    readonly nis?: string;             // Numéro d'Identification Statistique
    readonly rcNumber: string;         // Registre du Commerce
    readonly articleImposition: string;// Article d'imposition (11 chiffres)
    readonly anaeCardNumber?: string;  // Numéro de carte Auto-Entrepreneur ANAE (si applicable)
  };

  // Qualification sociale (sans taux codés en dur)
  readonly socialRegime: {
    readonly hasCnasEmployees: boolean;
    readonly casnosAffiliationNumber?: string;
  };

  // Qualification fiscale et sectorielle
  readonly fiscalClassification: {
    readonly ibsCategory?: IbsSectorCategory;
    readonly isForeignContractorSubjectToWithholding: boolean; // Retenue à la source sous-traitance
    readonly hasStartupLabel?: boolean;                        // Label officiel pour exonération temporaire
    readonly sectorActivityCode?: string;                      // Code d'activité CNRC / NAA
  };
}
