'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconTruck,
  IconWrench,
  IconActivity,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconRefreshCw,
  IconPlus,
  IconFileText,
  IconSearch,
  IconFuel,
  IconDatabase,
  IconClock,
  IconCheckCircle,
  IconX,
} from '@/components/navigation/TechIcons';
import { AuthClient } from '@/lib/api-auth';
import { ChantiersClient } from '@/lib/api-chantiers';
import { AssetClient } from '@/lib/api-assets';
import { formatCurrency } from '@/lib/currency-formatter';
import { useDemoMode } from '../../context/DemoModeContext';
import {
  SiteWorkspace,
  AssetSiteAssignment,
  AssetEngineHourLog,
  AssetTransferChecklist,
  Asset,
  SiteConsumableTank,
  SiteConsumableDelivery,
  SiteWorkSituation,
  ConsumableType,
  CreateSiteConsumableTankDto,
  RecordSiteConsumableDeliveryDto,
  CreateSiteWorkSituationDto,
} from '@docteurflotte/contracts';

const CONSUMABLE_CONFIG: Record<
  ConsumableType,
  { label: string; badgeClass: string; barColor: string }
> = {
  [ConsumableType.GASOIL]: {
    label: 'Gasoil',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    barColor: 'bg-amber-500',
  },
  [ConsumableType.SIRGHAZ_GPL]: {
    label: 'Sirghaz GPLc',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    barColor: 'bg-emerald-500',
  },
  [ConsumableType.ESSENCE_SP]: {
    label: 'Sans Plomb SP95',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    barColor: 'bg-red-500',
  },
  [ConsumableType.HUILE_HYDRAULIQUE_ISO46]: {
    label: 'Huile Hydr. ISO 46',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    barColor: 'bg-purple-500',
  },
  [ConsumableType.HUILE_HYDRAULIQUE_ISO68]: {
    label: 'Huile Hydr. ISO 68',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    barColor: 'bg-purple-500',
  },
  [ConsumableType.HUILE_MOTEUR_15W40]: {
    label: 'Huile Moteur 15W40',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    barColor: 'bg-blue-500',
  },
  [ConsumableType.HUILE_PONT_80W90]: {
    label: 'Huile Pont 80W90',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    barColor: 'bg-indigo-500',
  },
  [ConsumableType.ADBLUE]: {
    label: 'AdBlue DEF',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    barColor: 'bg-cyan-500',
  },
  [ConsumableType.LIQUIDE_REFROIDISSEMENT]: {
    label: 'Liquide Refroidissement',
    badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
    barColor: 'bg-teal-500',
  },
  [ConsumableType.GRAISSE]: {
    label: 'Graisse HP',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    barColor: 'bg-orange-500',
  },
};

export default function ChantiersPage() {
  const { isDemoMode } = useDemoMode();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SiteWorkspace[]>([]);
  const [assignments, setAssignments] = useState<AssetSiteAssignment[]>([]);
  const [hourLogs, setHourLogs] = useState<AssetEngineHourLog[]>([]);
  const [checklists, setChecklists] = useState<AssetTransferChecklist[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tanks, setTanks] = useState<SiteConsumableTank[]>([]);
  const [deliveries, setDeliveries] = useState<SiteConsumableDelivery[]>([]);
  const [workSituations, setWorkSituations] = useState<SiteWorkSituation[]>([]);

  const [activeTab, setActiveTab] = useState<
    'sites' | 'assignments' | 'hours' | 'tanks' | 'situations' | 'transfers'
  >('sites');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modales
  const [showTankModal, setShowTankModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showSituationModal, setShowSituationModal] = useState(false);

  // Formulaire Nouvelle Cuve
  const [newTankForm, setNewTankForm] = useState<CreateSiteConsumableTankDto>({
    siteId: '',
    tankCode: '',
    name: '',
    consumableType: ConsumableType.GASOIL,
    capacityLiters: 10000,
    currentLevelLiters: 10000,
    alertLowLevelPct: 20,
    unitCostRefDzd: 29.0,
  });

  // Formulaire Nouveau BL
  const [newDeliveryForm, setNewDeliveryForm] = useState<RecordSiteConsumableDeliveryDto>({
    siteId: '',
    tankId: '',
    deliveryNoteRef: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    supplierName: 'NAFTAL Spa',
    supplierNif: '',
    consumableType: ConsumableType.GASOIL,
    volumeLiters: 5000,
    density: 0.835,
    unitPriceHtDzd: 24.37,
    vatRatePct: 19,
  });

  // Formulaire Nouvelle Situation de Travaux
  const [newSituationForm, setNewSituationForm] = useState<CreateSiteWorkSituationDto>({
    siteId: '',
    situationNumber: '',
    periodStart: new Date().toISOString().slice(0, 7) + '-01',
    periodEnd: new Date().toISOString().split('T')[0],
    monthWorkAmountHtDzd: 10000000,
    withholdingGuaranteeRatePct: 5,
    vatRatePct: 19,
    clientName: '',
    clientNif: '',
    notes: '',
  });

  useEffect(() => {
    const session = AuthClient.getSession();
    if (session?.token) {
      setToken(session.token);
    }
  }, []);

  const loadData = async (jwt?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isDemoMode) {
        const { getSimulationChantiersData, getSimulationAssets } = await import(
          '@/lib/simulation-sandbox'
        );
        const [demoChantiers, demoAssets] = await Promise.all([
          getSimulationChantiersData(),
          getSimulationAssets().catch(() => []),
        ]);
        setSites(demoChantiers.sites);
        setAssignments(demoChantiers.assignments);
        setHourLogs(demoChantiers.hourLogs);
        setTanks(demoChantiers.tanks);
        setDeliveries(demoChantiers.deliveries);
        setWorkSituations(demoChantiers.workSituations);
        setAssets(demoAssets);
        setChecklists([]);
      } else if (jwt) {
        const [
          sitesData,
          assignmentsData,
          hoursData,
          checklistsData,
          assetsData,
          tanksData,
          deliveriesData,
          situationsData,
        ] = await Promise.all([
          ChantiersClient.listSites(jwt).catch(() => []),
          ChantiersClient.listAssignments(jwt).catch(() => []),
          ChantiersClient.listEngineHourLogs(jwt, { limit: 50 }).catch(() => []),
          ChantiersClient.listTransferChecklists(jwt).catch(() => []),
          AssetClient.listAssets(jwt).catch(() => []),
          ChantiersClient.listTanks(jwt).catch(() => []),
          ChantiersClient.listDeliveries(jwt).catch(() => []),
          ChantiersClient.listWorkSituations(jwt).catch(() => []),
        ]);

        setSites(sitesData);
        setAssignments(assignmentsData);
        setHourLogs(hoursData);
        setChecklists(checklistsData);
        setAssets(assetsData);
        setTanks(tanksData);
        setDeliveries(deliveriesData);
        setWorkSituations(situationsData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des chantiers.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(token || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isDemoMode]);

  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  const siteMap = useMemo(() => {
    const map = new Map<string, SiteWorkspace>();
    sites.forEach((s) => map.set(s.id, s));
    return map;
  }, [sites]);

  // Métriques globales
  const metrics = useMemo(() => {
    const activeSitesCount = sites.filter((s) => s.status === 'ACTIVE').length;
    const activeAssignmentsCount = assignments.filter((a) => a.status === 'ACTIVE').length;
    let totalHoursRun = 0;
    hourLogs.forEach((l) => {
      totalHoursRun += Number(l.deltaHoursSinceLast || 0);
    });

    let totalBudget = 0;
    sites.forEach((s) => {
      totalBudget += Number(s.budgetAllocatedDzd || 0);
    });

    const lowStockTanksCount = tanks.filter(
      (t) => (t.currentLevelLiters / t.capacityLiters) * 100 <= t.alertLowLevelPct,
    ).length;

    let totalWorkSituationsDzd = 0;
    workSituations.forEach((ws) => {
      totalWorkSituationsDzd += Number(ws.totalPayableTtcDzd || 0);
    });

    return {
      activeSitesCount,
      activeAssignmentsCount,
      totalHoursRun: Math.round(totalHoursRun),
      totalBudget,
      totalSites: sites.length,
      lowStockTanksCount,
      totalWorkSituationsDzd,
    };
  }, [sites, assignments, hourLogs, tanks, workSituations]);

  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return sites;
    const q = searchQuery.toLowerCase();
    return sites.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.clientName && s.clientName.toLowerCase().includes(q)),
    );
  }, [sites, searchQuery]);

  // Actions Situations de travaux
  const handleApproveSituation = async (situationId: string) => {
    setActionLoading(situationId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (isDemoMode) {
        setWorkSituations((prev) =>
          prev.map((s) => (s.id === situationId ? { ...s, status: 'APPROVED' } : s)),
        );
        setSuccessMsg(
          'Situation approuvée avec succès (Visa Maître d’Œuvre / CTC enregistré en simulation).',
        );
      } else if (token) {
        const updated = await ChantiersClient.approveWorkSituation(situationId, token);
        setWorkSituations((prev) => prev.map((s) => (s.id === situationId ? updated : s)));
        setSuccessMsg(
          `Situation ${updated.situationNumber} approuvée. Prête pour émission de facture et écriture SCF.`,
        );
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l’approbation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBillSituation = async (situationId: string) => {
    setActionLoading(situationId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (isDemoMode) {
        setWorkSituations((prev) =>
          prev.map((s) => (s.id === situationId ? { ...s, status: 'BILLED' } : s)),
        );
        setSuccessMsg(
          'Facture SCF & Écriture comptable générées : Débit 411100 (Client), Débit 411700 (Retenue 5% Décret 15-247), Crédit 704000 (Production), Crédit 445780 (TVA en attente encaissement Art. 14 CTCA).',
        );
      } else if (token) {
        const updated = await ChantiersClient.billWorkSituation(situationId, token);
        setWorkSituations((prev) => prev.map((s) => (s.id === situationId ? updated : s)));
        setSuccessMsg(
          `Facture émise pour la situation ${updated.situationNumber}. Écriture SCF générée au Grand Livre.`,
        );
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la facturation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSettleSituation = async (situationId: string) => {
    setActionLoading(situationId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (isDemoMode) {
        setWorkSituations((prev) =>
          prev.map((s) =>
            s.id === situationId
              ? {
                  ...s,
                  status: 'PAID',
                  isSettled: true,
                  settlementDate: new Date().toISOString().split('T')[0],
                }
              : s,
          ),
        );
        setSuccessMsg(
          'Encaissement validé : La TVA a été virée du compte 445780 vers le compte 445710 (TVA collectée exigible Art. 14 CTCA).',
        );
      } else if (token) {
        const updated = await ChantiersClient.settleWorkSituation(situationId, token);
        setWorkSituations((prev) => prev.map((s) => (s.id === situationId ? updated : s)));
        setSuccessMsg(
          `Règlement encaissé pour ${updated.situationNumber}. TVA transférée au compte 445710.`,
        );
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l’encaissement.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateTank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTankForm.siteId || !newTankForm.tankCode || !newTankForm.name) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires de la cuve.');
      return;
    }
    setActionLoading('create-tank');
    try {
      if (isDemoMode) {
        const fakeTank: SiteConsumableTank = {
          id: `tank-${Date.now()}`,
          tenantId: 'demo-tenant',
          siteId: newTankForm.siteId,
          tankCode: newTankForm.tankCode,
          name: newTankForm.name,
          consumableType: newTankForm.consumableType,
          capacityLiters: Number(newTankForm.capacityLiters),
          currentLevelLiters: Number(newTankForm.currentLevelLiters || newTankForm.capacityLiters),
          alertLowLevelPct: Number(newTankForm.alertLowLevelPct || 20),
          unitCostRefDzd: Number(newTankForm.unitCostRefDzd || 29),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTanks((prev) => [fakeTank, ...prev]);
        setShowTankModal(false);
        setSuccessMsg(`Cuve ${fakeTank.tankCode} créée avec succès (Mode Démonstration).`);
      } else if (token) {
        const created = await ChantiersClient.createTank(newTankForm, token);
        setTanks((prev) => [created, ...prev]);
        setShowTankModal(false);
        setSuccessMsg(`Cuve ${created.tankCode} ajoutée avec succès au chantier.`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur création cuve.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecordDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeliveryForm.siteId || !newDeliveryForm.deliveryNoteRef || !newDeliveryForm.volumeLiters) {
      setErrorMsg('Veuillez renseigner le chantier, le bon de livraison et le volume.');
      return;
    }
    setActionLoading('record-delivery');
    try {
      if (isDemoMode) {
        const fakeDel: SiteConsumableDelivery = {
          id: `del-${Date.now()}`,
          tenantId: 'demo-tenant',
          siteId: newDeliveryForm.siteId,
          tankId: newDeliveryForm.tankId,
          deliveryNoteRef: newDeliveryForm.deliveryNoteRef,
          deliveryDate: newDeliveryForm.deliveryDate || new Date().toISOString().split('T')[0],
          supplierName: newDeliveryForm.supplierName || 'NAFTAL',
          supplierNif: newDeliveryForm.supplierNif,
          consumableType: newDeliveryForm.consumableType,
          volumeLiters: Number(newDeliveryForm.volumeLiters),
          density: Number(newDeliveryForm.density || 0.835),
          unitPriceHtDzd: Number(newDeliveryForm.unitPriceHtDzd),
          totalHtDzd: Number(newDeliveryForm.volumeLiters) * Number(newDeliveryForm.unitPriceHtDzd),
          vatRatePct: Number(newDeliveryForm.vatRatePct || 19),
          vatAmountDzd:
            Number(newDeliveryForm.volumeLiters) *
            Number(newDeliveryForm.unitPriceHtDzd) *
            (Number(newDeliveryForm.vatRatePct || 19) / 100),
          totalTtcDzd:
            Number(newDeliveryForm.volumeLiters) *
            Number(newDeliveryForm.unitPriceHtDzd) *
            (1 + Number(newDeliveryForm.vatRatePct || 19) / 100),
          sha256Proof: 'mock-sha256-' + Math.random().toString(36).substring(2),
          createdAt: new Date().toISOString(),
        };
        setDeliveries((prev) => [fakeDel, ...prev]);
        if (newDeliveryForm.tankId) {
          setTanks((prev) =>
            prev.map((t) =>
              t.id === newDeliveryForm.tankId
                ? {
                    ...t,
                    currentLevelLiters: Math.min(
                      t.capacityLiters,
                      t.currentLevelLiters + Number(newDeliveryForm.volumeLiters),
                    ),
                    lastDeliveryDate: fakeDel.deliveryDate,
                  }
                : t,
            ),
          );
        }
        setShowDeliveryModal(false);
        setSuccessMsg(
          `Bon de livraison ${fakeDel.deliveryNoteRef} enregistré avec empreinte cryptographique.`,
        );
      } else if (token) {
        const created = await ChantiersClient.recordDelivery(newDeliveryForm, token);
        setDeliveries((prev) => [created, ...prev]);
        loadData(token);
        setShowDeliveryModal(false);
        setSuccessMsg(`Bon de livraison ${created.deliveryNoteRef} enregistré avec succès.`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur enregistrement livraison.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSituation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newSituationForm.siteId ||
      !newSituationForm.situationNumber ||
      !newSituationForm.monthWorkAmountHtDzd
    ) {
      setErrorMsg('Veuillez renseigner le chantier, le numéro de situation et le montant des travaux.');
      return;
    }
    setActionLoading('create-situation');
    try {
      if (isDemoMode) {
        const brutHt = Number(newSituationForm.monthWorkAmountHtDzd);
        const rateRet = Number(newSituationForm.withholdingGuaranteeRatePct || 5);
        const retDzd = brutHt * (rateRet / 100);
        const netHt = brutHt - retDzd;
        const rateVat = Number(newSituationForm.vatRatePct || 19);
        const vatDzd = netHt * (rateVat / 100);
        const totalTtc = netHt + vatDzd;

        const fakeSit: SiteWorkSituation = {
          id: `sit-${Date.now()}`,
          tenantId: 'demo-tenant',
          siteId: newSituationForm.siteId,
          situationNumber: newSituationForm.situationNumber,
          periodStart: newSituationForm.periodStart,
          periodEnd: newSituationForm.periodEnd,
          monthWorkAmountHtDzd: brutHt,
          withholdingGuaranteeRatePct: rateRet,
          withholdingGuaranteeAmountDzd: retDzd,
          netWorkAmountHtDzd: netHt,
          vatRatePct: rateVat,
          vatAmountDzd: vatDzd,
          totalPayableTtcDzd: totalTtc,
          status: 'DRAFT',
          clientName: newSituationForm.clientName || 'Maître d’Ouvrage',
          clientNif: newSituationForm.clientNif,
          vatTaxPoint: 'ENCAISSEMENT',
          isSettled: false,
          notes: newSituationForm.notes,
          sha256Seal: 'mock-sha256-seal-' + Math.random().toString(36).substring(2),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setWorkSituations((prev) => [fakeSit, ...prev]);
        setShowSituationModal(false);
        setSuccessMsg(
          `Situation ${fakeSit.situationNumber} créée (Retenue 5% : ${formatCurrency(retDzd)} déduite).`,
        );
      } else if (token) {
        const created = await ChantiersClient.createWorkSituation(newSituationForm, token);
        setWorkSituations((prev) => [created, ...prev]);
        setShowSituationModal(false);
        setSuccessMsg(`Situation ${created.situationNumber} créée avec succès.`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur création situation.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--df-bg-base)',
        color: 'var(--df-text-main)',
      }}
    >
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* EN-TÊTE PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--df-border-subtle)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--df-brand-primary-alpha)] text-[var(--df-brand-primary)]">
                <IconWrench size={26} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--df-text-main)]">
                  Chantiers BTP, Carrières & Engins Lourds
                </h1>
                <p className="text-sm text-[var(--df-text-muted)]">
                  Parc d’engins, gestion multi-fluides (Gasoil, GPLc, Huiles ISO 46/68, AdBlue),
                  relevés CAN J1939 et situations DPM (Décret 15-247).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(token || undefined)}
              disabled={loading}
              className="p-2 rounded-lg border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface-elevated)] transition-all"
              title="Rafraîchir"
            >
              <IconRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconAlertTriangle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="opacity-70 hover:opacity-100">
              <IconX size={16} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconCheckCircle size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="opacity-70 hover:opacity-100">
              <IconX size={16} />
            </button>
          </div>
        )}

        {/* CARTES DE SYNTHÈSE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-[var(--df-text-muted)] uppercase tracking-wider">
              Chantiers Actifs
            </span>
            <div className="text-2xl font-bold text-[var(--df-text-main)]">
              {metrics.activeSitesCount}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">{metrics.totalSites} sites au total</p>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Engins Déployés
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.activeAssignmentsCount}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Affectations actives terrain</p>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Heures Travaillées
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalHoursRun.toLocaleString()} h
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">Relevés cumulés</p>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Cuves & Fluides
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {tanks.length}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">
              {metrics.lowStockTanksCount > 0 ? (
                <span className="text-red-500 font-semibold">
                  {metrics.lowStockTanksCount} en alerte bas niveau
                </span>
              ) : (
                'Niveaux sous contrôle'
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] space-y-1">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Situations (DPM)
            </span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(metrics.totalWorkSituationsDzd)}
            </div>
            <p className="text-xs text-[var(--df-text-muted)]">
              {workSituations.length} décomptes émis
            </p>
          </div>
        </div>

        {/* ONGLETS DE NAVIGATION */}
        <div className="flex border-b border-[var(--df-border-subtle)] gap-2 overflow-x-auto scrollbar-none max-w-full whitespace-nowrap">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'sites'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Chantiers & Sites ({sites.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'assignments'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Affectations Actives ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'hours'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Heures Moteur & Conso ({hourLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('tanks')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'tanks'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Cuves & Fluides Multi-Métiers ({tanks.length})
          </button>
          <button
            onClick={() => setActiveTab('situations')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'situations'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Situations de Travaux DPM ({workSituations.length})
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'transfers'
                ? 'border-[var(--df-brand-primary)] text-[var(--df-brand-primary)]'
                : 'border-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]'
            }`}
          >
            Transferts Inter-Chantiers ({checklists.length})
          </button>
        </div>

        {/* 1. ONGLET CHANTIERS */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <IconSearch
                  size={16}
                  className="absolute left-3 top-3 text-[var(--df-text-muted)]"
                />
                <input
                  type="text"
                  placeholder="Rechercher chantier par code, nom ou client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                />
              </div>
            </div>

            {filteredSites.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconWrench size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">
                  Aucun chantier enregistré
                </p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Déclarez vos zones de terrassement, carrières ou bases logistiques pour suivre les
                  heures moteur, les fluides et la rentabilité en DZD.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    className="p-5 rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)] flex flex-col justify-between space-y-4 hover:border-[var(--df-brand-primary)] transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--df-brand-primary)]">
                          {site.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            site.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {site.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-[var(--df-text-main)] line-clamp-1">
                        {site.name}
                      </h3>
                      <p className="text-xs text-[var(--df-text-muted)]">
                        Wilaya {site.wilayaCode.toString().padStart(2, '0')} • Client:{' '}
                        {site.clientName || 'Interne'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--df-border-subtle)] grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--df-text-muted)]">Engins Actifs</span>
                        <p className="font-bold text-[var(--df-text-main)]">
                          {site.activeAssetsCount || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--df-text-muted)]">Budget Alloué</span>
                        <p className="font-bold text-[var(--df-text-main)]">
                          {formatCurrency(Number(site.budgetAllocatedDzd))}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/chantiers/${site.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)] text-[var(--df-text-main)] hover:bg-[var(--df-brand-primary)] hover:text-white hover:border-transparent transition-all"
                      >
                        Bilan de Rentabilité & Engins →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ONGLET AFFECTATIONS */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconTruck size={36} className="mx-auto text-[var(--df-text-muted)] opacity-60" />
                <p className="text-base font-semibold text-[var(--df-text-main)]">
                  Aucune affectation active
                </p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Les engins de chantier ou camions déployés sur site s’afficheront ici avec leur
                  tarif interne journalier.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">Engin / Actif</th>
                      <th className="py-3 px-4">Chantier</th>
                      <th className="py-3 px-4">Date Début</th>
                      <th className="py-3 px-4 text-right">Compteur Début</th>
                      <th className="py-3 px-4 text-right">Tarif Interne / j</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {assignments.map((ass) => {
                      const asset = assetMap.get(ass.assetId);
                      return (
                        <tr
                          key={ass.id}
                          className="hover:bg-[var(--df-bg-surface)] transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--df-text-main)]">
                              {asset
                                ? `${asset.code} — ${asset.name}`
                                : ass.assetCode || ass.assetId.slice(0, 8)}
                            </div>
                            <span className="text-xs text-[var(--df-text-muted)]">
                              {asset?.category || 'Engin BTP'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-[var(--df-text-main)]">
                            {ass.siteName || ass.siteId.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                            {new Date(ass.startDate).toLocaleDateString('fr-DZ')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-[var(--df-text-main)]">
                            {ass.startMeterHours} h
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {formatCurrency(Number(ass.internalDailyRateDzd))}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                ass.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {ass.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. ONGLET HEURES MOTEUR & MULTI-CONSOMMABLES */}
        {activeTab === 'hours' && (
          <div className="space-y-4">
            {hourLogs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconActivity
                  size={36}
                  className="mx-auto text-[var(--df-text-muted)] opacity-60"
                />
                <p className="text-base font-semibold text-[var(--df-text-main)]">
                  Aucun relevé horaire enregistré
                </p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Les relevés déclaratifs Mode 0 et les télémétries CAN J1939 s’afficheront ici avec
                  le contrôle anti-dérive et les coûts multi-consommables.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">Date & Heure</th>
                      <th className="py-3 px-4">Actif</th>
                      <th className="py-3 px-4 text-right">Compteur</th>
                      <th className="py-3 px-4 text-right">Delta Heures</th>
                      <th className="py-3 px-4">Carburant Principal</th>
                      <th className="py-3 px-4 text-right">Fluides Complémentaires</th>
                      <th className="py-3 px-4 text-right">Coût Total Fluides</th>
                      <th className="py-3 px-4 text-center">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {hourLogs.map((log) => {
                      const asset = assetMap.get(log.assetId);
                      const fuelConf = log.fuelType
                        ? CONSUMABLE_CONFIG[log.fuelType as ConsumableType] ||
                          CONSUMABLE_CONFIG[ConsumableType.GASOIL]
                        : CONSUMABLE_CONFIG[ConsumableType.GASOIL];
                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-[var(--df-bg-surface)] transition-colors"
                        >
                          <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                            {new Date(log.recordedAt).toLocaleString('fr-DZ')}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">
                            {asset ? `${asset.code} — ${asset.name}` : log.assetId.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--df-text-main)]">
                            {log.hoursValue} h
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            +{log.deltaHoursSinceLast} h
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold border ${fuelConf.badgeClass}`}
                              >
                                {fuelConf.label}
                              </span>
                              <span className="text-xs font-mono font-medium">
                                {log.fuelConsumedLiters ? `${log.fuelConsumedLiters} L` : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-[var(--df-text-muted)]">
                            {log.hydraulicOilLiters ? (
                              <div className="text-purple-600 dark:text-purple-400 font-medium">
                                Hydr: {log.hydraulicOilLiters} L
                              </div>
                            ) : null}
                            {log.adblueLiters ? (
                              <div className="text-cyan-600 dark:text-cyan-400 font-medium">
                                AdBlue: {log.adblueLiters} L
                              </div>
                            ) : null}
                            {log.engineOilLiters ? (
                              <div className="text-blue-600 dark:text-blue-400 font-medium">
                                Moteur: {log.engineOilLiters} L
                              </div>
                            ) : null}
                            {!log.hydraulicOilLiters && !log.adblueLiters && !log.engineOilLiters && (
                              <span>—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[var(--df-text-main)]">
                            {log.totalConsumablesCostDzd
                              ? formatCurrency(Number(log.totalConsumablesCostDzd))
                              : log.fuelCostDzd
                                ? formatCurrency(Number(log.fuelCostDzd))
                                : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]">
                              {log.source}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. ONGLET CUVES & GESTION MULTI-FLUIDES */}
        {activeTab === 'tanks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--df-text-main)] flex items-center gap-2">
                  <IconFuel size={20} className="text-amber-500" />
                  Cuves de Chantier & Stocks de Fluides Industriels
                </h2>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Suivi des réserves fixes, citernes mobiles et fûts d’atelier (Gasoil, GPLc,
                  Essence, Huiles ISO 46/68, AdBlue).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeliveryModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] text-[var(--df-text-main)] hover:bg-[var(--df-bg-surface)] transition-all"
                >
                  <IconFileText size={15} />
                  Réceptionner BL Naftal
                </button>
                <button
                  onClick={() => setShowTankModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--df-brand-primary)] text-white hover:bg-[var(--df-brand-primary)]/90 transition-all shadow-sm"
                >
                  <IconPlus size={15} />
                  Nouvelle Cuve
                </button>
              </div>
            </div>

            {tanks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconDatabase
                  size={36}
                  className="mx-auto text-[var(--df-text-muted)] opacity-60"
                />
                <p className="text-base font-semibold text-[var(--df-text-main)]">
                  Aucune cuve de stockage enregistrée
                </p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Ajoutez vos cuves fixes, citernes mobiles ravitailleuses ou parcs de fûts pour
                  contrôler les niveaux de fluides et rapprocher les bons de livraison Naftal.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tanks.map((tank) => {
                  const conf =
                    CONSUMABLE_CONFIG[tank.consumableType] ||
                    CONSUMABLE_CONFIG[ConsumableType.GASOIL];
                  const site = siteMap.get(tank.siteId);
                  const pct = Math.min(
                    100,
                    Math.max(0, (tank.currentLevelLiters / tank.capacityLiters) * 100),
                  );
                  const isLow = pct <= tank.alertLowLevelPct;

                  return (
                    <div
                      key={tank.id}
                      className={`p-5 rounded-2xl border transition-all space-y-4 bg-[var(--df-bg-surface-elevated)] ${
                        isLow
                          ? 'border-red-500/50 shadow-sm shadow-red-500/10'
                          : 'border-[var(--df-border-subtle)] hover:border-[var(--df-brand-primary)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[var(--df-brand-primary)]">
                              {tank.tankCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${conf.badgeClass}`}
                            >
                              {conf.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[var(--df-text-main)] mt-1">
                            {tank.name}
                          </h3>
                          <p className="text-xs text-[var(--df-text-muted)]">
                            {site ? site.name : `Chantier ${tank.siteId.slice(0, 8)}`}
                          </p>
                        </div>

                        {isLow && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1 shrink-0">
                            <IconAlertTriangle size={12} /> Stock Bas
                          </span>
                        )}
                      </div>

                      {/* Jauge graphique */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-[var(--df-text-muted)]">Niveau actuel</span>
                          <span className="font-mono font-bold text-[var(--df-text-main)]">
                            {tank.currentLevelLiters.toLocaleString()} L /{' '}
                            {tank.capacityLiters.toLocaleString()} L ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[var(--df-bg-base)] overflow-hidden border border-[var(--df-border-subtle)]">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isLow ? 'bg-red-500' : conf.barColor
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[var(--df-text-muted)]">
                          <span>Alerte à {tank.alertLowLevelPct}%</span>
                          <span>Réf: {formatCurrency(Number(tank.unitCostRefDzd))}/L</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--df-border-subtle)] flex items-center justify-between text-xs text-[var(--df-text-muted)]">
                        <span>
                          Dernier BL:{' '}
                          {tank.lastDeliveryDate
                            ? new Date(tank.lastDeliveryDate).toLocaleDateString('fr-DZ')
                            : 'Aucun'}
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Val: {formatCurrency(tank.currentLevelLiters * Number(tank.unitCostRefDzd))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TABLEAU DES LIVRAISONS & APPROVISIONNEMENTS */}
            <div className="space-y-3 pt-6 border-t border-[var(--df-border-subtle)]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                  <IconFileText size={18} className="text-blue-500" />
                  Bons de Livraison Naftal & Distributeurs Réceptionnés
                </h3>
                <span className="text-xs text-[var(--df-text-muted)] font-mono">
                  {deliveries.length} BL enregistrés avec intégrité SHA-256
                </span>
              </div>

              {deliveries.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[var(--df-border-subtle)] rounded-xl text-xs text-[var(--df-text-muted)]">
                  Aucun bon de livraison enregistré pour l’instant.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Réf. Bon de Livraison</th>
                        <th className="py-3 px-4">Fournisseur</th>
                        <th className="py-3 px-4">Produit</th>
                        <th className="py-3 px-4 text-right">Volume (L)</th>
                        <th className="py-3 px-4 text-right">Densité (15°C)</th>
                        <th className="py-3 px-4 text-right">Montant HT</th>
                        <th className="py-3 px-4 text-right">TVA (19%)</th>
                        <th className="py-3 px-4 text-right">Total TTC</th>
                        <th className="py-3 px-4 text-center">Sceau SHA-256</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--df-border-subtle)]">
                      {deliveries.map((del) => {
                        const conf =
                          CONSUMABLE_CONFIG[del.consumableType] ||
                          CONSUMABLE_CONFIG[ConsumableType.GASOIL];
                        return (
                          <tr
                            key={del.id}
                            className="hover:bg-[var(--df-bg-surface)] transition-colors"
                          >
                            <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                              {new Date(del.deliveryDate).toLocaleDateString('fr-DZ')}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-[var(--df-text-main)]">
                              {del.deliveryNoteRef}
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <div className="font-semibold text-[var(--df-text-main)]">
                                {del.supplierName}
                              </div>
                              <span className="text-[var(--df-text-muted)] font-mono">
                                {del.supplierNif || 'NIF NAFTAL'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold border ${conf.badgeClass}`}
                              >
                                {conf.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[var(--df-text-main)]">
                              {del.volumeLiters.toLocaleString()} L
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs text-[var(--df-text-muted)]">
                              {del.density ? del.density.toFixed(3) : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                              {formatCurrency(Number(del.totalHtDzd))}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-[var(--df-text-muted)]">
                              {formatCurrency(Number(del.vatAmountDzd))}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(Number(del.totalTtcDzd))}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                title={del.sha256Proof}
                                className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--df-text-muted)] px-1.5 py-0.5 rounded bg-[var(--df-bg-base)] border border-[var(--df-border-subtle)]"
                              >
                                <IconShieldCheck size={12} className="text-emerald-500" />
                                {del.sha256Proof ? del.sha256Proof.slice(0, 8) + '…' : 'Validé'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. ONGLET SITUATIONS DE TRAVAUX (DPM DÉCRET 15-247 & ART. 14 CTCA) */}
        {activeTab === 'situations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--df-text-main)] flex items-center gap-2">
                  <IconFileText size={20} className="text-purple-500" />
                  Situations de Travaux & Décomptes Provisoires Mensuels (DPM)
                </h2>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Conformité stricte Marchés Publics BTPH (Décret 15-247) : Déduction automatique de
                  la retenue de garantie de 5% (compte 411700) et TVA exigible à l’encaissement
                  (compte 445780, Art. 14 CTCA).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSituationModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--df-brand-primary)] text-white hover:bg-[var(--df-brand-primary)]/90 transition-all shadow-sm"
                >
                  <IconPlus size={15} />
                  Nouvelle Situation (DPM)
                </button>
              </div>
            </div>

            {/* Bannière explicative fiscale & juridique */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-[var(--df-text-muted)] space-y-1">
              <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                <IconShieldCheck size={16} />
                <span>Régime Juridique & Comptable Algérien des Travaux BTPH</span>
              </div>
              <p>
                1. <strong>Retenue de Garantie (5%)</strong> : Déduite du montant brut HT et isolée
                au compte de tiers <code>411700</code> jusqu’à la réception définitive des travaux
                (Art. 132 Décret 15-247).
              </p>
              <p>
                2. <strong>Fait Générateur TVA (Encaissement)</strong> : Pour les prestations de
                travaux et services (Art. 14 CTCA), la TVA collectée n’est pas exigible à la
                facturation. Elle reste cantonnée au compte d’attente <code>445780</code> et n’est
                transférée au compte <code>445710</code> (G50 exigible) que lors de l’encaissement
                bancaire effectif.
              </p>
            </div>

            {workSituations.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconFileText
                  size={36}
                  className="mx-auto text-[var(--df-text-muted)] opacity-60"
                />
                <p className="text-base font-semibold text-[var(--df-text-main)]">
                  Aucune situation de travaux enregistrée
                </p>
                <p className="text-xs text-[var(--df-text-muted)] max-w-md mx-auto">
                  Émettez vos décomptes provisoires mensuels (DPM) pour chaque chantier BTPH afin de
                  générer automatiquement les écritures SCF et contrôler les encaissements.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">N° Situation</th>
                      <th className="py-3 px-4">Chantier & Client</th>
                      <th className="py-3 px-4">Période</th>
                      <th className="py-3 px-4 text-right">Travaux Brut HT</th>
                      <th className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">
                        Retenue 5% (411700)
                      </th>
                      <th className="py-3 px-4 text-right">Net Travaux HT</th>
                      <th className="py-3 px-4 text-right text-purple-600 dark:text-purple-400">
                        TVA 19% (445780)
                      </th>
                      <th className="py-3 px-4 text-right font-bold">Total TTC à Payer</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-center">Actions & Écritures SCF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {workSituations.map((sit) => {
                      const site = siteMap.get(sit.siteId);
                      const isPending = actionLoading === sit.id;

                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400">
                          Brouillon (DRAFT)
                        </span>
                      );
                      if (sit.status === 'APPROVED') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Approuvé (CTC/MO)
                          </span>
                        );
                      } else if (sit.status === 'BILLED') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            Facturé & SCF
                          </span>
                        );
                      } else if (sit.status === 'PAID') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Encaissé & TVA Transférée
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={sit.id}
                          className="hover:bg-[var(--df-bg-surface)] transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                              {sit.situationNumber}
                            </span>
                            <div className="text-[10px] text-[var(--df-text-muted)] font-mono">
                              Sceau:{' '}
                              {sit.sha256Seal ? sit.sha256Seal.slice(0, 8) + '…' : 'Sécurisé'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--df-text-main)]">
                              {site ? site.name : sit.siteId.slice(0, 8)}
                            </div>
                            <span className="text-xs text-[var(--df-text-muted)]">
                              Client: {sit.clientName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                            Du {new Date(sit.periodStart).toLocaleDateString('fr-DZ')} au{' '}
                            {new Date(sit.periodEnd).toLocaleDateString('fr-DZ')}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {formatCurrency(Number(sit.monthWorkAmountHtDzd))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                            -{formatCurrency(Number(sit.withholdingGuaranteeAmountDzd))}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--df-text-main)]">
                            {formatCurrency(Number(sit.netWorkAmountHtDzd))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
                            {formatCurrency(Number(sit.vatAmountDzd))}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(Number(sit.totalPayableTtcDzd))}
                          </td>
                          <td className="py-3 px-4 text-center">{statusBadge}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              {sit.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleApproveSituation(sit.id)}
                                  disabled={isPending}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                                  title="Valider visa ordonnateur / CTC"
                                >
                                  {isPending ? '…' : 'Approuver (CTC)'}
                                </button>
                              )}

                              {sit.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleBillSituation(sit.id)}
                                  disabled={isPending}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 transition-all"
                                  title="Générer facture client et passer l’écriture comptable SCF"
                                >
                                  {isPending ? '…' : 'Facturer & Écriture SCF'}
                                </button>
                              )}

                              {sit.status === 'BILLED' && (
                                <button
                                  onClick={() => handleSettleSituation(sit.id)}
                                  disabled={isPending}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                                  title="Encaisser le règlement et transférer la TVA au compte 445710"
                                >
                                  {isPending ? '…' : 'Encaisser (Art. 14)'}
                                </button>
                              )}

                              {sit.status === 'PAID' && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <IconCheck size={14} /> Réglé
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. ONGLET TRANSFERTS INTER-CHANTIERS */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            {checklists.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[var(--df-border-subtle)] rounded-2xl space-y-3">
                <IconFileText
                  size={36}
                  className="mx-auto text-[var(--df-text-muted)] opacity-60"
                />
                <p className="text-base font-semibold text-[var(--df-text-main)]">
                  Aucun transfert inter-chantiers
                </p>
                <p className="text-xs text-[var(--df-text-muted)]">
                  Les mouvements d’engins entre chantiers avec états des lieux, photos et signatures
                  numériques s’enregistreront ici.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-surface-elevated)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--df-border-subtle)] text-xs uppercase text-[var(--df-text-muted)] font-semibold bg-[var(--df-bg-base)]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Actif</th>
                      <th className="py-3 px-4">Transféré Par</th>
                      <th className="py-3 px-4 text-right">Compteur Départ</th>
                      <th className="py-3 px-4 text-right">Compteur Arrivée</th>
                      <th className="py-3 px-4">État Constaté</th>
                      <th className="py-3 px-4 text-center">Ordre de Travail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--df-border-subtle)]">
                    {checklists.map((chk) => {
                      const asset = assetMap.get(chk.assetId);
                      return (
                        <tr
                          key={chk.id}
                          className="hover:bg-[var(--df-bg-surface)] transition-colors"
                        >
                          <td className="py-3 px-4 text-xs text-[var(--df-text-muted)]">
                            {new Date(chk.transferDate).toLocaleDateString('fr-DZ')}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--df-text-main)]">
                            {asset ? `${asset.code} — ${asset.name}` : chk.assetId.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-[var(--df-text-main)]">{chk.transferredBy}</td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-[var(--df-text-main)]">
                            {chk.meterHoursDeparture} h
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-[var(--df-text-main)]">
                            {chk.meterHoursArrival ? `${chk.meterHoursArrival} h` : 'En transit'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                chk.generalState === 'REQUIRES_REPAIR'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {chk.generalState}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {chk.generatedWorkOrderId ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                                <IconAlertTriangle size={12} /> OT Auto Déclenché
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--df-text-muted)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALE CRÉATION CUVE */}
      {showTankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                <IconPlus size={18} className="text-[var(--df-brand-primary)]" />
                Déclarer une Cuve ou Réserve de Fluide
              </h3>
              <button
                onClick={() => setShowTankModal(false)}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTank} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Chantier d’Affectation *
                </label>
                <select
                  required
                  value={newTankForm.siteId}
                  onChange={(e) => setNewTankForm({ ...newTankForm, siteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--df-brand-primary)]"
                >
                  <option value="">Sélectionner un chantier...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Code Cuve *</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: CUV-FIX-GO-01"
                    value={newTankForm.tankCode}
                    onChange={(e) =>
                      setNewTankForm({ ...newTankForm, tankCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Type de Consommable *
                  </label>
                  <select
                    value={newTankForm.consumableType}
                    onChange={(e) =>
                      setNewTankForm({
                        ...newTankForm,
                        consumableType: e.target.value as ConsumableType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  >
                    {(Object.keys(CONSUMABLE_CONFIG) as ConsumableType[]).map((k) => (
                      <option key={k} value={k}>
                        {CONSUMABLE_CONFIG[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Nom Descriptif / Emplacement *
                </label>
                <input
                  required
                  type="text"
                  placeholder="ex: Cuve Principale Gasoil 20K Sud ou Fûts Huile ISO 46"
                  value={newTankForm.name}
                  onChange={(e) => setNewTankForm({ ...newTankForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Capacité (L) *</label>
                  <input
                    required
                    type="number"
                    min="100"
                    value={newTankForm.capacityLiters}
                    onChange={(e) =>
                      setNewTankForm({ ...newTankForm, capacityLiters: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Niveau Init. (L)</label>
                  <input
                    type="number"
                    min="0"
                    value={newTankForm.currentLevelLiters}
                    onChange={(e) =>
                      setNewTankForm({ ...newTankForm, currentLevelLiters: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Alerte Basse (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={newTankForm.alertLowLevelPct}
                    onChange={(e) =>
                      setNewTankForm({ ...newTankForm, alertLowLevelPct: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowTankModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-tank'}
                  className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold hover:bg-[var(--df-brand-primary)]/90"
                >
                  {actionLoading === 'create-tank' ? 'Enregistrement…' : 'Créer la Cuve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE RÉCEPTION BON DE LIVRAISON */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                <IconFileText size={18} className="text-blue-500" />
                Réceptionner un Bon de Livraison (BL Naftal)
              </h3>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordDelivery} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Chantier *</label>
                  <select
                    required
                    value={newDeliveryForm.siteId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const sTanks = tanks.filter((t) => t.siteId === sId);
                      setNewDeliveryForm({
                        ...newDeliveryForm,
                        siteId: sId,
                        tankId: sTanks[0]?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  >
                    <option value="">Sélectionner chantier...</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Cuve Cible</label>
                  <select
                    value={newDeliveryForm.tankId}
                    onChange={(e) =>
                      setNewDeliveryForm({ ...newDeliveryForm, tankId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  >
                    <option value="">Cuve automatique / Libre</option>
                    {tanks
                      .filter((t) => !newDeliveryForm.siteId || t.siteId === newDeliveryForm.siteId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tankCode} — {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    N° Bon de Livraison *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="ex: BL-NAFTAL-2026-9811"
                    value={newDeliveryForm.deliveryNoteRef}
                    onChange={(e) =>
                      setNewDeliveryForm({ ...newDeliveryForm, deliveryNoteRef: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Date de Livraison *
                  </label>
                  <input
                    required
                    type="date"
                    value={newDeliveryForm.deliveryDate}
                    onChange={(e) =>
                      setNewDeliveryForm({ ...newDeliveryForm, deliveryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Fournisseur *</label>
                  <input
                    required
                    type="text"
                    value={newDeliveryForm.supplierName}
                    onChange={(e) =>
                      setNewDeliveryForm({ ...newDeliveryForm, supplierName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">NIF Fournisseur</label>
                  <input
                    type="text"
                    placeholder="ex: 099916000000031"
                    value={newDeliveryForm.supplierNif || ''}
                    onChange={(e) =>
                      setNewDeliveryForm({ ...newDeliveryForm, supplierNif: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Volume (L) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={newDeliveryForm.volumeLiters}
                    onChange={(e) =>
                      setNewDeliveryForm({
                        ...newDeliveryForm,
                        volumeLiters: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Densité (15°C)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newDeliveryForm.density}
                    onChange={(e) =>
                      setNewDeliveryForm({ ...newDeliveryForm, density: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">Prix Unitaire HT *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newDeliveryForm.unitPriceHtDzd}
                    onChange={(e) =>
                      setNewDeliveryForm({
                        ...newDeliveryForm,
                        unitPriceHtDzd: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'record-delivery'}
                  className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold hover:bg-[var(--df-brand-primary)]/90"
                >
                  {actionLoading === 'record-delivery' ? 'Enregistrement…' : 'Enregistrer le BL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE NOUVELLE SITUATION DE TRAVAUX (DPM) */}
      {showSituationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--df-bg-surface-elevated)] border border-[var(--df-border-subtle)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--df-border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--df-text-main)] flex items-center gap-2">
                <IconFileText size={18} className="text-purple-500" />
                Émettre un Décompte Provisoire Mensuel (DPM)
              </h3>
              <button
                onClick={() => setShowSituationModal(false)}
                className="text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSituation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">Chantier BTPH *</label>
                <select
                  required
                  value={newSituationForm.siteId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const s = siteMap.get(sId);
                    setNewSituationForm({
                      ...newSituationForm,
                      siteId: sId,
                      clientName: s?.clientName || '',
                      clientNif: '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                >
                  <option value="">Sélectionner le chantier...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    N° Décompte / Situation *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="ex: DPM-03-2026-11"
                    value={newSituationForm.situationNumber}
                    onChange={(e) =>
                      setNewSituationForm({
                        ...newSituationForm,
                        situationNumber: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Retenue Garantie (% légal)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSituationForm.withholdingGuaranteeRatePct}
                    onChange={(e) =>
                      setNewSituationForm({
                        ...newSituationForm,
                        withholdingGuaranteeRatePct: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Date Début Période *
                  </label>
                  <input
                    required
                    type="date"
                    value={newSituationForm.periodStart}
                    onChange={(e) =>
                      setNewSituationForm({ ...newSituationForm, periodStart: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Date Fin Période *
                  </label>
                  <input
                    required
                    type="date"
                    value={newSituationForm.periodEnd}
                    onChange={(e) =>
                      setNewSituationForm({ ...newSituationForm, periodEnd: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--df-text-main)]">
                  Montant Brut des Travaux du Mois (DZD HT) *
                </label>
                <input
                  required
                  type="number"
                  min="1000"
                  step="100"
                  value={newSituationForm.monthWorkAmountHtDzd}
                  onChange={(e) =>
                    setNewSituationForm({
                      ...newSituationForm,
                      monthWorkAmountHtDzd: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">
                    Client / Maître d’Ouvrage
                  </label>
                  <input
                    type="text"
                    value={newSituationForm.clientName}
                    onChange={(e) =>
                      setNewSituationForm({ ...newSituationForm, clientName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--df-text-main)]">NIF Client</label>
                  <input
                    type="text"
                    value={newSituationForm.clientNif || ''}
                    onChange={(e) =>
                      setNewSituationForm({ ...newSituationForm, clientNif: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[var(--df-border-subtle)] bg-[var(--df-bg-base)] text-[var(--df-text-main)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--df-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowSituationModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--df-border-subtle)] text-[var(--df-text-muted)] hover:text-[var(--df-text-main)]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-situation'}
                  className="px-4 py-2 rounded-xl bg-[var(--df-brand-primary)] text-white font-semibold hover:bg-[var(--df-brand-primary)]/90"
                >
                  {actionLoading === 'create-situation' ? 'Création…' : 'Émettre la Situation (DPM)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
