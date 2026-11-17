import {
  SiteWorkspace,
  CreateSiteWorkspaceDto,
  AssetSiteAssignment,
  CreateAssetSiteAssignmentDto,
  AssetEngineHourLog,
  RecordEngineHourLogDto,
  AssetTransferChecklist,
  CreateAssetTransferChecklistDto,
  SiteProfitabilitySummary,
  RecordSiteSituationDto,
  SiteConsumableTank,
  CreateSiteConsumableTankDto,
  SiteConsumableDelivery,
  RecordSiteConsumableDeliveryDto,
  SiteWorkSituation,
  CreateSiteWorkSituationDto,
  ConsumableType,
  FiscalDocument,
  FiscalEvent,
  SiteStatus,
  AssignmentStatus,
} from '@docteurflotte/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ChantiersClient {
  static async listSites(token: string, status?: SiteStatus): Promise<SiteWorkspace[]> {
    const url = new URL(`${API_BASE_URL}/sites`);
    if (status) url.searchParams.set('status', status);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les chantiers.');
    return res.json();
  }

  static async createSite(dto: CreateSiteWorkspaceDto, token: string): Promise<SiteWorkspace> {
    const res = await fetch(`${API_BASE_URL}/sites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création du chantier.');
    }
    return res.json();
  }

  static async getSite(id: string, token: string): Promise<SiteWorkspace> {
    const res = await fetch(`${API_BASE_URL}/sites/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Chantier introuvable.');
    return res.json();
  }

  static async updateSiteStatus(id: string, status: SiteStatus, token: string): Promise<SiteWorkspace> {
    const res = await fetch(`${API_BASE_URL}/sites/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Échec de mise à jour du statut du chantier.');
    return res.json();
  }

  static async getSiteProfitability(id: string, token: string): Promise<SiteProfitabilitySummary> {
    const res = await fetch(`${API_BASE_URL}/sites/${id}/profitability`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger la rentabilité du chantier.');
    return res.json();
  }

  static async listAssignments(
    token: string,
    params?: { siteId?: string; assetId?: string; status?: AssignmentStatus },
  ): Promise<AssetSiteAssignment[]> {
    const url = new URL(`${API_BASE_URL}/sites/assignments/list`);
    if (params?.siteId) url.searchParams.set('siteId', params.siteId);
    if (params?.assetId) url.searchParams.set('assetId', params.assetId);
    if (params?.status) url.searchParams.set('status', params.status);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les affectations.');
    return res.json();
  }

  static async assignAsset(dto: CreateAssetSiteAssignmentDto, token: string): Promise<AssetSiteAssignment> {
    const res = await fetch(`${API_BASE_URL}/sites/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de l’affectation de l’actif au chantier.');
    }
    return res.json();
  }

  static async endAssignment(
    id: string,
    endMeterHours: number,
    token: string,
    notes?: string,
  ): Promise<AssetSiteAssignment> {
    const res = await fetch(`${API_BASE_URL}/sites/assignments/${id}/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endMeterHours, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de libération de l’actif.');
    }
    return res.json();
  }

  static async recordEngineHours(dto: RecordEngineHourLogDto, token: string): Promise<AssetEngineHourLog> {
    const res = await fetch(`${API_BASE_URL}/sites/engine-hours`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement des heures moteur.');
    }
    return res.json();
  }

  static async listEngineHourLogs(
    token: string,
    params?: { assetId?: string; siteId?: string; limit?: number },
  ): Promise<AssetEngineHourLog[]> {
    const url = new URL(`${API_BASE_URL}/sites/engine-hours/list`);
    if (params?.assetId) url.searchParams.set('assetId', params.assetId);
    if (params?.siteId) url.searchParams.set('siteId', params.siteId);
    if (params?.limit) url.searchParams.set('limit', String(params.limit));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les relevés d’heures.');
    return res.json();
  }

  static async createTransferChecklist(
    dto: CreateAssetTransferChecklistDto,
    token: string,
  ): Promise<AssetTransferChecklist> {
    const res = await fetch(`${API_BASE_URL}/sites/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création de la checklist de transfert.');
    }
    return res.json();
  }

  static async completeArrivalChecklist(
    id: string,
    data: { receivedBy: string; meterHoursArrival: number; signatureArrivalSvg?: string },
    token: string,
  ): Promise<AssetTransferChecklist> {
    const res = await fetch(`${API_BASE_URL}/sites/transfers/${id}/receive`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de réception du transfert.');
    }
    return res.json();
  }

  static async listTransferChecklists(
    token: string,
    params?: { assetId?: string; siteId?: string },
  ): Promise<AssetTransferChecklist[]> {
    const url = new URL(`${API_BASE_URL}/sites/transfers/list`);
    if (params?.assetId) url.searchParams.set('assetId', params.assetId);
    if (params?.siteId) url.searchParams.set('siteId', params.siteId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les checklists de transfert.');
    return res.json();
  }

  static async recordSiteSituation(
    siteId: string,
    dto: Omit<RecordSiteSituationDto, 'siteId'>,
    token: string,
  ): Promise<{
    fiscalDocument: FiscalDocument;
    fiscalEvent: FiscalEvent;
    updatedSite: SiteWorkspace;
  }> {
    const res = await fetch(`${API_BASE_URL}/sites/${siteId}/situations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement de la situation de travaux.');
    }
    return res.json();
  }

  // 5. Cuves & Gestion Multi-Fluides de Chantier
  static async listTanks(token: string, siteId?: string): Promise<SiteConsumableTank[]> {
    const url = new URL(`${API_BASE_URL}/sites/consumables/tanks`);
    if (siteId) url.searchParams.set('siteId', siteId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les cuves de chantier.');
    return res.json();
  }

  static async createTank(dto: CreateSiteConsumableTankDto, token: string): Promise<SiteConsumableTank> {
    const res = await fetch(`${API_BASE_URL}/sites/consumables/tanks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création de la cuve.');
    }
    return res.json();
  }

  static async listDeliveries(token: string, siteId?: string): Promise<SiteConsumableDelivery[]> {
    const url = new URL(`${API_BASE_URL}/sites/consumables/deliveries`);
    if (siteId) url.searchParams.set('siteId', siteId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les livraisons de fluides.');
    return res.json();
  }

  static async recordDelivery(dto: RecordSiteConsumableDeliveryDto, token: string): Promise<SiteConsumableDelivery> {
    const res = await fetch(`${API_BASE_URL}/sites/consumables/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec d’enregistrement du bon de livraison.');
    }
    return res.json();
  }

  // 6. Situations de Travaux BTPH (DPM)
  static async listWorkSituations(token: string, siteId?: string): Promise<SiteWorkSituation[]> {
    const url = new URL(`${API_BASE_URL}/sites/work-situations`);
    if (siteId) url.searchParams.set('siteId', siteId);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Impossible de charger les situations de travaux.');
    return res.json();
  }

  static async createWorkSituation(dto: CreateSiteWorkSituationDto, token: string): Promise<SiteWorkSituation> {
    const res = await fetch(`${API_BASE_URL}/sites/work-situations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Échec de création de la situation de travaux.');
    }
    return res.json();
  }

  static async approveWorkSituation(id: string, token: string): Promise<SiteWorkSituation> {
    const res = await fetch(`${API_BASE_URL}/sites/work-situations/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Échec d’approbation de la situation de travaux.');
    return res.json();
  }

  static async billWorkSituation(id: string, token: string): Promise<SiteWorkSituation> {
    const res = await fetch(`${API_BASE_URL}/sites/work-situations/${id}/bill`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Échec de facturation de la situation de travaux.');
    return res.json();
  }

  static async settleWorkSituation(id: string, token: string, settlementDate?: string): Promise<SiteWorkSituation> {
    const res = await fetch(`${API_BASE_URL}/sites/work-situations/${id}/settle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settlementDate }),
    });
    if (!res.ok) throw new Error('Échec d’encaissement de la situation de travaux.');
    return res.json();
  }
}

