export interface MaintenanceDecision {
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

export interface BudgetReport {
  period: string;
  budgetAllocated: number;
  actualSpent: number;
  varianceAmount: number;
  variancePercentage: number;
  status: string;
  currency: string;
}

/**
 * Données de décisions de maintenance et rapport budgétaire — STRICTEMENT RÉSERVÉ AU MODE SIMULATION (isDemoMode === true).
 */
export const MOCK_SANDBOX_DECISIONS: MaintenanceDecision[] = [
  {
    id: 'dec-demo-01',
    assetId: 'ast-01',
    assetName: 'Tracteur Scania R450',
    assetCode: 'PL-16-042-DZ',
    assetCategory: 'HEAVY_TRUCK',
    ruleId: 'RULE-DEC-001',
    urgency: 'danger',
    title: 'Échéance de révision critique dépassée (+1 500 km)',
    description:
      'Compteur actuel 121 500 km vs échéance 120 000 km. Risque immédiat de grippage paliers et casse turbo en exploitation autoroutière.',
    estimatedActionCost: 51000,
    costInactionRisk: 298500,
    netExpectedSavings: 247500,
    confidenceScore: 98,
    status: 'PENDING',
    dataOrigin: 'DEMO',
    explanationDossier: {
      inputMetrics: {
        currentMeterValue: 121500,
        nextMaintenanceMeterValue: 120000,
        deltaOverdue: 1500,
        meterType: 'ODOMETER_KM',
      },
      economicHypotheses: {
        hourlyLaborRateApplied: 1500,
        estimatedLaborHours: 4,
        estimatedPartsCost: 45000,
        inactionMultiplier: 3.5,
      },
      potentialFailureModes: [
        'Casse turbocompresseur',
        'Arrêt d exploitation en mission',
        'Frais de remorquage lourd',
      ],
      mitigationAction: 'Planifier immédiatement la vidange complète et remplacement filtres.',
    },
  },
  {
    id: 'dec-demo-02',
    assetId: 'ast-02',
    assetName: 'Pelle Hydraulique Cat 320D',
    assetCode: 'ENG-23-018-DZ',
    assetCategory: 'CONSTRUCTION_HEAVY',
    ruleId: 'RULE-DEC-002',
    urgency: 'warning',
    title: "Préavis d'échéance hydraulique (88% de cycle atteint)",
    description:
      "Cycle de filtration à 440h sur 500h. Commande préalable recommandée pour éviter l'arrêt de chantier.",
    estimatedActionCost: 25000,
    costInactionRisk: 55000,
    netExpectedSavings: 30000,
    confidenceScore: 94,
    status: 'PENDING',
    dataOrigin: 'DEMO',
    explanationDossier: {
      inputMetrics: {
        currentMeterValue: 440,
        nextMaintenanceMeterValue: 500,
        remainingUnits: 60,
        progressPercentage: 88,
      },
      economicHypotheses: { hourlyLaborRateApplied: 1500, safetyStockDays: 7 },
      potentialFailureModes: ['Rupture de stock consommables atelier', 'Surcoût express'],
      mitigationAction: 'Pré-commander cartouches de filtres homologués.',
    },
  },
];

export const MOCK_SANDBOX_BUDGET_REPORT: BudgetReport = {
  period: '2026-Q4',
  budgetAllocated: 1500000,
  actualSpent: 1120000,
  varianceAmount: -380000,
  variancePercentage: -25.3,
  status: 'ON_TRACK',
  currency: 'DZD',
};

export async function getSimulationDecisions() {
  return {
    decisions: MOCK_SANDBOX_DECISIONS,
    budgetReport: MOCK_SANDBOX_BUDGET_REPORT,
  };
}
