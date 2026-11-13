import React, { useState } from 'react';
import { StudioPack } from '../../types/studio';
import { GitCompare, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

interface PacksDiffTabProps {
  packs: StudioPack[];
  onSelectPackForEdit: (packId: string) => void;
}

export const PacksDiffTab: React.FC<PacksDiffTabProps> = ({
  packs,
  onSelectPackForEdit,
}) => {
  const [packAId, setPackAId] = useState<string>(packs[0]?.id || '');
  const [packBId, setPackBId] = useState<string>(packs[1]?.id || '');

  const packA = packs.find((p) => p.id === packAId) || packs[0];
  const packB = packs.find((p) => p.id === packBId) || packs[1];

  // Calcul du diff sémantique entre pack A et pack B
  const codesA = new Set(packA.items.map((i) => i.code));
  const codesB = new Set(packB.items.map((i) => i.code));

  const itemsOnlyInA = packA.items.filter((i) => !codesB.has(i.code));
  const itemsOnlyInB = packB.items.filter((i) => !codesA.has(i.code));

  const commonItemsModified = packB.items
    .filter((itemB) => {
      const itemA = packA.items.find((i) => i.code === itemB.code);
      if (!itemA) return false;
      return JSON.stringify(itemA.valueJson) !== JSON.stringify(itemB.valueJson);
    })
    .map((itemB) => {
      const itemA = packA.items.find((i) => i.code === itemB.code)!;
      return { itemA, itemB };
    });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            Catalogue des Packs Réglementaires & Diff Bi-Temporel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparez l évolution normative entre deux lois de finances et visualisez « ce qui change » au centime près.
          </p>
        </div>

        {/* Diff Selectors */}
        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
          <span className="text-slate-400">Comparer :</span>
          <select
            value={packAId}
            onChange={(e) => setPackAId(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none"
          >
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.version} ({p.status})
              </option>
            ))}
          </select>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={packBId}
            onChange={(e) => setPackBId(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none"
          >
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.version} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Packs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packs.map((pack) => {
          const isPublished = pack.status === 'PUBLISHED';
          const isDraft = pack.status === 'DRAFT';
          return (
            <div
              key={pack.id}
              className={`p-4 rounded-xl border transition-all ${
                isPublished
                  ? 'bg-slate-900/60 border-emerald-800/40'
                  : isDraft
                  ? 'bg-slate-900/40 border-amber-800/40'
                  : 'bg-slate-900/20 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isPublished
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : isDraft
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {pack.status}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {pack.items.length} items
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white mt-2">
                {pack.titleFr}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">{pack.version}</p>

              <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Effet : {pack.validFrom} → {pack.validTo ?? 'Indéfini'}</span>
                </div>
                {pack.signature && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="font-mono text-[10px] truncate max-w-[200px]">
                      Signé Ed25519 ({pack.signature.slice(0, 16)}...)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Par {pack.authorName.split(' ')[0]}</span>
                <button
                  onClick={() => onSelectPackForEdit(pack.id)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
                >
                  Inspecter & Éditer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diff View — « Ce qui change » */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>Rapport de Diff :</span>
              <span className="font-mono text-blue-400">{packA.version}</span>
              <span className="text-slate-500">vers</span>
              <span className="font-mono text-emerald-400">{packB.version}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Analyse automatique des règles et paramètres modifiés, créés ou abrogés.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
              +{itemsOnlyInB.length} ajout(s)
            </span>
            <span className="bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800">
              ~{commonItemsModified.length} modification(s)
            </span>
            <span className="bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800">
              -{itemsOnlyInA.length} retrait(s)
            </span>
          </div>
        </div>

        {/* Diff List */}
        <div className="space-y-3">
          {/* Modified */}
          {commonItemsModified.map(({ itemA, itemB }) => (
            <div
              key={itemB.code}
              className="p-3 rounded-lg bg-slate-950/60 border border-blue-900/30 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-300">{itemB.code}</span>
                <span className="text-slate-400">{itemB.labelFr}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Valeur ({packA.version}) :</span>
                  <pre className="text-rose-400 overflow-x-auto">
                    {typeof itemA.valueJson === 'object'
                      ? JSON.stringify(itemA.valueJson, null, 2)
                      : String(itemA.valueJson)}
                  </pre>
                </div>
                <div>
                  <span className="text-slate-500 block">Nouvelle Valeur ({packB.version}) :</span>
                  <pre className="text-emerald-400 overflow-x-auto">
                    {typeof itemB.valueJson === 'object'
                      ? JSON.stringify(itemB.valueJson, null, 2)
                      : String(itemB.valueJson)}
                  </pre>
                </div>
              </div>
            </div>
          ))}

          {/* Added */}
          {itemsOnlyInB.map((item) => (
            <div
              key={item.code}
              className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono font-bold text-emerald-400">{item.code}</span>
                <span className="text-slate-300 ml-2">({item.labelFr})</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Réf : {item.legalRef}</p>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Nouveau dans {packB.version}
              </span>
            </div>
          ))}

          {/* Removed / Superseded */}
          {itemsOnlyInA.map((item) => (
            <div
              key={item.code}
              className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono font-bold text-rose-400">{item.code}</span>
                <span className="text-slate-400 ml-2">({item.labelFr})</span>
              </div>
              <span className="text-xs font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                Non reconduit dans {packB.version}
              </span>
            </div>
          ))}

          {commonItemsModified.length === 0 && itemsOnlyInA.length === 0 && itemsOnlyInB.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              Aucune différence détectée entre ces deux versions de packs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
