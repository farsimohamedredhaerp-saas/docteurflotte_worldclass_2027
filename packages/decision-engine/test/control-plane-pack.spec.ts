import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  EngineCrypto,
  RegPackService,
  RegPackResolver,
  PublicationGateValidator,
  RegPackDefinition,
  RegPackStatus,
  RegPackItemKind,
  VerificationStatus,
  EvidenceLevel,
} from '../src';

describe('Control Plane — Packs Réglementaires, Signatures & Résolution Bi-temporelle', () => {
  // Clés Ed25519 isolées pour les tests
  const keyPair = EngineCrypto.generateKeyPair();

  it('résout la valeur 0.19 au 2022-06-01 puis 0.18 au 2027-01-01', () => {
    const pack2022: RegPackDefinition = {
      packCode: 'DZ_LF_2022',
      version: '2022.1.0',
      descriptionFr: 'Pack LF 2022',
      status: RegPackStatus.PUBLISHED,
      authorEmail: 'author@dzerp.dz',
      createdAt: '2022-01-01T00:00:00.000Z',
      items: [
        {
          code: 'PARAM_TVA_NORMAL',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LF',
          validFrom: '2022-01-01',
          validTo: '2026-12-31',
          recordedAt: '2022-01-01T00:00:00.000Z',
          supersededAt: null,
          legalRef: 'LF 2022',
          legalBasisVerified: true,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '0.19' },
        },
      ],
    };

    const pack2027: RegPackDefinition = {
      packCode: 'DZ_LF_2027_DRAFT',
      version: '2027.1.0-draft',
      descriptionFr: 'Pack PLF 2027 (baisse projetée)',
      status: RegPackStatus.DRAFT,
      authorEmail: 'author@dzerp.dz',
      createdAt: '2026-10-15T00:00:00.000Z',
      items: [
        {
          code: 'PARAM_TVA_NORMAL',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LF',
          validFrom: '2027-01-01',
          validTo: null,
          recordedAt: '2026-10-15T00:00:00.000Z',
          supersededAt: null,
          legalRef: 'Projet LF 2027',
          legalBasisVerified: false,
          verificationStatus: VerificationStatus.SOURCED_SECONDARY,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '0.18' },
        },
      ],
    };

    // 1. Évaluation au 2022-06-01 -> Doit retourner 0.19
    const state2022 = RegPackResolver.resolve([pack2022, pack2027], {
      asOf: '2022-06-01',
      knownAt: '2026-12-01T00:00:00.000Z',
    });
    expect(state2022.getParameter('PARAM_TVA_NORMAL')).toBe('0.19');

    // 2. Évaluation au 2027-01-01 -> Doit retourner 0.18
    const state2027 = RegPackResolver.resolve([pack2022, pack2027], {
      asOf: '2027-01-01',
      knownAt: '2026-12-01T00:00:00.000Z',
    });
    expect(state2027.getParameter('PARAM_TVA_NORMAL')).toBe('0.18');
  });

  it('rend un item rétroactif invisible avec knownAt antérieur à son enregistrement, puis visible après', () => {
    const pack: RegPackDefinition = {
      packCode: 'DZ_RETRO_TEST',
      version: '1.0.0',
      descriptionFr: 'Pack rétroactif',
      status: RegPackStatus.APPROVED,
      authorEmail: 'legal@dzerp.dz',
      createdAt: '2026-12-20T10:00:00.000Z',
      items: [
        {
          code: 'PARAM_RETRO_THRESHOLD',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LF',
          validFrom: '2026-01-01',
          validTo: null,
          recordedAt: '2026-12-20T10:00:00.000Z',
          supersededAt: null,
          legalRef: 'Loi rétroactive',
          legalBasisVerified: true,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '50000' },
        },
      ],
    };

    // Avec knownAt = 2026-12-01 (avant l'enregistrement du 20/12) -> INVISIBLE
    const stateBefore = RegPackResolver.resolve([pack], {
      asOf: '2026-06-01',
      knownAt: '2026-12-01T00:00:00.000Z',
    });
    expect(stateBefore.getParameter('PARAM_RETRO_THRESHOLD')).toBeUndefined();

    // Avec knownAt = 2026-12-21 (après l'enregistrement) -> VISIBLE
    const stateAfter = RegPackResolver.resolve([pack], {
      asOf: '2026-06-01',
      knownAt: '2026-12-21T00:00:00.000Z',
    });
    expect(stateAfter.getParameter('PARAM_RETRO_THRESHOLD')).toBe('50000');
  });

  it('détecte immédiatement l\'altération d\'un octet dans un pack signé (TAMPERED)', () => {
    const rawPack: RegPackDefinition = {
      packCode: 'DZ_INTEGRITY_TEST',
      version: '1.0.0',
      descriptionFr: 'Pack intégrité',
      status: RegPackStatus.APPROVED,
      authorEmail: 'author@dzerp.dz',
      publishedByEmail: 'publisher@dzerp.dz',
      validatedByExpert: 'Expert Agréé',
      createdAt: '2026-01-01T00:00:00.000Z',
      items: [
        {
          code: 'PARAM_SECURE_VAL',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LF',
          validFrom: '2026-01-01',
          validTo: null,
          recordedAt: '2026-01-01T00:00:00.000Z',
          supersededAt: null,
          legalRef: 'Art. 1',
          legalBasisVerified: true,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '100' },
        },
      ],
    };

    // Signature valide avec Ed25519
    const signedPack = RegPackService.signPack(rawPack, keyPair.privateKeyPem);
    const initialVerify = RegPackService.verifyPack(signedPack, keyPair.publicKeyPem);
    expect(initialVerify.signatureResult.valid).toBe(true);
    expect(initialVerify.signatureResult.status).toBe('VERIFIED');

    // Altération d'un seul octet (changement de description ou payload)
    const tamperedPack: RegPackDefinition = JSON.parse(JSON.stringify(signedPack));
    tamperedPack.descriptionFr = 'Pack intégrité altéré par un attaquant';

    const tamperedVerify = RegPackService.verifyPack(tamperedPack, keyPair.publicKeyPem);
    expect(tamperedVerify.signatureResult.valid).toBe(false);
    expect(tamperedVerify.signatureResult.status).toBe('TAMPERED');
  });

  it('arbitre rigoureusement la priorité légale LFC > LF sur un même paramètre', () => {
    const lfPack: RegPackDefinition = {
      packCode: 'DZ_LF_2026',
      version: '2026.1.0',
      descriptionFr: 'Loi de Finances initiale',
      status: RegPackStatus.PUBLISHED,
      authorEmail: 'author@dzerp.dz',
      createdAt: '2026-01-01T00:00:00.000Z',
      items: [
        {
          code: 'PARAM_IBS_TARGET',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LF',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          recordedAt: '2026-01-01T00:00:00.000Z',
          supersededAt: null,
          legalRef: 'LF 2026 Art. 10',
          legalBasisVerified: true,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '0.26' },
        },
      ],
    };

    const lfcPack: RegPackDefinition = {
      packCode: 'DZ_LFC_2026',
      version: '2026.2.0',
      descriptionFr: 'Loi de Finances Complémentaire',
      status: RegPackStatus.PUBLISHED,
      authorEmail: 'author@dzerp.dz',
      createdAt: '2026-06-30T00:00:00.000Z',
      items: [
        {
          code: 'PARAM_IBS_TARGET',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LFC', // Hiérarchie supérieure
          validFrom: '2026-07-01',
          validTo: '2026-12-31',
          recordedAt: '2026-06-30T00:00:00.000Z',
          supersededAt: null,
          legalRef: 'LFC 2026 Art. 4',
          legalBasisVerified: true,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '0.23' },
        },
      ],
    };

    // Avant la LFC (en mai 2026) -> Taux LF (0.26)
    const stateMay = RegPackResolver.resolve([lfPack, lfcPack], {
      asOf: '2026-05-15',
      knownAt: '2026-08-01T00:00:00.000Z',
    });
    expect(stateMay.getParameter('PARAM_IBS_TARGET')).toBe('0.26');

    // Après la LFC (en août 2026) -> Taux LFC surclassant la LF (0.23)
    const stateAugust = RegPackResolver.resolve([lfPack, lfcPack], {
      asOf: '2026-08-15',
      knownAt: '2026-08-01T00:00:00.000Z',
    });
    expect(stateAugust.getParameter('PARAM_IBS_TARGET')).toBe('0.23');
  });

  it('interdit l\'approbation par l\'auteur du pack (Maker-Checker)', () => {
    const pack: RegPackDefinition = {
      packCode: 'DZ_MAKER_CHECKER_TEST',
      version: '1.0.0',
      descriptionFr: 'Test séparation auteur approbateur',
      status: RegPackStatus.APPROVED,
      authorEmail: 'same_person@dzerp.dz',
      publishedByEmail: 'same_person@dzerp.dz',
      validatedByExpert: 'Validateur Indépendant',
      createdAt: '2026-01-01T00:00:00.000Z',
      items: [],
      approvals: [
        {
          approverEmail: 'same_person@dzerp.dz', // Violation
          role: 'AUTHOR_AND_APPROVER',
          approvedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          approverEmail: 'other_person@dzerp.dz',
          role: 'REVIEWER',
          approvedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    const report = PublicationGateValidator.validate(pack);
    expect(report.isApprovedForPublication).toBe(false);
    expect(report.failures.some((f) => f.gateCode === 'GATE-06-MAKER-CHECKER-SEPARATION')).toBe(true);
  });

  it('rejette la publication d\'un pack avec chevauchement temporel sur un même item', () => {
    const pack: RegPackDefinition = {
      packCode: 'DZ_OVERLAP_TEST',
      version: '1.0.0',
      descriptionFr: 'Pack avec collision de dates',
      status: RegPackStatus.DRAFT,
      authorEmail: 'author@dzerp.dz',
      publishedByEmail: 'publisher@dzerp.dz',
      validatedByExpert: 'Expert Agréé',
      createdAt: '2026-01-01T00:00:00.000Z',
      items: [
        {
          code: 'PARAM_CONFLICT',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LF',
          validFrom: '2026-01-01',
          validTo: '2026-06-30',
          recordedAt: '2026-01-01T00:00:00.000Z',
          supersededAt: null,
          legalRef: 'Réf 1',
          legalBasisVerified: true,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '1' },
        },
        {
          code: 'PARAM_CONFLICT',
          kind: RegPackItemKind.PARAMETER,
          sourceHierarchy: 'LF',
          validFrom: '2026-05-01', // Chevauchement avec [01/01 -> 30/06]
          validTo: '2026-12-31',
          recordedAt: '2026-01-01T00:00:00.000Z',
          supersededAt: null,
          legalRef: 'Réf 2',
          legalBasisVerified: true,
          verificationStatus: VerificationStatus.SOURCED_OFFICIAL,
          evidenceLevel: EvidenceLevel.LEGAL_TEXT,
          payload: { value: '2' },
        },
      ],
      approvals: [
        { approverEmail: 'app1@dzerp.dz', role: 'REV', approvedAt: '2026-01-01T00:00:00Z' },
        { approverEmail: 'app2@dzerp.dz', role: 'REV', approvedAt: '2026-01-01T00:00:00Z' },
      ],
    };

    const report = PublicationGateValidator.validate(pack);
    expect(report.isApprovedForPublication).toBe(false);
    expect(report.failures.some((f) => f.gateCode === 'GATE-03-NO-TEMPORAL-OVERLAP')).toBe(true);
  });

  it('PROUVE QUE LE SEED DZ_LF_2026_DRAFT ÉCHOUE OBLIGATOIREMENT À LA PORTE « AUCUN UNVERIFIED »', () => {
    const fixturePath = path.join(__dirname, '..', 'fixtures', 'packs', 'DZ_LF_2026_DRAFT.json');
    expect(fs.existsSync(fixturePath)).toBe(true);

    const packRaw: RegPackDefinition = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const report = PublicationGateValidator.validate(packRaw);

    // Le pack DOIT ÉCHOUER à la publication en production
    expect(report.isApprovedForPublication).toBe(false);

    // Échec spécifique sur la règle Zéro UNVERIFIED
    const unverifiedFailure = report.failures.find(
      (f) => f.gateCode === 'GATE-01-ZERO-UNVERIFIED'
    );
    expect(unverifiedFailure).toBeDefined();

    // Doit lister les éléments non vérifiés (ex: IFU ceiling, véhicule de tourisme)
    expect(unverifiedFailure?.violatingItemCodes).toContain('PARAM_IFU_CEILING');
    expect(unverifiedFailure?.violatingItemCodes).toContain('PARAM_PASSENGER_CAR_CEILING');
    expect(report.unverifiedItemsCount).toBeGreaterThan(0);
  });
});

