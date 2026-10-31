'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Receipt,
  FileQuestion,
  HelpCircle,
  Calculator,
  ArrowRight,
  Flame,
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
    anomalyType: 'DERIVE_THERMIQUE_LENTE_RADIATEUR',
    severity: 'WARNING',
    metric: 'Température Liquide Refroidissement',
    drift: '+4.5°C sur 10 jours à charge égale (88.0°C -> 92.5°C)',
    physicalLaw: 'Dérive transfert convectif radiateur (poussières / sable Tell-Atlas)',
    estimatedCostDzd: 18000,
    inactionRiskDzd: 350000, // Joint de culasse
    cooldownHoursRemaining: 71,
    status: 'ACTIVE_CARD',
  },
  {
    id: 'anom-actros-002',
    vehiclePlate: '01894-112-16',
    subsystem: 'FREINAGE',
    anomalyType: 'USURE_ACCELEREE_ARCHARD_GARNITURES',
    severity: 'CRITICAL',
    metric: 'Épaisseur Plaquettes Essieu 1 (Knorr SN7)',
    drift: '3.8 mm (Cote critique ENACTA: 3.0 mm, RUL estimée: 12 jours)',
    physicalLaw: 'Loi d Archard W = k·F·d/H (Traversée descendante Gorges de la Chiffa)',
    estimatedCostDzd: 44000,
    inactionRiskDzd: 220000, // Destruction disques et refus contrôle ENACTA
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
  if (delta1 <= 5) winningScenario = 'SCENARIO_1_BRUT_HT';
  else if (delta2 <= 5) winningScenario = 'SCENARIO_2_TTC_19PCT';
  else if (delta3 <= 5) winningScenario = 'SCENARIO_3_TIMBRE_OU_REMISE';

  const isReconciled = minDelta <= 5;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* En-tête avec bascule d'onglets */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">
              Piliers 4 & 7 : Daemon Proactif 08h00 & Matrice de Réconciliation Factures
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine à états avec Cooldown 72h anti-echo storm et calcul arithmétique déterministe HT / TVA 19% / Timbre DGI.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('PROACTIVE_DAEMON')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              activeTab === 'PROACTIVE_DAEMON'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Veille Proactive 08h00
          </button>
          <button
            onClick={() => setActiveTab('INVOICE_RECONCILER')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              activeTab === 'INVOICE_RECONCILER'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Matrice Factures (3 Scénarios)
          </button>
        </div>
      </div>

      {/* ONGLET 1 : VEILLE PROACTIVE 08h00 (PILIER 7) */}
      {activeTab === 'PROACTIVE_DAEMON' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <strong>Verrou Anti-Echo Storm Actif :</strong> Aucune ré-émission d'alerte sous 72h si non acquittée ou si un Ordre de Travail est en cours.
            </span>
            <span className="font-mono text-amber-400">Scan Dérives TimescaleDB : OK</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-950 text-amber-400 border border-amber-800/50">
                      {card.vehiclePlate}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{card.subsystem}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                      card.status === 'WORK_ORDER_CREATED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : card.status === 'SNOOZED'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {card.status === 'WORK_ORDER_CREATED'
                      ? '✓ OT Créé'
                      : card.status === 'SNOOZED'
                      ? 'Mise en veille 72h'
                      : 'Zero-Prompt 08h00'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{card.anomalyType.replace(/_/g, ' ')}</h4>
                  <p className="text-xs text-slate-400 mt-1">{card.metric}</p>
                  <p className="text-xs font-mono text-amber-300 mt-1 bg-slate-900/80 p-2 rounded border border-slate-800">
                    {card.drift}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded">
                  <strong>Preuve Physique :</strong> {card.physicalLaw}
                </div>

                {/* Arbitrage Financier DZD */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Action Préventive</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {card.estimatedCostDzd.toLocaleString()} DZD
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Risque Inaction</span>
                    <span className="text-rose-400 font-bold font-mono">
                      {card.inactionRiskDzd.toLocaleString()} DZD
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Cooldown restant : {card.cooldownHoursRemaining}h
                  </span>

                  {card.status === 'ACTIVE_CARD' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSnooze(card.id)}
                        className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition"
                      >
                        Snooze 72h
                      </button>
                      <button
                        onClick={() => handleCreateWorkOrder(card.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded transition flex items-center gap-1"
                      >
                        <Wrench className="w-3 h-3" /> Créer OT 1-Clic
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONGLET 2 : MATRICE DE RÉCONCILIATION FACTURES ATELIER (PILIER 4) */}
      {activeTab === 'INVOICE_RECONCILER' && (
        <div className="space-y-5">
          <div className="p-3 bg-sky-950/20 border border-sky-800/40 rounded-lg text-xs text-sky-300 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-400" />
            <strong>Règle Déterministe d'Immunité Fiscale :</strong> Validation automatique si au moins l'un des 3 scénarios (HT direct, TTC 19% TVA algérienne, Timbre fiscal DGI 1% / Remise) concorde à ± 5 DZD près.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne Saisie Facture */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                Données Extraites du Bon d'Atelier
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Ligne 1 : Plaquettes Knorr SN7 (DZD)</label>
                  <input
                    type="number"
                    value={line1Total}
                    onChange={(e) => setLine1Total(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Ligne 2 : Disques de frein 45mm (DZD)</label>
                  <input
                    type="number"
                    value={line2Total}
                    onChange={(e) => setLine2Total(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono"
                  />
                </div>

                <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80 flex justify-between font-mono">
                  <span className="text-slate-400">Somme des Lignes (HT) :</span>
                  <span className="text-white font-bold">{sumLines.toLocaleString()} DZD</span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <label className="text-amber-400 block mb-1 font-semibold">Total Réclamé en Bas de Page (DZD)</label>
                  <input
                    type="number"
                    value={claimedTotal}
                    onChange={(e) => setClaimedTotal(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded p-2 text-amber-300 font-mono font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Colonne Résultat Matrice 3 Scénarios */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Évaluation Déterministe en Centimes Entiers
              </h4>

              <div className="space-y-2 text-xs">
                {/* Scénario 1 */}
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    winningScenario === 'SCENARIO_1_BRUT_HT'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <strong className="block text-slate-200">1. Égalité Brute HT</strong>
                    <span className="text-[11px]">|Somme - Total| = {delta1.toFixed(2)} DZD</span>
                  </div>
                  <span className="font-mono text-xs font-bold">
                    {delta1 <= 5 ? '✓ CONCORDE' : '✕ ÉCART'}
                  </span>
                </div>

                {/* Scénario 2 */}
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    winningScenario === 'SCENARIO_2_TTC_19PCT'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <strong className="block text-slate-200">2. Soumission avec TVA 19%</strong>
                    <span className="text-[11px]">|Somme × 1.19 - Total| = {delta2.toFixed(2)} DZD</span>
                  </div>
                  <span className="font-mono text-xs font-bold">
                    {delta2 <= 5 ? '✓ CONCORDE' : '✕ ÉCART'}
                  </span>
                </div>

                {/* Scénario 3 */}
                <div
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    winningScenario === 'SCENARIO_3_TIMBRE_OU_REMISE'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <strong className="block text-slate-200">3. Timbre DGI (1%) ou Remise</strong>
                    <span className="text-[11px]">|Somme + Timbre - Remise - Total| = {delta3.toFixed(2)} DZD</span>
                  </div>
                  <span className="font-mono text-xs font-bold">
                    {delta3 <= 5 ? '✓ CONCORDE' : '✕ ÉCART'}
                  </span>
                </div>
              </div>

              {/* Statut Final */}
              <div
                className={`p-3 rounded-lg border text-center ${
                  isReconciled
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500 text-rose-300'
                }`}
              >
                <div className="text-xs uppercase font-bold tracking-wider">
                  {isReconciled ? '✓ STATUT : RÉCONCILIÉ AUTOMATIQUE' : '⚠ STATUT : RELECTURE MANUELLE REQUISE'}
                </div>
                <div className="text-[11px] mt-1 opacity-90">
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
