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
  urgency: 'URGENT' | 'WARNING' | 'NOMINAL';
  assignedSite: string;
}

export const MOCK_SANDBOX_PREVENTIVE_DUES: UpcomingPreventiveDue[] = [
  {
    id: 'due-01',
    registrationNumber: '01892-116-16',
    makeModel: 'Mercedes-Benz Actros 3340',
    templateName: 'Plan Poids Lourds Sévère (25 000 km)',
    currentCounter: 342900,
    dueCounter: 342450,
    remainingCounter: -450,
    unit: 'km',
    progressPercent: 101.8,
    urgency: 'URGENT',
    assignedSite: 'Rouiba (16)',
  },
  {
    id: 'due-02',
    registrationNumber: 'ENG-23-018-DZ',
    makeModel: 'Caterpillar 320D',
    templateName: 'Cycle BTP PM2 Filtration (350 h)',
    currentCounter: 512,
    dueCounter: 500,
    remainingCounter: -12,
    unit: 'h',
    progressPercent: 102.4,
    urgency: 'URGENT',
    assignedSite: 'Chantier Annaba (23)',
  },
  {
    id: 'due-03',
    registrationNumber: '00421-116-16',
    makeModel: 'Renault Trucks K 480',
    templateName: 'Plan Poids Lourds Sévère (26 000 km)',
    currentCounter: 284150,
    dueCounter: 286000,
    remainingCounter: 1850,
    unit: 'km',
    progressPercent: 92.8,
    urgency: 'WARNING',
    assignedSite: 'Ghardaïa (47)',
  },
  {
    id: 'due-04',
    registrationNumber: '00912-120-31',
    makeModel: 'Toyota Hilux 2.4 D-4D',
    templateName: 'Plan Utilitaires 4x4 (7 500 km)',
    currentCounter: 42100,
    dueCounter: 45000,
    remainingCounter: 2900,
    unit: 'km',
    progressPercent: 61.3,
    urgency: 'NOMINAL',
    assignedSite: 'Oran (31)',
  },
];
