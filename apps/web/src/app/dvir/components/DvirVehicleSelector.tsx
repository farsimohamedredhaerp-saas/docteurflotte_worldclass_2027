'use client';

import React from 'react';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/ui/Card';
import { IconTruck, IconShieldCheck } from '@/components/navigation/TechIcons';
import { VehicleProfile, DvirLanguage } from '../types';

export interface DvirVehicleSelectorProps {
  vehicles: VehicleProfile[];
  selectedAssetId: string;
  onSelectVehicle: (id: string) => void;
  selectedVehicle: VehicleProfile | null;
  language: DvirLanguage;
}

export const DvirVehicleSelector: React.FC<DvirVehicleSelectorProps> = ({
  vehicles,
  selectedAssetId,
  onSelectVehicle,
  selectedVehicle,
  language,
}) => {
  return (
    <Card variant="default" padding="md" className="mb-6 bg-white dark:bg-[#111827]">
      <div className="flex items-center gap-2 mb-3">
        <IconTruck size={18} className="text-blue-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {language === 'ar' ? 'اختيار المركبة أو الشاحنة المعنية' : 'Sélection du Véhicule / Actif à Inspecter'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            {language === 'ar' ? 'المركبة من الحظيرة *' : 'Actif de Flotte *'}
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => onSelectVehicle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {language === 'ar' ? '-- اختر مركبة لإجراء الفحص --' : '-- Choisissez un véhicule pour l’inspection --'}
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.name} ({v.wilaya})
              </option>
            ))}
          </select>
        </div>

        {selectedVehicle && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Chauffeur habituel :</span>
              <strong className="text-slate-900 dark:text-slate-100">{selectedVehicle.driverName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Odomètre télématique :</span>
              <strong className="font-mono text-blue-600 dark:text-blue-400">
                {selectedVehicle.odometerKm.toLocaleString('fr-DZ')} km
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Dernier contrôle :</span>
              <Badge variant={selectedVehicle.lastInspectionResult === 'PASS' ? 'ok' : 'danger'}>
                {selectedVehicle.lastInspectionResult === 'PASS' ? 'Conforme' : 'Défaut'}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
