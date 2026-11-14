'use client';

import React, { useEffect, useState } from 'react';
import { WorkOrder, WorkOrderPriority } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { EditWorkOrderFormData } from '../../types';

export interface EditWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: EditWorkOrderFormData) => Promise<boolean>;
  workOrder: WorkOrder | null;
  isUpdating: boolean;
}

export const EditWorkOrderModal: React.FC<EditWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workOrder,
  isUpdating,
}) => {
  const [formData, setFormData] = useState<EditWorkOrderFormData>({
    title: '',
    description: '',
    priority: WorkOrderPriority.MEDIUM,
    estimatedLaborHours: 2,
    assignedTo: '',
  });

  useEffect(() => {
    if (workOrder) {
      setFormData({
        title: workOrder.title,
        description: workOrder.description || '',
        priority: workOrder.priority,
        estimatedLaborHours: workOrder.estimatedLaborHours || 2,
        assignedTo: workOrder.assignedTo || '',
      });
    }
  }, [workOrder]);

  if (!workOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(workOrder.id, formData);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier l'Ordre de Travail"
      subtitle={`Édition des paramètres de l'ordre #${workOrder.id.slice(-6).toUpperCase()}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Intitulé des travaux *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description des travaux
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priorité
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
            Affectation
          </label>
          <input
            type="text"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isUpdating}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isUpdating}>
            {isUpdating ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
