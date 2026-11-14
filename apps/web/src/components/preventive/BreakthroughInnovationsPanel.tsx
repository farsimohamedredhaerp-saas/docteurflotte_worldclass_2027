'use client';

import React, { useState } from 'react';
import {
  HydraulicWorkAuditResult,
  ScrAdblueAuditResult,
  KinematicMicroSlipResult,
  BrakeEnergyPartitioningResult,
  CrankingCompressionResult,
} from '@docteurflotte/contracts';
import {
  IconActivity,
  IconZap,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconAlertOctagon,
  IconFuel,
  IconFileText,
} from '../navigation/TechIcons';

type InnovationKey = 'HWFA' | 'SES_UEB' | 'KMSO' | 'BEP_VCO' | 'CSIS';

export function BreakthroughInnovationsPanel() {
  const [activeTab, setActiveTab] = useState<InnovationKey>('HWFA');
  const [isRunning, setIsRunning] = useState(false);

  // Résultats des diagnostics
  const [hwfaResult, setHwfaResult] = useState<HydraulicWorkAuditResult | null>(null);
  const [sesResult, setSesResult] = useState<ScrAdblueAuditResult | null>(null);
  const [kmsoResult, setKmsoResult] = useState<KinematicMicroSlipResult | null>(null);
  const [bepResult, setBepResult] = useState<BrakeEnergyPartitioningResult | null>(null);
  const [csisResult, setCsisResult] = useState<CrankingCompressionResult | null>(null);

  // Scénarios de test
  const [hwfaScenario, setHwfaScenario] = useState<'EXCAVATION_REELLE' | 'RALENTI_FORCÉ_FRAUDE'>('RALENTI_FORCÉ_FRAUDE');
  const [sesScenario, setSesScenario] = useState<'CONFORME' | 'EMULATEUR_PIRATE' | 'EAU_PURE'>('EMULATEUR_PIRATE');
  const [kmsoScenario, setKmsoScenario] = useState<'NOMINAL' | 'SOUS_GONFLE_CRITIQUE'>('SOUS_GONFLE_CRITIQUE');
  const [bepScenario, setBepScenario] = useState<'BONNE_CONDUITE_VOITH' | 'SURCHAUFFE_FREINS_PIED'>('SURCHAUFFE_FREINS_PIED');
  const [csisScenario, setCsisScenario] = useState<'MOTEUR_NEUF' | 'CYLINDRE_4_FUITE'>('CYLINDRE_4_FUITE');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Exécution du diagnostic selon l'onglet actif
  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    try {
      if (activeTab === 'HWFA') {
        const payload = hwfaScenario === 'EXCAVATION_REELLE'
          ? {
              engineRpm: 1800,
              actualTorquePct: 84.0,
              fuelRateLh: 29.0,
              coolantTempC: 88.0,
              hydraulicTempC: 69.0,
              boostPressureKpa: 165.0,
              groundSpeedKmh: 0.0,
              durationSeconds: 3600,
              nominalMaxTorqueNm: 1650,
              nominalPowerKw: 230,
            }
          : {
              engineRpm: 1200,
              actualTorquePct: 18.0,
              fuelRateLh: 12.0,
              coolantTempC: 83.0,
              hydraulicTempC: 51.0,
              boostPressureKpa: 22.0,
              groundSpeedKmh: 0.0,
              durationSeconds: 7200, // 2h de ralenti forcé
              nominalMaxTorqueNm: 1650,
              nominalPowerKw: 230,
              hourlyRentalRateDzd: 6500,
            };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-hydraulic-work`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setHwfaResult(await res.json());
      } else if (activeTab === 'SES_UEB') {
        const payload = sesScenario === 'CONFORME'
          ? {
              exhaustTempInC: 320.0,
              scrTempInC: 315.0,
              scrTempOutC: 313.9,
              defDosingRateGh: 550.0,
              defTankLevelPct: 75.0,
              defConcentrationPct: 32.5,
              fuelRateLh: 26.0,
              engineRpm: 1450,
              boostPressureKpa: 140.0,
              intakeTempC: 38.0,
              engineDisplacementLiters: 12.8,
            }
          : sesScenario === 'EMULATEUR_PIRATE'
          ? {
              exhaustTempInC: 340.0,
              scrTempInC: 338.0,
              scrTempOutC: 337.8, // Pas de chute endothermique
              defDosingRateGh: 620.0, // Prétend injecter 620 g/h
              defTankLevelPct: 60.0,
              defConcentrationPct: 32.5,
              fuelRateLh: 28.0,
              engineRpm: 1500,
              boostPressureKpa: 155.0,
              intakeTempC: 40.0,
              engineDisplacementLiters: 12.8,
            }
          : {
              // EAU PURE
              exhaustTempInC: 330.0,
              scrTempInC: 325.0,
              scrTempOutC: 321.0, // Chute thermique de vaporisation d'eau sans thermolyse
              defDosingRateGh: 580.0,
              defTankLevelPct: 70.0,
              defConcentrationPct: 0.0, // Eau pure
              fuelRateLh: 27.0,
              engineRpm: 1480,
              boostPressureKpa: 145.0,
              intakeTempC: 39.0,
              engineDisplacementLiters: 12.8,
            };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-scr-adblue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setSesResult(await res.json());
      } else if (activeTab === 'KMSO') {
        const payload = kmsoScenario === 'SOUS_GONFLE_CRITIQUE'
          ? {
              wheelSpeedFrontLeftKmh: 85.0,
              wheelSpeedFrontRightKmh: 85.0,
              wheelSpeedRearLeftKmh: 86.4, // +1.6% de survitesse angulaire (rayon écrasé)
              wheelSpeedRearRightKmh: 85.0,
              yawRateDegS: 0.0, // En ligne droite
              steeringAngleDeg: 0.0,
              lateralAccelG: 0.0,
              tireNominalRadiusMm: 535.0,
              nominalPressureBar: 8.5,
            }
          : {
              wheelSpeedFrontLeftKmh: 85.0,
              wheelSpeedFrontRightKmh: 85.0,
              wheelSpeedRearLeftKmh: 85.1,
              wheelSpeedRearRightKmh: 85.0,
              yawRateDegS: 0.0,
              steeringAngleDeg: 0.0,
              lateralAccelG: 0.0,
              tireNominalRadiusMm: 535.0,
              nominalPressureBar: 8.5,
            };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-kinematic-slip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setKmsoResult(await res.json());
      } else if (activeTab === 'BEP_VCO') {
        const payload = bepScenario === 'SURCHAUFFE_FREINS_PIED'
          ? {
              totalVehicleMassKg: 44000,
              roadSlopePct: -7.0, // Descente Chiffa
              groundSpeedKmh: 65.0,
              brakingDurationSeconds: 180, // 3 minutes en descente continue
              brakePressureBar: 4.5, // Fort appui au pied continu
              retarderTorquePct: 5.0, // Retarder quasiment inactif
              ambientTempC: 38.0,
            }
          : {
              totalVehicleMassKg: 44000,
              roadSlopePct: -7.0,
              groundSpeedKmh: 65.0,
              brakingDurationSeconds: 180,
              brakePressureBar: 0.0, // Pied levé des freins
              retarderTorquePct: 85.0, // 85% d'effort sur Voith
              ambientTempC: 38.0,
            };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-brake-energy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setBepResult(await res.json());
      } else if (activeTab === 'CSIS') {
        // Profils de tension ADC 250 Hz (12 cylindrées échantillonnées)
        const voltageCyl4Fault = [
          23.5, 17.8, 22.9, 17.6, 22.8, 17.7,
          23.2, 21.4, // Creux cylindre #4 très faible (fuite de compression)
          22.9, 17.6, 23.0, 17.7
        ];
        const voltageNominal = [
          23.5, 17.8, 23.0, 17.6, 22.8, 17.7,
          23.1, 17.6, 22.9, 17.5, 23.0, 17.6
        ];

        const payload = {
          crankingVoltageSamples: csisScenario === 'CYLINDRE_4_FUITE' ? voltageCyl4Fault : voltageNominal,
          sampleRateHz: 250,
          numberOfCylinders: 6,
          nominalBatteryVoltage: 24.0,
          batterySohPct: 92.0,
        };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-cranking-compression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setCsisResult(await res.json());
      }
    } catch (err) {
      console.error('Erreur appel API Breakthrough :', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] p-6 shadow-sm flex flex-col gap-5 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── EN-TÊTE DU BLOC ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <IconActivity size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monopole Technologique : 5 Innovations Physiques (0 DA Matériel)
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                XAI DÉTERMINISTE • ZÉRO CAPTEUR RAPPORTÉ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Diagnostic déterministe sur signaux natifs (J1939, ISO 11992, ADC 24V 250 Hz, IMU &amp; GNSS) sans aucun matériel propriétaire.
            </p>
          </div>
        </div>

        {/* Bouton d'action live */}
        <button
          onClick={handleRunDiagnostic}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isRunning ? (
            <>
              <IconActivity size={14} className="inline animate-spin" />
              <span>Analyse Physique en cours...</span>
            </>
          ) : (
            <>
              <IconZap size={14} className="inline" />
              <span>Évaluer l&apos;Innovation en Direct</span>
            </>
          )}
        </button>
      </div>

      {/* ── SÉLECTEUR D'ONGLETS ── */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
        {[
          { id: 'HWFA', label: '1. HWFA (Travail BTPH & Fraude)', Icon: IconActivity },
          { id: 'SES_UEB', label: '2. SES-UEB (Détection Émulateur SCR)', Icon: IconShieldCheck },
          { id: 'KMSO', label: '3. KMSO (Pneus & Éclatement 0 TPMS)', Icon: IconAlertOctagon },
          { id: 'BEP_VCO', label: '4. BEP-VCO (Freins vs Voith Retarder)', Icon: IconZap },
          { id: 'CSIS', label: '5. CSIS (Oscilloscope Compression 24V)', Icon: IconActivity },
        ].map((tab) => {
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InnovationKey)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-all ${
                isSel
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs border border-emerald-500/20 dark:border-emerald-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <tab.Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── PANNEAU 1 : HWFA ── */}
      {activeTab === 'HWFA' && (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scénario d&apos;essai sur Pelle CAT 336D / Komatsu PC390 (Taux : 6 500 DA/h) :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setHwfaScenario('RALENTI_FORCÉ_FRAUDE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  hwfaScenario === 'RALENTI_FORCÉ_FRAUDE'
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconAlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
                  Fraude : 2h Ralenti Climatisation (Heures Fantômes)
                </span>
              </button>
              <button
                onClick={() => setHwfaScenario('EXCAVATION_REELLE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  hwfaScenario === 'EXCAVATION_REELLE'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Nominal : 1h Excavation Rocheuse Lourde
                </span>
              </button>
            </div>
          </div>

          {hwfaResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Classification Travail :
                </div>
                <div className={`text-base font-black mt-1 ${hwfaResult.isFraudulentHoursBilled ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {hwfaResult.workClassification}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Puissance utile : <strong className="font-mono text-slate-700 dark:text-slate-300">{hwfaResult.hydraulicPowerKw} kW</strong> | Rendement : <strong className="font-mono text-slate-700 dark:text-slate-300">{(hwfaResult.caloricEfficiencyEta * 100).toFixed(1)}%</strong>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${hwfaResult.isFraudulentHoursBilled ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'}`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${hwfaResult.isFraudulentHoursBilled ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  {hwfaResult.isFraudulentHoursBilled ? 'Surfacturation Arrêtée (DA) :' : 'Facturation Validée :'}
                </div>
                <div className={`text-xl font-black font-mono mt-1 ${hwfaResult.isFraudulentHoursBilled ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {hwfaResult.unjustifiedBilledCostDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div className={`text-xs mt-1 ${hwfaResult.isFraudulentHoursBilled ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                  {hwfaResult.isFraudulentHoursBilled ? 'Certificat de rejet de facture prêt à émettre' : 'Travail mécanique effectif prouvé'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour lancer le calcul HWFA.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 2 : SES_UEB ── */}
      {activeTab === 'SES_UEB' && (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scénario d&apos;essai sur Tracteur Routier Euro 5/6 (Scania DC13 / Actros OM471) :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSesScenario('EMULATEUR_PIRATE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  sesScenario === 'EMULATEUR_PIRATE'
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconAlertOctagon size={13} className="text-rose-600 dark:text-rose-400" />
                  Boîtier Pirate : Émulateur CAN SCR Actif
                </span>
              </button>
              <button
                onClick={() => setSesScenario('EAU_PURE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  sesScenario === 'EAU_PURE'
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconAlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                  Fraude : Urée Coupée à l&apos;Eau du Robinet
                </span>
              </button>
              <button
                onClick={() => setSesScenario('CONFORME')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  sesScenario === 'CONFORME'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Nominal : AdBlue Authentique (32.5%)
                </span>
              </button>
            </div>
          </div>

          {sesResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Statut Dépollution SCR :
                </div>
                <div className={`text-base font-black mt-1 ${sesResult.fraudDetected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {sesResult.systemIntegrity}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ΔT mesuré : <strong className="font-mono text-slate-700 dark:text-slate-300">{sesResult.measuredTempDropC}°C</strong> vs théorique : <strong className="font-mono text-slate-700 dark:text-slate-300">{sesResult.theoreticalTempDropC}°C</strong>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${sesResult.fraudDetected ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'}`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${sesResult.fraudDetected ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  Risque Préservation Matériel :
                </div>
                <div className={`text-xl font-black font-mono mt-1 ${sesResult.fraudDetected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {sesResult.riskDamageCostDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div className={`text-xs mt-1 ${sesResult.fraudDetected ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                  {sesResult.tamperingEvidence}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour analyser le bilan d&apos;enthalpie SCR.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 3 : KMSO ── */}
      {activeTab === 'KMSO' && (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scénario d&apos;essai sur Semi-Remorque 40T (315/80 R22.5 à 85 km/h) :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setKmsoScenario('SOUS_GONFLE_CRITIQUE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  kmsoScenario === 'SOUS_GONFLE_CRITIQUE'
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconAlertOctagon size={13} className="text-rose-600 dark:text-rose-400" />
                  Danger Éclatement : Pneu Gauche -2.0 bar (Survitesse 1.6%)
                </span>
              </button>
              <button
                onClick={() => setKmsoScenario('NOMINAL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  kmsoScenario === 'NOMINAL'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Nominal : Pressions Équilibrées (8.5 bar)
                </span>
              </button>
            </div>
          </div>

          {kmsoResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Intégrité Pneumatiques :
                </div>
                <div className={`text-base font-black mt-1 ${kmsoResult.burstRiskAlert ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {kmsoResult.tireIntegrityStatus}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Δω cinématique : <strong className="font-mono text-slate-700 dark:text-slate-300">{kmsoResult.relativeSpeedDeltaPct}%</strong> | Déficit estimé : <strong className="font-mono text-slate-700 dark:text-slate-300">-{kmsoResult.estimatedPressureDeficitBar} bar</strong>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${kmsoResult.burstRiskAlert ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'}`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${kmsoResult.burstRiskAlert ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  Surconsommation Traînée (pour 1 000 km) :
                </div>
                <div className={`text-xl font-black font-mono mt-1 ${kmsoResult.burstRiskAlert ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {kmsoResult.excessFuelLossPer1000KmDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div className={`text-xs mt-1 ${kmsoResult.burstRiskAlert ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                  {kmsoResult.burstRiskAlert ? 'Alerte immédiate au répartiteur pour arrêt sécurisé' : 'Résistance au roulement minimale'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour observer les rayons dynamiques KMSO.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 4 : BEP_VCO ── */}
      {activeTab === 'BEP_VCO' && (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scénario Descente des Gorges de la Chiffa (Pente -7%, 44 Tonnes à 65 km/h) :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setBepScenario('SURCHAUFFE_FREINS_PIED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  bepScenario === 'SURCHAUFFE_FREINS_PIED'
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconAlertOctagon size={13} className="text-rose-600 dark:text-rose-400" />
                  Mauvaise Conduite : Freinage au Pied (Disques &gt; 400°C)
                </span>
              </button>
              <button
                onClick={() => setBepScenario('BONNE_CONDUITE_VOITH')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  bepScenario === 'BONNE_CONDUITE_VOITH'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Exemplaire : 95% Ralentisseur Voith (Disques Froids &lt; 150°C)
                </span>
              </button>
            </div>
          </div>

          {bepResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Sécurité &amp; Température Disques :
                </div>
                <div className={`text-base font-black mt-1 ${bepResult.fadeRiskAlert ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {bepResult.drivingSafetyStatus}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  T_disques estimée : <strong className="font-mono text-slate-700 dark:text-slate-300">{bepResult.estimatedDiscTempC}°C</strong> | Ratio Voith : <strong className="font-mono text-slate-700 dark:text-slate-300">{(bepResult.retarderUsageRatio * 100).toFixed(0)}%</strong>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${bepResult.fadeRiskAlert ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'}`}>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${bepResult.fadeRiskAlert ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  Préjudice Usure / Voilage Disques (DA) :
                </div>
                <div className={`text-xl font-black font-mono mt-1 ${bepResult.fadeRiskAlert ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {bepResult.estimatedFinancialLossPerDescentDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div className={`text-xs mt-1 ${bepResult.fadeRiskAlert ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                  {bepResult.fadeRiskAlert ? 'Risque critique d\'évanouissement (Fade) et fêlure des disques' : 'Disques préservés pour > 120 000 km'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour partitionner l&apos;énergie gravitationnelle BEP-VCO.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 5 : CSIS ── */}
      {activeTab === 'CSIS' && (
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scénario Cranking Démarrage 24V à Froid (Échantillonnage ADC à 250 Hz) :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCsisScenario('CYLINDRE_4_FUITE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  csisScenario === 'CYLINDRE_4_FUITE'
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconAlertOctagon size={13} className="text-rose-600 dark:text-rose-400" />
                  Défaut : Cylindre #4 Fuite Soupape / Segment (Creux Anormal)
                </span>
              </button>
              <button
                onClick={() => setCsisScenario('MOTEUR_NEUF')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  csisScenario === 'MOTEUR_NEUF'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <IconCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                  Nominal : Moteur Neuf (6 Cylindres Équilibrés à 100%)
                </span>
              </button>
            </div>
          </div>

          {csisResult ? (
            <div className="flex flex-col gap-3">
              {/* Barre des 6 cylindres */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Équilibrage de Compression Relative Inter-Cylindres (Oscilloscope Virtuel 250 Hz) :
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
                  {csisResult.cylinderVoltageDips.map((cyl) => {
                    const isWeak = cyl.cylinderIndex === csisResult.weakestCylinderIndex && csisResult.needsImmediateWorkshop;
                    return (
                      <div
                        key={cyl.cylinderIndex}
                        className={`rounded-xl border p-3 ${
                          isWeak
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Cyl #{cyl.cylinderIndex}
                        </div>
                        <div className={`text-lg font-black font-mono mt-0.5 ${isWeak ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {cyl.compressionBalancePct}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ΔV: {cyl.voltageDipV}V
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Diagnostic Santé Moteur :
                  </div>
                  <div className={`text-base font-black mt-1 ${csisResult.needsImmediateWorkshop ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {csisResult.engineCompressionHealth}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Cylindre incriminé : <strong className="font-mono text-slate-700 dark:text-slate-300">#{csisResult.weakestCylinderIndex}</strong> ({csisResult.minCompressionRatioPct}%)
                  </div>
                </div>

                <div className={`rounded-xl border p-4 ${csisResult.needsImmediateWorkshop ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'}`}>
                  <div className={`text-[11px] font-bold uppercase tracking-wider ${csisResult.needsImmediateWorkshop ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    Économie Casse Moteur Évitée (DA) :
                  </div>
                  <div className={`text-xl font-black font-mono mt-1 ${csisResult.needsImmediateWorkshop ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {csisResult.estimatedAvoidedEngineCostDzd.toLocaleString('fr-DZ')} DZD
                  </div>
                  <div className={`text-xs mt-1 ${csisResult.needsImmediateWorkshop ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                    {csisResult.needsImmediateWorkshop ? 'Intervention préventive planifiée avant perçage piston' : 'Compression moteur conforme'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour lancer l&apos;oscilloscope 250 Hz CSIS.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
