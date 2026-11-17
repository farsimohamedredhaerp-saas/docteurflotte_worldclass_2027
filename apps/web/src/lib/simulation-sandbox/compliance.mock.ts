export interface EnactaRecord {
  id: string;
  registrationNumber: string;
  makeModel: string;
  category: 'PL' | 'BTP' | 'VL';
  lastInspectionDate: string;
  expiryDate: string;
  daysRemaining: number;
  centerName: string;
  wilaya: string;
  status: 'VALID' | 'WARNING' | 'EXPIRED';
  defectCount: number;
}

export interface InsuranceRecord {
  id: string;
  registrationNumber: string;
  makeModel: string;
  insurer: 'SAA' | 'CAAT' | 'CASH' | 'MACIR_VIE' | 'ALLIANCE';
  policyNumber: string;
  expiryDate: string;
  daysRemaining: number;
  coverageType: 'TOUS_RISQUES' | 'TIERS_COLLISION' | 'RESPONSABILITE_CIVILE';
  status: 'VALID' | 'WARNING' | 'EXPIRED';
}

export const MOCK_SANDBOX_ENACTA: EnactaRecord[] = [
  {
    id: 'EN-01',
    registrationNumber: '00421-116-16',
    makeModel: 'Renault Trucks K 480',
    category: 'PL',
    lastInspectionDate: '2025-10-14',
    expiryDate: '2026-04-14',
    daysRemaining: 168,
    centerName: 'Centre ENACTA Rouiba (16)',
    wilaya: 'Alger (16)',
    status: 'VALID',
    defectCount: 0,
  },
  {
    id: 'EN-02',
    registrationNumber: '01892-116-16',
    makeModel: 'Mercedes-Benz Actros 3340',
    category: 'PL',
    lastInspectionDate: '2025-05-12',
    expiryDate: '2025-11-12',
    daysRemaining: 15,
    centerName: 'Centre ENACTA Bab Ezzouar',
    wilaya: 'Alger (16)',
    status: 'WARNING',
    defectCount: 1,
  },
  {
    id: 'EN-03',
    registrationNumber: '08341-118-30',
    makeModel: 'Shacman F3000 Benne',
    category: 'PL',
    lastInspectionDate: '2025-03-20',
    expiryDate: '2025-09-20',
    daysRemaining: -38,
    centerName: 'Centre ENACTA Hassi Messaoud',
    wilaya: 'Ouargla (30)',
    status: 'EXPIRED',
    defectCount: 3,
  },
  {
    id: 'EN-04',
    registrationNumber: 'ENG-23-018-DZ',
    makeModel: 'Caterpillar 320D (Pelle)',
    category: 'BTP',
    lastInspectionDate: '2025-07-15',
    expiryDate: '2026-07-15',
    daysRemaining: 260,
    centerName: 'Inspection Conformité Chantier',
    wilaya: 'Annaba (23)',
    status: 'VALID',
    defectCount: 0,
  },
  {
    id: 'EN-05',
    registrationNumber: '00912-120-31',
    makeModel: 'Toyota Hilux 2.4 D-4D',
    category: 'VL',
    lastInspectionDate: '2025-01-10',
    expiryDate: '2026-01-10',
    daysRemaining: 74,
    centerName: 'Centre ENACTA Es Senia',
    wilaya: 'Oran (31)',
    status: 'VALID',
    defectCount: 0,
  },
];

export const MOCK_SANDBOX_INSURANCE: InsuranceRecord[] = [
  {
    id: 'INS-01',
    registrationNumber: '00421-116-16',
    makeModel: 'Renault Trucks K 480',
    insurer: 'CAAT',
    policyNumber: 'CAAT-FLT-2026-00481',
    expiryDate: '2026-12-31',
    daysRemaining: 429,
    coverageType: 'TOUS_RISQUES',
    status: 'VALID',
  },
  {
    id: 'INS-02',
    registrationNumber: '01892-116-16',
    makeModel: 'Mercedes-Benz Actros 3340',
    insurer: 'SAA',
    policyNumber: 'SAA-EXP-889102-DZ',
    expiryDate: '2025-11-20',
    daysRemaining: 23,
    coverageType: 'TOUS_RISQUES',
    status: 'WARNING',
  },
  {
    id: 'INS-03',
    registrationNumber: '08341-118-30',
    makeModel: 'Shacman F3000 Benne',
    insurer: 'CASH',
    policyNumber: 'CASH-CORP-992314-HMD',
    expiryDate: '2026-06-30',
    daysRemaining: 245,
    coverageType: 'TIERS_COLLISION',
    status: 'VALID',
  },
  {
    id: 'INS-04',
    registrationNumber: '00912-120-31',
    makeModel: 'Toyota Hilux 2.4 D-4D',
    insurer: 'MACIR_VIE',
    policyNumber: 'MACIR-FLT-110294-ORN',
    expiryDate: '2025-11-05',
    daysRemaining: 8,
    coverageType: 'TOUS_RISQUES',
    status: 'WARNING',
  },
];

export const MOCK_SANDBOX_E_INVOICING_REPORT = {
  tenantId: '00000000-0000-0000-0000-000000000001',
  generatedAt: new Date().toISOString(),
  readinessScore: 78,
  status: 'A_RISQUE' as const,
  totalDocumentsAudited: 42,
  compliantDocumentsCount: 38,
  anomaliesCount: 4,
  totalVatAtRiskDzd: 385000,
  totalCashOverCeilingDzd: 450000,
  suppliersSummary: {
    totalSuppliers: 14,
    compliantNifCount: 11,
    invalidOrMissingNifCount: 3,
  },
  anomalies: [
    {
      documentId: 'doc-mock-01',
      documentNumber: 'FAC-CASH-441',
      documentDate: '2026-11-04',
      thirdPartyName: 'ETS REPARATION MECANIQUE ROUISSAT',
      thirdPartyNif: '000130004567891',
      anomalyType: 'CASH_LIMIT_EXCEEDED' as const,
      severity: 'BLOCKING_DGI' as const,
      description: 'Règlement espèces de 1 450 000 DZD TTC excédant le plafond légal de 1 000 000 DZD (Art. 30 TCA & CIDTA).',
      impactDzd: 231512,
      recommendation: 'Exiger le paiement par virement ou chèque bancaire pour sauvegarder la déductibilité fiscale.',
    },
    {
      documentId: 'doc-mock-02',
      documentNumber: 'FAC-FOURN-092',
      documentDate: '2026-11-08',
      thirdPartyName: 'SARL PIECES DETACHEES EXPRESS',
      thirdPartyNif: '123456789',
      anomalyType: 'INVALID_NIF' as const,
      severity: 'BLOCKING_DGI' as const,
      description: 'NIF à 9 chiffres non conforme au standard DGI (15 chiffres historique ou 20 chiffres Jibayatic).',
      impactDzd: 153488,
      recommendation: 'Demander l\'attestation NIF actualisée au fournisseur avant soumission au contrôle continu CTC 2027.',
    },
    {
      documentId: 'doc-mock-03',
      documentNumber: 'FAC-PNEUS-112',
      documentDate: '2026-11-12',
      thirdPartyName: 'EURL PNEUMATIQUES DU SUD',
      thirdPartyNif: '000130009876543',
      anomalyType: 'MISSING_RC' as const,
      severity: 'HIGH_RISK' as const,
      description: 'Numéro de registre de commerce absent sur la facture (Art. 64 Code des Procédures Fiscales).',
      impactDzd: 0,
      recommendation: 'Compléter le numéro RC CNRC sur la fiche tiers.',
    },
    {
      documentId: 'doc-mock-04',
      documentNumber: 'SIT-CHANTIER-03',
      documentDate: '2026-11-14',
      thirdPartyName: 'COSIDER ENGINS TP',
      thirdPartyNif: '000016001234567',
      anomalyType: 'AMBIGUOUS_TAX_POINT' as const,
      severity: 'WARNING' as const,
      description: 'Situation de travaux BTPH au Débit alors que le fait générateur légal est à l\'Encaissement (Art. 13-14 TCA).',
      impactDzd: 76000,
      recommendation: 'Basculer le régime en Encaissement pour ne reverser la TVA qu\'au règlement effectif.',
    },
  ],
  executiveChecklist: [
    {
      rule: 'Plafond des paiements en espèces (<= 1 000 000 DZD)',
      status: 'ACTION_REQUISE' as const,
      legalReference: 'Art. 30 Code TCA & CIDTA (LF 2024-2026)',
      details: '1 facture fournisseur de 1 450 000 DZD réglée en espèces (dépassement 450 000 DZD).',
    },
    {
      rule: 'Validité syntaxique des NIF Tiers (15 ou 20 chiffres)',
      status: 'ACTION_REQUISE' as const,
      legalReference: 'Art. 64 CPF & Plateforme DGI Jibayatic',
      details: '3 fournisseurs sur 14 disposent d\'un NIF absent ou invalide.',
    },
    {
      rule: 'Mentions obligatoires RC & Article d\'imposition',
      status: 'ACTION_REQUISE' as const,
      legalReference: 'Art. 64 Code des Procédures Fiscales',
      details: '1 pièce d\'achat sans numéro de registre du commerce officiel.',
    },
    {
      rule: 'Fait générateur de TVA hybride (Débit vs Encaissement)',
      status: 'ACTION_REQUISE' as const,
      legalReference: 'Art. 13 & 14 Code des Taxes sur le Chiffre d\'Affaires',
      details: 'Situation de travaux déclarée au débit avant encaissement effectif.',
    },
    {
      rule: 'Intégrité cryptographique SHA-256 (Scellés Pré-CTC 2027)',
      status: 'CONFORME' as const,
      legalReference: 'Décret exécutif e-Facturation DGI & Loi 18-07',
      details: '42/42 pièces dotées d\'un scellé SHA-256 opposable.',
    },
  ],
};


