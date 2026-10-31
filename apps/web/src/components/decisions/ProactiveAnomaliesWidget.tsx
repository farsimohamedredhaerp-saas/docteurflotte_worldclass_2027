'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Wrench,
  Receipt,
  Calculator,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface MockDriftCard {
  id: string;
  vehiclePlate: string;
  subsystem: string;
  anomalyType: string;
  severity: 'WARNING' | 'CRITICAL';
  metric: string;
  drift: string;
  physicalLaw: string;
  estimatedCostDzd: number;
  inactionRiskDzd: number;
  cooldownHoursRemaining: number;
  status: 'ACTIVE_CARD' | 'SNOOZED' | 'WORK_ORDER_CREATED';
}

const INITIAL_PROACTIVE_CARDS: MockDriftCard[] = [
  {
    id: 'anom-kerax-001',
    vehiclePlate: '00412-116-17',
    subsystem: 'MOTEUR',
    anomalyType: 'DÉRIVE THERMIQUE LENTE RADIATEUR',
    severity: 'WARNING',
    metric: 'Température Liquide Refroidissement',
    drift: '+4.5°C sur 10 jours à charge égale (88.0°C -> 92.5°C)',
    physicalLaw: 'Dérive transfert convectif radiateur (poussières / sable Tell-Atlas)',
    estimatedCostDzd: 18000,
    inactionRiskDzd: 350000,
    cooldownHoursRemaining: 71,
    status: 'ACTIVE_CARD',
  },
  {
    id: 'anom-actros-002',
    vehiclePlate: '01894-112-16',
    subsystem: 'FREINAGE',
    anomalyType: 'USURE ACCÉLÉRÉE ARCHARD GARNITURES',
    severity: 'CRITICAL',
    metric: 'Épaisseur Plaquettes Essieu 1 (Knorr SN7)',
    drift: '3.8 mm (Cote critique ENACTA: 3.0 mm, RUL estimée: 12 jours)',
    physicalLaw: 'Loi d Archard W = k·F·d/H (Traversée descendante Gorges de la Chiffa)',
    estimatedCostDzd: 44000,
    inactionRiskDzd: 220000,
    cooldownHoursRemaining: 68,
    status: 'ACTIVE_CARD',
  },
];

export function ProactiveAnomaliesWidget() {
  const [cards, setCards] = useState<MockDriftCard[]>(INITIAL_PROACTIVE_CARDS);
  const [activeTab, setActiveTab] = useState<'PROACTIVE_DAEMON' | 'INVOICE_RECONCILER'>('PROACTIVE_DAEMON');

  // État du simulateur de facture
  const [line1Total, setLine1Total] = useState<number>(44000);
  const [line2Total, setLine2Total] = useState<number>(70000);
  const [claimedTotal, setClaimedTotal] = useState<number>(135660);
  const [claimedDiscount, setClaimedDiscount] = useState<number>(0);
  const [claimedStamp, setClaimedStamp] = useState<number>(0);

  const handleSnooze = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: 'SNOOZED', cooldownHoursRemaining: 72 } : c)),
    );
  };

  const handleCreateWorkOrder = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: 'WORK_ORDER_CREATED' } : c)),
    );
  };

  // Calcul en direct de la réconciliation arithmétique (Pilier 4)
  const sumLines = line1Total + line2Total;
  const delta1 = Math.abs(sumLines - claimedTotal);
  const delta2 = Math.abs(Math.round(sumLines * 1.19) - claimedTotal);
  const delta3 = Math.abs(sumLines + claimedStamp - claimedDiscount - claimedTotal);
  const minDelta = Math.min(delta1, delta2, delta3);

  let winningScenario = 'AUCUN_SCENARIO_VALIDE';
  if (delta1 <= 5) winningScenario = 'SCÉNARIO 1 : ÉGALITÉ BRUTE HT';
  else if (delta2 <= 5) winningScenario = 'SCÉNARIO 2 : TVA 19% ALGÉRIE';
  else if (delta3 <= 5) winningScenario = 'SCÉNARIO 3 : TIMBRE DGI / REMISE';

  const isReconciled = minDelta <= 5;

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
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
            }}
          >
            <Flame size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Piliers 4 &amp; 7 : Daemon Proactif 08h00 &amp; Réconciliation Factures
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Machine à états avec Cooldown 72h anti-echo storm et calcul arithmétique déterministe HT / TVA 19% / Timbre DGI.
            </div>
          </div>
        </div>

        {/* Boutons d'onglets */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #CBD5E1',
            gap: '6px',
          }}
        >
          <button
            onClick={() => setActiveTab('PROACTIVE_DAEMON')}
            style={{
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 800,
              borderRadius: '8px',
              border: activeTab === 'PROACTIVE_DAEMON' ? '1px solid #9A3412' : '1px solid #CBD5E1',
              cursor: 'pointer',
              backgroundColor: activeTab === 'PROACTIVE_DAEMON' ? '#EA580C' : '#FFFFFF',
              boxShadow: activeTab === 'PROACTIVE_DAEMON' ? '0 2px 4px rgba(234, 88, 12, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <span style={{ color: activeTab === 'PROACTIVE_DAEMON' ? '#FFFFFF' : '#0F172A', fontWeight: 800 }}>
              Veille Proactive 08h00
            </span>
          </button>
          <button
            onClick={() => setActiveTab('INVOICE_RECONCILER')}
            style={{
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 800,
              borderRadius: '8px',
              border: activeTab === 'INVOICE_RECONCILER' ? '1px solid #9A3412' : '1px solid #CBD5E1',
              cursor: 'pointer',
              backgroundColor: activeTab === 'INVOICE_RECONCILER' ? '#EA580C' : '#FFFFFF',
              boxShadow: activeTab === 'INVOICE_RECONCILER' ? '0 2px 4px rgba(234, 88, 12, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <span style={{ color: activeTab === 'INVOICE_RECONCILER' ? '#FFFFFF' : '#0F172A', fontWeight: 800 }}>
              Matrice Factures (3 Scénarios)
            </span>
          </button>
        </div>
      </div>

      {/* ── ONGLET 1 : VEILLE PROACTIVE 08h00 (PILIER 7) ── */}
      {activeTab === 'PROACTIVE_DAEMON' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px 16px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#d97706" />
              <strong>Verrou Anti-Echo Storm Actif :</strong> Aucune ré-émission d'alerte sous 72h si non acquittée ou si un Ordre de Travail est en cours.
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>Scan Dérives TimescaleDB : OPÉRATIONNEL</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
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
                {/* En-tête de carte */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #E2E8F0',
                    paddingBottom: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {card.vehiclePlate}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      {card.subsystem}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background:
                        card.status === 'WORK_ORDER_CREATED'
                          ? '#ECFDF5'
                          : card.status === 'SNOOZED'
                          ? '#E2E8F0'
                          : '#FEF3C7',
                      color:
                        card.status === 'WORK_ORDER_CREATED'
                          ? '#065F46'
                          : card.status === 'SNOOZED'
                          ? '#475569'
                          : '#92400E',
                      border:
                        card.status === 'WORK_ORDER_CREATED'
                          ? '1px solid #A7F3D0'
                          : card.status === 'SNOOZED'
                          ? '1px solid #CBD5E1'
                          : '1px solid #FDE68A',
                    }}
                  >
                    {card.status === 'WORK_ORDER_CREATED'
                      ? '✓ Ordre de Travail Créé'
                      : card.status === 'SNOOZED'
                      ? 'Mise en veille 72h'
                      : 'Zero-Prompt Matinal 08h00'}
                  </span>
                </div>

                {/* Détails anomalie */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {card.anomalyType}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{card.metric}</div>
                  <div
                    style={{
                      marginTop: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#B45309',
                    }}
                  >
                    {card.drift}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#475569',
                    background: '#F1F5F9',
                    padding: '8px 10px',
                    borderRadius: '6px',
                  }}
                >
                  <strong style={{ color: '#0F172A' }}>Preuve Physique :</strong> {card.physicalLaw}
                </div>

                {/* Arbitrage Financier DZD */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      Action Préventive :
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#047857', fontFamily: 'monospace', marginTop: '2px' }}>
                      {card.estimatedCostDzd.toLocaleString('fr-DZ')} DZD
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>
                      Risque Inaction :
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#DC2626', fontFamily: 'monospace', marginTop: '2px' }}>
                      {card.inactionRiskDzd.toLocaleString('fr-DZ')} DZD
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid #E2E8F0',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                    Cooldown actif : <strong>{card.cooldownHoursRemaining}h</strong>
                  </span>

                  {card.status === 'ACTIVE_CARD' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSnooze(card.id)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '6px',
                          border: '1px solid #94A3B8',
                          backgroundColor: '#F1F5F9',
                          color: '#0F172A',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: '#0F172A', fontWeight: 800 }}>Snooze 72h</span>
                      </button>
                      <button
                        onClick={() => handleCreateWorkOrder(card.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 18px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '6px',
                          border: '1px solid #065F46',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)',
                        }}
                      >
                        <Wrench size={14} color="#FFFFFF" />
                        <span style={{ color: '#FFFFFF', fontWeight: 800 }}>Créer OT 1-Clic</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ONGLET 2 : MATRICE DE RÉCONCILIATION FACTURES ATELIER (PILIER 4) ── */}
      {activeTab === 'INVOICE_RECONCILER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px 16px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Calculator size={18} color="#2563eb" />
            <span>
              <strong>Règle Déterministe d'Immunité Fiscale :</strong> Validation automatique si au moins l'un des 3 scénarios (HT direct, TVA algérienne 19%, Timbre fiscal DGI 1% / Remise) concorde à ± 5 DZD près.
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Colonne Saisie Facture */}
            <div
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
              <h4
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Receipt size={16} color="#d97706" />
                Données Extraites du Bon d'Atelier
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                    Ligne 1 : Plaquettes Knorr SN7 (DZD)
                  </label>
                  <input
                    type="number"
                    value={line1Total}
                    onChange={(e) => setLine1Total(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#0F172A',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                    Ligne 2 : Disques de frein 45mm (DZD)
                  </label>
                  <input
                    type="number"
                    value={line2Total}
                    onChange={(e) => setLine2Total(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#0F172A',
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#475569', fontWeight: 600 }}>Somme des Lignes (HT) :</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                    {sumLines.toLocaleString('fr-DZ')} DZD
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <label style={{ display: 'block', color: '#B45309', marginBottom: '4px', fontWeight: 800 }}>
                    Total Réclamé en Bas de Page (DZD)
                  </label>
                  <input
                    type="number"
                    value={claimedTotal}
                    onChange={(e) => setClaimedTotal(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#FFFBEB',
                      border: '2px solid #F59E0B',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '15px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: '#92400E',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Colonne Résultat Matrice 3 Scénarios */}
            <div
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
              <h4
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={16} color="#059669" />
                Évaluation Déterministe en Centimes Entiers
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {/* Scénario 1 */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: delta1 <= 5 ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                    background: delta1 <= 5 ? '#F0FDF4' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ color: delta1 <= 5 ? '#166534' : '#334155' }}>
                      1. Égalité Brute HT
                    </strong>
                    <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                      |Somme - Total| = {delta1.toFixed(2)} DZD
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: delta1 <= 5 ? '#DCFCE7' : '#F1F5F9',
                      color: delta1 <= 5 ? '#15803D' : '#64748B',
                    }}
                  >
                    {delta1 <= 5 ? '✓ CONCORDE' : '✕ ÉCART'}
                  </span>
                </div>

                {/* Scénario 2 */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: delta2 <= 5 ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                    background: delta2 <= 5 ? '#F0FDF4' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ color: delta2 <= 5 ? '#166534' : '#334155' }}>
                      2. Soumission avec TVA 19%
                    </strong>
                    <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                      |Somme × 1.19 - Total| = {delta2.toFixed(2)} DZD
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: delta2 <= 5 ? '#DCFCE7' : '#F1F5F9',
                      color: delta2 <= 5 ? '#15803D' : '#64748B',
                    }}
                  >
                    {delta2 <= 5 ? '✓ CONCORDE' : '✕ ÉCART'}
                  </span>
                </div>

                {/* Scénario 3 */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: delta3 <= 5 ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                    background: delta3 <= 5 ? '#F0FDF4' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ color: delta3 <= 5 ? '#166534' : '#334155' }}>
                      3. Timbre DGI (1%) ou Remise
                    </strong>
                    <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                      |Somme + Timbre - Remise - Total| = {delta3.toFixed(2)} DZD
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: delta3 <= 5 ? '#DCFCE7' : '#F1F5F9',
                      color: delta3 <= 5 ? '#15803D' : '#64748B',
                    }}
                  >
                    {delta3 <= 5 ? '✓ CONCORDE' : '✕ ÉCART'}
                  </span>
                </div>
              </div>

              {/* Statut Final */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: isReconciled ? '2px solid #10B981' : '2px solid #EF4444',
                  background: isReconciled ? '#ECFDF5' : '#FEF2F2',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: isReconciled ? '#065F46' : '#991B1B',
                  }}
                >
                  {isReconciled ? '✓ STATUT : RÉCONCILIÉ AUTOMATIQUE' : '⚠ STATUT : RELECTURE MANUELLE REQUISE'}
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: isReconciled ? '#047857' : '#B91C1C' }}>
                  {isReconciled
                    ? `Validé via ${winningScenario} (Écart min: ${minDelta.toFixed(2)} DZD ≤ 5.00 DZD tolérance).`
                    : `Écart arithmétique inconciliable (> 5 DZD). Risque d'erreur ou de surfacturation.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
