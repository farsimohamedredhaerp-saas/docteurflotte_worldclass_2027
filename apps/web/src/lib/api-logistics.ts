import {
  ConsignmentNote,
  CreateConsignmentNoteDto,
  ProofOfDelivery,
  RecordPodDto,
  DeliveryDispute,
  OtifMetrics,
  ShipmentStatus,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class LogisticsClient {
  static async listLve(
    token: string,
    params?: { assetId?: string; status?: ShipmentStatus },
  ): Promise<ConsignmentNote[]> {
    const url = new URL(`${API_BASE_URL}/logistics/lve`);
    if (params?.assetId) url.searchParams.set('assetId', params.assetId);
    if (params?.status) url.searchParams.set('status', params.status);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les lettres de voiture.');
    return res.json();
  }

  static async createLve(dto: CreateConsignmentNoteDto, token: string): Promise<ConsignmentNote> {
    const res = await fetch(`${API_BASE_URL}/logistics/lve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création de la lettre de voiture.');
    }
    return res.json();
  }

  static async getLve(id: string, token: string): Promise<ConsignmentNote> {
    const res = await fetch(`${API_BASE_URL}/logistics/lve/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Lettre de voiture introuvable.');
    return res.json();
  }

  static async updateLveStatus(
    id: string,
    status: ShipmentStatus,
    token: string,
  ): Promise<ConsignmentNote> {
    const res = await fetch(`${API_BASE_URL}/logistics/lve/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Échec de mise à jour du statut.');
    return res.json();
  }

  static async recordPod(dto: RecordPodDto, token: string): Promise<ProofOfDelivery> {
    const res = await fetch(`${API_BASE_URL}/logistics/pod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l’enregistrement de la preuve de livraison.');
    }
    return res.json();
  }

  static async getPod(lveId: string, token: string): Promise<ProofOfDelivery | null> {
    const res = await fetch(`${API_BASE_URL}/logistics/pod/${lveId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Impossible de charger la POD.');
    return res.json();
  }

  static async createDispute(
    data: {
      lveId: string;
      disputeType: 'DAMAGE' | 'SHORTAGE' | 'REFUSAL' | 'WRONG_ADDRESS' | 'LATE_DELIVERY';
      description: string;
      estimatedClaimAmountDzd?: number;
      photosUrls?: string[];
    },
    token: string,
  ): Promise<DeliveryDispute> {
    const res = await fetch(`${API_BASE_URL}/logistics/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de déclaration du litige de livraison.');
    }
    return res.json();
  }

  static async settleDispute(disputeId: string, token: string): Promise<DeliveryDispute> {
    const res = await fetch(`${API_BASE_URL}/logistics/disputes/${disputeId}/settle`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Échec du règlement du litige.');
    return res.json();
  }

  static async listDisputes(token: string, lveId?: string): Promise<DeliveryDispute[]> {
    const url = new URL(`${API_BASE_URL}/logistics/disputes`);
    if (lveId) url.searchParams.set('lveId', lveId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les litiges.');
    return res.json();
  }

  static async getOtifMetrics(token: string, assetId?: string): Promise<OtifMetrics> {
    const url = new URL(`${API_BASE_URL}/logistics/metrics/otif`);
    if (assetId) url.searchParams.set('assetId', assetId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les métriques OTIF.');
    return res.json();
  }
}

