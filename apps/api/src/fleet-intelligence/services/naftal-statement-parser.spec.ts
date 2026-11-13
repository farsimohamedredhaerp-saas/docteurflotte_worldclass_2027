import { NaftalStatementParserService } from './naftal-statement-parser.service';
import { NAFTAL_FUEL_PRICES_DZD } from '@docteurflotte/contracts';

describe('NaftalStatementParserService', () => {
  let service: NaftalStatementParserService;

  beforeEach(() => {
    service = new NaftalStatementParserService();
  });

  describe('parseCsvStatement', () => {
    it('doit parser avec succès un relevé CSV de cartes Naftal (séparateur point-virgule)', () => {
      const csv = [
        'Carte;Date Heure;Station;Wilaya;Produit;Litres;Prix Unitaire;Montant Total;Compteur Km;Matricule',
        'NAFT-883920;2026-11-01 08:30;Relais Naftal Chiffa 0901;9;Gasoil;250.00;31.00;7750.00;145200;16-118-09',
        'NAFT-883920;2026-11-01 17:45;Station Naftal Djelfa 1702;17;Gasoil;300.00;31.00;9300.00;145620;16-118-09',
      ].join('\n');

      const result = service.parseCsvStatement(csv);

      expect(result.totalRecords).toBe(2);
      expect(result.validRecords).toBe(2);
      expect(result.errorRecords).toBe(0);
      expect(result.totalVolumeLiters).toBe(550.0);
      expect(result.totalAmountDzd).toBe(17050.0);
      expect(result.pricingAnomaliesCount).toBe(0);

      const r1 = result.records[0];
      expect(r1.cardNumber).toBe('NAFT-883920');
      expect(r1.stationWilayaCode).toBe(9);
      expect(r1.fuelType).toBe('GASOIL');
      expect(r1.volumeLiters).toBe(250.0);
      expect(r1.unitPriceDzd).toBe(31.00);
      expect(r1.declaredOdometerKm).toBe(145200);
      expect(r1.assetRegistration).toBe('16-118-09');
    });

    it('doit détecter les anomalies tarifaires Naftal si le prix unitaire diverge du barème officiel', () => {
      const csv = [
        'Carte;Date;Station;Wilaya;Produit;Litres;Prix;Total;Km;Matricule',
        'CARD-1;2026-11-02 10:00;Naftal Rouiba;16;Gasoil;100;45.00;4500;80000;16-200-16',
      ].join('\n');

      const result = service.parseCsvStatement(csv);

      expect(result.validRecords).toBe(1);
      expect(result.pricingAnomaliesCount).toBe(1);
      expect(result.records[0].priceAnomalyDetected).toBe(true);
      expect(result.records[0].expectedUnitPriceDzd).toBe(NAFTAL_FUEL_PRICES_DZD.GASOIL);
    });

    it('doit lever une exception BadRequest si le contenu est vide', () => {
      expect(() => service.parseCsvStatement('')).toThrow();
    });
  });

  describe('parseOcrReceiptText', () => {
    it('doit extraire les données clés d un texte OCR brut de ticket Naftal', () => {
      const ocrRaw = `
        NAFTAL SPA - STATION RELAIS BABA ALI
        DATE : 04/11/2026 14:22
        PRODUIT : GASOIL
        VOLUME : 180.50 L
        P.U : 31.00 DA
        TOTAL : 5595.50 DA
        ODO : 94250 KM
      `;

      const parsed = service.parseOcrReceiptText(ocrRaw);

      expect(parsed.fuelType).toBe('GASOIL');
      expect(parsed.volumeLiters).toBe(180.5);
      expect(parsed.totalAmountDzd).toBe(5595.5);
      expect(parsed.declaredOdometerKm).toBe(94250);
      expect(parsed.priceAnomalyDetected).toBe(false);
    });
  });
});
