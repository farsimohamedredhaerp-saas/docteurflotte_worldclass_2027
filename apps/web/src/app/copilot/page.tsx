'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { AuthClient } from '../../lib/api-auth';
import { CopilotClient } from '../../lib/api-copilot';
import {
  CopilotResponse,
  CopilotInsightItem,
  CopilotActionSuggestion,
} from '@docteurflotte/contracts';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  responsePayload?: CopilotResponse;
  timestamp: string;
}

export default function CopilotPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<CopilotInsightItem[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = AuthClient.getSession();
    if (s.token) {
      setSessionToken(s.token);
      loadInsights(s.token);
    }
    // Message d'accueil initial
    setMessages([
      {
        id: 'msg-init',
        sender: 'copilot',
        text: `Bonjour. Je suis **DocteurFlotte Copilot**, votre assistant décisionnel et d'ingénierie de parc. 
J'analyse en continu les flux télématiques Traccar, les équations physiques déterministes (Arrhenius, Cranking, Thermique, Archard, CUSUM) et vos budgets en Dinars Algériens.
Que souhaitez-vous diagnostiquer ou arbitrer aujourd'hui ?`,
        timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInsights = async (token: string) => {
    try {
      const data = await CopilotClient.getInsights(token);
      setInsights(data);
    } catch {
      // Fallback
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const query = promptToSend || inputValue;
    if (!query.trim() || !sessionToken || isLoading) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await CopilotClient.ask({ prompt: query }, sessionToken);
      setMessages([
        ...newMessages,
        {
          id: res.id,
          sender: 'copilot',
          text: res.answer,
          responsePayload: res,
          timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `err-${Date.now()}`,
          sender: 'copilot',
          text: `Désolé, une erreur s'est produite lors de l'analyse : ${err.message}`,
          timestamp: new Date().toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (action: CopilotActionSuggestion) => {
    if (!sessionToken) return;
    try {
      const res = await CopilotClient.executeAction(
        action.id,
        `Validation instantanée via le Copilote d'Exploitation pour ${action.assetName}`,
        sessionToken
      );
      setActionFeedback(`✓ Action exécutée avec succès ! ${res.message} (Numéro d'OT : ${res.generatedWorkOrderId})`);
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      setActionFeedback(`Erreur lors de l'exécution : ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      {/* HEADER BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 1) 100%)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>🧠</span>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Ask DocteurFlotte — Copilote Décisionnel d’Exploitation (SAD → ADS)
              </h1>
              <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.3)', color: '#c7d2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                IA SOUVERAINE & PHYSIQUE
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
              Diagnostic de panne instantané, preuves télématiques chiffrées, détection de fraude et arbitrage financier en Dinars (DZD).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/fuel-scanner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#6ee7b7',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>⛽</span>
              <span>Scanner Reçus Naftal (OCR)</span>
            </Link>

            <Link
              href="/decisions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>📊</span>
              <span>Tableau Décisionnel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {actionFeedback && (
        <div
          style={{
            maxWidth: '1440px',
            margin: '16px auto 0',
            padding: '12px 20px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#6ee7b7',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          {actionFeedback}
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div
        style={{
          maxWidth: '1440px',
          margin: '20px auto 40px',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: CONVERSATION & PROMPT INPUT */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            height: '78vh',
            boxShadow: 'var(--df-shadow-sm)',
            overflow: 'hidden',
          }}
        >
          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: msg.sender === 'user' ? '70%' : '90%',
                    background:
                      msg.sender === 'user'
                        ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
                        : 'var(--df-bg-surface-2)',
                    border:
                      msg.sender === 'user'
                        ? '1px solid #6366f1'
                        : '1px solid var(--df-border-subtle)',
                    borderRadius:
                      msg.sender === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    padding: '16px 20px',
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Sender Header */}
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: msg.sender === 'user' ? '#c7d2fe' : '#818cf8',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{msg.sender === 'user' ? '👤 Vous' : '🧠 DocteurFlotte Copilot'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>• {msg.timestamp}</span>
                  </div>

                  {/* Body Text */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                  {/* If Copilot provided physical evidences & actions payload */}
                  {msg.responsePayload && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Physical Evidences Box */}
                      {msg.responsePayload.evidences.length > 0 && (
                        <div
                          style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                            🔬 Preuves Physiques & Métrologie Brute (Loi 18-07)
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                            {msg.responsePayload.evidences.map((ev, i) => (
                              <div
                                key={i}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                }}
                              >
                                <div style={{ color: '#94a3b8', fontSize: '11px' }}>{ev.metric}</div>
                                <div style={{ fontWeight: 800, color: ev.severity === 'CRITICAL' ? '#f87171' : '#fbbf24', fontSize: '14px' }}>
                                  {ev.observedValue}
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>Seuil : {ev.threshold}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Actions (ADS Loop) */}
                      {msg.responsePayload.suggestedActions.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                            ⚡ Décisions Autonomes & Arbitrages Recommandés (ADS)
                          </div>
                          {msg.responsePayload.suggestedActions.map((act) => (
                            <div
                              key={act.id}
                              style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '12px',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#6ee7b7' }}>
                                  {act.title}
                                </div>
                                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                                  {act.description}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                  Coût Action : <strong>{act.estimatedCostDzd.toLocaleString('fr-DZ')} DZD</strong> • 
                                  Risque Inaction Évité : <strong style={{ color: '#f87171' }}>{act.estimatedRiskDzd.toLocaleString('fr-DZ')} DZD</strong> • 
                                  Gain Net : <strong style={{ color: '#34d399' }}>+{act.netSavingsDzd.toLocaleString('fr-DZ')} DZD (ROI x{act.roiMultiplier})</strong>
                                </div>
                              </div>

                              <button
                                onClick={() => handleExecuteAction(act)}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                  border: 'none',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <span>⚡</span>
                                <span>Émettre l’Ordre de Travail</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontSize: '13px' }}>
                <span className="df-pulse-live" />
                <span>DocteurFlotte Copilot interroge la télématique et calcule les équations physiques...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Suggestions Chips */}
          <div
            style={{
              padding: '10px 18px',
              background: 'var(--df-bg-surface-2)',
              borderTop: '1px solid var(--df-border-subtle)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {[
              { label: '🔋 Batterie Kangoo (Cranking)', prompt: 'Quel est l’état de santé de la batterie du Kangoo ?' },
              { label: '🛢️ Huile MAN TGX (Arrhenius)', prompt: 'Faut-il vidanger l’huile du MAN TGX après la mission à Hassi Messaoud ?' },
              { label: '⛽ Détection Vol Carburant (CUSUM)', prompt: 'Y a-t-il eu un vol de carburant ou un siphonnage Naftal récemment ?' },
              { label: '📊 Synthèse Risques Flotte', prompt: 'Fais-moi la synthèse des risques d’inaction de la flotte pour cette semaine.' },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.prompt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.color = '#a5b4fc';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--df-bg-surface-1)',
              borderTop: '1px solid var(--df-border-subtle)',
              display: 'flex',
              gap: '12px',
            }}
          >
            <input
              type="text"
              placeholder="Posez une question sur un véhicule, une panne prédictive ou un budget Naftal..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--df-border-medium)',
                background: 'var(--df-bg-surface-2)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: inputValue.trim() ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'var(--df-bg-surface-2)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                opacity: inputValue.trim() ? 1 : 0.5,
              }}
            >
              Envoyer 🚀
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PROACTIVE FLEET INSIGHTS & METRICS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Fleet Health Quick Box */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              État Général de la Flotte
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>78.4</span>
                <span style={{ fontSize: '14px', color: 'var(--df-text-muted)' }}> / 100 VHI</span>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Stable
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
              Exposition totale au risque d’inaction : <strong style={{ color: '#f87171' }}>425 000 DZD</strong> sur 3 véhicules prioritaires.
            </div>
          </div>

          {/* Proactive Insights Feed */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔔</span>
              <span>Alertes Proactives du Copilote</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  onClick={() => handleSendMessage(ins.title)}
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: ins.urgency === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: ins.urgency === 'HIGH' ? '#fca5a5' : '#fbbf24',
                      }}
                    >
                      {ins.urgency === 'HIGH' ? 'CRITIQUE' : 'MOYEN'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>
                      {ins.impactDzd.toLocaleString('fr-DZ')} DA
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    {ins.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--df-text-muted)', lineHeight: 1.4 }}>
                    {ins.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
