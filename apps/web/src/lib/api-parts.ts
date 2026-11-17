import {
  PartItem,
  CreatePartItemDto,
  PartWarehouse,
  PartStockLevel,
  WorkOrderPartConsumption,
  RecordWorkOrderPartConsumptionDto,
  PartPurchaseOrder,
} from '@docteurflotte/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchPartsItems(
  token?: string,
  params?: { category?: string; lowStockOnly?: boolean },
): Promise<PartItem[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.lowStockOnly) query.set('lowStockOnly', 'true');

  const res = await fetch(`${API_BASE}/parts/items?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des articles de stock');
  return res.json();
}

export async function createPartItem(token: string, dto: CreatePartItemDto): Promise<PartItem> {
  const res = await fetch(`${API_BASE}/parts/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Erreur lors de la création de la pièce');
  return res.json();
}

export async function fetchWarehouses(token?: string): Promise<PartWarehouse[]> {
  const res = await fetch(`${API_BASE}/parts/warehouses`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des dépôts');
  return res.json();
}

export async function createWarehouse(
  token: string,
  dto: { code: string; name: string; wilayaCode: number; address?: string; managerName?: string },
): Promise<PartWarehouse> {
  const res = await fetch(`${API_BASE}/parts/warehouses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Erreur lors de la création du dépôt');
  return res.json();
}

export async function fetchStockLevels(token?: string, warehouseId?: string): Promise<PartStockLevel[]> {
  const query = new URLSearchParams();
  if (warehouseId) query.set('warehouseId', warehouseId);

  const res = await fetch(`${API_BASE}/parts/stock-levels?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des niveaux de stock');
  return res.json();
}

export async function recordPartsConsumption(
  token: string,
  dto: RecordWorkOrderPartConsumptionDto,
): Promise<WorkOrderPartConsumption> {
  const res = await fetch(`${API_BASE}/parts/consumptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Erreur lors de l’imputation des pièces sur l’Ordre de Travail');
  return res.json();
}

export async function fetchConsumptionsByAsset(token?: string, assetId?: string): Promise<WorkOrderPartConsumption[]> {
  if (!assetId) return [];
  const res = await fetch(`${API_BASE}/parts/consumptions/asset/${assetId}`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des consommations');
  return res.json();
}

export async function fetchPurchaseOrders(token?: string, status?: string): Promise<PartPurchaseOrder[]> {
  const query = new URLSearchParams();
  if (status) query.set('status', status);

  const res = await fetch(`${API_BASE}/parts/purchase-orders?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des bons de commande');
  return res.json();
}

export async function receivePurchaseOrder(token: string, poId: string, warehouseId: string): Promise<PartPurchaseOrder> {
  const res = await fetch(`${API_BASE}/parts/purchase-orders/${poId}/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ warehouseId }),
  });
  if (!res.ok) throw new Error('Erreur lors de la réception du bon de commande');
  return res.json();
}

