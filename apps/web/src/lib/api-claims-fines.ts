import {
  AccidentClaim,
  CreateAccidentClaimDto,
  ClaimStatus,
  TrafficFine,
  RecordTrafficFineDto,
  InsuranceCase,
  InsuranceRiskScore,
} from '@docteurflotte/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchClaims(token?: string, params?: { assetId?: string; status?: ClaimStatus }): Promise<AccidentClaim[]> {
  const query = new URLSearchParams();
  if (params?.assetId) query.set('assetId', params.assetId);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/claims-fines/claims?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des sinistres');
  return res.json();
}

export async function createAccidentClaim(token: string, dto: CreateAccidentClaimDto): Promise<AccidentClaim> {
  const res = await fetch(`${API_BASE}/claims-fines/claims`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Erreur lors de la déclaration du sinistre');
  return res.json();
}

export async function fetchFines(token?: string, params?: { assetId?: string; driverId?: string; isPaid?: boolean }): Promise<TrafficFine[]> {
  const query = new URLSearchParams();
  if (params?.assetId) query.set('assetId', params.assetId);
  if (params?.driverId) query.set('driverId', params.driverId);
  if (params?.isPaid !== undefined) query.set('isPaid', String(params.isPaid));

  const res = await fetch(`${API_BASE}/claims-fines/fines?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des procès-verbaux');
  return res.json();
}

export async function recordFine(token: string, dto: RecordTrafficFineDto): Promise<TrafficFine> {
  const res = await fetch(`${API_BASE}/claims-fines/fines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Erreur lors de l’enregistrement de l’amende');
  return res.json();
}

export async function payTrafficFine(token: string, id: string): Promise<TrafficFine> {
  const res = await fetch(`${API_BASE}/claims-fines/fines/${id}/pay`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Erreur lors de l’acquittement de l’amende');
  return res.json();
}

export async function contestTrafficFine(token: string, id: string, reason: string): Promise<TrafficFine> {
  const res = await fetch(`${API_BASE}/claims-fines/fines/${id}/contest`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('Erreur lors de la contestation de l’amende');
  return res.json();
}

export async function fetchInsuranceCases(token?: string, params?: { assetId?: string; isClosed?: boolean }): Promise<InsuranceCase[]> {
  const query = new URLSearchParams();
  if (params?.assetId) query.set('assetId', params.assetId);
  if (params?.isClosed !== undefined) query.set('isClosed', String(params.isClosed));

  const res = await fetch(`${API_BASE}/claims-fines/insurance-cases?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des dossiers assurances');
  return res.json();
}

export async function fetchFleetRiskSummary(token?: string): Promise<InsuranceRiskScore[]> {
  const res = await fetch(`${API_BASE}/claims-fines/risk-scores/fleet`, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });
  if (!res.ok) throw new Error('Erreur lors du calcul des scores de risque flotte');
  return res.json();
}

