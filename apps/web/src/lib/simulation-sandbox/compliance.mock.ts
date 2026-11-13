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
