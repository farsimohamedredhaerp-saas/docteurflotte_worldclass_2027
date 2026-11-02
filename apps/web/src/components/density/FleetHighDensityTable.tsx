'use client';

import React, { useState, useMemo } from 'react';
import {
  IconSearch,
  IconSlidersHorizontal,
  IconDownload,
  IconRefreshCw,
  IconMoreHorizontal,
  IconAlertTriangle,
  IconCheck,
  IconTruck,
  IconEye,
  IconWrench,
} from '../navigation/TechIcons';

export type VehicleOperationalStatus =
  | 'MOTION'
  | 'IDLE_WARNING'
  | 'PARKED_OFF'
  | 'DTC_CRITICAL'
  | 'OFFLINE';

export interface FleetUnitRecord {
  id: string;
  registrationNumber: string; // Ex: 00421-116-16
  vin: string; // 17 car ISO
  make: string;
  model: string;
  category: 'HEAVY_TRUCK' | 'CONSTRUCTION_BTP' | 'LIGHT_COMMERCIAL';
  categoryLabel: string;
  status: VehicleOperationalStatus;
  speedKmh: number;
  engineRpm: number;
  engineHours: number;
  odometerKm: number;
  fuelLevelPercent: number;
  fuelLiters: number;
  adBluePercent?: number;
  vhiHealthScore: number; // 0-100 Vehicle Health Index
  assignedDriver: string;
  currentSite: string;
  wilayaCode: string;
  lastPingTime: string;
  activeDtcCode?: string;
  preventiveDueText: string;
  preventiveIsUrgent?: boolean;
}

// 52 Unités Réalistes Pré-Générées pour la Haute Densité (50+ Véhicules Supervisables)
const SEED_FLEET_UNITS: FleetUnitRecord[] = [
  {
    id: 'unit-001',
    registrationNumber: '00421-116-16',
    vin: 'VF624GPA00004128',
    make: 'Renault Trucks',
    model: 'K 480 6x4 Heavy Tipper',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Benne',
    status: 'MOTION',
    speedKmh: 74,
    engineRpm: 1420,
    engineHours: 4120,
    odometerKm: 284150,
    fuelLevelPercent: 68,
    fuelLiters: 272,
    adBluePercent: 82,
    vhiHealthScore: 88,
    assignedDriver: 'Mourad Benali',
    currentSite: 'Corridor RN1 Ghardaïa',
    wilayaCode: '47',
    lastPingTime: '12s',
    preventiveDueText: 'dans 1 850 km',
  },
  {
    id: 'unit-002',
    registrationNumber: '01892-116-16',
    vin: 'WDB9634031L89214',
    make: 'Mercedes-Benz',
    model: 'Actros 3340 6x4 S',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Tracteur',
    status: 'DTC_CRITICAL',
    speedKmh: 62,
    engineRpm: 1380,
    engineHours: 5890,
    odometerKm: 342900,
    fuelLevelPercent: 42,
    fuelLiters: 168,
    adBluePercent: 45,
    vhiHealthScore: 62,
    assignedDriver: 'Karim Bouzid',
    currentSite: 'Base Logistique Rouiba',
    wilayaCode: '16',
    lastPingTime: '8s',
    activeDtcCode: 'SPN-1087-FMI-1',
    preventiveDueText: 'DÉPASSÉ (-450 km)',
    preventiveIsUrgent: true,
  },
  {
    id: 'unit-003',
    registrationNumber: 'ENG-336-030',
    vin: 'CAT0336D2KL89123',
    make: 'Caterpillar',
    model: '336D2 L Hydraulic Excavator',
    category: 'CONSTRUCTION_BTP',
    categoryLabel: 'Pelle BTP',
    status: 'MOTION',
    speedKmh: 4,
    engineRpm: 1800,
    engineHours: 6420,
    odometerKm: 0,
    fuelLevelPercent: 85,
    fuelLiters: 520,
    vhiHealthScore: 79,
    assignedDriver: 'Lakhdar Mansouri',
    currentSite: 'Chantier Sud Hassi Messaoud',
    wilayaCode: '30',
    lastPingTime: '18s',
    preventiveDueText: 'dans 18h (PM2)',
    preventiveIsUrgent: true,
  },
  {
    id: 'unit-004',
    registrationNumber: '08342-119-09',
    vin: 'VF1MA00045812903',
    make: 'Renault',
    model: 'Master III 2.3 dCi 135 L3H2',
    category: 'LIGHT_COMMERCIAL',
    categoryLabel: 'Fourgon VUL',
    status: 'PARKED_OFF',
    speedKmh: 0,
    engineRpm: 0,
    engineHours: 1980,
    odometerKm: 114200,
    fuelLevelPercent: 54,
    fuelLiters: 56,
    vhiHealthScore: 94,
    assignedDriver: 'Yacine Taleb',
    currentSite: 'Dépôt Central Blida',
    wilayaCode: '09',
    lastPingTime: '4m',
    preventiveDueText: 'dans 5 800 km',
  },
  {
    id: 'unit-005',
    registrationNumber: '02319-122-31',
    vin: 'YS2R450A00284711',
    make: 'Scania',
    model: 'R 450 Highline Streamline',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Frigo',
    status: 'MOTION',
    speedKmh: 78,
    engineRpm: 1250,
    engineHours: 6100,
    odometerKm: 412000,
    fuelLevelPercent: 79,
    fuelLiters: 395,
    adBluePercent: 90,
    vhiHealthScore: 84,
    assignedDriver: 'Sofiane Hamidi',
    currentSite: 'Autoroute Est-Ouest Oran',
    wilayaCode: '31',
    lastPingTime: '6s',
    preventiveDueText: 'dans 3 200 km',
  },
  {
    id: 'unit-006',
    registrationNumber: 'ENG-950-016',
    vin: 'CAT0950GCL441829',
    make: 'Caterpillar',
    model: '950 GC Wheel Loader',
    category: 'CONSTRUCTION_BTP',
    categoryLabel: 'Chargeuse BTP',
    status: 'IDLE_WARNING',
    speedKmh: 0,
    engineRpm: 920,
    engineHours: 4890,
    odometerKm: 0,
    fuelLevelPercent: 62,
    fuelLiters: 186,
    vhiHealthScore: 81,
    assignedDriver: 'Ahmed Belkacem',
    currentSite: 'Carrière Oued Smar',
    wilayaCode: '16',
    lastPingTime: '22s',
    preventiveDueText: 'dans 45h (PM1)',
  },
  {
    id: 'unit-007',
    registrationNumber: '05519-115-30',
    vin: 'JTE2GD2400918234',
    make: 'Toyota',
    model: 'Hilux Double Cab 2.4 D-4D 4x4',
    category: 'LIGHT_COMMERCIAL',
    categoryLabel: 'Pick-up 4x4',
    status: 'MOTION',
    speedKmh: 88,
    engineRpm: 2100,
    engineHours: 3200,
    odometerKm: 148900,
    fuelLevelPercent: 71,
    fuelLiters: 57,
    vhiHealthScore: 91,
    assignedDriver: 'Samir Chaoui',
    currentSite: 'Piste Rassi Haoud Berkaoui',
    wilayaCode: '30',
    lastPingTime: '15s',
    preventiveDueText: 'dans 1 100 km',
  },
  {
    id: 'unit-008',
    registrationNumber: '09124-118-23',
    vin: 'LZG1843000412891',
    make: 'Shacman',
    model: 'X3000 6x4 430 HP Tractor',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Benne',
    status: 'MOTION',
    speedKmh: 68,
    engineRpm: 1450,
    engineHours: 3780,
    odometerKm: 210400,
    fuelLevelPercent: 33,
    fuelLiters: 132,
    vhiHealthScore: 77,
    assignedDriver: 'Rachid Mebarki',
    currentSite: 'Zone Portuaire Annaba',
    wilayaCode: '23',
    lastPingTime: '30s',
    preventiveDueText: 'dans 890 km',
  },
  {
    id: 'unit-009',
    registrationNumber: 'ENG-PC210-025',
    vin: 'KMT0PC210KL55129',
    make: 'Komatsu',
    model: 'PC210-10M0 Crawler Excavator',
    category: 'CONSTRUCTION_BTP',
    categoryLabel: 'Pelle BTP',
    status: 'PARKED_OFF',
    speedKmh: 0,
    engineRpm: 0,
    engineHours: 5120,
    odometerKm: 0,
    fuelLevelPercent: 44,
    fuelLiters: 176,
    vhiHealthScore: 86,
    assignedDriver: 'Mustapha Ziane',
    currentSite: 'Chantier Viaduc Constantine',
    wilayaCode: '25',
    lastPingTime: '12m',
    preventiveDueText: 'dans 80h (PM3)',
  },
  {
    id: 'unit-010',
    registrationNumber: '01192-120-16',
    vin: 'VF624GPA00005892',
    make: 'Renault Trucks',
    model: 'T 480 Optidriver Sleeper',
    category: 'HEAVY_TRUCK',
    categoryLabel: 'PL Tracteur',
    status: 'MOTION',
    speedKmh: 81,
    engineRpm: 1220,
    engineHours: 4600,
    odometerKm: 312400,
    fuelLevelPercent: 88,
    fuelLiters: 440,
    adBluePercent: 95,
    vhiHealthScore: 92,
    assignedDriver: 'Abdelkader Rahal',
    currentSite: 'Liaison Alger - Sétif RN5',
    wilayaCode: '19',
    lastPingTime: '5s',
    preventiveDueText: 'dans 7 600 km',
  },
  // Génération complémentaire de 42 unités réalistes (Total = 52)
  ...Array.from({ length: 42 }).map((_, idx) => {
    const unitIndex = idx + 11;
    const isBtp = unitIndex % 3 === 0;
    const isVul = unitIndex % 5 === 0;
    const isCritical = unitIndex === 14 || unitIndex === 28;
    const isIdle = unitIndex === 17 || unitIndex === 33;
    const isMotion = !isCritical && !isIdle && unitIndex % 2 === 0;

    const wilayas = ['16', '30', '31', '09', '25', '23', '47', '39', '05'];
    const wilaya = wilayas[unitIndex % wilayas.length];

    const category = isBtp
      ? ('CONSTRUCTION_BTP' as const)
      : isVul
        ? ('LIGHT_COMMERCIAL' as const)
        : ('HEAVY_TRUCK' as const);

    const make = isBtp
      ? unitIndex % 2 === 0
        ? 'Caterpillar'
        : 'Komatsu'
      : isVul
        ? 'Toyota'
        : unitIndex % 2 === 0
          ? 'Renault Trucks'
          : 'Scania';

    const model = isBtp
      ? 'Pelle Hydraulique BTP'
      : isVul
        ? 'Hilux 2.4 D-4D'
        : 'Tracteur 6x4 Routier';

    return {
      id: `unit-${String(unitIndex).padStart(3, '0')}`,
      registrationNumber: isBtp
        ? `ENG-BTP-${String(unitIndex).padStart(3, '0')}`
        : `${String(1000 + unitIndex * 37).padStart(5, '0')}-121-${wilaya}`,
      vin: `VIN${make.substring(0, 3).toUpperCase()}${1000000000 + unitIndex * 4821}`,
      make,
      model,
      category,
      categoryLabel: isBtp ? 'Engin BTP' : isVul ? 'Pick-up VUL' : 'Poids Lourd',
      status: isCritical
        ? ('DTC_CRITICAL' as const)
        : isIdle
          ? ('IDLE_WARNING' as const)
          : isMotion
            ? ('MOTION' as const)
            : ('PARKED_OFF' as const),
      speedKmh: isMotion ? 65 + (unitIndex % 25) : 0,
      engineRpm: isMotion ? 1350 + (unitIndex % 300) : isIdle ? 850 : 0,
      engineHours: 1200 + unitIndex * 95,
      odometerKm: isBtp ? 0 : 85000 + unitIndex * 5400,
      fuelLevelPercent: 20 + ((unitIndex * 17) % 75),
      fuelLiters: 50 + ((unitIndex * 22) % 350),
      vhiHealthScore: isCritical ? 55 + (unitIndex % 10) : 80 + (unitIndex % 18),
      assignedDriver: `Conducteur ${unitIndex}`,
      currentSite: isBtp
        ? `Chantier Sud Wilaya ${wilaya}`
        : `Corridor Fret RN${(unitIndex % 5) + 1}`,
      wilayaCode: wilaya,
      lastPingTime: `${(unitIndex % 45) + 2}s`,
      activeDtcCode: isCritical ? `SPN-${100 + unitIndex}-FMI-0` : undefined,
      preventiveDueText: isCritical
        ? 'DÉPASSÉ (-15h)'
        : `dans ${800 + (unitIndex % 4000)} ${isBtp ? 'h' : 'km'}`,
      preventiveIsUrgent: isCritical,
    };
  }),
];

interface FleetHighDensityTableProps {
  onSelectUnit?: (unit: FleetUnitRecord) => void;
  onOpenWorkOrder?: (unit: FleetUnitRecord) => void;
}

export function FleetHighDensityTable({
  onSelectUnit,
  onOpenWorkOrder,
}: FleetHighDensityTableProps) {
  const [units] = useState<FleetUnitRecord[]>(SEED_FLEET_UNITS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | FleetUnitRecord['category']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VehicleOperationalStatus>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtrage combiné haute performance
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (categoryFilter !== 'ALL' && u.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesReg = u.registrationNumber.toLowerCase().includes(q);
        const matchesVin = u.vin.toLowerCase().includes(q);
        const matchesMake = u.make.toLowerCase().includes(q);
        const matchesDriver = u.assignedDriver.toLowerCase().includes(q);
        const matchesSite = u.currentSite.toLowerCase().includes(q);
        if (!matchesReg && !matchesVin && !matchesMake && !matchesDriver && !matchesSite) {
          return false;
        }
      }
      return true;
    });
  }, [units, categoryFilter, statusFilter, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUnits.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUnits.map((u) => u.id)));
    }
  };

  const toggleSelectUnit = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const renderStatusDotAndBadge = (status: VehicleOperationalStatus, speedKmh: number) => {
    switch (status) {
      case 'MOTION':
        return (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: 'var(--df-status-ok-bg)',
              border: '1px solid var(--df-status-ok-border)',
              color: 'var(--df-status-ok-text)',
              fontSize: '11px',
              fontFamily: 'var(--df-font-mono)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--df-status-ok)' }}
            />
            <span>EN ROUTE ({speedKmh} km/h)</span>
          </div>
        );
      case 'IDLE_WARNING':
        return (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] font-medium font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: 'var(--df-status-warning-bg)',
              border: '1px solid var(--df-status-warning-border)',
              color: 'var(--df-status-warning-text)',
              fontSize: '11px',
              fontFamily: 'var(--df-font-mono)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-500"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--df-status-warning)' }}
            />
            <span>RALENTI EXCÉDENT</span>
          </div>
        );
      case 'DTC_CRITICAL':
        return (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-[11px] font-semibold font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: 'var(--df-status-danger-bg)',
              border: '1px solid var(--df-status-danger-border)',
              color: 'var(--df-status-danger-text)',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--df-font-mono)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--df-status-danger)' }}
            />
            <span>DTC MOTEUR CRITIQUE</span>
          </div>
        );
      case 'PARKED_OFF':
        return (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-secondary)',
              fontSize: '11px',
              fontFamily: 'var(--df-font-mono)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-slate-400"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--df-text-muted)' }}
            />
            <span>ARRÊT / STATIONNÉ</span>
          </div>
        );
      default:
        return (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: 'var(--df-bg-surface-2)',
              color: 'var(--df-text-muted)',
              fontSize: '11px',
              fontFamily: 'var(--df-font-mono)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-slate-400"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--df-text-muted)' }}
            />
            <span>HORS RÉSEAU</span>
          </div>
        );
    }
  };

  const renderHealthScoreGauge = (score: number) => {
    const isGood = score >= 80;
    const isWarn = score >= 65 && score < 80;
    const colorClass = isGood
      ? 'bg-emerald-500'
      : isWarn
        ? 'bg-amber-500'
        : 'bg-rose-500';
    const textClass = isGood
      ? 'text-emerald-700 dark:text-emerald-400'
      : isWarn
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-rose-700 dark:text-rose-400';
    const gaugeColor = isGood
      ? 'var(--df-status-ok)'
      : isWarn
        ? 'var(--df-status-warning)'
        : 'var(--df-status-danger)';

    return (
      <div
        className="flex items-center gap-2 min-w-[90px]"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '90px' }}
      >
        <div
          className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
          style={{
            flex: 1,
            height: '6px',
            background: 'var(--df-bg-surface-3)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            className={`h-full ${colorClass} rounded-full`}
            style={{ width: `${Math.min(100, score)}%`, height: '100%', background: gaugeColor, borderRadius: '9999px' }}
          />
        </div>
        <span
          className={`text-[11px] font-mono font-semibold tabular-nums ${textClass}`}
          style={{ fontSize: '11px', fontFamily: 'var(--df-font-mono)', fontWeight: 700, color: gaugeColor }}
        >
          {score}
        </span>
      </div>
    );
  };

  const renderFuelGauge = (percent: number, liters: number) => {
    const isLow = percent < 25;
    const barClass = isLow ? 'bg-rose-500' : percent < 40 ? 'bg-amber-500' : 'bg-blue-600';
    const barColor = isLow
      ? 'var(--df-status-danger)'
      : percent < 40
        ? 'var(--df-status-warning)'
        : 'var(--df-accent-blue)';

    return (
      <div
        className="flex flex-col gap-0.5 min-w-[85px]"
        style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '85px' }}
      >
        <div
          className="flex justify-between items-center text-[10.5px] font-mono text-slate-600 dark:text-slate-400 tabular-nums"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10.5px',
            fontFamily: 'var(--df-font-mono)',
            color: 'var(--df-text-secondary)',
          }}
        >
          <span className="font-semibold">{percent}%</span>
          <span className="text-[9.5px] text-slate-400" style={{ fontSize: '9.5px', color: 'var(--df-text-muted)' }}>
            {liters}L
          </span>
        </div>
        <div
          className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
          style={{
            width: '100%',
            height: '6px',
            background: 'var(--df-bg-surface-3)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            className={`h-full ${barClass} rounded-full`}
            style={{ width: `${Math.min(100, percent)}%`, height: '100%', background: barColor, borderRadius: '9999px' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1F2937] rounded-lg shadow-2xs flex flex-col overflow-hidden"
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        boxShadow: 'var(--df-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 1. BARRE DE COMMANDE HAUTE DENSITÉ (FILTRES, RECHERCHE, EXPORT) */}
      <div className="p-2.5 px-3 border-b border-slate-200 dark:border-[#1F2937] flex items-center justify-between gap-3 flex-wrap bg-slate-50/60 dark:bg-[#0D121F]">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          {/* RECHERCHE INSTANTANÉE */}
          <div className="relative flex-1 max-w-[340px]">
            <input
              type="text"
              placeholder="Recherche matricule, VIN, chauffeur, site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded-md pl-8 pr-3 py-1 text-[12px] text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600 transition-colors font-sans placeholder:text-slate-400"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
              <IconSearch size={14} strokeWidth={1.75} />
            </span>
          </div>

          {/* SÉLECTEUR CATÉGORIE TECHNIQUE */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | FleetUnitRecord['category'])}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded-md px-2.5 py-1 text-[11.5px] text-slate-700 dark:text-slate-200 font-medium outline-none cursor-pointer focus:border-blue-600"
          >
            <option value="ALL">Toutes Catégories (52)</option>
            <option value="HEAVY_TRUCK">Poids Lourds Routiers & Chantier</option>
            <option value="CONSTRUCTION_BTP">Engins BTPH & Carrières</option>
            <option value="LIGHT_COMMERCIAL">Utilitaires VUL & Pick-ups</option>
          </select>

          {/* SÉLECTEUR STATUT OPÉRATIONNEL */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | FleetUnitRecord['status'])}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded-md px-2.5 py-1 text-[11.5px] text-slate-700 dark:text-slate-200 font-medium outline-none cursor-pointer focus:border-blue-600"
          >
            <option value="ALL">Tous les Statuts</option>
            <option value="MOTION">En mouvement</option>
            <option value="IDLE_WARNING">Ralenti excessif</option>
            <option value="DTC_CRITICAL">DTC Moteur critique</option>
            <option value="PARKED_OFF">Stationné / Contact coupé</option>
          </select>
        </div>

        {/* ACTIONS SECONDAIRES DROITE */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums px-2">
            {filteredUnits.length} / {units.length} unités actives
          </span>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-[11.5px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Exporter la sélection en CSV/Excel"
          >
            <IconDownload size={13} strokeWidth={1.75} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* 2. TABLE HAUTE DENSITÉ AVEC HEADER STICKY */}
      <div
        className="overflow-x-auto max-h-[calc(100vh-270px)]"
        style={{
          overflowX: 'auto',
          maxHeight: 'calc(100vh - 270px)',
          width: '100%',
        }}
      >
        <table
          className="w-full text-left border-collapse select-text"
          style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
        >
          {/* EN-TÊTE STICKY ULTRA-COMPACT */}
          <thead
            className="sticky top-0 bg-slate-50/95 dark:bg-[#111827]/95 backdrop-blur z-10 border-b border-slate-200 dark:border-[#1F2937]"
            style={{
              position: 'sticky',
              top: 0,
              background: 'var(--df-bg-surface-2)',
              borderBottom: '1px solid var(--df-border-subtle)',
              zIndex: 10,
            }}
          >
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredUnits.length && filteredUnits.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3">Statut Télématique</th>
              <th className="py-2.5 px-3">Matricule & VIN</th>
              <th className="py-2.5 px-3">Véhicule / Engin BTP</th>
              <th className="py-2.5 px-3 text-right">Compteur / Horamètre</th>
              <th className="py-2.5 px-3">Niveau Jauge</th>
              <th className="py-2.5 px-3">Santé VHI</th>
              <th className="py-2.5 px-3">Conducteur</th>
              <th className="py-2.5 px-3">Localisation & Wilaya</th>
              <th className="py-2.5 px-3">Échéance Entretien</th>
              <th className="py-2.5 px-3 w-10 text-center">Action</th>
            </tr>
          </thead>

          {/* CORPS DE TABLEAU HAUTE DENSITÉ */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[12px]">
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 font-mono text-[11.5px]">
                  Aucune unité ne correspond aux critères de filtre sélectionnés.
                </td>
              </tr>
            ) : (
              filteredUnits.map((u) => {
                const isSelected = selectedIds.has(u.id);

                return (
                  <tr
                    key={u.id}
                    onClick={() => onSelectUnit && onSelectUnit(u)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                  >
                    {/* CHECKBOX */}
                    <td
                      className="py-2 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectUnit(u.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* STATUT TÉLÉMÉTRIQUE */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {renderStatusDotAndBadge(u.status, u.speedKmh)}
                    </td>

                    {/* MATRICULE MONOSPACE & VIN */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-[12px] tabular-nums tracking-tight">
                        {u.registrationNumber}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[130px]">
                        {u.vin}
                      </div>
                    </td>

                    {/* MARQUE / MODÈLE & BADGE CATÉGORIE */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {u.make} {u.model}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {u.categoryLabel}
                        </span>
                      </div>
                    </td>

                    {/* COMPTEUR HORAMÈTRE / KM */}
                    <td className="py-2 px-3 text-right whitespace-nowrap font-mono tabular-nums">
                      {u.category === 'CONSTRUCTION_BTP' ? (
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {u.engineHours.toLocaleString('fr-FR')} <span className="text-[10px] text-slate-400">h</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {u.odometerKm.toLocaleString('fr-FR')} <span className="text-[10px] text-slate-400">km</span>
                        </span>
                      )}
                    </td>

                    {/* NIVEAU JAUGE CARBURANT */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {renderFuelGauge(u.fuelLevelPercent, u.fuelLiters)}
                    </td>

                    {/* SANTÉ VHI */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {renderHealthScoreGauge(u.vhiHealthScore)}
                    </td>

                    {/* CHAUFFEUR */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                      {u.assignedDriver}
                    </td>

                    {/* SITE / WILAYA */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                        {u.currentSite}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        Wilaya {u.wilayaCode} • il y a {u.lastPingTime}
                      </div>
                    </td>

                    {/* PROCHAINE ÉCHÉANCE */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${u.preventiveIsUrgent
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900'
                          : 'text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        {u.preventiveDueText}
                      </span>
                    </td>

                    {/* MENU ACTIONS */}
                    <td
                      className="py-2 px-3 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenWorkOrder && onOpenWorkOrder(u)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                        title="Actions rapides sur l'actif"
                      >
                        <IconMoreHorizontal size={15} strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. FOOTER HAUTE DENSITÉ AVEC STATS DE FLOTTE */}
      <div className="p-2.5 px-3 border-t border-slate-200 dark:border-[#1F2937] bg-slate-50/60 dark:bg-[#0D121F] flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>28 En Mouvement</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>4 Ralenti</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>2 DTC Actifs</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>18 Arrêtés</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>Taux DTO : <strong>94.6%</strong></span>
          <span>•</span>
          <span>Norme SAE J1939 / ANPDP 18-07</span>
        </div>
      </div>
    </div>
  );
}
