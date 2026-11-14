'use client';

import React from 'react';
import { IconCheck, IconX } from '../../../components/navigation/TechIcons';
import { CopilotChatMessageProps } from '../types';

export function CopilotChatMessage({
  message,
  onExecuteAction,
  onRejectAction,
}: CopilotChatMessageProps) {
  const isUser = message.sender === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: isUser ? '70%' : '90%',
          background: isUser
            ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
            : 'var(--df-bg-surface-2)',
          border: isUser ? '1px solid #6366f1' : '1px solid var(--df-border-subtle)',
          borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
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
            color: isUser ? '#c7d2fe' : '#818cf8',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <span>{isUser ? 'Vous' : 'DocteurFlotte Copilot'}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>• {message.timestamp}</span>
          {message.responsePayload?.aiSource && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                background:
                  message.responsePayload.aiSource === 'OLLAMA_QWEN_LOCAL'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(99, 102, 241, 0.2)',
                color:
                  message.responsePayload.aiSource === 'OLLAMA_QWEN_LOCAL'
                    ? '#6ee7b7'
                    : '#c7d2fe',
              }}
            >
              {message.responsePayload.aiSource === 'OLLAMA_QWEN_LOCAL'
                ? 'Hybride : Moteur Physique + Qwen2.5 Local'
                : 'Moteur Physique Déterministe (Loi 18-07)'}
            </span>
          )}
        </div>

        {/* Body Text */}
        <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>

        {/* If Copilot provided physical evidences & actions payload */}
        {message.responsePayload && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Physical Evidences Box */}
            {message.responsePayload.evidences.length > 0 && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Preuves Physiques & Métrologie Brute (Loi 18-07)
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {message.responsePayload.evidences.map((ev, i) => (
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
                      <div
                        style={{
                          fontWeight: 800,
                          color: ev.severity === 'CRITICAL' ? '#f87171' : '#fbbf24',
                          fontSize: '14px',
                        }}
                      >
                        {ev.observedValue}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Seuil : {ev.threshold}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions (ADS Loop & Human-in-the-Loop) */}
            {message.responsePayload.suggestedActions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                    Décisions & Actions Préparées (Draft & Commit)
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Machine à États Souveraine • Validation Humaine Requise
                  </span>
                </div>
                {message.responsePayload.suggestedActions.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      background:
                        act.status === 'PENDING_APPROVAL'
                          ? 'rgba(234, 179, 8, 0.08)'
                          : act.status === 'EXECUTED'
                            ? 'rgba(16, 185, 129, 0.08)'
                            : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${
                        act.status === 'PENDING_APPROVAL'
                          ? 'rgba(234, 179, 8, 0.4)'
                          : act.status === 'EXECUTED'
                            ? 'rgba(16, 185, 129, 0.4)'
                            : 'rgba(239, 68, 68, 0.4)'
                      }`,
                      borderRadius: '10px',
                      padding: '14px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: act.status === 'PENDING_APPROVAL' ? '#fef08a' : '#6ee7b7',
                            }}
                          >
                            {act.title}
                          </span>
                          {act.status === 'PENDING_APPROVAL' && (
                            <span
                              style={{
                                background: 'rgba(234, 179, 8, 0.25)',
                                border: '1px solid #eab308',
                                color: '#fef08a',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}
                            >
                              ⏳ EN ATTENTE APPROBATION
                            </span>
                          )}
                          {act.status === 'EXECUTED' && (
                            <span
                              style={{
                                background: 'rgba(16, 185, 129, 0.25)',
                                border: '1px solid #10b981',
                                color: '#6ee7b7',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}
                            >
                              EXÉCUTÉ & AUDITÉ
                            </span>
                          )}
                          {act.status === 'REJECTED' && (
                            <span
                              style={{
                                background: 'rgba(239, 68, 68, 0.25)',
                                border: '1px solid #ef4444',
                                color: '#fca5a5',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}
                            >
                              REJETÉ
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.45 }}>
                          {act.description}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                          Coût Action : <strong>{act.estimatedCostDzd.toLocaleString('fr-DZ')} DZD</strong> • Risque
                          Évité :{' '}
                          <strong style={{ color: '#f87171' }}>{act.estimatedRiskDzd.toLocaleString('fr-DZ')} DZD</strong>{' '}
                          • Gain Net :{' '}
                          <strong style={{ color: '#34d399' }}>
                            +{act.netSavingsDzd.toLocaleString('fr-DZ')} DZD (ROI x{act.roiMultiplier})
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {act.status === 'PENDING_APPROVAL' || act.status === 'PROPOSED' ? (
                          <>
                            <button
                              onClick={() => onExecuteAction(act)}
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
                                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                              }}
                            >
                              <IconCheck size={13} />
                              <span>Confirmer l&apos;Exécution</span>
                            </button>
                            <button
                              onClick={() => onRejectAction(act)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#fca5a5',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <IconX size={13} />
                              <span>Rejeter</span>
                            </button>
                          </>
                        ) : act.status === 'EXECUTED' ? (
                          <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 700 }}>
                            Enregistré au Registre des Ordres
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 600 }}>Action Classée</span>
                        )}
                      </div>
                    </div>

                    {/* TABLEAU MULTI-CRITÈRES TOPSIS SI CANDIDATS PRÉSENTS */}
                    {act.candidateVehicles && act.candidateVehicles.length > 0 && (
                      <div
                        style={{
                          marginTop: '6px',
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '10px',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', marginBottom: '6px' }}>
                          Classement des Candidats TOPSIS (Score Multicritère Algérie) :
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '8px',
                          }}
                        >
                          {act.candidateVehicles.map((c) => (
                            <div
                              key={c.vehicleId}
                              style={{
                                background:
                                  c.rank === 1 ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${c.rank === 1 ? '#a78bfa' : 'rgba(255, 255, 255, 0.08)'}`,
                                borderRadius: '6px',
                                padding: '8px 10px',
                                fontSize: '11px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: c.rank === 1 ? '#c4b5fd' : '#cbd5e1' }}>
                                  #{c.rank} {c.vehicleName}
                                </strong>
                                <span style={{ fontWeight: 800, color: c.rank === 1 ? '#34d399' : '#94a3b8' }}>
                                  {(c.topsisScore * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px' }}>
                                Plaque : {c.vehiclePlate} • VHI : {c.vhiScore}/100
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '10px' }}>
                                Approche : {c.approachDistanceKm} km • Naftal :{' '}
                                {c.fuelCostDzd.toLocaleString('fr-DZ')} DZD
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

