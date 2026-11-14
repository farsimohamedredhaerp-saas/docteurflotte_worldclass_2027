'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { WarehouseStoreItem, MaintenanceWorkOrderItem } from '../../types';

interface IssueModalItemData {
  partSku: string;
  partName: string;
  warehouseId: string;
  targetWorkOrderId: string;
  quantity: number;
}

interface StockIssueModalProps {
  item: IssueModalItemData | null;
  warehouses: WarehouseStoreItem[];
  workOrders: MaintenanceWorkOrderItem[];
  onChangeItem: (item: IssueModalItemData) => void;
  onConfirm: (sku: string, warehouseId: string, workOrderId: string, qty: number) => void;
  onClose: () => void;
}

export function StockIssueModal({
  item,
  warehouses,
  workOrders,
  onChangeItem,
  onConfirm,
  onClose,
}: StockIssueModalProps) {
  if (!item) return null;

  return (
    <Modal
      isOpen={Boolean(item)}
      onClose={onClose}
      title="Sortie Magasin & Affectation Ordre de Travail"
      subtitle={`Pièce : ${item.partName} (${item.partSku})`}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-secondary)',
              padding: '6px 14px',
              borderRadius: 'var(--df-radius-md)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(item.partSku, item.warehouseId, item.targetWorkOrderId, item.quantity)}
            style={{
              background: '#2563EB',
              border: 'none',
              color: '#FFFFFF',
              padding: '6px 16px',
              borderRadius: 'var(--df-radius-md)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Valider la Sortie Magasin
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
            Magasin de prélèvement :
          </label>
          <select
            value={item.warehouseId}
            onChange={(e) => onChangeItem({ ...item, warehouseId: e.target.value })}
            style={{
              width: '100%',
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              color: 'var(--df-text-main)',
              fontSize: '12px',
              padding: '6px 8px',
            }}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
            Ordre de Travail destinataire :
          </label>
          <select
            value={item.targetWorkOrderId}
            onChange={(e) => onChangeItem({ ...item, targetWorkOrderId: e.target.value })}
            style={{
              width: '100%',
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              color: 'var(--df-text-main)',
              fontSize: '12px',
              padding: '6px 8px',
            }}
          >
            {workOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.workOrderNumber} — {wo.vehicleRegistration} ({wo.title})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
            Quantité à déstocker :
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={item.quantity}
            onChange={(e) => onChangeItem({ ...item, quantity: parseInt(e.target.value, 10) || 1 })}
            style={{
              width: '100%',
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-md)',
              color: 'var(--df-text-main)',
              fontSize: '12px',
              padding: '6px 8px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

