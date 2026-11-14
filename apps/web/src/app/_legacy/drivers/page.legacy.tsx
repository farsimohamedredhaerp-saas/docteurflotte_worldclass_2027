'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDemoMode } from '@/context/DemoModeContext';
import { Navbar } from '@/components/navigation/Navbar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  IconTruck,
  IconShieldCheck,
  IconAlertTriangle,
  IconSearch,
  IconCheck,
  IconClock,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconUsers,
  IconFilter,
} from '@/components/navigation/TechIcons';

export interface DriverRecord {
  id: string;
  name: string;
  matriculeNumber: string;
  phone: string;
  licenseCategory: 'C1' | 'C2' | 'E' | 'D' | 'B' | 'BTP_ENGIN';
  licenseNumber: string;
  licenseExpiry: string;
  medicalCheckExpiry: string;
  assignedVehiclePlate: string;
  assignedVehicleModel: string;
  currentSiteOrCorridor: string;
  ecoDrivingScore: number;
  harshBrakingCount: number;
  excessiveIdleMinutes: number;
  status: 'ON_DUTY' | 'AVAILABLE' | 'REST' | 'LICENSE_WARNING';
}

export default function DriversPage() {
  const { isDemoMode } = useDemoMode();
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setIsLoading(true);
      import('@/lib/simulation-sandbox')
        .then((sandbox) => {
          setDrivers(sandbox.MOCK_SANDBOX_DRIVERS);
        })
        .finally(() => setIsLoading(false));
    } else {
      setDrivers([]);
      setIsLoading(false);
    }
  }, [isDemoMode]);

  // Modal CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [formState, setFormState] = useState<Partial<DriverRecord>>({
    name: '',
    matriculeNumber: '',
    phone: '',
    licenseCategory: 'E',
    licenseNumber: '',
    licenseExpiry: '',
    medicalCheckExpiry: '',
    assignedVehiclePlate: '',
    assignedVehicleModel: '',
    currentSiteOrCorridor: 'Base Centrale Rouiba',
    status: 'AVAILABLE',
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormState({
      name: '',
      matriculeNumber: `DRV-16-${Math.floor(100 + Math.random() * 900)}`,
      phone: '0550 ',
      licenseCategory: 'E',
      licenseNumber: 'DZ-16-',
      licenseExpiry: '',
      medicalCheckExpiry: '',
      assignedVehiclePlate: '',
      assignedVehicleModel: '',
      currentSiteOrCorridor: 'Base Rouiba (16)',
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: DriverRecord) => {
    setEditingDriver(driver);
    setFormState({ ...driver });
    setIsModalOpen(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDriver) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === editingDriver.id ? ({ ...d, ...formState } as DriverRecord) : d))
      );
      setNotification(`Fiche conducteur de ${formState.name} mise à jour avec succès.`);
    } else {
      const newDriver: DriverRecord = {
        id: `drv-${Date.now().toString().slice(-4)}`,
        name: formState.name || 'Nouveau Conducteur',
        matriculeNumber: formState.matriculeNumber || `DRV-DZ-${Date.now().toString().slice(-3)}`,
        phone: formState.phone || '0550 00 00 00',
        licenseCategory: (formState.licenseCategory as DriverRecord['licenseCategory']) || 'E',
        licenseNumber: formState.licenseNumber || 'DZ-16-000000',
        licenseExpiry: formState.licenseExpiry || '2028-12-31',
        medicalCheckExpiry: formState.medicalCheckExpiry || '2027-06-30',
        assignedVehiclePlate: formState.assignedVehiclePlate || 'Non Affecté',
        assignedVehicleModel: formState.assignedVehicleModel || 'Non Affecté',
        currentSiteOrCorridor: formState.currentSiteOrCorridor || 'Base Centrale',
        ecoDrivingScore: 85,
        harshBrakingCount: 0,
        excessiveIdleMinutes: 0,
        status: (formState.status as DriverRecord['status']) || 'AVAILABLE',
      };
      setDrivers((prev) => [newDriver, ...prev]);
      setNotification(`Nouveau conducteur ${newDriver.name} enregistré avec succès.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteDriver = (id: string, name: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    setNotification(`Conducteur ${name} retiré de l’effectif.`);
    setDeleteConfirm(null);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredDrivers = drivers.filter((d) => {
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'HEAVY' && d.licenseCategory !== 'C1' && d.licenseCategory !== 'C2' && d.licenseCategory !== 'E') return false;
      if (categoryFilter === 'BTP' && d.licenseCategory !== 'BTP_ENGIN') return false;
      if (categoryFilter === 'LIGHT' && d.licenseCategory !== 'B') return false;
    }
    if (statusFilter !== 'ALL' && d.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        d.name.toLowerCase().includes(q) ||
        d.matriculeNumber.toLowerCase().includes(q) ||
        d.assignedVehiclePlate.toLowerCase().includes(q) ||
        d.currentSiteOrCorridor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const onDutyCount = drivers.filter((d) => d.status === 'ON_DUTY').length;
  const availableCount = drivers.filter((d) => d.status === 'AVAILABLE').length;
  const warningCount = drivers.filter((d) => d.status === 'LICENSE_WARNING').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      {/* 1. BARRE DE NAVIGATION SUPÉRIEURE UNIFIÉE */}
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        {/* BANNIÈRE DE NOTIFICATION */}
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

        {/* 2. COMMAND CENTER HEADER BENTO */}
        <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="ok" pulse>
                  Ressources Humaines &amp; Équipages de Flotte
                </Badge>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Loi 18-07 ANPDP • Données Pseudonymisées • Code de la Route DZ
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                Conducteurs, Permis &amp; Éco-Conduite
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Gestion des habilitations chauffeurs, suivi de validité des visites médicales obligatoires, éco-scores de conduite et affectation en temps réel aux corridors logistiques nationaux.
              </p>

              <div className="flex gap-2 flex-wrap items-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5"
                >
                  <IconPlus size={14} />
                  <span>Nouveau Conducteur</span>
                </Button>
                <Link
                  href="/dispatch"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconTruck size={13} className="text-blue-500" />
                  <span>Dispatching TOPSIS</span>
                </Link>
                <Link
                  href="/eco-driving"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconShieldCheck size={13} className="text-emerald-500" />
                  <span>Éco-Conduite</span>
                </Link>
              </div>
            </div>

            {/* WIDGET HUD STATUT EFFECTIF */}
            <div className="w-full lg:w-auto min-w-[260px] p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] flex flex-col gap-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Disponibilité Effectif</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Total Conducteurs</span>
                <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {drivers.length} Actifs
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">En Mission / Route</span>
                <strong className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {onDutyCount} en cours
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Conformité Loi 18-07</span>
                <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Pseudonymisé ANPDP
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO KPIS CONDUCTEURS */}
        <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Effectif
            </span>
            <div className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
              {drivers.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Conducteurs &amp; opérateurs inscrits
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              En Route / Mission
            </span>
            <div className="font-mono text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {onDutyCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Actuellement sur les corridors
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Disponibles
            </span>
            <div className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {availableCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Prêts pour nouvel ordre de mission
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Alerte Permis / Visite
            </span>
            <div className="font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {warningCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Échéance légale imminente ou dépassée
            </span>
          </div>
        </section>

        {/* 4. LAYOUT DUAL : BARRE DE FILTRES LATÉRALE + TABLEAU CONDUCTEURS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* SIDEBAR CONTEXTUELLE DE NAVIGATION & FILTRES */}
          <aside className="lg:col-span-1 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Filtres Équipage
              </span>
              <IconFilter size={14} className="text-slate-400" />
            </div>

            {/* STATUT OPÉRATIONNEL */}
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Statut Opérationnel
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'ALL', label: 'Tout l’Effectif', count: drivers.length },
                  { id: 'ON_DUTY', label: 'En Mission', count: onDutyCount },
                  { id: 'AVAILABLE', label: 'Disponibles', count: availableCount },
                  { id: 'LICENSE_WARNING', label: 'Alerte Visite / Permis', count: warningCount },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      statusFilter === item.id
                        ? item.id === 'LICENSE_WARNING'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        statusFilter === item.id
                          ? 'bg-black/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-slate-200/80 dark:bg-slate-800 mb-5" />

            {/* CATÉGORIE PERMIS */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Catégorie de Permis DZ
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'ALL', label: 'Toutes Catégories' },
                  { id: 'HEAVY', label: 'Poids Lourds (C/E)' },
                  { id: 'BTP', label: 'Engins BTP (CACES)' },
                  { id: 'LIGHT', label: 'Utilitaires (B)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCategoryFilter(f.id)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      categoryFilter === f.id
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* LISTE PRINCIPALE DES CONDUCTEURS */}
          <section className="lg:col-span-3">
            {/* RECHERCHE ET TOTAL */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <IconSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par chauffeur, matricule, véhicule affecté..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 self-center whitespace-nowrap">
                <strong className="font-mono text-slate-900 dark:text-slate-100">{filteredDrivers.length}</strong> conducteur{filteredDrivers.length > 1 ? 's' : ''} filtré{filteredDrivers.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* TABLEAU DES CONDUCTEURS */}
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-12 text-center text-slate-500 text-xs">
                Chargement de l’effectif...
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-12 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <IconUsers size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Aucun conducteur ne correspond à vos filtres
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                  Modifiez vos critères ou enregistrez un nouveau conducteur dans cet équipage.
                </p>
                <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                  + Ajouter un Conducteur
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <th className="py-3 px-4">Conducteur &amp; Contact</th>
                        <th className="py-3 px-4">Permis &amp; Validité</th>
                        <th className="py-3 px-4">Visite Médicale</th>
                        <th className="py-3 px-4">Véhicule Affecté</th>
                        <th className="py-3 px-4">Score Éco</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredDrivers.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{d.name}</div>
                            <div className="font-mono text-[10.5px] text-slate-500">
                              {d.matriculeNumber} • {d.phone}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="neutral">Permis {d.licenseCategory}</Badge>
                            </div>
                            <div className="font-mono text-[10.5px] text-slate-400 mt-0.5">
                              Exp : {d.licenseExpiry}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span
                              className={`text-xs ${
                                d.status === 'LICENSE_WARNING'
                                  ? 'font-bold text-amber-600 dark:text-amber-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {d.medicalCheckExpiry}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              {d.assignedVehiclePlate}
                            </div>
                            <div className="text-[10.5px] text-slate-500 truncate max-w-[140px]">
                              {d.assignedVehicleModel}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono font-bold text-xs ${
                                d.ecoDrivingScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {d.ecoDrivingScore} / 100
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                d.status === 'AVAILABLE'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                  : d.status === 'ON_DUTY'
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                                  : d.status === 'LICENSE_WARNING'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  d.status === 'AVAILABLE'
                                    ? 'bg-emerald-500'
                                    : d.status === 'ON_DUTY'
                                    ? 'bg-blue-500'
                                    : d.status === 'LICENSE_WARNING'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {d.status === 'AVAILABLE'
                                ? 'Disponible'
                                : d.status === 'ON_DUTY'
                                ? 'En Mission'
                                : d.status === 'LICENSE_WARNING'
                                ? 'Alerte Visite'
                                : 'Repos Légal'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(d)}
                                title="Modifier ce conducteur"
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <IconEdit size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ id: d.id, name: d.name })}
                                title="Supprimer ce conducteur"
                                className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <IconTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODAL CRUD CHAUFFEUR (CRÉER / MODIFIER) */}
      {isModalOpen && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingDriver ? 'Modifier Fiche Conducteur' : 'Nouveau Conducteur / Opérateur'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enregistrement des habilitations et dates d’expiration
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Nom &amp; Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sofiane Djebbar"
                    value={formState.name || ''}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    placeholder="0550 00 00 00"
                    value={formState.phone || ''}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Catégorie Permis
                  </label>
                  <select
                    value={formState.licenseCategory || 'E'}
                    onChange={(e) => setFormState({ ...formState, licenseCategory: e.target.value as DriverRecord['licenseCategory'] })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="E">Permis E (Semi-remorque)</option>
                    <option value="C2">Permis C2 (Poids Lourds &gt; 19t)</option>
                    <option value="C1">Permis C1 (Porteurs &lt; 19t)</option>
                    <option value="BTP_ENGIN">CACES / Engins BTP</option>
                    <option value="B">Permis B (Utilitaires)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    N° de Permis *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DZ-16-..."
                    value={formState.licenseNumber || ''}
                    onChange={(e) => setFormState({ ...formState, licenseNumber: e.target.value })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Date Expiration Permis
                  </label>
                  <input
                    type="date"
                    value={formState.licenseExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, licenseExpiry: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Validité Visite Médicale
                  </label>
                  <input
                    type="date"
                    value={formState.medicalCheckExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, medicalCheckExpiry: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Immatriculation Affectée
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 00421-116-16"
                    value={formState.assignedVehiclePlate || ''}
                    onChange={(e) => setFormState({ ...formState, assignedVehiclePlate: e.target.value })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Statut Opérationnel
                  </label>
                  <select
                    value={formState.status || 'AVAILABLE'}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as DriverRecord['status'] })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="ON_DUTY">En Route / Mission</option>
                    <option value="REST">Repos Légal</option>
                    <option value="LICENSE_WARNING">Visite Médicale Urgente</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingDriver ? 'Enregistrer Modifications' : 'Créer Conducteur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION */}
      {deleteConfirm && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-white dark:bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-rose-600 dark:text-rose-400">
              <IconAlertTriangle size={22} />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Supprimer ce Conducteur ?
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Confirmez-vous le retrait de <strong className="text-slate-900 dark:text-slate-100">« {deleteConfirm.name} »</strong> de l’effectif de la flotte ?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <button
                onClick={() => handleDeleteDriver(deleteConfirm.id, deleteConfirm.name)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
