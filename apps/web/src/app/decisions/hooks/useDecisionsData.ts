'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { FleetIntelligenceClient, type DispatchDecisionResult } from '@/lib/api-fleet-intelligence';
import { CalculationProofBuilder } from '@/lib/calculation-proofs';
import type { CalculationProofData } from '@/components/decisions';
import { getSimulationDispatchCandidates, getSimulationDecisions } from '@/lib/simulation-sandbox';
import type { DecisionItem, BudgetVarianceReport, SimScenarioId, UrgencyFilter } from '../types';

export function useDecisionsData(selectedUrgency: UrgencyFilter) {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [budgetReport, setBudgetReport] = useState<BudgetVarianceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // État du simulateur d'affectation ADS
  const [dispatchResult, setDispatchResult] = useState<DispatchDecisionResult | null>(null);
  const [isEvaluatingDispatch, setIsEvaluatingDispatch] = useState(false);
  const [simScenario, setSimScenario] = useState<SimScenarioId>('ENACTA_EXPIRED');

  // Modal Preuve de Calcul
  const [proofModalData, setProofModalData] = useState<CalculationProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const { isDemoMode, session } = useDemoMode();

  const handleOpenDecisionProof = useCallback((dec: DecisionItem) => {
    const proof = CalculationProofBuilder.buildMaintenanceDecisionProof(dec);
    setProofModalData(proof);
    setIsProofModalOpen(true);
  }, []);

  const handleOpenDispatchProof = useCallback((res: DispatchDecisionResult) => {
    const proof = CalculationProofBuilder.buildDispatchProof(res);
    setProofModalData(proof);
    setIsProofModalOpen(true);
  }, []);

  const handleEvaluateDispatch = useCallback(
    async (scenarioParam?: SimScenarioId) => {
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
    },
    [API_URL, isDemoMode, session.token, simScenario]
  );

  const fetchData = useCallback(async () => {
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
  }, [API_URL, isDemoMode, session.token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEvaluate = useCallback(async () => {
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
    } catch {
      setNotification('Erreur lors de l\'évaluation des règles décisionnelles.');
    } finally {
      setIsEvaluating(false);
    }
  }, [API_URL]);

  const handleApprove = useCallback(
    async (dec: DecisionItem) => {
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
          setDecisions((prev) => prev.filter((d) => d.id !== dec.id));
          setNotification('Arbitrage validé. Ordre de Travail budgété créé.');
        }
      } catch {
        setNotification('Erreur lors de l\'approbation de la recommandation.');
      }
    },
    [API_URL]
  );

  const handleDismiss = useCallback(
    async (dec: DecisionItem) => {
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
      } catch {
        setNotification('Erreur lors du report.');
      }
    },
    [API_URL]
  );

  const filteredDecisions = decisions.filter((d) => {
    if (selectedUrgency === 'ALL') return true;
    return d.urgency === selectedUrgency;
  });

  const totalActionCost = decisions.reduce((acc, d) => acc + Number(d.estimatedActionCost), 0);
  const totalInactionRisk = decisions.reduce((acc, d) => acc + Number(d.costInactionRisk), 0);
  const totalExpectedSavings = totalInactionRisk - totalActionCost;

  const handleOpenInactionKpiProof = useCallback(() => {
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
  }, [decisions.length, totalActionCost, totalInactionRisk]);

  const handleOpenSavingsKpiProof = useCallback(() => {
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
  }, [totalActionCost, totalExpectedSavings, totalInactionRisk]);

  return {
    decisions,
    filteredDecisions,
    budgetReport,
    isLoading,
    isEvaluating,
    notification,
    setNotification,
    dispatchResult,
    isEvaluatingDispatch,
    simScenario,
    setSimScenario,
    proofModalData,
    isProofModalOpen,
    setIsProofModalOpen,
    totalActionCost,
    totalInactionRisk,
    totalExpectedSavings,
    handleEvaluate,
    handleApprove,
    handleDismiss,
    handleEvaluateDispatch,
    handleOpenDecisionProof,
    handleOpenDispatchProof,
    handleOpenInactionKpiProof,
    handleOpenSavingsKpiProof,
  };
}
