/**
 * Harness de Benchmark du Moteur Décisionnel (@docteurflotte/decision-engine)
 * Mesure les débits et latences : Arithmétique Decimal, Bi-temporalité, Calendrier Algérie,
 * et Évaluation d'une règle AST de 20 nœuds (1 000 000 d'itérations).
 * Commande : pnpm bench
 */

const {
  EngineMath,
  AlgeriaCalendar,
  isBiTemporallyActive,
  AstCompiler,
  AstInterpreter,
  CashAuditLedger,
  BenfordAdvancedAnalyzer,
  computeEntryHash,
} = require('../packages/decision-engine/dist');

function runBenchmark() {
  console.log('================================================================');
  console.log(' BENCHMARK HARNESS — DECISION ENGINE (PHASE 0, 1 & 2)');
  console.log('================================================================\n');

  const results = [];
  const startMem = process.memoryUsage().heapUsed;

  // 1. Arithmétique Exacte Decimal.js (1 000 000 opérations)
  {
    const N = 1000000;
    const a = EngineMath.from('12345.67');
    const b = EngineMath.from('89.1234');
    const t0 = performance.now();

    for (let i = 0; i < N; i++) {
      const sum = a.plus(b);
      const scaled = EngineMath.asAmount(sum);
      if (scaled.isZero()) console.log(scaled);
    }

    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'Decimal.js exact arithmetic (plus + asAmount)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  // 2. Division Sécurisée avec Clause onZero (500 000 opérations)
  {
    const N = 500000;
    const num = EngineMath.from('987654.321');
    const den = EngineMath.from('12.5');
    const t0 = performance.now();

    for (let i = 0; i < N; i++) {
      const res = EngineMath.divide(num, den, 'ERROR');
      if (!res) console.log(res);
    }

    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'Safe Decimal Division (divide with onZero=ERROR)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  // 3. Résolution Bi-temporelle Pure (500 000 évaluations)
  {
    const N = 500000;
    const coord = {
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      recordedAt: '2026-01-15T00:00:00.000Z',
      supersededAt: null,
    };
    const query = {
      asOf: '2026-06-15',
      knownAt: '2026-08-01T00:00:00.000Z',
    };

    const t0 = performance.now();
    let matches = 0;
    for (let i = 0; i < N; i++) {
      if (isBiTemporallyActive(coord, query)) {
        matches++;
      }
    }
    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'Pure Bi-temporal Visibility Filter (isBiTemporallyActive)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  // 4. Calendrier Algérie (Africa/Algiers) conversion YYYY-MM-DD (100 000 opérations)
  {
    const N = 100000;
    const testDate = new Date('2026-03-14T23:30:00.000Z');
    const t0 = performance.now();

    for (let i = 0; i < N; i++) {
      const local = AlgeriaCalendar.toLocalDate(testDate);
      if (local === '') console.log(local);
    }

    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'Algeria Calendar Timezone (Africa/Algiers toLocalDate)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  // 5. PHASE 2 BENCHMARK : 1 000 000 d'évaluations d'une règle AST de 20 nœuds (Compilateur Closure)
  {
    const N = 1000000;
    // Règle de 20 nœuds : amortissement fiscal véhicule de tourisme avec calcul d'écart, min, div, mul, round
    const rule20Nodes = {
      type: 'LET',
      bindings: {
        baseFiscale: {
          type: 'MIN',
          left: { type: 'var', path: 'asset.cost' },
          right: { type: 'param', paramCode: 'PARAM_CEILING' },
        },
        amortDeductible: {
          type: 'MUL',
          left: {
            type: 'DIV',
            left: { type: 'var', path: 'baseFiscale' },
            right: { type: 'var', path: 'asset.years' },
            on_zero: 'ERROR',
          },
          right: { type: 'var', path: 'asset.prorata' },
        },
        ecart: {
          type: 'SUB',
          left: { type: 'var', path: 'asset.depreciation' },
          right: { type: 'var', path: 'amortDeductible' },
        },
      },
      in: {
        type: 'ROUND',
        operand: {
          type: 'MAX',
          left: { type: 'const', valueType: 'DEC', value: '0' },
          right: { type: 'var', path: 'ecart' },
        },
        scale: 2,
        mode: 'HALF_UP',
      },
    };

    const context = {
      variables: {
        asset: {
          cost: '4500000',
          years: '5',
          depreciation: '900000',
          prorata: '1.0',
        },
      },
      parameters: {
        PARAM_CEILING: '3000000',
      },
    };

    const compiledFn = AstCompiler.compile(rule20Nodes);
    const t0 = performance.now();

    for (let i = 0; i < N; i++) {
      const res = compiledFn(context);
      if (res.isZero()) console.log(res);
    }

    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'Compiled AST Rule (20 nodes, 1M eval, target < 60s)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  // 6. PHASE 3 BENCHMARK : Chaînage Cryptographique SHA-256 du Grand Livre (100 000 écritures)
  {
    const N = 100000;
    let prevHash = '0'.repeat(64);
    const t0 = performance.now();

    for (let i = 0; i < N; i++) {
      prevHash = computeEntryHash({
        prevHash,
        tenantId: 't-bench-tenant',
        pieceNumber: `FAC-2026-${i}`,
        lineNumber: 1,
        localDate: '2026-10-15',
        accountNumber: '411100',
        accountRole: 'CLIENT',
        debit: '11900.00',
        credit: null,
        amountHt: '10000.00',
        vatAmount: '1900.00',
        paymentMode: 'BANK',
        collectionDate: null,
        segmentCode: 'TRANSPORT',
        packHash: 'DZ_LF_2026_SEALED',
      });
    }

    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'Continuous SHA-256 Ledger Line Hashing (RFC 8785)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  // 7. AUD-01 : Auditeur de Caisse Déterministe Haut Débit (100 000 mouvements de caisse)
  {
    const N = 100000;
    const entries = [];
    const baseDate = new Date('2026-01-01T08:00:00.000Z').getTime();
    for (let i = 0; i < N; i++) {
      const utcTime = new Date(baseDate + i * 60000).toISOString();
      const isReceipt = i % 3 !== 0;
      entries.push({
        id: `CASH-${i}`,
        utcRecordedAt: utcTime,
        pieceNumber: `PC-${Math.floor(i / 10)}`,
        lineNumber: (i % 10) + 1,
        label: isReceipt ? 'Recette client' : 'Paiement fournisseur',
        debitCash: isReceipt ? '1500.00' : '0.00',
        creditCash: isReceipt ? '0.00' : '1200.00',
      });
    }

    const t0 = performance.now();
    const index = CashAuditLedger.buildIndex(entries, '50000.00');
    const evalRes = CashAuditLedger.evaluate(index, { indicativeTaxRate: '0.25' });
    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'AUD-01 Cash Audit Ledger (100k rows, build + evaluate)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  // 8. AUD-06 : Analyse de Benford Avancée (10 000 observations synthétiques)
  {
    const N = 10000;
    const amounts = [];
    let state = 123456789;
    const logMin = Math.log10(100);
    const logMax = Math.log10(1000000);
    for (let i = 0; i < N; i++) {
      state = (1664525 * state + 1013904223) % 4294967296;
      const u = state / 4294967296;
      amounts.push(Number(Math.pow(10, logMin + u * (logMax - logMin)).toFixed(2)));
    }

    const t0 = performance.now();
    const res = BenfordAdvancedAnalyzer.analyze(amounts, { testType: 'FIRST_DIGIT' });
    const t1 = performance.now();
    const elapsedMs = t1 - t0;
    const opsPerSec = Math.round((N / elapsedMs) * 1000);
    const avgLatencyUs = Number(((elapsedMs * 1000) / N).toFixed(3));

    results.push({
      name: 'AUD-06 Benford 1st Digit Analysis (10k amounts)',
      iterations: N,
      elapsedMs: Number(elapsedMs.toFixed(2)),
      opsPerSec,
      avgLatencyUs,
    });
  }

  const endMem = process.memoryUsage().heapUsed;
  const memDeltaMb = Number(((endMem - startMem) / (1024 * 1024)).toFixed(2));

  console.log('| Scénario de Bench | Itérations | Durée (ms) | Débit (ops/s) | Latence moy (µs) |');
  console.log('| :--- | :---: | :---: | :---: | :---: |');
  results.forEach((r) => {
    console.log(`| ${r.name} | ${r.iterations.toLocaleString('fr-FR')} | ${r.elapsedMs} ms | ${r.opsPerSec.toLocaleString('fr-FR')} ops/s | ${r.avgLatencyUs} µs |`);
  });
  console.log(`\nDelta Mémoire Heap Utilisée : ${memDeltaMb} MB\n`);

  return results;
}

runBenchmark();
