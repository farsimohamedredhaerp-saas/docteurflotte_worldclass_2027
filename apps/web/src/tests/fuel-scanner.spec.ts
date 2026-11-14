import { describe, it, expect } from 'vitest';
import { FuelReceiptScanResult } from '@docteurflotte/contracts';
import { SCAN_PRESETS } from '../app/fuel-scanner/lib/scanPresets';
import {
  buildFuelCalculationProof,
  buildTechnicalDossierData,
} from '../app/fuel-scanner/lib/buildProofAndDossier';

describe('Fuel Scanner & CUSUM Module (Lot 1 Smoke Tests)', () => {
  describe('SCAN_PRESETS', () => {
    it('génère un reçu valide conforme pour la station Chéraga RN41', () => {
      const preset = SCAN_PRESETS.valid;
      expect(preset.liters).toBe(45);
      expect(preset.fuelType).toBe('Gasoil');
      const text = preset.rawText(31.0);
      expect(text).toContain('CHERAGA RN41');
      expect(text).toContain('45.00 L');
      expect(text).toContain('31.00 DA');
    });

    it('génère un scénario haut volume pour le Sahara (Hassi Messaoud)', () => {
      const preset = SCAN_PRESETS.sahara;
      expect(preset.liters).toBe(380);
      const text = preset.rawText(31.0);
      expect(text).toContain('HASSI MESSAOUD');
      expect(text).toContain('SHACMAN X3000');
    });

    it('génère un scénario de litige CUSUM pour Blida', () => {
      const preset = SCAN_PRESETS.fraud;
      expect(preset.liters).toBe(90);
      const text = preset.rawText(31.0);
      expect(text).toContain('BLIDA CENTRE');
    });
  });

  describe('buildFuelCalculationProof', () => {
    const mockVerifiedReceipt: FuelReceiptScanResult = {
      receiptId: 'rcpt-test-001',
      assetId: 'asset-1',
      assetName: 'Renault Trucks C 440',
      assetCode: '16-10492-00',
      stationName: 'Station Naftal Chéraga',
      stationWilaya: '16',
      liters: 50,
      totalAmountDzd: 1550,
      fuelType: 'Gasoil',
      unitPriceDzd: 31,
      dateTime: '2026-11-14T10:00:00.000Z',
      createdAt: '2026-11-14T10:00:00.000Z',
      receiptConfidence: 0.99,
      status: 'APPROVED',
      reconciliation: {
        reconciliationStatus: 'VERIFIED',
        telematicsLevelDeltaLiters: 49.5,
        varianceLiters: 0.5,
        distanceToStationMeters: 35,
        isLocationVerified: true,
        tankLevelBeforeLiters: 80,
        tankLevelAfterLiters: 129.5,
        confidenceScore: 98,
        fraudRiskProbability: 0.01,
        explanation: 'Plein vérifié.',
      },
    };

    it('génère une preuve mathématique déterministe avec variables et étapes XAI', () => {
      const proof = buildFuelCalculationProof(mockVerifiedReceipt);
      expect(proof.title).toContain('Preuve de Réconciliation Télématique Naftal');
      expect(proof.variables.length).toBe(6);
      expect(proof.steps.length).toBe(3);
      expect(proof.finalResult.value).toContain('CONFORME');
    });

    it('signale une alerte fraude en cas de discordance volumique > 5L', () => {
      const mockAnomaly: FuelReceiptScanResult = {
        ...mockVerifiedReceipt,
        status: 'REJECTED',
        reconciliation: {
          ...mockVerifiedReceipt.reconciliation,
          reconciliationStatus: 'POTENTIAL_FRAUD',
          varianceLiters: 22.0,
          distanceToStationMeters: 450,
        },
      };

      const proof = buildFuelCalculationProof(mockAnomaly);
      expect(proof.finalResult.value).toContain('FRAUDE SUSPECTÉE');
      expect(proof.steps[2].intermediateResult).toBe('ANOMALIE DÉTECTÉE');
    });
  });

  describe('buildTechnicalDossierData & Conformité Loi 18-07 ANPDP', () => {
    it('construit un dossier technique avec pseudonymisation ANPDP et empreinte SHA-256', () => {
      const mockReceipt: FuelReceiptScanResult = {
        receiptId: 'rcpt-test-999',
        assetId: 'asset-1',
        assetName: 'Renault Trucks C 440',
        assetCode: '16-10492-00',
        stationName: 'Station Naftal Chéraga',
        stationWilaya: '16',
        liters: 100,
        unitPriceDzd: 31,
        totalAmountDzd: 3100,
        fuelType: 'Gasoil',
        dateTime: '2026-11-14T10:00:00.000Z',
        createdAt: '2026-11-14T10:00:00.000Z',
        receiptConfidence: 0.95,
        status: 'REJECTED',
        reconciliation: {
          reconciliationStatus: 'POTENTIAL_FRAUD',
          telematicsLevelDeltaLiters: 70,
          varianceLiters: 30,
          distanceToStationMeters: 40,
          isLocationVerified: true,
          tankLevelBeforeLiters: 50,
          tankLevelAfterLiters: 120,
          confidenceScore: 70,
          fraudRiskProbability: 0.85,
          explanation: 'Écart de 30L',
        },
      };

      const dossier = buildTechnicalDossierData(mockReceipt, undefined, 31.0);
      expect(dossier.dossierReference).toContain('DET-NAFTAL-RCPT-TES');
      expect(dossier.driverPseudonym).toBe('CHAUFFEUR-SECURISE-ANPDP');
      expect(dossier.financialPrejudiceDzd).toBe(930); // 30L * 31 DA
      expect(dossier.integritySha256).toBeDefined();
    });
  });
});

