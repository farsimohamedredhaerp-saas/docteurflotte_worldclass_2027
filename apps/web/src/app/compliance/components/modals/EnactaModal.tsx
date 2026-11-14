'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { IconX } from '@/components/navigation/TechIcons';
import { EnactaRecord } from '../../types';

interface EnactaModalProps {
  isOpen: boolean;
  editingRecord: EnactaRecord | null;
  onClose: () => void;
  onSave: (data: Partial<EnactaRecord>, editingId?: string) => void;
}

export function EnactaModal({
  isOpen,
  editingRecord,
  onClose,
  onSave,
}: EnactaModalProps) {
  const [form, setForm] = useState<Partial<EnactaRecord>>({
    registrationNumber: '',
    makeModel: '',
    category: 'PL',
    lastInspectionDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    centerName: 'Centre ENACTA Rouiba (16)',
    wilaya: 'Alger (16)',
    status: 'VALID',
  });

  useEffect(() => {
    if (editingRecord) {
      setForm({ ...editingRecord });
    } else {
      setForm({
        registrationNumber: '',
        makeModel: '',
        category: 'PL',
        lastInspectionDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        centerName: 'Centre ENACTA Rouiba (16)',
        wilaya: 'Alger (16)',
        status: 'VALID',
      });
    }
  }, [editingRecord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registrationNumber || !form.expiryDate) {
      alert("Veuillez renseigner l'immatriculation et la date d'échéance.");
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
            {editingRecord ? 'Modifier Contrôle ENACTA' : 'Nouveau Contrôle Technique ENACTA'}
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
              Immatriculation Véhicule (Format Algérien : 02410-117-22) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 00421-116-16"
              value={form.registrationNumber || ''}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Marque &amp; Modèle
            </label>
            <input
              type="text"
              placeholder="Ex: Renault Trucks K 480"
              value={form.makeModel || ''}
              onChange={(e) => setForm({ ...form, makeModel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Catégorie
              </label>
              <select
                value={form.category || 'PL'}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as EnactaRecord['category'] })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="PL">Poids Lourds (PL)</option>
                <option value="BTP">Engins BTP</option>
                <option value="VL">Véhicule Léger (VL)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date Limite Échéance *
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

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Centre Agréé ENACTA
            </label>
            <input
              type="text"
              placeholder="Ex: Centre ENACTA Rouiba (16)"
              value={form.centerName || ''}
              onChange={(e) => setForm({ ...form, centerName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingRecord ? 'Mettre à jour' : 'Enregistrer le Contrôle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

