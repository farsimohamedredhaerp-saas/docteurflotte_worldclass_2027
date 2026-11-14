'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import DriversLoading from './loading';

import { DriverRecord } from './types';
import { useDriversData } from './hooks/useDriversData';
import { useDriverFilters } from './hooks/useDriverFilters';
import { DriversHeader } from './components/DriversHeader';
import { DriversKpis } from './components/DriversKpis';
import { DriversSidebarFilters } from './components/DriversSidebarFilters';
import { DriversTable } from './components/DriversTable';
import { DriverModal } from './components/DriverModal';

// Fallback sécurisé vers l'écran legacy piloté par Feature Flag
const LegacyDriversPage = dynamic(
  () => import('@/app/_legacy/drivers/page.legacy').then((m) => m.default),
  { ssr: false }
);

function DriversContainer() {
  const {
    drivers,
    isLoading,
    notification,
    addDriver,
    updateDriver,
    deleteDriver,
  } = useDriversData();

  const {
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredDrivers,
    kpis,
  } = useDriverFilters(drivers);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: DriverRecord) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  const handleSubmitModal = (data: Parameters<typeof addDriver>[0]) => {
    if (editingDriver) {
      updateDriver(editingDriver.id, data);
    } else {
      addDriver(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteDriver(deleteTarget.id, deleteTarget.name);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors">
      <Navbar />

      <NotificationBanner
        notification={notification.notification}
        onClose={notification.clearNotification}
      />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        <DriversHeader
          onOpenAdd={handleOpenAdd}
          totalDrivers={kpis.totalCount}
          onDutyCount={kpis.onDutyCount}
        />

        <DriversKpis kpis={kpis} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <DriversSidebarFilters
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            kpis={kpis}
          />

          <DriversTable
            drivers={filteredDrivers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
            onOpenEdit={handleOpenEdit}
            onOpenDelete={(id, name) => setDeleteTarget({ id, name })}
            onOpenAdd={handleOpenAdd}
          />
        </div>
      </main>

      <DriverModal
        isOpen={isModalOpen}
        driver={editingDriver}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer ce Conducteur ?"
        description={`Confirmez-vous le retrait de « ${deleteTarget?.name || ''} » de l’effectif de la flotte ?`}
        confirmLabel="Supprimer Définitivement"
        variant="danger"
      />
    </div>
  );
}

export default function DriversPage() {
  const useLegacy = process.env.NEXT_PUBLIC_FF_REFACTOR_DRIVERS === 'false';

  if (useLegacy) {
    return <LegacyDriversPage />;
  }

  return (
    <Suspense fallback={<DriversLoading />}>
      <DriversContainer />
    </Suspense>
  );
}
