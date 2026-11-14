'use client';

import React, { useState, useEffect } from 'react';
import { Asset } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { ManualReceiptFormData } from '../../types';

export interface ManualReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManualReceiptFormData) => void;
  assets: Asset[];
  resolvePrice: (fuelType: string) => number;
}

export const ManualReceiptModal: React.FC<ManualReceiptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assets,
  resolvePrice,
}) => {
  const [formData, setFormData] = useState<ManualReceiptFormData>({
    assetId: assets[0]?.id || '',
    stationName: 'Station Naftal Rouiba (ZI)',
    fuelType: 'Gasoil',
    liters: 60,
    totalAmountDzd: 1860,
  });

  useEffect(() => {
    if (assets.length > 0 && !formData.assetId) {
      setFormData((prev) => ({ ...prev, assetId: assets[0].id }));
    }
  }, [assets, formData.assetId]);

  // Recalcul automatique du montant selon le prix unitaire résolu
  const handleLitersChange = (liters: number) => {
    const unitPrice = resolvePrice(formData.fuelType);
    setFormData({
      ...formData,
      liters,
      totalAmountDzd: Math.round(liters * unitPrice * 100) / 100,
    });
  };

  const handleFuelTypeChange = (fuelType: 'Gasoil' | 'Super' | 'Sans Plomb' | 'GPL') => {
    const unitPrice = resolvePrice(fuelType);
    setFormData({
      ...formData,
      fuelType,
      totalAmountDzd: Math.round(formData.liters * unitPrice * 100) / 100,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saisie Manuelle d'un Plein Carburant"
      subtitle="Enregistrement d'un ticket papier Naftal ou approvisionnement sur piste"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Actif / Véhicule concerné *
          </label>
          <select
            value={formData.assetId}
            onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name} ({a.brand} {a.model})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nom et localisation de la station Naftal *
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
              Type de carburant
            </label>
            <select
              value={formData.fuelType}
              onChange={(e) =>
                handleFuelTypeChange(e.target.value as 'Gasoil' | 'Super' | 'Sans Plomb' | 'GPL')
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="Gasoil">Gasoil</option>
              <option value="Super">Super</option>
              <option value="Sans Plomb">Sans Plomb</option>
              <option value="GPL">GPL / Sirghaz</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Volume (Litres) *
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={formData.liters}
              onChange={(e) => handleLitersChange(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Montant Total DGI calculé (DZD) *
          </label>
          <input
            type="number"
            value={formData.totalAmountDzd}
            onChange={(e) =>
              setFormData({ ...formData, totalAmountDzd: parseFloat(e.target.value) || 0 })
            }
            required
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Enregistrer le reçu
          </Button>
        </div>
      </form>
    </Modal>
  );
};

