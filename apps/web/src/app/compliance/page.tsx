'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { IconCheck } from '@/components/navigation/TechIcons';
import { useComplianceData } from './hooks/useComplianceData';
import { useComplianceTabs } from './hooks/useComplianceTabs';
import { ComplianceHeader } from './components/ComplianceHeader';
import { ComplianceSidebar } from './components/ComplianceSidebar';
import { EnactaTable } from './components/EnactaTable';
import { InsuranceTable } from './components/InsuranceTable';
import { WilayaRestrictionsGrid } from './components/WilayaRestrictionsGrid';
import { FiscalRatesGrid } from './components/FiscalRatesGrid';
import { EnactaModal } from './components/modals/EnactaModal';
import { InsuranceModal } from './components/modals/InsuranceModal';
import { EnactaRecord, InsuranceRecord, WILAYA_RESTRICTIONS } from './types';

const CompliancePageLegacy = dynamic(() => import('../_legacy/compliance/page.legacy'), {
  ssr: false,
});

function ComplianceCockpitContent() {
  const {
    enactaList,
    insuranceList,
    notification,
    saveEnacta,
    deleteEnacta,
    saveInsurance,
    deleteInsurance,
  } = useComplianceData();

  const { activeTab, setActiveTab } = useComplianceTabs();

  // Modales d'édition / création
  const [isEnactaModalOpen, setIsEnactaModalOpen] = useState(false);
  const [editingEnacta, setEditingEnacta] = useState<EnactaRecord | null>(null);

  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceRecord | null>(null);

  const handleOpenAddEnacta = () => {
    setEditingEnacta(null);
    setIsEnactaModalOpen(true);
  };

  const handleOpenEditEnacta = (rec: EnactaRecord) => {
    setEditingEnacta(rec);
    setIsEnactaModalOpen(true);
  };

  const handleOpenAddInsurance = () => {
    setEditingInsurance(null);
    setIsInsuranceModalOpen(true);
  };

  const handleOpenEditInsurance = (ins: InsuranceRecord) => {
    setEditingInsurance(ins);
    setIsInsuranceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors duration-150">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* BANNIÈRE DE NOTIFICATION */}
        {notification && (
          <div
            role="status"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-medium shadow-sm transition-all"
          >
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <IconCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <ComplianceHeader
          activeTab={activeTab}
          onOpenAddEnacta={handleOpenAddEnacta}
          onOpenAddInsurance={handleOpenAddInsurance}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <ComplianceSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            enactaCount={enactaList.length}
            insuranceCount={insuranceList.length}
            wilayasCount={WILAYA_RESTRICTIONS.length}
            onOpenAddEnacta={handleOpenAddEnacta}
            onOpenAddInsurance={handleOpenAddInsurance}
          />

          <section className="lg:col-span-9 space-y-6">
            {activeTab === 'ENACTA' && (
              <EnactaTable
                records={enactaList}
                onOpenAddEnacta={handleOpenAddEnacta}
                onOpenEditEnacta={handleOpenEditEnacta}
                onDeleteEnacta={deleteEnacta}
              />
            )}

            {activeTab === 'INSURANCE' && (
              <InsuranceTable
                records={insuranceList}
                onOpenAddInsurance={handleOpenAddInsurance}
                onOpenEditInsurance={handleOpenEditInsurance}
                onDeleteInsurance={deleteInsurance}
              />
            )}

            {activeTab === 'WILAYAS' && <WilayaRestrictionsGrid />}

            {activeTab === 'TAXES' && <FiscalRatesGrid />}
          </section>
        </div>
      </main>

      <EnactaModal
        isOpen={isEnactaModalOpen}
        editingRecord={editingEnacta}
        onClose={() => setIsEnactaModalOpen(false)}
        onSave={saveEnacta}
      />

      <InsuranceModal
        isOpen={isInsuranceModalOpen}
        editingRecord={editingInsurance}
        onClose={() => setIsInsuranceModalOpen(false)}
        onSave={saveInsurance}
      />
    </div>
  );
}

export default function CompliancePage() {
  const isLegacy = process.env.NEXT_PUBLIC_FF_REFACTOR_COMPLIANCE === 'false';

  if (isLegacy) {
    return <CompliancePageLegacy />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#090D16]" />}>
      <ComplianceCockpitContent />
    </Suspense>
  );
}
