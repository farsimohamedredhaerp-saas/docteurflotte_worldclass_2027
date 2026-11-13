export interface SandboxDriverRecord {
  id: string;
  name: string;
  matriculeNumber: string;
  phone: string;
  licenseCategory: 'C1' | 'C2' | 'E' | 'D' | 'B' | 'BTP_ENGIN';
  licenseNumber: string;
  licenseExpiry: string;
  medicalCheckExpiry: string;
  assignedVehiclePlate: string;
  assignedVehicleModel: string;
  currentSiteOrCorridor: string;
  ecoDrivingScore: number;
  harshBrakingCount: number;
  excessiveIdleMinutes: number;
  status: 'ON_DUTY' | 'AVAILABLE' | 'REST' | 'LICENSE_WARNING';
}

export const MOCK_SANDBOX_DRIVERS: SandboxDriverRecord[] = [
  {
    id: 'drv-01',
    name: 'Mourad Benali',
    matriculeNumber: 'DRV-16-042',
    phone: '0550 12 34 56',
    licenseCategory: 'E',
    licenseNumber: 'DZ-16-9812401',
    licenseExpiry: '2027-04-15',
    medicalCheckExpiry: '2026-08-10',
    assignedVehiclePlate: '00421-116-16',
    assignedVehicleModel: 'Renault Trucks K 480 6x4',
    currentSiteOrCorridor: 'Corridor RN1 Ghardaïa',
    ecoDrivingScore: 92,
    harshBrakingCount: 1,
    excessiveIdleMinutes: 8,
    status: 'ON_DUTY',
  },
  {
    id: 'drv-02',
    name: 'Karim Bouzid',
    matriculeNumber: 'DRV-16-089',
    phone: '0661 45 78 90',
    licenseCategory: 'C2',
    licenseNumber: 'DZ-16-4412092',
    licenseExpiry: '2025-11-18',
    medicalCheckExpiry: '2025-11-02',
    assignedVehiclePlate: '01892-116-16',
    assignedVehicleModel: 'Mercedes-Benz Actros 3340',
    currentSiteOrCorridor: 'Base Rouiba (16)',
    ecoDrivingScore: 68,
    harshBrakingCount: 6,
    excessiveIdleMinutes: 42,
    status: 'LICENSE_WARNING',
  },
  {
    id: 'drv-03',
    name: 'Rachid Mebarki',
    matriculeNumber: 'DRV-23-014',
    phone: '0770 98 12 34',
    licenseCategory: 'BTP_ENGIN',
    licenseNumber: 'CACES-DZ-88129',
    licenseExpiry: '2028-02-20',
    medicalCheckExpiry: '2026-05-15',
    assignedVehiclePlate: 'ENG-23-018-DZ',
    assignedVehicleModel: 'Caterpillar 320D (Pelle)',
    currentSiteOrCorridor: 'Chantier Minier Annaba (23)',
    ecoDrivingScore: 94,
    harshBrakingCount: 0,
    excessiveIdleMinutes: 12,
    status: 'ON_DUTY',
  },
  {
    id: 'drv-04',
    name: 'Yacine Belhadj',
    matriculeNumber: 'DRV-30-055',
    phone: '0555 33 22 11',
    licenseCategory: 'E',
    licenseNumber: 'DZ-30-1092841',
    licenseExpiry: '2026-10-30',
    medicalCheckExpiry: '2026-04-01',
    assignedVehiclePlate: '08341-118-30',
    assignedVehicleModel: 'Shacman F3000 Benne',
    currentSiteOrCorridor: 'RN3 Hassi Messaoud',
    ecoDrivingScore: 88,
    harshBrakingCount: 2,
    excessiveIdleMinutes: 19,
    status: 'AVAILABLE',
  },
  {
    id: 'drv-05',
    name: 'Sofiane Taleb',
    matriculeNumber: 'DRV-31-019',
    phone: '0662 11 44 77',
    licenseCategory: 'B',
    licenseNumber: 'DZ-31-5509123',
    licenseExpiry: '2027-09-12',
    medicalCheckExpiry: '2026-09-10',
    assignedVehiclePlate: '00912-120-31',
    assignedVehicleModel: 'Toyota Hilux 2.4 D-4D',
    currentSiteOrCorridor: 'Région Ouest Oran (31)',
    ecoDrivingScore: 96,
    harshBrakingCount: 0,
    excessiveIdleMinutes: 5,
    status: 'AVAILABLE',
  },
];
