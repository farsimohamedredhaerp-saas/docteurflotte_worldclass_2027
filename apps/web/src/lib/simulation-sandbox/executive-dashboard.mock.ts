/**
 * Données de démonstration du tableau de bord exécutif.
 * Ce module n'est chargé que via import dynamique lorsque le mode démo est actif :
 * il ne doit jamais être importé statiquement par du code de production.
 */
import type { CostArbitrationItem, DataPoint } from '../../components/ui';
import type { DecisionItem } from '../../components/dashboard/ExecutiveDashboardClient';
import type { KpiMetricItem } from '../../components/density/HighDensityKpiGrid';
import type { FleetUnitRecord } from '../../components/density/FleetHighDensityTable';
import { SEED_FLEET_UNITS } from './fleet-table.mock';

export const INITIAL_DECISIONS: DecisionItem[] = [
  {
    id: 'DEC-001',
    assetId: 'PL-16-042-DZ',
    assetName: 'Tracteur Routier Scania R450',
    assetCategory: 'Poids Lourds',
    urgency: 'danger',
    anomalyTitle: 'Échéance de révision critique dépassée (+1 250 km)',
    anomalyDescription:
      'Le compteur kilométrique validé (181 250 km) a franchi le seuil de vidange moteur et remplacement filtre. Risque d\'usure prématurée du turbocompresseur en cas de maintien en mission.',
    costEstimate: '68 000 DA',
    costInactionEstimate: '380 000 DA (Casse turbo/moteur)',
    confidenceScore: 98,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 45s',
      ignition: 'ON',
      gpsFix: true,
      currentSpeed: 72,
    },
  },
  {
    id: 'DEC-002',
    assetId: 'ENG-23-018-DZ',
    assetName: 'Pelle Hydraulique Caterpillar 320D',
    assetCategory: 'Engins BTP',
    urgency: 'warning',
    anomalyTitle: 'Seuil de maintenance hydraulique atteint (512 h / 500 h)',
    anomalyDescription:
      'L\'analyse du compteur horaire télématique indique un franchissement du cycle préventif de filtration hydraulique. Intervention recommandée sous 48h pour éviter l\'immobilisation sur chantier.',
    costEstimate: '45 000 DA',
    costInactionEstimate: '290 000 DA (Arrêt de chantier)',
    confidenceScore: 96,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 1 min',
      ignition: 'ON',
      gpsFix: true,
      currentSpeed: 0,
    },
  },
  {
    id: 'DEC-003',
    assetId: 'VL-09-114-DZ',
    assetName: 'Toyota Hilux 2.4 D-4D',
    assetCategory: 'Véhicules Légers',
    urgency: 'info',
    anomalyTitle: 'Permutation et contrôle géométrie pneumatiques',
    anomalyDescription:
      'Recommandation préventive suite à un différentiel de consommation et 20 000 km parcourus depuis la dernière inspection du train roulant.',
    costEstimate: '18 000 DA',
    confidenceScore: 94,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 3 min',
      ignition: 'OFF',
      gpsFix: true,
      currentSpeed: 0,
    },
  },
];

export const DEMO_ARBITRATIONS: CostArbitrationItem[] = [
  {
    id: 'arb-001',
    assetLabel: 'Scania R450 (02319-122-31) — A1 Oran',
    actionCostDzd: 68000,
    inactionRiskDzd: 380000,
    breakdown: {
      mechanicalDamageDzd: 280000,
      towingCostDzd: 35000,
      downtimeLossDzd: 65000,
    },
    preventiveActionLabel: 'Vidange Arrhenius + Remplacement Filtre Huile',
  },
  {
    id: 'arb-002',
    assetLabel: 'CAT 336D2 L (ENG-336-030) — Chantier Hassi Messaoud',
    actionCostDzd: 45000,
    inactionRiskDzd: 410000,
    breakdown: {
      mechanicalDamageDzd: 260000,
      towingCostDzd: 75000,
      downtimeLossDzd: 75000,
    },
    preventiveActionLabel: 'Filtration Hydraulique & Analyse Particules',
  },
  {
    id: 'arb-003',
    assetLabel: 'Shacman X3000 (09124-118-23) — Port Annaba',
    actionCostDzd: 38000,
    inactionRiskDzd: 295000,
    breakdown: {
      mechanicalDamageDzd: 210000,
      towingCostDzd: 35000,
      downtimeLossDzd: 50000,
    },
    preventiveActionLabel: 'Régénération Forcée FAP + Remplacement Sonde',
  },
];

export const FLEET_TREND_DATA: DataPoint[] = [
  { timestamp: '15 Oct', vhiScore: 89, fuelL100: 34.2 },
  { timestamp: '20 Oct', vhiScore: 87, fuelL100: 33.8 },
  { timestamp: '25 Oct', vhiScore: 88, fuelL100: 33.1 },
  { timestamp: '30 Oct', vhiScore: 86, fuelL100: 32.5 },
  { timestamp: '05 Nov', vhiScore: 91, fuelL100: 32.0 },
  { timestamp: '10 Nov', vhiScore: 93, fuelL100: 31.8 },
  { timestamp: '15 Nov', vhiScore: 95, fuelL100: 31.4 },
];

export const DEMO_METRICS: KpiMetricItem[] = [
    {
      id: 'active_assets',
      label: 'Unités en Mission Active',
      value: '142',
      unit: '/ 160',
      trend: { value: '+4.2%', isPositive: true, label: 'vs hier' },
      status: 'nominal',
      iconType: 'fleet',
    },
    {
      id: 'live_telemetry_flow',
      label: 'Flux CAN-bus / Télémétrie',
      value: '99.8',
      unit: '%',
      trend: { value: '< 24ms', isPositive: true, label: 'latence p95' },
      status: 'nominal',
      iconType: 'activity',
    },
    {
      id: 'critical_dtc_alerts',
      label: 'Codes Défauts Critiques (DTC)',
      value: '3',
      unit: 'actifs',
      trend: { value: '-2', isPositive: true, label: 'depuis 24h' },
      status: 'critical',
      iconType: 'alert',
    },
    {
      id: 'roi_preventive_savings',
      label: 'Économie Nette Préventive',
      value: '1 420 000',
      unit: 'DA',
      trend: { value: '+340 000 DA', isPositive: true, label: 'ce mois' },
      status: 'nominal',
      iconType: 'compliance',
    },
    {
      id: 'fuel_theft_cusum',
      label: 'Anti-Fraude CUSUM (Naftal)',
      value: '0 Vol',
      unit: 'CUSUM OK',
      trend: { value: '100%', isPositive: true, label: 'pleins réconciliés' },
      status: 'nominal',
      iconType: 'fuel',
    },
    {
      id: 'fuel_efficiency',
      label: 'Conso Moyenne Flotte',
      value: '31.4',
      unit: 'L/100km',
      trend: { value: '-1.8%', isPositive: true, label: 'optimisé' },
      status: 'nominal',
      iconType: 'fuel',
    },
    {
      id: 'preventive_due_soon',
      label: 'Échéances Préventives (< 48h)',
      value: '7',
      unit: 'engins',
      trend: { value: '+3', isPositive: false, label: 'horamètre BTPH' },
      status: 'warning',
      iconType: 'maintenance',
    },
    {
      id: 'dto_availability_rate',
      label: 'Disponibilité Technique (DTO)',
      value: '94.6',
      unit: '%',
      trend: { value: '+0.8%', isPositive: true, label: 'SLA garanti' },
      status: 'nominal',
      iconType: 'compliance',
    },
];

export interface ExecutiveDashboardDemoData {
  decisions: DecisionItem[];
  arbitrations: CostArbitrationItem[];
  trendData: DataPoint[];
  metrics: KpiMetricItem[];
  fleetUnits: FleetUnitRecord[];
}

export const EXECUTIVE_DEMO_DATA: ExecutiveDashboardDemoData = {
  decisions: INITIAL_DECISIONS,
  arbitrations: DEMO_ARBITRATIONS,
  trendData: FLEET_TREND_DATA,
  metrics: DEMO_METRICS,
  fleetUnits: SEED_FLEET_UNITS,
};
