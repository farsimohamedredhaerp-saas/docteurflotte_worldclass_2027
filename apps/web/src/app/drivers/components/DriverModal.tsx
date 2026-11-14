'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { DriverRecord, DriverFormData } from '../types';

export interface DriverModalProps {
  isOpen: boolean;
  driver: DriverRecord | null;
  onClose: () => void;
  onSubmit: (data: DriverFormData) => void;
}

const defaultForm: DriverFormData = {
  name: '',
  matriculeNumber: '',
  phone: '0550 00 00 00',
  licenseCategory: 'E',
  licenseNumber: '',
  licenseExpiry: '',
  medicalCheckExpiry: '',
  assignedVehiclePlate: '',
  assignedVehicleModel: '',
  currentSiteOrCorridor: 'Base Centrale',
  status: 'AVAILABLE',
};

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5';

export const DriverModal: React.FC<DriverModalProps> = ({
  isOpen,
  driver,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<DriverFormData>(defaultForm);

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name,
        matriculeNumber: driver.matriculeNumber,
        phone: driver.phone,
        licenseCategory: driver.licenseCategory,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry,
        medicalCheckExpiry: driver.medicalCheckExpiry,
        assignedVehiclePlate: driver.assignedVehiclePlate,
        assignedVehicleModel: driver.assignedVehicleModel,
        currentSiteOrCorridor: driver.currentSiteOrCorridor,
        status: driver.status,
      });
    } else {
      setFormData({
        ...defaultForm,
        matriculeNumber: `DRV-16-${Math.floor(100 + Math.random() * 900)}`,
        licenseNumber: 'DZ-16-',
      });
    }
  }, [driver, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? 'Modifier Fiche Conducteur' : 'Nouveau Conducteur / Opérateur'}
      subtitle="Enregistrement des habilitations et dates d’expiration légales (Loi 18-07 ANPDP)"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom &amp; Prénom *</label>
            <input
              type="text"
              required
              placeholder="Ex: Sofiane Djebbar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input
              type="text"
              placeholder="0550 00 00 00"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Catégorie Permis</label>
            <select
              value={formData.licenseCategory}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  licenseCategory: e.target.value as DriverFormData['licenseCategory'],
                })
              }
              className={inputClass}
            >
              <option value="E">Permis E (Semi-remorque)</option>
              <option value="C2">Permis C2 (Poids Lourds &gt; 19t)</option>
              <option value="C1">Permis C1 (Porteurs &lt; 19t)</option>
              <option value="BTP_ENGIN">CACES / Engins BTP</option>
              <option value="B">Permis B (Utilitaires)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>N° de Permis *</label>
            <input
              type="text"
              required
              placeholder="DZ-16-..."
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date Expiration Permis</label>
            <input
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Validité Visite Médicale</label>
            <input
              type="date"
              value={formData.medicalCheckExpiry}
              onChange={(e) => setFormData({ ...formData, medicalCheckExpiry: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Immatriculation Affectée</label>
            <input
              type="text"
              placeholder="Ex: 00421-116-16"
              value={formData.assignedVehiclePlate}
              onChange={(e) => setFormData({ ...formData, assignedVehiclePlate: e.target.value })}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={labelClass}>Statut Opérationnel</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as DriverFormData['status'] })
              }
              className={inputClass}
            >
              <option value="AVAILABLE">Disponible</option>
              <option value="ON_DUTY">En Route / Mission</option>
              <option value="REST">Repos Légal</option>
              <option value="LICENSE_WARNING">Visite Médicale Urgente</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {driver ? 'Enregistrer Modifications' : 'Créer Conducteur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
