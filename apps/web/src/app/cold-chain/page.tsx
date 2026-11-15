'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import {
  FleetIntelligenceClient,
  ReeferLiveStatus,
  ReeferCargoType,
  ReeferPowerMode,
} from '../../lib/api-fleet-intelligence';
import {
  IconThermometer,
  IconTruck,
  IconAlertTriangle,
  IconBox,
  IconShieldCheck,
  IconLock,
  IconFileText,
  IconRefreshCw,
  IconZap,
  IconFuel,
} from '../../components/navigation/TechIcons';
import { CalculationProofModal, CalculationProofData } from '../../components/decisions';
import { VehicleSilhouette } from '../../components/ui/VehicleSilhouette';

function buildReeferProofData(reefer: ReeferLiveStatus): CalculationProofData {
  const isAlert = !reefer.isWithinSafeRange;
  return {
    title: `Rapport Thermotrace & Conformité Chaîne du Froid — ${reefer.assetCode}`,
    decisionOrMetricName: `Contrôle Thermique ${reefer.cargoType} (${reefer.currentTempC > 0 ? `+${reefer.currentTempC}` : reefer.currentTempC}°C)`,
    category: 'REGULATORY',
    ruleId: `HACCP-ATP-${reefer.assetCode}`,
    legalOrOemReference: 'Arrêté Interministériel du 21 Safar 1414 / Norme Sanitaire Vétérinaire DSV & ATP',
    deterministicFormula: 'ΔT = |T_mesuré - T_consigne| ≤ Seuil_ATP_HACCP',
    formulaExplanation: `La chaîne du froid pour la cargaison ${reefer.cargoType} impose une plage de consigne stricte (+${reefer.setpointTempC}°C). En cas d'excursion thermique (ΔT > seuil), la cinétique d'échauffement génère un risque financier immédiat de dépréciation (${(reefer.estimatedCargoValueDzd / 1_000_000).toFixed(2)} M DZD).`,
    variables: [
      {
        name: 'Température Relevée Frigo',
        symbol: 'T_mesuré',
        value: `${reefer.currentTempC}°C`,
        source: 'Sonde BLE Haute Fréquence (Calibrée)',
      },
      {
        name: 'Consigne Réglementaire',
        symbol: 'T_consigne',
        value: `+${reefer.setpointTempC}°C`,
        source: 'Barème HACCP / ATP Algérie',
      },
      {
        name: 'Écart de Température',
        symbol: 'ΔT',
        value: `${reefer.tempDeltaC}°C`,
        source: 'Calcul différentiel temps réel',
      },
      {
        name: 'Capteur Porte Caisse',
        symbol: 'Door_Sensor',
        value: reefer.doorOpen ? 'OUVERTE (Déperdition)' : 'Fermée & Étanche',
        source: 'Capteur magnétique IoT Traccar',
      },
      {
        name: 'Mode Alimentation',
        symbol: 'Power_Mode',
        value: reefer.powerMode,
        source: 'Micro-contrôleur Thermo King / Carrier',
      },
      {
        name: 'Valeur Cargaison Assurée',
        symbol: 'Cargo_DZD',
        value: `${reefer.estimatedCargoValueDzd.toLocaleString('fr-DZ')} DZD`,
        source: 'Bordereau de livraison & Déclaration DGI',
      },
    ],
    steps: [
      {
        stepNumber: 1,
        description: 'Vérification de la plage de température admissible',
        formula: 'SafeRange_Min ≤ T_mesuré ≤ SafeRange_Max',
        calculation: `${reefer.currentTempC}°C comparé à la consigne +${reefer.setpointTempC}°C`,
        intermediateResult: isAlert ? 'EXCURSION THERMIQUE DÉTECTÉE' : 'CONFORME À LA PLAGE',
      },
      {
        stepNumber: 2,
        description: 'Évaluation de la cinétique de dépréciation marchande',
        formula: 'Risque_DZD = Cargo_DZD × f(ΔT, Durée_Excursion)',
        calculation: isAlert
          ? `${reefer.estimatedCargoValueDzd.toLocaleString('fr-DZ')} DZD × Excursion ${reefer.excursionDurationMinutes} min`
          : 'Aucune dépréciation (température dans la norme)',
        intermediateResult: isAlert
          ? `${reefer.financialRiskDzd.toLocaleString('fr-DZ')} DZD de risque de perte`
          : '0 DZD de perte financière',
      },
    ],
    finalResult: {
      label: 'Verdict Sanitaire & Réglementaire DSV',
      value: isAlert ? 'RUPTURE DE CHAÎNE DU FROID' : 'LOT CERTIFIÉ CONFORME HACCP',
      conclusion: isAlert
        ? `Alerte active : Excursion de ${reefer.tempDeltaC}°C depuis ${reefer.excursionDurationMinutes} min. Risque financier chiffré à ${reefer.financialRiskDzd.toLocaleString('fr-DZ')} DZD. Intervention immédiate requise.`
        : `Température nominale (+${reefer.setpointTempC}°C). Aucune rupture thermique. Traçabilité conforme pour transport agro-alimentaire et pharmaceutique.`,
    },
  };
}

export default function ColdChainPage() {
  const { isDemoMode, session } = useDemoMode();
  const [reefers, setReefers] = useState<ReeferLiveStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCargo, setFilterCargo] = useState<string>('ALL');
  const [activeProof, setActiveProof] = useState<CalculationProofData | null>(null);

  const loadReefers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FleetIntelligenceClient.getColdChainLive(session.token || undefined, isDemoMode);
      setReefers(data);
    } catch (err) {
      console.error('Erreur télémétrie chaîne du froid:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session.token, isDemoMode]);

  useEffect(() => {
    loadReefers();
    const interval = setInterval(loadReefers, 30000);
    return () => clearInterval(interval);
  }, [loadReefers]);

  const filteredReefers = reefers.filter((r) => {
    if (filterCargo === 'ALL') return true;
    return r.cargoType === filterCargo;
  });

  const totalExcursionRiskDzd = reefers.reduce((acc, r) => acc + (r.financialRiskDzd || 0), 0);
  const activeExcursionsCount = reefers.filter((r) => !r.isWithinSafeRange).length;
  const totalMonitoredCargoDzd = reefers.reduce((acc, r) => acc + (r.estimatedCargoValueDzd || 0), 0);

  const getCargoLabel = (cargo: ReeferCargoType) => {
    switch (cargo) {
      case ReeferCargoType.DAIRY:
        return 'Lait & Produits Laitiers (+2°C / +4.5°C)';
      case ReeferCargoType.FRESH_MEAT:
        return 'Viandes Fraîches (0°C / +2.5°C)';
      case ReeferCargoType.FROZEN:
        return 'Surgelés (-25°C / -18°C)';
      case ReeferCargoType.PHARMA:
        return 'Pharmacie & Vaccins (+2°C / +8°C)';
      case ReeferCargoType.PRODUCE:
        return 'Fruits & Légumes (+6°C / +12°C)';
      default:
        return cargo;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* EN-TÊTE DE SECTION COCKPIT */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                  <IconThermometer size={13} />
                  CHAÎNE DU FROID SOUVERAINE
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                  Thermo King &amp; Carrier Transicold
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Norme ATP &amp; HACCP
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Télémétrie Chaîne du Froid &amp; Groupes Frigo
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
                Surveillance continue des cargaisons sensibles (viande, produits laitiers, insuline, vaccins) sous climat saharien. Détection instantanée d’excursion thermique et chiffrage du risque de dépréciation en Dinars Algériens.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadReefers}
                disabled={isLoading}
                className="gap-2"
              >
                <IconRefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Actualisation...' : 'Actualiser Flux'}</span>
              </Button>
              <Link href="/telematics" className="no-underline">
                <Button variant="primary" size="sm">
                  Cartographie GPS Live →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* MÉTRIQUES CLÉS CONSOLIDÉES (BENTO KPIS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Groupes Connectés</span>
              <IconTruck size={16} />
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {reefers.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Caisses frigorifiques télémétrie active
            </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm space-y-1 ${
            activeExcursionsCount > 0
              ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
              : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                activeExcursionsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
              }`}>
                Excursions Thermiques
              </span>
              <IconAlertTriangle size={16} className={activeExcursionsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'} />
            </div>
            <div className={`text-3xl font-black font-mono mt-1 ${
              activeExcursionsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {activeExcursionsCount}
            </div>
            <div className={`text-xs ${
              activeExcursionsCount > 0 ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {activeExcursionsCount > 0 ? 'Ruptures thermiques en cours !' : '100% dans la plage réglementaire'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Valeur Fret Sous Froid</span>
              <IconBox size={16} />
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {(totalMonitoredCargoDzd / 1_000_000).toFixed(1)} <span className="text-base font-normal text-slate-400">M DA</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Cargaisons sous température dirigée
            </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm space-y-1 ${
            totalExcursionRiskDzd > 0
              ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
              : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                totalExcursionRiskDzd > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
              }`}>
                Risque Financier Actuel
              </span>
              <IconShieldCheck size={16} className={totalExcursionRiskDzd > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
            </div>
            <div className={`text-3xl font-black font-mono mt-1 ${
              totalExcursionRiskDzd > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {totalExcursionRiskDzd.toLocaleString('fr-DZ')} <span className="text-base font-normal text-slate-400">DA</span>
            </div>
            <div className={`text-xs ${
              totalExcursionRiskDzd > 0 ? 'text-amber-600/80 dark:text-amber-400/80' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {totalExcursionRiskDzd > 0 ? 'Dépréciation financière en cours' : 'Zéro perte constatée'}
            </div>
          </div>
        </div>

        {/* BARRE DE FILTRES ET CONTRÔLES */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Filtrer par Denrée :
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'Toutes' },
                { id: ReeferCargoType.DAIRY, label: 'Lait & Laitiers' },
                { id: ReeferCargoType.FRESH_MEAT, label: 'Viandes Fraîches' },
                { id: ReeferCargoType.PHARMA, label: 'Pharmacie' },
                { id: ReeferCargoType.FROZEN, label: 'Surgelés' },
              ].map((c) => {
                const isSel = filterCargo === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setFilterCargo(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                      isSel
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent font-medium'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <IconShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>Protocole certifié HACCP &amp; Direction des Services Vétérinaires (DSV)</span>
          </div>
        </div>

        {/* GRILLE DES GROUPES FRIGORIFIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReefers.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] shadow-sm">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
                <IconThermometer size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {reefers.length === 0
                  ? 'Aucun groupe frigorifique surveillé'
                  : 'Aucun groupe ne correspond à cette denrée'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                {reefers.length === 0
                  ? 'Votre parc ne comporte aucun groupe frigorifique actif. Pour tester la surveillance ATP et HACCP, basculez en mode démo ou déclarez un groupe frigorifique dans vos actifs.'
                  : 'Modifiez le filtre de cargaison sélectionné.'}
              </p>
              {reefers.length === 0 && (
                <Link href="/assets" className="inline-block no-underline">
                  <Button variant="primary" size="sm">
                    + Déclarer un Actif Frigorifique
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredReefers.map((reefer) => {
              const isAlert = !reefer.isWithinSafeRange;

              return (
                <div
                  key={reefer.assetId}
                  className={`rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                    isAlert
                      ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/20 dark:bg-rose-950/10'
                      : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-[var(--df-text-secondary)] opacity-85 shrink-0">
                        <VehicleSilhouette
                          category={reefer.assetName.toLowerCase().includes('master') ? 'LIGHT_COMMERCIAL' : 'HEAVY_TRUCK'}
                          size="sm"
                        />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {reefer.assetCode}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                          {reefer.assetName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {getCargoLabel(reefer.cargoType)}
                        </p>
                      </div>
                    </div>

                    <Badge variant={isAlert ? 'danger' : 'ok'} pulse>
                      {isAlert ? 'ALERTE RUPTURE' : 'TEMP CONFORME'}
                    </Badge>
                  </div>

                  {/* CADRAN DIGITAL DE TEMPÉRATURE TÉLÉMÉTRIQUE */}
                  <div className={`rounded-xl border p-5 text-center space-y-1 ${
                    isAlert
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30'
                      : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Température de Reprise Frigo
                    </span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-4xl font-black font-mono tracking-tight ${
                        isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {reefer.currentTempC > 0 ? `+${reefer.currentTempC}` : reefer.currentTempC}
                      </span>
                      <span className="text-base font-bold text-slate-400">°C</span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      Consigne :{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-300">
                        +{reefer.setpointTempC}°C
                      </strong>{' '}
                      (Écart : <span className="font-mono">{reefer.tempDeltaC}°C</span>)
                    </div>
                  </div>

                  {/* DÉTAILS TECHNIQUES & CAPTEURS IOT */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Capteur Porte Caisse :</span>
                      <span className={`font-semibold inline-flex items-center gap-1.5 ${
                        reefer.doorOpen ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {reefer.doorOpen ? (
                          <>
                            <IconAlertTriangle size={12} />
                            <span>Ouverte (Déperdition)</span>
                          </>
                        ) : (
                          <>
                            <IconLock size={12} />
                            <span>Fermée &amp; Étanche</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Alimentation Groupe :</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5">
                        {reefer.powerMode === ReeferPowerMode.DIESEL ? (
                          <>
                            <IconFuel size={12} className="text-amber-500" />
                            <span>Moteur Diesel Autonome</span>
                          </>
                        ) : reefer.powerMode === ReeferPowerMode.ELECTRIC_STANDBY ? (
                          <>
                            <IconZap size={12} className="text-blue-500" />
                            <span>Prise Secteur 380V (Dépôt)</span>
                          </>
                        ) : (
                          <span>Arrêt</span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Valeur Cargaison :</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {(reefer.estimatedCargoValueDzd / 1_000_000).toFixed(2)} M DA
                      </span>
                    </div>

                    {isAlert && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <IconAlertTriangle size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>Risque financier direct de dépréciation</span>
                        </div>
                        <div className="text-[11px] text-rose-600/90 dark:text-rose-400/90">
                          Excursion depuis : <strong className="font-mono">{reefer.excursionDurationMinutes} minutes</strong>
                        </div>
                        <div className="text-[11px] text-rose-600/90 dark:text-rose-400/90">
                          Pertes estimées :{' '}
                          <strong className="font-mono text-xs">
                            {reefer.financialRiskDzd.toLocaleString('fr-DZ')} DA
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIED DE CARTE & ACTIONS */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-slate-400">
                      Relevé : {new Date(reefer.lastUpdate).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveProof(buildReeferProofData(reefer))}
                      className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <IconFileText size={13} />
                      <span>Preuve Thermotrace (HACCP / DSV)</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODALE DE PREUVE DÉCISIONNELLE THERMOTRACE */}
        <CalculationProofModal
          isOpen={!!activeProof}
          onClose={() => setActiveProof(null)}
          data={activeProof}
        />
      </main>
    </div>
  );
}
