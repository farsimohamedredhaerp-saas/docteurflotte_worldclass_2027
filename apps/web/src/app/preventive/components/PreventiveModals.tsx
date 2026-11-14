'use client';

import React from 'react';
import { OemTemplateModal } from './modals/OemTemplateModal';
import { PreventiveDueModal } from './modals/PreventiveDueModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import type {
  OemMaintenanceTemplate,
  UpcomingPreventiveDue,
  TemplateFormData,
  DueFormData,
  DeleteConfirmTarget,
} from '../types';

interface PreventiveModalsProps {
  isTemplateModalOpen: boolean;
  editingTemplate: OemMaintenanceTemplate | null;
  templateForm: TemplateFormData;
  onChangeTemplateForm: (form: TemplateFormData) => void;
  onSaveTemplate: () => void;
  onCloseTemplateModal: () => void;

  isDueModalOpen: boolean;
  editingDue: UpcomingPreventiveDue | null;
  dueForm: DueFormData;
  templates: OemMaintenanceTemplate[];
  onChangeDueForm: (form: DueFormData) => void;
  onSaveDue: () => void;
  onCloseDueModal: () => void;

  deleteTarget: DeleteConfirmTarget | null;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

export function PreventiveModals({
  isTemplateModalOpen,
  editingTemplate,
  templateForm,
  onChangeTemplateForm,
  onSaveTemplate,
  onCloseTemplateModal,

  isDueModalOpen,
  editingDue,
  dueForm,
  templates,
  onChangeDueForm,
  onSaveDue,
  onCloseDueModal,

  deleteTarget,
  onConfirmDelete,
  onCloseDeleteModal,
}: PreventiveModalsProps) {
  return (
    <>
      <OemTemplateModal
        isOpen={isTemplateModalOpen}
        editingTemplate={editingTemplate}
        form={templateForm}
        onChangeForm={onChangeTemplateForm}
        onSave={(e) => {
          e.preventDefault();
          onSaveTemplate();
        }}
        onClose={onCloseTemplateModal}
      />

      <PreventiveDueModal
        isOpen={isDueModalOpen}
        editingDue={editingDue}
        form={dueForm}
        templates={templates}
        onChangeForm={onChangeDueForm}
        onSave={(e) => {
          e.preventDefault();
          onSaveDue();
        }}
        onClose={onCloseDueModal}
      />

      <DeleteConfirmModal
        target={deleteTarget}
        onConfirm={onConfirmDelete}
        onClose={onCloseDeleteModal}
      />
    </>
  );
}
