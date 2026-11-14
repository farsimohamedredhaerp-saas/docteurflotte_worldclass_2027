'use client';

import React, { useState } from 'react';
import { useMaintenance } from '../../context/MaintenanceContext';
import { IconCheck, IconFileText } from '@/components/navigation/TechIcons';

export function StockMovementsAndOrders() {
  const { stockMovements, purchaseOrders, handleReceivePurchaseOrder } = useMaintenance();
  const [activeTab, setActiveTab] = useState<'movements' | 'purchase_orders'>('purchase_orders');

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
      {/* Sub Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--df-border-subtle)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('purchase_orders')}
            style={{
              background: activeTab === 'purchase_orders' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeTab === 'purchase_orders' ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
              color: activeTab === 'purchase_orders' ? '#fff' : 'var(--df-text-muted)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeTab === 'purchase_orders' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            Bons de Commande & Réceptions BL ({purchaseOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            style={{
              background: activeTab === 'movements' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeTab === 'movements' ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
              color: activeTab === 'movements' ? '#fff' : 'var(--df-text-muted)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: activeTab === 'movements' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            Journal d'Audit des Mouvements ({stockMovements.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Purchase Orders */}
      {activeTab === 'purchase_orders' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>N° Bon de Commande</th>
                <th style={{ padding: '8px 12px' }}>Fournisseur & NIF</th>
                <th style={{ padding: '8px 12px' }}>Magasin Cible</th>
                <th style={{ padding: '8px 12px' }}>Articles & Quantités</th>
                <th style={{ padding: '8px 12px' }}>Montant Total DZD</th>
                <th style={{ padding: '8px 12px' }}>Statut</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#38bdf8' }}>
                    {po.poNumber}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{po.supplierName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--df-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                      NIF: {po.supplierNif}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--df-text-secondary)' }}>
                    {po.warehouseName}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)' }}>
                      {po.items.map((i) => `${i.partName} (${i.quantityOrdered}u)`).join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#a5b4fc' }}>
                    {po.totalAmountDzd.toLocaleString('fr-FR')} DZD
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          po.status === 'RECEIVED'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : po.status === 'APPROVED'
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          po.status === 'RECEIVED'
                            ? '#6ee7b7'
                            : po.status === 'APPROVED'
                            ? '#7dd3fc'
                            : '#fbbf24',
                        border: `1px solid ${
                          po.status === 'RECEIVED'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(56, 189, 248, 0.3)'
                        }`,
                      }}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    {po.status !== 'RECEIVED' && (
                      <button
                        type="button"
                        onClick={() => handleReceivePurchaseOrder(po.id)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#6ee7b7',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <IconCheck size={12} />
                        <span>Réceptionner BL</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Stock Movements Audit Trail */}
      {activeTab === 'movements' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Horodatage</th>
                <th style={{ padding: '8px 12px' }}>Type Mouvement</th>
                <th style={{ padding: '8px 12px' }}>Réf. Pièce</th>
                <th style={{ padding: '8px 12px' }}>Magasin</th>
                <th style={{ padding: '8px 12px' }}>Quantité</th>
                <th style={{ padding: '8px 12px' }}>Solde Après</th>
                <th style={{ padding: '8px 12px' }}>N° Document Réf.</th>
              </tr>
            </thead>
            <tbody>
              {stockMovements.map((mov) => {
                const isPositive = mov.quantity > 0;
                return (
                  <tr key={mov.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-muted)' }}>
                      {mov.timestamp}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: isPositive ? '#10B981' : '#F59E0B' }}>
                      {mov.movementType}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#fff' }}>
                      {mov.partName} ({mov.internalSku})
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--df-text-secondary)' }}>
                      {mov.warehouseCode}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: isPositive ? '#10B981' : '#EF4444' }}>
                      {isPositive ? `+${mov.quantity}` : mov.quantity}u
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--df-text-main)' }}>
                      {mov.balanceAfter}u
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#a5b4fc' }}>
                      {mov.referenceDocNumber || mov.workOrderNumber || '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

