export type TemplateCategory = 'POIDS_LOURDS' | 'ENGINS_BTP' | 'UTILITAIRES';

export type DueUrgency = 'URGENT' | 'WARNING' | 'NOMINAL';

export type ClimateZone = 'TELL' | 'PLATEAUS' | 'SAHARA';

export interface OemMaintenanceTemplate {
  id: string;
  make: string;
  model: string;
  category: TemplateCategory;
  standardIntervalText: string;
  saharaIntervalText: string;
  severityFactor: number;
  engineOilSpec: string;
  transmissionSpec: string;
  coolantSpec: string;
  criticalPoints: string[];
}

export interface UpcomingPreventiveDue {
  id: string;
  registrationNumber: string;
  makeModel: string;
  templateName: string;
  currentCounter: number;
  dueCounter: number;
  remainingCounter: number;
  unit: 'km' | 'h';
  progressPercent: number;
  urgency: DueUrgency;
  assignedSite: string;
}

export interface TemplateFormData {
  make: string;
  model: string;
  category: TemplateCategory;
  standardIntervalText: string;
  saharaIntervalText: string;
  severityFactor: number;
  engineOilSpec: string;
  transmissionSpec: string;
  coolantSpec: string;
  criticalPointsText: string;
}

export interface DueFormData {
  registrationNumber: string;
  makeModel: string;
  templateName: string;
  currentCounter: number;
  dueCounter: number;
  unit: 'km' | 'h';
  assignedSite: string;
}

export interface DeleteConfirmTarget {
  type: 'TEMPLATE' | 'DUE';
  id: string;
  label: string;
}

