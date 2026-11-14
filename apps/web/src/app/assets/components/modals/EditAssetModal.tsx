'use client';

import React, { useEffect, useState } from 'react';
import { Asset, AssetCategory } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { EditAssetFormData } from '../../types';

export interface EditAssetModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSubmit: (id: string, data: EditAssetFormData) => Promise<boolean>;
  isUpdating: boolean;
}

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSubmit,
  isUpdating,
}) => {
  const [formData, setFormData] = useState<EditAssetFormData>({
    name: '',
    code: '',
    brand: '',
    model: '',
    category: AssetCategory.HEAVY_TRUCK,
    maintenanceIntervalValue: 10000,
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        code: asset.code,
        brand: asset.brand || '',
        model: asset.model || '',
        category: asset.category,
        maintenanceIntervalValue: asset.maintenanceIntervalValue || 10000,
      });
    }
  }, [asset]);

  if (!asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit(asset.id, formData);
    if (ok) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier l'Actif : ${asset.code}`}
      subtitle="Mise à jour des métadonnées et intervalle d'entretien préventif"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Code Actif / Matricule *
          </label>
          <input
            type="text"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Désignation Actif *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Marque
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Modèle
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={AssetCategory.HEAVY_TRUCK}>Poids Lourds</option>
              <option value={AssetCategory.CONSTRUCTION_EQUIPMENT}>Engin BTP</option>
              <option value={AssetCategory.ROAD_VEHICLE}>Véhicule Léger</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Intervalle Révision OEM
            </label>
            <input
              type="number"
              min={100}
              value={formData.maintenanceIntervalValue}
              onChange={(e) => setFormData({ ...formData, maintenanceIntervalValue: Number(e.target.value) })}
              className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
            {isUpdating ? 'Sauvegarde...' : 'Enregistrer Modifications'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
