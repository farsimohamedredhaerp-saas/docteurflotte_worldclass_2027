/**
 * Tests Unitaires & Intégrité du Control Plane : Rule Studio
 */

import { describe, it, expect } from 'vitest';
import {
  PublicationGateValidator,
  AstStaticValidator,
  exportAstJsonSchema,
  RegPackStatus,
  VerificationStatus,
  EvidenceLevel,
  RegPackItemKind,
  RegPackDefinition,
} from '@docteurflotte/decision-engine';
import { INITIAL_STUDIO_PACKS } from '../src/data/initial-packs';

describe('Phase 10 — Rule Studio (Control Plane SuperAdmin)', () => {
  it('doit charger les packs bi-temporels de base (LF 2025, LF 2026, PLF 2027 DRAFT)', () => {
    expect(INITIAL_STUDIO_PACKS.length).toBeGreaterThanOrEqual(3);
    const lf2026 = INITIAL_STUDIO_PACKS.find((p) => p.version === 'DZ_LF_2026_V1');
    expect(lf2026).toBeDefined();
    expect(lf2026?.status).toBe(RegPackStatus.PUBLISHED);
    expect(lf2026?.signature).toBeDefined();
  });

  it('doit bloquer formellement la publication du pack PLF 2027 à cause des items UNVERIFIED (Porte N°1)', () => {
    const plf2027 = INITIAL_STUDIO_PACKS.find((p) => p.version === 'DZ_PLF_2027_DRAFT')!;
    expect(plf2027).toBeDefined();

    const packDef: RegPackDefinition = {
      packCode: plf2027.id,
      version: plf2027.version,
      descriptionFr: plf2027.titleFr,
      validFrom: plf2027.validFrom,
      status: plf2027.status,
      authorEmail: `${plf2027.authorId}@cabinet.dz`,
      createdAt: plf2027.createdAt,
      items: plf2027.items.map((i) => ({
        code: i.code,
        kind: i.kind,
        sourceHierarchy: 'LF',
        effectiveFrom: i.effectiveFrom,
        effectiveTo: i.effectiveTo,
        validFrom: i.effectiveFrom,
        validTo: i.effectiveTo ?? null,
        recordedAt: plf2027.createdAt,
        supersededAt: null,
        legalRef: i.legalRef,
        legalBasisVerified: i.legalBasisVerified,
        verificationStatus: i.verificationStatus,
        evidenceLevel: i.evidenceLevel,
        payload: { value: i.valueJson },
      })),
    };

    const report = PublicationGateValidator.validate(packDef);
    expect(report.isApprovedForPublication).toBe(false);
    expect(report.unverifiedItemsCount).toBeGreaterThanOrEqual(2);
    expect(report.failures.some((f) => f.gateCode === 'GATE-01-ZERO-UNVERIFIED')).toBe(true);
  });

  it('doit valider la règle AST de calcul IBS 2026 et son JSON Schema formel Draft-07', () => {
    const lf2026 = INITIAL_STUDIO_PACKS.find((p) => p.version === 'DZ_LF_2026_V1')!;
    const ruleIbs = lf2026.items.find((i) => i.code === 'RULE_IBS_CALCULATION_2026')!;
    expect(ruleIbs).toBeDefined();

    const availableParams = new Set(
      lf2026.items.filter((i) => i.kind === RegPackItemKind.PARAMETER).map((p) => p.code)
    );

    const report = AstStaticValidator.validate(ruleIbs.valueJson, availableParams);
    expect(report.isValid).toBe(true);
    expect(report.depth).toBeLessThanOrEqual(32);
    expect(report.nodeCount).toBeLessThanOrEqual(2000);
    expect(report.errors).toHaveLength(0);

    const schema = exportAstJsonSchema();
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(schema.title).toBe('DecisionEngineAstNode');
  });

  it('doit calculer le diff entre LF 2025 et LF 2026 et détecter l ajout du taux BTPH/Tourisme', () => {
    const p2025 = INITIAL_STUDIO_PACKS.find((p) => p.version === 'DZ_LF_2025_V1')!;
    const p2026 = INITIAL_STUDIO_PACKS.find((p) => p.version === 'DZ_LF_2026_V1')!;

    const codes2025 = new Set(p2025.items.map((i) => i.code));
    const newIn2026 = p2026.items.filter((i) => !codes2025.has(i.code));

    expect(newIn2026.some((i) => i.code === 'PARAM_IBS_BTPH_TOURISM')).toBe(true);
    expect(newIn2026.some((i) => i.code === 'PARAM_TAP_RATE')).toBe(true);
  });
});
