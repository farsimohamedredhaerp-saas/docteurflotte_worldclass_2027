'use client';

import React, { useState, useMemo } from 'react';
import { useMaintenance } from '../../context/MaintenanceContext';
import { IconWrench, IconSearch, IconSlidersHorizontal, IconZap } from '@/components/navigation/TechIcons';

export function WarehouseStockManager() {
  const {
    inventoryItems,
    warehouses,
    setIssueModalItem,
    handleGenerateAutoRestockOrders,
    inventoryStats,
  } = useMaintenance();

  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (warehouseFilter !== 'ALL' && item.warehouseId !== warehouseFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesSku = item.internalSku.toLowerCase().includes(q);
        const matchesName = item.partName.toLowerCase().includes(q);
        const matchesOem = item.oemReference.toLowerCase().includes(q);
        const matchesBin = item.binLocation.toLowerCase().includes(q);
        if (!matchesSku && !matchesName && !matchesOem && !matchesBin) {
          return false;
        }
      }
      return true;
    });
  }, [inventoryItems, warehouseFilter, statusFilter, searchQuery]);

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconWrench size={18} className="text-amber-400" />
            Stocks Magasins & Rayonnages Physiques (Inventaire 4.0)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
            Valorisation totale : <strong>{inventoryStats.totalValuationDzd.toLocaleString('fr-FR')} DZD</strong> • {inventoryStats.lowStockAlerts} alertes seuil min • {inventoryStats.outOfStockCount} ruptures
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateAutoRestockOrders}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <IconZap size={13} />
          <span>Réapprovisionnement Auto EOQ</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Rechercher par référence, désignation ou emplacement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              borderRadius: '6px',
              border: '1px solid var(--df-border-medium)',
              background: 'var(--df-bg-base)',
              color: '#fff',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={13} />
          </span>
        </div>

        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          style={{
            background: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-medium)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            padding: '6px 8px',
          }}
        >
          <option value="ALL">Tous Magasins</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.code})
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--df-bg-surface-2)',
            border: '1px solid var(--df-border-medium)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            padding: '6px 8px',
          }}
        >
          <option value="ALL">Tous Statuts</option>
          <option value="IN_STOCK">En Stock Nominal</option>
          <option value="LOW_STOCK_ALERT">Alerte Seuil Min</option>
          <option value="OUT_OF_STOCK">Rupture Critique</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
              <th style={{ padding: '8px 12px' }}>SKU Interne</th>
              <th style={{ padding: '8px 12px' }}>Désignation Pièce</th>
              <th style={{ padding: '8px 12px' }}>Magasin / Rayon</th>
              <th style={{ padding: '8px 12px' }}>Stock Phys. / Dispo</th>
              <th style={{ padding: '8px 12px' }}>Seuil Alerte</th>
              <th style={{ padding: '8px 12px' }}>PMP Unitaire DZD</th>
              <th style={{ padding: '8px 12px' }}>Statut</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const statusColor =
                item.status === 'IN_STOCK'
                  ? '#10B981'
                  : item.status === 'LOW_STOCK_ALERT'
                  ? '#F59E0B'
                  : '#EF4444';

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#38bdf8' }}>
                    {item.internalSku}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>
                    {item.partName}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--df-text-secondary)' }}>
                    {item.warehouseCode} • Rayon {item.binLocation}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace" }}>
                    <strong style={{ color: item.quantityAvailable > 0 ? '#fff' : '#EF4444' }}>
                      {item.quantityOnHand}u
                    </strong>{' '}
                    <span style={{ color: 'var(--df-text-muted)', fontSize: '11px' }}>
                      ({item.quantityAvailable} dispo)
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-muted)' }}>
                    {item.minimumStockThreshold}u
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#a5b4fc' }}>
                    {item.averageUnitCostDzd.toLocaleString('fr-FR')} DZD
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${statusColor}18`,
                        color: statusColor,
                        border: `1px solid ${statusColor}35`,
                      }}
                    >
                      {item.status === 'IN_STOCK' ? 'DISPONIBLE' : item.status === 'LOW_STOCK_ALERT' ? 'SEUIL MIN' : 'RUPTURE'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      disabled={item.quantityAvailable <= 0}
                      onClick={() =>
                        setIssueModalItem({
                          partSku: item.internalSku,
                          partName: item.partName,
                          warehouseId: item.warehouseId,
                          targetWorkOrderId: '',
                          quantity: 1,
                        })
                      }
                      style={{
                        background: item.quantityAvailable > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: item.quantityAvailable > 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                        color: item.quantityAvailable > 0 ? '#7dd3fc' : '#64748b',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: item.quantityAvailable > 0 ? 'pointer' : 'not-allowed',
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
  );
}

