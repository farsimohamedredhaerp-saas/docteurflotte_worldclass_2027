'use client';

import React from 'react';
import {
  ALGERIA_FISCAL_RATES,
  ALGERIA_TRANSBORDER_FUEL_TAX_DZD,
  ENACTA_OFFICIAL_FEES_DZD,
  ENACTA_INTERNAL_TCO_PROVISIONS_DZD,
} from '@docteurflotte/contracts';

export function FiscalRatesGrid() {
  return (
    <div className="space-y-6">
      {/* BLOC 1 : TVA & DROIT DE TIMBRE FISCAL */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Barème Fiscal DGI Algérie (Loi de Finances en vigueur)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Code des Taxes sur le Chiffre d&apos;Affaires &amp; Code du Timbre (Art. 252).
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            Réf: {ALGERIA_FISCAL_RATES.legalReference}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              TVA Taux Normal
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {(ALGERIA_FISCAL_RATES.STANDARD_VAT_RATE * 100).toFixed(0)} %
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Transport, pièces atelier &amp; télématique
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              TVA Taux Réduit
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {(ALGERIA_FISCAL_RATES.REDUCED_VAT_RATE * 100).toFixed(0)} %
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Transport frigorifique agricole &amp; intrants
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Droit de Timbre Espèces
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {(ALGERIA_FISCAL_RATES.CASH_STAMP_DUTY_RATE * 100).toFixed(0)} %
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Min: {ALGERIA_FISCAL_RATES.CASH_STAMP_DUTY_MIN_DZD} DA • Max:{' '}
              {ALGERIA_FISCAL_RATES.CASH_STAMP_DUTY_MAX_DZD} DA
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Plafond Amortissement VL
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {(ALGERIA_FISCAL_RATES.PASSENGER_VEHICLE_AMORTIZATION_CEILING_DZD / 1_000_000).toFixed(
                1,
              )}{' '}
              M DA
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Art. 141 CIDTA (3 000 000 DZD)
            </div>
          </div>
        </div>
      </div>

      {/* BLOC 2 : TAXE CARBURANT TRANSFRONTALIÈRE (LF 2020 ART. 81) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Taxe Carburant Transfrontalière (Sortie des Frontières Terrestres)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.legalReference}
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Douanes Algériennes (DGD)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Véhicules de Tourisme (VP)
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.PASSENGER_CAR.toLocaleString('fr-DZ')} DZD
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Par passage frontalier terrestre</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Utilitaires VUL &amp; Camions &lt; 10T
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.LCV_AND_TRUCKS_UNDER_10T.toLocaleString('fr-DZ')} DZD
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Fret commercial régional</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Poids Lourds ≥ 10T &amp; Autocars
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {ALGERIA_TRANSBORDER_FUEL_TAX_DZD.HEAVY_TRUCKS_10T_PLUS_AND_BUS.toLocaleString('fr-DZ')}{' '}
              DZD
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Semi-remorques &amp; convois</div>
          </div>
        </div>
      </div>

      {/* BLOC 3 : GRILLE TARIFAIRE OFFICIELLE ENACTA */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tarifs Réglementaires Officiels du Contrôle Technique (Arrêté du 6 mai 2004)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tarifs légaux constatés auprès des centres agréés ENACTA vs Provisions TCO
              DocteurFlotte.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Ministère des Transports
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Voiture Particulière (VP)
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {ENACTA_OFFICIAL_FEES_DZD.LIGHT_PASSENGER_TTC.toFixed(0)} DZD
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.LIGHT_PASSENGER} DZD
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Utilitaire Léger (VUL)
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {ENACTA_OFFICIAL_FEES_DZD.COMMERCIAL_VAN_VUL_TTC.toFixed(0)} DZD
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.COMMERCIAL_VAN_VUL} DZD
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Poids Lourd Porteur (&gt; 3.5T)
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {ENACTA_OFFICIAL_FEES_DZD.HEAVY_TRUCK_RIGID_TTC.toFixed(0)} DZD
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.HEAVY_TRUCK_RIGID} DZD
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tracteur &amp; Semi-Remorque
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {ENACTA_OFFICIAL_FEES_DZD.TRACTOR_TRAILER_TTC.toFixed(0)} DZD
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Provision TCO: {ENACTA_INTERNAL_TCO_PROVISIONS_DZD.TRACTOR_TRAILER} DZD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

