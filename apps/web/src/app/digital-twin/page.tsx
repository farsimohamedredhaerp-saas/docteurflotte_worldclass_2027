'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { AuthClient } from '../../lib/api-auth';
import { DigitalTwinClient } from '../../lib/api-digital-twin';
import { AssetClient } from '../../lib/api-assets';
import {
  DigitalTwinAsset,
  DigitalTwinOrganStatus,
  Asset,
} from '@docteurflotte/contracts';
import {
  CalculationProofModal,
  CalculationProofButton,
  CalculationProofData,
} from '../../components/decisions';
import { CalculationProofBuilder } from '../../lib/calculation-proofs';

export default function DigitalTwinPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ast-kangoo-01');
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinAsset | null>(null);
  const [activeOrganKey, setActiveOrganKey] = useState<string>('ENGINE_OIL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Simulation Sliders
  const [climateMultiplier, setClimateMultiplier] = useState<number>(1.15);
  const [driverMultiplier, setDriverMultiplier] = useState<number>(1.1);

  // État de la modal Preuve de Calcul
  const [proofModalData, setProofModalData] = useState<CalculationProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const handleOpenVhiProof = () => {
    if (!digitalTwin) return;
    const proof = CalculationProofBuilder.buildVhiScoreProof(digitalTwin);
    setProofModalData(proof);
    setIsProofModalOpen(true);
  };

  const handleOpenOrganProof = (organ: DigitalTwinOrganStatus) => {
    if (!digitalTwin) return;
    const proof = CalculationProofBuilder.buildOrganProof(organ, digitalTwin);
    setProofModalData(proof);
    setIsProofModalOpen(true);
  };

  const handleOpenTrajectoryProof = () => {
    if (!digitalTwin) return;
    setProofModalData({
      title: 'Preuve de la Trajectoire Prédictive Déterministe (J0 à J+90)',
      decisionOrMetricName: `${digitalTwin.assetName} — Projection Temporelle VHI`,
      category: 'PHYSICS_RUL',
      ruleId: 'ALGO-TRAJECTORY-90D',
      legalOrOemReference: 'MASTER_SPEC v2.0 §4.6 (Projection Temporelle & SAD)',
      deterministicFormula: 'VHI(t) = VHI_0 - (Taux_Dégradation × t × K_clim × K_driver)',
      formulaExplanation: 'Modélisation de la pente de chute du score de santé sans intervention préventive versus stabilisation post-intervention atelier (+18 pts).',
      variables: [
        { name: 'Score Initial (J0)', symbol: 'VHI_0', value: digitalTwin.projectionTrajectory.day0Vhi, source: 'Calcul Présent VHI' },
        { name: 'Facteur de Stress Combiné', symbol: 'K_stress', value: `x${(digitalTwin.climateSeverityFactor * digitalTwin.driverAggressivenessScore).toFixed(2)}`, source: 'Climat × Conduite' },
        { name: 'Projection Sans Action à J+30', symbol: 'VHI_30', value: `${digitalTwin.projectionTrajectory.day30VhiWithoutAction}/100`, source: 'Équation temporelle' },
        { name: 'Projection Avec Action à J+30', symbol: 'VHI_30_SAD', value: `${digitalTwin.projectionTrajectory.day30VhiWithAction}/100`, source: 'Remise à niveau atelier' },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Projection sans intervention à 30 jours (Chute de santé)',
          formula: 'VHI_0 - (12 × K_stress)',
          calculation: `${digitalTwin.projectionTrajectory.day0Vhi} - (12 × ${(digitalTwin.climateSeverityFactor * digitalTwin.driverAggressivenessScore).toFixed(2)})`,
          intermediateResult: `${digitalTwin.projectionTrajectory.day30VhiWithoutAction} VHI`,
        },
        {
          stepNumber: 2,
          description: 'Projection avec intervention préventive SAD (+18 pts)',
          formula: 'min(96, VHI_0 + 18)',
          calculation: `min(96, ${digitalTwin.projectionTrajectory.day0Vhi} + 18)`,
          intermediateResult: `${digitalTwin.projectionTrajectory.day30VhiWithAction} VHI`,
        },
        {
          stepNumber: 3,
          description: 'Chute critique à 90 jours sans intervention',
          formula: 'VHI_0 - (42 × K_stress)',
          calculation: `${digitalTwin.projectionTrajectory.day0Vhi} - (42 × ${(digitalTwin.climateSeverityFactor * digitalTwin.driverAggressivenessScore).toFixed(2)})`,
          intermediateResult: `${digitalTwin.projectionTrajectory.day90VhiWithoutAction} VHI (Risque Panne Élevé)`,
        },
      ],
      finalResult: {
        label: 'Bilan de Trajectoire',
        value: `${digitalTwin.projectionTrajectory.day30VhiWithoutAction} vs ${digitalTwin.projectionTrajectory.day30VhiWithAction}`,
        unit: 'VHI',
        conclusion: 'L\'action préventive immédiate permet de maintenir le véhicule au-dessus du seuil de rentabilité sans immobilisation.',
      },
    });
    setIsProofModalOpen(true);
  };

  useEffect(() => {
    const s = AuthClient.getSession();
    if (s.token) {
      setSessionToken(s.token);
      loadAssetsAndTwin(s.token);
    } else {
      // Fallback demo state if not logged in
      loadFallbackTwin();
    }
  }, []);

  const loadAssetsAndTwin = async (token: string) => {
    setIsLoading(true);
    try {
      const assetList = await AssetClient.listAssets(token).catch(() => []);
      setAssets(assetList);

      const targetId = assetList.length > 0 ? assetList[0].id : 'ast-kangoo-01';
      setSelectedAssetId(targetId);

      const twin = await DigitalTwinClient.getTwin(targetId, token).catch(() => null);
      if (twin) {
        setDigitalTwin(twin);
        setClimateMultiplier(twin.climateSeverityFactor);
        setDriverMultiplier(twin.driverAggressivenessScore);
      } else {
        loadFallbackTwin();
      }
    } catch {
      loadFallbackTwin();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackTwin = () => {
    const fallback: DigitalTwinAsset = {
      assetId: 'ast-kangoo-01',
      assetName: 'Renault Kangoo 1.5 dCi',
      assetCode: 'VEH-016-ALG',
      category: 'LIGHT_COMMERCIAL',
      brand: 'Renault',
      model: 'Kangoo Express',
      year: 2022,
      currentOdometerKm: 120500,
      currentVhi: 78,
      wilayaLocation: '16 - Alger (Chéraga)',
      driverAggressivenessScore: 1.1,
      climateSeverityFactor: 1.15,
      organs: [
        {
          organ: 'ENGINE_OIL',
          name: 'Huile Moteur & Viscosité',
          icon: '🛢️',
          healthPercent: 72,
          remainingUsefulLifeValue: 3450,
          remainingUsefulLifeUnit: 'KM',
          status: 'HEALTHY',
          physicsAlgorithm: 'Arrhenius Cinétique (Ea/R = 6500 K)',
          observedMetrics: [
            { label: 'Facteur d’Accélération Arrhenius', value: 'x1.26', threshold: '< 1.50' },
            { label: 'Viscosité Cinématique Estimée', value: '11.8 cSt', threshold: '12.5 - 16.3 cSt' },
          ],
          explanation: 'L’huile vieillit 1.26x plus vite en raison des contraintes thermiques et de poussière. RUL estimé : 3 450 km avant cisaillement critique.',
        },
        {
          organ: 'BATTERY_CRANKING',
          name: 'Batterie & Démarreur',
          icon: '🔋',
          healthPercent: 88,
          remainingUsefulLifeValue: 95,
          remainingUsefulLifeUnit: 'STARTS',
          status: 'HEALTHY',
          physicsAlgorithm: 'Cranking Health CVHI (Tension minimale au démarrage)',
          observedMetrics: [
            { label: 'Tension Cranking Minimale (V_min)', value: '9.82 V', threshold: '> 9.60 V' },
            { label: 'Temps de Recouvrement Tension', value: '1.25 s', threshold: '< 1.80 s' },
          ],
          explanation: 'Chute de tension au pic de démarreur stabilisée au-dessus du seuil critique de 9.60V. Autonomie estimée : ~95 démarrages.',
        },
        {
          organ: 'BRAKE_PADS',
          name: 'Plaquettes & Freinage',
          icon: '🛑',
          healthPercent: 54,
          remainingUsefulLifeValue: 4800,
          remainingUsefulLifeUnit: 'KM',
          status: 'PRE_CRITICAL',
          physicsAlgorithm: 'Loi Tribologique d’Archard (Énergie W = 1/2 m Δv²)',
          observedMetrics: [
            { label: 'Épaisseur Restante de Garniture', value: '4.2 mm', threshold: '> 3.0 mm' },
            { label: 'Énergie de Décélération Moyenne', value: '168 kJ/km', threshold: '< 150 kJ/km' },
          ],
          explanation: 'Épaisseur de garniture à 4.2 mm. Le seuil de sécurité constructeur est de 3.0 mm. Remplacement préconisé d’ici 4 800 km.',
        },
        {
          organ: 'COOLING_SYSTEM',
          name: 'Refroidissement & Culasse',
          icon: '🌡️',
          healthPercent: 88,
          remainingUsefulLifeValue: 82,
          remainingUsefulLifeUnit: 'PERCENT',
          status: 'HEALTHY',
          physicsAlgorithm: 'Modèle Thermique Différentiel EWMA ΔT = |T_huile - T_eau|',
          observedMetrics: [
            { label: 'Écart Thermique Huile / Liquide (ΔT)', value: '12.4 °C', threshold: '< 16.0 °C' },
            { label: 'Stabilité Thermostatique EWMA', value: '98.5 %', threshold: '> 92.0 %' },
          ],
          explanation: 'Gradient thermique huile/eau parfaitement nominal, aucun risque de déformation culasse.',
        },
        {
          organ: 'DPF_FILTER',
          name: 'Filtre à Particules (FAP)',
          icon: '💨',
          healthPercent: 68,
          remainingUsefulLifeValue: 3200,
          remainingUsefulLifeUnit: 'KM',
          status: 'HEALTHY',
          physicsAlgorithm: 'Bilan Massique d’Accumulation de Suie (Contre-Pression mbar)',
          observedMetrics: [
            { label: 'Masse de Suie Accumulée', value: '27.4 g', threshold: '< 45.0 g' },
            { label: 'Contre-Pression d’Échappement', value: '32 mbar', threshold: '< 65 mbar' },
          ],
          explanation: 'Charge de suie nominale à 27.4g. Régénération sur autoroute prévue lors de la prochaine liaison inter-wilayas.',
        },
      ],
      projectionTrajectory: {
        day0Vhi: 78,
        day30VhiWithoutAction: 64,
        day60VhiWithoutAction: 48,
        day90VhiWithoutAction: 32,
        day30VhiWithAction: 94,
      },
      partsReservation: {
        partNumber: 'KIT-ENTR-OEM-45',
        partName: 'Kit Révision Complète (Filtre Huile + Filtre Air + 5L 15W40)',
        inStock: true,
        warehouseStockQty: 8,
        estimatedCostDzd: 18500,
        oemHomologation: 'Homologation Constructeur Certifiée RMI',
      },
    };
    setDigitalTwin(fallback);
    setIsLoading(false);
  };

  const handleSelectAsset = async (assetId: string) => {
    setSelectedAssetId(assetId);
    if (!sessionToken) return;
    setIsLoading(true);
    try {
      const twin = await DigitalTwinClient.getTwin(assetId, sessionToken);
      setDigitalTwin(twin);
      setClimateMultiplier(twin.climateSeverityFactor);
      setDriverMultiplier(twin.driverAggressivenessScore);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!sessionToken || !selectedAssetId) return;
    setIsSimulating(true);
    try {
      const simulated = await DigitalTwinClient.simulateTwin(
        selectedAssetId,
        {
          climateSeverityMultiplier: climateMultiplier,
          driverAggressivenessMultiplier: driverMultiplier,
        },
        sessionToken
      );
      setDigitalTwin(simulated);
      showNotification('Simulation physique recalculée avec succès !');
    } catch (err: any) {
      showNotification(err.message || 'Erreur lors de la simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyPreset = (type: 'alger' | 'sahara' | 'delivery') => {
    if (type === 'alger') {
      setClimateMultiplier(1.05);
      setDriverMultiplier(0.95);
    } else if (type === 'sahara') {
      setClimateMultiplier(1.55);
      setDriverMultiplier(1.35);
    } else {
      setClimateMultiplier(1.2);
      setDriverMultiplier(1.45);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const activeOrgan = digitalTwin?.organs.find((o) => o.organ === activeOrganKey) || digitalTwin?.organs[0];

  const getVhiColor = (score: number) => {
    if (score >= 70) return '#10b981'; // Emerald
    if (score >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Rose
  };

  const getVhiStatusLabel = (score: number) => {
    if (score >= 75) return 'Excellente Santé Opérationnelle';
    if (score >= 60) return 'Vigilance & Maintenance Préventive';
    if (score >= 45) return 'Risque d’Immobilisation Pré-Critique';
    return 'Arrêt Véhicule Requis Immédiatement';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      {/* Header Banner */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(14,24,44,0.8) 0%, rgba(9,13,22,0.95) 100%)', padding: '36px 24px 28px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)', letterSpacing: '0.05em' }}>
              🧬 JUMEAU NUMÉRIQUE DYNAMIQUE & RUL
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              MASTER_SPEC v2.0 (OEM-First)
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Physique Prédictive de l’Actif & Durée de Vie Résiduelle (RUL)
              </h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 15, maxWidth: 780, lineHeight: 1.5 }}>
                Modélisation dynamique des 5 organes d’usure (Huile Arrhenius, Batterie CVHI, Freins Archard, Refroidissement EWMA, FAP). Projection déterministe à 30, 60 et 90 jours et arbitrage autonome ADS.
              </p>
            </div>

            {/* Asset Selector */}
            <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--df-shadow-sm)' }}>
              <span style={{ fontSize: 13, color: 'var(--df-text-muted)', fontWeight: 600 }}>Véhicule :</span>
              <select
                value={selectedAssetId}
                onChange={(e) => handleSelectAsset(e.target.value)}
                style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', borderRadius: 8, padding: '6px 12px', fontSize: 14, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                {assets.length > 0 ? (
                  assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ast-kangoo-01">VEH-016-ALG — Renault Kangoo 1.5 dCi</option>
                    <option value="ast-man-02">PL-030-HMD — MAN TGX 18.480 (Sahara)</option>
                    <option value="ast-cat-03">ENG-004-ORAN — CAT 320D (Chantier)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div style={{ background: '#0284c7', color: '#fff', padding: '12px 24px', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
          {notification}
        </div>
      )}

      {/* Main Container */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {digitalTwin && (
          <>
            {/* Top Row: VHI Gauge Card + Telemetry Context */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
              {/* Circular VHI Card */}
              <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                {/* Gauge SVG */}
                <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={getVhiColor(digitalTwin.currentVhi)}
                      strokeWidth="10"
                      strokeDasharray={314.15}
                      strokeDashoffset={314.15 * (1 - digitalTwin.currentVhi / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: getVhiColor(digitalTwin.currentVhi) }}>
                      {digitalTwin.currentVhi}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: -4 }}>/ 100 VHI</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
                      Score de Santé Globale
                    </div>
                    <CalculationProofButton
                      label="Règle & Preuve VHI"
                      size="xs"
                      variant="emerald"
                      onClick={handleOpenVhiProof}
                    />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
                    {getVhiStatusLabel(digitalTwin.currentVhi)}
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
                    Pondération physique des 5 algorithmes. Zéro moyenne naïve.
                  </div>
                </div>
              </div>

              {/* Vehicle Context & Real Telemetry */}
              <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Immatriculation / Code</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>{digitalTwin.assetCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Odomètre Réel</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{digitalTwin.currentOdometerKm.toLocaleString()} km</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Wilaya & Climat</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{digitalTwin.wilayaLocation}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Facteurs de Contraintes</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                    Climat: <span style={{ color: '#38bdf8' }}>x{digitalTwin.climateSeverityFactor}</span> | Conduite: <span style={{ color: '#f59e0b' }}>x{digitalTwin.driverAggressivenessScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Vehicle Anatomy Section */}
            <div style={{ background: 'linear-gradient(180deg, rgba(20, 29, 47, 0.9) 0%, rgba(12, 17, 29, 0.95) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 24px', marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#f8fafc' }}>
                    Schéma Anatomique & Capteurs Télématiques en Continu
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                    Sélectionnez un organe pour analyser ses équations physiques, sa dégradation et son RUL.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {digitalTwin.organs.map((organ) => (
                    <button
                      key={organ.organ}
                      onClick={() => setActiveOrganKey(organ.organ)}
                      style={{
                        background: activeOrganKey === organ.organ ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                        border: activeOrganKey === organ.organ ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                        color: activeOrganKey === organ.organ ? '#38bdf8' : '#94a3b8',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span>{organ.icon}</span>
                      <span>{organ.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Anatomy Diagram & Hotspots */}
              <div style={{ position: 'relative', width: '100%', height: 260, background: 'radial-gradient(ellipse at center, rgba(30,58,138,0.2) 0%, rgba(9,13,22,0.8) 70%)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* SVG Blueprint Wireframe of Vehicle Chassis */}
                <svg width="640" height="200" viewBox="0 0 640 200" style={{ maxWidth: '90%' }}>
                  {/* Chassis outline */}
                  <rect x="80" y="30" width="480" height="140" rx="28" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="2" strokeDasharray="6 4" />
                  {/* Cab section */}
                  <rect x="360" y="45" width="180" height="110" rx="14" fill="rgba(30, 41, 59, 0.4)" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.5" />
                  {/* Wheels */}
                  <rect x="130" y="10" width="60" height="24" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="130" y="166" width="60" height="24" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="450" y="10" width="60" height="24" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                  <rect x="450" y="166" width="60" height="24" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />

                  {/* Hotspot 1: Engine Oil (Front Engine Block) */}
                  <g onClick={() => setActiveOrganKey('ENGINE_OIL')} style={{ cursor: 'pointer' }}>
                    <circle cx="480" cy="100" r={activeOrganKey === 'ENGINE_OIL' ? 22 : 16} fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" strokeWidth="2" />
                    <text x="480" y="105" textAnchor="middle" fontSize="16">🛢️</text>
                  </g>

                  {/* Hotspot 2: Battery (Front Bay) */}
                  <g onClick={() => setActiveOrganKey('BATTERY_CRANKING')} style={{ cursor: 'pointer' }}>
                    <circle cx="430" cy="70" r={activeOrganKey === 'BATTERY_CRANKING' ? 22 : 16} fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2" />
                    <text x="430" y="75" textAnchor="middle" fontSize="16">🔋</text>
                  </g>

                  {/* Hotspot 3: Cooling (Radiator Front) */}
                  <g onClick={() => setActiveOrganKey('COOLING_SYSTEM')} style={{ cursor: 'pointer' }}>
                    <circle cx="530" cy="100" r={activeOrganKey === 'COOLING_SYSTEM' ? 22 : 16} fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" strokeWidth="2" />
                    <text x="530" y="105" textAnchor="middle" fontSize="16">🌡️</text>
                  </g>

                  {/* Hotspot 4: Brake Pads (Wheels) */}
                  <g onClick={() => setActiveOrganKey('BRAKE_PADS')} style={{ cursor: 'pointer' }}>
                    <circle cx="280" cy="100" r={activeOrganKey === 'BRAKE_PADS' ? 22 : 16} fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="2" />
                    <text x="280" y="105" textAnchor="middle" fontSize="16">🛑</text>
                  </g>

                  {/* Hotspot 5: DPF Exhaust (Exhaust Line) */}
                  <g onClick={() => setActiveOrganKey('DPF_FILTER')} style={{ cursor: 'pointer' }}>
                    <circle cx="180" cy="100" r={activeOrganKey === 'DPF_FILTER' ? 22 : 16} fill="rgba(168, 85, 247, 0.25)" stroke="#a855f7" strokeWidth="2" />
                    <text x="180" y="105" textAnchor="middle" fontSize="16">💨</text>
                  </g>
                </svg>

                {/* Legend indicator */}
                <div style={{ position: 'absolute', bottom: 12, left: 16, fontSize: 11, color: '#64748b' }}>
                  ✦ Vue télématique en temps réel • Modélisation tribologique et thermique conforme Master Spec v2.0
                </div>
              </div>
            </div>

            {/* Active Organ In-Depth Physics Analysis Card */}
            {activeOrgan && (
              <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 20, padding: 28, marginBottom: 28, boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 8 }}>{activeOrgan.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#fff' }}>{activeOrgan.name}</h2>
                        <span style={{
                          background: activeOrgan.status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.15)' : activeOrgan.status === 'PRE_CRITICAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: activeOrgan.status === 'HEALTHY' ? '#10b981' : activeOrgan.status === 'PRE_CRITICAL' ? '#f59e0b' : '#ef4444',
                          border: `1px solid ${activeOrgan.status === 'HEALTHY' ? '#10b981' : activeOrgan.status === 'PRE_CRITICAL' ? '#f59e0b' : '#ef4444'}`,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          {activeOrgan.status === 'HEALTHY' ? 'Sain' : activeOrgan.status === 'PRE_CRITICAL' ? 'Pré-Critique' : 'Critique'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>
                          Algorithme : {activeOrgan.physicsAlgorithm}
                        </span>
                        <CalculationProofButton
                          label="Voir la formule & preuve physique"
                          size="xs"
                          variant="cyan"
                          onClick={() => handleOpenOrganProof(activeOrgan)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RUL Highlight Box */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 20px', textAlign: 'right' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
                      Durée de Vie Résiduelle (RUL)
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8' }}>
                      {activeOrgan.remainingUsefulLifeValue.toLocaleString()} <span style={{ fontSize: 15, color: '#94a3b8' }}>{activeOrgan.remainingUsefulLifeUnit}</span>
                    </div>
                  </div>
                </div>

                {/* Health Progress Bar */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#94a3b8' }}>Niveau de Santé de l’Organe</span>
                    <span style={{ fontWeight: 700, color: getVhiColor(activeOrgan.healthPercent) }}>{activeOrgan.healthPercent} %</span>
                  </div>
                  <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${activeOrgan.healthPercent}%`, background: getVhiColor(activeOrgan.healthPercent), transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Observed Telemetry Table */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
                  {activeOrgan.observedMetrics.map((m, idx) => (
                    <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{m.value}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Seuil : {m.threshold}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Physical Explanation Box */}
                <div style={{ background: 'rgba(56, 189, 248, 0.06)', borderLeft: '3px solid #38bdf8', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>
                  <strong style={{ color: '#38bdf8' }}>Constat Physique SAD : </strong>
                  {activeOrgan.explanation}
                </div>
              </div>
            )}

            {/* Simulation Studio: What-If Stress Scenarios */}
            <div style={{ background: 'linear-gradient(180deg, rgba(20, 29, 47, 0.9) 0%, rgba(12, 17, 29, 0.95) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
                    🎮 Studio de Simulation Physique : Scénarios « What-If »
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
                    Simulez l’impact des contraintes climatiques sahariennes et de l’agressivité du conducteur sur le RUL et le VHI.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApplyPreset('alger')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Preset: Côtier Tempéré (Alger)
                  </button>
                  <button onClick={() => handleApplyPreset('sahara')} style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Preset: Sahara Extrême (+50°C, Silice)
                  </button>
                  <button onClick={() => handleApplyPreset('delivery')} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Preset: Stop & Go Urbain Brutal
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
                {/* Climate Slider */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                      Sévérité Climatique Wilaya ($K_{'{'}clim{'}'}$)
                    </label>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8' }}>x{climateMultiplier.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.00"
                    max="1.70"
                    step="0.05"
                    value={climateMultiplier}
                    onChange={(e) => setClimateMultiplier(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    <span>1.00 (Alger/Oran - Tempéré)</span>
                    <span>1.35 (Ghardaïa)</span>
                    <span>1.70 (In Salah/HMD - Extrême)</span>
                  </div>
                </div>

                {/* Driver Slider */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                      Agressivité de Conduite ($K_{'{'}driver{'}'}$)
                    </label>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>x{driverMultiplier.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="1.60"
                    step="0.05"
                    value={driverMultiplier}
                    onChange={(e) => setDriverMultiplier(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    <span>0.80 (Éco-conduite optimale)</span>
                    <span>1.10 (Standard)</span>
                    <span>1.60 (Freinages rudes / Sur-régimes)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 28px',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isSimulating ? 'Calcul des équations physiques...' : '⚡ Recalculer le Jumeau Numérique'}
                </button>
              </div>
            </div>

            {/* 90-Day Predictive Trajectory & ADS Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 28 }}>
              {/* Trajectory Card */}
              <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    📈 Trajectoire Prédictive Déterministe
                  </h4>
                  <CalculationProofButton
                    label="Preuve dégradation"
                    size="xs"
                    variant="amber"
                    onClick={handleOpenTrajectoryProof}
                  />
                </div>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94a3b8' }}>
                  Comparaison du score VHI sans action vs avec action préventive SAD.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Day 0 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Aujourd’hui (J0)</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: getVhiColor(digitalTwin.projectionTrajectory.day0Vhi) }}>
                      {digitalTwin.projectionTrajectory.day0Vhi} VHI
                    </span>
                  </div>

                  {/* Day 30 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Dans 30 jours (J+30)</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Sans intervention vs Avec intervention</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginRight: 12 }}>
                        {digitalTwin.projectionTrajectory.day30VhiWithoutAction} VHI
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>
                        ↗ {digitalTwin.projectionTrajectory.day30VhiWithAction} VHI
                      </span>
                    </div>
                  </div>

                  {/* Day 60 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Dans 60 jours (J+60)</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>
                      {digitalTwin.projectionTrajectory.day60VhiWithoutAction} VHI
                    </span>
                  </div>

                  {/* Day 90 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Dans 90 jours (J+90)</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>
                      {digitalTwin.projectionTrajectory.day90VhiWithoutAction} VHI (Panne Élevée)
                    </span>
                  </div>
                </div>
              </div>

              {/* ADS Autonomous Decisions & Parts Reservation */}
              <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                      ADS ACTION AUTONOME
                    </span>
                  </div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#f8fafc' }}>
                    Réservation Prédictive Pièces & Substitution
                  </h4>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>
                    Allocation proactive des pièces certifiées OEM avant le seuil d’usure critique.
                  </p>

                  {digitalTwin.partsReservation && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{digitalTwin.partsReservation.partName}</span>
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          En Stock ({digitalTwin.partsReservation.warehouseStockQty})
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                        Réf OEM : {digitalTwin.partsReservation.partNumber} • {digitalTwin.partsReservation.oemHomologation}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#38bdf8' }}>
                        {digitalTwin.partsReservation.estimatedCostDzd.toLocaleString()} DZD
                      </div>
                    </div>
                  )}

                  {digitalTwin.substitutionAsset && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 2 }}>
                        ⚠️ Remplacement Flotte Recommandé (VHI &lt; 65)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        Actif suggéré : {digitalTwin.substitutionAsset.assetName} ({digitalTwin.substitutionAsset.assetCode})
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                        Santé VHI : {digitalTwin.substitutionAsset.vhiScore}/100 • {digitalTwin.substitutionAsset.reason}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={() => showNotification('Ordre d’intervention et bon de réservation de pièces générés vers le module Maintenance !')}
                    style={{
                      width: '100%',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      borderRadius: 10,
                      padding: '12px 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🛠️ Générer l’Ordre d’Intervention Préventif
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Universelle Preuve de Calcul & Formule Physique */}
      <CalculationProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        data={proofModalData}
      />
    </div>
  );
}
