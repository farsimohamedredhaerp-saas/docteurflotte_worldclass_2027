'use client';

import React, { useState } from 'react';
import { WorkOrder } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { IconShieldCheck } from '@/components/navigation/TechIcons';
import { CompleteWorkOrderFormData } from '../../types';

export interface CompleteWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wo: WorkOrder, data: CompleteWorkOrderFormData) => Promise<boolean>;
  workOrder: WorkOrder | null;
  isCompleting: boolean;
}

export const CompleteWorkOrderModal: React.FC<CompleteWorkOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workOrder,
  isCompleting,
}) => {
  const { tariffs } = useSystemConfig();
  const [formData, setFormData] = useState<CompleteWorkOrderFormData>({
    actualLaborHours: 2,
    partsCost: 0,
    downtimeHours: 0,
    completionNotes: '',
  });

  if (!workOrder) return null;

  const isDvirOrder =
    workOrder.id.startsWith('ot-dvir') || workOrder.title.includes('DVIR');

  const hourlyRate = tariffs.economicRates?.hourlyLaborRateDzd || 1500;
  const laborTotal = formData.actualLaborHours * hourlyRate;
  const grandTotal = laborTotal + formData.partsCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(workOrder, formData);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clôturer l'Intervention & Valider les Coûts"
      subtitle={`Enregistrement des temps réels, consommables et levée de verrou pour #${workOrder.id.slice(-6).toUpperCase()}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ALERTE SPÉCIALE DVIR TOPSIS LOCK */}
        {isDvirOrder && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5">
            <IconShieldCheck size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-300">
              <span className="font-bold">Levée de verrou de sécurité DVIR :</span> La clôture de cet ordre requalifiera automatiquement le véhicule{' '}
              <span className="font-semibold underline">
                {workOrder.assetName || workOrder.assetCode}
              </span>{' '}
              pour le dispatching et l'ordonnancement TOPSIS.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Heures MO réelles constatées *
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={formData.actualLaborHours}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actualLaborHours: parseFloat(e.target.value) || 0.5,
                })
              }
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Taux horaire DGI : {hourlyRate.toLocaleString('fr-DZ')} DA/h
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Coût des pièces OEM (DZD) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={formData.partsCost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  partsCost: parseFloat(e.target.value) || 0,
                })
              }
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Consommables et kits certifiés
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Heures d'immobilisation de l'actif
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.downtimeHours}
            onChange={(e) =>
              setFormData({
                ...formData,
                downtimeHours: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Compte-rendu de clôture &amp; visa de l'atelier
          </label>
          <textarea
            value={formData.completionNotes}
            onChange={(e) =>
              setFormData({ ...formData, completionNotes: e.target.value })
            }
            placeholder="Observations mécaniques, essais sur route, références pièces..."
            rows={3}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* RÉSUMÉ FINANCIER DZD */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <div>MO : {laborTotal.toLocaleString('fr-DZ')} DA</div>
            <div>Pièces : {formData.partsCost.toLocaleString('fr-DZ')} DA</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total HT Facturable</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {grandTotal.toLocaleString('fr-DZ')} DA
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isCompleting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isCompleting}>
            {isCompleting ? 'Validation...' : 'Valider & Clôturer l’ordre'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
