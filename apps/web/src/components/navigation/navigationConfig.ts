export type NavigationModuleId =
  | 'operations'
  | 'fleet'
  | 'maintenance'
  | 'fuel'
  | 'decisions';

export interface NavigationSubView {
  id: string;
  label: string;
  desc: string;
  tag: string;
  badgeCount?: number;
  status?: 'nominal' | 'warning' | 'critical' | 'neutral';
  shortcut?: string;
}

export interface TechnicalFilterOption {
  value: string;
  label: string;
  count?: number;
  severity?: 'nominal' | 'warning' | 'critical' | 'neutral';
}

export interface ContextualFilterGroup {
  id: string;
  label: string;
  options: TechnicalFilterOption[];
}

export interface NavigationModuleConfig {
  id: NavigationModuleId;
  label: string;
  subtitle: string;
  href: string;
  badgeText?: string;
  engineeringConsoleTag: string;
  subViews: NavigationSubView[];
  filterGroups: ContextualFilterGroup[];
}

export interface OrganizationSiteOption {
  id: string;
  name: string;
  wilaya: string;
  code: string;
  activeFleetCount: number;
  alertCount: number;
}

export const ORGANIZATION_SITES: OrganizationSiteOption[] = [
  {
    id: 'site-alger-hq',
    name: 'Direction Logistique Centrale',
    wilaya: 'Alger (16)',
    code: 'HQ-ALG-01',
    activeFleetCount: 142,
    alertCount: 2,
  },
  {
    id: 'site-oued-smar',
    name: 'Atelier Central & Diagnostic Moteur',
    wilaya: 'Oued Smar (16)',
    code: 'WRK-SMR-02',
    activeFleetCount: 28,
    alertCount: 3,
  },
  {
    id: 'site-sud-hassi',
    name: 'Chantier BTP Sud & Forage',
    wilaya: 'Hassi Messaoud (30)',
    code: 'BTP-HMD-03',
    activeFleetCount: 86,
    alertCount: 5,
  },
  {
    id: 'site-ouest-oran',
    name: 'Base Opérationnelle & Portuaire',
    wilaya: 'Oran (31)',
    code: 'LOG-ORN-04',
    activeFleetCount: 64,
    alertCount: 1,
  },
];

export const NAVIGATION_MODULES: Record<NavigationModuleId, NavigationModuleConfig> = {
  operations: {
    id: 'operations',
    label: 'Opérations & SIG',
    subtitle: 'Tracking temps réel & Missions',
    href: '/',
    badgeText: 'LIVE 1S',
    engineeringConsoleTag: 'SIG / TELEMATICS',
    subViews: [
      {
        id: 'live_map',
        label: 'Carte Live & Télémétrie',
        desc: 'Traccar GPS, capteurs & état moteur',
        tag: 'OSM/MAP',
        status: 'nominal',
      },
      {
        id: 'corridors_geofencing',
        label: 'Corridors & Géofencing',
        desc: 'Wilayas, chantiers BTP & zones interdites',
        tag: 'GEOFENCE',
        badgeCount: 14,
        status: 'neutral',
      },
      {
        id: 'trips_timeline',
        label: 'Chronologie des Trajets',
        desc: 'Replay de routes, arrêts & ralenti excessif',
        tag: 'REPLAY',
        status: 'neutral',
      },
      {
        id: 'missions_dispatch',
        label: 'Missions & Ordres de Route',
        desc: 'Affectations conducteurs & feuilles de route',
        tag: 'DISPATCH',
        badgeCount: 9,
        status: 'warning',
      },
    ],
    filterGroups: [
      {
        id: 'live_status',
        label: 'Statut Flotte en Direct',
        options: [
          { value: 'ALL', label: 'Toutes les unités', count: 142 },
          { value: 'IN_MOTION', label: 'En mouvement', count: 98, severity: 'nominal' },
          { value: 'EXCESSIVE_IDLE', label: 'Ralenti excessif (>15 min)', count: 18, severity: 'warning' },
          { value: 'OFFLINE_NO_PING', label: 'Hors réseau (>2h)', count: 6, severity: 'neutral' },
          { value: 'ACTIVE_ALERTS', label: 'Alerte active (DTC / Choc)', count: 4, severity: 'critical' },
        ],
      },
    ],
  },

  fleet: {
    id: 'fleet',
    label: 'Flotte & Engins BTP',
    subtitle: 'Inventaire technique, Heures moteur, Affectations',
    href: '/assets',
    badgeText: '320 UNITÉS',
    engineeringConsoleTag: 'ASSET REGISTRY',
    subViews: [
      {
        id: 'asset_registry',
        label: 'Inventaire Technique Unifié',
        desc: 'Fiches techniques, VIN constructeur & compteurs',
        tag: 'REGISTRY',
        status: 'nominal',
      },
      {
        id: 'engine_hours_meter',
        label: 'Horamètres & Heures Sous Charge',
        desc: 'Suivi des compteurs sans saut négatif',
        tag: 'HORAMÈTRE',
        status: 'nominal',
      },
      {
        id: 'tire_fleet_management',
        label: 'Suivi Pneumatique & Remplacement',
        desc: 'Profondeur de bande, permutation & pressions TPMS',
        tag: 'TIRE-OPS',
        badgeCount: 12,
        status: 'warning',
      },
      {
        id: 'regulatory_compliance',
        label: 'Conformité Documentaire',
        desc: 'Contrôles techniques ENACTA, assurances & chronos',
        tag: 'ENACTA',
        badgeCount: 3,
        status: 'critical',
      },
      {
        id: 'digital_twin_view',
        label: 'Jumeau Numérique des Actifs',
        desc: 'Cinématique d’usure des organes & simulation',
        tag: 'TWIN-SIM',
        status: 'neutral',
      },
    ],
    filterGroups: [
      {
        id: 'asset_category',
        label: 'Catégorie Technique',
        options: [
          { value: 'ALL', label: 'Tout le parc', count: 320 },
          { value: 'HEAVY_TRUCK', label: 'Tracteurs & Porteurs PL', count: 114 },
          { value: 'CONSTRUCTION_BTP', label: 'Pelles & Chargeuses BTP', count: 78 },
          { value: 'GENERATOR_SET', label: 'Groupes Électrogènes', count: 34 },
          { value: 'LIGHT_COMMERCIAL', label: 'Fourgons & VUL', count: 94 },
        ],
      },
    ],
  },

  maintenance: {
    id: 'maintenance',
    label: 'Maintenance 4.0',
    subtitle: 'Prédictif RUL, Proactif, Atelier & Ordres de Travail',
    href: '/maintenance',
    badgeText: 'PREDICTIVE 4.0',
    engineeringConsoleTag: 'PHYSICS & TELEMETRY',
    subViews: [
      {
        id: 'rul_matrix',
        label: 'Santé Prédictive (RUL & Dérives)',
        desc: 'Modèles Arrhenius, Cranking, Archard & Weibull',
        tag: 'WEIBULL',
        status: 'warning',
      },
      {
        id: 'telemetry_can',
        label: 'Diagnostic Télématique CAN-bus',
        desc: 'Flux J1939 / DM1 / OBD-II & trames .dbc',
        tag: 'CAN-DBC',
        badgeCount: 3,
        status: 'critical',
      },
      {
        id: 'oem_plans',
        label: 'Planning Préventif & Seuils',
        desc: 'Intervalles constructeurs KM & Horamètre BTP',
        tag: 'OEM',
        status: 'nominal',
      },
      {
        id: 'parts_cross_ref',
        label: 'Catalogue Pièces & Équivalences',
        desc: 'OEM vs Donaldson / Mann / Fleetguard',
        tag: 'CROSS-REF',
        status: 'neutral',
      },
      {
        id: 'inventory_stock',
        label: 'Stocks Magasins & Achats',
        desc: 'Dépôts, inventaire physique, réceptions BL & EOQ',
        tag: 'STOCK',
        status: 'neutral',
      },
      {
        id: 'work_orders',
        label: 'Atelier & Ordres de Travail',
        desc: 'OT curatifs/préventifs & chiffrage TCO',
        tag: 'OT',
        badgeCount: 7,
        status: 'warning',
      },
    ],
    filterGroups: [
      {
        id: 'severity',
        label: 'Sévérité Prédictive',
        options: [
          { value: 'ALL', label: 'Toutes sévérités', count: 48 },
          { value: 'CRITICAL', label: 'Seuil critique (<25h / <1000km)', count: 3, severity: 'critical' },
          { value: 'UNDER_25H', label: 'Horamètre < 25h restant', count: 2, severity: 'warning' },
          { value: 'UNDER_1000KM', label: 'Compteur < 1000 km restant', count: 4, severity: 'warning' },
        ],
      },
      {
        id: 'subsystem',
        label: 'Sous-Système Organique',
        options: [
          { value: 'ALL', label: 'Tous les organes' },
          { value: 'ENGINE', label: 'Huile & Thermique Moteur' },
          { value: 'HYDRAULICS', label: 'Circuit Hydraulique BTP' },
          { value: 'BRAKES_APS', label: 'Freinage & Sécheur d’Air' },
          { value: 'TRANSMISSION', label: 'Boîte & Pont Moteur' },
          { value: 'FUEL_SYSTEM', label: 'Circuit Carburant & FAP' },
        ],
      },
    ],
  },

  fuel: {
    id: 'fuel',
    label: 'Carburant & Audit',
    subtitle: 'Détection d’anomalies, Réconciliation CAN/Tickets, TCO',
    href: '/fuel-scanner',
    badgeText: 'CUSUM ACTIVE',
    engineeringConsoleTag: 'FUEL METROLOGY',
    subViews: [
      {
        id: 'fuel_can_curves',
        label: 'Courbes de Jauge CAN-bus',
        desc: 'Analyse continue des capteurs capacitifs et CAN',
        tag: 'J1939-LVL',
        status: 'nominal',
      },
      {
        id: 'fuel_reconciliation',
        label: 'Réconciliation des Pleins Naftal',
        desc: 'Croisement tickets stations vs réservoir réel',
        tag: 'NAFTAL',
        badgeCount: 2,
        status: 'warning',
      },
      {
        id: 'theft_leak_detection',
        label: 'Détection Siphonnage & Fuites',
        desc: 'Algorithme CUSUM seuillé & chutes de niveau au repos',
        tag: 'CUSUM',
        badgeCount: 1,
        status: 'critical',
      },
      {
        id: 'tco_fuel_costs',
        label: 'Coût Kilométrique & Horaire',
        desc: 'Consommations L/100km & L/heure sous charge',
        tag: 'TCO-L',
        status: 'neutral',
      },
    ],
    filterGroups: [
      {
        id: 'fuel_anomaly',
        label: 'Type d’Anomalie Carburant',
        options: [
          { value: 'ALL', label: 'Tous les relevés', count: 184 },
          { value: 'SIPHONAGE', label: 'Siphonnage suspecté (>30L)', count: 1, severity: 'critical' },
          { value: 'SLOW_LEAK', label: 'Fuite lente continue', count: 3, severity: 'warning' },
          { value: 'OVERCONSUMPTION', label: 'Surconsommation thermique', count: 8, severity: 'warning' },
        ],
      },
    ],
  },

  decisions: {
    id: 'decisions',
    label: 'Décisionnel & BI',
    subtitle: 'Rapports d’exploitation, Rentabilité, SLA',
    href: '/decisions',
    badgeText: 'SAD / ADS',
    engineeringConsoleTag: 'DECISION ENGINE',
    subViews: [
      {
        id: 'decision_arbitrage',
        label: 'Arbitrage SAD : Action vs Inaction',
        desc: 'Matrice de rentabilité immédiate et risque de panne',
        tag: 'SAD-ADS',
        badgeCount: 4,
        status: 'critical',
      },
      {
        id: 'asset_tco_ranking',
        label: 'Rentabilité & TCO par Actif',
        desc: 'Coût total de possession vs chiffre d’affaires produit',
        tag: 'TCO-BI',
        status: 'nominal',
      },
      {
        id: 'sla_availability',
        label: 'Taux de Disponibilité & SLA',
        desc: 'Disponibilité technique opérationnelle (DTO)',
        tag: 'SLA-OPS',
        status: 'nominal',
      },
      {
        id: 'audit_algeria_compliance',
        label: 'Audit Réglementaire Algérie',
        desc: 'Traçabilité Loi 18-07 ANPDP & rapports JORADP',
        tag: 'LOI 18-07',
        status: 'nominal',
      },
    ],
    filterGroups: [
      {
        id: 'decision_horizon',
        label: 'Horizon Décisionnel',
        options: [
          { value: 'ALL', label: 'Toutes les échéances' },
          { value: 'URGENT_48H', label: 'Arbitrages < 48 heures', count: 4, severity: 'critical' },
          { value: 'NEXT_WEEK', label: 'Planning de semaine', count: 11, severity: 'warning' },
          { value: 'BUDGET_CYCLE', label: 'Cycle budgétaire mensuel', count: 26 },
        ],
      },
    ],
  },
};
