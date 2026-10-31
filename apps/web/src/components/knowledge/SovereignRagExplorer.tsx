'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
  Wrench,
  Gauge,
  Cpu,
  RefreshCw,
  SlidersHorizontal,
  FileCheck,
} from 'lucide-react';

interface StructuredSpecs {
  [key: string]: any;
}

interface SearchResult {
  id: string;
  category: string;
  manufacturer: string;
  model_series: string;
  subsystem: string;
  section_title: string;
  content: string;
  structured_specs: StructuredSpecs;
  lexical_rank: number;
  semantic_rank: number;
  rrf_score: number;
}

const QUICK_PRESETS = [
  { label: 'Culasse Kerax 440 (Couples Nm)', query: 'couple de serrage culasse kerax 440' },
  { label: 'DTC P0087 Shacman Common Rail', query: 'P0087 shacman pression rampe faible' },
  { label: 'Contrôle Freinage ENACTA (Décret 03-223)', query: 'seuil déséquilibre freinage ENACTA' },
  { label: 'DTC SPN 3216 FMI 14 Sonde NOx', query: 'SPN 3216 FMI 14 sonde nox' },
  { label: 'Disques Actros SN7 & Épaisseurs', query: 'usure plaquettes actros sn7' },
];

export function SovereignRagExplorer({ token }: { token?: string | null }) {
  const [query, setQuery] = useState('couple de serrage culasse kerax 440');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');
  const [includeSynthesis, setIncludeSynthesis] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [executionMs, setExecutionMs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const executeSearch = async (targetQuery?: string) => {
    const q = targetQuery !== undefined ? targetQuery : query;
    if (!q.trim()) return;

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/api/v1/sovereign-rag/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: q,
          subsystem: selectedSubsystem === 'ALL' ? undefined : selectedSubsystem,
          include_synthesis: includeSynthesis,
          limit: 4,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSynthesis(data.synthesis || null);
        setExecutionMs(data.execution_ms || 0);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche RAG:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedCatalog = async () => {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/v1/sovereign-rag/seed`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setSeedStatus(`Catalogue amorcé : ${data.inserted} manuels ajoutés (${data.total} au total).`);
        executeSearch();
      } else {
        setSeedStatus('Erreur lors de l’amorçage du catalogue.');
      }
    } catch (err) {
      setSeedStatus('Impossible de joindre le service RAG.');
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [selectedSubsystem]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">
              Pilier 3 : RAG Hybride Souverain & Reciprocal Rank Fusion (RRF)
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
              BM25 + pg_trgm + JSONB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recherche technique déterministe sous les 20 ms : Manuels constructeurs (Kerax 440, Shacman WP12, Actros) & Barème ENACTA Algérie.
          </p>
        </div>

        <button
          onClick={handleSeedCatalog}
          disabled={isSeeding}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          {isSeeding ? 'Amorçage...' : 'Amorcer Catalogue OEM/ENACTA'}
        </button>
      </div>

      {seedStatus && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          {seedStatus}
        </div>
      )}

      {/* Barre de Recherche & Filtres */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
              placeholder="Ex: couple de serrage culasse kerax, P0087 shacman, déséquilibre freinage ENACTA..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => executeSearch()}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </div>

        {/* Boutons Rapides */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Exemples DZ :
          </span>
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(preset.query);
                executeSearch(preset.query);
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Synthèse Optionnelle Qwen */}
      {synthesis && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Synthèse Technique Décisionnelle (Qwen 2.5)
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{synthesis}</p>
        </div>
      )}

      {/* Résultats RRF */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{results.length} fiche(s) technique(s) identifiée(s)</span>
          {executionMs > 0 && <span>Temps d'exécution RRF SQL : {executionMs} ms</span>}
        </div>

        {results.length === 0 && !isLoading && (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Aucun manuel technique ou barème trouvé. Cliquez sur "Amorcer Catalogue OEM/ENACTA" pour charger la base de données.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {results.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                    {item.manufacturer}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{item.model_series}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-emerald-400 font-medium">{item.subsystem}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Score RRF : </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {item.rrf_score.toFixed(5)}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-mono bg-slate-800 text-slate-300 rounded">
                    BM25 #{item.lexical_rank} | Trgm #{item.semantic_rank}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">{item.section_title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                  {item.content}
                </p>
              </div>

              {/* Spécifications Métriques JSONB Extraites */}
              {item.structured_specs && Object.keys(item.structured_specs).length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    Spécifications Numériques Déterministes (Garde-Fou Sans Hallucination) :
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {Object.entries(item.structured_specs).map(([k, v]) => (
                      <div
                        key={k}
                        className="bg-slate-900 p-2 rounded-lg border border-slate-800/80 text-xs"
                      >
                        <span className="text-slate-400 block text-[10px] uppercase font-mono truncate">
                          {k.replace(/_/g, ' ')}
                        </span>
                        <span className="text-emerald-300 font-mono font-semibold">
                          {Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'OUI' : 'NON') : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
