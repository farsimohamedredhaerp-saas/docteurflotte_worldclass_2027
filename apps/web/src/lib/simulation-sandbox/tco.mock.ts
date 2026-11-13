export interface AssetTcoRecord {
  id: string;
  registrationNumber: string;
  makeModel: string;
  category: 'PL_TRACTEUR' | 'PL_BENNE' | 'ENGIN_BTP' | 'VUL_UTILITAIRE';
  categoryLabel: string;
  kmOrHoursPeriod: number;
  unitType: 'km' | 'h';
  fuelCostDzd: number;
  maintenanceCostDzd: number;
  driverCostDzd: number;
  tiresAndOtherDzd: number;
  totalCostDzd: number;
  costPerUnitDzd: number;
  targetBudgetPerUnitDzd: number;
  variancePercent: number;
  status: 'OPTIMAL' | 'ON_TRACK' | 'OVER_BUDGET';
}

export const MOCK_SANDBOX_TCO: AssetTcoRecord[] = [
  {
    id: 'tco-01',
    registrationNumber: '00421-116-16',
    makeModel: 'Renault Trucks K 480 6x4',
    category: 'PL_BENNE',
    categoryLabel: 'PL Benne Chantier',
    kmOrHoursPeriod: 6400,
    unitType: 'km',
    fuelCostDzd: 220000,
    maintenanceCostDzd: 85000,
    driverCostDzd: 110000,
    tiresAndOtherDzd: 42000,
    totalCostDzd: 457000,
    costPerUnitDzd: 71.4,
    targetBudgetPerUnitDzd: 78.0,
    variancePercent: -8.5,
    status: 'OPTIMAL',
  },
  {
    id: 'tco-02',
    registrationNumber: '01892-116-16',
    makeModel: 'Mercedes-Benz Actros 3340 S',
    category: 'PL_TRACTEUR',
    categoryLabel: 'PL Tracteur Routier',
    kmOrHoursPeriod: 8900,
    unitType: 'km',
    fuelCostDzd: 340000,
    maintenanceCostDzd: 210000,
    driverCostDzd: 125000,
    tiresAndOtherDzd: 68000,
    totalCostDzd: 743000,
    costPerUnitDzd: 83.5,
    targetBudgetPerUnitDzd: 80.0,
    variancePercent: 4.4,
    status: 'OVER_BUDGET',
  },
  {
    id: 'tco-03',
    registrationNumber: 'ENG-23-018-DZ',
    makeModel: 'Caterpillar 320D',
    category: 'ENGIN_BTP',
    categoryLabel: 'Pelle Hydraulique BTP',
    kmOrHoursPeriod: 165,
    unitType: 'h',
    fuelCostDzd: 290000,
    maintenanceCostDzd: 145000,
    driverCostDzd: 95000,
    tiresAndOtherDzd: 32000,
    totalCostDzd: 562000,
    costPerUnitDzd: 3406.0,
    targetBudgetPerUnitDzd: 3600.0,
    variancePercent: -5.4,
    status: 'OPTIMAL',
  },
  {
    id: 'tco-04',
    registrationNumber: '08341-118-30',
    makeModel: 'Shacman F3000 Benne',
    category: 'PL_BENNE',
    categoryLabel: 'PL Benne Sahara',
    kmOrHoursPeriod: 5200,
    unitType: 'km',
    fuelCostDzd: 260000,
    maintenanceCostDzd: 195000,
    driverCostDzd: 105000,
    tiresAndOtherDzd: 54000,
    totalCostDzd: 614000,
    costPerUnitDzd: 118.1,
    targetBudgetPerUnitDzd: 110.0,
    variancePercent: 7.4,
    status: 'OVER_BUDGET',
  },
  {
    id: 'tco-05',
    registrationNumber: '00912-120-31',
    makeModel: 'Toyota Hilux 2.4 D-4D',
    category: 'VUL_UTILITAIRE',
    categoryLabel: 'Pick-up 4x4 Superviseur',
    kmOrHoursPeriod: 7800,
    unitType: 'km',
    fuelCostDzd: 98000,
    maintenanceCostDzd: 38000,
    driverCostDzd: 85000,
    tiresAndOtherDzd: 24000,
    totalCostDzd: 245000,
    costPerUnitDzd: 31.4,
    targetBudgetPerUnitDzd: 33.0,
    variancePercent: -4.8,
    status: 'OPTIMAL',
  },
];

