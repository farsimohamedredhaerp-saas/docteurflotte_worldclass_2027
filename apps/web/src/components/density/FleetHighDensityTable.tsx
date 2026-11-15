'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  IconSearch,
  IconDownload,
  IconMoreHorizontal,
  IconTruck,
  IconCheck,
  IconAlertTriangle,
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
  vhiStatus?: string;
  bottleneckComponent?: string;
  assignedDriver: string;
  currentSite: string;
  wilayaCode: string;
  lastPingTime: string;
  activeDtcCode?: string;
  preventiveDueText: string;
  preventiveIsUrgent?: boolean;
}

export interface FleetHighDensityTableProps {
  units?: FleetUnitRecord[];
  isLoading?: boolean;
  onSelectUnit?: (unit: FleetUnitRecord) => void;
  onOpenWorkOrder?: (unit: FleetUnitRecord) => void;
}

export function FleetHighDensityTable({
  units = [],
  isLoading = false,
  onSelectUnit,
  onOpenWorkOrder,
}: FleetHighDensityTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | FleetUnitRecord['category']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VehicleOperationalStatus>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [density, setDensity] = useState<'compact' | 'comfort'>('comfort');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Statistiques calculées dynamiquement
  const stats = useMemo(() => {
    const motion = units.filter((u) => u.status === 'MOTION').length;
    const idle = units.filter((u) => u.status === 'IDLE_WARNING').length;
    const dtc = units.filter((u) => u.status === 'DTC_CRITICAL').length;
    const parked = units.filter((u) => u.status === 'PARKED_OFF' || u.status === 'OFFLINE').length;
    const dtoRate = units.length > 0 ? (((units.length - dtc) / units.length) * 100).toFixed(1) : '100';
    return { motion, idle, dtc, parked, dtoRate };
  }, [units]);

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

  // Pagination pour grandes flottes (> 25 lignes)
  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const paginatedUnits = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUnits.slice(start, start + pageSize);
  }, [filteredUnits, page]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedUnits.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedUnits.map((u) => u.id)));
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
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-ok-bg)] border border-[var(--df-status-ok-border)] text-[var(--df-status-ok-text)] text-[11px] font-medium font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="df-point-nominal relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--df-status-ok)]" />
            </span>
            <span>EN ROUTE ({speedKmh} km/h)</span>
          </div>
        );
      case 'IDLE_WARNING':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-warning-bg)] border border-[var(--df-status-warning-border)] text-[var(--df-status-warning-text)] text-[11px] font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--df-status-warning)]" />
            <span>RALENTI EXCÉDENT</span>
          </div>
        );
      case 'DTC_CRITICAL':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-status-danger-bg)] border border-[var(--df-status-danger-border)] text-[var(--df-status-danger-text)] text-[11px] font-semibold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--df-status-danger)]" />
            <span>DTC MOTEUR CRITIQUE</span>
          </div>
        );
      case 'PARKED_OFF':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] text-[var(--df-text-secondary)] text-[11px] font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--df-text-muted)]" />
            <span>ARRÊT / STATIONNÉ</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-bg-surface-2)] border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--df-text-muted)]" />
            <span>HORS RÉSEAU</span>
          </div>
        );
    }
  };

  const renderHealthScoreGauge = (score: number, vhiStatus?: string, bottleneck?: string) => {
    const isCritVeto = vhiStatus === 'CRITIQUE_VETO' || score <= 35;
    const isGood = score >= 80 && !isCritVeto;
    const isWarn = score >= 65 && score < 80 && !isCritVeto;

    const gaugeColor = isCritVeto
      ? 'var(--df-status-danger)'
      : isGood
      ? 'var(--df-status-ok)'
      : isWarn
      ? 'var(--df-status-warning)'
      : 'var(--df-status-danger)';

    const textClass = isCritVeto
      ? 'text-[var(--df-status-danger-text)] font-bold'
      : isGood
      ? 'text-[var(--df-status-ok-text)]'
      : isWarn
      ? 'text-[var(--df-status-warning-text)]'
      : 'text-[var(--df-status-danger-text)]';

    return (
      <div className="flex items-center gap-2 min-w-[90px]">
        <div className="flex-1 h-1.5 bg-[var(--df-bg-surface-3)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-[var(--df-dur-slow,320ms)] ease-[var(--df-ease-out-quint)]"
            style={{ width: `${Math.min(100, score)}%`, backgroundColor: gaugeColor }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[11px] font-mono font-bold tabular-nums ${textClass}`}
            title={bottleneck ? `Goulot : ${bottleneck}` : undefined}
          >
            {score}
          </span>
          {isCritVeto && (
            <span
              className="text-[8px] font-mono px-1 py-0.2 rounded-[var(--df-radius-xs,4px)] font-bold text-white bg-[var(--df-status-danger)]"
              title="VETO SÉCURITÉ ACTIF (Hard Veto)"
            >
              VETO
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderFuelGauge = (percent: number, liters: number) => {
    const isLow = percent < 25;
    const barColor = isLow
      ? 'var(--df-status-danger)'
      : percent < 40
      ? 'var(--df-status-warning)'
      : 'var(--df-accent-blue)';

    return (
      <div className="flex flex-col gap-0.5 min-w-[85px]">
        <div className="flex justify-between items-center text-[10.5px] font-mono text-[var(--df-text-secondary)] tabular-nums">
          <span className="font-semibold">{percent}%</span>
          <span className="text-[9.5px] text-[var(--df-text-muted)]">{liters}L</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--df-bg-surface-3)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-[var(--df-dur-slow,320ms)] ease-[var(--df-ease-out-quint)]"
            style={{ width: `${Math.min(100, percent)}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
    );
  };

  const rowPaddingClass = density === 'compact' ? 'py-1.5' : 'py-2.5';

  return (
    <div className="rounded-[var(--df-radius-lg,10px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] shadow-[var(--df-shadow-sm)] flex flex-col overflow-hidden relative">
      {/* 1. BARRE DE COMMANDE HAUTE DENSITÉ (FILTRES, RECHERCHE, DENSITÉ, EXPORT) */}
      <div className="p-3 border-b border-[var(--df-border-subtle)] flex items-center justify-between gap-3 flex-wrap bg-[var(--df-bg-surface-2)]">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          {/* Recherche Instantanée */}
          <div className="relative flex-1 max-w-[340px]">
            <input
              type="text"
              placeholder="Recherche matricule, VIN, chauffeur, site..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] rounded-[var(--df-radius-sm,6px)] pl-8 pr-3 py-1 text-[12px] text-[var(--df-text-main)] outline-none focus:border-[var(--df-border-focus)] transition-colors font-sans placeholder:text-[var(--df-text-muted)]"
            />
            <span className="absolute left-2.5 top-2 text-[var(--df-text-muted)] pointer-events-none">
              <IconSearch size={14} strokeWidth={1.75} />
            </span>
          </div>

          {/* Filtre Catégorie */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as 'ALL' | FleetUnitRecord['category']);
              setPage(1);
            }}
            className="bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] rounded-[var(--df-radius-sm,6px)] px-2.5 py-1 text-[11.5px] text-[var(--df-text-main)] font-medium outline-none cursor-pointer focus:border-[var(--df-border-focus)]"
          >
            <option value="ALL">Toutes Catégories</option>
            <option value="HEAVY_TRUCK">Poids Lourds Routiers &amp; Chantier</option>
            <option value="CONSTRUCTION_BTP">Engins BTPH &amp; Carrières</option>
            <option value="LIGHT_COMMERCIAL">Utilitaires VUL &amp; Pick-ups</option>
          </select>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'ALL' | FleetUnitRecord['status']);
              setPage(1);
            }}
            className="bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] rounded-[var(--df-radius-sm,6px)] px-2.5 py-1 text-[11.5px] text-[var(--df-text-main)] font-medium outline-none cursor-pointer focus:border-[var(--df-border-focus)]"
          >
            <option value="ALL">Tous les Statuts</option>
            <option value="MOTION">En mouvement</option>
            <option value="IDLE_WARNING">Ralenti excessif</option>
            <option value="DTC_CRITICAL">DTC Moteur critique</option>
            <option value="PARKED_OFF">Stationné / Contact coupé</option>
          </select>
        </div>

        {/* Contrôles Secondaires : Densité & Export */}
        <div className="flex items-center gap-2">
          {/* Toggle Densité §7.1 */}
          <div className="inline-flex rounded-[var(--df-radius-sm,6px)] border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-1)] p-0.5 text-[10.5px] font-mono">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] font-semibold transition-colors ${
                density === 'compact'
                  ? 'bg-[var(--df-accent-blue)] text-white'
                  : 'text-[var(--df-text-secondary)] hover:text-[var(--df-text-main)]'
              }`}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfort')}
              className={`px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] font-semibold transition-colors ${
                density === 'comfort'
                  ? 'bg-[var(--df-accent-blue)] text-white'
                  : 'text-[var(--df-text-secondary)] hover:text-[var(--df-text-main)]'
              }`}
            >
              Confort
            </button>
          </div>

          <span className="text-[11px] font-mono text-[var(--df-text-muted)] tabular-nums px-1">
            {filteredUnits.length} unité{filteredUnits.length > 1 ? 's' : ''}
          </span>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] text-[var(--df-text-secondary)] hover:text-[var(--df-text-main)] rounded-[var(--df-radius-sm,6px)] text-[11.5px] font-medium transition-colors"
            title="Exporter la sélection en CSV/Excel"
          >
            <IconDownload size={13} strokeWidth={1.75} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* 2. TABLE HAUTE DENSITÉ AVEC HEADER STICKY */}
      <div className="overflow-x-auto max-h-[calc(100vh-270px)]">
        <table className="w-full text-left border-collapse select-text">
          {/* En-tête Sticky */}
          <thead className="sticky top-0 bg-[var(--df-bg-surface-2)] border-b border-[var(--df-border-subtle)] z-[var(--df-z-sticky,10)] backdrop-blur-md">
            <tr className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--df-text-muted)] font-mono">
              <th className="py-2 px-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginatedUnits.length && paginatedUnits.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-[var(--df-border-subtle)] text-[var(--df-accent-blue)] focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-2 px-3">Statut Télématique</th>
              <th className="py-2 px-3">Matricule &amp; VIN</th>
              <th className="py-2 px-3">Véhicule / Engin BTP</th>
              <th className="py-2 px-3 text-right">Compteur / Horamètre</th>
              <th className="py-2 px-3">Niveau Jauge</th>
              <th className="py-2 px-3">Santé VHI</th>
              <th className="py-2 px-3">Conducteur</th>
              <th className="py-2 px-3">Localisation &amp; Wilaya</th>
              <th className="py-2 px-3">Échéance Entretien</th>
              <th className="py-2 px-3 w-10 text-center">Action</th>
            </tr>
          </thead>

          {/* Corps de Tableau */}
          <tbody className="divide-y divide-[var(--df-border-subtle)] text-[12px]">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-16 text-center text-[var(--df-text-muted)] font-mono text-[11.5px]">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[var(--df-accent-blue)] border-r-transparent align-[-0.125em] mb-2" />
                  <p>Chargement des unités de flotte...</p>
                </td>
              </tr>
            ) : units.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center p-6 max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-[var(--df-bg-surface-2)] text-[var(--df-text-muted)] flex items-center justify-center mb-3">
                      <IconTruck size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-[var(--df-text-main)] mb-1">
                      Aucun véhicule ou engin dans votre organisation
                    </h4>
                    <p className="text-xs text-[var(--df-text-muted)] mb-4 leading-relaxed">
                      Votre parc est actuellement vierge. Démarrez en ajoutant votre premier actif avec la fiche constructeur OEM ou en important un relevé Naftal (Mode 0).
                    </p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      <Link
                        href="/assets"
                        className="px-3.5 py-1.5 bg-[var(--df-accent-blue)] hover:bg-[var(--df-accent-blue-hover)] text-white rounded-[var(--df-radius-sm,6px)] text-xs font-semibold transition-colors"
                      >
                        Ajouter un Véhicule
                      </Link>
                      <Link
                        href="/fuel-scanner"
                        className="px-3.5 py-1.5 bg-[var(--df-bg-surface-2)] text-[var(--df-text-main)] border border-[var(--df-border-subtle)] rounded-[var(--df-radius-sm,6px)] text-xs font-semibold transition-colors"
                      >
                        Scanner Reçu Naftal
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredUnits.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-[var(--df-text-muted)] font-mono text-[11.5px]">
                  Aucune unité ne correspond aux critères de filtre sélectionnés.
                </td>
              </tr>
            ) : (
              paginatedUnits.map((u) => {
                const isSelected = selectedIds.has(u.id);

                return (
                  <tr
                    key={u.id}
                    onClick={() => onSelectUnit && onSelectUnit(u)}
                    className={`hover:bg-[var(--df-bg-surface-2)] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[var(--df-accent-blue-subtle)]' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className={`${rowPaddingClass} px-3 text-center`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectUnit(u.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-[var(--df-border-subtle)] text-[var(--df-accent-blue)] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Statut Télématique */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap`}>
                      {renderStatusDotAndBadge(u.status, u.speedKmh)}
                    </td>

                    {/* Matricule & VIN */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap`}>
                      <div className="font-mono font-semibold text-[var(--df-text-main)] text-[12px] tabular-nums tracking-tight">
                        {u.registrationNumber}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--df-text-muted)] truncate max-w-[130px]">
                        {u.vin}
                      </div>
                    </td>

                    {/* Marque / Modèle */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap`}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[var(--df-text-main)]">
                          {u.make} {u.model}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-[var(--df-radius-xs,4px)] text-[9.5px] font-mono font-medium bg-[var(--df-bg-surface-2)] text-[var(--df-text-secondary)] border border-[var(--df-border-subtle)]">
                          {u.categoryLabel}
                        </span>
                      </div>
                    </td>

                    {/* Horamètre / Odomètre */}
                    <td className={`${rowPaddingClass} px-3 text-right whitespace-nowrap font-mono tabular-nums`}>
                      {u.category === 'CONSTRUCTION_BTP' ? (
                        <span className="font-semibold text-[var(--df-text-main)]">
                          {u.engineHours.toLocaleString('fr-FR')} <span className="text-[10px] text-[var(--df-text-muted)]">h</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-[var(--df-text-main)]">
                          {u.odometerKm.toLocaleString('fr-FR')} <span className="text-[10px] text-[var(--df-text-muted)]">km</span>
                        </span>
                      )}
                    </td>

                    {/* Jauge Carburant */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap`}>
                      {renderFuelGauge(u.fuelLevelPercent, u.fuelLiters)}
                    </td>

                    {/* Santé VHI */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap`}>
                      {renderHealthScoreGauge(u.vhiHealthScore, u.vhiStatus, u.bottleneckComponent)}
                    </td>

                    {/* Conducteur */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap text-[var(--df-text-secondary)] font-medium`}>
                      {u.assignedDriver}
                    </td>

                    {/* Site & Wilaya */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap`}>
                      <div className="text-[var(--df-text-main)] truncate max-w-[170px]">
                        {u.currentSite}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--df-text-muted)]">
                        Wilaya {u.wilayaCode} • il y a {u.lastPingTime}
                      </div>
                    </td>

                    {/* Échéance Entretien */}
                    <td className={`${rowPaddingClass} px-3 whitespace-nowrap`}>
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded-[var(--df-radius-xs,4px)] ${
                          u.preventiveIsUrgent
                            ? 'bg-[var(--df-status-danger-bg)] text-[var(--df-status-danger-text)] font-semibold border border-[var(--df-status-danger-border)]'
                            : 'text-[var(--df-text-secondary)]'
                        }`}
                      >
                        {u.preventiveDueText}
                      </span>
                    </td>

                    {/* Action */}
                    <td
                      className={`${rowPaddingClass} px-3 text-center whitespace-nowrap`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenWorkOrder && onOpenWorkOrder(u)}
                        className="p-1 hover:bg-[var(--df-bg-surface-3)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] rounded-[var(--df-radius-xs,4px)] transition-colors"
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

      {/* 3. FOOTER HAUTE DENSITÉ AVEC STATS DE FLOTTE & PAGINATION */}
      <div className="p-2.5 px-3 border-t border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-2)] flex items-center justify-between text-[11px] text-[var(--df-text-secondary)] font-mono flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--df-status-ok)]" />
            <span>{stats.motion} En Mouvement</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--df-status-warning)]" />
            <span>{stats.idle} Ralenti</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--df-status-danger)]" />
            <span>{stats.dtc} DTC Actif{stats.dtc > 1 ? 's' : ''}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--df-text-muted)]" />
            <span>{stats.parked} Arrêté{stats.parked > 1 ? 's' : ''}</span>
          </span>
        </div>

        {/* Contrôles de Pagination pour flottes > 25 */}
        <div className="flex items-center gap-3">
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--df-bg-surface-3)]"
              >
                Précédent
              </button>
              <span className="tabular-nums px-1">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-0.5 rounded-[var(--df-radius-xs,4px)] bg-[var(--df-bg-surface-1)] border border-[var(--df-border-subtle)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--df-bg-surface-3)]"
              >
                Suivant
              </button>
            </div>
          )}

          <span>Taux DTO : <strong>{stats.dtoRate}%</strong></span>
          <span>•</span>
          <span>Norme SAE J1939 / ANPDP 18-07</span>
        </div>
      </div>
    </div>
  );
}
