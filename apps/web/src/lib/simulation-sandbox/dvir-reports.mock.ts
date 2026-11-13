import { DVIRInspectionReport, DVIRInspectionType, DVIRItemStatus } from '../api-fleet-intelligence';

export interface SimulationVehicleProfile {
  id: string;
  name: string;
  plate: string;
  category: string;
  driverName: string;
  driverId: string;
  odometerKm: number;
  engineHours: number;
  wilaya: string;
  fuelType: string;
  lastInspectionDate: string;
  lastInspectionResult: 'PASS' | 'FAIL_MINOR' | 'FAIL_CRITICAL';
  lastInspectionNotes?: string;
  traccarDeviceId?: string;
}

/**
 * Véhicules de démonstration DVIR — STRICTEMENT RÉSERVÉ AU MODE SIMULATION (isDemoMode === true).
 */
export const MOCK_SANDBOX_DVIR_VEHICLES: SimulationVehicleProfile[] = [
  {
    id: 'ast-t480-01',
    name: 'Renault Trucks T 480 4x2 Optidriver',
    plate: '16-10492-00',
    category: 'Tracteur Routier 40T',
    driverName: 'Mourad Belkacem',
    driverId: 'drv-01',
    odometerKm: 185450,
    engineHours: 4120,
    wilaya: '16 - Alger (Port)',
    fuelType: 'Gazole Naftal',
    lastInspectionDate: '24/10/2026 à 07:15',
    lastInspectionResult: 'PASS',
    lastInspectionNotes: 'Pression des pneus conforme (8.5 bars). PV ENACTA vérifié.',
    traccarDeviceId: 'TK-16-10492',
  },
  {
    id: 'ast-x3000-02',
    name: 'Shacman X3000 6x4 Benne (Weichai WP12)',
    plate: '31-08912-00',
    category: 'Porteur Benne BTP 26T',
    driverName: 'Karim Ziani',
    driverId: 'drv-02',
    odometerKm: 241800,
    engineHours: 6850,
    wilaya: '31 - Oran (Zone Industrielle)',
    fuelType: 'Gazole Naftal',
    lastInspectionDate: '23/10/2026 à 18:30',
    lastInspectionResult: 'PASS',
    lastInspectionNotes: 'Graissage sellette effectué en dépôt.',
    traccarDeviceId: 'TK-31-08912',
  },
  {
    id: 'ast-actros-03',
    name: 'Mercedes-Benz Actros 3340 6x4',
    plate: '09-00431-00',
    category: 'Tracteur Semi Lourd 44T',
    driverName: 'Djamel Bensalem',
    driverId: 'drv-03',
    odometerKm: 312500,
    engineHours: 8940,
    wilaya: '09 - Blida (Dépôt Sud)',
    fuelType: 'Gazole Naftal',
    lastInspectionDate: '24/10/2026 à 06:00',
    lastInspectionResult: 'FAIL_CRITICAL',
    lastInspectionNotes: 'Flexible frein pneumatique fuyard — Remplacé par l’atelier OT-ACT-991.',
    traccarDeviceId: 'TK-09-00431',
  },
  {
    id: 'ast-master-04',
    name: 'Renault Master III 2.3 dCi 150',
    plate: '16-07743-00',
    category: 'Véhicule Utilitaire (VUL)',
    driverName: 'Sofiane Hadj',
    driverId: 'drv-04',
    odometerKm: 78200,
    engineHours: 1890,
    wilaya: '16 - Alger (Messagerie)',
    fuelType: 'Gazole Naftal',
    lastInspectionDate: '24/10/2026 à 08:30',
    lastInspectionResult: 'PASS',
    lastInspectionNotes: 'Niveaux huile et liquide de refroidissement conformes.',
    traccarDeviceId: 'TK-16-07743',
  },
];

/**
 * Fiches d'inspection de démonstration.
 */
export const MOCK_SANDBOX_DVIR_REPORTS: DVIRInspectionReport[] = [
  {
    id: 'dvir-demo-01',
    tenantId: 'tenant-demo',
    assetId: 'ast-t480-01',
    assetCode: 'DZ-T480-16',
    assetName: 'Renault Trucks T 480',
    driverId: 'drv-01',
    driverName: 'Mourad Belkacem',
    inspectionType: DVIRInspectionType.PRE_TRIP,
    isCompliant: true,
    hasCriticalFailures: false,
    odometerKm: 185450,
    items: [
      { code: 'TIRES', category: 'TIRES_BRAKES', label: 'État et pression des pneumatiques', status: DVIRItemStatus.PASS },
      { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Frein de service et stationnement', status: DVIRItemStatus.PASS },
      { code: 'OIL_LEVEL', category: 'MECHANICAL', label: 'Niveau huile moteur', status: DVIRItemStatus.PASS },
      { code: 'FIRE_EXT', category: 'SAFETY_EQUIPMENT', label: 'Extincteur vérifié à jour', status: DVIRItemStatus.PASS },
      { code: 'ENACTA_DOC', category: 'REGULATORY_DOCS', label: 'PV Contrôle ENACTA en cabine', status: DVIRItemStatus.PASS },
    ],
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'dvir-demo-02',
    tenantId: 'tenant-demo',
    assetId: 'ast-x3000-02',
    assetCode: 'DZ-X3000-31',
    assetName: 'Shacman X3000 6x4',
    driverId: 'drv-03',
    driverName: 'Sofiane Feghouli',
    inspectionType: DVIRInspectionType.PRE_TRIP,
    isCompliant: false,
    hasCriticalFailures: true,
    odometerKm: 241800,
    items: [
      { code: 'TIRES', category: 'TIRES_BRAKES', label: 'Pneu AVG hernie profonde', status: DVIRItemStatus.FAIL_CRITICAL, comment: 'Coupure flanc pneu avant gauche' },
      { code: 'BRAKES', category: 'TIRES_BRAKES', label: 'Freinage pneumatique', status: DVIRItemStatus.PASS },
      { code: 'OIL_LEVEL', category: 'MECHANICAL', label: 'Niveau huile', status: DVIRItemStatus.PASS },
      { code: 'FIRE_EXT', category: 'SAFETY_EQUIPMENT', label: 'Extincteur', status: DVIRItemStatus.PASS },
      { code: 'ENACTA_DOC', category: 'REGULATORY_DOCS', label: 'PV Contrôle ENACTA', status: DVIRItemStatus.PASS },
    ],
    generatedWorkOrderId: 'ot-dvir-99104',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];
