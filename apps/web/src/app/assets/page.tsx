'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthClient } from '../../lib/api-auth';
import { AssetClient } from '../../lib/api-assets';
import { Navbar } from '../../components/navigation/Navbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import {
  Asset,
  AssetCategory,
  AssetStatus,
  MeterType,
} from '@docteurflotte/contracts';
import { useDemoMode } from '../../context/DemoModeContext';
import { OEMScraperClient, NormalizedOEMTemplate } from '../../lib/api-oem-scraper';
import {
  IconTruck,
  IconShieldCheck,
  IconActivity,
  IconAlertTriangle,
  IconClock,
  IconSearch,
  IconPlus,
  IconCheck,
  IconX,
  IconWrench,
  IconEdit,
  IconTrash,
  IconFilter,
  IconCpu,
} from '../../components/navigation/TechIcons';
import { getSimulationAssets } from '@/lib/simulation-sandbox';

export default function AssetsPage() {
  const router = useRouter();
  const { isDemoMode, isGuest } = useDemoMode();
  const [token, setToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Modale d'ajout d'actif
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    code: '',
    category: AssetCategory.HEAVY_TRUCK,
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    primaryMeterType: MeterType.ODOMETER_KM,
    initialMeterValue: 0,
    maintenanceIntervalValue: 10000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OEM Scraper state dans la modal d'ajout
  const [oemSearchQuery, setOemSearchQuery] = useState('');
  const [isResolvingOem, setIsResolvingOem] = useState(false);

  // Modale de relevé de compteur
  const [activeAssetForMeter, setActiveAssetForMeter] = useState<Asset | null>(null);
  const [newMeterValue, setNewMeterValue] = useState<number>(0);
  const [isRecordingMeter, setIsRecordingMeter] = useState(false);

  // Modale d'édition d'actif
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    brand: '',
    model: '',
    category: AssetCategory.HEAVY_TRUCK,
    maintenanceIntervalValue: 10000,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Modale de suppression d'actif
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; label: string } | null>(null);

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const loadAssets = async (authToken: string) => {
    setIsLoading(true);
    try {
      const data = await AssetClient.listAssets(authToken);
      setAssets(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des actifs.';
      showNotification('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const session = AuthClient.getSession();
    setToken(session.token);

    if (isDemoMode) {
      (async () => {
        try {
          const sandboxAssets = await getSimulationAssets();
          if (!isCancelled) {
            setAssets(sandboxAssets);
          }
        } catch {
          if (!isCancelled) {
            setAssets([]);
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      })();
    } else if (session.token) {
      loadAssets(session.token);
    } else {
      setAssets([]);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const handleResolveOem = async (queryText?: string) => {
    const text = (queryText || oemSearchQuery).trim();
    if (!text) return;
    setIsResolvingOem(true);

    try {
      const reqParam: { vin?: string; make?: string; model?: string } = {};
      if (text.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(text)) {
        reqParam.vin = text.toUpperCase();
      } else {
        const parts = text.split(/\s+/);
        reqParam.make = parts[0];
        reqParam.model = parts.slice(1).join(' ') || parts[0];
      }

      const oemData = await OEMScraperClient.resolveAndScrape(reqParam);

      let matchedCategory = AssetCategory.HEAVY_TRUCK;
      let matchedMeter = MeterType.ODOMETER_KM;
      if (oemData.asset_category === 'CONSTRUCTION_EQUIP') {
        matchedCategory = AssetCategory.CONSTRUCTION_EQUIPMENT;
        matchedMeter = MeterType.ENGINE_HOURS;
      } else if (oemData.asset_category === 'VAN' || oemData.asset_category === 'LIGHT_VEHICLE') {
        matchedCategory = AssetCategory.ROAD_VEHICLE;
      }

      const mainTask = oemData.tasks.find((t) => t.task_code === 'ENG_OIL_FILTER') || oemData.tasks[0];
      const intervalVal =
        matchedMeter === MeterType.ENGINE_HOURS
          ? mainTask?.normal_interval_engine_hours || 250
          : mainTask?.normal_interval_km || 30000;

      setNewAsset((prev) => ({
        ...prev,
        name: `${oemData.make} ${oemData.model} (${oemData.engine_code || 'OEM'})`.trim(),
        brand: oemData.make,
        model: oemData.model,
        category: matchedCategory,
        primaryMeterType: matchedMeter,
        maintenanceIntervalValue: intervalVal,
      }));
      showNotification('success', `Données constructeur OEM trouvées pour « ${oemData.make} ${oemData.model} »`);
    } catch {
      showNotification('warning', "Aucune fiche constructeur correspondante n'a été trouvée. Saisie manuelle.");
    } finally {
      setIsResolvingOem(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const created = await AssetClient.createAsset(newAsset, token);
      showNotification('success', `Actif « ${created.name} » (${created.code}) enregistré.`);
      setIsAddModalOpen(false);
      setNewAsset({
        name: '',
        code: '',
        category: AssetCategory.HEAVY_TRUCK,
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        primaryMeterType: MeterType.ODOMETER_KM,
        initialMeterValue: 0,
        maintenanceIntervalValue: 10000,
      });
      setOemSearchQuery('');
      setAssets((prev) => [created, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'enregistrement.";
      showNotification('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setEditForm({
      name: asset.name,
      code: asset.code,
      brand: asset.brand || '',
      model: asset.model || '',
      category: asset.category,
      maintenanceIntervalValue: asset.maintenanceIntervalValue || 10000,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setIsUpdating(true);

    try {
      if (isDemoMode) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === editingAsset.id
              ? {
                  ...a,
                  name: editForm.name,
                  code: editForm.code,
                  brand: editForm.brand,
                  model: editForm.model,
                  category: editForm.category,
                  maintenanceIntervalValue: editForm.maintenanceIntervalValue,
                }
              : a
          )
        );
        showNotification('success', `Actif ${editForm.code} mis à jour.`);
        setIsEditModalOpen(false);
      } else {
        if (!token) return;
        const updated = await AssetClient.updateAsset(editingAsset.id, editForm, token);
        setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showNotification('success', `Actif ${updated.code} mis à jour.`);
        setIsEditModalOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la mise à jour.';
      showNotification('error', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      if (isDemoMode) {
        setAssets((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
        showNotification('success', `Actif ${deleteConfirm.label} supprimé.`);
        setDeleteConfirm(null);
      } else {
        if (!token) return;
        await AssetClient.deleteAsset(deleteConfirm.id, token);
        setAssets((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
        showNotification('success', `Actif ${deleteConfirm.label} supprimé.`);
        setDeleteConfirm(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la suppression.';
      showNotification('error', msg);
    }
  };

  const handleRecordMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssetForMeter) return;
    setIsRecordingMeter(true);

    try {
      if (isDemoMode) {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === activeAssetForMeter.id
              ? {
                  ...a,
                  currentMeterValue: newMeterValue,
                  status:
                    a.nextMaintenanceMeterValue && newMeterValue >= a.nextMaintenanceMeterValue
                      ? AssetStatus.MAINTENANCE_REQUIRED
                      : a.status,
                }
              : a
          )
        );
        showNotification(
          'success',
          `Compteur relevé avec succès : ${newMeterValue.toLocaleString('fr-DZ')} (${activeAssetForMeter.code}).`
        );
        setActiveAssetForMeter(null);
      } else {
        if (!token) return;
        const res = await AssetClient.recordMeterReading(
          activeAssetForMeter.id,
          {
            meterType: activeAssetForMeter.primaryMeterType,
            value: newMeterValue,
          },
          token
        );

        if (res.rollbackDetected) {
          showNotification('warning', `Relevé anormal détecté : ${res.message}`);
        } else if (res.maintenanceTriggered) {
          showNotification('success', `Ordre de travail déclenché : ${res.message}`);
        } else {
          showNotification(
            'success',
            `Compteur certifié mis à jour (${res.currentValue} ${activeAssetForMeter.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'h'}).`
          );
        }

        setActiveAssetForMeter(null);
        loadAssets(token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'enregistrement du relevé.";
      showNotification('error', msg);
    } finally {
      setIsRecordingMeter(false);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    const matchesSearch =
      searchQuery.trim() === '' ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const operationalCount = assets.filter((a) => a.status === AssetStatus.OPERATIONAL).length;
  const maintenanceCount = assets.filter((a) => a.status === AssetStatus.MAINTENANCE_REQUIRED).length;
  const downCount = assets.filter((a) => a.status === AssetStatus.DOWN).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      {/* 1. BARRE DE NAVIGATION SUPÉRIEURE UNIFIÉE */}
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
        {/* BANNIÈRE DE NOTIFICATION FLOTTANTE */}
        {feedback && (
          <div
            role="status"
            className={`mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-sm transition-all ${
              feedback.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                : feedback.type === 'warning'
                ? 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                : 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={feedback.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {feedback.type === 'success' ? <IconCheck size={16} strokeWidth={2.5} /> : <IconAlertTriangle size={16} />}
              </span>
              <span className="text-xs font-semibold">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
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
                  Parc d’Actifs Connecté • Mode 0, 1 &amp; 2
                </Badge>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Référentiel 58 Wilayas • Scraper OEM RMI • Relevés Odométriques Certifiés
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                Inventaire &amp; Télémétrie des Actifs de Flotte
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Supervision centralisée du parc roulant et des engins, contrôle continu des compteurs d’usure et déclenchement automatique des ordres de travail préventifs selon les manuels constructeurs.
              </p>

              <div className="flex gap-2 flex-wrap items-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5"
                >
                  <IconPlus size={14} />
                  <span>Enregistrer un Actif</span>
                </Button>
                <Link
                  href="/oem-scraper"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconCpu size={13} className="text-indigo-500" />
                  <span>Scraper OEM RMI</span>
                </Link>
                <Link
                  href="/work-orders"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconWrench size={13} className="text-amber-500" />
                  <span>Ordres de Travail</span>
                </Link>
                <Link
                  href="/preventive"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconClock size={13} className="text-blue-500" />
                  <span>Plans Préventifs</span>
                </Link>
              </div>
            </div>

            {/* WIDGET HUD STATUT DU PARC */}
            <div className="w-full lg:w-auto min-w-[260px] p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] flex flex-col gap-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Disponibilité Flotte</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Taux de Disponibilité</span>
                <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {assets.length > 0 ? Math.round((operationalCount / assets.length) * 100) : 100}%
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Supervision Télématique</span>
                <strong className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  100% Connectés
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Isolation Multi-Tenant</span>
                <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  PostgreSQL RLS
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO KPIS PARC */}
        <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Actifs
            </span>
            <div className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
              {assets.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              100% inventoriés au registre
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Opérationnels
            </span>
            <div className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {operationalCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Prêts pour mission &amp; dispatching
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Révision Requise
            </span>
            <div className="font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {maintenanceCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Seuil d’usure kilométrique franchi
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Immobilisés
            </span>
            <div className="font-mono text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {downCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              En réparation atelier ou bloqués DVIR
            </span>
          </div>
        </section>

        {/* 4. LAYOUT DUAL : BARRE DE FILTRES LATÉRALE + TABLEAU D'ACTIFS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* SIDEBAR CONTEXTUELLE DE NAVIGATION & FILTRES */}
          <aside className="lg:col-span-1 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Filtres du Parc
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
                  { id: 'ALL', label: 'Tous les Actifs', count: assets.length },
                  { id: AssetStatus.OPERATIONAL, label: 'Opérationnels', count: operationalCount },
                  { id: AssetStatus.MAINTENANCE_REQUIRED, label: 'Révision Requise', count: maintenanceCount },
                  { id: AssetStatus.DOWN, label: 'Immobilisés', count: downCount },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedStatus(item.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedStatus === item.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        selectedStatus === item.id
                          ? 'bg-blue-700/80 text-white'
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

            {/* CATÉGORIE D'ACTIFS */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Catégorie d’Actifs
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'ALL', label: 'Toutes Catégories' },
                  { id: AssetCategory.HEAVY_TRUCK, label: 'Poids Lourds' },
                  { id: AssetCategory.CONSTRUCTION_EQUIPMENT, label: 'Engins BTP' },
                  { id: AssetCategory.ROAD_VEHICLE, label: 'Véhicules Légers' },
                ].map((cat) => {
                  const count = cat.id === 'ALL' ? assets.length : assets.filter((a) => a.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* LISTE PRINCIPALE DES ACTIFS */}
          <section className="lg:col-span-3">
            {/* BARRE DE RECHERCHE ET TOTAL */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <IconSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par immatriculation, désignation, marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 self-center whitespace-nowrap">
                <strong className="font-mono text-slate-900 dark:text-slate-100">{filteredAssets.length}</strong> actif{filteredAssets.length > 1 ? 's' : ''} filtré{filteredAssets.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* TABLEAU DES ACTIFS */}
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-12 text-center text-slate-500 text-xs">
                Chargement de la base d’actifs...
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-12 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <IconTruck size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Aucun actif trouvé dans cette sélection
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                  Enregistrez vos véhicules ou engins pour activer le suivi des compteurs et les alertes d’entretien.
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  + Enregistrer le Premier Actif
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <th className="py-3 px-4">Matricule &amp; Actif</th>
                        <th className="py-3 px-4">Catégorie</th>
                        <th className="py-3 px-4">Compteur Certifié</th>
                        <th className="py-3 px-4">Prochaine Révision</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredAssets.map((asset) => {
                        const delta = asset.nextMaintenanceMeterValue
                          ? asset.nextMaintenanceMeterValue - asset.currentMeterValue
                          : null;
                        const isOverdue = delta !== null && delta <= 0;

                        return (
                          <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/40">
                                  <IconTruck size={15} />
                                </div>
                                <div>
                                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {asset.code}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                    {asset.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="neutral">
                                {asset.category === AssetCategory.HEAVY_TRUCK
                                  ? 'Poids Lourds'
                                  : asset.category === AssetCategory.CONSTRUCTION_EQUIPMENT
                                  ? 'Engin BTP'
                                  : 'Véhicule'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <strong className="font-mono text-xs text-slate-900 dark:text-slate-100">
                                {asset.currentMeterValue.toLocaleString('fr-DZ')}
                              </strong>{' '}
                              <span className="text-[11px] text-slate-400">
                                {asset.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'heures'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {asset.nextMaintenanceMeterValue ? (
                                <div>
                                  <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                                    {asset.nextMaintenanceMeterValue.toLocaleString('fr-DZ')}{' '}
                                    {asset.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'h'}
                                  </div>
                                  {delta !== null && (
                                    <div
                                      className={`text-[10.5px] font-semibold ${
                                        isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                      }`}
                                    >
                                      {isOverdue ? `Dépassement de ${Math.abs(delta)}` : `Reste ${delta}`}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Non définie</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                  asset.status === AssetStatus.OPERATIONAL
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                    : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    asset.status === AssetStatus.OPERATIONAL
                                      ? 'bg-emerald-500'
                                      : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                />
                                {asset.status === AssetStatus.OPERATIONAL
                                  ? 'Opérationnel'
                                  : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                  ? 'Révision Requise'
                                  : 'Immobilisé'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveAssetForMeter(asset);
                                    setNewMeterValue(asset.currentMeterValue);
                                  }}
                                  className="text-xs py-1 px-2.5"
                                >
                                  Relever
                                </Button>
                                <button
                                  onClick={() => handleOpenEdit(asset)}
                                  title="Modifier l'actif"
                                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <IconEdit size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ id: asset.id, label: `${asset.code} (${asset.name})` })}
                                  title="Supprimer l'actif"
                                  className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  <IconTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODALE 1 : RELEVÉ COMPTEUR */}
      {activeAssetForMeter && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Relever Compteur : {activeAssetForMeter.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Code actif : <strong className="text-slate-700 dark:text-slate-300">{activeAssetForMeter.code}</strong> • Compteur courant :{' '}
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {activeAssetForMeter.currentMeterValue}{' '}
                {activeAssetForMeter.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'h'}
              </strong>
            </p>

            <form onSubmit={handleRecordMeter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Nouvelle Valeur Relevée ({activeAssetForMeter.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'heures'}) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newMeterValue}
                  onChange={(e) => setNewMeterValue(Number(e.target.value))}
                  className="w-full font-mono text-base font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setActiveAssetForMeter(null)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isRecordingMeter}>
                  {isRecordingMeter ? 'Vérification...' : 'Enregistrer le Relevé'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : AJOUT D'ACTIF (+ OEM SCRAPER) */}
      {isAddModalOpen && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Enregistrer un Nouvel Actif
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Intégration d’un véhicule au registre télématique
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* RECHERCHE RAPIDE OEM */}
            <div className="mb-4 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Scraper VIN ou Modèle Constructeur :
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: VF624GPA... ou Renault K480"
                  value={oemSearchQuery}
                  onChange={(e) => setOemSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => handleResolveOem()}
                  disabled={isResolvingOem}
                  className="text-xs"
                >
                  {isResolvingOem ? 'Recherche...' : 'Résoudre OEM'}
                </Button>
              </div>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Code Actif / Matricule *
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.code}
                  onChange={(e) => setNewAsset({ ...newAsset, code: e.target.value })}
                  placeholder="00421-116-16"
                  className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Désignation Actif *
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="Renault Trucks K480 6x4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as AssetCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={AssetCategory.HEAVY_TRUCK}>Poids Lourds</option>
                    <option value={AssetCategory.CONSTRUCTION_EQUIPMENT}>Engin BTP</option>
                    <option value={AssetCategory.ROAD_VEHICLE}>Véhicule Léger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Type de Compteur
                  </label>
                  <select
                    value={newAsset.primaryMeterType}
                    onChange={(e) => setNewAsset({ ...newAsset, primaryMeterType: e.target.value as MeterType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={MeterType.ODOMETER_KM}>Odomètre (km)</option>
                    <option value={MeterType.ENGINE_HOURS}>Horamètre (heures)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Compteur Initial
                  </label>
                  <input
                    type="number"
                    value={newAsset.initialMeterValue}
                    onChange={(e) => setNewAsset({ ...newAsset, initialMeterValue: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Intervalle Révision OEM
                  </label>
                  <input
                    type="number"
                    value={newAsset.maintenanceIntervalValue}
                    onChange={(e) => setNewAsset({ ...newAsset, maintenanceIntervalValue: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Créer l’Actif'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : MODIFICATION D'ACTIF */}
      {isEditModalOpen && editingAsset && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Modifier l’Actif : {editingAsset.code}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mise à jour des métadonnées et intervalle d’entretien
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Code Actif / Matricule *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Désignation Actif *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Marque
                  </label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Modèle
                  </label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as AssetCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={AssetCategory.HEAVY_TRUCK}>Poids Lourds</option>
                    <option value={AssetCategory.CONSTRUCTION_EQUIPMENT}>Engin BTP</option>
                    <option value={AssetCategory.ROAD_VEHICLE}>Véhicule Léger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Intervalle Révision OEM
                  </label>
                  <input
                    type="number"
                    value={editForm.maintenanceIntervalValue}
                    onChange={(e) => setEditForm({ ...editForm, maintenanceIntervalValue: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Sauvegarde...' : 'Enregistrer Modifications'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 4 : CONFIRMATION SUPPRESSION */}
      {deleteConfirm && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-white dark:bg-[#111827] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-rose-600 dark:text-rose-400">
              <IconAlertTriangle size={22} />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Supprimer cet Actif ?
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Confirmez-vous la suppression de l’actif <strong className="text-slate-900 dark:text-slate-100">« {deleteConfirm.label} »</strong> ? L’historique télématique associé sera archivé.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <button
                onClick={handleDeleteConfirm}
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
