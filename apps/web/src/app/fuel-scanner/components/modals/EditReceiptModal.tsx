'use client';

import React, { useState, useEffect } from 'react';
import { FuelReceiptScanResult } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { EditReceiptFormData } from '../../types';

export interface EditReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: EditReceiptFormData) => void;
  receipt: FuelReceiptScanResult | null;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  receipt,
}) => {
  const [formData, setFormData] = useState<EditReceiptFormData>({
    stationName: '',
    liters: 0,
    totalAmountDzd: 0,
  });

  useEffect(() => {
    if (receipt) {
      setFormData({
        stationName: receipt.stationName,
        liters: receipt.liters,
        totalAmountDzd: receipt.totalAmountDzd,
      });
    }
  }, [receipt]);

  if (!receipt) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(receipt.receiptId, formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le Reçu Naftal"
      subtitle={`Correction des informations pour le reçu #${receipt.receiptId.slice(-6).toUpperCase()}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Station Naftal *
          </label>
          <input
            type="text"
            value={formData.stationName}
            onChange={(e) => setFormData({ ...formData, stationName: e.target.value })}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Volume (Litres) *
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={formData.liters}
              onChange={(e) =>
                setFormData({ ...formData, liters: parseFloat(e.target.value) || 0 })
              }
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Montant DGI (DZD) *
            </label>
            <input
              type="number"
              value={formData.totalAmountDzd}
              onChange={(e) =>
                setFormData({ ...formData, totalAmountDzd: parseFloat(e.target.value) || 0 })
              }
              required
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
};

