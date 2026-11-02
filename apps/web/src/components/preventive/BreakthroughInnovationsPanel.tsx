'use client';

import React, { useState } from 'react';
import {
  HydraulicWorkAuditResult,
  ScrAdblueAuditResult,
  KinematicMicroSlipResult,
  BrakeEnergyPartitioningResult,
  CrankingCompressionResult,
} from '@docteurflotte/contracts';

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
              scrTempOutC: 337.9,
              defDosingRateGh: 620.0,
              defTankLevelPct: 80.0,
              defConcentrationPct: 32.5,
              fuelRateLh: 28.0,
              engineRpm: 1500,
              boostPressureKpa: 155.0,
              intakeTempC: 35.0,
              engineDisplacementLiters: 12.8,
              canFrameJitterVarianceMs2: 0.01,
            }
          : {
              exhaustTempInC: 320.0,
              scrTempInC: 320.0,
              scrTempOutC: 304.0, // Chute thermique excessive (eau pure)
              defDosingRateGh: 400.0,
              defTankLevelPct: 60.0,
              defConcentrationPct: 32.5,
              fuelRateLh: 22.0,
              engineRpm: 1400,
              boostPressureKpa: 120.0,
              intakeTempC: 32.0,
              engineDisplacementLiters: 12.8,
            };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-scr-integrity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setSesResult(await res.json());
      } else if (activeTab === 'KMSO') {
        const payload = kmsoScenario === 'NOMINAL'
          ? {
              wheelSpeedLeftKmh: 80.0,
              wheelSpeedRightKmh: 80.05,
              gnssDopplerSpeedKmh: 80.0,
              yawRateDegS: 0.02,
              lateralAccelMs2: 0.01,
              engineTorquePct: 20.0,
            }
          : {
              wheelSpeedLeftKmh: 81.3, // Sur-vitesse de rotation due à l'affaissement du rayon
              wheelSpeedRightKmh: 80.0,
              gnssDopplerSpeedKmh: 80.0,
              yawRateDegS: 0.03,
              lateralAccelMs2: 0.02,
              engineTorquePct: 15.0,
            };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-kinematic-tire`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setKmsoResult(await res.json());
      } else if (activeTab === 'BEP_VCO') {
        const payload = bepScenario === 'BONNE_CONDUITE_VOITH'
          ? {
              vehicleTotalMassKg: 40000,
              vehicleSpeedKmh: 60.0,
              roadGradePercent: -5.5,
              retarderTorquePct: 95.0,
              retarderMaxTorqueNm: 3200,
              brakePedalPositionPct: 0.0,
              durationSeconds: 50,
            }
          : {
              vehicleTotalMassKg: 44000,
              vehicleSpeedKmh: 65.0,
              roadGradePercent: -7.0,
              retarderTorquePct: 10.0, // Chauffeur n'utilise pas le Voith
              retarderMaxTorqueNm: 3200,
              brakePedalPositionPct: 75.0, // Freine au pied en continu
              durationSeconds: 60,
            };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-brake-energy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setBepResult(await res.json());
      } else if (activeTab === 'CSIS') {
        const samples: number[] = [24.5, 24.5, 24.4, 24.5, 24.5];
        for (let c = 0; c < 6; c++) {
          const targetVoltage = csisScenario === 'MOTEUR_NEUF' ? 18.8 : c === 3 ? 22.2 : 18.5;
          for (let s = 0; s < 15; s++) {
            samples.push(targetVoltage);
          }
        }

        const payload = {
          engineDisplacementLiters: 12.8,
          cylinderCount: 6,
          batteryVoltageSamples250Hz: samples,
          coolantTempC: 20.0,
          crankingRpm: 155,
        };

        const res = await fetch(`${API_URL}/api/v1/fleet-intelligence/breakthrough/evaluate-cranking-compression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) setCsisResult(await res.json());
      }
    } catch (err) {
      console.error('Erreur lors du diagnostic physique:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        color: '#0F172A',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* ── EN-TÊTE DU BLOC ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            🔬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Monopole Technologique : 5 Innovations Physiques (0 DA / 0 $)
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                }}
              >
                BREVETABLE • ZÉRO CAPTEUR RAPPORTÉ
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Diagnostic déterministe sur signaux de série natifs (J1939, ISO 11992, ADC 24V 250 Hz, IMU &amp; GNSS).
            </div>
          </div>
        </div>

        {/* Bouton d'action live */}
        <button
          onClick={handleRunDiagnostic}
          disabled={isRunning}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            fontSize: '13px',
            fontWeight: 800,
            borderRadius: '8px',
            backgroundColor: '#047857',
            color: '#FFFFFF',
            border: '1px solid #065F46',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(4, 120, 87, 0.3)',
          }}
        >
          <span>{isRunning ? '⏳ Analyse Physique...' : '⚡ Évaluer l\'Innovation en Direct'}</span>
        </button>
      </div>

      {/* ── SÉLECTEUR D'ONGLETS ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          backgroundColor: '#F8FAFC',
          padding: '6px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
        }}
      >
        {[
          { id: 'HWFA', label: '1. HWFA (Travail Hydraulique BTPH)', icon: '🚜' },
          { id: 'SES_UEB', label: '2. SES-UEB (Détection Émulateur SCR)', icon: '🧪' },
          { id: 'KMSO', label: '3. KMSO (Pneus & Éclatement 0 TPMS)', icon: '🛞' },
          { id: 'BEP_VCO', label: '4. BEP-VCO (Freins vs Voith Retarder)', icon: '🏔️' },
          { id: 'CSIS', label: '5. CSIS (Oscilloscope Compression 24V)', icon: '⚡' },
        ].map((tab) => {
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InnovationKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '8px',
                border: isSel ? '1px solid #047857' : '1px solid #CBD5E1',
                backgroundColor: isSel ? '#047857' : '#FFFFFF',
                color: isSel ? '#FFFFFF' : '#334155',
                cursor: 'pointer',
                boxShadow: isSel ? '0 2px 4px rgba(4, 120, 87, 0.25)' : 'none',
              }}
            >
              <span>{tab.icon}</span>
              <span style={{ color: isSel ? '#FFFFFF' : '#0F172A', fontWeight: 800 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── PANNEAU 1 : HWFA ── */}
      {activeTab === 'HWFA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Scénario d&apos;essai sur Pelle CAT 336D / Komatsu PC390 (Taux : 6 500 DA/h) :
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setHwfaScenario('RALENTI_FORCÉ_FRAUDE')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: hwfaScenario === 'RALENTI_FORCÉ_FRAUDE' ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  background: hwfaScenario === 'RALENTI_FORCÉ_FRAUDE' ? '#FEE2E2' : '#FFFFFF',
                  color: hwfaScenario === 'RALENTI_FORCÉ_FRAUDE' ? '#991B1B' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ⚠️ Fraude : 2h Ralenti Climatisation (Heures Fantômes)
              </button>
              <button
                onClick={() => setHwfaScenario('EXCAVATION_REELLE')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: hwfaScenario === 'EXCAVATION_REELLE' ? '1px solid #047857' : '1px solid #CBD5E1',
                  background: hwfaScenario === 'EXCAVATION_REELLE' ? '#ECFDF5' : '#FFFFFF',
                  color: hwfaScenario === 'EXCAVATION_REELLE' ? '#065F46' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ✓ Nominal : 1h Excavation Rocheuse Lourde
              </button>
            </div>
          </div>

          {hwfaResult ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Classification Travail :</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: hwfaResult.isFraudulentHoursBilled ? '#DC2626' : '#047857', marginTop: '4px' }}>
                  {hwfaResult.workClassification}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  Puissance utile : <strong>{hwfaResult.hydraulicPowerKw} kW</strong> | Rendement : <strong>{(hwfaResult.caloricEfficiencyEta * 100).toFixed(1)}%</strong>
                </div>
              </div>

              <div style={{ background: hwfaResult.isFraudulentHoursBilled ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${hwfaResult.isFraudulentHoursBilled ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: hwfaResult.isFraudulentHoursBilled ? '#991B1B' : '#166534', textTransform: 'uppercase' }}>
                  {hwfaResult.isFraudulentHoursBilled ? 'Surfacturation Arrêtée (DA) :' : 'Facturation Validée :'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: hwfaResult.isFraudulentHoursBilled ? '#DC2626' : '#047857', fontFamily: 'monospace', marginTop: '4px' }}>
                  {hwfaResult.unjustifiedBilledCostDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div style={{ fontSize: '11px', color: hwfaResult.isFraudulentHoursBilled ? '#B91C1C' : '#15803D', marginTop: '4px' }}>
                  {hwfaResult.isFraudulentHoursBilled ? 'Certificat de rejet de facture prêt à émettre' : 'Travail mécanique effectif prouvé'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '13px' }}>
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour lancer le calcul HWFA.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 2 : SES_UEB ── */}
      {activeTab === 'SES_UEB' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Scénario d&apos;essai sur Tracteur Routier Euro 5/6 (Scania DC13 / Actros OM471) :
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSesScenario('EMULATEUR_PIRATE')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: sesScenario === 'EMULATEUR_PIRATE' ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  background: sesScenario === 'EMULATEUR_PIRATE' ? '#FEE2E2' : '#FFFFFF',
                  color: sesScenario === 'EMULATEUR_PIRATE' ? '#991B1B' : '#475569',
                  cursor: 'pointer',
                }}
              >
                🛑 Boîtier Pirate : Émulateur CAN SCR Actif
              </button>
              <button
                onClick={() => setSesScenario('EAU_PURE')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: sesScenario === 'EAU_PURE' ? '1px solid #D97706' : '1px solid #CBD5E1',
                  background: sesScenario === 'EAU_PURE' ? '#FEF3C7' : '#FFFFFF',
                  color: sesScenario === 'EAU_PURE' ? '#92400E' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ⚠️ Fraude : Urée Coupée à l&apos;Eau du Robinet
              </button>
              <button
                onClick={() => setSesScenario('CONFORME')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: sesScenario === 'CONFORME' ? '1px solid #047857' : '1px solid #CBD5E1',
                  background: sesScenario === 'CONFORME' ? '#ECFDF5' : '#FFFFFF',
                  color: sesScenario === 'CONFORME' ? '#065F46' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ✓ Nominal : AdBlue Authentique (32.5%)
              </button>
            </div>
          </div>

          {sesResult ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Statut Dépollution SCR :</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: sesResult.fraudDetected ? '#DC2626' : '#047857', marginTop: '4px' }}>
                  {sesResult.systemIntegrity}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  ΔT mesuré : <strong>{sesResult.measuredTempDropC}°C</strong> vs théorique : <strong>{sesResult.theoreticalTempDropC}°C</strong>
                </div>
              </div>

              <div style={{ background: sesResult.fraudDetected ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${sesResult.fraudDetected ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: sesResult.fraudDetected ? '#991B1B' : '#166534', textTransform: 'uppercase' }}>
                  Risque Préservation Matériel :
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: sesResult.fraudDetected ? '#DC2626' : '#047857', fontFamily: 'monospace', marginTop: '4px' }}>
                  {sesResult.riskDamageCostDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div style={{ fontSize: '11px', color: sesResult.fraudDetected ? '#B91C1C' : '#15803D', marginTop: '4px' }}>
                  {sesResult.tamperingEvidence}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '13px' }}>
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour analyser le bilan d&apos;enthalpie SCR.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 3 : KMSO ── */}
      {activeTab === 'KMSO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Scénario d&apos;essai sur Semi-Remorque 40t (315/80 R22.5 à 85 km/h) :
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setKmsoScenario('SOUS_GONFLE_CRITIQUE')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: kmsoScenario === 'SOUS_GONFLE_CRITIQUE' ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  background: kmsoScenario === 'SOUS_GONFLE_CRITIQUE' ? '#FEE2E2' : '#FFFFFF',
                  color: kmsoScenario === 'SOUS_GONFLE_CRITIQUE' ? '#991B1B' : '#475569',
                  cursor: 'pointer',
                }}
              >
                🛑 Danger Éclatement : Pneu Gauche à -2.0 bar (Sur-vitesse 1.6%)
              </button>
              <button
                onClick={() => setKmsoScenario('NOMINAL')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: kmsoScenario === 'NOMINAL' ? '1px solid #047857' : '1px solid #CBD5E1',
                  background: kmsoScenario === 'NOMINAL' ? '#ECFDF5' : '#FFFFFF',
                  color: kmsoScenario === 'NOMINAL' ? '#065F46' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ✓ Nominal : Pressions Équilibrées (8.5 bar)
              </button>
            </div>
          </div>

          {kmsoResult ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Intégrité Pneumatiques :</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: kmsoResult.burstRiskAlert ? '#DC2626' : '#047857', marginTop: '4px' }}>
                  {kmsoResult.tireIntegrityStatus}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  Δω cinématique : <strong>{kmsoResult.relativeSpeedDeltaPct}%</strong> | Déficit estimé : <strong>-{kmsoResult.estimatedPressureDeficitBar} bar</strong>
                </div>
              </div>

              <div style={{ background: kmsoResult.burstRiskAlert ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${kmsoResult.burstRiskAlert ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: kmsoResult.burstRiskAlert ? '#991B1B' : '#166534', textTransform: 'uppercase' }}>
                  Surconsommation Traînée (pour 1 000 km) :
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: kmsoResult.burstRiskAlert ? '#DC2626' : '#047857', fontFamily: 'monospace', marginTop: '4px' }}>
                  {kmsoResult.excessFuelLossPer1000KmDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div style={{ fontSize: '11px', color: kmsoResult.burstRiskAlert ? '#B91C1C' : '#15803D', marginTop: '4px' }}>
                  {kmsoResult.burstRiskAlert ? 'Alerte immédiate au répartiteur pour arrêt sécurisé' : 'Résistance au roulement minimale'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '13px' }}>
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour observer les rayons dynamiques KMSO.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 4 : BEP_VCO ── */}
      {activeTab === 'BEP_VCO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Scénario Descente des Gorges de la Chiffa (Pente -7%, 44 Tonnes à 65 km/h) :
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setBepScenario('SURCHAUFFE_FREINS_PIED')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: bepScenario === 'SURCHAUFFE_FREINS_PIED' ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  background: bepScenario === 'SURCHAUFFE_FREINS_PIED' ? '#FEE2E2' : '#FFFFFF',
                  color: bepScenario === 'SURCHAUFFE_FREINS_PIED' ? '#991B1B' : '#475569',
                  cursor: 'pointer',
                }}
              >
                🛑 Mauvaise Conduite : Freinage au Pied (Disques à &gt; 400°C)
              </button>
              <button
                onClick={() => setBepScenario('BONNE_CONDUITE_VOITH')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: bepScenario === 'BONNE_CONDUITE_VOITH' ? '1px solid #047857' : '1px solid #CBD5E1',
                  background: bepScenario === 'BONNE_CONDUITE_VOITH' ? '#ECFDF5' : '#FFFFFF',
                  color: bepScenario === 'BONNE_CONDUITE_VOITH' ? '#065F46' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ✓ Exemplaire : 95% Ralentisseur Voith (Disques Froids &lt; 150°C)
              </button>
            </div>
          </div>

          {bepResult ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sécurité &amp; Température Disques :</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: bepResult.fadeRiskAlert ? '#DC2626' : '#047857', marginTop: '4px' }}>
                  {bepResult.drivingSafetyStatus}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  T_disques estimée : <strong>{bepResult.estimatedDiscTempC}°C</strong> | Ratio Voith : <strong>{(bepResult.retarderUsageRatio * 100).toFixed(0)}%</strong>
                </div>
              </div>

              <div style={{ background: bepResult.fadeRiskAlert ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${bepResult.fadeRiskAlert ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: bepResult.fadeRiskAlert ? '#991B1B' : '#166534', textTransform: 'uppercase' }}>
                  Préjudice Usure / Voilage Disques (DA) :
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: bepResult.fadeRiskAlert ? '#DC2626' : '#047857', fontFamily: 'monospace', marginTop: '4px' }}>
                  {bepResult.estimatedFinancialLossPerDescentDzd.toLocaleString('fr-DZ')} DZD
                </div>
                <div style={{ fontSize: '11px', color: bepResult.fadeRiskAlert ? '#B91C1C' : '#15803D', marginTop: '4px' }}>
                  {bepResult.fadeRiskAlert ? 'Risque critique d\'évanouissement (Fade) et fêlure des disques' : 'Disques préservés pour > 120 000 km'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '13px' }}>
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour partitionner l&apos;énergie gravitationnelle BEP-VCO.
            </div>
          )}
        </div>
      )}

      {/* ── PANNEAU 5 : CSIS ── */}
      {activeTab === 'CSIS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
              Scénario Cranking Démarrage 24V à Froid (Échantillonnage ADC à 250 Hz) :
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCsisScenario('CYLINDRE_4_FUITE')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: csisScenario === 'CYLINDRE_4_FUITE' ? '1px solid #DC2626' : '1px solid #CBD5E1',
                  background: csisScenario === 'CYLINDRE_4_FUITE' ? '#FEE2E2' : '#FFFFFF',
                  color: csisScenario === 'CYLINDRE_4_FUITE' ? '#991B1B' : '#475569',
                  cursor: 'pointer',
                }}
              >
                🛑 Défaut : Cylindre #4 Fuite Soupape / Segment (Creux Anormal)
              </button>
              <button
                onClick={() => setCsisScenario('MOTEUR_NEUF')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: csisScenario === 'MOTEUR_NEUF' ? '1px solid #047857' : '1px solid #CBD5E1',
                  background: csisScenario === 'MOTEUR_NEUF' ? '#ECFDF5' : '#FFFFFF',
                  color: csisScenario === 'MOTEUR_NEUF' ? '#065F46' : '#475569',
                  cursor: 'pointer',
                }}
              >
                ✓ Nominal : Moteur Neuf (6 Cylindres Équilibrés à 100%)
              </button>
            </div>
          </div>

          {csisResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Barre des 6 cylindres */}
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Équilibrage de Compression Relative Inter-Cylindres (Oscilloscope Virtuel) :
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', textAlign: 'center' }}>
                  {csisResult.cylinderVoltageDips.map((cyl) => {
                    const isWeak = cyl.cylinderIndex === csisResult.weakestCylinderIndex && csisResult.needsImmediateWorkshop;
                    return (
                      <div
                        key={cyl.cylinderIndex}
                        style={{
                          background: isWeak ? '#FEE2E2' : '#ECFDF5',
                          border: `1px solid ${isWeak ? '#EF4444' : '#10B981'}`,
                          borderRadius: '8px',
                          padding: '10px 4px',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Cyl #{cyl.cylinderIndex}</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: isWeak ? '#DC2626' : '#047857', marginTop: '2px' }}>
                          {cyl.compressionBalancePct}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>ΔV: {cyl.voltageDipV}V</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Diagnostic Santé Moteur :</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: csisResult.needsImmediateWorkshop ? '#DC2626' : '#047857', marginTop: '4px' }}>
                    {csisResult.engineCompressionHealth}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Cylindre incriminé : <strong>#{csisResult.weakestCylinderIndex}</strong> ({csisResult.minCompressionRatioPct}%)
                  </div>
                </div>

                <div style={{ background: csisResult.needsImmediateWorkshop ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${csisResult.needsImmediateWorkshop ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: csisResult.needsImmediateWorkshop ? '#991B1B' : '#166534', textTransform: 'uppercase' }}>
                    Économie Casse Moteur Évitée (DA) :
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: csisResult.needsImmediateWorkshop ? '#DC2626' : '#047857', fontFamily: 'monospace', marginTop: '4px' }}>
                    {csisResult.estimatedAvoidedEngineCostDzd.toLocaleString('fr-DZ')} DZD
                  </div>
                  <div style={{ fontSize: '11px', color: csisResult.needsImmediateWorkshop ? '#B91C1C' : '#15803D', marginTop: '4px' }}>
                    {csisResult.needsImmediateWorkshop ? 'Intervention préventive planifiée avant perçage piston' : 'Compression moteur conforme'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '13px' }}>
              Cliquez sur « Évaluer l&apos;Innovation en Direct » pour lancer l&apos;oscilloscope 250 Hz CSIS.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

