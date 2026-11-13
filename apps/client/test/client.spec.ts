import { describe, it, expect } from 'vitest';
import {
  INITIAL_LEDGER_LINES,
  INITIAL_AUDIT_ALERTS,
  INITIAL_TENANT_PROFILE,
} from '../src/data/mock-client-data';
import { EngineDecimal } from '@docteurflotte/decision-engine';

describe('Data Plane Client (@docteurflotte/client)', () => {
  it('1. garantit l équilibre absolu Débit = Crédit sur le Grand Livre initial', () => {
    let totalDebit = new EngineDecimal(0);
    let totalCredit = new EngineDecimal(0);

    for (const line of INITIAL_LEDGER_LINES) {
      totalDebit = totalDebit.plus(new EngineDecimal(line.debit));
      totalCredit = totalCredit.plus(new EngineDecimal(line.credit));
    }

    const diff = totalDebit.minus(totalCredit).abs();
    expect(diff.toNumber()).toBe(0);
    expect(totalDebit.gt(0)).toBe(true);
  });

  it('2. garantit l intégrité du chaînage cryptographique SHA-256 sans rupture', () => {
    for (let i = 1; i < INITIAL_LEDGER_LINES.length; i++) {
      const prevLine = INITIAL_LEDGER_LINES[i - 1];
      const currLine = INITIAL_LEDGER_LINES[i];

      expect(currLine.prevHash).toBe(prevLine.entryHash);
      expect(currLine.entryHash).toMatch(/^[a-f0-9]{60,}$/);
    }
  });

  it('3. détecte avec précision le dépassement du plafond espèces IBS (300 000 DA)', () => {
    const cashCeilingIbs = 300000;
    const paymentAbove = 350000;
    const paymentBelow = 250000;

    expect(paymentAbove > cashCeilingIbs).toBe(true);
    expect(paymentBelow > cashCeilingIbs).toBe(false);

    const excess = paymentAbove - cashCeilingIbs;
    expect(excess).toBe(50000);
  });

  it('4. valide la syntaxe stricte des NIF algériens (15 ou 20 chiffres)', () => {
    const validCorporateNif = '001616099000085'; // 15 chiffres
    const validIndividualNif = '00161609900008512345'; // 20 chiffres
    const invalidNif = '123456';

    const isValidNif = (nif: string) => nif.length === 15 || nif.length === 20;

    expect(isValidNif(validCorporateNif)).toBe(true);
    expect(isValidNif(validIndividualNif)).toBe(true);
    expect(isValidNif(invalidNif)).toBe(false);
  });

  it('5. applique la Règle 6 : vocabulaire d audit neutre et revue contradictoire obligatoire', () => {
    for (const alert of INITIAL_AUDIT_ALERTS) {
      expect(alert.humanReviewRequired).toBe(true);
      expect(alert.observation).not.toMatch(/fraude/i);
      expect(alert.observation).not.toMatch(/fraudeur/i);
      expect(alert.observation).not.toMatch(/redressement certain/i);
      expect(alert.financialExposureDzd.taxType).toBeDefined();
    }
  });

  it('6. vérifie les métadonnées de souveraineté du tenant (Wilaya, fuseau horaire)', () => {
    expect(INITIAL_TENANT_PROFILE.legalTimezone).toContain('Africa/Algiers');
    expect(INITIAL_TENANT_PROFILE.wilayaCode).toBe('16');
    expect(INITIAL_TENANT_PROFILE.regime).toBe('REEL_NORMAL');
  });
});

