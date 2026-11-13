import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  AstInterpreter,
  AstCompiler,
  AstNode,
  AstStaticValidator,
  SecurityViolationError,
  EngineDecimal,
  EngineMath,
  exportAstJsonSchema,
} from '../src';

describe('Moteur AST — Évaluateur Déterministe & Compilateur en Closures', () => {
  // Règle AST modélisant le plafonnement d'amortissement des véhicules de tourisme (Art. 141 CIDTA)
  // Reintegration = MAX(0, dotation - (MIN(cout, plafond) / duree) * prorata)
  const passengerCarRuleAst: AstNode = {
    type: 'LET',
    bindings: {
      // Plafond fiscal applicable à l'actif = MIN(coutAcquisition, plafondReglementaire)
      baseAmortissableFiscale: {
        type: 'MIN',
        left: { type: 'var', path: 'asset.acquisitionCost' },
        right: { type: 'param', paramCode: 'PARAM_PASSENGER_CAR_CEILING' },
      },
      // Amortissement fiscal annuel déductible = (baseFiscale / dureeAnnees) * prorata
      amortissementFiscalDeductible: {
        type: 'MUL',
        left: {
          type: 'DIV',
          left: { type: 'var', path: 'baseAmortissableFiscale' },
          right: { type: 'var', path: 'asset.amortizationYears' },
          on_zero: 'ERROR',
        },
        right: { type: 'var', path: 'asset.prorataTemporis' },
      },
      // Ecart brut = dotationComptable - amortissementFiscalDeductible
      ecartReintegration: {
        type: 'SUB',
        left: { type: 'var', path: 'asset.accountingDepreciation' },
        right: { type: 'var', path: 'amortissementFiscalDeductible' },
      },
    },
    in: {
      // Réintégration = MAX(0, ecartReintegration) arrondi à 2 décimales
      type: 'ROUND',
      operand: {
        type: 'MAX',
        left: { type: 'const', valueType: 'DEC', value: '0' },
        right: { type: 'var', path: 'ecartReintegration' },
      },
      scale: 2,
      mode: 'HALF_UP',
    },
  };

  it('calcule exactement le cas véhicule de tourisme 1 : coût 4.5M, dotation 900k, prorata 1 -> Réintégration 300 000 DA', () => {
    const context = {
      variables: {
        asset: {
          acquisitionCost: '4500000',
          amortizationYears: '5',
          accountingDepreciation: '900000',
          prorataTemporis: '1.0',
        },
      },
      parameters: {
        PARAM_PASSENGER_CAR_CEILING: '3000000',
      },
    };

    // 1. Évaluation via l'interprète de référence
    const interpResult = AstInterpreter.evaluate<EngineDecimal>(passengerCarRuleAst, context);
    expect(interpResult.value.toString()).toBe('300000');

    // 2. Évaluation via le compilateur en closure
    const compiledFn = AstCompiler.compile<EngineDecimal>(passengerCarRuleAst);
    const compiledResult = compiledFn(context);
    expect(compiledResult.toString()).toBe('300000');
  });

  it('calcule exactement le cas véhicule de tourisme 2 : coût 4.5M, dotation 900k, prorata 0.5 -> Réintégration 600 000 DA', () => {
    const context = {
      variables: {
        asset: {
          acquisitionCost: '4500000',
          amortizationYears: '5',
          accountingDepreciation: '900000',
          prorataTemporis: '0.5',
        },
      },
      parameters: {
        PARAM_PASSENGER_CAR_CEILING: '3000000',
      },
    };

    const compiledFn = AstCompiler.compile<EngineDecimal>(passengerCarRuleAst);
    const result = compiledFn(context);
    expect(result.toString()).toBe('600000');
  });

  it('calcule exactement le cas véhicule de tourisme 3 : coût 2.8M (< 3M), dotation 560k, prorata 1 -> Réintégration 0 DA', () => {
    const context = {
      variables: {
        asset: {
          acquisitionCost: '2800000',
          amortizationYears: '5',
          accountingDepreciation: '560000',
          prorataTemporis: '1.0',
        },
      },
      parameters: {
        PARAM_PASSENGER_CAR_CEILING: '3000000',
      },
    };

    const compiledFn = AstCompiler.compile<EngineDecimal>(passengerCarRuleAst);
    const result = compiledFn(context);
    expect(result.toString()).toBe('0');
  });

  it('exécute l\'arrondi ROUND HALF_UP 2 de 2.675 = 2.68 via l\'AST', () => {
    const ast: AstNode = {
      type: 'ROUND',
      operand: { type: 'const', valueType: 'DEC', value: '2.675' },
      scale: 2,
      mode: 'HALF_UP',
    };
    const res = AstInterpreter.evaluate<EngineDecimal>(ast, { variables: {}, parameters: {} });
    expect(res.value.toString()).toBe('2.68');

    const compiled = AstCompiler.compile<EngineDecimal>(ast);
    expect(compiled({ variables: {}, parameters: {} }).toString()).toBe('2.68');
  });

  it('calcule rigoureusement 0.1 * 10 = 1.0 via l\'AST sans dérive binaire', () => {
    const ast: AstNode = {
      type: 'MUL',
      left: { type: 'const', valueType: 'DEC', value: '0.1' },
      right: { type: 'const', valueType: 'DEC', value: '10' },
    };
    const res = AstInterpreter.evaluate<EngineDecimal>(ast, { variables: {}, parameters: {} });
    expect(res.value.toFixed(1)).toBe('1.0');
  });

  it('lève une exception de sécurité SecurityViolationError sur toute tentative d\'accès __proto__/constructor/prototype', () => {
    const maliciousAst: AstNode = {
      type: 'var',
      path: 'entry.__proto__.poison',
    };

    expect(() => {
      AstInterpreter.evaluate(maliciousAst, { variables: { entry: {} }, parameters: {} });
    }).toThrow(SecurityViolationError);

    expect(() => {
      AstCompiler.compile(maliciousAst)({ variables: { entry: {} }, parameters: {} });
    }).toThrow(SecurityViolationError);
  });

  it('génère et valide les traces d\'exécution en modes summary et full', () => {
    const ast: AstNode = {
      type: 'ADD',
      left: { type: 'const', valueType: 'DEC', value: '15' },
      right: { type: 'const', valueType: 'DEC', value: '25' },
    };

    const fullResult = AstInterpreter.evaluate(
      ast,
      { variables: {}, parameters: {} },
      { traceMode: 'full' }
    );
    expect(fullResult.traceSteps).toBeDefined();
    expect(fullResult.traceSteps?.length).toBeGreaterThan(0);
    expect(fullResult.operationsCount).toBe(3); // ADD + 2 const
  });

  it('exécute les lots via evaluateBatch', () => {
    const ast1: AstNode = { type: 'const', valueType: 'DEC', value: '10' };
    const ast2: AstNode = { type: 'const', valueType: 'DEC', value: '20' };

    const batchRes = AstInterpreter.evaluateBatch(
      [ast1, ast2],
      [{ variables: {}, parameters: {} }]
    );
    expect(batchRes.length).toBe(2);
    expect(batchRes[0].value.toString()).toBe('10');
    expect(batchRes[1].value.toString()).toBe('20');
  });

  it('exporte un JSON Schema syntaxiquement valide pour le Rule Studio', () => {
    const schema = exportAstJsonSchema();
    expect(schema).toBeDefined();
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(schema.title).toBe('DecisionEngineAstNode');
  });

  it('garantit par test de propriétés (fast-check) l\'équivalence stricte entre l\'Interprète et le Compilateur en closures', () => {
    // Générateur d'arbres arithmétiques aléatoires bien formés
    const leafGen: fc.Arbitrary<AstNode> = fc.integer({ min: -1000, max: 1000 }).map((n) => ({
      type: 'const',
      valueType: 'DEC',
      value: String(n),
    }));

    const treeGen = fc.memo((n) => {
      if (n <= 1) return leafGen;
      return fc.oneof(
        leafGen,
        fc.record({
          type: fc.constantFrom<'ADD', 'SUB', 'MUL'>('ADD', 'SUB', 'MUL'),
          left: treeGen(n - 1),
          right: treeGen(n - 1),
        })
      );
    });

    fc.assert(
      fc.property(treeGen(4), (tree) => {
        const ctx = { variables: {}, parameters: {} };
        const interpVal = AstInterpreter.evaluate<EngineDecimal>(tree, ctx).value;
        const compiledVal = AstCompiler.compile<EngineDecimal>(tree)(ctx);
        return interpVal.equals(compiledVal);
      }),
      { numRuns: 1000, seed: 42 }
    );
  });
});

