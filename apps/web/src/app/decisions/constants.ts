import type { ScenarioDefinition, UrgencyFilter } from './types';

export const ADS_SIMULATION_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'ALGER_RESTRICTION',
    label: 'PL Transit Alger (07h-20h)',
    desc: 'Arrêté Wilaya 16 - Interdiction rocade',
    badge: 'Arrêté Wilaya',
  },
  {
    id: 'ENACTA_EXPIRED',
    label: 'Semi-Remorque ENACTA Échu',
    desc: 'Loi 01-14 / Décret 03-223',
    badge: 'Contrôle Tech.',
  },
  {
    id: 'VHI_CRITICAL',
    label: 'Fourgon VHI Critique (SOH 35%)',
    desc: 'Risque arrêt moteur imminent',
    badge: 'Santé VHI',
  },
  {
    id: 'COMPLIANT_MISSION',
    label: 'Mission Conforme (RN4)',
    desc: 'Feuille de route 100% validée',
    badge: 'Conforme',
  },
];

export const URGENCY_OPTIONS: Array<{ id: UrgencyFilter; label: string }> = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'danger', label: 'Critiques' },
  { id: 'warning', label: 'Préavis' },
];
