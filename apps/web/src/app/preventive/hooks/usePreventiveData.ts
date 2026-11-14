'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { INITIAL_OEM_TEMPLATES } from '../constants';
import type {
  OemMaintenanceTemplate,
  UpcomingPreventiveDue,
  TemplateFormData,
  DueFormData,
} from '../types';

export function usePreventiveData() {
  const { isDemoMode } = useDemoMode();
  const [templates, setTemplates] = useState<OemMaintenanceTemplate[]>(INITIAL_OEM_TEMPLATES);
  const [upcoming, setUpcoming] = useState<UpcomingPreventiveDue[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      import('@/lib/simulation-sandbox').then((sandbox) => {
        setUpcoming(sandbox.MOCK_SANDBOX_PREVENTIVE_DUES);
        setIsLoadingUpcoming(false);
      });
    } else {
      setUpcoming([]);
      setIsLoadingUpcoming(false);
    }
  }, [isDemoMode]);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  }, []);

  const createWorkOrder = useCallback(
    (plate: string, template: string) => {
      showNotification(
        `Ordre de Travail Préventif déclenché pour l'actif ${plate} (${template}). Transmis à l'atelier.`
      );
    },
    [showNotification]
  );

  const saveTemplate = useCallback(
    (formData: TemplateFormData, editingId?: string) => {
      const points = formData.criticalPointsText
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      if (editingId) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? {
                  ...t,
                  make: formData.make,
                  model: formData.model,
                  category: formData.category,
                  standardIntervalText: formData.standardIntervalText,
                  saharaIntervalText: formData.saharaIntervalText,
                  severityFactor: Number(formData.severityFactor),
                  engineOilSpec: formData.engineOilSpec,
                  transmissionSpec: formData.transmissionSpec,
                  coolantSpec: formData.coolantSpec,
                  criticalPoints: points,
                }
              : t
          )
        );
        showNotification(`Programme d'entretien ${formData.make} ${formData.model} mis à jour.`);
      } else {
        const newId = `TPL-CUSTOM-${Date.now().toString().slice(-4)}`;
        const newTpl: OemMaintenanceTemplate = {
          id: newId,
          make: formData.make,
          model: formData.model,
          category: formData.category,
          standardIntervalText: formData.standardIntervalText,
          saharaIntervalText: formData.saharaIntervalText,
          severityFactor: Number(formData.severityFactor),
          engineOilSpec: formData.engineOilSpec,
          transmissionSpec: formData.transmissionSpec,
          coolantSpec: formData.coolantSpec,
          criticalPoints: points,
        };
        setTemplates((prev) => [newTpl, ...prev]);
        showNotification(`Nouveau gabarit OEM ${formData.make} ${formData.model} ajouté au catalogue.`);
      }
    },
    [showNotification]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showNotification('Programme d’entretien constructeur supprimé du catalogue.');
    },
    [showNotification]
  );

  const saveDue = useCallback(
    (formData: DueFormData, editingId?: string) => {
      const remaining = formData.dueCounter - formData.currentCounter;
      const progress = Math.min(100, Math.round((formData.currentCounter / formData.dueCounter) * 100));
      const urgency: 'URGENT' | 'WARNING' | 'NOMINAL' =
        remaining <= (formData.unit === 'km' ? 500 : 25)
          ? 'URGENT'
          : remaining <= (formData.unit === 'km' ? 2000 : 80)
          ? 'WARNING'
          : 'NOMINAL';

      if (editingId) {
        setUpcoming((prev) =>
          prev.map((u) =>
            u.id === editingId
              ? {
                  ...u,
                  registrationNumber: formData.registrationNumber,
                  makeModel: formData.makeModel,
                  templateName: formData.templateName,
                  currentCounter: Number(formData.currentCounter),
                  dueCounter: Number(formData.dueCounter),
                  remainingCounter: remaining,
                  unit: formData.unit,
                  progressPercent: progress,
                  urgency,
                  assignedSite: formData.assignedSite,
                }
              : u
          )
        );
        showNotification(`Échéance préventive de l'actif ${formData.registrationNumber} mise à jour.`);
      } else {
        const newDue: UpcomingPreventiveDue = {
          id: `DUE-${Date.now().toString().slice(-4)}`,
          registrationNumber: formData.registrationNumber,
          makeModel: formData.makeModel,
          templateName: formData.templateName,
          currentCounter: Number(formData.currentCounter),
          dueCounter: Number(formData.dueCounter),
          remainingCounter: remaining,
          unit: formData.unit,
          progressPercent: progress,
          urgency,
          assignedSite: formData.assignedSite,
        };
        setUpcoming((prev) => [newDue, ...prev]);
        showNotification(`Échéance préventive enregistrée pour ${formData.registrationNumber}.`);
      }
    },
    [showNotification]
  );

  const deleteDue = useCallback(
    (id: string) => {
      setUpcoming((prev) => prev.filter((u) => u.id !== id));
      showNotification('Échéance de maintenance retirée du plan prévisionnel.');
    },
    [showNotification]
  );

  return {
    templates,
    upcoming,
    isLoadingUpcoming,
    notification,
    showNotification,
    createWorkOrder,
    saveTemplate,
    deleteTemplate,
    saveDue,
    deleteDue,
  };
}
