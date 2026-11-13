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
  DataOrigin,
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
  const [oemSearchQuery, setOemSearchQuery] = useState('');
  const [oemDetected, setOemDetected] = useState<NormalizedOEMTemplate | null>(null);
  const [isResolvingOem, setIsResolvingOem] = useState(false);

  // Modale de modification d'actif
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    category: AssetCategory.HEAVY_TRUCK,
    brand: '',
    model: '',
    primaryMeterType: MeterType.ODOMETER_KM,
    maintenanceIntervalValue: 10000,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Modale de suppression d'actif
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; label: string } | null>(null);

  // Modale de saisie de relevé
  const [activeAssetForMeter, setActiveAssetForMeter] = useState<Asset | null>(null);
  const [newMeterValue, setNewMeterValue] = useState<number>(0);
  const [isRecordingMeter, setIsRecordingMeter] = useState(false);

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

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
      setOemDetected(oemData);

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
        name: `${oemData.make} ${oemData.model} (${oemData.engine_code})`,
        brand: oemData.make,
        model: oemData.model,
        category: matchedCategory,
        primaryMeterType: matchedMeter,
        maintenanceIntervalValue: intervalVal,
      }));

      showNotification(
        'success',
        `Gabarit constructeur ${oemData.make} ${oemData.model} appliqué : Intervalle ${intervalVal} ${matchedMeter === MeterType.ENGINE_HOURS ? 'heures' : 'km'}, carter ${oemData.oil_capacity_liters}L (${oemData.oil_norm_spec}).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la résolution OEM.';
      showNotification('warning', `Base RMI OEM locale : ${msg}`);
    } finally {
      setIsResolvingOem(false);
    }
  };

  const loadAssets = async (jwtToken: string) => {
    setIsLoading(true);
    try {
      const data = await AssetClient.listAssets(jwtToken);
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
    const init = async () => {
      const currentToken = AuthClient.getToken();
      setToken(currentToken);

      if (isDemoMode) {
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
      } else if (currentToken) {
        loadAssets(currentToken);
      } else {
        setAssets([]);
        setIsLoading(false);
      }
    };
    init();
    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || isDemoMode) {
      if (!token) {
        showNotification(
          'warning',
          'Vous explorez en Mode Démonstration sans connexion. Créez un compte entreprise ou connectez-vous pour enregistrer vos actifs réels.'
        );
      } else {
        showNotification(
          'warning',
          'Vous êtes en Mode Démonstration (Sandbox). Basculez sur "Parc Réel" dans la barre supérieure pour ajouter un actif à votre base de production.'
        );
      }
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const created = await AssetClient.createAsset(newAsset, token);
      showNotification('success', `Actif ${newAsset.code} (${newAsset.name}) créé avec succès.`);
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
      setAssets((prev) => [created, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la création de l’actif.';
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
      category: asset.category,
      brand: asset.brand || '',
      model: asset.model || '',
      primaryMeterType: asset.primaryMeterType,
      maintenanceIntervalValue: asset.maintenanceIntervalValue || 10000,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingAsset) return;
    setIsUpdating(true);

    try {
      await AssetClient.updateAsset(editingAsset.id, editForm, token);
      setAssets((prev) =>
        prev.map((a) =>
          a.id === editingAsset.id
            ? {
              ...a,
              name: editForm.name,
              code: editForm.code,
              category: editForm.category,
              brand: editForm.brand,
              model: editForm.model,
              primaryMeterType: editForm.primaryMeterType,
              maintenanceIntervalValue: Number(editForm.maintenanceIntervalValue),
            }
            : a
        )
      );
      showNotification('success', `Actif ${editForm.code} mis à jour avec succès.`);
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la mise à jour.';
      showNotification('error', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteConfirm) return;
    try {
      await AssetClient.deleteAsset(deleteConfirm.id, token);
      setAssets((prev) => prev.filter((a) => a.id !== deleteConfirm.id));
      showNotification('success', `Actif ${deleteConfirm.label} supprimé du parc.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la suppression.';
      showNotification('error', msg);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleRecordMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeAssetForMeter) return;
    setIsRecordingMeter(true);
    setFeedback(null);

    try {
      const res = await AssetClient.recordMeterReading(
        activeAssetForMeter.id,
        {
          meterType: activeAssetForMeter.primaryMeterType,
          value: Number(newMeterValue),
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la mise à jour du compteur.';
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      {/* 1. BARRE HORIZONTALE UNIVERSELLE */}
      <Navbar />

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1.25rem 3rem 1.25rem' }}>
        {/* NOTIFICATION FLOTTANTE */}
        {feedback && (
          <div
            role="status"
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background:
                feedback.type === 'success'
                  ? 'var(--df-status-ok-bg)'
                  : feedback.type === 'warning'
                    ? 'var(--df-status-warning-bg)'
                    : 'var(--df-status-danger-bg)',
              color:
                feedback.type === 'success'
                  ? 'var(--df-status-ok-text)'
                  : feedback.type === 'warning'
                    ? 'var(--df-status-warning-text)'
                    : 'var(--df-status-danger-text)',
              border: `1px solid ${feedback.type === 'success'
                ? 'var(--df-status-ok-border)'
                : feedback.type === 'warning'
                  ? 'var(--df-status-warning-border)'
                  : 'var(--df-status-danger-border)'
                }`,
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
            >
              <IconX size={15} />
            </button>
          </div>
        )}

        {/* 2. LAYOUT DUAL-BAR : SIDEBAR VERTICALE + CONTENU PRINCIPAL */}
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          {/* SIDEBAR CONTEXTUELLE VERTICALE */}
          <aside
            style={{
              width: '260px',
              flexShrink: 0,
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              padding: '1rem',
              boxShadow: 'var(--df-shadow-sm)',
              position: 'sticky',
              top: '90px',
            }}
          >
            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Actions du Parc
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
              >
                <IconPlus size={14} />
                <span>+ Nouvel Actif</span>
              </Button>
              <Link href="/oem-scraper" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Scraper OEM RMI
                </Button>
              </Link>
              <Link href="/work-orders" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Ordres de Travail
                </Button>
              </Link>
            </div>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Statut Opérationnel
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {[
                { id: 'ALL', label: 'Tous les Actifs', count: assets.length, dot: 'var(--df-accent-blue)' },
                { id: AssetStatus.OPERATIONAL, label: 'Opérationnels', count: operationalCount, dot: 'var(--df-status-ok)' },
                { id: AssetStatus.MAINTENANCE_REQUIRED, label: 'Révision Requise', count: maintenanceCount, dot: 'var(--df-status-warning)' },
                { id: AssetStatus.DOWN, label: 'Immobilisés', count: downCount, dot: 'var(--df-status-danger)' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedStatus(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: 'none',
                    background: selectedStatus === item.id ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: selectedStatus === item.id ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                    fontWeight: selectedStatus === item.id ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--df-transition-fast)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot }} />
                    <span>{item.label}</span>
                  </span>
                  <span
                    style={{
                      background: 'var(--df-bg-surface-2)',
                      color: 'var(--df-text-muted)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--df-radius-full)',
                      fontSize: '0.70rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </nav>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Catégorie d’Actifs
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'ALL', label: 'Toutes Catégories' },
                { id: AssetCategory.HEAVY_TRUCK, label: 'Poids Lourds' },
                { id: AssetCategory.CONSTRUCTION_EQUIPMENT, label: 'Engins BTP' },
                { id: AssetCategory.ROAD_VEHICLE, label: 'Véhicules Légers' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: 'none',
                    background: selectedCategory === cat.id ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: selectedCategory === cat.id ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                    fontWeight: selectedCategory === cat.id ? 700 : 500,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: '0.70rem',
                      color: 'var(--df-text-muted)',
                    }}
                  >
                    {cat.id === 'ALL' ? assets.length : assets.filter((a) => a.category === cat.id).length}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* CONTENU PRINCIPAL */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* EN-TÊTE DE SECTION */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                    Inventaire &amp; Télémétrie des Actifs
                  </h1>
                  <Badge variant="ok">Parc Opérationnel</Badge>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--df-text-muted)', margin: '0.2rem 0 0 0' }}>
                  Supervision des compteurs certifiés, calcul de charge et déclenchement automatique d&apos;ordres de travail préventifs.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'var(--df-bg-surface-1)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-md)',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <IconSearch size={14} style={{ color: 'var(--df-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Filtrer matricule, marque..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--df-text-main)',
                      outline: 'none',
                      fontSize: '0.78rem',
                      width: '180px',
                    }}
                  />
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  + Nouvel Actif
                </Button>
              </div>
            </div>

            {/* CARTES RÉCAPITULATIVES D'ÉTAT DU PARC */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '1rem 1.15rem',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--df-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Actifs
                  </span>
                  <span className="df-mono" style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>
                    100% connectés
                  </span>
                </div>
                <div className="df-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '0.25rem' }}>
                  {assets.length}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '1rem 1.15rem',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--df-status-ok)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Opérationnels
                  </span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--df-status-ok)' }} />
                </div>
                <div className="df-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-status-ok)', marginTop: '0.25rem' }}>
                  {operationalCount}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '1rem 1.15rem',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--df-status-warning)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Révision Requise
                  </span>
                  <span className="df-mono" style={{ fontSize: '0.70rem', color: 'var(--df-status-warning)' }}>
                    Seuil franchi
                  </span>
                </div>
                <div className="df-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-status-warning)', marginTop: '0.25rem' }}>
                  {maintenanceCount}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  padding: '1rem 1.15rem',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--df-status-danger)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Immobilisés
                  </span>
                  <span className="df-mono" style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>
                    Au garage
                  </span>
                </div>
                <div className="df-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-status-danger)', marginTop: '0.25rem' }}>
                  {downCount}
                </div>
              </div>
            </section>

            {/* TABLEAU DES ACTIFS HAUTE DENSITÉ */}
            {isLoading ? (
              <div
                style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--df-text-muted)',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                }}
              >
                Chargement de la base d&apos;actifs...
              </div>
            ) : filteredAssets.length === 0 ? (
              <div
                style={{
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.5rem' }}>
                  Aucun actif trouvé dans cette sélection
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Enregistrez vos véhicules ou engins de chantier pour activer le suivi des compteurs et les alertes d&apos;entretien.
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  + Enregistrer le Premier Actif
                </Button>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                  overflowX: 'auto',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'var(--df-bg-surface-2)',
                        borderBottom: '1px solid var(--df-border-subtle)',
                        color: 'var(--df-text-muted)',
                        fontSize: '0.74rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <th style={{ padding: '0.75rem 1rem' }}>Matricule &amp; Véhicule</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Catégorie</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Compteur Certifié</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Prochaine Révision</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Statut</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => {
                      const delta = asset.nextMaintenanceMeterValue
                        ? asset.nextMaintenanceMeterValue - asset.currentMeterValue
                        : null;
                      const isOverdue = delta !== null && delta <= 0;

                      return (
                        <tr
                          key={asset.id}
                          style={{
                            borderBottom: '1px solid var(--df-border-subtle)',
                            transition: 'background var(--df-transition-fast)',
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <span
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  background: 'var(--df-bg-surface-2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--df-accent-blue)',
                                }}
                              >
                                <IconTruck size={16} />
                              </span>
                              <div>
                                <strong
                                  className="df-mono"
                                  style={{
                                    fontSize: '0.90rem',
                                    color: 'var(--df-text-main)',
                                    display: 'block',
                                    fontWeight: 700,
                                  }}
                                >
                                  {asset.code}
                                </strong>
                                <span style={{ fontSize: '0.76rem', color: 'var(--df-text-secondary)' }}>
                                  {asset.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <Badge variant="neutral">
                              {asset.category === AssetCategory.HEAVY_TRUCK
                                ? 'Poids Lourds'
                                : asset.category === AssetCategory.CONSTRUCTION_EQUIPMENT
                                  ? 'Engin BTP'
                                  : 'Véhicule'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <strong className="df-mono" style={{ color: 'var(--df-text-main)', fontSize: '0.88rem' }}>
                              {asset.currentMeterValue.toLocaleString('fr-DZ')}
                            </strong>{' '}
                            <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                              {asset.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'heures'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {asset.nextMaintenanceMeterValue ? (
                              <div>
                                <span className="df-mono" style={{ fontSize: '0.82rem', color: 'var(--df-text-main)' }}>
                                  {asset.nextMaintenanceMeterValue.toLocaleString('fr-DZ')}{' '}
                                  {asset.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'h'}
                                </span>
                                {delta !== null && (
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      color: isOverdue ? 'var(--df-status-danger)' : 'var(--df-status-ok)',
                                    }}
                                  >
                                    {isOverdue ? `Dépassement de ${Math.abs(delta)}` : `Reste ${delta}`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--df-text-muted)', fontSize: '0.78rem' }}>Non définie</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background:
                                  asset.status === AssetStatus.OPERATIONAL
                                    ? 'var(--df-status-ok-bg)'
                                    : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                      ? 'var(--df-status-warning-bg)'
                                      : 'var(--df-status-danger-bg)',
                                color:
                                  asset.status === AssetStatus.OPERATIONAL
                                    ? 'var(--df-status-ok-text)'
                                    : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                      ? 'var(--df-status-warning-text)'
                                      : 'var(--df-status-danger-text)',
                                border: `1px solid ${asset.status === AssetStatus.OPERATIONAL
                                  ? 'var(--df-status-ok-border)'
                                  : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                    ? 'var(--df-status-warning-border)'
                                    : 'var(--df-status-danger-border)'
                                  }`,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              <span
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background:
                                    asset.status === AssetStatus.OPERATIONAL
                                      ? 'var(--df-status-ok)'
                                      : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                        ? 'var(--df-status-warning)'
                                        : 'var(--df-status-danger)',
                                }}
                              />
                              {asset.status === AssetStatus.OPERATIONAL
                                ? 'Opérationnel'
                                : asset.status === AssetStatus.MAINTENANCE_REQUIRED
                                  ? 'Révision Requise'
                                  : 'Immobilisé'}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveAssetForMeter(asset);
                                  setNewMeterValue(asset.currentMeterValue);
                                }}
                              >
                                Relever
                              </Button>
                              <button
                                onClick={() => handleOpenEdit(asset)}
                                title="Modifier l'actif"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--df-text-muted)',
                                  cursor: 'pointer',
                                  padding: '0.3rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  borderRadius: 'var(--df-radius-sm)',
                                }}
                              >
                                <IconEdit size={15} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ id: asset.id, label: `${asset.code} (${asset.name})` })}
                                title="Supprimer l'actif"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--df-status-danger)',
                                  cursor: 'pointer',
                                  padding: '0.3rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  borderRadius: 'var(--df-radius-sm)',
                                }}
                              >
                                <IconTrash size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODALE 1 : RELEVÉ COMPTEUR */}
      {activeAssetForMeter && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.75rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '0.35rem' }}>
              Relever Compteur : {activeAssetForMeter.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
              Code actif : <strong>{activeAssetForMeter.code}</strong> • Compteur courant :{' '}
              <strong className="df-mono">
                {activeAssetForMeter.currentMeterValue}{' '}
                {activeAssetForMeter.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'h'}
              </strong>
            </p>

            <form onSubmit={handleRecordMeter}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.4rem' }}>
                  Nouvelle Valeur Relevée ({activeAssetForMeter.primaryMeterType === MeterType.ODOMETER_KM ? 'km' : 'heures'})
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newMeterValue}
                  onChange={(e) => setNewMeterValue(Number(e.target.value))}
                  className="df-mono"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--df-radius-sm)',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-main)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '1.75rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                Enregistrer un Nouvel Actif
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* RECHERCHE RAPIDE OEM */}
            <div
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
                padding: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Scraper VIN ou Modèle Constructeur :
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Ex: VF624GPA... ou Renault K480"
                  value={oemSearchQuery}
                  onChange={(e) => setOemSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    background: 'var(--df-bg-surface-1)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.825rem',
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => handleResolveOem()}
                  disabled={isResolvingOem}
                >
                  {isResolvingOem ? 'Recherche...' : 'Résoudre OEM'}
                </Button>
              </div>
            </div>

            <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Code Actif / Matricule *
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.code}
                  onChange={(e) => setNewAsset({ ...newAsset, code: e.target.value })}
                  placeholder="00421-116-16"
                  className="df-mono"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Désignation Actif *
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="Renault Trucks K480 6x4"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Catégorie
                  </label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as AssetCategory })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.825rem',
                    }}
                  >
                    <option value={AssetCategory.HEAVY_TRUCK}>Poids Lourds</option>
                    <option value={AssetCategory.CONSTRUCTION_EQUIPMENT}>Engin BTP</option>
                    <option value={AssetCategory.ROAD_VEHICLE}>Véhicule Léger</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Type de Compteur
                  </label>
                  <select
                    value={newAsset.primaryMeterType}
                    onChange={(e) => setNewAsset({ ...newAsset, primaryMeterType: e.target.value as MeterType })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.825rem',
                    }}
                  >
                    <option value={MeterType.ODOMETER_KM}>Odomètre (km)</option>
                    <option value={MeterType.ENGINE_HOURS}>Horamètre (heures)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Compteur Initial
                  </label>
                  <input
                    type="number"
                    value={newAsset.initialMeterValue}
                    onChange={(e) => setNewAsset({ ...newAsset, initialMeterValue: Number(e.target.value) })}
                    className="df-mono"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Intervalle Révision OEM
                  </label>
                  <input
                    type="number"
                    value={newAsset.maintenanceIntervalValue}
                    onChange={(e) => setNewAsset({ ...newAsset, maintenanceIntervalValue: Number(e.target.value) })}
                    className="df-mono"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Créer l\'Actif'}
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '1.75rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                Modifier l&apos;Actif : {editingAsset.code}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Code Actif / Matricule *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="df-mono"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Désignation Actif *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Marque
                  </label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Modèle
                  </label>
                  <input
                    type="text"
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Catégorie
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as AssetCategory })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.825rem',
                    }}
                  >
                    <option value={AssetCategory.HEAVY_TRUCK}>Poids Lourds</option>
                    <option value={AssetCategory.CONSTRUCTION_EQUIPMENT}>Engin BTP</option>
                    <option value={AssetCategory.ROAD_VEHICLE}>Véhicule Léger</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Intervalle Révision OEM
                  </label>
                  <input
                    type="number"
                    value={editForm.maintenanceIntervalValue}
                    onChange={(e) => setEditForm({ ...editForm, maintenanceIntervalValue: Number(e.target.value) })}
                    className="df-mono"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-status-danger)',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: 'var(--df-status-danger)' }}>
              <IconAlertTriangle size={22} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Supprimer cet Actif ?
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--df-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Confirmez-vous la suppression de l&apos;actif <strong>« {deleteConfirm.label} »</strong> ? L&apos;ensemble de l&apos;historique de télémétrie associé sera archivé.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--df-radius-sm)',
                  background: 'var(--df-status-danger)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
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
