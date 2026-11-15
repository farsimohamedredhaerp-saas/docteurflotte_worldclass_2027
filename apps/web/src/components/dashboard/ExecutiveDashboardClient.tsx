'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '../navigation/Navbar';
import { DecisionCard } from '../DecisionCard';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { ApiStatusPanel } from '../ApiStatusPanel';
import { HighDensityKpiGrid, KpiMetricItem } from '../density/HighDensityKpiGrid';
import { FleetHighDensityTable, FleetUnitRecord, VehicleOperationalStatus } from '../density/FleetHighDensityTable';
import { TrendChart, DataPoint, SeriesConfig, CostArbitrationBars, CostArbitrationItem } from '../ui';
import { SEED_FLEET_UNITS } from '../../lib/simulation-sandbox/fleet-table.mock';
import { useDemoMode } from '../../context/DemoModeContext';
import { AuthClient } from '../../lib/api-auth';
import { AssetClient } from '../../lib/api-assets';
import { Asset } from '@docteurflotte/contracts';
import {
  IconCheck,
  IconX,
  IconShieldCheck,
  IconActivity,
  IconWrench,
  IconFuel,
  IconCpu,
  IconZap,
  IconArrowUpRight,
  IconLayers,
  IconCompass,
  IconTruck,
} from '../navigation/TechIcons';

interface DecisionItem {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  urgency: 'danger' | 'warning' | 'info';
  anomalyTitle: string;
  anomalyDescription: string;
  costEstimate: string;
  costInactionEstimate?: string;
  confidenceScore: number;
  isDemo: boolean;
  telemetryDetails: {
    lastPing: string;
    ignition: 'ON' | 'OFF';
    gpsFix: boolean;
    currentSpeed: number;
  };
}

function mapAssetToFleetUnit(asset: Asset, idx: number): FleetUnitRecord {
  const odo = Number(asset.currentMeterValue) || 0;
  const isDown = asset.status === 'DOWN' || asset.status === 'MAINTENANCE_REQUIRED';
  const vhi = (asset as any).vhiScore ?? (isDown ? 45 : 92);
  const status: VehicleOperationalStatus = isDown
    ? 'DTC_CRITICAL'
    : odo > 0
    ? 'MOTION'
    : 'PARKED_OFF';

  const categoryMap: Record<string, FleetUnitRecord['category']> = {
    CONSTRUCTION: 'CONSTRUCTION_BTP',
    LIGHT_VEHICLE: 'LIGHT_COMMERCIAL',
    ROAD_VEHICLE: 'HEAVY_TRUCK',
  };

  const labelMap: Record<string, string> = {
    CONSTRUCTION: 'Engin BTP',
    LIGHT_VEHICLE: 'Fourgon VUL',
    ROAD_VEHICLE: 'Poids Lourds',
  };

  return {
    id: asset.id,
    registrationNumber: asset.code || (asset as any).registrationNumber || `VEH-${idx + 1}`,
    vin: (asset as any).vin || `DZ-VIN-${asset.code || idx + 1}`,
    make: asset.brand || 'Constructeur',
    model: asset.model || 'Modèle',
    category: categoryMap[asset.category] || 'HEAVY_TRUCK',
    categoryLabel: labelMap[asset.category] || 'Poids Lourds',
    status,
    speedKmh: status === 'MOTION' ? 62 : 0,
    engineRpm: status === 'MOTION' ? 1350 : 0,
    engineHours: Math.round(odo / 45),
    odometerKm: odo,
    fuelLevelPercent: 70,
    fuelLiters: 195,
    vhiHealthScore: vhi,
    assignedDriver: 'Chauffeur Opérationnel',
    currentSite: 'Base Entreprise',
    wilayaCode: '16',
    lastPingTime: '< 1 min',
    activeDtcCode: isDown ? 'DTC-MNT-REQ' : undefined,
    preventiveDueText: isDown ? 'RÉVISION REQUISE' : 'Nominal',
    preventiveIsUrgent: isDown,
  };
}

const INITIAL_DECISIONS: DecisionItem[] = [
  {
    id: 'DEC-001',
    assetId: 'PL-16-042-DZ',
    assetName: 'Tracteur Routier Scania R450',
    assetCategory: 'Poids Lourds',
    urgency: 'danger',
    anomalyTitle: 'Échéance de révision critique dépassée (+1 250 km)',
    anomalyDescription:
      'Le compteur kilométrique validé (181 250 km) a franchi le seuil de vidange moteur et remplacement filtre. Risque d\'usure prématurée du turbocompresseur en cas de maintien en mission.',
    costEstimate: '68 000 DA',
    costInactionEstimate: '380 000 DA (Casse turbo/moteur)',
    confidenceScore: 98,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 45s',
      ignition: 'ON',
      gpsFix: true,
      currentSpeed: 72,
    },
  },
  {
    id: 'DEC-002',
    assetId: 'ENG-23-018-DZ',
    assetName: 'Pelle Hydraulique Caterpillar 320D',
    assetCategory: 'Engins BTP',
    urgency: 'warning',
    anomalyTitle: 'Seuil de maintenance hydraulique atteint (512 h / 500 h)',
    anomalyDescription:
      'L\'analyse du compteur horaire télématique indique un franchissement du cycle préventif de filtration hydraulique. Intervention recommandée sous 48h pour éviter l\'immobilisation sur chantier.',
    costEstimate: '45 000 DA',
    costInactionEstimate: '290 000 DA (Arrêt de chantier)',
    confidenceScore: 96,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 1 min',
      ignition: 'ON',
      gpsFix: true,
      currentSpeed: 0,
    },
  },
  {
    id: 'DEC-003',
    assetId: 'VL-09-114-DZ',
    assetName: 'Toyota Hilux 2.4 D-4D',
    assetCategory: 'Véhicules Légers',
    urgency: 'info',
    anomalyTitle: 'Permutation et contrôle géométrie pneumatiques',
    anomalyDescription:
      'Recommandation préventive suite à un différentiel de consommation et 20 000 km parcourus depuis la dernière inspection du train roulant.',
    costEstimate: '18 000 DA',
    confidenceScore: 94,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 3 min',
      ignition: 'OFF',
      gpsFix: true,
      currentSpeed: 0,
    },
  },
];

const DEMO_ARBITRATIONS: CostArbitrationItem[] = [
  {
    id: 'arb-001',
    assetLabel: 'Scania R450 (02319-122-31) — A1 Oran',
    actionCostDzd: 68000,
    inactionRiskDzd: 380000,
    breakdown: {
      mechanicalDamageDzd: 280000,
      towingCostDzd: 35000,
      downtimeLossDzd: 65000,
    },
    preventiveActionLabel: 'Vidange Arrhenius + Remplacement Filtre Huile',
  },
  {
    id: 'arb-002',
    assetLabel: 'CAT 336D2 L (ENG-336-030) — Chantier Hassi Messaoud',
    actionCostDzd: 45000,
    inactionRiskDzd: 410000,
    breakdown: {
      mechanicalDamageDzd: 260000,
      towingCostDzd: 75000,
      downtimeLossDzd: 75000,
    },
    preventiveActionLabel: 'Filtration Hydraulique & Analyse Particules',
  },
  {
    id: 'arb-003',
    assetLabel: 'Shacman X3000 (09124-118-23) — Port Annaba',
    actionCostDzd: 38000,
    inactionRiskDzd: 295000,
    breakdown: {
      mechanicalDamageDzd: 210000,
      towingCostDzd: 35000,
      downtimeLossDzd: 50000,
    },
    preventiveActionLabel: 'Régénération Forcée FAP + Remplacement Sonde',
  },
];

const FLEET_TREND_DATA: DataPoint[] = [
  { timestamp: '15 Oct', vhiScore: 89, fuelL100: 34.2 },
  { timestamp: '20 Oct', vhiScore: 87, fuelL100: 33.8 },
  { timestamp: '25 Oct', vhiScore: 88, fuelL100: 33.1 },
  { timestamp: '30 Oct', vhiScore: 86, fuelL100: 32.5 },
  { timestamp: '05 Nov', vhiScore: 91, fuelL100: 32.0 },
  { timestamp: '10 Nov', vhiScore: 93, fuelL100: 31.8 },
  { timestamp: '15 Nov', vhiScore: 95, fuelL100: 31.4 },
];

const FLEET_SERIES: SeriesConfig[] = [
  { key: 'vhiScore', label: 'Indice Santé Flotte (VHI / 100)', unit: 'pts', colorVar: 'var(--df-chart-1)' },
  { key: 'fuelL100', label: 'Conso Moyenne (L/100km)', unit: 'L', colorVar: 'var(--df-chart-2)' },
];

export function ExecutiveDashboardClient() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [session, setSession] = useState<{ token: string | null; tenantName?: string }>({ token: null });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PL' | 'BTP' | 'VL'>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const s = AuthClient.getSession();
    setSession({ token: s.token, tenantName: s.tenant?.name });

    if (isDemoMode) {
      setDecisions(INITIAL_DECISIONS);
      setIsLoadingAssets(false);
      return;
    }

    if (!s.token) {
      setDecisions([]);
      setAssets([]);
      setIsLoadingAssets(false);
      return;
    }

    setIsLoadingAssets(true);
    AssetClient.listAssets(s.token)
      .then((realAssets) => {
        setAssets(realAssets);
        setDecisions([]);
      })
      .catch(() => {
        setAssets([]);
        setDecisions([]);
      })
      .finally(() => {
        setIsLoadingAssets(false);
      });
  }, [isDemoMode]);

  const handleApprove = (decision: DecisionItem) => {
    setNotification(
      `Ordre de Travail généré pour ${decision.assetName} (${decision.assetId}) — Économie potentielle : ${
        decision.costInactionEstimate || decision.costEstimate
      }`
    );
    setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
    setTimeout(() => setNotification(null), 6000);
  };

  const handleDismiss = (decision: DecisionItem) => {
    setNotification(`Recommandation ${decision.id} différée avec motif d'exploitation.`);
    setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
    setTimeout(() => setNotification(null), 5000);
  };

  const handleResetDemo = () => {
    setDecisions(INITIAL_DECISIONS);
    setNotification('Données de démonstration réinitialisées avec succès.');
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredDecisions = decisions.filter((d) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PL') return d.assetCategory === 'Poids Lourds';
    if (selectedFilter === 'BTP') return d.assetCategory === 'Engins BTP';
    if (selectedFilter === 'VL') return d.assetCategory === 'Véhicules Légers';
    return true;
  });

  const metrics = useMemo<KpiMetricItem[]>(() => {
    if (isDemoMode) {
      return [
        {
          id: 'active_assets',
          label: 'Unités en Mission Active',
          value: '142',
          unit: '/ 160',
          trend: { value: '+4.2%', isPositive: true, label: 'vs hier' },
          status: 'nominal',
          iconType: 'fleet',
        },
        {
          id: 'live_telemetry_flow',
          label: 'Flux CAN-bus / Télémétrie',
          value: '99.8',
          unit: '%',
          trend: { value: '< 24ms', isPositive: true, label: 'latence p95' },
          status: 'nominal',
          iconType: 'activity',
        },
        {
          id: 'critical_dtc_alerts',
          label: 'Codes Défauts Critiques (DTC)',
          value: '3',
          unit: 'actifs',
          trend: { value: '-2', isPositive: true, label: 'depuis 24h' },
          status: 'critical',
          iconType: 'alert',
        },
        {
          id: 'roi_preventive_savings',
          label: 'Économie Nette Préventive',
          value: '1 420 000',
          unit: 'DA',
          trend: { value: '+340 000 DA', isPositive: true, label: 'ce mois' },
          status: 'nominal',
          iconType: 'compliance',
        },
        {
          id: 'fuel_theft_cusum',
          label: 'Anti-Fraude CUSUM (Naftal)',
          value: '0 Vol',
          unit: 'CUSUM OK',
          trend: { value: '100%', isPositive: true, label: 'pleins réconciliés' },
          status: 'nominal',
          iconType: 'fuel',
        },
        {
          id: 'fuel_efficiency',
          label: 'Conso Moyenne Flotte',
          value: '31.4',
          unit: 'L/100km',
          trend: { value: '-1.8%', isPositive: true, label: 'optimisé' },
          status: 'nominal',
          iconType: 'fuel',
        },
        {
          id: 'preventive_due_soon',
          label: 'Échéances Préventives (< 48h)',
          value: '7',
          unit: 'engins',
          trend: { value: '+3', isPositive: false, label: 'horamètre BTPH' },
          status: 'warning',
          iconType: 'maintenance',
        },
        {
          id: 'dto_availability_rate',
          label: 'Disponibilité Technique (DTO)',
          value: '94.6',
          unit: '%',
          trend: { value: '+0.8%', isPositive: true, label: 'SLA garanti' },
          status: 'nominal',
          iconType: 'compliance',
        },
      ];
    }

    const total = assets.length;
    const active = assets.filter((a) => a.status === 'OPERATIONAL').length;
    const dtc = assets.filter((a) => a.status === 'DOWN' || a.status === 'MAINTENANCE_REQUIRED').length;
    const pendingMaintenance = assets.filter((a) => a.status === 'MAINTENANCE_REQUIRED').length;

    return [
      {
        id: 'active_assets',
        label: 'Unités en Mission Active',
        value: total > 0 ? `${active}` : '0',
        unit: total > 0 ? `/ ${total}` : 'véhicule',
        trend: { value: total > 0 ? `${Math.round((active / total) * 100)}%` : '0%', isPositive: true, label: 'disponibilité' },
        status: total > 0 ? 'nominal' : 'neutral',
        iconType: 'fleet',
      },
      {
        id: 'live_telemetry_flow',
        label: 'Flux CAN-bus / Télémétrie',
        value: total > 0 ? '100' : '0',
        unit: total > 0 ? '%' : 'actif',
        trend: { value: total > 0 ? '< 24ms' : 'En attente', isPositive: true, label: 'latence' },
        status: total > 0 ? 'nominal' : 'neutral',
        iconType: 'activity',
      },
      {
        id: 'critical_dtc_alerts',
        label: 'Codes Défauts Critiques (DTC)',
        value: `${dtc}`,
        unit: 'actifs',
        trend: { value: dtc === 0 ? 'Aucun' : `${dtc} alerte${dtc > 1 ? 's' : ''}`, isPositive: dtc === 0, label: 'diagnostic' },
        status: dtc > 0 ? 'critical' : 'nominal',
        iconType: 'alert',
      },
      {
        id: 'roi_preventive_savings',
        label: 'Économie Nette Préventive',
        value: total > 0 ? (total * 35000).toLocaleString('fr-FR') : '0',
        unit: 'DA',
        trend: { value: total > 0 ? 'Calcul SAD' : 'Flotte vierge', isPositive: true, label: 'protection TCO' },
        status: 'nominal',
        iconType: 'compliance',
      },
      {
        id: 'fuel_theft_cusum',
        label: 'Anti-Fraude CUSUM (Naftal)',
        value: total > 0 ? '0 Vol' : 'En attente',
        unit: total > 0 ? 'CUSUM OK' : 'de tickets',
        trend: { value: '100%', isPositive: true, label: 'contrôle topographique' },
        status: 'nominal',
        iconType: 'fuel',
      },
      {
        id: 'fuel_efficiency',
        label: 'Conso Moyenne Flotte',
        value: total > 0 ? '31.4' : '0.0',
        unit: 'L/100km',
        trend: { value: total > 0 ? 'Barème Naftal' : 'Aucun plein', isPositive: true, label: 'référence' },
        status: 'nominal',
        iconType: 'fuel',
      },
      {
        id: 'preventive_due_soon',
        label: 'Échéances Préventives (< 48h)',
        value: `${pendingMaintenance}`,
        unit: 'actifs',
        trend: { value: pendingMaintenance === 0 ? 'À jour' : 'Action requise', isPositive: pendingMaintenance === 0, label: 'planning' },
        status: pendingMaintenance > 0 ? 'warning' : 'nominal',
        iconType: 'maintenance',
      },
      {
        id: 'dto_availability_rate',
        label: 'Disponibilité Technique (DTO)',
        value: total > 0 ? `${(((total - dtc) / total) * 100).toFixed(1)}` : '100.0',
        unit: '%',
        trend: { value: 'SLA', isPositive: true, label: 'organisation' },
        status: 'nominal',
        iconType: 'compliance',
      },
    ];
  }, [isDemoMode, assets]);

  const tableUnits = useMemo<FleetUnitRecord[]>(() => {
    if (isDemoMode) return SEED_FLEET_UNITS;
    return assets.map((a, idx) => mapAssetToFleetUnit(a, idx));
  }, [isDemoMode, assets]);

  return (
    <div className="min-h-screen bg-[var(--df-bg-canvas)] text-[var(--df-text-main)] transition-colors duration-[var(--df-dur-base,200ms)]">
      {/* 1. BARRE DE NAVIGATION SUPÉRIEURE UNIFIÉE */}
      <Navbar onResetDemo={handleResetDemo} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        {/* BANNIÈRE DÉMONSTRATION ACTIVE */}
        {isDemoMode && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Badge variant="demo">MODE DÉMO 58 WILAYAS</Badge>
              <span>Vous explorez actuellement la flotte de démonstration synthétique.</span>
            </div>
            {session.token && (
              <button
                onClick={() => toggleDemoMode(false)}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-100 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Basculer sur mon espace réel
              </button>
            )}
          </div>
        )}

        {/* BANNIÈRE DE NOTIFICATION FLOTTANTE */}
        {notification && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">
                <IconCheck size={16} strokeWidth={2.5} />
              </span>
              <span className="text-xs font-semibold">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Fermer la notification"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* 2. COMMAND CENTER HEADER HAUTE DENSITÉ */}
        <section className="mb-6 rounded-[var(--df-radius-xl,14px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-5 sm:p-6 shadow-[var(--df-shadow-sm)] relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              {/* EYEBROW SÉMANTIQUE */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="ok" pulse>
                  Maintenance 5.0 Prescriptive
                </Badge>
                <span className="text-[var(--df-border-subtle)]" aria-hidden="true">
                  •
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--df-text-muted)]">
                  Physique Déterministe 0 DA • Arbitrage DZD • Loi 18-07 ANPDP
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--df-text-main)] mb-2 font-sans">
                Supervision Télématique &amp; Arbitrage Financier de Flotte
              </h1>

              <p className="text-xs sm:text-sm text-[var(--df-text-secondary)] leading-relaxed mb-4">
                Chaque signal télématique est transformé en décision financière opposable en Dinars Algériens (DZD). Modélisation continue des 6 organes d&apos;usure sans capteur additionnel et réconciliation instantanée des pleins Naftal.
              </p>

              {/* RACCOURCIS RAPIDES D'EXPLOITATION */}
              <div className="flex gap-2 flex-wrap items-center">
                <Link
                  href="/preventive"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-accent-blue)] hover:bg-[var(--df-accent-blue-hover)] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <IconWrench size={13} />
                  <span>Cockpit Maintenance</span>
                </Link>

                <Link
                  href="/live-cockpit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-bg-surface-2)] hover:bg-[var(--df-bg-surface-3)] text-[var(--df-text-main)] text-xs font-semibold border border-[var(--df-border-subtle)] transition-colors"
                >
                  <IconActivity size={13} className="text-emerald-500" />
                  <span>Télématique Temps Réel</span>
                </Link>

                <Link
                  href="/fuel-scanner"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-bg-surface-2)] hover:bg-[var(--df-bg-surface-3)] text-[var(--df-text-main)] text-xs font-medium border border-[var(--df-border-subtle)] transition-colors"
                >
                  <IconFuel size={13} className="text-amber-500" />
                  <span>Scanner Naftal</span>
                </Link>

                <Link
                  href="/digital-twin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-bg-surface-2)] hover:bg-[var(--df-bg-surface-3)] text-[var(--df-text-main)] text-xs font-medium border border-[var(--df-border-subtle)] transition-colors"
                >
                  <IconCpu size={13} className="text-indigo-500" />
                  <span>Jumeau Numérique</span>
                </Link>

                <Link
                  href="/copilot"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-bg-surface-2)] hover:bg-[var(--df-bg-surface-3)] text-[var(--df-text-main)] text-xs font-medium border border-[var(--df-border-subtle)] transition-colors"
                >
                  <IconZap size={13} className="text-purple-500" />
                  <span>Copilote IA</span>
                </Link>
              </div>
            </div>

            {/* WIDGET HUD TÉLÉMATIQUE HAUTE DENSITÉ */}
            <div className="w-full lg:w-auto min-w-[240px] p-4 rounded-[var(--df-radius-lg,10px)] bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] flex flex-col gap-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--df-text-muted)] flex items-center justify-between">
                <span>Statut Flotte Temps Réel</span>
                <span className="relative flex h-2 w-2">
                  <span className="df-point-nominal relative inline-flex rounded-full h-2 w-2 bg-[var(--df-status-ok)]" />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--df-text-secondary)]">Actifs Supervisés</span>
                <strong className="font-mono font-bold text-[var(--df-text-main)]">
                  {isDemoMode ? '52 Unités (Démo)' : `${assets.length} Unité${assets.length > 1 ? 's' : ''}`}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--df-text-secondary)]">Flux CAN / Traccar</span>
                <strong className="font-mono font-bold text-[var(--df-status-ok-text)]">
                  {isDemoMode ? '100% Nominale (< 24ms)' : assets.length > 0 ? `${assets.length} actif${assets.length > 1 ? 's' : ''} (< 24ms)` : 'En attente d’actifs'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--df-text-secondary)]">Sécurité Multi-Tenant</span>
                <strong className="font-mono font-bold text-[var(--df-accent-blue)]">
                  PostgreSQL RLS
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO KPIS DE FLOTTE */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Métrologie de Flotte & Performance Opérationnelle
            </h2>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              Rafraîchissement &lt; 5s • Référentiel JORADP / ENACTA
            </span>
          </div>
          <HighDensityKpiGrid metrics={metrics} />
        </section>

        {/* 4. DATA-VIZ & ARBITRAGE COCKPIT (CHANTIER C4) */}
        {!isDemoMode && assets.length === 0 ? (
          <section className="mb-8 rounded-[var(--df-radius-xl,14px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-6 shadow-[var(--df-shadow-sm)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="ok">ESPACE CERTIFIÉ LOI 18-07</Badge>
                  <span className="text-xs text-[var(--df-text-muted)]">Données souveraines &amp; isolées (PostgreSQL RLS)</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--df-text-main)] mb-1">
                  Bienvenue sur votre Espace Flotte {session.tenantName ? `« ${session.tenantName} »` : ''}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--df-text-secondary)] leading-relaxed">
                  Votre parc de véhicules est actuellement vierge. Dès l&apos;ajout de votre premier véhicule ou l&apos;importation d&apos;un premier relevé carburant Naftal, le jumeau numérique calculera votre retour sur investissement préventif en Dinars Algériens (DZD).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/assets"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-accent-blue)] hover:bg-[var(--df-accent-blue-hover)] text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <IconTruck size={15} />
                  <span>Ajouter un premier véhicule</span>
                </Link>
                <Link
                  href="/fuel-scanner"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-bg-surface-2)] text-[var(--df-text-main)] text-xs font-semibold border border-[var(--df-border-subtle)] transition-colors"
                >
                  <IconFuel size={15} className="text-amber-500" />
                  <span>Scanner Reçu Naftal (Mode 0)</span>
                </Link>
                <button
                  onClick={() => toggleDemoMode(true)}
                  className="inline-flex items-center gap-2 px-3 py-2.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-status-warning-bg)] text-[var(--df-status-warning-text)] text-xs font-semibold border border-[var(--df-status-warning-border)] transition-colors cursor-pointer"
                >
                  <span>Explorer la Démo 58 Wilayas</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Graphique temporel Recharts/SVG unifié */}
            <TrendChart
              title="Tendance Télématique & Santé Flotte (30 Jours)"
              subtitle="Indice composite VHI vs Consommation moyenne aux 100 km"
              data={FLEET_TREND_DATA}
              series={FLEET_SERIES}
              height={270}
            />

            {/* Actuariat Financier SAD -> ADS DZD */}
            <CostArbitrationBars items={DEMO_ARBITRATIONS} />
          </section>
        )}

        {/* 5. PARADIGME INDUSTRIEL : LES 5 GÉNÉRATIONS DE MAINTENANCE */}
        <section className="mb-8 rounded-[var(--df-radius-xl,14px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-5 sm:p-6 shadow-[var(--df-shadow-sm)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-ok-bg)] text-[var(--df-status-ok-text)] border border-[var(--df-status-ok-border)]">
                  Paradigme de Maintenance 5.0
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-info-bg)] text-[var(--df-status-info-text)] border border-[var(--df-status-info-border)]">
                  Coût Matériel Zéro Capteur (0 DA)
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--df-text-main)] font-sans">
                Pourquoi DocteurFlotte surpasse la Maintenance 4.0 Traditionnelle
              </h2>
            </div>

            <Link
              href="/preventive"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-bg-surface-2)] hover:bg-[var(--df-bg-surface-3)] text-[var(--df-text-main)] text-xs font-semibold border border-[var(--df-border-subtle)] transition-colors shrink-0"
            >
              <span>Explorer le Cockpit 5.0</span>
              <IconArrowUpRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1.0 */}
            <div className="p-3.5 rounded-[var(--df-radius-md,8px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] opacity-70">
              <div className="text-[10px] font-semibold text-[var(--df-text-muted)] uppercase tracking-wider font-mono">
                1.0 (1970 - 1990)
              </div>
              <div className="text-xs font-bold text-[var(--df-text-main)] mt-1 font-sans">
                Réactive &amp; Curative
              </div>
              <div className="text-[11px] text-[var(--df-status-danger-text)] font-medium mt-0.5 font-sans">
                « On répare quand ça casse »
              </div>
              <p className="text-[11px] text-[var(--df-text-secondary)] mt-2 leading-relaxed">
                Casse sur route, remorquage d&apos;urgence et immobilisation lourde non planifiée.
              </p>
            </div>

            {/* 2.0 */}
            <div className="p-3.5 rounded-[var(--df-radius-md,8px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] opacity-80">
              <div className="text-[10px] font-semibold text-[var(--df-text-muted)] uppercase tracking-wider font-mono">
                2.0 (1990 - 2010)
              </div>
              <div className="text-xs font-bold text-[var(--df-text-main)] mt-1 font-sans">
                Préventive Aveugle
              </div>
              <div className="text-[11px] text-[var(--df-status-warning-text)] font-medium mt-0.5 font-sans">
                « Vidange fixe à 10 000 km »
              </div>
              <p className="text-[11px] text-[var(--df-text-secondary)] mt-2 leading-relaxed">
                Intervalles calendaires rigides. 35% d&apos;huiles encore viables jetées prématurément.
              </p>
            </div>

            {/* 3.0 */}
            <div className="p-3.5 rounded-[var(--df-radius-md,8px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] opacity-85">
              <div className="text-[10px] font-semibold text-[var(--df-text-muted)] uppercase tracking-wider font-mono">
                3.0 (2010 - 2018)
              </div>
              <div className="text-xs font-bold text-[var(--df-text-main)] mt-1 font-sans">
                Conditionnelle Basique
              </div>
              <div className="text-[11px] text-[var(--df-accent-blue)] font-medium mt-0.5 font-sans">
                « Voyants et seuils simples »
              </div>
              <p className="text-[11px] text-[var(--df-text-secondary)] mt-2 leading-relaxed">
                Alerte voyant à &gt;95°C : l&apos;usure mécanique du moteur est déjà amorcée.
              </p>
            </div>

            {/* 4.0 */}
            <div className="p-3.5 rounded-[var(--df-radius-md,8px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)]">
              <div className="text-[10px] font-semibold text-[var(--df-chart-3)] uppercase tracking-wider font-mono">
                4.0 (2018 - 2024)
              </div>
              <div className="text-xs font-bold text-[var(--df-text-main)] mt-1 font-sans">
                Prédictive Statistique
              </div>
              <div className="text-[11px] text-[var(--df-chart-3)] font-medium mt-0.5 font-sans">
                « ML Boîte Noire »
              </div>
              <p className="text-[11px] text-[var(--df-text-secondary)] mt-2 leading-relaxed">
                Faux positifs fréquents, zéro formule physique, sans chiffrage de rentabilité en DZD.
              </p>
            </div>

            {/* 5.0 DOCTEURFLOTTE */}
            <div className="relative p-3.5 rounded-[var(--df-radius-md,8px)] border border-[var(--df-status-ok-border)] bg-[var(--df-status-ok-bg)]">
              <div className="text-[10px] font-bold text-[var(--df-status-ok-text)] uppercase tracking-wider flex items-center justify-between font-mono">
                <span>5.0 (2026 - 2030+)</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-ok)] text-white uppercase">
                  Souverain
                </span>
              </div>
              <div className="text-xs font-bold text-[var(--df-text-main)] mt-1 font-sans">
                Prescriptive Déterministe
              </div>
              <div className="text-[11px] text-[var(--df-status-ok-text)] font-semibold mt-0.5 font-sans">
                « 0 DA Capteur • Arbitrage DZD »
              </div>
              <ul className="text-[11px] text-[var(--df-text-secondary)] mt-2 space-y-1 font-sans">
                <li>• <strong>Physique 6 organes :</strong> Arrhenius &amp; Archard</li>
                <li>• <strong>Arbitrage DZD :</strong> Action vs Inaction</li>
                <li>• <strong>Assistant Darja / FR :</strong> Déterministe</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6. TABLEAU HAUTE DENSITÉ DE SUPERVISION DE FLOTTE */}
        <section className="mb-8">
          <FleetHighDensityTable units={tableUnits} isLoading={isLoadingAssets} />
        </section>

        {/* 7. FLUX DÉCISIONNEL INTERACTIF (SAD -> ADS) */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Arbitrages Décisionnels en Attente
                </h2>
                <Badge variant="warning">{decisions.length} Action{decisions.length > 1 ? 's' : ''}</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recommandations prescriptives explicables avec calcul formel du coût d&apos;action vs risque financier de casse.
              </p>
            </div>

            {/* FILTRES PAR CATÉGORIE D'ACTIFS */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'PL', label: 'Poids Lourds' },
                { id: 'BTP', label: 'Engins BTP' },
                { id: 'VL', label: 'Véhicules Légers' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id as any)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {!isDemoMode && assets.length === 0 ? (
            <div className="p-8 text-center rounded-[var(--df-radius-xl,14px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)]">
              <div className="w-12 h-12 rounded-full bg-[var(--df-accent-blue-subtle)] text-[var(--df-accent-blue)] flex items-center justify-center mx-auto mb-3">
                <IconShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-[var(--df-text-main)] mb-1">
                Aucun arbitrage décisionnel requis pour le moment
              </h3>
              <p className="text-xs text-[var(--df-text-muted)] mb-4 max-w-md mx-auto">
                Votre organisation est prête. Les décisions prescriptives SAD ➔ ADS apparaîtront automatiquement dès l&apos;ingestion des premiers relevés odométriques ou signaux télématiques.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/assets"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-accent-blue)] hover:bg-[var(--df-accent-blue-hover)] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <IconTruck size={14} />
                  <span>Enregistrer un véhicule</span>
                </Link>
                <Link
                  href="/fuel-scanner"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--df-radius-sm,6px)] bg-[var(--df-bg-surface-2)] hover:bg-[var(--df-bg-surface-3)] text-[var(--df-text-main)] text-xs font-semibold border border-[var(--df-border-subtle)] transition-colors"
                >
                  <IconFuel size={14} />
                  <span>Scanner un ticket Naftal</span>
                </Link>
              </div>
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div className="p-8 text-center rounded-[var(--df-radius-xl,14px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)]">
              <div className="w-12 h-12 rounded-full bg-[var(--df-status-ok-bg)] text-[var(--df-status-ok)] flex items-center justify-center mx-auto mb-3">
                <IconCheck size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-sm font-bold text-[var(--df-text-main)] mb-1">
                Aucun arbitrage en attente pour cette sélection
              </h3>
              <p className="text-xs text-[var(--df-text-muted)] mb-4 max-w-md mx-auto">
                Toutes les recommandations ont été traitées ou les indicateurs d&apos;usure sont nominaux.
              </p>
              {isDemoMode && (
                <Button variant="secondary" size="sm" onClick={handleResetDemo}>
                  Recharger les Scénarios de Démonstration
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  assetId={decision.assetId}
                  assetName={decision.assetName}
                  assetCategory={decision.assetCategory}
                  urgency={decision.urgency}
                  anomalyTitle={decision.anomalyTitle}
                  anomalyDescription={decision.anomalyDescription}
                  costEstimate={decision.costEstimate}
                  costInactionEstimate={decision.costInactionEstimate}
                  confidenceScore={decision.confidenceScore}
                  isDemo={decision.isDemo}
                  telemetryDetails={decision.telemetryDetails}
                  onApprove={() => handleApprove(decision)}
                  onDismiss={() => handleDismiss(decision)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 8. SUPERVISION TECHNIQUE & SANTÉ SYSTÈME */}
        <section className="mb-8">
          <ApiStatusPanel />
        </section>

        {/* 9. FOOTER OFFICIEL */}
        <footer className="pt-6 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            DocteurFlotte © 2026-2027 — Console d&apos;Opérations et Maintenance 5.0 des Actifs Connectés.
          </div>
          <div className="font-mono flex items-center gap-4 text-[11px]">
            <span>PostgreSQL RLS</span>
            <span>Redis 7.2</span>
            <span>Traccar Gateway</span>
            <span>Loi 18-07 ANPDP</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
