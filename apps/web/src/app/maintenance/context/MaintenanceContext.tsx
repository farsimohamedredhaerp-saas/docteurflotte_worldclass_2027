'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  generateInitialFleet,
  INITIAL_TELEMETRY_STREAM,
  INITIAL_WORK_ORDERS,
  INITIAL_WAREHOUSE_STORES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
  type VehicleAssetRecord,
  type TelemetryDtcItem,
  type MaintenanceWorkOrderItem,
  type WarehouseStoreItem,
  type PartInventoryItemRecord,
  type StockMovementRecord,
  type PurchaseOrderRecord,
} from '@/lib/api-maintenance-40';
import type { SubsystemType } from '@docteurflotte/contracts';
import type { TechnicalFilters, InventoryStats } from '../types';

interface MaintenanceContextValue {
  fleet: VehicleAssetRecord[];
  setFleet: React.Dispatch<React.SetStateAction<VehicleAssetRecord[]>>;
  filteredFleet: VehicleAssetRecord[];
  filters: TechnicalFilters;
  setFilters: React.Dispatch<React.SetStateAction<TechnicalFilters>>;
  expandedAssetIds: Set<string>;
  toggleAssetExpand: (id: string) => void;
  toggleAllAssetsExpand: () => void;
  telemetryStream: TelemetryDtcItem[];
  setTelemetryStream: React.Dispatch<React.SetStateAction<TelemetryDtcItem[]>>;
  workOrders: MaintenanceWorkOrderItem[];
  setWorkOrders: React.Dispatch<React.SetStateAction<MaintenanceWorkOrderItem[]>>;
  selectedProofAsset: VehicleAssetRecord | null;
  setSelectedProofAsset: React.Dispatch<React.SetStateAction<VehicleAssetRecord | null>>;
  selectedProofSubsystem: SubsystemType;
  setSelectedProofSubsystem: React.Dispatch<React.SetStateAction<SubsystemType>>;
  warehouses: WarehouseStoreItem[];
  setWarehouses: React.Dispatch<React.SetStateAction<WarehouseStoreItem[]>>;
  inventoryItems: PartInventoryItemRecord[];
  setInventoryItems: React.Dispatch<React.SetStateAction<PartInventoryItemRecord[]>>;
  stockMovements: StockMovementRecord[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovementRecord[]>>;
  purchaseOrders: PurchaseOrderRecord[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrderRecord[]>>;
  inventoryStats: InventoryStats;
  criticalAlertsCount: number;
  feedbackNotification: string | null;
  triggerNotification: (msg: string) => void;
  issueModalItem: {
    partSku: string;
    partName: string;
    warehouseId: string;
    targetWorkOrderId: string;
    quantity: number;
  } | null;
  setIssueModalItem: React.Dispatch<
    React.SetStateAction<{
      partSku: string;
      partName: string;
      warehouseId: string;
      targetWorkOrderId: string;
      quantity: number;
    } | null>
  >;
  handleExecuteStockIssue: (sku: string, warehouseId: string, workOrderId: string, qty: number) => void;
  handleReceivePurchaseOrder: (poId: string) => void;
  handleGenerateAutoRestockOrders: () => void;
  handleAdvanceWorkOrderStatus: (id: string) => void;
}

const MaintenanceContext = createContext<MaintenanceContextValue | null>(null);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<TechnicalFilters>({
    category: 'ALL',
    severity: 'ALL',
    subsystem: 'ALL',
  });

  const [fleet, setFleet] = useState<VehicleAssetRecord[]>(() => generateInitialFleet());
  const [telemetryStream, setTelemetryStream] = useState<TelemetryDtcItem[]>(INITIAL_TELEMETRY_STREAM);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrderItem[]>(INITIAL_WORK_ORDERS);
  const [selectedProofAsset, setSelectedProofAsset] = useState<VehicleAssetRecord | null>(null);
  const [selectedProofSubsystem, setSelectedProofSubsystem] = useState<SubsystemType>('ENGINE');
  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(() => new Set(['v-001', 'v-002']));

  const [warehouses, setWarehouses] = useState<WarehouseStoreItem[]>(INITIAL_WAREHOUSE_STORES);
  const [inventoryItems, setInventoryItems] = useState<PartInventoryItemRecord[]>(INITIAL_INVENTORY_ITEMS);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>(INITIAL_STOCK_MOVEMENTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(INITIAL_PURCHASE_ORDERS);
  const [feedbackNotification, setFeedbackNotification] = useState<string | null>(null);

  const [issueModalItem, setIssueModalItem] = useState<{
    partSku: string;
    partName: string;
    warehouseId: string;
    targetWorkOrderId: string;
    quantity: number;
  } | null>(null);

  const toggleAssetExpand = useCallback((id: string) => {
    setExpandedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredFleet = useMemo(() => {
    return fleet.filter((v) => {
      if (filters.category !== 'ALL' && v.assetCategory !== filters.category) {
        return false;
      }
      if (filters.severity !== 'ALL') {
        const lowestRemainingHours = Math.min(
          ...Object.values(v.subsystems).map((s) => s.rulRemainingHours ?? 9999)
        );
        const lowestRemainingKm = Math.min(
          ...Object.values(v.subsystems).map((s) => s.rulRemainingKm ?? 999999)
        );
        const lowestRemainingDays = Math.min(
          ...Object.values(v.subsystems).map((s) => s.rulRemainingDays)
        );

        if (filters.severity === 'UNDER_25H' && lowestRemainingHours >= 25) return false;
        if (filters.severity === 'UNDER_1000KM' && lowestRemainingKm >= 1000) return false;
        if (
          filters.severity === 'CRITICAL' &&
          lowestRemainingHours > 25 &&
          lowestRemainingDays > 7
        ) {
          return false;
        }
      }
      if (filters.subsystem !== 'ALL') {
        const subRes = v.subsystems[filters.subsystem as SubsystemType];
        if (subRes && subRes.status === 'OPTIMAL') {
          return false;
        }
      }
      return true;
    });
  }, [fleet, filters]);

  const toggleAllAssetsExpand = useCallback(() => {
    if (expandedAssetIds.size === filteredFleet.length) {
      setExpandedAssetIds(new Set());
    } else {
      setExpandedAssetIds(new Set(filteredFleet.map((v) => v.id)));
    }
  }, [expandedAssetIds.size, filteredFleet]);

  const criticalAlertsCount = useMemo(() => {
    return fleet.filter((v) => {
      return Object.values(v.subsystems).some(
        (s) => (s.rulRemainingHours !== null && s.rulRemainingHours <= 25) || s.status === 'CRITICAL_OVERDUE'
      );
    }).length;
  }, [fleet]);

  const inventoryStats = useMemo<InventoryStats>(() => {
    const totalValuationDzd = inventoryItems.reduce(
      (sum, item) => sum + item.quantityOnHand * item.averageUnitCostDzd,
      0
    );
    const lowStockAlerts = inventoryItems.filter((i) => i.status === 'LOW_STOCK_ALERT').length;
    const outOfStockCount = inventoryItems.filter((i) => i.status === 'OUT_OF_STOCK').length;
    const activeOrdersCount = purchaseOrders.filter((po) => po.status === 'ORDERED' || po.status === 'APPROVED').length;

    return {
      totalValuationDzd,
      totalReferences: inventoryItems.length,
      lowStockAlerts,
      outOfStockCount,
      activeOrdersCount,
    };
  }, [inventoryItems, purchaseOrders]);

  const triggerNotification = useCallback((msg: string) => {
    setFeedbackNotification(msg);
    setTimeout(() => setFeedbackNotification(null), 5000);
  }, []);

  const handleExecuteStockIssue = useCallback(
    (sku: string, warehouseId: string, workOrderId: string, qty: number) => {
      const targetItem = inventoryItems.find((i) => i.internalSku === sku && i.warehouseId === warehouseId);
      if (!targetItem) {
        alert(`Pièce introuvable dans le magasin sélectionné.`);
        return;
      }
      if (targetItem.quantityAvailable < qty) {
        alert(`Quantité disponible insuffisante (${targetItem.quantityAvailable} disponibles vs ${qty} demandées).`);
        return;
      }

      const targetWo = workOrders.find((w) => w.id === workOrderId);
      const woNum = targetWo ? targetWo.workOrderNumber : 'OT-AUTO';

      setInventoryItems((prev) =>
        prev.map((i) => {
          if (i.id === targetItem.id) {
            const newOnHand = i.quantityOnHand - qty;
            const newAvailable = Math.max(0, i.quantityAvailable - qty);
            const newStatus =
              newAvailable <= 0
                ? 'OUT_OF_STOCK'
                : newAvailable <= i.minimumStockThreshold
                ? 'LOW_STOCK_ALERT'
                : 'IN_STOCK';
            return {
              ...i,
              quantityOnHand: newOnHand,
              quantityAvailable: newAvailable,
              status: newStatus,
            };
          }
          return i;
        })
      );

      const newMovement: StockMovementRecord = {
        id: `mov-${Date.now()}`,
        warehouseId: targetItem.warehouseId,
        warehouseCode: targetItem.warehouseCode,
        inventoryItemId: targetItem.id,
        internalSku: targetItem.internalSku,
        partName: targetItem.partName,
        movementType: 'WORK_ORDER_ISSUE',
        quantity: -qty,
        balanceAfter: targetItem.quantityOnHand - qty,
        unitCostDzd: targetItem.averageUnitCostDzd,
        totalCostDzd: targetItem.averageUnitCostDzd * qty,
        workOrderNumber: woNum,
        referenceDocNumber: `BS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        performedBy: 'Chef Magasinier (Attribution Immédiate)',
        notes: `Consommation pièce pour intervention ${woNum}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setStockMovements((prev) => [newMovement, ...prev]);

      setWorkOrders((prev) =>
        prev.map((wo) => {
          if (wo.id === workOrderId) {
            return {
              ...wo,
              status: wo.status === 'WAITING_PARTS' ? 'IN_PROGRESS' : wo.status,
              partsRequired: [...wo.partsRequired, `${targetItem.partName} [Alloué: ${qty}u]`],
            };
          }
          return wo;
        })
      );

      setIssueModalItem(null);
      triggerNotification(
        `Succès : ${qty} unité(s) de ${targetItem.partName} allouée(s) à ${woNum}. Bon de sortie ${newMovement.referenceDocNumber} généré.`
      );
    },
    [inventoryItems, workOrders, triggerNotification]
  );

  const handleReceivePurchaseOrder = useCallback(
    (poId: string) => {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) return;

      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, status: 'RECEIVED' } : p))
      );

      let totalItemsAdded = 0;
      const newMovements: StockMovementRecord[] = [];

      setInventoryItems((prev) =>
        prev.map((inv) => {
          const orderedItem = po.items.find((poi) => poi.internalSku === inv.internalSku);
          if (orderedItem && inv.warehouseId === po.warehouseId) {
            const qty = orderedItem.quantityOrdered;
            totalItemsAdded += qty;
            const newOnHand = inv.quantityOnHand + qty;
            const newAvailable = inv.quantityAvailable + qty;
            const newStatus = newAvailable <= inv.minimumStockThreshold ? 'LOW_STOCK_ALERT' : 'IN_STOCK';

            newMovements.push({
              id: `mov-rcv-${Date.now()}-${inv.id}`,
              warehouseId: inv.warehouseId,
              warehouseCode: inv.warehouseCode,
              inventoryItemId: inv.id,
              internalSku: inv.internalSku,
              partName: inv.partName,
              movementType: 'PURCHASE_RECEIPT',
              quantity: +qty,
              balanceAfter: newOnHand,
              unitCostDzd: orderedItem.unitPriceDzd,
              totalCostDzd: orderedItem.totalPriceDzd,
              purchaseOrderNumber: po.poNumber,
              referenceDocNumber: `BL-FOURN-${Math.floor(10000 + Math.random() * 90000)}`,
              performedBy: 'Réceptionnaire Magasin',
              notes: `Réception conforme bon de commande ${po.poNumber} (${po.supplierName})`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            });

            return {
              ...inv,
              quantityOnHand: newOnHand,
              quantityAvailable: newAvailable,
              status: newStatus,
              lastRestockDate: new Date().toISOString().substring(0, 10),
            };
          }
          return inv;
        })
      );

      setStockMovements((prev) => [...newMovements, ...prev]);
      triggerNotification(
        `Réception BL enregistrée : ${totalItemsAdded} articles intégrés en rayon pour ${po.warehouseName}. Bon ${po.poNumber} soldé.`
      );
    },
    [purchaseOrders, triggerNotification]
  );

  const handleGenerateAutoRestockOrders = useCallback(() => {
    const criticalItems = inventoryItems.filter(
      (i) => i.status === 'LOW_STOCK_ALERT' || i.status === 'OUT_OF_STOCK'
    );
    if (criticalItems.length === 0) {
      alert(`Tous les stocks physiques sont nominaux. Aucun réapprovisionnement nécessaire.`);
      return;
    }

    const targetWarehouseId = criticalItems[0].warehouseId;
    const warehouseObj = warehouses.find((w) => w.id === targetWarehouseId);

    const newPo: PurchaseOrderRecord = {
      id: `po-auto-${Date.now()}`,
      poNumber: `BC-2026-EOQ-${Math.floor(100 + Math.random() * 900)}`,
      warehouseId: targetWarehouseId,
      warehouseCode: criticalItems[0].warehouseCode,
      warehouseName: warehouseObj?.name || 'Magasin Central',
      supplierName: 'Comptoir Central de Filtration & Pièces Industrielles',
      supplierNif: '000160019283746',
      status: 'APPROVED',
      totalAmountDzd: criticalItems.reduce(
        (sum, item) => sum + item.reorderQuantity * item.averageUnitCostDzd,
        0
      ),
      expectedDeliveryDate: new Date(Date.now() + 4 * 24 * 3600 * 1000)
        .toISOString()
        .substring(0, 10),
      createdFromAlert: true,
      notes: `Commande automatique générée selon calcul EOQ/Wilson sur ${criticalItems.length} références critiques.`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: criticalItems.map((item, idx) => ({
        id: `poi-auto-${idx}`,
        partId: item.partId,
        internalSku: item.internalSku,
        partName: item.partName,
        orderedBrand: item.oemBrand,
        orderedReference: item.oemReference,
        quantityOrdered: item.reorderQuantity,
        quantityReceived: 0,
        unitPriceDzd: item.averageUnitCostDzd,
        totalPriceDzd: item.reorderQuantity * item.averageUnitCostDzd,
      })),
    };

    setPurchaseOrders((prev) => [newPo, ...prev]);
    triggerNotification(
      `Bon de commande réapprovisionnement ${newPo.poNumber} généré automatiquement (${criticalItems.length} références, total: ${newPo.totalAmountDzd.toLocaleString('fr-FR')} DZD).`
    );
  }, [inventoryItems, warehouses, triggerNotification]);

  const handleAdvanceWorkOrderStatus = useCallback((id: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id === id) {
          const nextStatus =
            wo.status === 'OPEN'
              ? 'IN_PROGRESS'
              : wo.status === 'IN_PROGRESS'
              ? 'COMPLETED'
              : 'COMPLETED';
          return { ...wo, status: nextStatus };
        }
        return wo;
      })
    );
  }, []);

  return (
    <MaintenanceContext.Provider
      value={{
        fleet,
        setFleet,
        filteredFleet,
        filters,
        setFilters,
        expandedAssetIds,
        toggleAssetExpand,
        toggleAllAssetsExpand,
        telemetryStream,
        setTelemetryStream,
        workOrders,
        setWorkOrders,
        selectedProofAsset,
        setSelectedProofAsset,
        selectedProofSubsystem,
        setSelectedProofSubsystem,
        warehouses,
        setWarehouses,
        inventoryItems,
        setInventoryItems,
        stockMovements,
        setStockMovements,
        purchaseOrders,
        setPurchaseOrders,
        inventoryStats,
        criticalAlertsCount,
        feedbackNotification,
        triggerNotification,
        issueModalItem,
        setIssueModalItem,
        handleExecuteStockIssue,
        handleReceivePurchaseOrder,
        handleGenerateAutoRestockOrders,
        handleAdvanceWorkOrderStatus,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance(): MaintenanceContextValue {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance doit être utilisé au sein d’un <MaintenanceProvider>');
  }
  return context;
}

