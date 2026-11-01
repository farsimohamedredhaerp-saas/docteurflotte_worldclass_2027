'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
  Wrench,
  Gauge,
  RefreshCw,
  SlidersHorizontal,
  FileCheck,
  CheckCircle2,
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
  is_web_fallback?: boolean;
}

const QUICK_PRESETS = [
  { label: 'Culasse Kerax 440 (Couples Nm)', query: 'couple de serrage culasse kerax 440' },
  { label: 'DTC P0087 Shacman Common Rail', query: 'P0087 shacman pression rampe' },
  { label: 'Contrôle Freinage ENACTA (Décret 03-223)', query: 'seuil déséquilibre freinage ENACTA' },
  { label: 'DTC SPN 3216 FMI 14 Sonde NOx', query: 'SPN 3216 FMI 14 sonde nox' },
  { label: 'Disques Actros SN7 & Épaisseurs', query: 'usure plaquettes actros sn7' },
];

export function SovereignRagExplorer({ token }: { token?: string | null }) {
  const [query, setQuery] = useState('couple de serrage culasse kerax 440');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');
  const [includeSynthesis, setIncludeSynthesis] = useState(true);
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [webSearchApplied, setWebSearchApplied] = useState(false);
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
    setWebSearchApplied(false);
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
          enable_web_search: enableWebSearch,
          limit: 4,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSynthesis(data.synthesis || null);
        setExecutionMs(data.execution_ms || 0);
        setWebSearchApplied(Boolean(data.web_search_applied));
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
    <div
      style={{
        background: '#FFFFFF',
        color: '#0F172A',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* ── EN-TÊTE DU BLOC ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Pilier 3 : RAG Hybride Souverain &amp; Reciprocal Rank Fusion (RRF)
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                }}
              >
                BM25 + pg_trgm + JSONB
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Recherche technique déterministe sous les 20 ms : Manuels constructeurs (Kerax 440, Shacman WP12, Actros) &amp; Barème ENACTA Algérie.
            </div>
          </div>
        </div>

        <button
          onClick={handleSeedCatalog}
          disabled={isSeeding}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            fontSize: '12px',
            fontWeight: 800,
            borderRadius: '8px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: '1px solid #334155',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <RefreshCw size={14} color="#FFFFFF" className={isSeeding ? 'animate-spin' : ''} />
          <span style={{ color: '#FFFFFF', fontWeight: 800 }}>
            {isSeeding ? 'Amorçage...' : 'Amorcer Catalogue OEM/ENACTA'}
          </span>
        </button>
      </div>

      {seedStatus && (
        <div
          style={{
            padding: '10px 14px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color="#16a34a" />
          {seedStatus}
        </div>
      )}

      {/* ── BARRE DE RECHERCHE & PRESETS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748B' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
              placeholder="Ex: couple de serrage culasse kerax, P0087 shacman, seuil déséquilibre freinage ENACTA..."
              style={{
                width: '100%',
                background: '#F8FAFC',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '9px 12px 9px 38px',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={() => executeSearch()}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 24px',
              backgroundColor: '#047857',
              color: '#FFFFFF',
              border: '1px solid #065F46',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.3)',
            }}
          >
            {isLoading ? <RefreshCw size={16} color="#FFFFFF" className="animate-spin" /> : <Search size={16} color="#FFFFFF" />}
            <span style={{ color: '#FFFFFF', fontWeight: 800 }}>Rechercher</span>
          </button>
        </div>

        {/* Options de recherche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, color: '#1E40AF' }}>
            <input
              type="checkbox"
              checked={enableWebSearch}
              onChange={(e) => setEnableWebSearch(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
            />
            🌐 Recherche Web / Internet Approfondie (Auto-Ingestion en Coffre Souverain)
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
            <input
              type="checkbox"
              checked={includeSynthesis}
              onChange={(e) => setIncludeSynthesis(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
            />
            ✨ Synthèse Technique Qwen 2.5
          </label>
        </div>

        {/* Exemples rapides cliquables */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <SlidersHorizontal size={13} color="#334155" /> Exemples Algérie :
          </span>
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(preset.query);
                executeSearch(preset.query);
              }}
              style={{
                backgroundColor: '#F1F5F9',
                color: '#0F172A',
                border: '1px solid #94A3B8',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SYNTHÈSE TECHNIQUE QWEN ── */}
      {synthesis && (
        <div
          style={{
            padding: '14px 18px',
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> Synthèse Technique Décisionnelle (Qwen 2.5 Local)
          </div>
          <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.6' }}>{synthesis}</div>
        </div>
      )}

      {/* ── LISTE DES RÉSULTATS HYBRIDES RRF ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {webSearchApplied && (
          <div
            style={{
              padding: '10px 14px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={16} color="#2563EB" />
            <span>
              <strong>Recherche Web Souveraine Active :</strong> Les informations techniques ont été recherchées sur Internet, synthétisées par Qwen 2.5 et automatiquement enregistrées dans le coffre local pour vos futures requêtes hors-ligne.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748B' }}>
          <span style={{ fontWeight: 600 }}>{results.length} fiche(s) technique(s) identifiée(s)</span>
          {executionMs > 0 && <span style={{ fontFamily: 'monospace' }}>Temps d'exécution RRF SQL : {executionMs} ms</span>}
        </div>

        {results.length === 0 && !isLoading && (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: '#64748B',
              background: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: '12px',
              fontSize: '13px',
            }}
          >
            Aucun manuel technique ou barème trouvé. Cliquez sur "Amorcer Catalogue OEM/ENACTA" pour charger la base de données.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {results.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* En-tête de la carte */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#1E293B',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      letterSpacing: '0.04em',
                      border: '1px solid #334155',
                    }}
                  >
                    {item.manufacturer}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    {item.model_series}
                  </span>
                  <span style={{ color: '#94A3B8' }}>•</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    {item.subsystem}
                  </span>

                  {item.is_web_fallback && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🌐 Source Web Détectée &amp; Auto-Ingérée
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Score RRF : <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>{item.rrf_score.toFixed(5)}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      background: '#E2E8F0',
                      color: '#334155',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    BM25 #{item.lexical_rank} | Trgm #{item.semantic_rank}
                  </span>
                </div>
              </div>

              {/* Titre et contenu */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                  {item.section_title}
                </h4>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: '#334155',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {item.content}
                </div>
              </div>

              {/* Spécifications numériques déterministes */}
              {item.structured_specs && Object.keys(item.structured_specs).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Gauge size={14} color="#059669" />
                    Spécifications Numériques Déterministes (Garde-Fou Sans Hallucination) :
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {Object.entries(item.structured_specs).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748B',
                            textTransform: 'uppercase',
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {k.replace(/_/g, ' ')} :
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#047857',
                            fontFamily: 'monospace',
                            textAlign: 'right',
                          }}
                        >
                          {Array.isArray(v)
                            ? v.join(', ')
                            : typeof v === 'boolean'
                            ? v
                              ? 'OUI'
                              : 'NON'
                            : String(v)}
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
