'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navigation/Navbar';
import { BreakthroughInnovationsPanel } from '@/components/preventive/BreakthroughInnovationsPanel';
import { PreventiveHeader } from './components/PreventiveHeader';
import { UpcomingPreventiveGrid } from './components/UpcomingPreventiveGrid';
import { OemTemplatesCatalog } from './components/OemTemplatesCatalog';
import { PreventiveModals } from './components/PreventiveModals';
import { usePreventiveData } from './hooks/usePreventiveData';
import { usePreventiveFilters } from './hooks/usePreventiveFilters';
import { DEFAULT_TEMPLATE_FORM, DEFAULT_DUE_FORM } from './constants';
import type {
  OemMaintenanceTemplate,
  UpcomingPreventiveDue,
  TemplateFormData,
  DueFormData,
  DeleteConfirmTarget,
} from './types';

const PreventivePageLegacy = dynamic(
  () => import('../_legacy/preventive/page.legacy'),
  { ssr: false }
);

function PreventiveContent() {
  const {
    templates,
    upcoming,
    isLoadingUpcoming,
    notification,
    createWorkOrder,
    saveTemplate,
    deleteTemplate,
    saveDue,
    deleteDue,
  } = usePreventiveData();

  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedUrgency,
    setSelectedUrgency,
    climateZone,
    setClimateZone,
    filteredUpcoming,
    filteredTemplates,
  } = usePreventiveFilters({ templates, upcoming });

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OemMaintenanceTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormData>(DEFAULT_TEMPLATE_FORM);

  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [editingDue, setEditingDue] = useState<UpcomingPreventiveDue | null>(null);
  const [dueForm, setDueForm] = useState<DueFormData>(DEFAULT_DUE_FORM);

  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmTarget | null>(null);

  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm(DEFAULT_TEMPLATE_FORM);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: OemMaintenanceTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      make: tpl.make,
      model: tpl.model,
      category: tpl.category,
      standardIntervalText: tpl.standardIntervalText,
      saharaIntervalText: tpl.saharaIntervalText,
      severityFactor: tpl.severityFactor,
      engineOilSpec: tpl.engineOilSpec,
      transmissionSpec: tpl.transmissionSpec,
      coolantSpec: tpl.coolantSpec,
      criticalPointsText: tpl.criticalPoints.join('\n'),
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenAddDue = () => {
    setEditingDue(null);
    setDueForm(DEFAULT_DUE_FORM);
    setIsDueModalOpen(true);
  };

  const handleOpenEditDue = (due: UpcomingPreventiveDue) => {
    setEditingDue(due);
    setDueForm({
      registrationNumber: due.registrationNumber,
      makeModel: due.makeModel,
      templateName: due.templateName,
      currentCounter: due.currentCounter,
      dueCounter: due.dueCounter,
      unit: due.unit,
      assignedSite: due.assignedSite,
    });
    setIsDueModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      {notification && (
        <div style={{ maxWidth: '1440px', margin: '16px auto 0', padding: '0 24px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '10px 16px', color: '#6ee7b7', fontSize: '13px', fontWeight: 600 }}>
            ✓ {notification}
          </div>
        </div>
      )}

      <PreventiveHeader
        climateZone={climateZone}
        onClimateZoneChange={setClimateZone}
        onOpenAddTemplate={handleOpenAddTemplate}
        onOpenAddDue={handleOpenAddDue}
      />

      <main style={{ maxWidth: '1440px', margin: '24px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <BreakthroughInnovationsPanel />

        <UpcomingPreventiveGrid
          upcoming={filteredUpcoming}
          isLoading={isLoadingUpcoming}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedUrgency={selectedUrgency}
          onUrgencyChange={setSelectedUrgency}
          onCreateWorkOrder={createWorkOrder}
          onEditDue={handleOpenEditDue}
          onDeleteDue={(due) => setDeleteTarget({ type: 'DUE', id: due.id, label: `${due.registrationNumber} (${due.templateName})` })}
        />

        <OemTemplatesCatalog
          templates={filteredTemplates}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onEditTemplate={handleOpenEditTemplate}
          onDeleteTemplate={(tpl) => setDeleteTarget({ type: 'TEMPLATE', id: tpl.id, label: `${tpl.make} ${tpl.model}` })}
        />
      </main>

      <PreventiveModals
        isTemplateModalOpen={isTemplateModalOpen}
        editingTemplate={editingTemplate}
        templateForm={templateForm}
        onChangeTemplateForm={setTemplateForm}
        onSaveTemplate={() => {
          saveTemplate(templateForm, editingTemplate?.id);
          setIsTemplateModalOpen(false);
        }}
        onCloseTemplateModal={() => setIsTemplateModalOpen(false)}
        isDueModalOpen={isDueModalOpen}
        editingDue={editingDue}
        dueForm={dueForm}
        templates={templates}
        onChangeDueForm={setDueForm}
        onSaveDue={() => {
          saveDue(dueForm, editingDue?.id);
          setIsDueModalOpen(false);
        }}
        onCloseDueModal={() => setIsDueModalOpen(false)}
        deleteTarget={deleteTarget}
        onConfirmDelete={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'TEMPLATE') deleteTemplate(deleteTarget.id);
          else deleteDue(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCloseDeleteModal={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function PreventivePage() {
  if (process.env.NEXT_PUBLIC_FF_REFACTOR_PREVENTIVE === 'false') {
    return <PreventivePageLegacy />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Chargement...</div>}>
      <PreventiveContent />
    </Suspense>
  );
}
