import React, { useState } from 'react';
import { StudioPack, StudioPackItem } from '../../types/studio';
import {
  AstStaticValidator,
  exportAstJsonSchema,
  RegPackItemKind,
} from '@docteurflotte/decision-engine';
import { Code2, CheckCircle2, AlertOctagon, HelpCircle, Save, Layers } from 'lucide-react';

interface RuleEditorTabProps {
  packs: StudioPack[];
  activePackId: string;
  onUpdateRuleItem: (packId: string, item: StudioPackItem) => void;
}

export const RuleEditorTab: React.FC<RuleEditorTabProps> = ({
  packs,
  activePackId,
  onUpdateRuleItem,
}) => {
  const currentPack = packs.find((p) => p.id === activePackId) || packs[0];
  const ruleItems = currentPack.items.filter((i) => i.kind === RegPackItemKind.RULE);

  const [selectedRuleCode, setSelectedRuleCode] = useState<string>(
    ruleItems[0]?.code || ''
  );
  const activeRule = ruleItems.find((r) => r.code === selectedRuleCode) || ruleItems[0];

  const [jsonText, setJsonText] = useState<string>(
    activeRule ? JSON.stringify(activeRule.valueJson, null, 2) : '{}'
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [showSchemaModal, setShowSchemaModal] = useState<boolean>(false);

  // Validation en temps réel avec AstStaticValidator
  let validationResult = {
    isValid: false,
    depth: 0,
    nodeCount: 0,
    errors: [] as string[],
    referencedParameters: [] as string[],
  };

  try {
    const parsed = JSON.parse(jsonText);
    const availableParams = new Set(
      currentPack.items.filter((i) => i.kind === RegPackItemKind.PARAMETER).map((p) => p.code)
    );
    validationResult = AstStaticValidator.validate(parsed, availableParams);
    if (parseError) setParseError(null);
  } catch (e: any) {
    if (!parseError) setParseError(`Erreur syntaxique JSON : ${e.message}`);
  }

  const handleSelectRule = (code: string) => {
    setSelectedRuleCode(code);
    const r = ruleItems.find((item) => item.code === code);
    if (r) {
      setJsonText(JSON.stringify(r.valueJson, null, 2));
      setParseError(null);
    }
  };

  const handleSave = () => {
    if (!activeRule) return;
    try {
      const parsed = JSON.parse(jsonText);
      const updated: StudioPackItem = {
        ...activeRule,
        valueJson: parsed,
      };
      onUpdateRuleItem(currentPack.id, updated);
      alert(`Règle ${activeRule.code} sauvegardée avec succès.`);
    } catch (e: any) {
      alert(`Impossible d'enregistrer : JSON invalide (${e.message}).`);
    }
  };

  const astSchema = exportAstJsonSchema();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            Éditeur de Règles AST & Validation JSON Schema
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Édition déclarative des règles de contrôle comptable et fiscal validées statiquement (budgets, sécurité, clause on_zero).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSchemaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>JSON Schema AST Draft-07</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!validationResult.isValid || parseError !== null}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer la Règle</span>
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Rules Sidebar */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Règles du Pack ({currentPack.version})
          </h3>
          <div className="space-y-1.5">
            {ruleItems.map((r) => {
              const isSelected = r.code === selectedRuleCode;
              return (
                <button
                  key={r.code}
                  onClick={() => handleSelectRule(r.code)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-600 text-white font-medium'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <p className="font-mono font-bold text-[11px] truncate text-blue-300">
                    {r.code}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.labelFr}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* JSON Editor & Static Validation */}
        <div className="lg:col-span-3 space-y-4">
          {activeRule ? (
            <>
              {/* Rule Metadata Bar */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-sm text-blue-400">
                    {activeRule.code}
                  </span>
                  <span className="text-slate-400 ml-2">— {activeRule.labelFr}</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Base légale : <span className="text-slate-300">{activeRule.legalRef}</span> |
                    Niveau : <span className="text-slate-300">{activeRule.evidenceLevel}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-official">
                    {activeRule.verificationStatus}
                  </span>
                  {activeRule.severity && (
                    <span className="bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {activeRule.severity}
                    </span>
                  )}
                </div>
              </div>

              {/* Editor + Real-time Lint Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Code text area */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Structure AST Déclarative (JSON) :</span>
                    <span className="font-mono text-[11px]">
                      {jsonText.split('\n').length} lignes
                    </span>
                  </div>
                  <textarea
                    rows={18}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="code-editor"
                    spellCheck={false}
                  />
                  {parseError && (
                    <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>

                {/* Real-time Diagnostics Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
                  <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-2">
                    Diagnostic Statique
                  </h4>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Statut de validation :</span>
                      {validationResult.isValid ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CONFORME
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          ERREURS ({validationResult.errors.length})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Profondeur d arbre :</span>
                      <span className="font-mono text-slate-200">
                        {validationResult.depth} / 32 max
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nombre de nœuds :</span>
                      <span className="font-mono text-slate-200">
                        {validationResult.nodeCount} / 2 000 max
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">
                        Paramètres référencés ({validationResult.referencedParameters.length}) :
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {validationResult.referencedParameters.map((p) => (
                          <span
                            key={p}
                            className="bg-slate-800 text-blue-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-700"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {validationResult.errors.length > 0 && (
                      <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg space-y-1 mt-3">
                        <span className="text-[11px] font-bold text-rose-400 block">
                          Violation des contraintes AST :
                        </span>
                        {validationResult.errors.map((err, idx) => (
                          <p key={idx} className="text-[11px] text-rose-300">
                            • {err}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              Aucune règle sélectionnée.
            </div>
          )}
        </div>
      </div>

      {/* JSON Schema Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl p-5 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                JSON Schema Formel AST (Draft-07)
              </h3>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Fermer ✕
              </button>
            </div>
            <textarea
              readOnly
              rows={16}
              value={JSON.stringify(astSchema, null, 2)}
              className="code-editor flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};
