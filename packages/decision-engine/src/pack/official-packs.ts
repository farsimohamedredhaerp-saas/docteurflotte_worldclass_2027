/**
 * Référentiel des Packs Réglementaires Officiels Algériens (LF 2025, LF 2026, PLF 2027)
 * et Pack Métier des Barèmes Opérationnels (Niveau 2).
 * 
 * RÈGLE D'OR : Zéro constante chiffrée dans le code applicatif.
 * Toutes les valeurs proviennent des packs bitemporels officiels.
 */

import {
  EvidenceLevel,
  RegPackItemKind,
  RegPackStatus,
  VerificationStatus,
} from '../types/ontology';
import {
  BusinessParameterDefinition,
  RegulatoryParameterItemPayload,
} from '../types/regulatory-parameter';
import { RegPackDefinition, RegPackItemDefinition } from './reg-pack';

/**
 * Barème annuel IRG (Art. 104 CIDTA) — 6 Tranches progressives
 */
export const IRG_BAREME_ANNUEL_TRANCHES = [
  { trancheIndex: 1, minAmountDzd: '0', maxAmountDzd: '240000', rateOrDuty: '0.00', calculationType: 'POURCENTAGE' as const },
  { trancheIndex: 2, minAmountDzd: '240001', maxAmountDzd: '480000', rateOrDuty: '0.23', calculationType: 'POURCENTAGE' as const },
  { trancheIndex: 3, minAmountDzd: '480001', maxAmountDzd: '960000', rateOrDuty: '0.27', calculationType: 'POURCENTAGE' as const },
  { trancheIndex: 4, minAmountDzd: '960001', maxAmountDzd: '1920000', rateOrDuty: '0.30', calculationType: 'POURCENTAGE' as const },
  { trancheIndex: 5, minAmountDzd: '1920001', maxAmountDzd: '3840000', rateOrDuty: '0.33', calculationType: 'POURCENTAGE' as const },
  { trancheIndex: 6, minAmountDzd: '3840001', maxAmountDzd: null, rateOrDuty: '0.35', calculationType: 'POURCENTAGE' as const },
];

/**
 * Barème des droits de timbre pour règlements en espèces (Code du timbre / LF)
 */
export const TIMBRE_ESPECES_BAREME_TRANCHES = [
  { trancheIndex: 1, minAmountDzd: '0', maxAmountDzd: '30000', rateOrDuty: '1.0', calculationType: 'MONTANT_PAR_TRANCHE_100_DA' as const },
  { trancheIndex: 2, minAmountDzd: '30001', maxAmountDzd: '100000', rateOrDuty: '1.5', calculationType: 'MONTANT_PAR_TRANCHE_100_DA' as const },
  { trancheIndex: 3, minAmountDzd: '100001', maxAmountDzd: null, rateOrDuty: '2.0', calculationType: 'MONTANT_PAR_TRANCHE_100_DA' as const },
];

function createParamItem(
  code: string,
  validFrom: string,
  validTo: string | null,
  recordedAt: string,
  legalRef: string,
  payload: RegulatoryParameterItemPayload,
  sourceHierarchy: 'LF' | 'LFC' | 'DECRET' | 'ARRETE' = 'LF'
): RegPackItemDefinition {
  return {
    code,
    kind: RegPackItemKind.PARAMETER,
    sourceHierarchy,
    validFrom,
    validTo,
    recordedAt,
    supersededAt: null,
    legalRef,
    legalBasisVerified: true,
    verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
    evidenceLevel: EvidenceLevel.LEGAL_TEXT,
    descriptionFr: payload.labelFr,
    payload: {
      ...payload,
      value: payload.value,
    },
  };
}

/**
 * Pack Officiel Exercice 2025 (Loi de Finances 2025)
 */
export const DZ_LF_2025_OFFICIAL: RegPackDefinition = {
  packCode: 'DZ_LF_2025_OFFICIAL',
  version: '2025.1.0',
  descriptionFr: 'Pack Réglementaire Officiel Algérie — Exercice 2025 (Loi de Finances 2025)',
  status: RegPackStatus.PUBLISHED,
  authorEmail: 'compliance@docteurflotte.dz',
  publishedByEmail: 'superadmin@docteurflotte.dz',
  validatedByExpert: 'Conseil de l\'Ordre des Experts Comptables (CNC / DGI)',
  createdAt: '2024-12-31T00:00:00.000Z',
  publishedAt: '2024-12-31T23:59:59.000Z',
  items: [
    // IFU & Auto-Entrepreneur
    createParamItem('AE_CA_PLAFOND', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Loi 22-23 & LF 2023 art. 51', {
      parameterKey: 'AE_CA_PLAFOND',
      type: 'SEUIL_DZD',
      value: '5000000',
      unit: 'DZD',
      labelFr: 'Plafond de chiffre d\'affaires annuel auto-entrepreneur (ANAE)',
    }),
    createParamItem('IFU_CA_PLAFOND_GENERAL', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 282 ter CIDTA', {
      parameterKey: 'IFU_CA_PLAFOND_GENERAL',
      type: 'SEUIL_DZD',
      value: '8000000',
      unit: 'DZD',
      labelFr: 'Plafond général de chiffre d\'affaires éligible à l\'IFU',
    }),
    createParamItem('IFU_TAUX_AUTO_ENTREPRENEUR', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 282 sexies CIDTA', {
      parameterKey: 'IFU_TAUX_AUTO_ENTREPRENEUR',
      type: 'TAUX',
      value: '0.005',
      unit: 'RATIO',
      labelFr: 'Taux forfaitaire unique libératoire auto-entrepreneur (0.5%)',
    }),
    createParamItem('IFU_TAUX_PRODUCTION_VENTE', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 282 bis CIDTA', {
      parameterKey: 'IFU_TAUX_PRODUCTION_VENTE',
      type: 'TAUX',
      value: '0.05',
      unit: 'RATIO',
      labelFr: 'Taux IFU activités de production et vente de biens (5%)',
    }),
    createParamItem('IFU_TAUX_SERVICES', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 282 bis CIDTA', {
      parameterKey: 'IFU_TAUX_SERVICES',
      type: 'TAUX',
      value: '0.12',
      unit: 'RATIO',
      labelFr: 'Taux IFU prestations de services et travaux (12%)',
    }),
    createParamItem('IFU_MINIMUM_AUTO_ENTREPRENEUR', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Décret 23-197', {
      parameterKey: 'IFU_MINIMUM_AUTO_ENTREPRENEUR',
      type: 'MONTANT_DZD',
      value: '10000',
      unit: 'DZD',
      labelFr: 'Minimum fiscal annuel auto-entrepreneur',
    }),
    createParamItem('IFU_MINIMUM_GENERAL', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 282 quater CIDTA, LF 2025', {
      parameterKey: 'IFU_MINIMUM_GENERAL',
      type: 'MONTANT_DZD',
      value: '30000',
      unit: 'DZD',
      labelFr: 'Minimum fiscal annuel régime IFU ordinaire (relevé à 30 000 DA en LF 2025)',
    }),

    // IBS (Impôt sur les Bénéfices des Sociétés)
    createParamItem('IBS_TAUX_PRODUCTION', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 150 CIDTA', {
      parameterKey: 'IBS_TAUX_PRODUCTION',
      type: 'TAUX',
      value: '0.19',
      unit: 'RATIO',
      labelFr: 'Taux IBS activités de production de biens (19%)',
    }),
    createParamItem('IBS_TAUX_BTPH_TOURISME', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 150 CIDTA', {
      parameterKey: 'IBS_TAUX_BTPH_TOURISME',
      type: 'TAUX',
      value: '0.23',
      unit: 'RATIO',
      labelFr: 'Taux IBS BTPH, tourisme et thermalisme (23%)',
    }),
    createParamItem('IBS_TAUX_AUTRES', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 150 CIDTA', {
      parameterKey: 'IBS_TAUX_AUTRES',
      type: 'TAUX',
      value: '0.26',
      unit: 'RATIO',
      labelFr: 'Taux IBS négoce, distribution et prestations de services (26%)',
    }),
    createParamItem('IBS_TAUX_REINVESTI', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 142 bis CIDTA', {
      parameterKey: 'IBS_TAUX_REINVESTI',
      type: 'TAUX',
      value: '0.10',
      unit: 'RATIO',
      labelFr: 'Taux réduit IBS pour bénéfices réinvestis (10%)',
    }),

    // TVA (Taxe sur la Valeur Ajoutée)
    createParamItem('TVA_TAUX_NORMAL', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 21 TCA', {
      parameterKey: 'TVA_TAUX_NORMAL',
      type: 'TAUX',
      value: '0.19',
      unit: 'RATIO',
      labelFr: 'Taux normal de TVA (19%)',
    }),
    createParamItem('TVA_TAUX_REDUIT', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 23 TCA', {
      parameterKey: 'TVA_TAUX_REDUIT',
      type: 'TAUX',
      value: '0.09',
      unit: 'RATIO',
      labelFr: 'Taux réduit de TVA (9%)',
    }),

    // Sécurité Sociale (CNAS / CASNOS)
    createParamItem('CNAS_TAUX_GLOBAL', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Loi 83-14 & barèmes CLEISS/CNAS', {
      parameterKey: 'CNAS_TAUX_GLOBAL',
      type: 'TAUX',
      value: '0.345',
      unit: 'RATIO',
      labelFr: 'Taux global de cotisation sécurité sociale salariés CNAS (34.5%)',
    }),
    createParamItem('CNAS_PART_EMPLOYEUR', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Loi 83-14 (dont 0.5% œuvres sociales)', {
      parameterKey: 'CNAS_PART_EMPLOYEUR',
      type: 'TAUX',
      value: '0.255',
      unit: 'RATIO',
      labelFr: 'Part patronale CNAS employeur (25.5%)',
    }),
    createParamItem('CNAS_PART_SALARIE', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Loi 83-14 (retraite & assurances sociales)', {
      parameterKey: 'CNAS_PART_SALARIE',
      type: 'TAUX',
      value: '0.090',
      unit: 'RATIO',
      labelFr: 'Part salariale retenue à la source CNAS (9.0%)',
    }),
    createParamItem('CASNOS_TAUX_GLOBAL', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Décret exécutif 15-289', {
      parameterKey: 'CASNOS_TAUX_GLOBAL',
      type: 'TAUX',
      value: '0.15',
      unit: 'RATIO',
      labelFr: 'Taux de cotisation CASNOS non-salariés (15%)',
    }),
    createParamItem('CASNOS_ASSIETTE_MINIMALE', '2025-01-01', '2025-12-31', '2024-12-31T00:00:00.000Z', 'Décret exécutif 15-289', {
      parameterKey: 'CASNOS_ASSIETTE_MINIMALE',
      type: 'MONTANT_DZD',
      value: '240000',
      unit: 'DZD',
      labelFr: 'Assiette minimale annuelle CASNOS 2025',
    }),
    createParamItem('CASNOS_COTISATION_MINIMALE', '2025-01-01', '2025-12-31', '2024-12-31T00:00:00.000Z', 'Décret exécutif 15-289', {
      parameterKey: 'CASNOS_COTISATION_MINIMALE',
      type: 'MONTANT_DZD',
      value: '36000',
      unit: 'DZD',
      labelFr: 'Cotisation minimale annuelle CASNOS 2025 (15% de 240 000 DA)',
    }),
    createParamItem('CASNOS_FORFAIT_ANAE', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Décret 23-197', {
      parameterKey: 'CASNOS_FORFAIT_ANAE',
      type: 'MONTANT_DZD',
      value: '24000',
      unit: 'DZD',
      labelFr: 'Cotisation forfaitaire annuelle CASNOS auto-entrepreneur',
    }),

    // Seuils légaux DGI / CPF
    createParamItem('CASH_PAYMENT_LIMIT_DZD', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 64 Code des Procédures Fiscales', {
      parameterKey: 'CASH_PAYMENT_LIMIT_DZD',
      type: 'SEUIL_DZD',
      value: '1000000',
      unit: 'DZD',
      labelFr: 'Seuil maximal de paiement en espèces avant rejet fiscal de charge et TVA (1 000 000 DA)',
    }),
    createParamItem('VP_AMORTISSEMENT_PLAFOND', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 141-2 CIDTA', {
      parameterKey: 'VP_AMORTISSEMENT_PLAFOND',
      type: 'SEUIL_DZD',
      value: '3000000',
      unit: 'DZD',
      labelFr: 'Plafond fiscal de déductibilité de l\'amortissement des véhicules de tourisme (3 000 000 DA)',
    }),

    // Barèmes progressifs
    createParamItem('IRG_BAREME_ANNUEL', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Art. 104 CIDTA', {
      parameterKey: 'IRG_BAREME_ANNUEL',
      parameterGroup: 'IRG_BAREME_ANNUEL',
      type: 'TRANCHE',
      value: JSON.stringify(IRG_BAREME_ANNUEL_TRANCHES),
      tranches: IRG_BAREME_ANNUEL_TRANCHES,
      labelFr: 'Barème progressif annuel de l\'IRG (6 tranches)',
    }),
    createParamItem('TIMBRE_ESPECES_BAREME', '2025-01-01', null, '2024-12-31T00:00:00.000Z', 'Code du timbre consolidé', {
      parameterKey: 'TIMBRE_ESPECES_BAREME',
      parameterGroup: 'TIMBRE_ESPECES_BAREME',
      type: 'TRANCHE',
      value: JSON.stringify(TIMBRE_ESPECES_BAREME_TRANCHES),
      tranches: TIMBRE_ESPECES_BAREME_TRANCHES,
      labelFr: 'Barème progressif des droits de timbre pour règlements espèces',
    }),
  ],
};

/**
 * Pack Officiel Exercice 2026 (Loi de Finances 2026)
 * Intègre les évolutions sectorielles IBS, startups, TFPC/TAPP semestrielles, R&D et prix de transfert.
 */
export const DZ_LF_2026_OFFICIAL: RegPackDefinition = {
  packCode: 'DZ_LF_2026_OFFICIAL',
  version: '2026.1.0',
  descriptionFr: 'Pack Réglementaire Officiel Algérie — Exercice 2026 (Loi de Finances 2026)',
  status: RegPackStatus.PUBLISHED,
  authorEmail: 'compliance@docteurflotte.dz',
  publishedByEmail: 'superadmin@docteurflotte.dz',
  validatedByExpert: 'Conseil National de la Fiscalité & JORADP 2026',
  createdAt: '2025-12-31T00:00:00.000Z',
  publishedAt: '2025-12-31T23:59:59.000Z',
  items: [
    // Revalorisation CASNOS 2026
    createParamItem('CASNOS_ASSIETTE_MINIMALE', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'Décret exécutif revalorisation SNMG 2026', {
      parameterKey: 'CASNOS_ASSIETTE_MINIMALE',
      type: 'MONTANT_DZD',
      value: '288000',
      unit: 'DZD',
      labelFr: 'Assiette minimale annuelle CASNOS 2026 indexée au SNMG',
    }),
    createParamItem('CASNOS_COTISATION_MINIMALE', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'Décret exécutif revalorisation SNMG 2026', {
      parameterKey: 'CASNOS_COTISATION_MINIMALE',
      type: 'MONTANT_DZD',
      value: '43200',
      unit: 'DZD',
      labelFr: 'Cotisation minimale annuelle CASNOS 2026 (15% de 288 000 DA)',
    }),

    // Dispositifs d'incitation & Nouveautés LF 2026
    createParamItem('STARTUP_EXONERATION_DUREE_INITIALE_ANNEES', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026, art. 100-101', {
      parameterKey: 'STARTUP_EXONERATION_DUREE_INITIALE_ANNEES',
      type: 'MONTANT_DZD',
      value: '4',
      unit: 'ANNEES',
      labelFr: 'Durée d\'exonération fiscale initiale des startups labellisées (4 ans)',
    }),
    createParamItem('STARTUP_EXONERATION_PROLONGATION_ANNEES', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026, art. 100-101', {
      parameterKey: 'STARTUP_EXONERATION_PROLONGATION_ANNEES',
      type: 'MONTANT_DZD',
      value: '2',
      unit: 'ANNEES',
      labelFr: 'Prolongation de l\'exonération en cas de renouvellement de label (+2 ans, total 6 ans)',
    }),
    createParamItem('TFPC_TAUX_SEMESTRIEL', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026, art. 18-21', {
      parameterKey: 'TFPC_TAUX_SEMESTRIEL',
      type: 'TAUX',
      value: '0.01',
      unit: 'RATIO',
      labelFr: 'Taxe de formation professionnelle continue (TFPC) semestrielle (1%)',
    }),
    createParamItem('TAPP_TAUX_SEMESTRIEL', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026, art. 18-21', {
      parameterKey: 'TAPP_TAUX_SEMESTRIEL',
      type: 'TAUX',
      value: '0.01',
      unit: 'RATIO',
      labelFr: 'Taxe d\'apprentissage (TAPP) semestrielle (1%)',
    }),
    createParamItem('CREDIT_IMPOT_RD_TAUX', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026', {
      parameterKey: 'CREDIT_IMPOT_RD_TAUX',
      type: 'TAUX',
      value: '0.35',
      unit: 'RATIO',
      labelFr: 'Taux du crédit d\'impôt pour recherche et développement (relevé de 30% à 35%)',
    }),
    createParamItem('PRIX_TRANSFERT_SEUIL_CA', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026', {
      parameterKey: 'PRIX_TRANSFERT_SEUIL_CA',
      type: 'SEUIL_DZD',
      value: '2000000000',
      unit: 'DZD',
      labelFr: 'Seuil de chiffre d\'affaires consolidé déclenchant la documentation obligatoire des prix de transfert (2 Mds DA)',
    }),
    createParamItem('PRIX_TRANSFERT_PENALITE', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026', {
      parameterKey: 'PRIX_TRANSFERT_PENALITE',
      type: 'MONTANT_DZD',
      value: '2500000',
      unit: 'DZD',
      labelFr: 'Pénalité forfaitaire pour défaut de documentation des prix de transfert (2 500 000 DA)',
    }),
    createParamItem('IBS_SECTEURS_ELIGIBLES_TAUX_PRODUCTION', '2026-01-01', null, '2025-12-31T00:00:00.000Z', 'LF 2026', {
      parameterKey: 'IBS_SECTEURS_ELIGIBLES_TAUX_PRODUCTION',
      type: 'LISTE_SECTEURS',
      value: JSON.stringify(['TRANSFORMATION_AGROALIMENTAIRE', 'ENERGIES_RENOUVELABLES']),
      sectorCodes: ['TRANSFORMATION_AGROALIMENTAIRE', 'ENERGIES_RENOUVELABLES'],
      labelFr: 'Secteurs d\'activité supplémentaires éligibles au taux IBS de 19% (LF 2026)',
    }),
  ],
};

/**
 * Pack Brouillon Exercice 2027 (Projet de Loi de Finances 2027)
 * Permet les simulations prospectives sans impacter la production.
 */
export const DZ_LF_2027_DRAFT: RegPackDefinition = {
  packCode: 'DZ_LF_2027_DRAFT',
  version: '2027.0.1-draft',
  descriptionFr: 'Pack Réglementaire Prospectif — Exercice 2027 (Projet de Loi de Finances 2027)',
  status: RegPackStatus.DRAFT,
  authorEmail: 'compliance@docteurflotte.dz',
  createdAt: '2026-10-01T00:00:00.000Z',
  items: [
    createParamItem('FACTURATION_ELECTRONIQUE_OBLIGATOIRE_PME', '2027-01-01', null, '2026-10-01T00:00:00.000Z', 'Projet LF 2027 / DGI', {
      parameterKey: 'FACTURATION_ELECTRONIQUE_OBLIGATOIRE_PME',
      type: 'CODE',
      value: 'true',
      labelFr: 'Généralisation de la facturation électronique obligatoire pour les PME au 01/01/2027',
    }),
  ],
};

/**
 * Pack Métier : Barèmes Opérationnels Flotte & Ateliers (Niveau 2)
 * Administré par le SuperAdmin avec plages de tolérance [Min, Max]
 * et personnalisable par le Tenant dans sa plage autorisée.
 */
export const DZ_BUSINESS_DEFAULTS_PACK: Record<string, BusinessParameterDefinition> = {
  FLEET_TOWING_FORFAIT_SUD_DZD: {
    parameterKey: 'FLEET_TOWING_FORFAIT_SUD_DZD',
    labelFr: 'Forfait de remorquage lourd - Wilayas du Sud / Sahara',
    defaultUniversalValue: '75000',
    unit: 'DZD',
    allowedRange: {
      minAllowed: '50000',
      maxAllowed: '120000',
    },
    tenantOverridable: true,
    descriptionFr: 'Forfait de dépannage/remorquage désertique (Ouargla, Tamanrasset, In Salah, Illizi, etc.)',
  },
  FLEET_TOWING_FORFAIT_NORD_DZD: {
    parameterKey: 'FLEET_TOWING_FORFAIT_NORD_DZD',
    labelFr: 'Forfait de remorquage lourd - Wilayas du Nord / Tell',
    defaultUniversalValue: '35000',
    unit: 'DZD',
    allowedRange: {
      minAllowed: '20000',
      maxAllowed: '60000',
    },
    tenantOverridable: true,
    descriptionFr: 'Forfait de dépannage autoroutier et tellien (A1 Est-Ouest, Gorges de la Chiffa, etc.)',
  },
  FLEET_DOWNTIME_DAILY_COST_DZD: {
    parameterKey: 'FLEET_DOWNTIME_DAILY_COST_DZD',
    labelFr: 'Coût journalier moyen d\'immobilisation d\'un actif logistique',
    defaultUniversalValue: '25000',
    unit: 'DZD_PAR_JOUR',
    allowedRange: {
      minAllowed: '10000',
      maxAllowed: '60000',
    },
    tenantOverridable: true,
    descriptionFr: 'Perte d\'exploitation journalière en cas de panne mécanique non anticipée',
  },
};

