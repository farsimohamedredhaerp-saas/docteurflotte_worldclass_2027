'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSubscriptionsFilters } from './hooks/useSubscriptionsFilters';
import { useSubscriptionsData } from './hooks/useSubscriptionsData';
import { SubscriptionsHeader } from './components/SubscriptionsHeader';
import { SubscriptionsKpiCards } from './components/SubscriptionsKpiCards';
import { SubscriptionsTabNavigation } from './components/SubscriptionsTabNavigation';
import { PlansCatalogView } from './components/PlansCatalogView';
import { TenantsSubscriptionsTable } from './components/TenantsSubscriptionsTable';
import { InvoicesLedgerTable } from './components/InvoicesLedgerTable';
import { PlanFormModal } from './components/modals/PlanFormModal';
import { NegotiationModal } from './components/modals/NegotiationModal';
import { InvoiceGenerationModal } from './components/modals/InvoiceGenerationModal';
import SubscriptionsLoading from './loading';

const LegacyAdminSubscriptionsPage = dynamic(
  () => import('@/app/_legacy/admin/subscriptions/page.legacy'),
  { ssr: false, loading: () => <SubscriptionsLoading /> }
);

function AdminSubscriptionsCockpit() {
  const { activeTab, setActiveTab } = useSubscriptionsFilters();
  const data = useSubscriptionsData(() => setActiveTab('invoices'));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      <SubscriptionsHeader
        loading={data.loading}
        errorMsg={data.errorMsg}
        successMsg={data.successMsg}
        onRefresh={data.loadData}
        onOpenCreatePlan={data.handleOpenCreatePlan}
      />

      <SubscriptionsKpiCards
        totalMrrDzd={data.totalMrrDzd}
        totalActiveVehicles={data.totalActiveVehicles}
        totalContractVehicles={data.totalContractVehicles}
        plansCount={data.plans.length}
      />

      <SubscriptionsTabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        plansCount={data.plans.length}
        tenantsCount={data.tenantSubs.length}
        invoicesCount={data.invoices.length}
      />

      {activeTab === 'plans' && (
        <PlansCatalogView plans={data.plans} onEditPlan={data.handleOpenEditPlan} />
      )}

      {activeTab === 'tenants' && (
        <TenantsSubscriptionsTable
          tenantSubs={data.tenantSubs}
          onNegotiate={data.handleOpenNegotiate}
          onInvoice={data.handleOpenInvoice}
        />
      )}

      {activeTab === 'invoices' && <InvoicesLedgerTable invoices={data.invoices} />}

      <PlanFormModal
        isOpen={data.isPlanModalOpen}
        onClose={() => data.setIsPlanModalOpen(false)}
        editingPlan={data.editingPlan}
        planForm={data.planForm}
        setPlanForm={data.setPlanForm}
        onSave={data.handleSavePlan}
      />

      <NegotiationModal
        isOpen={data.isNegotiationModalOpen}
        onClose={() => data.setIsNegotiationModalOpen(false)}
        editingTenantSub={data.editingTenantSub}
        plans={data.plans}
        negotiationForm={data.negotiationForm}
        setNegotiationForm={data.setNegotiationForm}
        onSave={data.handleSaveNegotiation}
      />

      <InvoiceGenerationModal
        isOpen={data.isInvoiceModalOpen}
        onClose={() => data.setIsInvoiceModalOpen(false)}
        targetInvoiceTenant={data.targetInvoiceTenant}
        invoiceForm={data.invoiceForm}
        setInvoiceForm={data.setInvoiceForm}
        onGenerate={data.handleGenerateInvoice}
      />
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const isRefactorEnabled = process.env.NEXT_PUBLIC_FF_REFACTOR_ADMIN_SUBSCRIPTIONS !== 'false';

  if (!isRefactorEnabled) {
    return <LegacyAdminSubscriptionsPage />;
  }

  return (
    <Suspense fallback={<SubscriptionsLoading />}>
      <AdminSubscriptionsCockpit />
    </Suspense>
  );
}
