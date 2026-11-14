'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { IconX } from '@/components/navigation/TechIcons';
import { InsuranceRecord } from '../../types';

interface InsuranceModalProps {
  isOpen: boolean;
  editingRecord: InsuranceRecord | null;
  onClose: () => void;
  onSave: (data: Partial<InsuranceRecord>, editingId?: string) => void;
}

export function InsuranceModal({
  isOpen,
  editingRecord,
  onClose,
  onSave,
}: InsuranceModalProps) {
  const [form, setForm] = useState<Partial<InsuranceRecord>>({
    registrationNumber: '',
    makeModel: '',
    insurer: 'CAAT',
    policyNumber: '',
    expiryDate: '',
    coverageType: 'TOUS_RISQUES',
    status: 'VALID',
  });

  useEffect(() => {
    if (editingRecord) {
      setForm({ ...editingRecord });
    } else {
      setForm({
        registrationNumber: '',
        makeModel: '',
        insurer: 'CAAT',
        policyNumber: '',
        expiryDate: '',
        coverageType: 'TOUS_RISQUES',
        status: 'VALID',
      });
    }
  }, [editingRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registrationNumber || !form.policyNumber) {
      alert("Veuillez renseigner l'immatriculation et le numéro de police.");
      return;
    }
    onSave(form, editingRecord?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingRecord ? "Modifier Police d'Assurance" : "Nouvelle Police d'Assurance"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Immatriculation Véhicule *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 01892-116-16"
              value={form.registrationNumber || ''}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Compagnie d&apos;Assurance
              </label>
              <select
                value={form.insurer || 'CAAT'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    insurer: e.target.value as InsuranceRecord['insurer'],
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="CAAT">CAAT</option>
                <option value="SAA">SAA</option>
                <option value="CASH">CASH Assurances</option>
                <option value="MACIR_VIE">Macir Vie</option>
                <option value="ALLIANCE">Alliance Assurances</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                N° de Police *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: CAAT-FLT-2026-00481"
                value={form.policyNumber || ''}
                onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Formule de Couverture
              </label>
              <select
                value={form.coverageType || 'TOUS_RISQUES'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    coverageType: e.target.value as InsuranceRecord['coverageType'],
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="TOUS_RISQUES">Tous Risques</option>
                <option value="TIERS_COLLISION">Tiers &amp; Collision</option>
                <option value="RESPONSABILITE_CIVILE">Responsabilité Civile</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date d&apos;Échéance *
              </label>
              <input
                type="date"
                required
                value={form.expiryDate || ''}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingRecord ? 'Mettre à jour' : 'Enregistrer la Police'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
