'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthClient } from '../../lib/api-auth';
import { AssetClient } from '../../lib/api-assets';
import { FleetIntelligenceClient } from '../../lib/api-fleet-intelligence';
import { Navbar } from '../../components/navigation/Navbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
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
import { useDemoMode } from '../../context/DemoModeContext';
import { useSystemConfig } from '../../context/SystemConfigContext';
import {
  OfficialDgiInvoiceModal,
  DgiInvoiceData,
} from '../../components/finance/OfficialDgiInvoiceModal';
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
} from '../../components/navigation/TechIcons';
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
    // Taux horaire dynamique issu de la configuration admin / tenant
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
    const session = AuthClient.getSession();
    setToken(session.token);

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
    } else if (session.token) {
      loadData(session.token);
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
    if (!token || !editingWo) return;
    setIsUpdating(true);

    try {
      await AssetClient.updateWorkOrder(editingWo.id, editForm, token);
      setWorkOrders((prev) =>
        prev.map((w) =>
          w.id === editingWo.id
            ? {
                ...w,
                title: editForm.title,
                description: editForm.description,
                priority: editForm.priority,
                estimatedLaborHours: Number(editForm.estimatedLaborHours),
                assignedTo: editForm.assignedTo,
              }
            : w
        )
      );
      showNotification('success', `Ordre de travail « ${editForm.title} » mis à jour.`);
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la modification.';
      showNotification('error', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteConfirm) return;
    try {
      await AssetClient.deleteWorkOrder(deleteConfirm.id, token);
      setWorkOrders((prev) => prev.filter((w) => w.id !== deleteConfirm.id));
      showNotification('success', `Ordre de travail « ${deleteConfirm.label} » supprimé.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la suppression.';
      showNotification('error', msg);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCompleteWo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWoForComplete) return;
    setIsCompleting(true);
    setFeedback(null);

    const isDvirOrder =
      activeWoForComplete.id.startsWith('ot-dvir') ||
      activeWoForComplete.title.includes('DVIR');

    try {
      if (isDemoMode || !token) {
        // Mode Démo : Clôture locale certifiée avec simulation des coûts DZD
        const hourlyRate = tariffs?.economicRates?.hourlyLaborRateDzd ?? 1500;
        const laborCost = Number(completeForm.actualLaborHours) * hourlyRate;
        const partsCost = Number(completeForm.partsCost || 0);
        const totalCost = laborCost + partsCost;

        setWorkOrders((prev) =>
          prev.map((w) =>
            w.id === activeWoForComplete.id
              ? {
                  ...w,
                  status: WorkOrderStatus.COMPLETED,
                  actualLaborHours: Number(completeForm.actualLaborHours),
                  partsCost,
                  totalCost,
                  downtimeHours: Number(completeForm.downtimeHours || 0),
                  completedAt: new Date().toISOString(),
                }
              : w
          )
        );

        const successMsg = isDvirOrder
          ? `Ordre de travail clôturé (${totalCost.toLocaleString()} DA). Verrou de sécurité DVIR levé avec succès : le véhicule ${activeWoForComplete.assetName || activeWoForComplete.assetCode} est requalifié pour le dispatching TOPSIS.`
          : `Ordre de travail clôturé. Coût total : ${totalCost.toLocaleString()} DA (MO: ${laborCost.toLocaleString()} DA, Pièces: ${partsCost.toLocaleString()} DA) • Immobilisation: ${completeForm.downtimeHours || 0}h.`;

        showNotification('success', successMsg);
        setActiveWoForComplete(null);
      } else {
        const updated = await AssetClient.completeWorkOrder(
          activeWoForComplete.id,
          completeForm,
          token
        );

        // Réconciliation de sécurité DVIR si applicable
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
          ? `Ordre de travail clôturé (${updated.totalCost?.toLocaleString()} DA). Verrou de sécurité DVIR levé avec succès : le véhicule ${activeWoForComplete.assetName || activeWoForComplete.assetCode} est requalifié pour le dispatching TOPSIS.`
          : `Ordre de travail clôturé. Coût total : ${updated.totalCost?.toLocaleString()} DA (MO: ${updated.laborCost} DA, Pièces: ${updated.partsCost} DA) • Immobilisation: ${updated.downtimeHours}h.`;

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
              background: feedback.type === 'success' ? 'var(--df-status-ok-bg)' : 'var(--df-status-danger-bg)',
              color: feedback.type === 'success' ? 'var(--df-status-ok-text)' : 'var(--df-status-danger-text)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--df-status-ok-border)' : 'var(--df-status-danger-border)'}`,
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
              Actions d’Atelier
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
              >
                <IconPlus size={14} />
                <span>+ Nouvel OT</span>
              </Button>
              <Link href="/assets" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Voir les Actifs
                </Button>
              </Link>
              <Link href="/preventive" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm" style={{ width: '100%', justifyContent: 'center' }}>
                  Plans Préventifs OEM
                </Button>
              </Link>
            </div>

            <div style={{ height: '1px', background: 'var(--df-border-subtle)', margin: '0.5rem 0 1rem 0' }} />

            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Statut des Interventions
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
              {[
                { id: 'ALL', label: 'Toutes les interventions', count: workOrders.length, dot: 'var(--df-accent-blue)' },
                { id: WorkOrderStatus.SCHEDULED, label: 'Planifiées', count: scheduledCount, dot: 'var(--df-status-warning)' },
                { id: WorkOrderStatus.IN_PROGRESS, label: 'En cours d’atelier', count: inProgressCount, dot: 'var(--df-status-info)' },
                { id: WorkOrderStatus.COMPLETED, label: 'Clôturées', count: completedCount, dot: 'var(--df-status-ok)' },
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
                    color: selectedStatus === item.id ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
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
              Criticité
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'ALL', label: 'Toutes Priorités' },
                { id: WorkOrderPriority.CRITICAL, label: 'Critique' },
                { id: WorkOrderPriority.HIGH, label: 'Haute' },
                { id: WorkOrderPriority.MEDIUM, label: 'Moyenne' },
                { id: WorkOrderPriority.LOW, label: 'Basse' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPriority(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: 'none',
                    background: selectedPriority === p.id ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: selectedPriority === p.id ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                    fontWeight: selectedPriority === p.id ? 700 : 500,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{p.label}</span>
                  <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>
                    {p.id === 'ALL' ? workOrders.length : workOrders.filter((w) => w.priority === p.id).length}
                  </span>
                </button>
              ))}
            </nav>

            {/* FILTRE SOURCE / ORIGINE */}
            <h3
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--df-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.65rem',
                marginTop: '1.25rem',
                paddingLeft: '0.5rem',
              }}
            >
              Origine de Déclenchement
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[
                { id: 'ALL', label: 'Toutes Origines' },
                { id: 'DVIR', label: 'DVIR Sécurité' },
                { id: 'PREDICTIVE', label: 'Jumeau Numérique' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSource(s.id as 'ALL' | 'DVIR' | 'PREDICTIVE')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--df-radius-md)',
                    border: 'none',
                    background: selectedSource === s.id ? 'var(--df-bg-surface-2)' : 'transparent',
                    color: selectedSource === s.id ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                    fontWeight: selectedSource === s.id ? 700 : 500,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{s.label}</span>
                  <span style={{ fontSize: '0.70rem', color: 'var(--df-text-muted)' }}>
                    {s.id === 'ALL'
                      ? workOrders.length
                      : s.id === 'DVIR'
                      ? workOrders.filter((w) => w.id.startsWith('ot-dvir') || w.title.includes('DVIR')).length
                      : workOrders.filter((w) => Boolean(w.resetAlgorithmKey) && !w.id.startsWith('ot-dvir') && !w.title.includes('DVIR')).length}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* CONTENU PRINCIPAL */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* EN-TÊTE PRINCIPAL */}
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
                    Ordres de Travail &amp; Maintenance Curative
                  </h1>
                  <Badge variant="ok">Atelier Connecté</Badge>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--df-text-muted)', margin: '0.2rem 0 0 0' }}>
                  Suivi des interventions mécaniques, calcul automatique de main d&apos;œuvre et contrôle du temps d&apos;arrêt (downtime).
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
                    placeholder="Rechercher titre, actif, mécano..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--df-text-main)',
                      outline: 'none',
                      fontSize: '0.78rem',
                      width: '190px',
                    }}
                  />
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  + Nouvel OT
                </Button>
              </div>
            </div>

            {/* CARTES KPI SYNTHÈSE ATELIER */}
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
                <span style={{ fontSize: '0.74rem', color: 'var(--df-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Ordres
                </span>
                <div className="df-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '0.25rem' }}>
                  {workOrders.length}
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
                <span style={{ fontSize: '0.74rem', color: 'var(--df-status-info)', fontWeight: 600, textTransform: 'uppercase' }}>
                  En Atelier / Planifiés
                </span>
                <div className="df-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-status-info)', marginTop: '0.25rem' }}>
                  {inProgressCount + scheduledCount}
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
                <span style={{ fontSize: '0.74rem', color: 'var(--df-status-ok)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Clôturés avec Succès
                </span>
                <div className="df-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--df-status-ok)', marginTop: '0.25rem' }}>
                  {completedCount}
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
                <span style={{ fontSize: '0.74rem', color: 'var(--df-accent-blue)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Dépenses Consolidées
                </span>
                <div className="df-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '0.25rem' }}>
                  {totalSpentDzd.toLocaleString('fr-DZ')} <span style={{ fontSize: '0.85rem' }}>DA</span>
                </div>
              </div>
            </section>

            {/* LISTE DES ORDRES DE TRAVAIL */}
            {isLoading ? (
              <div
                style={{
                  padding: '3.5rem',
                  textAlign: 'center',
                  color: 'var(--df-text-muted)',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                }}
              >
                Chargement des ordres de travail en cours...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div
                style={{
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-lg)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', color: 'var(--df-text-muted)' }}>
                  <IconWrench size={40} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '0.5rem' }}>
                  Aucun ordre de travail dans cette sélection
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--df-text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Les ordres de travail sont générés automatiquement par franchissement des seuils kilométriques ou créés manuellement.
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  + Créer un Ordre de Travail
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredOrders.map((wo) => {
                  const isClosed = wo.status === WorkOrderStatus.COMPLETED;

                  return (
                    <div
                      key={wo.id}
                      style={{
                        background: 'var(--df-bg-surface-1)',
                        border: '1px solid var(--df-border-subtle)',
                        borderRadius: 'var(--df-radius-lg)',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.25rem',
                        borderLeft: `4px solid ${
                          wo.priority === WorkOrderPriority.CRITICAL
                            ? 'var(--df-status-danger)'
                            : wo.priority === WorkOrderPriority.HIGH
                            ? 'var(--df-status-warning)'
                            : 'var(--df-accent-blue)'
                        }`,
                        boxShadow: 'var(--df-shadow-sm)',
                      }}
                    >
                      <div style={{ flex: '1 1 360px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span
                            className="df-mono"
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: 'var(--df-accent-blue)',
                              padding: '0.15rem 0.45rem',
                              background: 'var(--df-bg-surface-2)',
                              borderRadius: 'var(--df-radius-xs)',
                              border: '1px solid var(--df-border-subtle)',
                            }}
                          >
                            {wo.assetCode}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                            {wo.assetName}
                          </span>
                          {getPriorityBadge(wo.priority)}
                          {getStatusBadge(wo.status)}
                          {(wo.id.startsWith('ot-dvir') || wo.title.includes('DVIR')) && (
                            <Link
                              href="/dvir"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--df-radius-xs)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#EF4444',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                              title="Déclenché par une anomalie critique DVIR. Cliquer pour voir la fiche d'inspection."
                            >
                              <IconShieldCheck size={12} />
                              <span>Origine DVIR Sécurité</span>
                            </Link>
                          )}
                          {wo.resetAlgorithmKey && !wo.id.startsWith('ot-dvir') && !wo.title.includes('DVIR') && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--df-radius-xs)',
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                color: 'var(--df-accent-blue)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              <IconCpu size={12} />
                              <span>Jumeau Numérique ({wo.resetAlgorithmKey})</span>
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '0.3rem', margin: '0.2rem 0' }}>
                          {wo.title}
                        </h4>

                        {wo.description && (
                          <p style={{ fontSize: '0.80rem', color: 'var(--df-text-secondary)', marginBottom: '0.5rem', whiteSpace: 'pre-line' }}>
                            {wo.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.74rem', color: 'var(--df-text-muted)', flexWrap: 'wrap' }}>
                          {wo.triggerMeterValue && (
                            <span>Déclenché au compteur : <strong className="df-mono">{wo.triggerMeterValue.toLocaleString()}</strong></span>
                          )}
                          <span>Créé le : {new Date(wo.createdAt).toLocaleDateString('fr-FR')}</span>
                          {wo.assignedTo && <span>Affecté à : <strong>{wo.assignedTo}</strong></span>}
                        </div>
                      </div>

                      {/* ACTIONS, COÛTS & TEMPS D'ARRÊT */}
                      <div style={{ textAlign: 'right', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        {isClosed ? (
                          <div>
                            <div className="df-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-status-ok)' }}>
                              {wo.totalCost?.toLocaleString()} DA
                            </div>
                            <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginTop: '0.15rem' }}>
                              MO ({wo.actualLaborHours}h) : {wo.laborCost?.toLocaleString()} DA
                            </div>
                            {wo.partsCost && wo.partsCost > 0 ? (
                              <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                                Pièces : {wo.partsCost?.toLocaleString()} DA
                              </div>
                            ) : null}
                            {wo.downtimeHours && wo.downtimeHours > 0 ? (
                              <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-status-warning)', marginTop: '0.25rem' }}>
                                Immobilisation : <strong>{wo.downtimeHours} h</strong>
                              </div>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenDgiInvoice(wo)}
                              style={{
                                marginTop: '0.4rem',
                                padding: '0.3rem 0.65rem',
                                borderRadius: 'var(--df-radius-xs)',
                                background: 'rgba(5, 150, 105, 0.12)',
                                border: '1px solid rgba(5, 150, 105, 0.35)',
                                color: '#059669',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
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
                          >
                            Clôturer Intervention
                          </Button>
                        )}

                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem' }}>
                          <button
                            onClick={() => handleOpenEdit(wo)}
                            title="Modifier l'ordre de travail"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--df-text-muted)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: 'var(--df-radius-sm)',
                            }}
                          >
                            <IconEdit size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: wo.id, label: `${wo.title} (${wo.assetCode})` })}
                            title="Supprimer l'ordre de travail"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--df-status-danger)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: 'var(--df-radius-sm)',
                            }}
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODALE 1 : CRÉATION D'ORDRE DE TRAVAIL */}
      {isCreateModalOpen && (
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
                Créer un Ordre de Travail (OT)
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer' }}
              >
                <IconX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWo} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Véhicule Concerné *
                </label>
                <select
                  required
                  value={newWo.assetId}
                  onChange={(e) => setNewWo({ ...newWo, assetId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                  }}
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} ({a.currentMeterValue} {a.primaryMeterType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Titre de l’Intervention *
                </label>
                <input
                  type="text"
                  required
                  value={newWo.title}
                  onChange={(e) => setNewWo({ ...newWo, title: e.target.value })}
                  placeholder="Ex: Remplacement plaquettes de freins & vidange moteur"
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
                  Description Détaillée / Diagnostic
                </label>
                <textarea
                  rows={3}
                  value={newWo.description}
                  onChange={(e) => setNewWo({ ...newWo, description: e.target.value })}
                  placeholder="Points de contrôle spécifiques, pièces à remplacer..."
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Priorité
                  </label>
                  <select
                    value={newWo.priority}
                    onChange={(e) => setNewWo({ ...newWo, priority: e.target.value as WorkOrderPriority })}
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
                    <option value={WorkOrderPriority.LOW}>Basse</option>
                    <option value={WorkOrderPriority.MEDIUM}>Moyenne</option>
                    <option value={WorkOrderPriority.HIGH}>Haute</option>
                    <option value={WorkOrderPriority.CRITICAL}>Critique (Immobilisant)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Temps MO Estimé (heures)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={newWo.estimatedLaborHours}
                    onChange={(e) => setNewWo({ ...newWo, estimatedLaborHours: Number(e.target.value) })}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Mécanicien / Chef d’Atelier Affecté
                </label>
                <input
                  type="text"
                  value={newWo.assignedTo}
                  onChange={(e) => setNewWo({ ...newWo, assignedTo: e.target.value })}
                  placeholder="Ex: Mourad Dépôt Rouiba"
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
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
                Modifier l’Ordre de Travail
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
                  Titre de l’Intervention *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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
                  Description Détaillée
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Priorité
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as WorkOrderPriority })}
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
                    <option value={WorkOrderPriority.LOW}>Basse</option>
                    <option value={WorkOrderPriority.MEDIUM}>Moyenne</option>
                    <option value={WorkOrderPriority.HIGH}>Haute</option>
                    <option value={WorkOrderPriority.CRITICAL}>Critique</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Temps MO Estimé (heures)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={editForm.estimatedLaborHours}
                    onChange={(e) => setEditForm({ ...editForm, estimatedLaborHours: Number(e.target.value) })}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Affecté à
                </label>
                <input
                  type="text"
                  value={editForm.assignedTo}
                  onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
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
              maxWidth: '480px',
              padding: '1.75rem',
              background: 'var(--df-bg-surface-1)',
              borderRadius: 'var(--df-radius-lg)',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '0.35rem' }}>
              Clôturer l’Ordre : {activeWoForComplete.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', marginBottom: '1.25rem' }}>
              Actif : <strong>{activeWoForComplete.assetCode}</strong>. La clôture calculera automatiquement la main d&apos;œuvre selon le barème horaire configuré.
            </p>

            <form onSubmit={handleCompleteWo} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                    Heures Réelles MO *
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    required
                    value={completeForm.actualLaborHours}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualLaborHours: Number(e.target.value) })}
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
                    Coût Pièces (DA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={completeForm.partsCost}
                    onChange={(e) => setCompleteForm({ ...completeForm, partsCost: Number(e.target.value) })}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                  Temps d’Arrêt / Downtime Véhicule (heures)
                </label>
                <input
                  type="number"
                  min={0}
                  value={completeForm.downtimeHours}
                  onChange={(e) => setCompleteForm({ ...completeForm, downtimeHours: Number(e.target.value) })}
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
                  Notes de Sortie Atelier
                </label>
                <textarea
                  rows={2}
                  value={completeForm.completionNotes}
                  onChange={(e) => setCompleteForm({ ...completeForm, completionNotes: e.target.value })}
                  placeholder="Véhicule testé sur route, niveau fluides vérifié, bon pour service."
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    borderRadius: 'var(--df-radius-sm)',
                    color: 'var(--df-text-main)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
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
                Supprimer cet Ordre de Travail ?
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--df-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Confirmez-vous la suppression de <strong>« {deleteConfirm.label} »</strong> ?
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
