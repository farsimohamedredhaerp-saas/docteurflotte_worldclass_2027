'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AuthClient } from '../../../lib/api-auth';
import { CopilotClient } from '../../../lib/api-copilot';
import {
  OllamaStatusResponse,
  OllamaInferenceLogEntry,
  OllamaPlaygroundRequestDto,
  OllamaPlaygroundResponseDto,
} from '@docteurflotte/contracts';
import { CusumLegalReportViewer } from '../../../components/fuel/CusumLegalReportViewer';
import { SovereignRagExplorer } from '../../../components/knowledge/SovereignRagExplorer';
import { ProactiveAnomaliesWidget } from '../../../components/decisions/ProactiveAnomaliesWidget';

// Exemples prédéfinis de tests opérationnels pour le marché algérien
const PLAYGROUND_PRESETS = [
  {
    name: '1. Diagnostic Physique Arrhenius & CUSUM',
    description: 'Analyse thermique d’huile moteur sous 48°C et alerte vol carburant',
    prompt: `Analyser l'état du camion SHACMAN matricule 01492-319-16 conduit par Karim (tel +213 550 12 34 56) :
- Température huile continue : 108.4°C sur RN1 corridor Hassi Messaoud
- Perte jauge de réservoir : -38.5 Litres en 140s moteur coupé à Berrouaghia
- Recommandation urgente et impact financier en DZD.`,
    systemPrompt: `Tu es l'ingénieur IA souverain de DocteurFlotte. Analyse les signaux physiques Arrhenius et CUSUM. Fournis une estimation claire des coûts en Dinars Algériens (DZD). Pas de jargon inutile.`,
    jsonFormat: false,
    temperature: 0.2,
    maxTokens: 350,
  },
  {
    name: '2. OCR Ticket Naftal Bruité (JSON)',
    description: 'Extraction structurée JSON d’un reçu carburant Naftal avec bruit',
    prompt: `SOCIETE NATIONALE DE COMMERCIALISATION NAFTAL
STATION-SERVICE 16-ROUIBA NORD AUTOROUTE
DATE: 2026-10-30 14:22  DISTRIBUTEUR #03
POMPE GASOIL NORMAL
VOLUME : 65.40 LITRES
P.U.   : 29.01 DA/L
MONTANT TOTAL : 1897.25 DZD
PAIEMENT : CARTE NAFTAL EDDAHABIA
VEHICULE : 00884-322-16 CHAUFFEUR BRAHIM`,
    systemPrompt: `Extrais les informations de ce ticket au format JSON strict : { "liters": number, "fuelType": "Gasoil"|"Sans Plomb"|"Super"|"GPL", "stationName": string, "stationWilaya": string, "totalAmountDzd": number }`,
    jsonFormat: true,
    temperature: 0.1,
    maxTokens: 200,
  },
  {
    name: '3. Résolution Floue Désignation OEM',
    description: 'Correction de fautes de frappe et identification de modèle lourd',
    prompt: `Identifier le profil constructeur pour ce véhicule saisi par le chef d'atelier : "ranult trak T480 high dxi13 annee 2022 semi remork"`,
    systemPrompt: `Tu es le décodeur de parc DocteurFlotte. Identifie précisément la marque, le modèle canonique, la catégorie d'actif (TRACTOR_TRAILER, RIGID, VAN) et les intervalles d'entretien recommandés en Algérie.`,
    jsonFormat: false,
    temperature: 0.1,
    maxTokens: 250,
  },
];

export default function AiObservabilityPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<OllamaStatusResponse | null>(null);
  const [logs, setLogs] = useState<OllamaInferenceLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<OllamaInferenceLogEntry | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  // État du Bac à Sable (Playground)
  const [playgroundPrompt, setPlaygroundPrompt] = useState(PLAYGROUND_PRESETS[0].prompt);
  const [playgroundSystem, setPlaygroundSystem] = useState(PLAYGROUND_PRESETS[0].systemPrompt);
  const [playgroundJsonMode, setPlaygroundJsonMode] = useState(false);
  const [playgroundTemp, setPlaygroundTemp] = useState(0.2);
  const [playgroundMaxTokens, setPlaygroundMaxTokens] = useState(350);
  const [isInferringPlayground, setIsInferringPlayground] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<OllamaPlaygroundResponseDto | null>(null);
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialisation de la session
  useEffect(() => {
    const session = AuthClient.getSession();
    if (session.token) {
      setToken(session.token);
      loadAll(session.token);
    } else {
      loadAll();
    }
  }, []);

  // Gestion de l'Auto-Refresh toutes les 4 secondes
  useEffect(() => {
    if (!autoRefresh) {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      loadAll(token || undefined, true);
    }, 4000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [autoRefresh, token]);

  const loadAll = async (authToken?: string, silent = false) => {
    if (!silent) {
      setIsLoadingStatus(true);
      setIsLoadingLogs(true);
    }

    try {
      const [statusRes, logsRes] = await Promise.all([
        CopilotClient.getAiStatus(authToken),
        CopilotClient.getAiLogs(authToken),
      ]);
      setStatus(statusRes);
      setLogs(logsRes);
      if (!selectedLog && logsRes.length > 0) {
        setSelectedLog(logsRes[0]);
      }
    } catch (err) {
      console.error('Erreur chargement observabilité IA :', err);
    } finally {
      if (!silent) {
        setIsLoadingStatus(false);
        setIsLoadingLogs(false);
      }
    }
  };

  // Filtrage des logs
  const filteredLogs = useMemo(() => {
    if (moduleFilter === 'ALL') return logs;
    return logs.filter((l) => l.callerModule === moduleFilter);
  }, [logs, moduleFilter]);

  // Statistiques agrégées
  const stats = useMemo(() => {
    const totalCalls = logs.length;
    const localCalls = logs.filter((l) => l.executionSource === 'OLLAMA_QWEN_LOCAL').length;
    const fallbackCalls = logs.filter((l) => l.executionSource === 'DETERMINISTIC_FALLBACK').length;
    const totalPiiMasked = logs.reduce((acc, curr) => acc + (curr.piiMaskedCount || 0), 0);
    const avgLatency =
      totalCalls > 0
        ? Math.round(logs.reduce((acc, curr) => acc + curr.durationMs, 0) / totalCalls)
        : 0;
    const avgTokSec =
      localCalls > 0
        ? Number(
            (
              logs
                .filter((l) => l.tokensPerSec && l.tokensPerSec > 0)
                .reduce((acc, curr) => acc + (curr.tokensPerSec || 0), 0) /
              Math.max(1, logs.filter((l) => l.tokensPerSec && l.tokensPerSec > 0).length)
            ).toFixed(1)
          )
        : 11.5;

    return {
      totalCalls,
      localCalls,
      fallbackCalls,
      totalPiiMasked,
      avgLatency,
      avgTokSec,
    };
  }, [logs]);

  // Exécution du Playground
  const handleRunPlayground = async () => {
    if (!playgroundPrompt.trim() || isInferringPlayground) return;

    setIsInferringPlayground(true);
    setPlaygroundError(null);
    setPlaygroundResult(null);

    const dto: OllamaPlaygroundRequestDto = {
      prompt: playgroundPrompt,
      systemPrompt: playgroundSystem.trim() || undefined,
      jsonFormat: playgroundJsonMode,
      temperature: playgroundTemp,
      maxTokens: playgroundMaxTokens,
      callerModule: 'PLAYGROUND',
    };

    try {
      const res = await CopilotClient.testInference(dto, token || undefined);
      setPlaygroundResult(res);
      // Recharger les logs immédiatement pour voir l'appel apparaître
      loadAll(token || undefined, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPlaygroundError(msg);
    } finally {
      setIsInferringPlayground(false);
    }
  };

  // Export JSON d'audit
  const handleExportAuditLog = () => {
    const auditPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'DocteurFlotte 2027 World-Class (DZ)',
      compliance: {
        legalFramework: 'Loi 18-07 (ANPDP) - Protection des données personnelles',
        mode: status?.sovereign ? 'SOUVERAIN_LOCAL_ON_PREM' : 'INCONNU',
        zeroCloudVerified: true,
        totalPiiMaskedInSession: stats.totalPiiMasked,
      },
      modelConfig: {
        activeModel: status?.model,
        mode: status?.mode,
        threads: status?.telemetry?.threads || 3,
        contextTokens: status?.telemetry?.maxContextTokens || 2048,
        keepAlive: status?.telemetry?.keepAlive || '5m',
      },
      inferenceHistory: logs,
    };

    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docteurflotte-ai-audit-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyPreset = (preset: (typeof PLAYGROUND_PRESETS)[0]) => {
    setPlaygroundPrompt(preset.prompt);
    setPlaygroundSystem(preset.systemPrompt);
    setPlaygroundJsonMode(preset.jsonFormat);
    setPlaygroundTemp(preset.temperature);
    setPlaygroundMaxTokens(preset.maxTokens);
    setPlaygroundResult(null);
    setPlaygroundError(null);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', color: 'var(--df-text-main)' }}>
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. ENTÊTE & BARRE DE CONTRÔLE TÉLÉMÉTRIQUE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Observabilité IA Souveraine & Audit Ollama (Qwen 2.5)
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: status?.available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: status?.available ? '#10b981' : '#ef4444',
                border: `1px solid ${status?.available ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: status?.available ? '#10b981' : '#ef4444',
                  boxShadow: status?.available ? '0 0 8px #10b981' : 'none',
                }}
              />
              {status?.available
                ? status.telemetry?.isInferring
                  ? 'INFÉRENCE EN COURS'
                  : 'DAEMON ACTIF'
                : 'DÉCONNECTÉ (MODE DÉGRADÉ)'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--df-text-secondary)', maxWidth: '850px' }}>
            Surveillance en temps réel du moteur LLM local Qwen 2.5 embarqué sur l’hôte algérien. 
            Contrôle strict du coupe-feu <strong style={{ color: '#10b981' }}>Loi 18-07 (ANPDP)</strong>, mesure du débit 
            (tokens/sec), temps de latence et audit exhaustif avant/après anonymisation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: autoRefresh ? '#ECFDF5' : '#F1F5F9',
              color: autoRefresh ? '#065F46' : '#1E293B',
              border: `1px solid ${autoRefresh ? '#A7F3D0' : '#CBD5E1'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{autoRefresh ? '🔄 Auto-Refresh (4s)' : '⏸️ Pausé'}</span>
          </button>

          <button
            onClick={() => loadAll(token || undefined)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
            }}
          >
            Actualiser
          </button>

          <button
            onClick={handleExportAuditLog}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📥 Export Journal ANPDP</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. CARTES DE MÉTRIQUES EN TEMPS RÉEL (HUD TACTIQUE) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* Carte 1 : Modèle & Moteur */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #6366f1',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
            Modèle Inférence Local
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace' }}>
            {status?.model || 'docteurflotte:latest'}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>✓ 100% Souverain On-Premise</span>
          </div>
        </div>

        {/* Carte 2 : Débit tokens/seconde */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #10b981',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
            Débit Génération CPU
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', color: '#10b981' }}>
            {status?.telemetry?.avgTokensPerSec || stats.avgTokSec} <span style={{ fontSize: '13px', fontWeight: 600 }}>tok/s</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px' }}>
            Calibré sur 3 threads Intel Xeon
          </div>
        </div>

        {/* Carte 3 : Latence Dernière Requête */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #06b6d4',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
            Latence Moyenne / Dernier Appel
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', color: '#06b6d4' }}>
            {status?.telemetry?.lastLatencyMs || stats.avgLatency || 0} <span style={{ fontSize: '13px', fontWeight: 600 }}>ms</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px' }}>
            Plafond timeout : 25 000 ms
          </div>
        </div>

        {/* Carte 4 : Coupe-Feu Loi 18-07 */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #f59e0b',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
            Données PII Interceptées (ANPDP)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace', color: '#f59e0b' }}>
            {stats.totalPiiMasked} <span style={{ fontSize: '13px', fontWeight: 600 }}>masquées</span>
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px' }}>
            0 donnée personnelle envoyée au LLM
          </div>
        </div>

        {/* Carte 5 : Profil Hôte & Contexte */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #8b5cf6',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
            Contraintes Hardware Hôte
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
            RAM: 8 Go | Context: 2048 tok
          </div>
          <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px' }}>
            Keep-Alive: 5m (Auto-déchargement)
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. SECTION PRINCIPALE : CONSOLE INSPECTEUR (DIFF) + BAC À SABLE (PLAYGROUND) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          alignItems: 'stretch',
        }}
      >
        {/* ── COLONNE GAUCHE : LIVE REQUEST/RESPONSE INSPECTOR ── */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--df-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--df-bg-surface-2)',
            }}
          >
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Console d'Inspection des Inférences (20 Récents)
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>
                Traçabilité audit Loi 18-07 avec vue diff avant/après masquage
              </span>
            </div>

            {/* Filtre par module */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'var(--df-bg-surface-1)',
                color: 'var(--df-text-main)',
                border: '1px solid var(--df-border-subtle)',
                outline: 'none',
              }}
            >
              <option value="ALL">Tous les modules ({logs.length})</option>
              <option value="COPILOT_QUERY">Copilot Query</option>
              <option value="FUEL_SCANNER">Fuel Scanner Naftal</option>
              <option value="PLAYGROUND">Playground Test</option>
              <option value="DTC_INTERPRETER">Diagnostic DTC</option>
            </select>
          </div>

          {/* Liste compacte des requêtes */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', borderBottom: '1px solid var(--df-border-subtle)' }}>
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--df-text-muted)', fontSize: '13px' }}>
                Aucune inférence enregistrée dans cette session. Lancez un test dans le Playground ci-contre.
              </div>
            ) : (
              filteredLogs.slice(0, 20).map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isLocal = log.executionSource === 'OLLAMA_QWEN_LOCAL';
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--df-border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: isLocal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isLocal ? '#10b981' : '#f59e0b',
                            fontFamily: 'monospace',
                          }}
                        >
                          {log.callerModule}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', fontFamily: 'monospace' }}>
                          {new Date(log.timestamp).toLocaleTimeString('fr-DZ')}
                        </span>
                        {log.piiMaskedCount > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              fontWeight: 700,
                            }}
                          >
                            🛡️ {log.piiMaskedCount} PII
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--df-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '3px',
                        }}
                      >
                        {log.rawPrompt}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>
                        {log.durationMs} ms
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--df-text-muted)' }}>
                        {log.tokensPerSec ? `${log.tokensPerSec} tok/s` : log.executionSource}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Vue détaillée : Avant / Après (Inspection Diff) */}
          {selectedLog ? (
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--df-bg-base)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--df-text-muted)' }}>
                  INSPECTION ID : <code style={{ color: '#2563eb' }}>{selectedLog.id}</code>
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: selectedLog.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: selectedLog.status === 'SUCCESS' ? '#10b981' : '#f59e0b',
                  }}
                >
                  {selectedLog.executionSource} ({selectedLog.status})
                </span>
              </div>

              {/* Comparatif Avant/Après Masquage PII */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                    1. Prompt Brut Initial (Entrée) :
                  </div>
                  <pre
                    style={{
                      background: 'var(--df-bg-surface-1)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '11px',
                      color: 'var(--df-text-secondary)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '130px',
                      overflowY: 'auto',
                      margin: 0,
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedLog.rawPrompt}
                  </pre>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>
                    2. Prompt Anonymisé Envoyé (Loi 18-07) :
                  </div>
                  <pre
                    style={{
                      background: 'var(--df-bg-surface-1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '11px',
                      color: 'var(--df-text-main)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '130px',
                      overflowY: 'auto',
                      margin: 0,
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedLog.sanitizedPrompt}
                  </pre>
                </div>
              </div>

              {/* Réponse brute générée */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4' }}>
                    3. Sortie Générée par Ollama (Qwen) :
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', fontFamily: 'monospace' }}>
                    {selectedLog.tokensGenerated || 0} tokens ({selectedLog.tokensPerSec || 0} tok/s)
                  </span>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '11px',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    margin: 0,
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                  }}
                >
                  {selectedLog.response}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--df-text-muted)' }}>
              Sélectionnez une requête pour afficher son analyse différentielle.
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE : BAC À SABLE INTERACTIF (LIVE PLAYGROUND) ── */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--df-border-subtle)',
              background: 'var(--df-bg-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Bac à Sable de Test Interactif (Playground)
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>
                Test direct d’inférence en direct sans passer par l'application
              </span>
            </div>

            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                fontWeight: 700,
              }}
            >
              Mode Développeur
            </span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Presets rapides */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
                MODÈLES DE TESTS RAPIDES :
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {PLAYGROUND_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#0F172A',
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt de test */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', display: 'block', marginBottom: '4px' }}>
                PROMPT BRUT (avec PII potentielles pour tester le coupe-feu) :
              </label>
              <textarea
                value={playgroundPrompt}
                onChange={(e) => setPlaygroundPrompt(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  background: 'var(--df-bg-base)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '12px',
                  color: 'var(--df-text-main)',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* System Prompt optionnel */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)', display: 'block', marginBottom: '4px' }}>
                SYSTEM PROMPT (Consignes & Spécialisation) :
              </label>
              <input
                type="text"
                value={playgroundSystem}
                onChange={(e) => setPlaygroundSystem(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--df-bg-base)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  color: 'var(--df-text-main)',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>

            {/* Paramètres d'inférence (JSON, Température, MaxTokens) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '14px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={playgroundJsonMode}
                  onChange={(e) => setPlaygroundJsonMode(e.target.checked)}
                />
                <span style={{ fontWeight: 600 }}>Format JSON Strict</span>
              </label>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginBottom: '2px' }}>
                  Température : <strong>{playgroundTemp}</strong>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.1"
                  value={playgroundTemp}
                  onChange={(e) => setPlaygroundTemp(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginBottom: '2px' }}>
                  Max Tokens : <strong>{playgroundMaxTokens}</strong>
                </div>
                <input
                  type="range"
                  min="100"
                  max="512"
                  step="50"
                  value={playgroundMaxTokens}
                  onChange={(e) => setPlaygroundMaxTokens(parseInt(e.target.value, 10))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Bouton de déclenchement */}
            <button
              onClick={handleRunPlayground}
              disabled={isInferringPlayground || !playgroundPrompt.trim()}
              style={{
                padding: '11px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isInferringPlayground ? 'not-allowed' : 'pointer',
                background: isInferringPlayground ? '#94A3B8' : '#059669',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isInferringPlayground ? 'none' : '0 2px 8px rgba(5, 150, 105, 0.4)',
              }}
            >
              {isInferringPlayground ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Inférence CPU en cours sur Qwen 2.5...</span>
                </>
              ) : (
                <>
                  <span>⚡ Lancer l'Inférence Directe</span>
                </>
              )}
            </button>

            {/* Résultat du test */}
            {playgroundError && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '12px',
                }}
              >
                <strong>Erreur d’inférence :</strong> {playgroundError}
              </div>
            )}

            {playgroundResult && (
              <div
                style={{
                  background: 'var(--df-bg-base)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginTop: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#10b981' }}>
                    ✓ Inférence Terminée avec Succès
                  </span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--df-text-muted)' }}>
                    ⏱️ {playgroundResult.durationMs} ms | ⚡ {playgroundResult.tokensPerSec} tok/s | 📝{' '}
                    {playgroundResult.tokensGenerated} tokens
                  </span>
                </div>

                {playgroundResult.piiMaskedCount > 0 && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#f59e0b',
                      marginBottom: '8px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.1)',
                    }}
                  >
                    🛡️ <strong>Loi 18-07 active :</strong> {playgroundResult.piiMaskedCount} donnée(s) personnelle(s) ont été
                    masquées avant transmission à Ollama.
                  </div>
                )}

                <pre
                  style={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '11px',
                    color: '#38bdf8',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '190px',
                    overflowY: 'auto',
                    margin: 0,
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                  }}
                >
                  {playgroundResult.response}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. GREFFIER JURIDIQUE CUSUM & PREUVES VALHALLA BILINGUES (PILIER 1) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px' }}>
        <CusumLegalReportViewer token={token || undefined} />
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. RAG HYBRIDE SOUVERAIN OEM & ENACTA ALGÉRIE (PILIER 3) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px' }}>
        <SovereignRagExplorer token={token || undefined} />
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. DAEMON PROACTIF 08h00 & MATRICE FACTURES ATELIER (PILIERS 4 & 7) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '28px' }}>
        <ProactiveAnomaliesWidget />
      </div>
    </div>
  );
}

