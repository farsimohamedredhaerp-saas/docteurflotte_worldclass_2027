import {
  AssetCostCenter,
  AssetDirectCostsSummary,
  RepairVsReplaceSimulation,
  CostTwinSummary,
} from '@docteurflotte/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchCostCenters(token?: string): Promise<AssetCostCenter[]> {
  const res = await fetch(`${API_BASE}/tco/cost-centers`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des centres de coûts');
  return res.json();
}

export async function assignCostCenter(
  token: string,
  dto: {
    assetId: string;
    costCenterCode: string;
    allocatedBusinessUnit: string;
    targetCostPerKmDzd?: number;
    targetCostPerHourDzd?: number;
    monthlyFixedBudgetDzd?: number;
  },
): Promise<AssetCostCenter> {
  const res = await fetch(`${API_BASE}/tco/cost-centers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Erreur lors de l’affectation du centre de coût');
  return res.json();
}

export async function fetchFleetTcoSummary(
  token?: string,
  params?: { year?: number; month?: number },
): Promise<AssetDirectCostsSummary[]> {
  const query = new URLSearchParams();
  if (params?.year) query.set('year', String(params.year));
  if (params?.month) query.set('month', String(params.month));

  const res = await fetch(`${API_BASE}/tco/summary?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du calcul de la synthèse TCO');
  return res.json();
}

export async function fetchAssetTcoSummary(
  token: string,
  assetId: string,
  params?: { year?: number; month?: number },
): Promise<AssetDirectCostsSummary> {
  const query = new URLSearchParams();
  if (params?.year) query.set('year', String(params.year));
  if (params?.month) query.set('month', String(params.month));

  const res = await fetch(`${API_BASE}/tco/summary/asset/${assetId}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur lors du calcul du TCO de l'actif ${assetId}`);
  return res.json();
}

export async function simulateRepairVsReplace(
  token: string,
  assetId: string,
  horizonMonths: number = 24,
): Promise<RepairVsReplaceSimulation> {
  const res = await fetch(`${API_BASE}/tco/simulations/repair-vs-replace/${assetId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ horizonMonths }),
  });
  if (!res.ok) throw new Error('Erreur lors de l’exécution de la simulation Réparer vs Remplacer');
  return res.json();
}

export async function fetchFleetCostTwin(
  token?: string,
  period?: string,
): Promise<CostTwinSummary[]> {
  const query = new URLSearchParams();
  if (period) query.set('period', period);

  const res = await fetch(`${API_BASE}/tco/cost-twin?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du calcul du jumeau de coût de la flotte');
  return res.json();
}

export async function fetchAssetCostTwin(
  token: string,
  assetId: string,
  period?: string,
): Promise<CostTwinSummary> {
  const query = new URLSearchParams();
  if (period) query.set('period', period);

  const res = await fetch(`${API_BASE}/tco/cost-twin/asset/${assetId}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur lors du calcul du jumeau de coût de l'actif ${assetId}`);
  return res.json();
}


