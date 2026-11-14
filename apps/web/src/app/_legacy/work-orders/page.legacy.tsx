'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthClient } from '@/lib/api-auth';
import { AssetClient } from '@/lib/api-assets';
import { FleetIntelligenceClient } from '@/lib/api-fleet-intelligence';
import { Navbar } from '@/components/navigation/Navbar';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import {
  Asset,
  AssetCategory,
  AssetStatus,
  DataOrigin,
  MeterType,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@docteurflotte/contracts';
import { useDemoMode } from '@/context/DemoModeContext';
import { useSystemConfig } from '@/context/SystemConfigContext';
import {
  OfficialDgiInvoiceModal,
  DgiInvoiceData,
} from '@/components/finance/OfficialDgiInvoiceModal';
import {
  IconWrench,
  IconTruck,
  IconShieldCheck,
  IconAlertTriangle,
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconCheck,
  IconClock,
  IconCpu,
  IconFileText,
  IconFilter,
  IconArrowUpRight,
} from '@/components/navigation/TechIcons';
import { getSimulationWorkOrders, getSimulationAssets } from '@/lib/simulation-sandbox';

export default function WorkOrdersPage() {
  const router = useRouter();
  const { isDemoMode, isGuest, session } = useDemoMode();
  const { tariffs } = useSystemConfig();
  const [token, setToken] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<'ALL' | 'DVIR' | 'PREDICTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Modale de création d'OT
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWo, setNewWo] = useState({
    assetId: '',
    title: '',
    description: '',
    priority: WorkOrderPriority.MEDIUM,
    estimatedLaborHours: 2,
    assignedTo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modale de modification d'OT
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: WorkOrderPriority.MEDIUM,
    estimatedLaborHours: 2,
    assignedTo: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Modale de suppression d'OT
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; label: string } | null>(null);

  // Modale de clôture d'OT
  const [activeWoForComplete, setActiveWoForComplete] = useState<WorkOrder | null>(null);
  const [completeForm, setCompleteForm] = useState({
    actualLaborHours: 2,
    partsCost: 0,
    downtimeHours: 0,
    completionNotes: '',
  });
  const [isCompleting, setIsCompleting] = useState(false);

  // Modale Facture Fiscale DGI
  const [invoiceModalData, setInvoiceModalData] = useState<DgiInvoiceData | null>(null);

  const handleOpenDgiInvoice = (wo: WorkOrder) => {
    const hourlyRate = tariffs.economicRates?.hourlyLaborRateDzd || 1500;
    const laborHours = wo.actualLaborHours || wo.estimatedLaborHours || 2;
    const laborTotal = laborHours * hourlyRate;
    const partsTotal = wo.partsCost || 0;

    const items = [
      {
        description: `Main d'œuvre atelier qualifiée : ${wo.title} (${wo.assetName || wo.assetCode})`,
        oemReference: 'MO-MEC-ATELIER-DZ',
        quantity: laborHours,
        unitPriceHtDzd: hourlyRate,
        totalHtDzd: laborTotal,
      },
    ];

    if (partsTotal > 0) {
      items.push({
        description: `Lot de pièces détachées d'origine et consommables certifiés OEM`,
        oemReference: wo.oemPartReference || 'OEM-KIT-PREVENTIF-DZ',
        quantity: 1,
        unitPriceHtDzd: partsTotal,
        totalHtDzd: partsTotal,
      });
    }

    const tenantCompanyName = session.tenant?.name || 'SOCIÉTÉ ALGÉRIENNE DE MAINTENANCE & SERVICES INDUSTRIELS EURL';
    const vatRate = tariffs.fiscal?.tvaStandardRate ? Math.round(tariffs.fiscal.tvaStandardRate * 100) : 19;

    const invoiceData: DgiInvoiceData = {
      invoiceNumber: `FAC-DGI-${new Date().getFullYear()}-${wo.id.slice(-5).toUpperCase()}`,
      issueDate: wo.completedAt || new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      paymentMode: 'VIREMENT_BANCAIRE',
      company: {
        legalName: tenantCompanyName,
        tradeName: 'ATELIER MÉCANIQUE CENTRAL DOCTEURFLOTTE',
        address: 'Zone Industrielle Oued Smar, Voie B N° 14',
        wilayaName: 'Alger',
        wilayaCode: 16,
        nif: '001616098765432',
        nis: '00161609876',
        rcNumber: '16/00-9876543B22',
        aiNumber: '16098765432',
        bankAccountRib: '002 00016 1600012345 67 (BEA Rouiba)',
      },
      client: {
        legalName: 'ENTREPRISE NATIONALE DE LOGISTIQUE & TRANSPORT ROUTIER SPA',
        address: 'Zone d’Activité Dar El Beïda, Lot 42',
        wilayaName: 'Alger (16)',
        nif: '001616012345678',
        nis: '00161601234',
        rcNumber: '16/00-1234567B22',
        aiNumber: '16012345678',
      },
      items,
      vatRatePercent: vatRate,
      applyStampDuty: false,
      discountDzd: 0,
    };

    setInvoiceModalData(invoiceData);
  };

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const loadData = async (authToken: string) => {
    setIsLoading(true);
    try {
      const [wos, assetList] = await Promise.all([
        AssetClient.listWorkOrders(authToken),
        AssetClient.listAssets(authToken),
      ]);
      setWorkOrders(wos);
      setAssets(assetList);
      if (assetList.length > 0 && !newWo.assetId) {
        setNewWo((prev) => ({ ...prev, assetId: assetList[0].id }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement.';
      showNotification('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const sess = AuthClient.getSession();
    setToken(sess.token);

    if (isDemoMode) {
      (async () => {
        try {
          const [sandboxWos, sandboxAssets] = await Promise.all([
            getSimulationWorkOrders(),
            getSimulationAssets(),
          ]);
          if (!isCancelled) {
            setWorkOrders(sandboxWos);
            setAssets(sandboxAssets);
            if (sandboxAssets.length > 0 && !newWo.assetId) {
              setNewWo((prev) => ({ ...prev, assetId: sandboxAssets[0].id }));
            }
          }
        } catch {
          if (!isCancelled) {
            setWorkOrders([]);
            setAssets([]);
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      })();
    } else if (sess.token) {
      loadData(sess.token);
    } else {
      setWorkOrders([]);
      setAssets([]);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const handleCreateWo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const created = await AssetClient.createWorkOrder(newWo, token);
      showNotification('success', `Ordre de travail « ${newWo.title} » créé avec succès.`);
      setIsCreateModalOpen(false);
      setNewWo({
        assetId: assets[0]?.id || '',
        title: '',
        description: '',
        priority: WorkOrderPriority.MEDIUM,
        estimatedLaborHours: 2,
        assignedTo: '',
      });
      setWorkOrders((prev) => [created, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la création.';
      showNotification('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (wo: WorkOrder) => {
    setEditingWo(wo);
    setEditForm({
      title: wo.title,
      description: wo.description || '',
      priority: wo.priority,
      estimatedLaborHours: wo.estimatedLaborHours || 2,
      assignedTo: wo.assignedTo || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWo) return;
    setIsUpdating(true);

    try {
      if (isDemoMode) {
        setWorkOrders((prev) =>
          prev.map((w) =>
            w.id === editingWo.id
              ? {
                  ...w,
                  title: editForm.title,
                  description: editForm.description,
                  priority: editForm.priority,
                  estimatedLaborHours: editForm.estimatedLaborHours,
                  assignedTo: editForm.assignedTo,
                }
              : w
          )
        );
        showNotification('success', `Ordre « ${editForm.title} » mis à jour.`);
        setIsEditModalOpen(false);
      } else {
        if (!token) return;
        const updated = await AssetClient.updateWorkOrder(editingWo.id, editForm, token);
        setWorkOrders((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        showNotification('success', `Ordre « ${updated.title} » mis à jour.`);
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
        setWorkOrders((prev) => prev.filter((w) => w.id !== deleteConfirm.id));
        showNotification('success', `Ordre « ${deleteConfirm.label} » supprimé.`);
        setDeleteConfirm(null);
      } else {
        if (!token) return;
        await AssetClient.deleteWorkOrder(deleteConfirm.id, token);
        setWorkOrders((prev) => prev.filter((w) => w.id !== deleteConfirm.id));
        showNotification('success', `Ordre « ${deleteConfirm.label} » supprimé.`);
        setDeleteConfirm(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la suppression.';
      showNotification('error', msg);
    }
  };

  const handleCompleteWo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWoForComplete) return;
    setIsCompleting(true);

    try {
      const isDvirOrder =
        activeWoForComplete.id.startsWith('ot-dvir') ||
        activeWoForComplete.title.includes('DVIR');

      if (isDemoMode) {
        const hourlyRate = tariffs.economicRates?.hourlyLaborRateDzd || 1500;
        const laborCost = completeForm.actualLaborHours * hourlyRate;
        const partsCost = completeForm.partsCost;
        const totalCost = laborCost + partsCost;

        setWorkOrders((prev) =>
          prev.map((w) =>
            w.id === activeWoForComplete.id
              ? {
                  ...w,
                  status: WorkOrderStatus.COMPLETED,
                  actualLaborHours: completeForm.actualLaborHours,
                  partsCost: completeForm.partsCost,
                  laborCost,
                  totalCost,
                  downtimeHours: completeForm.downtimeHours,
                  completedAt: new Date().toISOString(),
                }
              : w
          )
        );

        const successMsg = isDvirOrder
          ? `Ordre de travail clôturé (${totalCost.toLocaleString('fr-DZ')} DA). Verrou de sécurité DVIR levé avec succès : le véhicule ${activeWoForComplete.assetName || activeWoForComplete.assetCode} est requalifié pour le dispatching TOPSIS.`
          : `Ordre de travail clôturé. Coût total : ${totalCost.toLocaleString('fr-DZ')} DA (MO: ${laborCost.toLocaleString('fr-DZ')} DA, Pièces: ${partsCost.toLocaleString('fr-DZ')} DA) • Immobilisation: ${completeForm.downtimeHours || 0}h.`;

        showNotification('success', successMsg);
        setActiveWoForComplete(null);
      } else {
        if (!token) return;
        const updated = await AssetClient.completeWorkOrder(
          activeWoForComplete.id,
          completeForm,
          token
        );

        if (isDvirOrder) {
          try {
            await FleetIntelligenceClient.resolveDvirBlock(
              activeWoForComplete.assetId,
              activeWoForComplete.id,
              token,
              completeForm.completionNotes
            );
          } catch {
            // Ignorer si déjà géré côté API
          }
        }

        const successMsg = isDvirOrder
          ? `Ordre de travail clôturé (${updated.totalCost?.toLocaleString('fr-DZ')} DA). Verrou de sécurité DVIR levé avec succès : le véhicule ${activeWoForComplete.assetName || activeWoForComplete.assetCode} est requalifié pour le dispatching TOPSIS.`
          : `Ordre de travail clôturé. Coût total : ${updated.totalCost?.toLocaleString('fr-DZ')} DA (MO: ${updated.laborCost} DA, Pièces: ${updated.partsCost} DA) • Immobilisation: ${updated.downtimeHours}h.`;

        showNotification('success', successMsg);
        setActiveWoForComplete(null);
        loadData(token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la clôture.';
      showNotification('error', msg);
    } finally {
      setIsCompleting(false);
    }
  };

  const getPriorityBadge = (p: WorkOrderPriority) => {
    switch (p) {
      case WorkOrderPriority.CRITICAL:
        return <Badge variant="danger" pulse>Critique</Badge>;
      case WorkOrderPriority.HIGH:
        return <Badge variant="warning">Haute</Badge>;
      case WorkOrderPriority.MEDIUM:
        return <Badge variant="info">Moyenne</Badge>;
      case WorkOrderPriority.LOW:
        return <Badge variant="ok">Basse</Badge>;
    }
  };

  const getStatusBadge = (s: WorkOrderStatus) => {
    switch (s) {
      case WorkOrderStatus.COMPLETED:
        return <Badge variant="ok">Clôturé</Badge>;
      case WorkOrderStatus.IN_PROGRESS:
        return <Badge variant="info">En cours</Badge>;
      case WorkOrderStatus.SCHEDULED:
        return <Badge variant="warning">Planifié</Badge>;
      case WorkOrderStatus.DRAFT:
        return <Badge variant="neutral">Brouillon</Badge>;
      case WorkOrderStatus.CANCELLED:
        return <Badge variant="neutral">Annulé</Badge>;
    }
  };

  const filteredOrders = workOrders.filter((wo) => {
    const matchesStatus = selectedStatus === 'ALL' || wo.status === selectedStatus;
    const matchesPriority = selectedPriority === 'ALL' || wo.priority === selectedPriority;
    const isDvirOrder = wo.id.startsWith('ot-dvir') || wo.title.includes('DVIR');
    const matchesSource =
      selectedSource === 'ALL' ||
      (selectedSource === 'DVIR' && isDvirOrder) ||
      (selectedSource === 'PREDICTIVE' && Boolean(wo.resetAlgorithmKey) && !isDvirOrder);
    const matchesSearch =
      searchQuery.trim() === '' ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.assetCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wo.assignedTo && wo.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesPriority && matchesSource && matchesSearch;
  });

  const scheduledCount = workOrders.filter((w) => w.status === WorkOrderStatus.SCHEDULED).length;
  const inProgressCount = workOrders.filter((w) => w.status === WorkOrderStatus.IN_PROGRESS).length;
  const completedCount = workOrders.filter((w) => w.status === WorkOrderStatus.COMPLETED).length;
  const totalSpentDzd = workOrders.reduce((acc, w) => acc + (w.totalCost || 0), 0);

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
                  Atelier Connecté &amp; Maintenance Curative
                </Badge>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  GMAO Temps Réel • Suivi MO &amp; Pièces OEM • Factures DGI A4
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                Ordres de Travail &amp; Interventions d’Atelier
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Orchestration complète des opérations de maintenance, calcul automatique du coût horaire barème DGI, enregistrement des temps d’arrêt et levée certifiée des verrous de sécurité DVIR.
              </p>

              <div className="flex gap-2 flex-wrap items-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5"
                >
                  <IconPlus size={14} />
                  <span>Créer un Ordre de Travail</span>
                </Button>
                <Link
                  href="/assets"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconTruck size={13} className="text-blue-500" />
                  <span>Parc d’Actifs</span>
                </Link>
                <Link
                  href="/preventive"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconWrench size={13} className="text-amber-500" />
                  <span>Plans Préventifs OEM</span>
                </Link>
                <Link
                  href="/dvir"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <IconShieldCheck size={13} className="text-rose-500" />
                  <span>Verrous DVIR</span>
                </Link>
              </div>
            </div>

            {/* WIDGET HUD STATUT ATELIER */}
            <div className="w-full lg:w-auto min-w-[260px] p-4 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/90 dark:border-[#1F2937] flex flex-col gap-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Capacité Atelier Actuelle</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Taux Horaire MO Barème</span>
                <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {(tariffs.economicRates?.hourlyLaborRateDzd || 1500).toLocaleString('fr-DZ')} DA/h
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">TVA Fiscale Atelier</span>
                <strong className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {tariffs.fiscal?.tvaStandardRate ? Math.round(tariffs.fiscal.tvaStandardRate * 100) : 19}% DGI
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Levée Verrous DVIR</span>
                <strong className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Automatisée TOPSIS
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO KPIS ATELIER */}
        <section className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Interventions
            </span>
            <div className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
              {workOrders.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Historique complet de l’organisation
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              En Atelier &amp; Planifiés
            </span>
            <div className="font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {inProgressCount + scheduledCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              {inProgressCount} en cours • {scheduledCount} planifiés
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Clôturés avec Succès
            </span>
            <div className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {completedCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Actifs remis en circulation certifiés
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Dépenses Consolidées
            </span>
            <div className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">
              {totalSpentDzd.toLocaleString('fr-DZ')} <span className="text-xs text-slate-500">DZD</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Main d’œuvre + consommables OEM
            </span>
          </div>
        </section>

        {/* 4. LAYOUT DUAL : BARRE DE FILTRES LATÉRALE + LISTE DES OT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* SIDEBAR CONTEXTUELLE DE NAVIGATION & FILTRES */}
          <aside className="lg:col-span-1 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-5 shadow-2xs sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Filtres &amp; Navigation
              </span>
              <IconFilter size={14} className="text-slate-400" />
            </div>

            {/* STATUT */}
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Statut d’Intervention
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'ALL', label: 'Toutes', count: workOrders.length },
                  { id: WorkOrderStatus.SCHEDULED, label: 'Planifiées', count: scheduledCount },
                  { id: WorkOrderStatus.IN_PROGRESS, label: 'En atelier', count: inProgressCount },
                  { id: WorkOrderStatus.COMPLETED, label: 'Clôturées', count: completedCount },
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

            {/* CRITICITÉ */}
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Niveau d’Urgence
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'ALL', label: 'Toutes Priorités' },
                  { id: WorkOrderPriority.CRITICAL, label: 'Critique' },
                  { id: WorkOrderPriority.HIGH, label: 'Haute' },
                  { id: WorkOrderPriority.MEDIUM, label: 'Moyenne' },
                  { id: WorkOrderPriority.LOW, label: 'Basse' },
                ].map((p) => {
                  const count = p.id === 'ALL' ? workOrders.length : workOrders.filter((w) => w.priority === p.id).length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPriority(p.id)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedPriority === p.id
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-200/80 dark:bg-slate-800 mb-5" />

            {/* ORIGINE */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Origine Déclencheur
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'ALL', label: 'Toutes Origines' },
                  { id: 'DVIR', label: 'DVIR Sécurité' },
                  { id: 'PREDICTIVE', label: 'Jumeau Numérique' },
                ].map((s) => {
                  const count =
                    s.id === 'ALL'
                      ? workOrders.length
                      : s.id === 'DVIR'
                      ? workOrders.filter((w) => w.id.startsWith('ot-dvir') || w.title.includes('DVIR')).length
                      : workOrders.filter((w) => Boolean(w.resetAlgorithmKey) && !w.id.startsWith('ot-dvir') && !w.title.includes('DVIR')).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSource(s.id as 'ALL' | 'DVIR' | 'PREDICTIVE')}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedSource === s.id
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* LISTE PRINCIPALE DES ORDRES DE TRAVAIL */}
          <section className="lg:col-span-3">
            {/* BARRE D'OUTILS ET RECHERCHE */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <IconSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, immatriculation, code actif, mécanicien..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1 self-center whitespace-nowrap">
                <strong className="font-mono text-slate-900 dark:text-slate-100">{filteredOrders.length}</strong> intervention{filteredOrders.length > 1 ? 's' : ''} filtrée{filteredOrders.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* LISTE D'INTERVENTIONS */}
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-12 text-center text-slate-500 text-xs">
                Chargement des ordres de travail en cours...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-[#111827] p-12 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <IconWrench size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Aucun ordre de travail ne correspond à vos filtres
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                  Modifiez vos critères de sélection ou créez un nouvel ordre de travail pour cet atelier.
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  + Créer un Ordre de Travail
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((wo) => {
                  const isClosed = wo.status === WorkOrderStatus.COMPLETED;

                  return (
                    <div
                      key={wo.id}
                      className={`rounded-2xl border bg-white/95 dark:bg-[#111827] p-5 shadow-2xs transition-all hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                        wo.priority === WorkOrderPriority.CRITICAL
                          ? 'border-rose-500/40 border-l-4 border-l-rose-500'
                          : wo.priority === WorkOrderPriority.HIGH
                          ? 'border-amber-500/40 border-l-4 border-l-amber-500'
                          : 'border-slate-200/90 dark:border-slate-800/80 border-l-4 border-l-blue-500'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        {/* BADGES METADATA */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            {wo.assetCode}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {wo.assetName}
                          </span>
                          {getPriorityBadge(wo.priority)}
                          {getStatusBadge(wo.status)}

                          {(wo.id.startsWith('ot-dvir') || wo.title.includes('DVIR')) && (
                            <Link
                              href="/dvir"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[11px] font-bold"
                              title="Déclenché par une anomalie critique DVIR. Cliquer pour voir la fiche d'inspection."
                            >
                              <IconShieldCheck size={12} />
                              <span>Origine DVIR Sécurité</span>
                            </Link>
                          )}

                          {wo.resetAlgorithmKey && !wo.id.startsWith('ot-dvir') && !wo.title.includes('DVIR') && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[11px] font-bold">
                              <IconCpu size={12} />
                              <span>Jumeau Numérique ({wo.resetAlgorithmKey})</span>
                            </span>
                          )}
                        </div>

                        {/* TITRE ET DESCRIPTION */}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                          {wo.title}
                        </h3>

                        {wo.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                            {wo.description}
                          </p>
                        )}

                        {/* FOOTER METADATA */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          {wo.triggerMeterValue && (
                            <span>
                              Compteur : <strong className="font-mono text-slate-700 dark:text-slate-300">{wo.triggerMeterValue.toLocaleString('fr-DZ')} km</strong>
                            </span>
                          )}
                          <span>
                            Date : {new Date(wo.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                          {wo.assignedTo && (
                            <span>
                              Affecté : <strong className="text-slate-700 dark:text-slate-300">{wo.assignedTo}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* BLOC ACTIONS ET FINANCES */}
                      <div className="flex flex-col items-start md:items-end gap-2.5 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                        {isClosed ? (
                          <div className="text-left md:text-right">
                            <div className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                              {wo.totalCost?.toLocaleString('fr-DZ')} DA
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              MO ({wo.actualLaborHours}h) : {wo.laborCost?.toLocaleString('fr-DZ')} DA
                            </div>
                            {wo.partsCost && wo.partsCost > 0 ? (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                Pièces : {wo.partsCost?.toLocaleString('fr-DZ')} DA
                              </div>
                            ) : null}
                            {wo.downtimeHours && wo.downtimeHours > 0 ? (
                              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                                Arrêt : <strong>{wo.downtimeHours} h</strong>
                              </div>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenDgiInvoice(wo)}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold transition-colors"
                            >
                              <IconFileText size={13} />
                              <span>Facture Fiscale DGI (A4)</span>
                            </button>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setActiveWoForComplete(wo);
                              setCompleteForm({
                                actualLaborHours: wo.estimatedLaborHours || 2,
                                partsCost: 0,
                                downtimeHours: 2,
                                completionNotes: '',
                              });
                            }}
                            className="w-full md:w-auto justify-center"
                          >
                            Clôturer Intervention
                          </Button>
                        )}

                        <div className="flex items-center gap-1.5 self-end">
                          <button
                            onClick={() => handleOpenEdit(wo)}
                            title="Modifier l'ordre de travail"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: wo.id, label: `${wo.title} (${wo.assetCode})` })}
                            title="Supprimer l'ordre de travail"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODALE 1 : CRÉATION D'ORDRE DE TRAVAIL */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Créer un Ordre de Travail (OT)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Affectation atelier et estimation de la main d’œuvre
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Véhicule Concerné *
                </label>
                <select
                  required
                  value={newWo.assetId}
                  onChange={(e) => setNewWo({ ...newWo, assetId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} ({a.currentMeterValue} {a.primaryMeterType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Titre de l’Intervention *
                </label>
                <input
                  type="text"
                  required
                  value={newWo.title}
                  onChange={(e) => setNewWo({ ...newWo, title: e.target.value })}
                  placeholder="Ex: Remplacement plaquettes de freins &amp; vidange moteur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Description Détaillée / Diagnostic
                </label>
                <textarea
                  rows={3}
                  value={newWo.description}
                  onChange={(e) => setNewWo({ ...newWo, description: e.target.value })}
                  placeholder="Points de contrôle spécifiques, pièces détachées requises..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Priorité
                  </label>
                  <select
                    value={newWo.priority}
                    onChange={(e) => setNewWo({ ...newWo, priority: e.target.value as WorkOrderPriority })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={WorkOrderPriority.LOW}>Basse</option>
                    <option value={WorkOrderPriority.MEDIUM}>Moyenne</option>
                    <option value={WorkOrderPriority.HIGH}>Haute</option>
                    <option value={WorkOrderPriority.CRITICAL}>Critique (Immobilisant)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Temps MO Estimé (heures)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={newWo.estimatedLaborHours}
                    onChange={(e) => setNewWo({ ...newWo, estimatedLaborHours: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Mécanicien / Chef d’Atelier Affecté
                </label>
                <input
                  type="text"
                  value={newWo.assignedTo}
                  onChange={(e) => setNewWo({ ...newWo, assignedTo: e.target.value })}
                  placeholder="Ex: Mourad Dépôt Rouiba"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Création en cours...' : 'Générer l’Ordre de Travail'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 2 : MODIFICATION D'ORDRE DE TRAVAIL */}
      {isEditModalOpen && editingWo && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Modifier l’Ordre de Travail
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Réf : {editingWo.id} • {editingWo.assetCode}
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
                  Titre de l’Intervention *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Description Détaillée
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Priorité
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as WorkOrderPriority })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={WorkOrderPriority.LOW}>Basse</option>
                    <option value={WorkOrderPriority.MEDIUM}>Moyenne</option>
                    <option value={WorkOrderPriority.HIGH}>Haute</option>
                    <option value={WorkOrderPriority.CRITICAL}>Critique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Temps MO Estimé (heures)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={editForm.estimatedLaborHours}
                    onChange={(e) => setEditForm({ ...editForm, estimatedLaborHours: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Affecté à
                </label>
                <input
                  type="text"
                  value={editForm.assignedTo}
                  onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer Modifications'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE 3 : CLÔTURE D'INTERVENTION */}
      {activeWoForComplete && (
        <div
          role="dialog"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl my-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Clôturer l’Intervention
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeWoForComplete.title} • Actif : <strong className="text-slate-700 dark:text-slate-300">{activeWoForComplete.assetCode}</strong>
              </p>
            </div>

            <form onSubmit={handleCompleteWo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Heures Réelles MO *
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    required
                    value={completeForm.actualLaborHours}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualLaborHours: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Coût Pièces (DA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={completeForm.partsCost}
                    onChange={(e) => setCompleteForm({ ...completeForm, partsCost: Number(e.target.value) })}
                    className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Temps d’Arrêt / Downtime Véhicule (heures)
                </label>
                <input
                  type="number"
                  min={0}
                  value={completeForm.downtimeHours}
                  onChange={(e) => setCompleteForm({ ...completeForm, downtimeHours: Number(e.target.value) })}
                  className="w-full font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Notes de Sortie Atelier
                </label>
                <textarea
                  rows={2}
                  value={completeForm.completionNotes}
                  onChange={(e) => setCompleteForm({ ...completeForm, completionNotes: e.target.value })}
                  placeholder="Véhicule testé sur route, niveaux vérifiés, bon pour service."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setActiveWoForComplete(null)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isCompleting}>
                  {isCompleting ? 'Clôture en cours...' : 'Valider & Réarmer l’Actif'}
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
                Supprimer cet Ordre de Travail ?
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Confirmez-vous la suppression définitive de <strong className="text-slate-900 dark:text-slate-100">« {deleteConfirm.label} »</strong> ? Cette action est irréversible.
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

      {/* MODALE FACTURE FISCALE DGI OFFICIELLE (A4) */}
      {invoiceModalData && (
        <OfficialDgiInvoiceModal
          data={invoiceModalData}
          onClose={() => setInvoiceModalData(null)}
        />
      )}
    </div>
  );
}
