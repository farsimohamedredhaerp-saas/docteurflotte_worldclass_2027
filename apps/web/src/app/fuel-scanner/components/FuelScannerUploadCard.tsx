'use client';

import React, { useState } from 'react';
import { Asset, StandardFuelType } from '@docteurflotte/contracts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/Button';
import { IconFuel, IconSearch } from '@/components/navigation/TechIcons';
import { useSystemConfig } from '@/context/SystemConfigContext';
import { SCAN_PRESETS } from '../lib/scanPresets';

export interface FuelScannerUploadCardProps {
  assets: Asset[];
  selectedAssetId: string;
  onSelectAssetId: (id: string) => void;
  onScan: (
    rawText: string,
    liters: number,
    station: string,
    fuelType: StandardFuelType
  ) => Promise<boolean>;
  isScanning: boolean;
  resolvePrice: (typeStr: string) => number;
}

export const FuelScannerUploadCard: React.FC<FuelScannerUploadCardProps> = ({
  assets,
  selectedAssetId,
  onSelectAssetId,
  onScan,
  isScanning,
  resolvePrice,
}) => {
  const { tariffs } = useSystemConfig();
  const unitPriceGasoil = tariffs.fuelPrices.gasoil;

  const [rawText, setRawText] = useState<string>(
    SCAN_PRESETS.valid.rawText(unitPriceGasoil)
  );
  const [litersOverride, setLitersOverride] = useState<number>(45);
  const [stationOverride, setStationOverride] = useState<string>('Station Naftal Chéraga (RN41)');
  const [fuelTypeOverride, setFuelTypeOverride] = useState<StandardFuelType>('Gasoil');

  const handleApplyPreset = (presetKey: 'valid' | 'sahara' | 'fraud') => {
    const p = SCAN_PRESETS[presetKey];
    setLitersOverride(p.liters);
    setStationOverride(p.station);
    setFuelTypeOverride(p.fuelType);
    setRawText(p.rawText(unitPriceGasoil));
  };

  const currentUnitPrice = resolvePrice(fuelTypeOverride);
  const calculatedTotalDzd = Math.round(litersOverride * currentUnitPrice * 100) / 100;

  return (
    <Card variant="default" className="mb-6 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <IconFuel size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Module d'Ingestion &amp; Scanner OCR de Reçus Naftal
            </h2>
            <p className="text-xs text-slate-500">
              Extraction automatique des mentions fiscales, station et confrontation télématique
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-400 uppercase mr-1">Scénarios :</span>
          {(['valid', 'sahara', 'fraud'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleApplyPreset(key)}
              className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 transition-colors"
            >
              {key === 'valid' ? 'Chéraga (45L)' : key === 'sahara' ? 'Sahara (380L)' : 'Blida (Litige)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actif / Véhicule concerné par le plein *
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => onSelectAssetId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name} ({a.brand || 'Marque'} {a.model || ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Flux OCR brut extrait du reçu papier Naftal
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={4}
              placeholder="Collez ou visualisez le texte OCR..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Champs Extraits &amp; Barèmes DGI 2026
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
              Station Naftal identifiée
            </label>
            <input
              type="text"
              value={stationOverride}
              onChange={(e) => setStationOverride(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Type Carburant
              </label>
              <select
                value={fuelTypeOverride}
                onChange={(e) => setFuelTypeOverride(e.target.value as StandardFuelType)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="Gasoil">Gasoil ({tariffs.fuelPrices.gasoil} DA)</option>
                <option value="Super">Super ({tariffs.fuelPrices.super} DA)</option>
                <option value="Sans Plomb">Sans Plomb ({tariffs.fuelPrices.sansPlomb} DA)</option>
                <option value="GPL">Sirghaz / GPL ({tariffs.fuelPrices.gpl} DA)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Volume (Litres)
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={litersOverride}
                onChange={(e) => setLitersOverride(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Montant Total Reçu</div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                {calculatedTotalDzd.toLocaleString('fr-DZ')} DA
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onScan(rawText, litersOverride, stationOverride, fuelTypeOverride)}
              disabled={isScanning || !selectedAssetId}
              className="inline-flex items-center gap-1.5"
            >
              <IconSearch size={13} />
              <span>{isScanning ? 'Analyse CUSUM...' : 'Lancer l’Audit CUSUM'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
