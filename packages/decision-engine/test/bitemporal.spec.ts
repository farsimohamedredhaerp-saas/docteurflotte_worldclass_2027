import { describe, it, expect } from 'vitest';
import {
  isBiTemporallyActive,
  evaluatePublicationGate,
  BiTemporalCoordinates,
  RegulatoryPackManifest,
  RegulatoryPackItemMeta,
  RegPackStatus,
  RegPackItemKind,
  VerificationStatus,
  EvidenceLevel,
} from '../src';

describe('BiTemporal Resolution & Publication Gates', () => {
  it('rend un item rétroactif invisible avant sa date de connaissance système (knownAt)', () => {
    // Règle : item enregistré le 2026-12-20 rétroactif au 2026-01-01
    const item: BiTemporalCoordinates = {
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      recordedAt: '2026-12-20T10:00:00.000Z',
      supersededAt: null,
    };

    // Au 2026-12-01 (connaissance passée), l'item n'était pas encore enregistré
    const queryBeforeRecorded = {
      asOf: '2026-06-01',
      knownAt: '2026-12-01T00:00:00.000Z',
    };
    expect(isBiTemporallyActive(item, queryBeforeRecorded)).toBe(false);

    // Au 2026-12-21 (après enregistrement), l'effet rétroactif s'applique
    const queryAfterRecorded = {
      asOf: '2026-06-01',
      knownAt: '2026-12-21T00:00:00.000Z',
    };
    expect(isBiTemporallyActive(item, queryAfterRecorded)).toBe(true);
  });

  it('exclut un item écrasé/corrigé (superseded) pour une date de connaissance ultérieure', () => {
    const item: BiTemporalCoordinates = {
      validFrom: '2026-01-01',
      validTo: null,
      recordedAt: '2026-01-01T00:00:00.000Z',
      supersededAt: '2026-06-30T23:59:59.000Z',
    };

    // Connu avant révocation
    expect(isBiTemporallyActive(item, { asOf: '2026-03-01', knownAt: '2026-05-01T00:00:00.000Z' })).toBe(true);

    // Après révocation, non visible
    expect(isBiTemporallyActive(item, { asOf: '2026-03-01', knownAt: '2026-07-01T00:00:00.000Z' })).toBe(false);
  });

  it('bloque la porte de publication si au moins un paramètre est UNVERIFIED', () => {
    const manifest: RegulatoryPackManifest = {
      packId: 'DZ_LF_2026_TEST',
      version: '1.0.0',
      descriptionFr: 'Pack de test',
      status: RegPackStatus.APPROVED,
      contentHash: 'hash123',
      authorEmail: 'author@dzerp.dz',
      publishedByEmail: 'publisher@dzerp.dz',
      validatedByExpert: 'Ordre des Experts Comptables DZ',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const items: RegulatoryPackItemMeta[] = [
      {
        code: 'PARAM_TEST_OFFICIAL',
        kind: RegPackItemKind.PARAMETER,
        legalRef: 'Art. 1',
        legalBasisVerified: true,
        verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
        evidenceLevel: EvidenceLevel.LEGAL_TEXT,
        validFrom: '2026-01-01',
        validTo: null,
        recordedAt: '2026-01-01T00:00:00.000Z',
        supersededAt: null,
        descriptionFr: 'Paramètre officiel',
      },
      {
        code: 'PARAM_TEST_UNVERIFIED',
        kind: RegPackItemKind.PARAMETER,
        legalRef: 'À vérifier',
        legalBasisVerified: false,
        verificationStatus: VerificationStatus.UNVERIFIED,
        evidenceLevel: EvidenceLevel.AUDIT_PRACTICE,
        validFrom: '2026-01-01',
        validTo: null,
        recordedAt: '2026-01-01T00:00:00.000Z',
        supersededAt: null,
        descriptionFr: 'Paramètre suspect',
      },
    ];

    const report = evaluatePublicationGate(manifest, items);
    expect(report.canPublish).toBe(false);
    expect(report.unverifiedItemsCount).toBe(1);
    expect(report.unverifiedItemCodes).toContain('PARAM_TEST_UNVERIFIED');
  });

  it('bloque la porte de publication si l\'auteur tente de publier son propre pack', () => {
    const manifest: RegulatoryPackManifest = {
      packId: 'DZ_LF_2026_TEST_MAKER_CHECKER',
      version: '1.0.0',
      descriptionFr: 'Pack auto-publié interdit',
      status: RegPackStatus.APPROVED,
      contentHash: 'hash456',
      authorEmail: 'admin@dzerp.dz',
      publishedByEmail: 'admin@dzerp.dz', // Violate maker-checker
      validatedByExpert: 'Validateur Agréé',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const report = evaluatePublicationGate(manifest, []);
    expect(report.canPublish).toBe(false);
    expect(report.reasons.some((r) => r.includes('Séparation des rôles violée'))).toBe(true);
  });
});

