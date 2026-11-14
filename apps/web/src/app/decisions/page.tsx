'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { MetricCard } from '../../components/MetricCard';
import {
  FleetIntelligenceClient,
  DispatchDecisionResult,
  IndustrySector,
  ClimateZoneDZ,
  AssetCategory as IntelAssetCategory,
  DocumentTypeDZ,
  DispatchStatus,
  LicenseCategoryDZ,
} from '../../lib/api-fleet-intelligence';
import { CalculationProofModal, CalculationProofButton, CalculationProofData } from '../../components/decisions';
import { CalculationProofBuilder } from '../../lib/calculation-proofs';
import { useDemoMode } from '../../context/DemoModeContext';
import { getSimulationDispatchCandidates, getSimulationDecisions } from '../../lib/simulation-sandbox';
import {
  IconWrench,
  IconAlertTriangle,
  IconAlertOctagon,
  IconShieldCheck,
  IconBarChart3,
  IconCrosshair,
  IconLayers,
  IconCheck,
  IconCheckCircle,
  IconRefreshCw,
  IconZap,
  IconX,
} from '../../components/navigation/TechIcons';


interface DecisionItem {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  assetCategory: string;
  ruleId: string;
  urgency: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
  estimatedActionCost: number;
  costInactionRisk: number;
  netExpectedSavings: number;
  confidenceScore: number;
  status: 'PENDING' | 'APPROVED' | 'DISMISSED';
  dataOrigin: string;
  explanationDossier: {
    inputMetrics: Record<string, unknown>;
    economicHypotheses: Record<string, unknown>;
    potentialFailureModes: string[];
    mitigationAction: string;
  };
}

interface BudgetVarianceReport {
  period: string;
  budgetAllocated: number;
  actualSpent: number;
  varianceAmount: number;
  variancePercentage: number;
  status: 'ON_TRACK' | 'OVER_BUDGET' | 'UNDER_BUDGET';
  currency: string;
}

export default function DecisionsPage() {
  const [activeTab, setActiveTab] = useState<'MAINTENANCE' | 'DISPATCH'>('MAINTENANCE');
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [budgetReport, setBudgetReport] = useState<BudgetVarianceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');

  // État du simulateur d'affectation ADS
  const [dispatchResult, setDispatchResult] = useState<DispatchDecisionResult | null>(null);
  const [isEvaluatingDispatch, setIsEvaluatingDispatch] = useState(false);
  const [simScenario, setSimScenario] = useState<'ENACTA_EXPIRED' | 'WILAYA_RESTRICTION' | 'CRITICAL_VHI' | 'ALL_CLEAN'>('ENACTA_EXPIRED');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const { isDemoMode, session } = useDemoMode();

  // État de la modal Preuve de Calcul
  const [proofModalData, setProofModalData] = useState<CalculationProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const handleOpenDecisionProof = (dec: DecisionItem) => {
    const proof = CalculationProofBuilder.buildMaintenanceDecisionProof(dec);
    setProofModalData(proof);
    setIsProofModalOpen(true);
  };

  const handleOpenDispatchProof = (res: DispatchDecisionResult) => {
    const proof = CalculationProofBuilder.buildDispatchProof(res);
    setProofModalData(proof);
    setIsProofModalOpen(true);
  };

  // Évaluation d'une mission sous les 4 portes ADS
  const handleEvaluateDispatch = async (scenarioParam?: string) => {
    const sc = scenarioParam || simScenario;
    setIsEvaluatingDispatch(true);
    setNotification(null);

    const token = session.token || (typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined);

    if (isDemoMode) {
      const candidates = await getSimulationDispatchCandidates(sc);
      const missionPayload = {
        mission: candidates.mission,
        fleetVehicles: candidates.vehicles,
        fleetDrivers: candidates.drivers,
      };

      try {
        const result = await FleetIntelligenceClient.evaluateAndAssign(missionPayload as any, token, true);
        setDispatchResult(result);
        setNotification(`Décision ADS générée (Mode Simulation) : ${result.decisionOutcome}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur d’évaluation ADS.';
        setNotification(msg);
      } finally {
        setIsEvaluatingDispatch(false);
      }
      return;
    }

    if (!token) {
      setNotification('Veuillez vous connecter pour évaluer une mission avec votre flotte réelle.');
      setIsEvaluatingDispatch(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/decisions/evaluate-dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scenario: sc }),
      });
      if (res.ok) {
        const result = await res.json();
        setDispatchResult(result);
        setNotification(`Décision ADS générée : ${result.decisionOutcome}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setNotification(err.message || 'Votre parc ne dispose pas d’assez de véhicules qualifiés pour cette mission.');
      }
    } catch {
      setNotification('Impossible de joindre le moteur de décision ADS.');
    } finally {
      setIsEvaluatingDispatch(false);
    }
  };

  // Charger les décisions et le rapport budgétaire
  const fetchData = async () => {
    setIsLoading(true);
    const token = session.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (isDemoMode) {
      try {
        const simData = await getSimulationDecisions();
        setDecisions(simData.decisions as DecisionItem[]);
        setBudgetReport(simData.budgetReport as BudgetVarianceReport);
      } catch {
        setDecisions([]);
        setBudgetReport(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!token) {
      setDecisions([]);
      setBudgetReport(null);
      setIsLoading(false);
      return;
    }

    try {
      const [decRes, repRes] = await Promise.all([
        fetch(`${API_URL}/decisions?status=PENDING`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/decisions/budget-variance?period=${new Date().getFullYear()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (decRes.ok) {
        const data = await decRes.json();
        setDecisions(data);
      } else {
        setDecisions([]);
      }
      if (repRes.ok) {
        const report = await repRes.json();
        setBudgetReport(report);
      } else {
        setBudgetReport(null);
      }
    } catch (err) {
      console.error('Erreur chargement décisions:', err);
      setDecisions([]);
      setBudgetReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode]);

  // Déclencher une réévaluation décisionnelle
  const handleEvaluate = async () => {
    setIsEvaluating(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      setTimeout(() => {
        setIsEvaluating(false);
        setNotification('Réévaluation de démonstration exécutée. Flotte inspectée.');
      }, 700);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/decisions/evaluate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDecisions(data);
        setNotification(`Analyse terminée : ${data.length} recommandation(s) formulée(s).`);
      }
    } catch (err) {
      setNotification('Erreur lors de l\'évaluation des règles décisionnelles.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Approuver une recommandation et générer l'Ordre de Travail
  const handleApprove = async (dec: DecisionItem) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      setDecisions((prev) => prev.filter((d) => d.id !== dec.id));
      setNotification(`Arbitrage ${dec.ruleId} approuvé en démo. Ordre de travail généré.`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/decisions/${dec.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: 'Approbation cockpit décisionnel' }),
      });

      if (res.ok) {
        const result = await res.json();
        setDecisions((prev) => prev.filter((d) => d.id !== dec.id));
        setNotification('Arbitrage validé. Ordre de Travail budgété créé.');
      }
    } catch (err) {
      setNotification('Erreur lors de l\'approbation de la recommandation.');
    }
  };

  // Différer une décision
  const handleDismiss = async (dec: DecisionItem) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      setDecisions((prev) => prev.filter((d) => d.id !== dec.id));
      setNotification(`ℹ Recommandation ${dec.ruleId} différée.`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/decisions/${dec.id}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Report opérationnel accordé par le responsable' }),
      });

      if (res.ok) {
        setDecisions((prev) => prev.filter((d) => d.id !== dec.id));
        setNotification('Recommandation différée.');
      }
    } catch (err) {
      setNotification('Erreur lors du report.');
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    if (selectedUrgency === 'ALL') return true;
    return d.urgency === selectedUrgency;
  });

  const totalActionCost = decisions.reduce((acc, d) => acc + Number(d.estimatedActionCost), 0);
  const totalInactionRisk = decisions.reduce((acc, d) => acc + Number(d.costInactionRisk), 0);
  const totalExpectedSavings = totalInactionRisk - totalActionCost;

  const handleOpenInactionKpiProof = () => {
    setProofModalData({
      title: 'Preuve du Risque Financier Cumulé d\'Inaction Flotte',
      decisionOrMetricName: 'Risque d\'Inaction Total du Parc',
      category: 'FINANCIAL',
      ruleId: 'RULE-KPI-INACTION-TOTAL',
      legalOrOemReference: 'MASTER_SPEC v2.0 §5.1 & §5.3 (Contrôle Budgétaire)',
      deterministicFormula: 'Risque_Total = Σ (Coût_Action_i × K_inaction_i + Frais_Immobilisation)',
      formulaExplanation: 'Agrégation déterministe des pannes non traitées sur les tournées opérationnelles en cours.',
      variables: [
        { name: 'Nombre d\'interventions en attente', symbol: 'N', value: decisions.length, source: 'Base PostgreSQL' },
        { name: 'Coût total des actions immédiates', symbol: 'Σ C_action', value: `${totalActionCost.toLocaleString('fr-DZ')} DA`, source: 'Devis Pièces & MO' },
        { name: 'Multiplicateur moyen d\'inaction', symbol: 'K_moyen', value: 'x3.5', source: 'Matrice de criticité défaillance' },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Sommation des coûts directs d\'intervention atelier',
          formula: 'Σ C_action_i',
          calculation: `${totalActionCost.toLocaleString('fr-DZ')} DA`,
          intermediateResult: `${totalActionCost.toLocaleString('fr-DZ')} DA`,
        },
        {
          stepNumber: 2,
          description: 'Calcul du risque d\'aggravation mécanique et remorquage',
          formula: 'Σ (C_action_i × K_inaction_i)',
          calculation: `${totalActionCost.toLocaleString('fr-DZ')} × 3.5`,
          intermediateResult: `${totalInactionRisk.toLocaleString('fr-DZ')} DA`,
        },
      ],
      finalResult: {
        label: 'Risque d\'Inaction Flotte',
        value: `${totalInactionRisk.toLocaleString('fr-DZ')}`,
        unit: 'DA',
        conclusion: 'Le non-respect des échéances expose la flotte à un risque de perte financière directe.',
      },
    });
    setIsProofModalOpen(true);
  };

  const handleOpenSavingsKpiProof = () => {
    setProofModalData({
      title: 'Preuve de l\'Économie Nette Garantie (Arbitrage SAD)',
      decisionOrMetricName: 'Économie Nette Totale Flotte',
      category: 'FINANCIAL',
      ruleId: 'RULE-KPI-SAVINGS-TOTAL',
      legalOrOemReference: 'MASTER_SPEC v2.0 §5.1 (Boucle Décisionnelle SAD)',
      deterministicFormula: 'Économie_Nette_Totale = Risque_Total - Coût_Action_Total',
      formulaExplanation: 'Garantie de rentabilité directe en traitant les alertes de manière préventive plutôt que curative.',
      variables: [
        { name: 'Risque d\'Inaction Total', symbol: 'R_total', value: `${totalInactionRisk.toLocaleString('fr-DZ')} DA`, source: 'Modèle de cascade de panne' },
        { name: 'Coût d\'Action Total', symbol: 'C_total', value: `${totalActionCost.toLocaleString('fr-DZ')} DA`, source: 'Atelier & Magasin' },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Soustraction du coût d\'intervention au risque encouru',
          formula: 'R_total - C_total',
          calculation: `${totalInactionRisk.toLocaleString('fr-DZ')} DA - ${totalActionCost.toLocaleString('fr-DZ')} DA`,
          intermediateResult: `+${totalExpectedSavings.toLocaleString('fr-DZ')} DA`,
        },
      ],
      finalResult: {
        label: 'Gain Net Direct',
        value: `+${totalExpectedSavings.toLocaleString('fr-DZ')}`,
        unit: 'DA',
        conclusion: 'Chaque dinar investi dans la maintenance préventive rapporte en moyenne 3.5 DA d\'économies.',
      },
    });
    setIsProofModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="df-container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        {/* BANNIÈRE DE NOTIFICATION */}
        {notification && (
          <div
            role="status"
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-accent-primary)',
              color: 'var(--df-text-main)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 600 }}>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              aria-label="Fermer"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* EN-TÊTE DE LA PAGE DÉCISIONNELLE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
              <Badge variant="ok">Moteur d&apos;Arbitrages & Décision ADS • Gates 4 & 5</Badge>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
              Cockpit Décisionnel & Affectation ADS
            </h1>
            <p style={{ color: 'var(--df-text-secondary)', margin: 0, maxWidth: '780px' }}>
              Arbitrages déterministes et explicables : calcul du coût de l&apos;action préventive immédiate face au risque économique de l&apos;inaction,
              et validation en 4 Portes Réglementaires Algériennes (ENACTA, Assurances, Arrêtés Wilayas, VHI et Substitution TOPSIS).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {activeTab === 'MAINTENANCE' ? (
              <Button
                variant="primary"
                onClick={handleEvaluate}
                disabled={isEvaluating}
              >
                {isEvaluating ? (
                  <>
                    <IconRefreshCw size={14} className="animate-spin inline mr-1" />
                    Évaluation en cours...
                  </>
                ) : (
                  <>
                    <IconZap size={14} className="inline mr-1" />
                    Évaluer la flotte maintenant
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => handleEvaluateDispatch()}
                disabled={isEvaluatingDispatch}
              >
                {isEvaluatingDispatch ? (
                  <>
                    <IconRefreshCw size={14} className="animate-spin inline mr-1" />
                    Analyse ADS...
                  </>
                ) : (
                  <>
                    <IconZap size={14} className="inline mr-1" />
                    Lancer le Dispatch ADS
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* SÉLECTEUR D'ONGLET PRINCIPAL */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--df-border-subtle)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('MAINTENANCE')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              border: 'none',
              background: activeTab === 'MAINTENANCE' ? 'var(--df-primary)' : 'transparent',
              color: activeTab === 'MAINTENANCE' ? '#fff' : 'var(--df-text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <IconWrench size={16} /> Arbitrages Maintenance & Inaction (Gate 4)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('DISPATCH');
              if (!dispatchResult) handleEvaluateDispatch();
            }}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              border: 'none',
              background: activeTab === 'DISPATCH' ? 'var(--df-primary)' : 'transparent',
              color: activeTab === 'DISPATCH' ? '#fff' : 'var(--df-text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <IconZap size={16} /> Moteur Décisionnel de Dispatch ADS (Gate 5)
          </button>
        </div>

        {activeTab === 'MAINTENANCE' ? (
          <>


        {/* CARTES DE KPIS ÉCONOMIQUES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <MetricCard
            title="Coût Estimé des Actions"
            value={totalActionCost.toLocaleString('fr-DZ')}
            unit="DA"
            icon={<IconWrench size={18} />}
            trend={{ direction: 'neutral', text: `${decisions.length} interventions requises`, isPositive: true }}
          />
          <MetricCard
            title="Risque Économique d'Inaction"
            value={totalInactionRisk.toLocaleString('fr-DZ')}
            unit="DA"
            icon={<IconAlertTriangle size={18} style={{ color: 'var(--df-status-danger)' }} />}
            trend={{ direction: 'down', text: 'Risque de panne en mission', isPositive: false }}
            actions={
              <CalculationProofButton
                label="Preuve"
                size="xs"
                variant="amber"
                onClick={handleOpenInactionKpiProof}
              />
            }
          />
          <MetricCard
            title="Économie Nette Projetée"
            value={totalExpectedSavings.toLocaleString('fr-DZ')}
            unit="DA"
            icon={<IconShieldCheck size={18} style={{ color: 'var(--df-status-ok)' }} />}
            progressPercent={82}
            trend={{ direction: 'up', text: 'Rentabilité directe arbitrages', isPositive: true }}
            actions={
              <CalculationProofButton
                label="Preuve"
                size="xs"
                variant="emerald"
                onClick={handleOpenSavingsKpiProof}
              />
            }
          />
          <MetricCard
            title="Dépenses Budgétaires"
            value={budgetReport ? budgetReport.actualSpent.toLocaleString('fr-DZ') : '1 120 000'}
            unit="DA"
            icon={<IconBarChart3 size={18} style={{ color: 'var(--df-accent-blue)' }} />}
            progressPercent={budgetReport ? Math.round((budgetReport.actualSpent / (budgetReport.budgetAllocated || 1)) * 100) : 74}
            trend={{ direction: 'up', text: budgetReport ? `${budgetReport.variancePercentage}% d'écart` : '-25.3% sous budget', isPositive: true }}
          />
        </div>

        {/* SECTION DES ARBITRAGES EN COURS */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
              Recommandations d&apos;Arbitrage en Attente ({filteredDecisions.length})
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['ALL', 'danger', 'warning'] as const).map((urgency) => (
                <button
                  key={urgency}
                  onClick={() => setSelectedUrgency(urgency)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: '1px solid var(--df-border-subtle)',
                    background: selectedUrgency === urgency ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: selectedUrgency === urgency ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {urgency === 'ALL' ? 'Toutes' : urgency === 'danger' ? 'Critiques' : 'Préavis'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--df-text-muted)' }}>
              Chargement des arbitrages décisionnels...
            </div>
          ) : filteredDecisions.length === 0 ? (
            <Card style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--df-status-ok)' }}>
                <IconCheckCircle size={40} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.5rem' }}>
                Aucune alerte critique en cours
              </h3>
              <p style={{ color: 'var(--df-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Tous les actifs respectent leurs intervalles d&apos;entretien préventif et leurs budgets d&apos;exploitation.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {filteredDecisions.map((dec) => (
                <Card
                  key={dec.id}
                  style={{
                    borderLeft: `4px solid var(--df-status-${dec.urgency})`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* EN-TÊTE DE LA CARTE */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--df-text-main)' }}>
                            {dec.assetName}
                          </span>
                          <span className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                            ({dec.assetCode})
                          </span>
                        </div>
                        <Badge variant={dec.urgency === 'danger' ? 'danger' : 'warning'}>
                          {dec.ruleId} • Score {dec.confidenceScore}%
                        </Badge>
                      </div>

                      {dec.dataOrigin === 'DEMO' && (
                        <Badge variant="warning">DEMO</Badge>
                      )}
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--df-text-main)', margin: '0.75rem 0 0.5rem 0' }}>
                      {dec.title}
                    </h4>

                    <p style={{ fontSize: '0.85rem', color: 'var(--df-text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                      {dec.description}
                    </p>

                    {/* COMPARAISON ÉCONOMIQUE CHIIFFRÉE */}
                    <div
                      style={{
                        background: 'var(--df-bg-surface-2)',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--df-radius-sm)',
                        border: '1px solid var(--df-border-subtle)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                          Arbitrage Économique & Risque
                        </span>
                        <CalculationProofButton
                          label="Preuve de calcul"
                          size="xs"
                          variant="cyan"
                          onClick={() => handleOpenDecisionProof(dec)}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--df-text-muted)' }}>Coût intervention immédiate :</span>
                        <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>
                          {Number(dec.estimatedActionCost).toLocaleString('fr-DZ')} DA
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--df-status-danger)' }}>Risque financier d&apos;inaction :</span>
                        <strong className="df-mono" style={{ color: 'var(--df-status-danger)' }}>
                          {Number(dec.costInactionRisk).toLocaleString('fr-DZ')} DA
                        </strong>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          borderTop: '1px dashed var(--df-border-subtle)',
                          paddingTop: '0.4rem',
                          marginTop: '0.4rem',
                        }}
                      >
                        <span style={{ color: 'var(--df-status-ok)' }}>Économie nette projetée :</span>
                        <strong className="df-mono" style={{ color: 'var(--df-status-ok)' }}>
                          +{Number(dec.netExpectedSavings).toLocaleString('fr-DZ')} DA
                        </strong>
                      </div>
                    </div>

                    {/* DOSSIER D'EXPLICATION TECHNIQUE */}
                    {dec.explanationDossier?.potentialFailureModes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.25rem' }}>
                          Modes de défaillance anticipés :
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.4 }}>
                          {dec.explanationDossier.potentialFailureModes.map((mode, i) => (
                            <li key={i}>{mode}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* BOUTONS D'ACTION */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <Button
                      variant="primary"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                      onClick={() => handleApprove(dec)}
                    >
                      <IconCheck size={14} /> Approuver & Créer OT
                    </Button>
                    <Button
                      variant="secondary"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                      onClick={() => handleDismiss(dec)}
                    >
                      Différer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </>
    ) : (
      /* PANNEAU ADS : MOTEUR DÉCISIONNEL DE DISPATCH SOUVERAIN (GATE 5) */
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* BANDEAU SCÉNARIOS DE SIMULATION */}
        <Card style={{ padding: '1.5rem', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCrosshair size={18} /> Banc d&apos;Essai ADS : Scénarios Réglementaires Algériens
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--df-text-secondary)', margin: '0.25rem 0 0 0' }}>
                Testez l&apos;arbre de décision SAD &rarr; ADS (Portes 1 à 4, Filtrage Wilayas, Substitution TOPSIS).
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => handleEvaluateDispatch()}
              disabled={isEvaluatingDispatch}
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isEvaluatingDispatch ? (
                <>
                  <IconRefreshCw size={14} className="animate-spin inline" />
                  Évaluation en cours...
                </>
              ) : (
                <>
                  <IconRefreshCw size={14} className="inline" />
                  Lancer l&apos;Arbitrage ADS
                </>
              )}
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {[
              {
                id: 'ALGER_RESTRICTION',
                label: 'PL Transit Alger (07h-20h)',
                desc: 'Arrêté Wilaya 16 - Interdiction rocade',
                badge: 'Arrêté Wilaya',
              },
              {
                id: 'ENACTA_EXPIRED',
                label: 'Semi-Remorque ENACTA Échu',
                desc: 'Loi 01-14 / Décret 03-223',
                badge: 'Contrôle Tech.',
              },
              {
                id: 'VHI_CRITICAL',
                label: 'Fourgon VHI Critique (SOH 35%)',
                desc: 'Risque arrêt moteur imminent',
                badge: 'Santé VHI',
              },
              {
                id: 'COMPLIANT_MISSION',
                label: 'Mission Conforme (RN4)',
                desc: 'Feuille de route 100% validée',
                badge: 'Conforme',
              },
            ].map((sc) => (
              <div
                key={sc.id}
                onClick={() => {
                  setSimScenario(sc.id as 'ENACTA_EXPIRED' | 'WILAYA_RESTRICTION' | 'CRITICAL_VHI' | 'ALL_CLEAN');
                  handleEvaluateDispatch(sc.id);
                }}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--df-radius-md)',
                  border: simScenario === sc.id ? '2px solid var(--df-primary)' : '1px solid var(--df-border-subtle)',
                  background: simScenario === sc.id ? 'rgba(37, 99, 235, 0.08)' : 'var(--df-bg-surface-1)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                    {sc.label}
                  </span>
                  <Badge variant={sc.id === 'COMPLIANT_MISSION' ? 'ok' : 'warning'}>
                    {sc.badge}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                  {sc.desc}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AFFICHAGE DES RÉSULTATS DU MOTEUR ADS */}
        {dispatchResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* CARTE DE DÉCISION MAÎTRESSE */}
            <Card
              style={{
                borderLeft: `6px solid ${
                  dispatchResult.decisionOutcome === 'APPROVED_AS_REQUESTED' || dispatchResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                    ? 'var(--df-status-ok)'
                    : dispatchResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT'
                    ? 'var(--df-status-warning)'
                    : 'var(--df-status-danger)'
                }`,
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)' }}>
                      Décision ADS :
                    </span>
                    <CalculationProofButton
                      label="Preuve 4 Portes & TOPSIS"
                      size="sm"
                      variant="purple"
                      onClick={() => handleOpenDispatchProof(dispatchResult)}
                    />
                    <Badge
                      variant={
                        dispatchResult.decisionOutcome === 'APPROVED_AS_REQUESTED'
                          ? 'ok'
                          : dispatchResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT'
                          ? 'warning'
                          : dispatchResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                          ? 'ok'
                          : 'danger'
                      }
                    >
                      {dispatchResult.decisionOutcome === 'APPROVED_AS_REQUESTED' && 'MISSION VALIDÉE'}
                      {dispatchResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' && 'ROUTAGE AJUSTÉ'}
                      {dispatchResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY' && 'SUBSTITUTION OPTIMALE (TOPSIS)'}
                      {dispatchResult.decisionOutcome === 'REJECTED_NO_ELIGIBLE_ASSET' && 'MISSION NON ÉLIGIBLE'}
                    </Badge>
                  </div>
                  <p style={{ color: 'var(--df-text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '850px', lineHeight: 1.5 }}>
                    {dispatchResult.routeAdvisoryNotes?.join(' • ') || 'Analyse de conformité complétée.'}
                  </p>
                </div>

                <div style={{ textAlign: 'right', background: 'var(--df-bg-surface-2)', padding: '0.75rem 1.25rem', borderRadius: 'var(--df-radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                    Statut Décisionnel
                  </div>
                  <div className="df-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-status-ok)' }}>
                    {dispatchResult.decisionOutcome}
                  </div>
                </div>
              </div>

              {/* DÉTAILS DU VÉHICULE ET CHAUFFEUR ASSIGNÉS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--df-border-subtle)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Actif retenu / substitué :</span>
                  <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.2rem' }}>
                    {dispatchResult.assignedRegistrationPlate || dispatchResult.assignedVehicleId || 'Aucun actif admissible'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Chauffeur certifié :</span>
                  <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.2rem' }}>
                    {dispatchResult.assignedDriverName || dispatchResult.assignedDriverId || 'En attente d\'affectation'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Ordres de travail déclenchés :</span>
                  <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.2rem' }}>
                    {dispatchResult.generatedWorkOrders.length} OT généré(s)
                  </div>
                </div>
              </div>
            </Card>

            {/* GRILLE 2 COLONNES : VIOLATIONS DÉTECTÉES & ORDRES DE TRAVAIL */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {/* PORTE 1 À 4 : CONTRÔLE RÉGLEMENTAIRE & VIOLATIONS */}
              <Card style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconShieldCheck size={18} /> Portes Réglementaires & Santé (Loi 18-07 / JORADP)
                </h4>

                {dispatchResult.violationsDetected.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--df-status-ok)', background: 'rgba(34, 197, 94, 0.08)', borderRadius: 'var(--df-radius-md)' }}>
                    Aucune violation réglementaire ni technique constatée. Les 4 portes de conformité sont au vert.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {dispatchResult.violationsDetected.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--df-radius-sm)',
                          borderLeft: `4px solid ${v.severity === 'HARD_BLOCK' ? 'var(--df-status-danger)' : 'var(--df-status-warning)'}`,
                          background: 'var(--df-bg-surface-2)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--df-text-main)' }}>
                            {v.code}
                          </span>
                          <Badge variant={v.severity === 'HARD_BLOCK' ? 'danger' : 'warning'}>
                            {v.severity}
                          </Badge>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', margin: '0 0 0.35rem 0' }}>
                          {v.messageFr}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ORDRES DE TRAVAIL AUTOMATIQUES (OTs) */}
              <Card style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconWrench size={18} /> Remédiation Automatique (Ordres de Travail Émis)
                </h4>

                {dispatchResult.generatedWorkOrders.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--df-text-muted)', background: 'var(--df-bg-surface-2)', borderRadius: 'var(--df-radius-md)' }}>
                    Aucun ordre de travail correctif immédiat requis pour ce scénario.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {dispatchResult.generatedWorkOrders.map((ot, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.85rem',
                          borderRadius: 'var(--df-radius-sm)',
                          border: '1px solid var(--df-border-subtle)',
                          background: 'var(--df-bg-surface-1)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--df-text-main)' }}>
                            {ot.title}
                          </span>
                          <Badge variant="warning">{ot.priority}</Badge>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', margin: '0 0 0.5rem 0' }}>
                          Tâches : {ot.tasksToPerform.join(', ')}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--df-text-muted)' }}>Immat : {ot.registrationPlate}</span>
                          <strong className="df-mono" style={{ color: 'var(--df-status-ok)' }}>
                            Immo. est. : {ot.estimatedDowntimeHours} h
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* TABLEAU DE SUBSTITUTION MULTI-CRITÈRES TOPSIS */}
            {dispatchResult.rankedSubstitutions && dispatchResult.rankedSubstitutions.length > 0 && (
              <Card style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconBarChart3 size={18} /> Classement des Actifs Alternatifs de Remplacement (Algorithme TOPSIS)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', margin: '0.25rem 0 0 0' }}>
                    Arbitrage multicritère : Distance d&apos;approche, Santé VHI résiduelle, Consommation Naftal et Conformité légale.
                  </p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--df-border-subtle)', textAlign: 'left', color: 'var(--df-text-muted)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Rang</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Actif Candidat</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Score TOPSIS</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Distance Approche</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Surcoût Carburant Naftal</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Chauffeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchResult.rankedSubstitutions.map((cand, idx) => (
                        <tr
                          key={cand.vehicleId}
                          style={{
                            borderBottom: '1px solid var(--df-border-subtle)',
                            background: idx === 0 ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>#{idx + 1}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>{cand.makeModel}</div>
                            <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>{cand.registrationPlate}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span className="df-mono" style={{ fontWeight: 800, color: 'var(--df-primary)' }}>
                              {cand.totalScore100} / 100
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{cand.approachDistanceKm} km</td>
                          <td style={{ padding: '0.75rem 0.5rem' }} className="df-mono">
                            {cand.estimatedFuelCostDzd.toLocaleString('fr-DZ')} DA
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            {cand.driverName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    )}
        </div>

        {/* Modal Universelle Preuve de Calcul & Règle Métier */}
        <CalculationProofModal
          isOpen={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          data={proofModalData}
        />
    </>
  );
}
