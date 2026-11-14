'use client';

import React, { useState } from 'react';
import { AssetCategory, MeterType } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { IconCpu, IconSearch } from '@/components/navigation/TechIcons';
import { CreateAssetFormData } from '../../types';

export interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssetFormData) => Promise<boolean>;
  onResolveOem: (query: string) => Promise<Partial<CreateAssetFormData> | null>;
  isSubmitting: boolean;
  isResolvingOem: boolean;
}

const defaultForm: CreateAssetFormData = {
  name: '',
  code: '',
  category: AssetCategory.HEAVY_TRUCK,
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  primaryMeterType: MeterType.ODOMETER_KM,
  initialMeterValue: 0,
  maintenanceIntervalValue: 10000,
};

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onResolveOem,
  isSubmitting,
  isResolvingOem,
}) => {
  const [oemQuery, setOemQuery] = useState('');
  const [formData, setFormData] = useState<CreateAssetFormData>(defaultForm);

  const handleOemSearch = async () => {
    if (!oemQuery.trim()) return;
    const resolved = await onResolveOem(oemQuery);
    if (resolved) setFormData((prev) => ({ ...prev, ...resolved }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await onSubmit(formData)) {
      setFormData(defaultForm);
      setOemQuery('');
      onClose();
    }
  };

  const inputClass = 'w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer un Nouvel Actif de Flotte"
      subtitle="Immatriculation, rattachement de jauge et importation de fiche constructeur OEM"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* BANDEAU RECHERCHE OEM RMI */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <IconCpu size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>Résolution Automatique Constructeur OEM (RMI Scraper)</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={oemQuery}
              onChange={(e) => setOemQuery(e.target.value)}
              placeholder="VIN (17 car.) ou Marque/Modèle (ex: Renault K480, Shacman X3000)..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-indigo-300 dark:placeholder-indigo-600 focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOemSearch}
              disabled={isResolvingOem || !oemQuery.trim()}
              className="inline-flex items-center gap-1"
            >
              <IconSearch size={12} />
              <span>{isResolvingOem ? 'Scraping...' : 'Résoudre OEM'}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Code / Immatriculation *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="16-10492-00"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Désignation *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Tracteur Routier Renault K480"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
              className={inputClass}
            >
              <option value={AssetCategory.HEAVY_TRUCK}>Poids Lourd</option>
              <option value={AssetCategory.ROAD_VEHICLE}>Véhicule Utilitaire / Léger</option>
              <option value={AssetCategory.CONSTRUCTION_EQUIPMENT}>Engin BTP / Minier</option>
              <option value={AssetCategory.INDUSTRIAL_MACHINE}>Machine Industrielle</option>
              <option value={AssetCategory.OTHER}>Autre Équipement</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Marque</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Renault, Shacman..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Modèle</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="K480, X3000..."
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type de compteur</label>
            <select
              value={formData.primaryMeterType}
              onChange={(e) => setFormData({ ...formData, primaryMeterType: e.target.value as MeterType })}
              className={inputClass}
            >
              <option value={MeterType.ODOMETER_KM}>Kilomètres (km)</option>
              <option value={MeterType.ENGINE_HOURS}>Heures moteur (h)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Relevé initial</label>
            <input
              type="number"
              min="0"
              value={formData.initialMeterValue}
              onChange={(e) => setFormData({ ...formData, initialMeterValue: parseFloat(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Intervalle révision</label>
            <input
              type="number"
              min="500"
              step="500"
              value={formData.maintenanceIntervalValue}
              onChange={(e) => setFormData({ ...formData, maintenanceIntervalValue: parseFloat(e.target.value) || 10000 })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer cet actif'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
