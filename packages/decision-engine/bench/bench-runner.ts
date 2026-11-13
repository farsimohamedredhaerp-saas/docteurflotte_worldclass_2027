/**
 * Harness de Benchmark du Moteur Décisionnel (@docteurflotte/decision-engine)
 * Mesure les débits et latences : Arithmétique Decimal, Bi-temporalité, Calendrier Algérie.
 */

import { EngineMath, AlgeriaCalendar, isBiTemporallyActive, BiTemporalCoordinates, BiTemporalQuery } from '../src/index.ts';

export interface BenchMetric {
  name: string;
  iterations: number;
  elapsedMs: number;
  opsPerSec: number;
  avgLatencyUs: number;
}

export function runBenchmark(): BenchMetric[] {
  console.log('================================================================');
  console.log(' BENCHMARK HARNESS — DECISION ENGINE (PHASE 0 SOCLE)');
  console.log('================================================================\n');

  const results: BenchMetric[] = [];
  const startMem = process.memoryUsage().heapUsed;

  // 1. Arithmétique Exacte Decimal.js (1 000 000 opérations)
  {
    const N = 1_000_000;
    const a = EngineMath.from('12345.67');
    const b = EngineMath.from('89.1234');
    const t0 = performance.now();

    for (let i = 0; i < N; i++) {
      const sum = a.plus(b);
      const scaled = EngineMath.asAmount(sum);
      // Éviter l'optimisation par le compilateur
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
    const N = 500_000;
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
    const N = 500_000;
    const coord: BiTemporalCoordinates = {
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      recordedAt: '2026-01-15T00:00:00.000Z',
      supersededAt: null,
    };
    const query: BiTemporalQuery = {
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
    const N = 100_000;
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

  const endMem = process.memoryUsage().heapUsed;
  const memDeltaMb = Number(((endMem - startMem) / (1024 * 1024)).toFixed(2));

  // Affichage du tableau récapitulatif
  console.log('| Scénario de Bench | Itérations | Durée (ms) | Débit (ops/s) | Latence moy (µs) |');
  console.log('| :--- | :---: | :---: | :---: | :---: |');
  results.forEach((r) => {
    console.log(`| ${r.name} | ${r.iterations.toLocaleString('fr-FR')} | ${r.elapsedMs} ms | ${r.opsPerSec.toLocaleString('fr-FR')} ops/s | ${r.avgLatencyUs} µs |`);
  });
  console.log(`\nDelta Mémoire Heap Utilisée : ${memDeltaMb} MB\n`);

  return results;
}

if (process.argv[1]?.includes('bench-runner')) {
  runBenchmark();
}
