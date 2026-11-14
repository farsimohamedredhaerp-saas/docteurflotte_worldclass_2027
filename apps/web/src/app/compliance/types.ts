export type ComplianceTab = 'ENACTA' | 'INSURANCE' | 'WILAYAS' | 'TAXES';

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

export interface WilayaRestriction {
  wilayaCode: number;
  wilayaName: string;
  tonnageLimit: number;
  restrictedHours: string;
  bypassRoute: string;
  legalReference: string;
  activeStatus: 'STRICT_PEAK' | 'NIGHT_EXEMPT' | 'SPECIAL_PERMIT';
}

export const WILAYA_RESTRICTIONS: WilayaRestriction[] = [
  {
    wilayaCode: 16,
    wilayaName: 'Alger',
    tonnageLimit: 5.5,
    restrictedHours: '06h30 - 09h30 & 16h00 - 19h30',
    bypassRoute: '2e Rocade Sud (Boudouaou - Staouéli - Zéralda)',
    legalReference: 'Arrêté de Wilaya N° 1422 / JORADP',
    activeStatus: 'STRICT_PEAK',
  },
  {
    wilayaCode: 31,
    wilayaName: 'Oran',
    tonnageLimit: 7.5,
    restrictedHours: '07h00 - 09h30 & 16h30 - 19h00',
    bypassRoute: "4e Périphérique d'Oran / Pénétrante Est",
    legalReference: 'Arrêté N° 890 / Régulation Urbaine',
    activeStatus: 'STRICT_PEAK',
  },
  {
    wilayaCode: 25,
    wilayaName: 'Constantine',
    tonnageLimit: 5.5,
    restrictedHours: '06h45 - 09h15 & 16h00 - 18h45',
    bypassRoute: 'Contournement Autoroute A1 (El Khroub - Didouche)',
    legalReference: 'Arrêté N° 512 / Transport Lourd',
    activeStatus: 'STRICT_PEAK',
  },
  {
    wilayaCode: 30,
    wilayaName: 'Ouargla / Hassi Messaoud',
    tonnageLimit: 44.0,
    restrictedHours: 'Circulation continue 24/7 (Couloir Pétrolier)',
    bypassRoute: 'RN3 / Axe Logistique Puits Sonatrach',
    legalReference: 'Dérogation Convoi Exceptionnel Hydrocarbures',
    activeStatus: 'SPECIAL_PERMIT',
  },
];
