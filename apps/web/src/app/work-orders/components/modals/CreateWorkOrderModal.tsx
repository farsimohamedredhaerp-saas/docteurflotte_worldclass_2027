'use client';

import React, { useState } from 'react';
import { Asset, WorkOrderPriority } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { CreateWorkOrderFormData } from '../../types';

export interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkOrderFormData) => Promise<boolean>;
  assets: Asset[];
  isSubmitting: boolean;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assets,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<CreateWorkOrderFormData>({
    assetId: assets[0]?.id || '',
    title: '',
    description: '',
    priority: WorkOrderPriority.MEDIUM,
    estimatedLaborHours: 2,
    assignedTo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        assetId: assets[0]?.id || '',
        title: '',
        description: '',
        priority: WorkOrderPriority.MEDIUM,
        estimatedLaborHours: 2,
        assignedTo: '',
      });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un Ordre de Travail Atelier"
      subtitle="Planification d'une intervention mécanique ou électrique"
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
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Intitulé de l'intervention *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex : Révision freinage essieu avant, Remplacement filtre"
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description des travaux à exécuter
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Détails techniques, anomalies constatées ou pièces requises..."
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priorité opérationnelle
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as WorkOrderPriority })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={WorkOrderPriority.LOW}>Basse</option>
              <option value={WorkOrderPriority.MEDIUM}>Moyenne</option>
              <option value={WorkOrderPriority.HIGH}>Haute</option>
              <option value={WorkOrderPriority.CRITICAL}>Critique</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Heures MO estimées
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={formData.estimatedLaborHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedLaborHours: parseFloat(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Mécanicien ou atelier assigné
          </label>
          <input
            type="text"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            placeholder="Ex : Karim M. (Chef d'équipe atelier Rouiba)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Création en cours...' : 'Créer l’ordre de travail'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
