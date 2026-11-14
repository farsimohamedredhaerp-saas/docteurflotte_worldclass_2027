import { StandardFuelType } from '@docteurflotte/contracts';

export interface ScanPreset {
  liters: number;
  station: string;
  fuelType: StandardFuelType;
  rawText: (unitPriceGasoil: number) => string;
}

export const SCAN_PRESETS: Record<'valid' | 'sahara' | 'fraud', ScanPreset> = {
  valid: {
    liters: 45,
    station: 'Station Naftal Chéraga (RN41)',
    fuelType: 'Gasoil',
    rawText: (price) =>
      `NAFTAL SPA - STATION CHERAGA RN41\nDATE: ${new Date().toLocaleDateString('fr-FR')} 10:42\nCARBURANT: GASOIL\nVOLUME: 45.00 L\nPRIX UNITAIRE: ${price.toFixed(2)} DA\nTOTAL A PAYER: ${(45 * price).toFixed(2)} DA\nCARTE NAFTAL: **** 8841`,
  },
  sahara: {
    liters: 380,
    station: 'Station Naftal Hassi Messaoud (Base)',
    fuelType: 'Gasoil',
    rawText: (price) =>
      `NAFTAL DISTRIB SUD - HASSI MESSAOUD\nDATE: ${new Date().toLocaleDateString('fr-FR')} 06:15\nPOMPE PL N°4 - GASOIL\nVOLUME: 380.00 L\nPRIX: ${price.toFixed(2)} DA/L\nMONTANT TOTAL: ${(380 * price).toFixed(2)} DA\nVEHICULE: SHACMAN X3000`,
  },
  fraud: {
    liters: 90,
    station: 'Station Naftal Blida Centre',
    fuelType: 'Gasoil',
    rawText: (price) =>
      `TICKET NAFTAL BLIDA CENTRE\nDATE: ${new Date().toLocaleDateString('fr-FR')} 22:30\nGASOIL SPECIAL\nLITRES: 90.00 L\nTOTAL DZD: ${(90 * price).toFixed(2)} DA`,
  },
};

