'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/navigation/Navbar';
import { AuthClient } from '../../lib/api-auth';
import { DigitalTwinClient } from '../../lib/api-digital-twin';
import { AssetClient } from '../../lib/api-assets';
import { useDemoMode } from '../../context/DemoModeContext';
import {
  DigitalTwinAsset,
  DigitalTwinOrganStatus,
  Asset,
  ALGERIA_58_WILAYAS_PROFILES,
  AlgeriaWilayaProfile,
} from '@docteurflotte/contracts';
import {
  CalculationProofModal,
  CalculationProofButton,
  CalculationProofData,
} from '../../components/decisions';
import { CalculationProofBuilder } from '../../lib/calculation-proofs';

const DEFAULT_ALGER_WILAYA: AlgeriaWilayaProfile = {
  code: 16,
  name: 'Alger',
  nameAr: 'الجزائر',
  zone: 'ZONE_1_TELL',
  zoneLabel: 'Capitale & Littoral',
  ambientTempSummerC: 33,
  ambientTempWinterC: 10,
  oilArrheniusFactor: 1.3,
  dustSilicaFactor: 1.1,
  brakeGradientFactor: 1.2,
  batteryEvapFactor: 1.1,
  description: 'Ralenti urbain excessif (>45% du temps moteur) et arrêts fréquents',
};

export default function DigitalTwinPage() {
  const router = useRouter();
  const { isDemoMode, session } = useDemoMode();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('ast-kangoo-01');
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinAsset | null>(null);
  const [activeOrganKey, setActiveOrganKey] = useState<string>('ENGINE_OIL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Simulation Sliders & Wilayas
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16); // Alger
  const [isDesertTransit, setIsDesertTransit] = useState<boolean>(false);
  const [climateMultiplier, setClimateMultiplier] = useState<number>(1.15);
  const [driverMultiplier, setDriverMultiplier] = useState<number>(1.1);

  // Profil Wilaya actif avec garde-fou résilient
  const currentWilayaProfile = useMemo(() => {
    const list = Array.isArray(ALGERIA_58_WILAYAS_PROFILES) ? ALGERIA_58_WILAYAS_PROFILES : [DEFAULT_ALGER_WILAYA];
    return (
      list.find((w) => w.code === selectedWilayaCode) ||
      list[15] ||
      DEFAULT_ALGER_WILAYA
    );
  }, [selectedWilayaCode]);

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

  const handleOpenFinancialProof = () => {
    if (!digitalTwin || !digitalTwin.financialArbitrage) return;
    const arb = digitalTwin.financialArbitrage;
    setProofModalData({
      title: 'Preuve de l’Arbitrage Financier SAD → ADS (DZD)',
      decisionOrMetricName: `${digitalTwin.assetName} — Arbitrage Coût Préventif vs Inaction`,
      category: 'FINANCIAL',
      ruleId: 'RULE-FIN-ADS-001',
      legalOrOemReference: 'MASTER_SPEC v2.0 §5.1 (Arbitrage Financier Déterministe)',
      deterministicFormula: 'Économie Nette (DZD) = Risque d\'Inaction - Coût d\'Action Immédiate',
      formulaExplanation:
        'Le risque financier d\'inaction modélise la défaillance sévère en exploitation : forfait remorquage désertique selon la Wilaya, coût d\'immobilisation journalière et coefficient d\'amplification des dégâts matériels.',
      variables: [
        { name: 'Coût Préventif Immédiat', symbol: 'C_prev', value: `${arb.preventiveInterventionCostDzd.toLocaleString('fr-DZ')} DZD`, source: 'Catalogue RMI & Pièces en Stock' },
        { name: 'Risque Financier Panne Inaction', symbol: 'R_inaction', value: `${arb.unplannedBreakdownRiskDzd.toLocaleString('fr-DZ')} DZD`, source: 'Modèle Physique Cascades' },
        { name: 'Forfait Remorquage Wilaya', symbol: 'C_remorquage', value: `${arb.desertTowingCostDzd.toLocaleString('fr-DZ')} DZD`, source: `Barème Assistance Wilaya ${digitalTwin.wilayaCode || 16}` },
        { name: 'Perte d\'Immobilisation Journalière', symbol: 'L_immo', value: `${arb.dailyImmobilizationLossDzd.toLocaleString('fr-DZ')} DZD/j`, source: 'Perte d\'Exploitation Fret/BTP' },
        { name: 'Économie Nette Attendue', symbol: 'Gain_net', value: `${arb.netBenefitDzd.toLocaleString('fr-DZ')} DZD`, source: 'Calcul Différentiel' },
        { name: 'Ratio ROI', symbol: 'ROI', value: `${arb.roiRatio.toFixed(1)}x`, source: 'R_inaction / C_prev' },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Calcul du coût d\'intervention préventive planifiée',
          formula: 'C_pièces + C_main_oeuvre',
          calculation: `${arb.preventiveInterventionCostDzd.toLocaleString('fr-DZ')} DZD`,
          intermediateResult: `${arb.preventiveInterventionCostDzd.toLocaleString('fr-DZ')} DZD`,
        },
        {
          stepNumber: 2,
          description: 'Évaluation du coût d\'inaction (panne sévère en ligne)',
          formula: 'C_casse_moteur + C_remorquage_desert + L_immo × 2 jours',
          calculation: `${arb.unplannedBreakdownRiskDzd.toLocaleString('fr-DZ')} DZD`,
          intermediateResult: `${arb.unplannedBreakdownRiskDzd.toLocaleString('fr-DZ')} DZD`,
        },
        {
          stepNumber: 3,
          description: 'Calcul du bénéfice net d\'action immédiate',
          formula: 'R_inaction - C_prev',
          calculation: `${arb.unplannedBreakdownRiskDzd} - ${arb.preventiveInterventionCostDzd}`,
          intermediateResult: `${arb.netBenefitDzd.toLocaleString('fr-DZ')} DZD`,
        },
      ],
      finalResult: {
        label: 'Arbitrage Rentabilité SAD',
        value: `Gain Net: +${arb.netBenefitDzd.toLocaleString('fr-DZ')} DZD (ROI: ${arb.roiRatio.toFixed(1)}x)`,
        unit: 'DZD',
        conclusion: `Intervention préventive hautement rentable. Recommandation : intervention sous ${arb.actionDeadlineDays} jours.`,
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
        setSelectedWilayaCode(twin.wilayaCode || 16);
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
      wilayaCode: 16,
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
        {
          organ: 'TRANSMISSION_DRIVETRAIN',
          name: 'Transmission & Pont Arrière',
          icon: '⚙️',
          healthPercent: 92,
          remainingUsefulLifeValue: 24500,
          remainingUsefulLifeUnit: 'KM',
          status: 'HEALTHY',
          physicsAlgorithm: 'Cinématique de Glissement J1939 (SPN 524 / SPN 191)',
          observedMetrics: [
            { label: 'Glissement Boîte / Pont Estimé', value: '0.62 %', threshold: '< 1.00 %' },
            { label: 'Viscosité Fluide Pont 80W90', value: '14.5 cSt', threshold: '13.5 - 18.5 cSt' },
          ],
          explanation: 'Micro-glissement sous couple de 0.62%. Chaîne cinématique optimale, RUL lubrifiant pont 80W90 estimée à 24 500 km.',
        },
      ],
      financialArbitrage: {
        preventiveInterventionCostDzd: 18500,
        unplannedBreakdownRiskDzd: 42500,
        desertTowingCostDzd: 35000,
        dailyImmobilizationLossDzd: 25000,
        netBenefitDzd: 24000,
        roiRatio: 2.3,
        recommendedAction: 'SURVEILLANCE_APPROFONDIE',
        actionDeadlineDays: 21,
      },
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
      setSelectedWilayaCode(twin.wilayaCode || 16);
      setClimateMultiplier(twin.climateSeverityFactor);
      setDriverMultiplier(twin.driverAggressivenessScore);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWilaya = (code: number) => {
    setSelectedWilayaCode(code);
    const list = Array.isArray(ALGERIA_58_WILAYAS_PROFILES) ? ALGERIA_58_WILAYAS_PROFILES : [DEFAULT_ALGER_WILAYA];
    const profile = list.find((w) => w.code === code);
    if (profile) {
      setClimateMultiplier(profile.oilArrheniusFactor);
      setIsDesertTransit(profile.zone === 'ZONE_3_SAHARA');
    }
  };

  const handleRunSimulation = async () => {
    if (!sessionToken || !selectedAssetId) {
      if (digitalTwin) {
        const wilaya = currentWilayaProfile;
        const stress = climateMultiplier * driverMultiplier;
        const newVhi = Math.max(25, Math.min(98, Math.round(digitalTwin.currentVhi - (stress - 1) * 22)));
        setDigitalTwin({
          ...digitalTwin,
          currentVhi: newVhi,
          wilayaCode: wilaya.code,
          wilayaLocation: `${wilaya.code.toString().padStart(2, '0')} - ${wilaya.name} (${wilaya.zoneLabel})`,
          climateSeverityFactor: climateMultiplier,
          driverAggressivenessScore: driverMultiplier,
        });
        showNotification(`✓ Jumeau Numérique recalculé pour la Wilaya ${wilaya.code} - ${wilaya.name}.`);
      }
      return;
    }

    setIsSimulating(true);
    try {
      const simulated = await DigitalTwinClient.simulateTwin(
        selectedAssetId,
        {
          wilayaCode: selectedWilayaCode,
          climateSeverityMultiplier: climateMultiplier,
          driverAggressivenessMultiplier: driverMultiplier,
          isDesertTransitScenario: isDesertTransit,
        },
        sessionToken,
      );
      setDigitalTwin(simulated);
      showNotification(`✓ Simulation validée pour la Wilaya ${currentWilayaProfile.code} - ${currentWilayaProfile.name} (VHI: ${simulated.currentVhi}/100)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(msg || 'Erreur lors de la simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyPreset = (type: 'alger' | 'sahara' | 'chiffa' | 'tamanrasset') => {
    if (type === 'alger') {
      handleSelectWilaya(16);
      setDriverMultiplier(0.95);
    } else if (type === 'sahara') {
      handleSelectWilaya(30); // Ouargla / Hassi Messaoud
      setDriverMultiplier(1.25);
    } else if (type === 'chiffa') {
      handleSelectWilaya(9); // Blida / Gorges de la Chiffa
      setDriverMultiplier(1.4);
    } else {
      handleSelectWilaya(11); // Tamanrasset Grand Sud
      setDriverMultiplier(1.3);
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
                Modélisation dynamique des 6 organes physiques d’usure (Huile Arrhenius, Batterie CVHI, Freins Archard, Refroidissement EWMA, FAP, Chaîne Cinématique & Pont SPN 524/191). Calibrée sur les contraintes thermiques et abrasives des 58 Wilayas algériennes.
              </p>
            </div>

            {/* Actions & Asset Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/live-cockpit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  padding: '9px 16px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>🛰️</span>
                <span>Live Cockpit MapLibre</span>
              </Link>

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
                    Pondération physique des 6 algorithmes (Huile, Batterie, Freins, Refroidissement, FAP, Chaîne Cinématique). Zéro moyenne naïve.
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

                  {/* Hotspot 1: Cooling (Radiator Front) */}
                  <g onClick={() => setActiveOrganKey('COOLING_SYSTEM')} style={{ cursor: 'pointer' }}>
                    <circle cx="530" cy="100" r={activeOrganKey === 'COOLING_SYSTEM' ? 22 : 16} fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" strokeWidth="2" />
                    <text x="530" y="105" textAnchor="middle" fontSize="16">🌡️</text>
                  </g>

                  {/* Hotspot 2: Engine Oil (Front Engine Block) */}
                  <g onClick={() => setActiveOrganKey('ENGINE_OIL')} style={{ cursor: 'pointer' }}>
                    <circle cx="470" cy="115" r={activeOrganKey === 'ENGINE_OIL' ? 22 : 16} fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" strokeWidth="2" />
                    <text x="470" y="120" textAnchor="middle" fontSize="16">🛢️</text>
                  </g>

                  {/* Hotspot 3: Battery (Front Bay Top) */}
                  <g onClick={() => setActiveOrganKey('BATTERY_CRANKING')} style={{ cursor: 'pointer' }}>
                    <circle cx="440" cy="65" r={activeOrganKey === 'BATTERY_CRANKING' ? 22 : 16} fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2" />
                    <text x="440" y="70" textAnchor="middle" fontSize="16">🔋</text>
                  </g>

                  {/* Hotspot 4: Transmission & Pont Arrière (Drivetrain Center) */}
                  <g onClick={() => setActiveOrganKey('TRANSMISSION_DRIVETRAIN')} style={{ cursor: 'pointer' }}>
                    <circle cx="345" cy="100" r={activeOrganKey === 'TRANSMISSION_DRIVETRAIN' ? 22 : 16} fill="rgba(6, 182, 212, 0.25)" stroke="#06b6d4" strokeWidth="2" />
                    <text x="345" y="105" textAnchor="middle" fontSize="16">⚙️</text>
                  </g>

                  {/* Hotspot 5: Brake Pads (Wheels) */}
                  <g onClick={() => setActiveOrganKey('BRAKE_PADS')} style={{ cursor: 'pointer' }}>
                    <circle cx="250" cy="65" r={activeOrganKey === 'BRAKE_PADS' ? 22 : 16} fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="2" />
                    <text x="250" y="70" textAnchor="middle" fontSize="16">🛑</text>
                  </g>

                  {/* Hotspot 6: DPF Exhaust (Exhaust Line) */}
                  <g onClick={() => setActiveOrganKey('DPF_FILTER')} style={{ cursor: 'pointer' }}>
                    <circle cx="170" cy="115" r={activeOrganKey === 'DPF_FILTER' ? 22 : 16} fill="rgba(168, 85, 247, 0.25)" stroke="#a855f7" strokeWidth="2" />
                    <text x="170" y="120" textAnchor="middle" fontSize="16">💨</text>
                  </g>
                </svg>

                {/* Legend indicator */}
                <div style={{ position: 'absolute', bottom: 12, left: 16, fontSize: 11, color: '#64748b' }}>
                  ✦ Vue télématique en temps réel • Modélisation 6 organes physiques (Arrhenius, CVHI, Archard, EWMA, FAP, J1939 Kinematics) conforme Master Spec v2.0
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

            {/* Simulation Studio: What-If Stress Scenarios & 58 Wilayas Algeria */}
            <div style={{ background: 'linear-gradient(180deg, rgba(20, 29, 47, 0.9) 0%, rgba(12, 17, 29, 0.95) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
                    🎮 Studio de Simulation Physique : Scénarios « What-If » (58 Wilayas)
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
                    Évaluez l’impact des contraintes climatiques des 58 Wilayas, de l’usure saharienne et du comportement de conduite sur la santé VHI.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => handleApplyPreset('alger')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Côtier (16 - Alger)
                  </button>
                  <button onClick={() => handleApplyPreset('chiffa')} style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Pentes RN1 (09 - Blida / Chiffa)
                  </button>
                  <button onClick={() => handleApplyPreset('sahara')} style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Sahara (30 - Ouargla / HMD)
                  </button>
                  <button onClick={() => handleApplyPreset('tamanrasset')} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Grand Sud (11 - Tamanrasset)
                  </button>
                </div>
              </div>

              {/* Wilaya Profile Selector Card */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Wilaya d’Exploitation (58 Wilayas) :</span>
                    <select
                      value={selectedWilayaCode}
                      onChange={(e) => handleSelectWilaya(parseInt(e.target.value, 10))}
                      style={{
                        background: '#0f172a',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {(Array.isArray(ALGERIA_58_WILAYAS_PROFILES) ? ALGERIA_58_WILAYAS_PROFILES : [DEFAULT_ALGER_WILAYA]).map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code.toString().padStart(2, '0')} - {w.name} ({w.nameAr}) • {w.zoneLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={isDesertTransit}
                      onChange={(e) => setIsDesertTransit(e.target.checked)}
                      style={{ accentColor: '#f59e0b', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span>Scénario Transit Désertique / Piste (Remorquage saharien 75 000 DZD)</span>
                  </label>
                </div>

                {/* Wilaya Physical Specs Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Zone Bioclimatique</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>{currentWilayaProfile.zoneLabel}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>T° Max Estivale</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{currentWilayaProfile.ambientTempSummerC} °C</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Facteur Silice & Poussière</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>x{currentWilayaProfile.dustSilicaFactor}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Arrhenius K_clim Huile</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>x{currentWilayaProfile.oilArrheniusFactor}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Gradient Déclivité / Freins</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>x{currentWilayaProfile.brakeGradientFactor}</div>
                  </div>
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

            {/* Financial Arbitrage SAD -> ADS Banner Card */}
            {digitalTwin.financialArbitrage && (
              <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 78, 59, 0.25) 100%)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 20, padding: 24, marginBottom: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28, background: 'rgba(16, 185, 129, 0.2)', borderRadius: 10, padding: '4px 10px' }}>💰</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                          Moteur d’Arbitrage Financier SAD → ADS (Dinars Algériens DZD)
                        </h4>
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          ROI {digitalTwin.financialArbitrage.roiRatio.toFixed(1)}x
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>
                        Arbitrage déterministe Coût d’Action Préventive vs Risque d’Inaction (remorquage désertique et perte d’immobilisation).
                      </p>
                    </div>
                  </div>

                  <CalculationProofButton
                    label="Preuve de Calcul Financier SAD"
                    size="sm"
                    variant="emerald"
                    onClick={handleOpenFinancialProof}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 18 }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Coût Action Préventive</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8' }}>
                      {digitalTwin.financialArbitrage.preventiveInterventionCostDzd.toLocaleString('fr-DZ')} <span style={{ fontSize: 13, color: '#94a3b8' }}>DZD</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Pièces OEM + MO Atelier</div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Risque Panne Sévère</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>
                      {digitalTwin.financialArbitrage.unplannedBreakdownRiskDzd.toLocaleString('fr-DZ')} <span style={{ fontSize: 13, color: '#94a3b8' }}>DZD</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Casse moteur + remorquage</div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Remorquage & Immo / Jour</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
                      {digitalTwin.financialArbitrage.desertTowingCostDzd.toLocaleString('fr-DZ')} DZD
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>+ {digitalTwin.financialArbitrage.dailyImmobilizationLossDzd.toLocaleString('fr-DZ')} DZD/j d'arrêt</div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', borderRadius: 12, padding: 16, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ fontSize: 12, color: '#a7f3d0', marginBottom: 4, fontWeight: 600 }}>Économie Nette Générée</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>
                      +{digitalTwin.financialArbitrage.netBenefitDzd.toLocaleString('fr-DZ')} <span style={{ fontSize: 13, color: '#a7f3d0' }}>DZD</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>Action sous {digitalTwin.financialArbitrage.actionDeadlineDays} jours</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontSize: 13, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Recommandation ADS :</span>
                    <span>{digitalTwin.financialArbitrage.recommendedAction.replace(/_/g, ' ')} — Tolérance maximale : {digitalTwin.financialArbitrage.actionDeadlineDays} jours avant dégradation exponentielle.</span>
                  </div>

                  <button
                    onClick={() => {
                      showNotification(`✓ Redirection vers le module Ordres de Travail pour l'actif ${digitalTwin.assetCode}...`);
                      router.push(`/work-orders?assetId=${selectedAssetId}&source=digital-twin&priority=HIGH`);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>🛠️</span>
                    <span>Ouvrir l’Ordre de Travail Atelier (DZD)</span>
                  </button>
                </div>
              </div>
            )}

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
                    onClick={() => {
                      showNotification(`✓ Génération de l'ordre d'intervention préventif pour ${digitalTwin.assetCode}...`);
                      router.push(`/work-orders?assetId=${selectedAssetId}&source=digital-twin&organ=${activeOrganKey}`);
                    }}
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
                      transition: 'all 0.2s ease',
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
