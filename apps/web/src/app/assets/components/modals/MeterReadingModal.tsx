'use client';

import React, { useEffect, useState } from 'react';
import { Asset, MeterType } from '@docteurflotte/contracts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/Button';
import { IconAlertTriangle } from '@/components/navigation/TechIcons';

export interface MeterReadingModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSubmit: (asset: Asset, newMeterValue: number) => Promise<boolean>;
  isRecording: boolean;
}

export const MeterReadingModal: React.FC<MeterReadingModalProps> = ({
  isOpen,
  asset,
  onClose,
  onSubmit,
  isRecording,
}) => {
  const [meterValue, setMeterValue] = useState<number>(0);

  useEffect(() => {
    if (asset) {
      setMeterValue(asset.currentMeterValue || 0);
    }
  }, [asset]);

  if (!asset) return null;

  const unit = asset.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'heures';
  const isRollback = meterValue < (asset.currentMeterValue || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit(asset, meterValue);
    if (ok) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Relever Compteur : ${asset.name}`}
      subtitle={`Code : ${asset.code} • Compteur actuel : ${(asset.currentMeterValue || 0).toLocaleString('fr-DZ')} ${unit}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Nouvelle Valeur Relevée ({unit}) *
          </label>
          <input
            type="number"
            required
            min={0}
            value={meterValue}
            onChange={(e) => setMeterValue(Number(e.target.value))}
            className="w-full font-mono text-base font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isRollback && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
            <IconAlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Attention : Risque d&apos;anomalie de compteur</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-300">
                La valeur saisie ({meterValue.toLocaleString('fr-DZ')}) est inférieure au relevé certifié précédent ({asset.currentMeterValue?.toLocaleString('fr-DZ')}). Une anomalie de recul de compteur sera enregistrée.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isRecording}>
            {isRecording ? 'Vérification...' : 'Enregistrer le Relevé'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
