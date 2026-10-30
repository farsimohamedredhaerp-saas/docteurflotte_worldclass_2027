'use client';

import React, { useEffect, useState } from 'react';
import {
  OEMCatalogClient,
  OEMBrandInfo,
  OEMModelInfo,
  OEMVariantInfo,
  OEMCatalogItem,
} from '../../lib/api-oem-catalog';
import { Badge } from '../Badge';
import { Button } from '../Button';

interface VehicleCatalogSelectorProps {
  onSelectVariant: (selected: {
    brandName: string;
    modelName: string;
    engineName: string;
    category: string;
    tankLiters: number;
    ptacKg: number;
    oilCapacityLiters: number;
    oilNormSpec: string;
    consumptionMixedL100km: number;
    consumptionIdleLHour: number;
    standardIntervalKm: number;
    standardIntervalHours: number;
  }) => void;
  onCancel?: () => void;
}

const QUICK_FLEET_PRESETS = [
  { label: 'Renault Kangoo 1.5 dCi (2012)', brandSlug: 'renault', modelSlug: 'kangoo-ii', engineCode: 'RENAULT_K9K_808' },
  { label: 'DAF XF 105.460 (12.9L)', brandSlug: 'daf', modelSlug: 'xf-105-460', engineCode: 'DAF_MX13_340' },
  { label: 'Iveco Stralis 440 (Cursor 13)', brandSlug: 'iveco', modelSlug: 'stralis-440-480', engineCode: 'IVECO_CURSOR_13' },
  { label: 'Toyota HiAce 2.5 D-4D', brandSlug: 'toyota', modelSlug: 'hiace-2kd', engineCode: 'TOYOTA_2KD_FTV' },
  { label: 'Toyota Hilux 2.4 D-4D', brandSlug: 'toyota', modelSlug: 'hilux', engineCode: 'TOYOTA_2GD_FTV' },
  { label: 'Shacman X3000 6x4', brandSlug: 'shacman', modelSlug: 'x3000-f3000', engineCode: 'WEICHAI_WP12_430' },
  { label: 'DFSK K01 Mini-Camion', brandSlug: 'dfsk', modelSlug: 'k01-c31', engineCode: 'DFSK_DK12' },
  { label: 'SNVI K66 / K120', brandSlug: 'snvi', modelSlug: 'k66-k120', engineCode: 'DEUTZ_F6L912' },
  { label: 'VW Caddy 1.6 TDI', brandSlug: 'volkswagen', modelSlug: 'caddy-iii-iv', engineCode: 'VW_CAYD_16TDI' },
];

export function VehicleCatalogSelector({
  onSelectVariant,
  onCancel,
}: VehicleCatalogSelectorProps) {
  const [brands, setBrands] = useState<OEMBrandInfo[]>([]);
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>('renault');
  const [models, setModels] = useState<OEMModelInfo[]>([]);
  const [selectedModelSlug, setSelectedModelSlug] = useState<string>('kangoo-ii');
  const [variants, setVariants] = useState<OEMVariantInfo[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<OEMVariantInfo | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [searchResults, setSearchResults] = useState<OEMCatalogItem[]>([]);

  useEffect(() => {
    async function init() {
      const bList = await OEMCatalogClient.getBrands();
      setBrands(bList);
      if (bList.length > 0) {
        const defaultBrand = bList.find((b) => b.slug === 'renault') || bList[0];
        setSelectedBrandSlug(defaultBrand.slug);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadModels() {
      if (!selectedBrandSlug) return;
      const mList = await OEMCatalogClient.getModelsByBrand(selectedBrandSlug);
      setModels(mList);
      if (mList.length > 0) {
        const defaultModel = mList.find((m) => m.slug === selectedModelSlug) || mList[0];
        setSelectedModelSlug(defaultModel.slug);
      } else {
        setSelectedModelSlug('');
        setVariants([]);
        setSelectedVariant(null);
      }
    }
    loadModels();
  }, [selectedBrandSlug]);

  useEffect(() => {
    async function loadVariants() {
      if (!selectedBrandSlug || !selectedModelSlug) return;
      const vList = await OEMCatalogClient.getVariantsByModel(selectedBrandSlug, selectedModelSlug);
      setVariants(vList);
      if (vList.length > 0) {
        const defaultVar = vList.find((v) => v.engineCode === selectedVariant?.engineCode) || vList[0];
        setSelectedVariant(defaultVar);
      } else {
        setSelectedVariant(null);
      }
    }
    loadVariants();
  }, [selectedBrandSlug, selectedModelSlug]);

  useEffect(() => {
    async function handleSearch() {
      if (!searchFilter.trim()) {
        setSearchResults([]);
        return;
      }
      const results = await OEMCatalogClient.searchCatalog(searchFilter);
      setSearchResults(results.slice(0, 5));
    }
    handleSearch();
  }, [searchFilter]);

  const selectDirect = (brandSlug: string, modelSlug: string, engineCode?: string) => {
    setSelectedBrandSlug(brandSlug);
    setSelectedModelSlug(modelSlug);
    OEMCatalogClient.getVariantsByModel(brandSlug, modelSlug).then((vList) => {
      setVariants(vList);
      if (engineCode) {
        const found = vList.find((v) => v.engineCode === engineCode);
        setSelectedVariant(found || vList[0] || null);
      } else if (vList.length > 0) {
        setSelectedVariant(vList[0]);
      }
    });
  };

  const matchingBrandSlugs = new Set(searchResults.map((r) => r.brand.slug));
  const filteredBrands = brands.filter(
    (b) =>
      !searchFilter.trim() ||
      b.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchFilter.toLowerCase()) ||
      matchingBrandSlugs.has(b.slug)
  );

  const handleApply = () => {
    if (!selectedVariant) return;
    const currentBrand = brands.find((b) => b.slug === selectedBrandSlug);
    const currentModel = models.find((m) => m.slug === selectedModelSlug);
    if (!currentBrand || !currentModel) return;

    const isHeavy =
      currentModel.category === 'HEAVY_TRUCK' ||
      currentModel.category === 'CONSTRUCTION' ||
      currentModel.category === 'AGRI_TRACTOR';

    onSelectVariant({
      brandName: currentBrand.name,
      modelName: currentModel.name,
      engineName: selectedVariant.engineName,
      category: currentModel.category,
      tankLiters: selectedVariant.tankLiters,
      ptacKg: selectedVariant.ptacKg,
      oilCapacityLiters: selectedVariant.oilCapacityLiters,
      oilNormSpec: selectedVariant.oilNormSpec,
      consumptionMixedL100km: selectedVariant.consumptionMixedL100km,
      consumptionIdleLHour: selectedVariant.consumptionIdleLHour,
      standardIntervalKm: isHeavy ? 40000 : 15000,
      standardIntervalHours: isHeavy ? 1000 : 350,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-base font-semibold text-slate-100">
            Référentiel Universel Constructeurs (vehiclesdb / gor3a / ddpc)
          </h3>
        </div>
        <Badge variant="info">38 Modèles Populaires Algérie (2000-2026)</Badge>
      </div>

      {/* Raccourcis Flottes Populaires Algérie */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Sélection rapide flotte nationale (1-Clic) :
        </label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_FLEET_PRESETS.map((p) => {
            const isSelected = selectedBrandSlug === p.brandSlug && selectedModelSlug === p.modelSlug;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => selectDirect(p.brandSlug, p.modelSlug, p.engineCode)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-medium border border-emerald-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barre de recherche intelligente (tolère les fautes comme ranult, kangoo, 2012) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-400">
          Recherche intelligente libre (Marque, Modèle, Motorisation, Année)
        </label>
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Ex: Renault Kangoo 1.5 dCi 2012, Shacman X3000, Hilux, Caddy..."
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        {/* Suggestions instantanées en direct */}
        {searchResults.length > 0 && (
          <div className="bg-slate-950 border border-emerald-800/60 rounded-lg p-2 space-y-1 shadow-lg">
            <span className="text-[11px] font-semibold text-emerald-400 block px-1">
              Résultats instantanés du catalogue :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {searchResults.map((res) => (
                <button
                  key={`${res.brand.slug}-${res.model.slug}-${res.variant.engineCode}`}
                  type="button"
                  onClick={() => selectDirect(res.brand.slug, res.model.slug, res.variant.engineCode)}
                  className="text-xs bg-slate-900 hover:bg-emerald-950/80 hover:border-emerald-500 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-md text-left transition-colors"
                >
                  <strong className="text-emerald-400">{res.brand.name}</strong> {res.model.name} —{' '}
                  <span className="text-slate-400">{res.variant.engineName}</span>{' '}
                  {res.model.yearStart && (
                    <span className="text-sky-400">({res.model.yearStart}-{res.model.yearEnd})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sélecteurs en cascade : Marque -> Modèle -> Motorisation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Marque */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            1. Marque
          </label>
          <select
            value={selectedBrandSlug}
            onChange={(e) => setSelectedBrandSlug(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            {filteredBrands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.isCommonDz ? '🇩🇿 ' : ''}
                {b.name} ({b.country})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Modèle */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            2. Modèle
          </label>
          <select
            value={selectedModelSlug}
            onChange={(e) => setSelectedModelSlug(e.target.value)}
            disabled={models.length === 0}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name} {m.yearStart ? `(${m.yearStart}-${m.yearEnd})` : ''} [{m.category}]
              </option>
            ))}
          </select>
        </div>

        {/* 3. Motorisation */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            3. Motorisation & Puissance
          </label>
          <select
            value={selectedVariant?.engineCode || ''}
            onChange={(e) => {
              const found = variants.find((v) => v.engineCode === e.target.value);
              if (found) setSelectedVariant(found);
            }}
            disabled={variants.length === 0}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            {variants.map((v) => (
              <option key={v.engineCode} value={v.engineCode}>
                {v.engineName} ({v.powerHp} ch)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fiche Technique Certifiée Constructeur (DDPC & API Evangelist) */}
      {selectedVariant && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              Spécifications Homologuées Constructeur
            </span>
            <span className="text-xs text-slate-400">
              Pattern WMI : <strong className="text-slate-200">{selectedVariant.wmi || 'N/A'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">PTAC Réglementaire</span>
              <span className="text-sm font-bold text-slate-100">
                {(selectedVariant.ptacKg / 1000).toFixed(1)} tonnes ({selectedVariant.ptacKg} kg)
              </span>
              <span className="text-[10px] text-slate-500 block">
                {selectedVariant.ptacKg > 3500 ? 'Soumis ENACTA 6 mois' : 'Véhicule Léger / VUL'}
              </span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Réservoir Naftal</span>
              <span className="text-sm font-bold text-sky-400">
                {selectedVariant.tankLiters} Litres
              </span>
              <span className="text-[10px] text-slate-500 block">Étalon CUSUM Anti-Fraude</span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Carter Huile Moteur</span>
              <span className="text-sm font-bold text-amber-400">
                {selectedVariant.oilCapacityLiters} Litres
              </span>
              <span className="text-[10px] text-slate-500 block truncate" title={selectedVariant.oilNormSpec}>
                {selectedVariant.oilNormSpec}
              </span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Conso Référence Naftal</span>
              <span className="text-sm font-bold text-emerald-400">
                {selectedVariant.consumptionMixedL100km > 0
                  ? `${selectedVariant.consumptionMixedL100km} L/100km`
                  : `${selectedVariant.consumptionIdleLHour} L/heure`}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Ralenti : {selectedVariant.consumptionIdleLHour} L/h
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={!selectedVariant}
          onClick={handleApply}
        >
          Appliquer les Spécifications au Véhicule
        </Button>
      </div>
    </div>
  );
}
