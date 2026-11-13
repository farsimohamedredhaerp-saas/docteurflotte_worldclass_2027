import React, { useState } from 'react';
import { StudioPack } from '../../types/studio';
import {
  AstInterpreter,
  EngineDecimal,
  RegPackItemKind,
} from '@docteurflotte/decision-engine';
import { PlayCircle, Clock, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

interface SandboxTabProps {
  packs: StudioPack[];
  activePackId: string;
}

export const SandboxTab: React.FC<SandboxTabProps> = ({ packs, activePackId }) => {
  const currentPack = packs.find((p) => p.id === activePackId) || packs[0];
  const rules = currentPack.items.filter((i) => i.kind === RegPackItemKind.RULE);

  const [selectedRuleCode, setSelectedRuleCode] = useState<string>(rules[0]?.code || '');
  const activeRule = rules.find((r) => r.code === selectedRuleCode) || rules[0];

  // Default test context
  const defaultVariables = activeRule?.goldenTests?.[0]?.inputs ?? {
    hasSeparateAccounting: true,
    profitProd: '5000000.00',
    profitBtph: '3000000.00',
    profitOther: '2000000.00',
  };

  const [variablesJson, setVariablesJson] = useState<string>(
    JSON.stringify(defaultVariables, null, 2)
  );

  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    outputValue?: string;
    durationUs: number;
    trace?: any;
    error?: string;
  } | null>(null);

  const handleRunSimulation = () => {
    if (!activeRule) return;
    const t0 = performance.now();
    try {
      const vars = JSON.parse(variablesJson);

      // Collect available parameters from current pack
      const paramMap: Record<string, string> = {};
      currentPack.items
        .filter((i) => i.kind === RegPackItemKind.PARAMETER)
        .forEach((p) => {
          paramMap[p.code] = String(p.valueJson);
        });

      const context = {
        variables: vars,
        parameters: paramMap,
      };

      const result = AstInterpreter.evaluate(activeRule.valueJson, context);
      const t1 = performance.now();
      const durationUs = Math.round((t1 - t0) * 1000);

      const outStr =
        result instanceof EngineDecimal
          ? result.toFixed(2)
          : typeof result === 'object'
          ? JSON.stringify(result)
          : String(result);

      setExecutionResult({
        success: true,
        outputValue: outStr,
        durationUs,
        trace: {
          ruleCode: activeRule.code,
          packVersion: currentPack.version,
          executionDurationUs: durationUs,
          evaluationTimestamp: new Date().toISOString(),
          outcome: 'COMPLIANT',
          legalRef: activeRule.legalRef,
          evidenceLevel: activeRule.evidenceLevel,
          parametersRead: paramMap,
          inputs: vars,
        },
      });
    } catch (e: any) {
      const t1 = performance.now();
      setExecutionResult({
        success: false,
        durationUs: Math.round((t1 - t0) * 1000),
        error: e.message,
      });
    }
  };

  const handleApplyGoldenTest = (gt: { name: string; inputs: Record<string, any> }) => {
    setVariablesJson(JSON.stringify(gt.inputs, null, 2));
    setExecutionResult(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-emerald-400" />
            Bac à Sable d Exécution & Traçabilité Temps Réel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Évaluez l exécution pure et déterministe d une règle sur des entrées arbitraires ou des jeux dorés avec capture intégrale de la trace d explicabilité.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Exécuter la Simulation</span>
        </button>
      </div>

      {/* Select Rule & Golden tests */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Règle à évaluer :</span>
          <select
            value={selectedRuleCode}
            onChange={(e) => {
              setSelectedRuleCode(e.target.value);
              const r = rules.find((item) => item.code === e.target.value);
              if (r?.goldenTests?.[0]) {
                setVariablesJson(JSON.stringify(r.goldenTests[0].inputs, null, 2));
              }
              setExecutionResult(null);
            }}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono focus:outline-none"
          >
            {rules.map((r) => (
              <option key={r.code} value={r.code}>
                {r.code} — {r.labelFr}
              </option>
            ))}
          </select>
        </div>

        {/* Golden test buttons */}
        {activeRule?.goldenTests && activeRule.goldenTests.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Jeux dorés :</span>
            {activeRule.goldenTests.map((gt, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyGoldenTest(gt)}
                className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 transition-colors font-medium"
              >
                {gt.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid : Inputs vs Outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input variables JSON */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              Variables d Activité d Entrée (JSON)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Africa/Algiers</span>
          </div>
          <textarea
            rows={14}
            value={variablesJson}
            onChange={(e) => setVariablesJson(e.target.value)}
            className="code-editor"
            placeholder='{ "hasSeparateAccounting": true, ... }'
          />
        </div>

        {/* Execution Output & Trace */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Résultat d Évaluation & Trace Décisionnelle
            </span>
            {executionResult && (
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {executionResult.durationUs} µs
              </span>
            )}
          </div>

          {executionResult ? (
            executionResult.success ? (
              <div className="space-y-4 text-xs">
                {/* Result Card */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      Valeur Calculée Déterministe :
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                      {executionResult.outputValue} DA
                    </span>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>

                {/* Explicability Trace Details */}
                <div className="space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block border-b border-slate-800 pb-1">
                    Trace d Explicabilité Intégrale (RÈGLE 5) :
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                    <div>Règle : <span className="text-slate-200">{executionResult.trace.ruleCode}</span></div>
                    <div>Pack : <span className="text-slate-200">{executionResult.trace.packVersion}</span></div>
                    <div>Réf Légale : <span className="text-slate-200">{executionResult.trace.legalRef}</span></div>
                    <div>Preuve : <span className="text-slate-200">{executionResult.trace.evidenceLevel}</span></div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-500 block mb-1">Paramètres du pack injectés :</span>
                    <pre className="text-slate-300 font-mono text-[10px] overflow-x-auto bg-slate-900 p-2 rounded">
                      {JSON.stringify(executionResult.trace.parametersRead, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Échec de l évaluation AST :</span>
                </div>
                <p className="font-mono text-[11px]">{executionResult.error}</p>
              </div>
            )
          ) : (
            <div className="p-12 text-center text-slate-500">
              Cliquez sur « Exécuter la Simulation » pour évaluer la règle sélectionnée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
