'use client';

import React, { useState, useMemo } from 'react';
import {
  HybridCommandLayout,
  type MaintenanceSubView,
  type TechnicalFilters,
} from '@/components/maintenance/HybridCommandLayout';
import {
  generateInitialFleet,
  INITIAL_TELEMETRY_STREAM,
  INITIAL_WORK_ORDERS,
  OEM_PREVENTIVE_TEMPLATES,
  OEM_PARTS_CROSS_REF_SEEDS,
  DBC_CAN_DEFINITIONS,
  decodeRawCanFrame,
  INITIAL_WAREHOUSE_STORES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
  type VehicleAssetRecord,
  type TelemetryDtcItem,
  type MaintenanceWorkOrderItem,
  type OemPartItem,
  type WarehouseStoreItem,
  type PartInventoryItemRecord,
  type StockMovementRecord,
  type PurchaseOrderRecord,
} from '@/lib/api-maintenance-40';
import {
  calculateRul,
  type SubsystemType,
  type RulCalculationResult,
} from '@docteurflotte/contracts';

export default function Maintenance40Page() {
  const [activeSubView, setActiveSubView] = useState<MaintenanceSubView>('rul_matrix');
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

  const toggleAssetExpand = (id: string) => {
    setExpandedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllAssetsExpand = () => {
    if (expandedAssetIds.size === filteredFleet.length) {
      setExpandedAssetIds(new Set());
    } else {
      setExpandedAssetIds(new Set(filteredFleet.map((v) => v.id)));
    }
  };

  // État du simulateur d'injection CAN & Décodeur .DBC
  const [simVehicleId, setSimVehicleId] = useState<string>('v-001');
  const [simCoolantTemp, setSimCoolantTemp] = useState<number>(92.0); // SPN 110 (°C)
  const [simOilPressure, setSimOilPressure] = useState<number>(3.6); // SPN 100 (bar)
  const [simApsPressure, setSimApsPressure] = useState<number>(9.8); // SPN 1087 (bar)
  const [simHydraulicTemp, setSimHydraulicTemp] = useState<number>(68.0); // SPN 1638 (°C)
  const [simBatteryVoltage, setSimBatteryVoltage] = useState<number>(26.8); // SPN 168 (V)
  const [simInjectedDtc, setSimInjectedDtc] = useState<string>('NONE');
  const [simDutyFactor, setSimDutyFactor] = useState<number>(0.85);
  const [simIdleHours, setSimIdleHours] = useState<number>(45);

  // État de l'inspecteur de trames .DBC
  const [selectedDbcFrameHex, setSelectedDbcFrameHex] = useState<string>('0x18FEEE00');
  const [customHexPayload, setCustomHexPayload] = useState<string>('5C 40 82 00 00 00 00 00');

  // État du Catalogue Pièces & Équivalences
  const [partsSearch, setPartsSearch] = useState<string>('');
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('ALL');

  // État du Module Achats & Stocks Magasins (Inventaire 4.0)
  const [warehouses, setWarehouses] = useState<WarehouseStoreItem[]>(INITIAL_WAREHOUSE_STORES);
  const [inventoryItems, setInventoryItems] = useState<PartInventoryItemRecord[]>(INITIAL_INVENTORY_ITEMS);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>(INITIAL_STOCK_MOVEMENTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(INITIAL_PURCHASE_ORDERS);
  const [inventorySubTab, setInventorySubTab] = useState<'stocks' | 'movements' | 'purchase_orders'>('stocks');
  const [inventoryWarehouseFilter, setInventoryWarehouseFilter] = useState<string>('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>('ALL');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [feedbackNotification, setFeedbackNotification] = useState<string | null>(null);

  // Modal d'émission / sortie de stock pour OT
  const [issueModalItem, setIssueModalItem] = useState<{
    partSku: string;
    partName: string;
    warehouseId: string;
    targetWorkOrderId: string;
    quantity: number;
  } | null>(null);

  // Filtrage des actifs selon les filtres techniques du Left Rail
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

  // Véhicule actif pour la simulation CAN
  const simVehicle = useMemo(() => {
    return fleet.find((v) => v.id === simVehicleId) || fleet[0];
  }, [fleet, simVehicleId]);

  // Décodage dynamique de la trame CAN sélectionnée
  const decodedCanFrame = useMemo(() => {
    return decodeRawCanFrame(selectedDbcFrameHex, customHexPayload);
  }, [selectedDbcFrameHex, customHexPayload]);

  // Recalcul en direct du RUL pour le simulateur CAN
  const simCalculationResult = useMemo(() => {
    const sensors = [];
    if (simCoolantTemp > 103.0) {
      sensors.push({
        parameterName: 'SPN 110 Temp Eau Culasse',
        value: simCoolantTemp,
        normalMax: 100,
        isAnomalous: true,
        penalty: 0.18,
      });
    }
    if (simOilPressure < 1.6) {
      sensors.push({
        parameterName: 'SPN 100 Pression Huile Basse',
        value: simOilPressure,
        normalMax: 4.5,
        isAnomalous: true,
        penalty: 0.35,
      });
    }
    if (simApsPressure < 8.0) {
      sensors.push({
        parameterName: 'SPN 1087 Pression Freinage APS',
        value: simApsPressure,
        normalMax: 10.5,
        isAnomalous: true,
        penalty: 0.25,
      });
    }
    if (simHydraulicTemp > 90.0) {
      sensors.push({
        parameterName: 'SPN 1638 Temp Huile Hydr',
        value: simHydraulicTemp,
        normalMax: 85,
        isAnomalous: true,
        penalty: 0.18,
      });
    }
    if (simBatteryVoltage < 23.5) {
      sensors.push({
        parameterName: 'SPN 168 Tension Alternateur',
        value: simBatteryVoltage,
        normalMax: 28.0,
        isAnomalous: true,
        penalty: 0.12,
      });
    }

    const dtcs = [];
    if (simInjectedDtc !== 'NONE') {
      const penalty = simInjectedDtc === 'P0087' ? 0.30 : simInjectedDtc === 'SPN-100-FMI-1' ? 0.35 : 0.20;
      dtcs.push({ code: simInjectedDtc, penalty });
    }

    return calculateRul({
      subsystem: 'ENGINE',
      severeDutyFactor: simDutyFactor,
      oemIntervalKm: 30000,
      oemIntervalEngineHours: 500,
      oemIntervalDays: 180,
      deltaOdometerKm: 21500,
      deltaEngineHours: 390,
      deltaDays: 80,
      idleHours: simIdleHours,
      avgDailyKm: simVehicle.avgDailyKm,
      avgDailyEngineHours: simVehicle.avgDailyEngineHours,
      sensors,
      dtcs,
    });
  }, [simVehicle, simCoolantTemp, simOilPressure, simApsPressure, simHydraulicTemp, simBatteryVoltage, simInjectedDtc, simDutyFactor, simIdleHours]);

  // Filtrage du catalogue de pièces OEM
  const filteredParts = useMemo(() => {
    return OEM_PARTS_CROSS_REF_SEEDS.filter((p) => {
      if (selectedPartCategory !== 'ALL' && p.category !== selectedPartCategory) {
        return false;
      }
      if (partsSearch.trim() !== '') {
        const query = partsSearch.toLowerCase();
        const matchesSku = p.internalSku.toLowerCase().includes(query);
        const matchesName = p.nameFr.toLowerCase().includes(query);
        const matchesOemRef = p.oemReference.toLowerCase().includes(query);
        const matchesOemBrand = p.oemBrand.toLowerCase().includes(query);
        const matchesEquiv = p.equivalences.some(
          (eq) =>
            eq.equivalentReference.toLowerCase().includes(query) ||
            eq.aftermarketBrand.toLowerCase().includes(query)
        );
        if (!matchesSku && !matchesName && !matchesOemRef && !matchesOemBrand && !matchesEquiv) {
          return false;
        }
      }
      return true;
    });
  }, [selectedPartCategory, partsSearch]);

  // Filtrage des stocks physiques de magasin
  const filteredInventory = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (inventoryWarehouseFilter !== 'ALL' && item.warehouseId !== inventoryWarehouseFilter) {
        return false;
      }
      if (inventoryStatusFilter !== 'ALL' && item.status !== inventoryStatusFilter) {
        return false;
      }
      if (inventorySearch.trim() !== '') {
        const query = inventorySearch.toLowerCase();
        const matchesSku = item.internalSku.toLowerCase().includes(query);
        const matchesName = item.partName.toLowerCase().includes(query);
        const matchesOem = item.oemReference.toLowerCase().includes(query);
        const matchesBin = item.binLocation.toLowerCase().includes(query);
        if (!matchesSku && !matchesName && !matchesOem && !matchesBin) {
          return false;
        }
      }
      return true;
    });
  }, [inventoryItems, inventoryWarehouseFilter, inventoryStatusFilter, inventorySearch]);

  // Statistiques globales de l'inventaire
  const inventoryStats = useMemo(() => {
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

  // Notification flash
  const triggerNotification = (msg: string) => {
    setFeedbackNotification(msg);
    setTimeout(() => setFeedbackNotification(null), 5000);
  };

  // 1. Action : Sortie Magasin & Consommation pour un OT
  const handleExecuteStockIssue = (sku: string, warehouseId: string, workOrderId: string, qty: number) => {
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

    // Mettre à jour les stocks
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

    // Enregistrer le mouvement d'audit
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
    setStockMovements([newMovement, ...stockMovements]);

    // Mettre à jour l'ordre de travail
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
    triggerNotification(`Succès : ${qty} unité(s) de ${targetItem.partName} allouée(s) à ${woNum}. Bon de sortie ${newMovement.referenceDocNumber} généré.`);
  };

  // 2. Action : Réceptionner un Bon de Commande Fournisseur (BL)
  const handleReceivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    // Basculer la commande en RECEIVED
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'RECEIVED' } : p))
    );

    // Mettre à jour chaque pièce dans le magasin de destination
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
    triggerNotification(`Réception BL enregistrée : ${totalItemsAdded} articles intégrés en rayon pour ${po.warehouseName}. Bon ${po.poNumber} soldé.`);
  };

  // 3. Action : Génération automatique des commandes de réapprovisionnement EOQ
  const handleGenerateAutoRestockOrders = () => {
    const criticalItems = inventoryItems.filter(
      (i) => i.status === 'LOW_STOCK_ALERT' || i.status === 'OUT_OF_STOCK'
    );
    if (criticalItems.length === 0) {
      alert(`Tous les stocks physiques sont nominaux. Aucun réapprovisionnement nécessaire.`);
      return;
    }

    const newPo: PurchaseOrderRecord = {
      id: `po-auto-${Date.now()}`,
      poNumber: `BC-2026-EOQ-${Math.floor(100 + Math.random() * 900)}`,
      warehouseId: criticalItems[0].warehouseId,
      warehouseCode: criticalItems[0].warehouseCode,
      warehouseName:
        warehouses.find((w) => w.id === criticalItems[0].warehouseId)?.name || 'Magasin Central',
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

    setPurchaseOrders([newPo, ...purchaseOrders]);
    setInventorySubTab('purchase_orders');
    triggerNotification(`Bon de commande réapprovisionnement ${newPo.poNumber} généré automatiquement (${criticalItems.length} références, total: ${newPo.totalAmountDzd.toLocaleString('fr-FR')} DZD).`);
  };

  // Déclenchement automatique d'un OT depuis la simulation
  const handleCreateSimulatedWorkOrder = () => {
    const newWo: MaintenanceWorkOrderItem = {
      id: `wo-auto-${Date.now()}`,
      workOrderNumber: `OT-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleId: simVehicle.id,
      vehicleRegistration: simVehicle.registrationNumber,
      vehicleModel: `${simVehicle.make} ${simVehicle.model}`,
      triggerSource:
        simInjectedDtc !== 'NONE'
          ? 'TELEMETRY_DTC_CRITICAL'
          : simCalculationResult.requiresWorkOrder
          ? 'PREDICTIVE_RUL_DRIFT'
          : 'PREVENTIVE_KM_HOURS',
      priority:
        simCalculationResult.status === 'CRITICAL_OVERDUE'
          ? 'P1_IMMOBILIZATION'
          : 'P2_URGENT_48H',
      status: 'OPEN',
      subsystem: 'ENGINE',
      title: `Intervention d'urgence générée par banc d'essai CAN (${simVehicle.registrationNumber})`,
      description: `RUL critique simulée : ${simCalculationResult.rulRemainingHours?.toFixed(1) ?? '--'}h / ${simCalculationResult.rulRemainingKm?.toFixed(0) ?? '--'}km (Probabilité panne 30j : ${(simCalculationResult.failureProbability30d * 100).toFixed(1)}%). Accélération CAN: x${simCalculationResult.canAccelerationFactor.toFixed(2)}.`,
      estimatedCostDzd: 74000,
      downtimeHours: 5.0,
      partsRequired: ['Filtres et fluides de rechange', 'Sonde de contrôle température/pression'],
      assignedTechnician: 'Atelier Central (Attribution Automatique)',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setWorkOrders([newWo, ...workOrders]);
    setActiveSubView('work_orders');
  };

  const handleAdvanceWorkOrderStatus = (id: string) => {
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
  };

  return (
    <HybridCommandLayout
      activeSubView={activeSubView}
      onSelectSubView={setActiveSubView}
      filters={filters}
      onFilterChange={setFilters}
    >
      {/* 1. TOP HEADER & STATISTIQUES OPÉRATIONS DÉCOMPRESSÉES */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg)',
          padding: '1.25rem 1.75rem',
          boxShadow: 'var(--df-shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--df-accent-blue)',
                  border: '1px solid var(--df-accent-blue-subtle)',
                  padding: '2px 8px',
                  borderRadius: 'var(--df-radius-sm)',
                  background: 'var(--df-accent-blue-subtle)',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.04em',
                }}
              >
                MODULE 4.0 SOUVERAIN
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--df-status-ok)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="df-pulse-live" /> Télémétrie CAN J1939 Active
              </span>
            </div>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--df-text-main)',
                margin: 0,
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
              }}
            >
              Centre de Décision & Maintenance Prédictive OEM
            </h1>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--df-text-secondary)',
                margin: '0.35rem 0 0 0',
                maxWidth: '850px',
              }}
            >
              Modélisation physique déterministe (Weibull & Arrhenius) • Décodage OpenDBC • RUL des 7 sous-systèmes critiques • Stocks magasins connectés
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={toggleAllAssetsExpand}
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                padding: '0.55rem 0.95rem',
                borderRadius: 'var(--df-radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--df-transition-fast)',
              }}
            >
              {expandedAssetIds.size === filteredFleet.length ? '▲ Réduire Tous les Organes' : '▼ Déplier Tous les Organes'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('telemetry_can')}
              style={{
                background: 'var(--df-accent-blue)',
                border: 'none',
                color: '#FFFFFF',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--df-radius-md)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                transition: 'all var(--df-transition-fast)',
              }}
            >
              Simulateur CAN & DBC &rarr;
            </button>
          </div>
        </div>

        {/* 4 CARTES KPI DÉCOMPRESSÉES & AÉRÉES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* CARTE 1 : ACTIFS SURVEILLÉS */}
          <div
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Actifs Surveillés CAN
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--df-text-main)',
                  lineHeight: 1.1,
                }}
              >
                {fleet.length}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--df-text-secondary)', fontWeight: 600 }}>
                unités (100% télémétrie)
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--df-status-ok)', fontWeight: 500, marginTop: '2px' }}>
              RLS Fail-Closed Actif • 0 fuite
            </span>
          </div>

          {/* CARTE 2 : VALORISATION DES STOCKS */}
          <div
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Valorisation Stock (CUMP)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--df-status-ok)',
                  lineHeight: 1.1,
                }}
              >
                {(inventoryStats.totalValuationDzd / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}k
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--df-text-secondary)', fontWeight: 600 }}>
                DZD (3 magasins)
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', fontWeight: 500, marginTop: '2px' }}>
              {inventoryStats.totalReferences} références tracées
            </span>
          </div>

          {/* CARTE 3 : RUPTURES & STOCK BAS */}
          <div
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Ruptures / Seuil Critique
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: inventoryStats.lowStockAlerts + inventoryStats.outOfStockCount > 0 ? '#EF4444' : 'var(--df-status-ok)',
                  lineHeight: 1.1,
                }}
              >
                {inventoryStats.lowStockAlerts + inventoryStats.outOfStockCount}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--df-text-secondary)', fontWeight: 600 }}>
                références sous alerte
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: inventoryStats.outOfStockCount > 0 ? '#EF4444' : 'var(--df-text-muted)', fontWeight: 500, marginTop: '2px' }}>
              {inventoryStats.outOfStockCount} rupture(s) d'approvisionnement
            </span>
          </div>

          {/* CARTE 4 : COMMANDES D'ACHATS EN COURS */}
          <div
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Commandes Achats (PO)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#F59E0B',
                  lineHeight: 1.1,
                }}
              >
                {inventoryStats.activeOrdersCount}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--df-text-secondary)', fontWeight: 600 }}>
                commandes en cours
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', fontWeight: 500, marginTop: '2px' }}>
              Réapprovisionnement automatique EOQ
            </span>
          </div>
        </div>
      </div>

      {/* NOTIFICATION FEEDBACK FLASH */}
      {feedbackNotification && (
        <div
          style={{
            background: 'var(--df-bg-surface-2)',
            border: '1px solid #10B981',
            borderRadius: 'var(--df-radius-md)',
            padding: '10px 14px',
            marginBottom: '14px',
            color: '#10B981',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{feedbackNotification}</span>
          <button
            type="button"
            onClick={() => setFeedbackNotification(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--df-text-secondary)',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. VUE 1 : MATRICE PRÉDICTIVE & RUL */}
      {activeSubView === 'rul_matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>
                Matrice d’Usure & Durée Utile Résiduelle (RUL) par Véhicule
              </span>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginLeft: '10px' }}>
                Tri par criticité RUL • {filteredFleet.length} actif(s) affiché(s)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveSubView('telemetry_can')}
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-medium)',
                  color: 'var(--df-text-main)',
                  padding: '4px 10px',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Inspecter Trames & Décodeur CAN &rarr;
              </button>
            </div>
          </div>

          {/* TABLEAU DES ACTIFS */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    borderBottom: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-secondary)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Immatriculation & VIN</th>
                  <th style={{ padding: '12px 14px' }}>Modèle & Catégorie</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Compteurs (KM / H)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Sévérité (&alpha;)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Ralenti (Heures)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>RUL Restante</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Panne 30j</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions & Organes</th>
                </tr>
              </thead>
              <tbody>
                {filteredFleet.map((v) => {
                  const lowestRulSubsystem = Object.entries(v.subsystems).sort(
                    (a, b) => (a[1].rulRemainingHours ?? 9999) - (b[1].rulRemainingHours ?? 9999)
                  )[0];
                  const criticalSub = lowestRulSubsystem[1];
                  const isExpanded = expandedAssetIds.has(v.id);

                  const statusColor =
                    criticalSub.status === 'CRITICAL_OVERDUE'
                      ? '#EF4444'
                      : criticalSub.status === 'PREDICTIVE_ALERT' || criticalSub.status === 'PROACTIVE_DUE'
                      ? '#F59E0B'
                      : '#10B981';

                  return (
                    <React.Fragment key={v.id}>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--df-border-subtle)',
                          transition: 'background 80ms',
                          background: isExpanded ? 'var(--df-bg-surface-2)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 700,
                              fontSize: '13.5px',
                              color: 'var(--df-text-main)',
                            }}
                          >
                            {v.registrationNumber}
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '11px',
                              color: 'var(--df-text-muted)',
                              marginTop: '2px',
                            }}
                          >
                            {v.vin}
                          </div>
                        </td>

                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--df-text-main)' }}>
                            {v.make} {v.model}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
                            {v.engineModel} • {v.protocolType}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '14px 14px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--df-text-main)' }}>
                            {v.currentOdometerKm.toLocaleString('fr-FR')} km
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
                            {v.currentEngineHours.toLocaleString('fr-FR')} h
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '14px 14px',
                            textAlign: 'center',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--df-radius-md)',
                              background: v.severeDutyFactor < 0.75 ? 'rgba(245, 158, 11, 0.12)' : 'var(--df-bg-surface-2)',
                              border: `1px solid ${v.severeDutyFactor < 0.75 ? '#F59E0B' : 'var(--df-border-subtle)'}`,
                              color: v.severeDutyFactor < 0.75 ? '#F59E0B' : 'var(--df-text-secondary)',
                              fontWeight: 600,
                              fontSize: '12px',
                            }}
                          >
                            &alpha; = {v.severeDutyFactor.toFixed(2)}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: '14px 14px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--df-text-main)' }}>
                            {v.idleHours} h
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginTop: '2px' }}>
                            +{(v.idleHours * 33).toLocaleString('fr-FR')} km eq
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '14px 14px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '14px', color: statusColor, lineHeight: 1.2 }}>
                            {criticalSub.rulRemainingHours?.toFixed(0) ?? '--'} h
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
                            {criticalSub.rulRemainingKm?.toFixed(0) ?? '--'} km •{' '}
                            {criticalSub.rulRemainingDays} j
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '14px 14px',
                            textAlign: 'center',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <span
                            style={{
                              color:
                                criticalSub.failureProbability30d > 0.6
                                  ? '#EF4444'
                                  : criticalSub.failureProbability30d > 0.3
                                  ? '#F59E0B'
                                  : '#10B981',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {(criticalSub.failureProbability30d * 100).toFixed(1)}%
                          </span>
                        </td>

                        <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--df-radius-md)',
                              background: 'var(--df-bg-surface-2)',
                              border: `1px solid ${statusColor}`,
                              color: statusColor,
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {criticalSub.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => toggleAssetExpand(v.id)}
                              style={{
                                background: isExpanded ? 'var(--df-accent-blue)' : 'var(--df-bg-surface-2)',
                                border: `1px solid ${isExpanded ? 'var(--df-accent-blue)' : 'var(--df-border-subtle)'}`,
                                color: isExpanded ? '#FFFFFF' : 'var(--df-text-secondary)',
                                padding: '4px 9px',
                                borderRadius: 'var(--df-radius-sm)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all var(--df-transition-fast)',
                              }}
                            >
                              {isExpanded ? '▲ Masquer' : '▼ 7 Organes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProofAsset(v);
                                setSelectedProofSubsystem('ENGINE');
                              }}
                              style={{
                                background: 'var(--df-bg-surface-2)',
                                border: '1px solid var(--df-border-medium)',
                                color: 'var(--df-text-main)',
                                padding: '4px 9px',
                                borderRadius: 'var(--df-radius-sm)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              [Preuve RUL]
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* LIGNE SOUS-SYSTÈMES ÉTENDUS CONDITIONNELLE & AÉRÉE */}
                      {isExpanded && (
                        <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
                          <td colSpan={9} style={{ padding: '12px 18px 18px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--df-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Décomposition RUL des 7 Organes Critiques — {v.registrationNumber} ({v.make} {v.model})
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>
                                Cliquer sur un organe pour inspecter la preuve physique Weibull & Arrhenius
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '10px',
                              }}
                            >
                              {(
                                [
                                  'ENGINE',
                                  'HYDRAULICS',
                                  'TRANSMISSION',
                                  'BRAKES_APS',
                                  'COOLING',
                                  'FILTRATION',
                                  'TIRES_TRACKS',
                                ] as SubsystemType[]
                              ).map((subKey) => {
                                const subRes = v.subsystems[subKey];
                                const subColor =
                                  subRes.status === 'CRITICAL_OVERDUE'
                                    ? '#EF4444'
                                    : subRes.status === 'PREDICTIVE_ALERT' || subRes.status === 'PROACTIVE_DUE'
                                    ? '#F59E0B'
                                    : '#10B981';

                                return (
                                  <div
                                    key={subKey}
                                    onClick={() => {
                                      setSelectedProofAsset(v);
                                      setSelectedProofSubsystem(subKey);
                                    }}
                                    style={{
                                      background: 'var(--df-bg-surface-1)',
                                      border: '1px solid var(--df-border-subtle)',
                                      borderRadius: 'var(--df-radius-md)',
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      boxShadow: 'var(--df-shadow-sm)',
                                      transition: 'all var(--df-transition-fast)',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--df-border-focus)';
                                      e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
                                      e.currentTarget.style.transform = 'none';
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '6px',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          color: 'var(--df-text-main)',
                                          fontWeight: 700,
                                        }}
                                      >
                                        {subKey.replace('_', ' ')}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '11.5px',
                                          fontFamily: "'JetBrains Mono', monospace",
                                          color: subColor,
                                          fontWeight: 800,
                                        }}
                                      >
                                        {subRes.wearIndexPercent.toFixed(0)}%
                                      </span>
                                    </div>

                                    <div
                                      style={{
                                        height: '5px',
                                        background: 'var(--df-bg-surface-2)',
                                        borderRadius: 'var(--df-radius-full)',
                                        overflow: 'hidden',
                                        marginBottom: '6px',
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${Math.min(100, subRes.wearIndexPercent)}%`,
                                          height: '100%',
                                          background: subColor,
                                          borderRadius: 'var(--df-radius-full)',
                                        }}
                                      />
                                    </div>

                                    <div
                                      style={{
                                        fontSize: '10.5px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontVariantNumeric: 'tabular-nums',
                                        color: 'var(--df-text-secondary)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <span>{subRes.rulRemainingHours?.toFixed(0) ?? '--'} h</span>
                                      <span style={{ color: 'var(--df-text-muted)' }}>&gamma;={subRes.canAccelerationFactor.toFixed(2)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VUE 2 : TÉLÉMÉTRIE & DÉCODEUR CAN (.DBC / J1939) */}
      {activeSubView === 'telemetry_can' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* FLUX TÉLÉMATIQUE EN DIRECT */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>
                Flux Télématique DM1 & OBD-II en Direct
              </span>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginLeft: '10px' }}>
                Décodage des trames DM1 et injection directe dans l’accélérateur RUL
              </span>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#10B981',
                border: '1px solid var(--df-border-subtle)',
                padding: '3px 8px',
                borderRadius: 'var(--df-radius-md)',
                background: 'var(--df-bg-base)',
              }}
            >
              CAN BUS: 250 kbps • J1939-73 DM1
            </div>
          </div>

          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    borderBottom: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-secondary)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '8px 12px' }}>Heure</th>
                  <th style={{ padding: '8px 10px' }}>Véhicule</th>
                  <th style={{ padding: '8px 10px' }}>Protocole</th>
                  <th style={{ padding: '8px 10px' }}>Code Défaut / Signal</th>
                  <th style={{ padding: '8px 10px' }}>Organe</th>
                  <th style={{ padding: '8px 10px' }}>Description Technique (Française)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Sévérité</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Pénalité RUL</th>
                  <th style={{ padding: '8px 12px' }}>Action Atelier Préconisée</th>
                </tr>
              </thead>
              <tbody>
                {telemetryStream.map((item) => {
                  const sevColor =
                    item.severityLevel === 'CRITICAL_IMMOBILIZATION'
                      ? '#EF4444'
                      : item.severityLevel === 'PROACTIVE_WARNING'
                      ? '#F59E0B'
                      : '#10B981';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--df-border-subtle)',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 12px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontVariantNumeric: 'tabular-nums',
                          color: 'var(--df-text-secondary)',
                        }}
                      >
                        {item.timestamp}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          color: 'var(--df-text-main)',
                        }}
                      >
                        {item.vehicleRegistration}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span
                          style={{
                            padding: '2px 5px',
                            borderRadius: 'var(--df-radius-md)',
                            background: 'var(--df-bg-surface-2)',
                            border: '1px solid var(--df-border-subtle)',
                            fontSize: '10px',
                            fontFamily: "'JetBrains Mono', monospace",
                            color: 'var(--df-text-secondary)',
                          }}
                        >
                          {item.protocol}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          color: sevColor,
                        }}
                      >
                        {item.codeString}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: '11px', color: 'var(--df-text-secondary)' }}>
                        {item.subsystem}
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--df-text-main)', maxWidth: '320px' }}>
                        <div style={{ fontWeight: 600 }}>{item.titleFr}</div>
                        <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
                          {item.technicalDescriptionFr}
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 'var(--df-radius-md)',
                            background: 'var(--df-bg-surface-2)',
                            border: `1px solid ${sevColor}`,
                            color: sevColor,
                            fontSize: '9.5px',
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {item.severityLevel === 'CRITICAL_IMMOBILIZATION'
                            ? 'CRITIQUE'
                            : item.severityLevel === 'PROACTIVE_WARNING'
                            ? 'PRÉVENTIF'
                            : 'INFO'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          textAlign: 'center',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          color: item.rulPenaltyFactor > 0 ? '#EF4444' : 'var(--df-text-muted)',
                        }}
                      >
                        +{item.rulPenaltyFactor.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--df-text-main)' }}>
                        {item.recommendedWorkshopAction}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* DÉCODEUR .DBC & SIMULATEUR WHAT-IF */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--df-border-subtle)',
                paddingBottom: '10px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#2563EB',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Inspecteur de Trames CAN-Bus (.DBC OpenDBC) & Simulateur Déterministe
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '2px' }}>
                  Décodage Bit-à-Bit Little Endian & Recalcul Instantané de l'Accélération RUL (&gamma;_CAN)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DBC_CAN_DEFINITIONS.map((def) => (
                  <button
                    key={def.frameIdHex}
                    type="button"
                    onClick={() => {
                      setSelectedDbcFrameHex(def.frameIdHex);
                      if (def.frameIdHex === '0x0CF00400') setCustomHexPayload('00 7D 50 1F 00 00 F0 FF');
                      if (def.frameIdHex === '0x18FEEE00') setCustomHexPayload('5C 40 82 00 00 00 00 00');
                      if (def.frameIdHex === '0x18FEEF00') setCustomHexPayload('FF FF FF 5A 00 7D 00 FF');
                      if (def.frameIdHex === '0x18FEAE00') setCustomHexPayload('78 FF FF FF FF FF FF FF');
                    }}
                    style={{
                      background: selectedDbcFrameHex === def.frameIdHex ? 'var(--df-bg-surface-2)' : 'var(--df-bg-base)',
                      border: selectedDbcFrameHex === def.frameIdHex ? '1px solid #2563EB' : '1px solid var(--df-border-subtle)',
                      color: selectedDbcFrameHex === def.frameIdHex ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                      padding: '4px 8px',
                      borderRadius: 'var(--df-radius-md)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {def.frameIdHex} ({def.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '10px 12px', borderRadius: 'var(--df-radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--df-text-secondary)' }}>
                      Payload CAN Hexadécimal (8 octets) pour <strong style={{ color: 'var(--df-text-main)' }}>{decodedCanFrame?.frameName}</strong> :
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#10B981' }}>
                      DLC: 8 BYTES
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customHexPayload}
                    onChange={(e) => setCustomHexPayload(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--df-bg-surface-1)',
                      border: '1px solid var(--df-border-medium)',
                      borderRadius: 'var(--df-radius-md)',
                      padding: '6px 10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '13px',
                      color: 'var(--df-text-main)',
                      letterSpacing: '0.1em',
                    }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginTop: '4px' }}>
                    {decodedCanFrame?.description}
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase' }}>
                        <th style={{ padding: '6px 10px' }}>Signal .DBC</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>SPN Mappé</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Valeur Brute</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Valeur Physique Décodée</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>Unité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decodedCanFrame?.signals.map((sig, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--df-bg-surface-2)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--df-text-main)' }}>{sig.name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: '#2563EB' }}>
                            {sig.spn ? `SPN ${sig.spn}` : '--'}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-secondary)' }}>
                            0x{sig.rawValue.toString(16).toUpperCase()} ({sig.rawValue})
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              textAlign: 'right',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 700,
                              color: '#10B981',
                              fontSize: '12px',
                            }}
                          >
                            {sig.physicalValue.toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--df-text-muted)' }}>{sig.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--df-border-subtle)', paddingBottom: '4px' }}>
                  Banc d'Essai Virtuel & Recalcul RUL
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--df-text-secondary)', marginBottom: '3px' }}>
                    Véhicule cible :
                  </label>
                  <select
                    value={simVehicleId}
                    onChange={(e) => setSimVehicleId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--df-bg-surface-1)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-md)',
                      color: 'var(--df-text-main)',
                      fontSize: '11px',
                      padding: '4px 6px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {fleet.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.make} {v.model} ({v.engineModel})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--df-text-secondary)' }}>Sévérité (&alpha;) :</span>
                      <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B' }}>
                        {simDutyFactor.toFixed(2)}
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={simDutyFactor}
                      onChange={(e) => setSimDutyFactor(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#2563EB' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--df-text-secondary)' }}>Ralenti (Heures) :</span>
                      <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B' }}>
                        {simIdleHours} h
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="5"
                      value={simIdleHours}
                      onChange={(e) => setSimIdleHours(parseInt(e.target.value, 10))}
                      style={{ width: '100%', accentColor: '#2563EB' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--df-text-secondary)' }}>SPN 110 Temp Eau :</span>
                      <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: simCoolantTemp > 103 ? '#EF4444' : '#10B981' }}>
                        {simCoolantTemp.toFixed(1)}°C
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="115"
                      step="0.5"
                      value={simCoolantTemp}
                      onChange={(e) => setSimCoolantTemp(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: simCoolantTemp > 103 ? '#EF4444' : '#2563EB' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--df-text-secondary)' }}>SPN 100 Pression Huile :</span>
                      <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: simOilPressure < 1.6 ? '#EF4444' : '#10B981' }}>
                        {simOilPressure.toFixed(1)} bar
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="5.0"
                      step="0.1"
                      value={simOilPressure}
                      onChange={(e) => setSimOilPressure(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: simOilPressure < 1.6 ? '#EF4444' : '#2563EB' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--df-text-secondary)', marginBottom: '3px' }}>
                    Injecter un code anomalie DTC :
                  </label>
                  <select
                    value={simInjectedDtc}
                    onChange={(e) => setSimInjectedDtc(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--df-bg-surface-1)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-md)',
                      color: 'var(--df-text-main)',
                      fontSize: '11px',
                      padding: '4px 6px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <option value="NONE">Nominal (Aucun DTC actif)</option>
                    <option value="P0087">P0087 — Fuel Rail Pressure Too Low (+0.30)</option>
                    <option value="SPN-100-FMI-1">SPN-100-FMI-1 — Engine Oil Pressure Critical Low (+0.35)</option>
                    <option value="SPN-1087-FMI-1">SPN-1087-FMI-1 — APS Air Brake Pressure Low (+0.25)</option>
                  </select>
                </div>

                <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--df-text-muted)' }}>RUL Restante Heures / KM :</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: simCalculationResult.rulRemainingHours && simCalculationResult.rulRemainingHours <= 25 ? '#EF4444' : '#F59E0B' }}>
                      {simCalculationResult.rulRemainingHours?.toFixed(1) ?? '--'} h • {simCalculationResult.rulRemainingKm?.toFixed(0) ?? '--'} km
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9px', color: 'var(--df-text-muted)' }}>Panne 30j Weibull :</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: simCalculationResult.failureProbability30d > 0.6 ? '#EF4444' : '#10B981' }}>
                      {(simCalculationResult.failureProbability30d * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateSimulatedWorkOrder}
                  style={{
                    background: simCalculationResult.requiresWorkOrder ? '#EF4444' : '#2563EB',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 10px',
                    borderRadius: 'var(--df-radius-md)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {simCalculationResult.requiresWorkOrder
                    ? 'Déclencher OT Immédiat (Seuil Critique Atteint)'
                    : 'Créer un Ordre de Travail Préventif'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. VUE 3 : PLANS PRÉVENTIFS CONSTRUCTEURS */}
      {activeSubView === 'oem_plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>
                Référentiel & Plans Préventifs Constructeurs (PM1 / PM2 / PM3 / PM4)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginLeft: '10px' }}>
                Triple critère de déclenchement : Kilomètres, Horamètre ou Échéance calendaire au premier terme échu
              </span>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: 'var(--df-text-secondary)',
                border: '1px solid var(--df-border-subtle)',
                padding: '3px 8px',
                borderRadius: 'var(--df-radius-md)',
              }}
            >
              NORMES OEM : RENAULT TRUCKS & CATERPILLAR
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {OEM_PREVENTIVE_TEMPLATES.map((plan) => (
              <div
                key={plan.code}
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--df-border-subtle)',
                    paddingBottom: '8px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        background: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-medium)',
                        color: '#2563EB',
                        fontSize: '10px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 'var(--df-radius-md)',
                        marginRight: '8px',
                      }}
                    >
                      {plan.code}
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>{plan.name}</strong>
                  </div>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#F59E0B',
                      fontWeight: 600,
                    }}
                  >
                    {plan.intervalMonths} mois max
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '6px 8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--df-text-muted)' }}>Intervalle KM</div>
                    <strong style={{ color: 'var(--df-text-main)' }}>{plan.intervalKm.toLocaleString('fr-FR')} km</strong>
                  </div>
                  <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '6px 8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--df-text-muted)' }}>Horamètre Moteur</div>
                    <strong style={{ color: 'var(--df-text-main)' }}>{plan.intervalEngineHours} h</strong>
                  </div>
                  <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '6px 8px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--df-text-muted)' }}>Sous-Systèmes</div>
                    <strong style={{ color: 'var(--df-text-secondary)' }}>{plan.subsystemsCovered.length} organes</strong>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', lineHeight: '1.4' }}>
                  {plan.description}
                </div>

                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--df-text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                    Opérations Standard Atelier :
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--df-text-main)', lineHeight: '1.5' }}>
                    {plan.standardOperations.map((op, idx) => (
                      <li key={idx}>{op}</li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--df-border-subtle)',
                    paddingTop: '8px',
                    fontSize: '10px',
                    color: 'var(--df-text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Lubrifiant homologué :</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#10B981', fontWeight: 600 }}>
                    {plan.recommendedOil}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. VUE 4 : CATALOGUE PIÈCES, FLUIDES & ÉQUIVALENCES OEM */}
      {activeSubView === 'parts_cross_ref' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>
                  Catalogue Pièces, Fluides & Équivalences OEM (Local-First)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginLeft: '10px' }}>
                  Croisement instantané des références OEM vers Donaldson, Mann-Filter, Fleetguard, Bosch, Knorr & Purflux
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveSubView('inventory_stock')}
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid #2563EB',
                    color: '#2563EB',
                    borderRadius: 'var(--df-radius-md)',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Gérer les Dépôts & Stocks Magasins &rarr;
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Rechercher par référence OEM (ex: 1R-1808, 21620181), équivalence (P551808, TB 1394), marque..."
                value={partsSearch}
                onChange={(e) => setPartsSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '280px',
                  background: 'var(--df-bg-base)',
                  border: '1px solid var(--df-border-medium)',
                  borderRadius: 'var(--df-radius-md)',
                  padding: '6px 12px',
                  color: 'var(--df-text-main)',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />

              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ALL', label: 'Toutes' },
                  { id: 'OIL_FILTER', label: 'Filtres Huile' },
                  { id: 'FUEL_FILTER', label: 'Filtres Carburant' },
                  { id: 'APS_DRYER_CARTRIDGE', label: 'Dessiccateurs APS' },
                  { id: 'AIR_FILTER_PRIMARY', label: 'Filtres Air' },
                  { id: 'HYDRAULIC_FILTER', label: 'Filtres Hydrauliques' },
                  { id: 'ENGINE_OIL', label: 'Huiles Moteur' },
                  { id: 'HYDRAULIC_OIL', label: 'Huiles Hydrauliques' },
                  { id: 'BRAKE_PAD', label: 'Freinage' },
                  { id: 'TIMING_KIT', label: 'Distribution' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedPartCategory(cat.id)}
                    style={{
                      background: selectedPartCategory === cat.id ? 'var(--df-bg-surface-2)' : 'var(--df-bg-base)',
                      border: selectedPartCategory === cat.id ? '1px solid #2563EB' : '1px solid var(--df-border-subtle)',
                      color: selectedPartCategory === cat.id ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                      borderRadius: 'var(--df-radius-md)',
                      padding: '4px 8px',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    borderBottom: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-secondary)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '8px 12px' }}>SKU & Catégorie</th>
                  <th style={{ padding: '8px 10px' }}>Désignation & Constructeur</th>
                  <th style={{ padding: '8px 10px' }}>Référence OEM</th>
                  <th style={{ padding: '8px 10px' }}>Stocks Physiques Magasins</th>
                  <th style={{ padding: '8px 10px' }}>Équivalences Certifiées</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Prix Unitaire (DZD)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action Magasin</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => {
                  const partStocks = inventoryItems.filter((i) => i.internalSku === part.internalSku);
                  const totalAvailable = partStocks.reduce((sum, s) => sum + s.quantityAvailable, 0);

                  return (
                    <tr
                      key={part.internalSku}
                      style={{
                        borderBottom: '1px solid var(--df-border-subtle)',
                        transition: 'background 80ms',
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            color: '#2563EB',
                            fontWeight: 700,
                          }}
                        >
                          {part.internalSku}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '3px',
                            padding: '1px 5px',
                            borderRadius: 'var(--df-radius-md)',
                            background: 'var(--df-bg-surface-2)',
                            border: '1px solid var(--df-border-subtle)',
                            fontSize: '9.5px',
                            color: 'var(--df-text-secondary)',
                          }}
                        >
                          {part.category}
                        </span>
                      </td>

                      <td style={{ padding: '10px 10px', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>{part.nameFr}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
                          Constructeur : <strong>{part.oemBrand}</strong>
                        </div>
                      </td>

                      <td style={{ padding: '10px 10px' }}>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            fontSize: '12px',
                            color: '#10B981',
                            background: 'var(--df-bg-base)',
                            border: '1px solid var(--df-border-subtle)',
                            padding: '2px 6px',
                            borderRadius: 'var(--df-radius-md)',
                          }}
                        >
                          {part.oemReference}
                        </span>
                      </td>

                      {/* DISPONIBILITÉ RÉELLE EN STOCK MULTI-MAGASINS */}
                      <td style={{ padding: '10px 10px', minWidth: '220px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {partStocks.length > 0 ? (
                            partStocks.map((stk) => (
                              <div
                                key={stk.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '10.5px',
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                <span style={{ color: 'var(--df-text-secondary)' }}>{stk.warehouseCode.split('-')[1]} :</span>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      stk.status === 'OUT_OF_STOCK'
                                        ? '#EF4444'
                                        : stk.status === 'LOW_STOCK_ALERT'
                                        ? '#F59E0B'
                                        : '#10B981',
                                  }}
                                >
                                  {stk.quantityAvailable} dispo ({stk.quantityOnHand} stock)
                                </span>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: '10px', color: 'var(--df-text-muted)' }}>Dépôt central uniquement</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {part.equivalences.map((eq, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontFamily: "'JetBrains Mono', monospace",
                                  padding: '1px 4px',
                                  borderRadius: 'var(--df-radius-md)',
                                  background:
                                    eq.confidenceLevel === 'EXACT_OEM_MATCH' ? 'var(--df-bg-surface-2)' : 'var(--df-bg-surface-1)',
                                  border:
                                    eq.confidenceLevel === 'EXACT_OEM_MATCH'
                                      ? '1px solid #10B981'
                                      : '1px solid #F59E0B',
                                  color:
                                    eq.confidenceLevel === 'EXACT_OEM_MATCH' ? '#10B981' : '#F59E0B',
                                  fontWeight: 700,
                                }}
                              >
                                {eq.aftermarketBrand}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontWeight: 600,
                                  color: 'var(--df-text-main)',
                                }}
                              >
                                {eq.equivalentReference}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          color: '#F59E0B',
                          fontSize: '13px',
                        }}
                      >
                        {part.unitPriceDzd.toLocaleString('fr-FR')} DZD
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const whId = partStocks[0]?.warehouseId || 'wh-001';
                            setIssueModalItem({
                              partSku: part.internalSku,
                              partName: part.nameFr,
                              warehouseId: whId,
                              targetWorkOrderId: workOrders[0]?.id || '',
                              quantity: 1,
                            });
                          }}
                          disabled={totalAvailable <= 0}
                          style={{
                            background: totalAvailable > 0 ? 'var(--df-bg-surface-2)' : 'var(--df-bg-surface-1)',
                            border: totalAvailable > 0 ? '1px solid var(--df-border-medium)' : '1px solid var(--df-border-subtle)',
                            color: totalAvailable > 0 ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                            padding: '3px 8px',
                            borderRadius: 'var(--df-radius-md)',
                            fontSize: '10.5px',
                            cursor: totalAvailable > 0 ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {totalAvailable > 0 ? 'Allouer à un OT' : 'Rupture Stock'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VUE 5 : MODULE ACHATS & STOCKS PHYSIQUES DE MAGASIN (NOUVEAU) */}
      {activeSubView === 'inventory_stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* BANDEAU GESTION DES STOCKS & ACTION EOQ */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>
                Gestion Multi-Dépôts, Mouvements de Magasin & Approvisionnements (Achats 4.0)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginLeft: '10px' }}>
                Réapprovisionnement déterministe Wilson/EOQ • Traçabilité totale des entrées/sorties
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleGenerateAutoRestockOrders}
                style={{
                  background: inventoryStats.lowStockAlerts + inventoryStats.outOfStockCount > 0 ? '#EF4444' : 'var(--df-bg-surface-2)',
                  border: inventoryStats.lowStockAlerts + inventoryStats.outOfStockCount > 0 ? 'none' : '1px solid var(--df-border-medium)',
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Générer Bon de Commande Automatique EOQ ({inventoryStats.lowStockAlerts + inventoryStats.outOfStockCount} Ruptures)
              </button>
            </div>
          </div>

          {/* SÉLECTEUR DE SOUS-ONGLETS MAGASIN */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--df-border-subtle)', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setInventorySubTab('stocks')}
              style={{
                background: inventorySubTab === 'stocks' ? 'var(--df-bg-surface-2)' : 'transparent',
                border: inventorySubTab === 'stocks' ? '1px solid #2563EB' : '1px solid var(--df-border-subtle)',
                color: inventorySubTab === 'stocks' ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                borderRadius: 'var(--df-radius-md)',
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              1. Stocks Physiques en Rayon ({inventoryItems.length} références)
            </button>
            <button
              type="button"
              onClick={() => setInventorySubTab('movements')}
              style={{
                background: inventorySubTab === 'movements' ? 'var(--df-bg-surface-2)' : 'transparent',
                border: inventorySubTab === 'movements' ? '1px solid #2563EB' : '1px solid var(--df-border-subtle)',
                color: inventorySubTab === 'movements' ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                borderRadius: 'var(--df-radius-md)',
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              2. Journal des Mouvements Magasin (Audit Traçabilité)
            </button>
            <button
              type="button"
              onClick={() => setInventorySubTab('purchase_orders')}
              style={{
                background: inventorySubTab === 'purchase_orders' ? 'var(--df-bg-surface-2)' : 'transparent',
                border: inventorySubTab === 'purchase_orders' ? '1px solid #2563EB' : '1px solid var(--df-border-subtle)',
                color: inventorySubTab === 'purchase_orders' ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                borderRadius: 'var(--df-radius-md)',
                padding: '5px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              3. Commandes Fournisseurs & Réceptions BL ({purchaseOrders.length} bons)
            </button>
          </div>

          {/* SOUS-ONGLET 1 : STOCKS PHYSIQUES EN RAYON */}
          {inventorySubTab === 'stocks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* FILTRES DÉPÔTS ET STATUTS */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Filtrer stock par SKU, désignation, casier..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    background: 'var(--df-bg-base)',
                    border: '1px solid var(--df-border-medium)',
                    borderRadius: 'var(--df-radius-md)',
                    padding: '6px 10px',
                    color: 'var(--df-text-main)',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />

                <select
                  value={inventoryWarehouseFilter}
                  onChange={(e) => setInventoryWarehouseFilter(e.target.value)}
                  style={{
                    background: 'var(--df-bg-base)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-md)',
                    color: 'var(--df-text-main)',
                    fontSize: '11px',
                    padding: '6px 8px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <option value="ALL">Tous les Dépôts ({warehouses.length})</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} ({w.locationWilaya})
                    </option>
                  ))}
                </select>

                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  style={{
                    background: 'var(--df-bg-base)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-md)',
                    color: 'var(--df-text-main)',
                    fontSize: '11px',
                    padding: '6px 8px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <option value="ALL">Tous les Statuts</option>
                  <option value="IN_STOCK">En Stock (Nominal)</option>
                  <option value="LOW_STOCK_ALERT">Alerte Stock Bas</option>
                  <option value="OUT_OF_STOCK">Rupture Critique</option>
                </select>
              </div>

              {/* TABLEAU DES STOCKS */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 10px' }}>SKU & Pièce</th>
                      <th style={{ padding: '8px 10px' }}>Dépôt / Magasin</th>
                      <th style={{ padding: '8px 10px' }}>Emplacement Bac</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Physique (En Rayon)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Réservé OT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Disponible Net</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Seuil Mini</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>CUMP (DZD)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Statut</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const statusColor =
                        item.status === 'OUT_OF_STOCK'
                          ? '#EF4444'
                          : item.status === 'LOW_STOCK_ALERT'
                          ? '#F59E0B'
                          : '#10B981';

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>{item.partName}</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--df-text-muted)' }}>
                              {item.internalSku} • OEM: {item.oemReference}
                            </div>
                          </td>

                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-main)' }}>
                              {item.warehouseCode}
                            </span>
                          </td>

                          <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-secondary)' }}>
                            {item.binLocation}
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--df-text-main)' }}>
                            {item.quantityOnHand}
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B' }}>
                            {item.quantityReserved}
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: statusColor, fontSize: '12px' }}>
                            {item.quantityAvailable}
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-secondary)' }}>
                            {item.minimumStockThreshold} (EOQ: +{item.reorderQuantity})
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-main)' }}>
                            {item.averageUnitCostDzd.toLocaleString('fr-FR')} DZD
                          </td>

                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '2px 5px',
                                borderRadius: 'var(--df-radius-md)',
                                background: 'var(--df-bg-surface-2)',
                                border: `1px solid ${statusColor}`,
                                color: statusColor,
                                fontSize: '9.5px',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setIssueModalItem({
                                  partSku: item.internalSku,
                                  partName: item.partName,
                                  warehouseId: item.warehouseId,
                                  targetWorkOrderId: workOrders[0]?.id || '',
                                  quantity: 1,
                                });
                              }}
                              disabled={item.quantityAvailable <= 0}
                              style={{
                                background: item.quantityAvailable > 0 ? 'var(--df-bg-surface-2)' : 'var(--df-bg-surface-1)',
                                border: item.quantityAvailable > 0 ? '1px solid var(--df-border-medium)' : '1px solid var(--df-border-subtle)',
                                color: item.quantityAvailable > 0 ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                                padding: '3px 8px',
                                borderRadius: 'var(--df-radius-md)',
                                fontSize: '10px',
                                cursor: item.quantityAvailable > 0 ? 'pointer' : 'not-allowed',
                                fontWeight: 600,
                              }}
                            >
                              Sortie OT
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SOUS-ONGLET 2 : JOURNAL DES MOUVEMENTS DE STOCK */}
          {inventorySubTab === 'movements' && (
            <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 10px' }}>Date & Heure</th>
                    <th style={{ padding: '8px 10px' }}>Dépôt</th>
                    <th style={{ padding: '8px 10px' }}>Type Mouvement</th>
                    <th style={{ padding: '8px 10px' }}>Pièce Détachée</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Quantité</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Solde Après</th>
                    <th style={{ padding: '8px 10px' }}>Réf Document / OT / BL</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Montant Total (DZD)</th>
                    <th style={{ padding: '8px 12px' }}>Opérateur</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovements.map((mov) => {
                    const isEntry = mov.quantity > 0;
                    return (
                      <tr key={mov.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-secondary)' }}>
                          {mov.timestamp}
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-main)' }}>
                          {mov.warehouseCode}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              padding: '2px 5px',
                              borderRadius: 'var(--df-radius-md)',
                              background: 'var(--df-bg-surface-2)',
                              border: isEntry ? '1px solid #10B981' : '1px solid #2563EB',
                              color: isEntry ? '#10B981' : '#2563EB',
                              fontSize: '9.5px',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                            }}
                          >
                            {mov.movementType}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--df-text-main)' }}>
                          <div>{mov.partName}</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--df-text-muted)' }}>{mov.notes}</div>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isEntry ? '#10B981' : '#EF4444' }}>
                          {isEntry ? `+${mov.quantity}` : mov.quantity}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-main)' }}>
                          {mov.balanceAfter}
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#F59E0B' }}>
                          {mov.referenceDocNumber}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-main)' }}>
                          {mov.totalCostDzd.toLocaleString('fr-FR')} DZD
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '10.5px', color: 'var(--df-text-secondary)' }}>
                          {mov.performedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SOUS-ONGLET 3 : COMMANDES ACHATS & RÉCEPTIONS BL */}
          {inventorySubTab === 'purchase_orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 10px' }}>N° Bon Commande</th>
                      <th style={{ padding: '8px 10px' }}>Dépôt Destinataire</th>
                      <th style={{ padding: '8px 10px' }}>Fournisseur & NIF</th>
                      <th style={{ padding: '8px 10px' }}>Détail des Pièces & Équivalences</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Montant Total</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Date Prévue</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Statut</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action BL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => {
                      const isReceived = po.status === 'RECEIVED';
                      const statusColor = isReceived ? '#10B981' : po.status === 'ORDERED' ? '#F59E0B' : '#2563EB';

                      return (
                        <tr key={po.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                          <td style={{ padding: '10px 10px' }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--df-text-main)' }}>
                              {po.poNumber}
                            </div>
                            {po.createdFromAlert && (
                              <span style={{ fontSize: '9px', color: '#EF4444', fontFamily: "'JetBrains Mono', monospace" }}>
                                [AUTO-ALERTE]
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '10px 10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-main)' }}>
                            {po.warehouseCode}
                          </td>

                          <td style={{ padding: '10px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>{po.supplierName}</div>
                            <div style={{ fontSize: '9.5px', color: 'var(--df-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                              NIF: {po.supplierNif}
                            </div>
                          </td>

                          <td style={{ padding: '10px 10px', maxWidth: '320px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {po.items.map((item) => (
                                <div key={item.id} style={{ fontSize: '10.5px', color: 'var(--df-text-secondary)' }}>
                                  &bull; <strong style={{ color: 'var(--df-text-main)' }}>{item.quantityOrdered}u</strong> {item.partName} ({item.orderedBrand} {item.orderedReference})
                                </div>
                              ))}
                            </div>
                          </td>

                          <td style={{ padding: '10px 10px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#F59E0B' }}>
                            {po.totalAmountDzd.toLocaleString('fr-FR')} DZD
                          </td>

                          <td style={{ padding: '10px 10px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-secondary)' }}>
                            {po.expectedDeliveryDate}
                          </td>

                          <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '2px 5px',
                                borderRadius: 'var(--df-radius-md)',
                                background: 'var(--df-bg-surface-2)',
                                border: `1px solid ${statusColor}`,
                                color: statusColor,
                                fontSize: '9.5px',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {po.status}
                            </span>
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {!isReceived ? (
                              <button
                                type="button"
                                onClick={() => handleReceivePurchaseOrder(po.id)}
                                style={{
                                  background: '#10B981',
                                  border: 'none',
                                  color: 'var(--df-bg-base)',
                                  padding: '4px 10px',
                                  borderRadius: 'var(--df-radius-md)',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                }}
                              >
                                Valider Réception BL
                              </button>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#10B981', fontFamily: "'JetBrains Mono', monospace" }}>
                                BL Réceptionné
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. VUE 6 : ATELIER & ORDRES DE TRAVAIL (OT) */}
      {activeSubView === 'work_orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>
                Gestion de l'Atelier & Ordres de Travail (OT) Multi-Sites
              </span>
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginLeft: '10px' }}>
                Traçabilité des déclenchements prédictifs, pièces détachées et immobilisation
              </span>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: 'var(--df-text-main)',
              }}
            >
              Total OT en cours : <strong style={{ color: '#F59E0B' }}>{workOrders.length}</strong>
            </div>
          </div>

          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--df-bg-surface-2)',
                    borderBottom: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-secondary)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '8px 12px' }}>N° OT</th>
                  <th style={{ padding: '8px 10px' }}>Véhicule & Modèle</th>
                  <th style={{ padding: '8px 10px' }}>Origine Déclenchement</th>
                  <th style={{ padding: '8px 10px' }}>Sous-Système & Détails</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Coût Estimé</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Arrêt</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Priorité</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Statut</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action Atelier</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => {
                  const prioColor =
                    wo.priority === 'P1_IMMOBILIZATION'
                      ? '#EF4444'
                      : wo.priority === 'P2_URGENT_48H'
                      ? '#F59E0B'
                      : '#10B981';

                  const statusColor =
                    wo.status === 'COMPLETED'
                      ? '#10B981'
                      : wo.status === 'IN_PROGRESS'
                      ? '#2563EB'
                      : wo.status === 'WAITING_PARTS'
                      ? '#EF4444'
                      : 'var(--df-text-main)';

                  return (
                    <tr
                      key={wo.id}
                      style={{
                        borderBottom: '1px solid var(--df-border-subtle)',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 12px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          color: 'var(--df-text-main)',
                        }}
                      >
                        {wo.workOrderNumber}
                      </td>

                      <td style={{ padding: '10px 10px' }}>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            color: 'var(--df-text-main)',
                          }}
                        >
                          {wo.vehicleRegistration}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--df-text-secondary)' }}>{wo.vehicleModel}</div>
                      </td>

                      <td style={{ padding: '10px 10px' }}>
                        <span
                          style={{
                            padding: '2px 5px',
                            borderRadius: 'var(--df-radius-md)',
                            background: 'var(--df-bg-surface-2)',
                            border: '1px solid var(--df-border-subtle)',
                            fontSize: '9.5px',
                            fontFamily: "'JetBrains Mono', monospace",
                            color:
                              wo.triggerSource === 'TELEMETRY_DTC_CRITICAL'
                                ? '#EF4444'
                                : wo.triggerSource === 'PREDICTIVE_RUL_DRIFT'
                                ? '#F59E0B'
                                : '#10B981',
                            fontWeight: 600,
                          }}
                        >
                          {wo.triggerSource}
                        </span>
                      </td>

                      <td style={{ padding: '10px 10px', maxWidth: '340px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--df-text-main)' }}>{wo.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
                          {wo.description}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', marginTop: '3px' }}>
                          Tech: {wo.assignedTechnician}
                        </div>
                        {wo.status === 'WAITING_PARTS' && (
                          <div style={{ marginTop: '4px', fontSize: '10px', color: '#EF4444', fontFamily: "'JetBrains Mono', monospace" }}>
                            [ATTENTE PIÈCE] Stock Oran en rupture. Pièce disponible au Hub Alger.
                          </div>
                        )}
                      </td>

                      <td
                        style={{
                          padding: '10px 10px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          color: 'var(--df-text-main)',
                        }}
                      >
                        {wo.estimatedCostDzd.toLocaleString('fr-FR')} DZD
                      </td>

                      <td
                        style={{
                          padding: '10px 10px',
                          textAlign: 'center',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontVariantNumeric: 'tabular-nums',
                          color: 'var(--df-text-secondary)',
                        }}
                      >
                        {wo.downtimeHours} h
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 'var(--df-radius-md)',
                            background: 'var(--df-bg-surface-2)',
                            border: `1px solid ${prioColor}`,
                            color: prioColor,
                            fontSize: '9.5px',
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {wo.priority === 'P1_IMMOBILIZATION'
                            ? 'P1 - IMMOBILISATION'
                            : wo.priority === 'P2_URGENT_48H'
                            ? 'P2 - 48H'
                            : 'P3 - PRÉVU'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 'var(--df-radius-md)',
                            background: 'var(--df-bg-surface-2)',
                            border: `1px solid ${statusColor}`,
                            color: statusColor,
                            fontSize: '9.5px',
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {wo.status}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          {wo.status === 'WAITING_PARTS' ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleExecuteStockIssue('SKU-FLT-APS-VOLVO-21620181', 'wh-001', wo.id, 1);
                              }}
                              style={{
                                background: '#2563EB',
                                border: 'none',
                                color: '#FFFFFF',
                                padding: '3px 8px',
                                borderRadius: 'var(--df-radius-md)',
                                fontSize: '10px',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              Allouer depuis Hub Alger
                            </button>
                          ) : wo.status !== 'COMPLETED' ? (
                            <button
                              type="button"
                              onClick={() => handleAdvanceWorkOrderStatus(wo.id)}
                              style={{
                                background: 'var(--df-bg-surface-2)',
                                border: '1px solid var(--df-border-medium)',
                                color: 'var(--df-text-main)',
                                padding: '3px 8px',
                                borderRadius: 'var(--df-radius-md)',
                                fontSize: '10.5px',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              {wo.status === 'OPEN' ? 'Démarrer OT' : 'Clôturer OT'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#10B981' }}>Terminé</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. MODAL DE SORTIE DE STOCK VERS OT */}
      {issueModalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(9, 10, 12, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 250,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: 'var(--df-radius-md)',
              maxWidth: '480px',
              width: '100%',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--df-border-subtle)', paddingBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Sortie Magasin & Affectation Ordre de Travail</strong>
              <button
                type="button"
                onClick={() => setIssueModalItem(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-secondary)', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--df-text-secondary)' }}>
              Pièce sélectionnée : <strong style={{ color: 'var(--df-text-main)' }}>{issueModalItem.partName}</strong> ({issueModalItem.partSku})
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--df-text-secondary)', marginBottom: '3px' }}>
                Magasin de prélèvement :
              </label>
              <select
                value={issueModalItem.warehouseId}
                onChange={(e) => setIssueModalItem({ ...issueModalItem, warehouseId: e.target.value })}
                style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', color: 'var(--df-text-main)', fontSize: '11px', padding: '5px' }}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--df-text-secondary)', marginBottom: '3px' }}>
                Ordre de Travail destinataire :
              </label>
              <select
                value={issueModalItem.targetWorkOrderId}
                onChange={(e) => setIssueModalItem({ ...issueModalItem, targetWorkOrderId: e.target.value })}
                style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', color: 'var(--df-text-main)', fontSize: '11px', padding: '5px' }}
              >
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.workOrderNumber} — {wo.vehicleRegistration} ({wo.title})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--df-text-secondary)', marginBottom: '3px' }}>
                Quantité à déstocker :
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={issueModalItem.quantity}
                onChange={(e) => setIssueModalItem({ ...issueModalItem, quantity: parseInt(e.target.value, 10) || 1 })}
                style={{ width: '100%', background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', borderRadius: 'var(--df-radius-md)', color: 'var(--df-text-main)', fontSize: '12px', padding: '5px', fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIssueModalItem(null)}
                style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-secondary)', padding: '5px 12px', borderRadius: 'var(--df-radius-md)', fontSize: '11px', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleExecuteStockIssue(issueModalItem.partSku, issueModalItem.warehouseId, issueModalItem.targetWorkOrderId, issueModalItem.quantity)}
                style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '5px 14px', borderRadius: 'var(--df-radius-md)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                Valider la Sortie Magasin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL PREUVE RUL & FORMULES DÉTERMINISTES */}
      {selectedProofAsset && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(9, 10, 12, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-medium)',
              borderRadius: 'var(--df-radius-md)',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--df-border-subtle)',
                paddingBottom: '10px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#2563EB',
                    fontWeight: 700,
                  }}
                >
                  PREUVE MATHÉMATIQUE & PHYSIQUE RUL (CONTRAT MASTER SPEC)
                </span>
                <h3
                  style={{
                    margin: '3px 0 0 0',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--df-text-main)',
                  }}
                >
                  {selectedProofAsset.registrationNumber} — {selectedProofAsset.make} {selectedProofAsset.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProofAsset(null)}
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  color: 'var(--df-text-secondary)',
                  borderRadius: 'var(--df-radius-md)',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(
                [
                  'ENGINE',
                  'HYDRAULICS',
                  'TRANSMISSION',
                  'BRAKES_APS',
                  'COOLING',
                  'FILTRATION',
                  'TIRES_TRACKS',
                ] as SubsystemType[]
              ).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedProofSubsystem(sub)}
                  style={{
                    background: selectedProofSubsystem === sub ? 'var(--df-bg-surface-2)' : 'transparent',
                    border: selectedProofSubsystem === sub ? '1px solid #2563EB' : '1px solid var(--df-border-subtle)',
                    color: selectedProofSubsystem === sub ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                    borderRadius: 'var(--df-radius-md)',
                    padding: '3px 7px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {sub.replace('_', ' ')}
                </button>
              ))}
            </div>

            {(() => {
              const res = selectedProofAsset.subsystems[selectedProofSubsystem];
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '10px', borderRadius: 'var(--df-radius-md)' }}>
                    <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                      Étape 1 : Ajustement Conditions Sévères (Chaleur, Poussière, Charge)
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                      I_eff = I_OEM &times; &alpha;_duty
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      &bull; Intervalle ajusté : {res.effectiveIntervalKm.toLocaleString('fr-FR')} km (ou {res.effectiveIntervalHours} h) avec &alpha; = {selectedProofAsset.severeDutyFactor.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '10px', borderRadius: 'var(--df-radius-md)' }}>
                    <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                      Étape 2 : Conversion du Ralenti Moteur (Idle Time) en Usure Équivalente
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                      KM_équivalent = &Delta;KM_odomètre + (Heures_ralenti &times; 33)
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      &bull; {selectedProofAsset.idleHours} h ralenti = +{res.equivalentIdleKm.toLocaleString('fr-FR')} km d’encrassement huile/FAP (Ratio officiel 1h = 33 km).
                    </div>
                  </div>

                  <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '10px', borderRadius: 'var(--df-radius-md)' }}>
                    <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                      Étape 3 : Facteur d'Accélération Télémétrique CAN-bus (&gamma;_CAN)
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                      &gamma;_CAN = 1.0 + &sum; P_sensor,k + &sum; rulPenaltyFactor(DTC_m)
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--df-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      &bull; &gamma;_CAN calculé : x{res.canAccelerationFactor.toFixed(3)} (Pénalité capteurs + DTCs actifs)
                    </div>
                  </div>

                  <div style={{ background: 'var(--df-bg-base)', border: '1px solid var(--df-border-subtle)', padding: '10px', borderRadius: 'var(--df-radius-md)' }}>
                    <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                      Étape 4 : RUL Finale & Probabilité de Panne à 30 Jours (Loi de Weibull)
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', margin: '4px 0', color: 'var(--df-text-main)' }}>
                      P_fail(30d) = 1 - exp(- (W_total &times; &gamma;_CAN)^&beta;)
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                        marginTop: '6px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', padding: '6px' }}>
                        <span style={{ color: 'var(--df-text-muted)', display: 'block', fontSize: '9px' }}>RUL Heures</span>
                        <strong style={{ color: '#F59E0B' }}>{res.rulRemainingHours?.toFixed(1) ?? '--'} h</strong>
                      </div>
                      <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', padding: '6px' }}>
                        <span style={{ color: 'var(--df-text-muted)', display: 'block', fontSize: '9px' }}>RUL Kilomètres</span>
                        <strong style={{ color: '#F59E0B' }}>{res.rulRemainingKm?.toFixed(0) ?? '--'} km</strong>
                      </div>
                      <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', padding: '6px' }}>
                        <span style={{ color: 'var(--df-text-muted)', display: 'block', fontSize: '9px' }}>P_fail (30 jours)</span>
                        <strong style={{ color: res.failureProbability30d > 0.5 ? '#EF4444' : '#10B981' }}>
                          {(res.failureProbability30d * 100).toFixed(1)}%
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ textAlign: 'right', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedProofAsset(null)}
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-medium)',
                  color: 'var(--df-text-main)',
                  padding: '5px 14px',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Fermer la preuve
              </button>
            </div>
          </div>
        </div>
      )}
    </HybridCommandLayout>
  );
}

