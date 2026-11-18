'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import {
  IconWrench,
  IconRefreshCw,
  IconAlertTriangle,
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

import { ChantiersKpiHeader } from '@/components/chantiers/ChantiersKpiHeader';
import { SitesTableView } from '@/components/chantiers/SitesTableView';
import { AssignmentsTableView } from '@/components/chantiers/AssignmentsTableView';
import { HourLogsTableView } from '@/components/chantiers/HourLogsTableView';
import { TanksConsumablesView } from '@/components/chantiers/TanksConsumablesView';
import { WorkSituationsView } from '@/components/chantiers/WorkSituationsView';
import { TransferChecklistsView } from '@/components/chantiers/TransferChecklistsView';
import { ChantiersModals } from '@/components/chantiers/ChantiersModals';

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
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur de chargement des données des chantiers.',
      );
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
        <ChantiersKpiHeader
          metrics={metrics}
          tanksCount={tanks.length}
          workSituationsCount={workSituations.length}
        />

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

        {/* CONTENU DES ONGLETS */}
        {activeTab === 'sites' && (
          <SitesTableView
            filteredSites={filteredSites}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsTableView
            assignments={assignments}
            assetMap={assetMap}
          />
        )}

        {activeTab === 'hours' && (
          <HourLogsTableView
            hourLogs={hourLogs}
            assetMap={assetMap}
          />
        )}

        {activeTab === 'tanks' && (
          <TanksConsumablesView
            tanks={tanks}
            deliveries={deliveries}
            siteMap={siteMap}
            onOpenDeliveryModal={() => setShowDeliveryModal(true)}
            onOpenTankModal={() => setShowTankModal(true)}
          />
        )}

        {activeTab === 'situations' && (
          <WorkSituationsView
            workSituations={workSituations}
            siteMap={siteMap}
            actionLoading={actionLoading}
            onOpenSituationModal={() => setShowSituationModal(true)}
            onApproveSituation={handleApproveSituation}
            onBillSituation={handleBillSituation}
            onSettleSituation={handleSettleSituation}
          />
        )}

        {activeTab === 'transfers' && (
          <TransferChecklistsView
            checklists={checklists}
            assetMap={assetMap}
          />
        )}
      </main>

      {/* MODALES */}
      <ChantiersModals
        sites={sites}
        tanks={tanks}
        siteMap={siteMap}
        showTankModal={showTankModal}
        onCloseTankModal={() => setShowTankModal(false)}
        newTankForm={newTankForm}
        onTankFormChange={setNewTankForm}
        onCreateTank={handleCreateTank}
        showDeliveryModal={showDeliveryModal}
        onCloseDeliveryModal={() => setShowDeliveryModal(false)}
        newDeliveryForm={newDeliveryForm}
        onDeliveryFormChange={setNewDeliveryForm}
        onRecordDelivery={handleRecordDelivery}
        showSituationModal={showSituationModal}
        onCloseSituationModal={() => setShowSituationModal(false)}
        newSituationForm={newSituationForm}
        onSituationFormChange={setNewSituationForm}
        onCreateSituation={handleCreateSituation}
        actionLoading={actionLoading}
      />
    </div>
  );
}
