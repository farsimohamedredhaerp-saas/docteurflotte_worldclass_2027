import {
  AssetRentalContract,
  CreateRentalContractDto,
  AssetRentalCheckInOut,
  CreateRentalCheckInOutDto,
  AssetRentalInvoice,
  AssetRentalDispute,
  RentalContractStatus,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class RentalClient {
  static async listContracts(
    token: string,
    params?: { assetId?: string; status?: RentalContractStatus },
  ): Promise<AssetRentalContract[]> {
    const url = new URL(`${API_BASE_URL}/rental/contracts`);
    if (params?.assetId) url.searchParams.set('assetId', params.assetId);
    if (params?.status) url.searchParams.set('status', params.status);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les contrats de location.');
    return res.json();
  }

  static async createContract(dto: CreateRentalContractDto, token: string): Promise<AssetRentalContract> {
    const res = await fetch(`${API_BASE_URL}/rental/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création du contrat de location.');
    }
    return res.json();
  }

  static async getContract(id: string, token: string): Promise<AssetRentalContract> {
    const res = await fetch(`${API_BASE_URL}/rental/contracts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Contrat introuvable.');
    return res.json();
  }

  static async updateContractStatus(
    id: string,
    status: RentalContractStatus,
    token: string,
  ): Promise<AssetRentalContract> {
    const res = await fetch(`${API_BASE_URL}/rental/contracts/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Échec de mise à jour du contrat.');
    return res.json();
  }

  static async recordCheckInOut(
    dto: CreateRentalCheckInOutDto,
    token: string,
  ): Promise<AssetRentalCheckInOut> {
    const res = await fetch(`${API_BASE_URL}/rental/check-in-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l’état des lieux.');
    }
    return res.json();
  }

  static async listCheckInOuts(token: string, contractId?: string): Promise<AssetRentalCheckInOut[]> {
    const url = new URL(`${API_BASE_URL}/rental/check-in-out`);
    if (contractId) url.searchParams.set('contractId', contractId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les états des lieux.');
    return res.json();
  }

  static async generateInvoice(
    contractId: string,
    token: string,
    options?: { damagesDeductionsDzd?: number; applyStampDuty?: boolean },
  ): Promise<AssetRentalInvoice> {
    const res = await fetch(`${API_BASE_URL}/rental/contracts/${contractId}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de génération de la facture.');
    }
    return res.json();
  }

  static async listInvoices(token: string, contractId?: string): Promise<AssetRentalInvoice[]> {
    const url = new URL(`${API_BASE_URL}/rental/invoices`);
    if (contractId) url.searchParams.set('contractId', contractId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les factures de location.');
    return res.json();
  }

  static async createDispute(
    data: {
      contractId: string;
      claimant: 'LANDLORD' | 'TENANT';
      disputeReason: string;
      claimedAmountDzd: number;
      retainedDepositDzd?: number;
    },
    token: string,
  ): Promise<AssetRentalDispute> {
    const res = await fetch(`${API_BASE_URL}/rental/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de déclaration du litige.');
    }
    return res.json();
  }

  static async listDisputes(token: string, contractId?: string): Promise<AssetRentalDispute[]> {
    const url = new URL(`${API_BASE_URL}/rental/disputes`);
    if (contractId) url.searchParams.set('contractId', contractId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les litiges.');
    return res.json();
  }
}

