import { NextResponse } from 'next/server';
import rawMasterCatalog from '../../../lib/oem_catalog_master.json';
import type { ScraperTraceStep } from '../../../lib/api-oem-scraper';
import type { RawOEMCatalogEntry, RawOEMTask } from '../../../lib/api-oem-catalog';

const masterCatalogTyped = rawMasterCatalog as RawOEMCatalogEntry[];

interface OEMTask {
  task_code: string;
  task_name: string;
  subsystem: string;
  normal_interval_km: number;
  normal_interval_months: number;
  normal_interval_engine_hours: number;
  severe_interval_km: number;
  severe_interval_months: number;
  severe_interval_engine_hours: number;
  standard_labor_minutes: number;
  criticality_weight: number;
}

interface OEMTemplate {
  wmi_prefix: string;
  make: string;
  model: string;
  engine_code: string;
  asset_category: string;
  fuel_type: string;
  ref_consumption_l_100km: number;
  ref_consumption_l_hour: number;
  oil_capacity_liters: number;
  oil_norm_spec: string;
  tasks: OEMTask[];
  execution_trace?: ScraperTraceStep[];
}

// Référentiel WMI (Algérie & International)
const WMI_MAP: Record<string, { make: string; category: string }> = {
  VF1: { make: 'Renault', category: 'VAN' },
  VF3: { make: 'Peugeot', category: 'VAN' },
  VF6: { make: 'Renault Trucks', category: 'HEAVY_TRUCK' },
  VF7: { make: 'Citroën', category: 'VAN' },
  UU1: { make: 'Dacia', category: 'LIGHT_VEHICLE' },
  ZFA: { make: 'Fiat', category: 'VAN' },
  ZFC: { make: 'Iveco', category: 'HEAVY_TRUCK' },
  WMA: { make: 'MAN', category: 'HEAVY_TRUCK' },
  WDB: { make: 'Mercedes-Benz', category: 'HEAVY_TRUCK' },
  WDF: { make: 'Mercedes-Benz', category: 'VAN' },
  YV2: { make: 'Volvo Trucks', category: 'HEAVY_TRUCK' },
  YS2: { make: 'Scania', category: 'HEAVY_TRUCK' },
  LZG: { make: 'Shacman', category: 'HEAVY_TRUCK' },
  LZZ: { make: 'Sinotruk Howo', category: 'HEAVY_TRUCK' },
  LJ1: { make: 'JAC Motors', category: 'HEAVY_TRUCK' },
  VFA: { make: 'SNVI', category: 'HEAVY_TRUCK' },
  JAA: { make: 'Isuzu', category: 'HEAVY_TRUCK' },
  KMF: { make: 'Hyundai', category: 'HEAVY_TRUCK' },
  AHT: { make: 'Toyota', category: 'LIGHT_VEHICLE' },
  SLP: { make: 'JCB', category: 'CONSTRUCTION_EQUIP' },
  CAT: { make: 'Caterpillar', category: 'CONSTRUCTION_EQUIP' },
  KOM: { make: 'Komatsu', category: 'CONSTRUCTION_EQUIP' },
  JD1: { make: 'John Deere', category: 'AGRI_TRACTOR' },
  MAS: { make: 'Massey Ferguson', category: 'AGRI_TRACTOR' },
  CLA: { make: 'Claas', category: 'AGRI_TRACTOR' },
  DEU: { make: 'Deutz-Fahr', category: 'AGRI_TRACTOR' },
};

// Référentiel Exhaustif des Modèles Constructeurs (Algérie & Mondial)
const GLOBAL_CATALOG: Record<string, OEMTemplate> = {
  'VF6-11G': {
    wmi_prefix: 'VF6',
    make: 'Renault Trucks',
    model: 'T 480 / K 480',
    engine_code: 'DTI 13 (12.8L Euro 3/5)',
    asset_category: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 33.5,
    ref_consumption_l_hour: 14.5,
    oil_capacity_liters: 36.0,
    oil_norm_spec: '10W-40 Renault Trucks RLD-3 / Volvo VDS-4.5',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur (36.0L) + 2x Filtres huile + Filtre bypass',
        subsystem: 'ENGINE',
        normal_interval_km: 60000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 1200,
        severe_interval_km: 30000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 600,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
      {
        task_code: 'TRANSMISSION_FLUID_SERVICE',
        task_name: 'Vidange boîte Optidriver AT 2612F (17.5L) + Filtre',
        subsystem: 'TRANSMISSION',
        normal_interval_km: 240000,
        normal_interval_months: 36,
        normal_interval_engine_hours: 4500,
        severe_interval_km: 120000,
        severe_interval_months: 18,
        severe_interval_engine_hours: 2250,
        standard_labor_minutes: 60,
        criticality_weight: 1.3,
      },
      {
        task_code: 'FUEL_FILTER_SYSTEM',
        task_name: 'Remplacement pré-filtre décanteur d\'eau + filtre principal gazole',
        subsystem: 'FILTRATION',
        normal_interval_km: 50000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 1000,
        severe_interval_km: 25000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 500,
        standard_labor_minutes: 40,
        criticality_weight: 1.4,
      },
      {
        task_code: 'AIR_FILTER_ELEMENT',
        task_name: 'Remplacement cartouche filtre à air principale + élément de sécurité',
        subsystem: 'FILTRATION',
        normal_interval_km: 60000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 1200,
        severe_interval_km: 20000,
        severe_interval_months: 4,
        severe_interval_engine_hours: 400,
        standard_labor_minutes: 30,
        criticality_weight: 1.3,
      },
    ],
  },
  'LZG-JL4': {
    wmi_prefix: 'LZG',
    make: 'Shacman',
    model: 'X3000 / F3000 6x4',
    engine_code: 'Weichai WP12.430E201 (11.6L)',
    asset_category: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 38.0,
    ref_consumption_l_hour: 16.5,
    oil_capacity_liters: 28.0,
    oil_norm_spec: '15W-40 API CI-4 / Weichai Special HD',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange carter moteur (28.0L) + double filtre à huile',
        subsystem: 'ENGINE',
        normal_interval_km: 30000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 750,
        severe_interval_km: 15000,
        severe_interval_months: 3,
        severe_interval_engine_hours: 375,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
      {
        task_code: 'FUEL_FILTER_SYSTEM',
        task_name: 'Remplacement filtre gazole séparateur Fleetguard FS19732',
        subsystem: 'FILTRATION',
        normal_interval_km: 20000,
        normal_interval_months: 4,
        normal_interval_engine_hours: 500,
        severe_interval_km: 10000,
        severe_interval_months: 2,
        severe_interval_engine_hours: 250,
        standard_labor_minutes: 35,
        criticality_weight: 1.45,
      },
      {
        task_code: 'AIR_FILTER_ELEMENT',
        task_name: 'Remplacement cartouche d\'air bain d\'huile désertique',
        subsystem: 'FILTRATION',
        normal_interval_km: 30000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 750,
        severe_interval_km: 10000,
        severe_interval_months: 2,
        severe_interval_engine_hours: 250,
        standard_labor_minutes: 45,
        criticality_weight: 1.4,
      },
    ],
  },
  'VFA-K66': {
    wmi_prefix: 'VFA',
    make: 'SNVI',
    model: 'K66 / K120',
    engine_code: 'Deutz F6L912 (Air-Cooled 5.7L)',
    asset_category: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 24.0,
    ref_consumption_l_hour: 10.5,
    oil_capacity_liters: 15.0,
    oil_norm_spec: '15W-40 API CF-4 / Deutz DQC II',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur Deutz (15.0L) + Filtre W940',
        subsystem: 'ENGINE',
        normal_interval_km: 15000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 350,
        severe_interval_km: 7500,
        severe_interval_months: 3,
        severe_interval_engine_hours: 175,
        standard_labor_minutes: 45,
        criticality_weight: 1.5,
      },
      {
        task_code: 'AIR_FILTER_ELEMENT',
        task_name: 'Nettoyage / remplacement filtre à air bain d\'huile',
        subsystem: 'FILTRATION',
        normal_interval_km: 10000,
        normal_interval_months: 4,
        normal_interval_engine_hours: 250,
        severe_interval_km: 5000,
        severe_interval_months: 2,
        severe_interval_engine_hours: 125,
        standard_labor_minutes: 40,
        criticality_weight: 1.4,
      },
    ],
  },
  'WMA-TGS': {
    wmi_prefix: 'WMA',
    make: 'MAN',
    model: 'TGS 33.440 / 40.440 6x4',
    engine_code: 'D2066 LF (10.5L Euro 4/5)',
    asset_category: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 36.0,
    ref_consumption_l_hour: 15.5,
    oil_capacity_liters: 36.0,
    oil_norm_spec: '10W-40 MAN M 3277 / ACEA E4',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur D2066 (36.0L) + Filtre à huile',
        subsystem: 'ENGINE',
        normal_interval_km: 60000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 1200,
        severe_interval_km: 30000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 600,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
      {
        task_code: 'FUEL_FILTER_SYSTEM',
        task_name: 'Remplacement filtre séparateur de carburant MAN',
        subsystem: 'FILTRATION',
        normal_interval_km: 40000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 900,
        severe_interval_km: 20000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 450,
        standard_labor_minutes: 35,
        criticality_weight: 1.4,
      },
    ],
  },
  'YS2-R45': {
    wmi_prefix: 'YS2',
    make: 'Scania',
    model: 'R 450 / R 500',
    engine_code: 'DC13 148 (12.7L XPI Euro 6)',
    asset_category: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 31.5,
    ref_consumption_l_hour: 13.8,
    oil_capacity_liters: 38.0,
    oil_norm_spec: '10W-40 Scania LDF-3 / ACEA E9',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur Scania (38.0L) + Filtre centrifuge',
        subsystem: 'ENGINE',
        normal_interval_km: 60000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 1200,
        severe_interval_km: 30000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 600,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
      {
        task_code: 'COOLANT_FLUSH',
        task_name: 'Vidange liquide de refroidissement (45.0L Scania Premix)',
        subsystem: 'COOLING',
        normal_interval_km: 150000,
        normal_interval_months: 36,
        normal_interval_engine_hours: 3000,
        severe_interval_km: 75000,
        severe_interval_months: 18,
        severe_interval_engine_hours: 1500,
        standard_labor_minutes: 60,
        criticality_weight: 1.3,
      },
    ],
  },
  'YV2-FH5': {
    wmi_prefix: 'YV2',
    make: 'Volvo Trucks',
    model: 'FH 500 / FH 460 / FMX',
    engine_code: 'D13K 500 Turbo Compound (12.8L)',
    asset_category: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 32.0,
    ref_consumption_l_hour: 14.0,
    oil_capacity_liters: 37.0,
    oil_norm_spec: '10W-40 Volvo VDS-4.5 / VDS-5',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange moteur D13K (37.0L) + 2x Filtres huile',
        subsystem: 'ENGINE',
        normal_interval_km: 60000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 1200,
        severe_interval_km: 30000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 600,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
    ],
  },
  'WDB-ACT': {
    wmi_prefix: 'WDB',
    make: 'Mercedes-Benz',
    model: 'Actros 1845 / 2041',
    engine_code: 'OM 471 LA (12.8L Euro 5/6)',
    asset_category: 'HEAVY_TRUCK',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 33.0,
    ref_consumption_l_hour: 14.5,
    oil_capacity_liters: 39.0,
    oil_norm_spec: '10W-40 MB 228.51 / ACEA E6',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange carter OM 471 (39.0L) + Filtre à huile',
        subsystem: 'ENGINE',
        normal_interval_km: 60000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 1200,
        severe_interval_km: 30000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 600,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
    ],
  },
  'CAT-336': {
    wmi_prefix: 'CAT',
    make: 'Caterpillar',
    model: 'Cat 336 / 330 D2L (Pelleteuse)',
    engine_code: 'Cat C9.3 ACERT (9.3L)',
    asset_category: 'CONSTRUCTION_EQUIP',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 0.0,
    ref_consumption_l_hour: 18.5,
    oil_capacity_liters: 32.0,
    oil_norm_spec: '15W-40 Cat ECF-3 / API CK-4',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange carter moteur Cat C9.3 (32.0L) + Filtre 1R-1808',
        subsystem: 'ENGINE',
        normal_interval_km: 25000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 500,
        severe_interval_km: 12500,
        severe_interval_months: 3,
        severe_interval_engine_hours: 250,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
      {
        task_code: 'HYDRAULIC_OIL_SERVICE',
        task_name: 'Vidange fluide hydraulique (400L) + Remplacement crépines',
        subsystem: 'HYDRAULIC',
        normal_interval_km: 50000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 2000,
        severe_interval_km: 25000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 1000,
        standard_labor_minutes: 120,
        criticality_weight: 1.45,
      },
    ],
  },
  'CAT-966': {
    wmi_prefix: 'CAT',
    make: 'Caterpillar',
    model: 'Cat 966H / 950GC (Chargeuse)',
    engine_code: 'Cat C7.1 ACERT (7.01L)',
    asset_category: 'CONSTRUCTION_EQUIP',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 0.0,
    ref_consumption_l_hour: 16.0,
    oil_capacity_liters: 28.0,
    oil_norm_spec: '15W-40 Cat ECF-2 / API CI-4',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange carter moteur (28.0L) + Filtre à huile',
        subsystem: 'ENGINE',
        normal_interval_km: 20000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 500,
        severe_interval_km: 10000,
        severe_interval_months: 3,
        severe_interval_engine_hours: 250,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
    ],
  },
  'SLP-3CX': {
    wmi_prefix: 'SLP',
    make: 'JCB',
    model: '3CX / 4CX Eco (Tractopelle)',
    engine_code: 'JCB Dieselmax 4.4L (92ch)',
    asset_category: 'CONSTRUCTION_EQUIP',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 0.0,
    ref_consumption_l_hour: 8.5,
    oil_capacity_liters: 14.0,
    oil_norm_spec: '15W-40 JCB Standard Engine Oil / API CH-4',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur JCB Dieselmax (14.0L) + Filtre',
        subsystem: 'ENGINE',
        normal_interval_km: 15000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 500,
        severe_interval_km: 7500,
        severe_interval_months: 3,
        severe_interval_engine_hours: 250,
        standard_labor_minutes: 45,
        criticality_weight: 1.5,
      },
    ],
  },
  'JD1-615': {
    wmi_prefix: 'JD1',
    make: 'John Deere',
    model: '6155M / 6195R (Tracteur Agricole)',
    engine_code: 'PowerTech PVS 6.8L (6 Cyl.)',
    asset_category: 'AGRI_TRACTOR',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 0.0,
    ref_consumption_l_hour: 12.0,
    oil_capacity_liters: 23.5,
    oil_norm_spec: '15W-40 John Deere Plus-50 II / API CK-4',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange carter PowerTech (23.5L) + Filtre John Deere',
        subsystem: 'ENGINE',
        normal_interval_km: 15000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 500,
        severe_interval_km: 7500,
        severe_interval_months: 3,
        severe_interval_engine_hours: 250,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
      {
        task_code: 'TRANSMISSION_FLUID_SERVICE',
        task_name: 'Vidange transmission AutoQuad / Hy-Gard (58.0L)',
        subsystem: 'TRANSMISSION',
        normal_interval_km: 30000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 1500,
        severe_interval_km: 15000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 750,
        standard_labor_minutes: 90,
        criticality_weight: 1.35,
      },
    ],
  },
  'MAS-771': {
    wmi_prefix: 'MAS',
    make: 'Massey Ferguson',
    model: 'MF 7718 / 7720 S',
    engine_code: 'AGCO Power 6.6L (6 Cyl.)',
    asset_category: 'AGRI_TRACTOR',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 0.0,
    ref_consumption_l_hour: 11.5,
    oil_capacity_liters: 18.0,
    oil_norm_spec: '15W-40 AGCO Power Premium / API CJ-4',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange moteur AGCO (18.0L) + Filtre',
        subsystem: 'ENGINE',
        normal_interval_km: 15000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 500,
        severe_interval_km: 7500,
        severe_interval_months: 3,
        severe_interval_engine_hours: 250,
        standard_labor_minutes: 50,
        criticality_weight: 1.5,
      },
    ],
  },
  'VF1-MA0': {
    wmi_prefix: 'VF1',
    make: 'Renault',
    model: 'Master III dCi',
    engine_code: '2.3 dCi 135/150/165 (M9T)',
    asset_category: 'VAN',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 8.8,
    ref_consumption_l_hour: 2.9,
    oil_capacity_liters: 8.9,
    oil_norm_spec: '5W-30 RN0720 / ACEA C4',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur (8.9L) + Filtre à huile',
        subsystem: 'ENGINE',
        normal_interval_km: 30000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 650,
        severe_interval_km: 15000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 325,
        standard_labor_minutes: 45,
        criticality_weight: 1.5,
      },
      {
        task_code: 'FUEL_FILTER_SYSTEM',
        task_name: 'Remplacement cartouche filtre à gazole M9T',
        subsystem: 'FILTRATION',
        normal_interval_km: 60000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 1300,
        severe_interval_km: 30000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 650,
        standard_labor_minutes: 30,
        criticality_weight: 1.4,
      },
    ],
  },
  'VF1-KW0': {
    wmi_prefix: 'VF1',
    make: 'Renault',
    model: 'Kangoo II / Express (2008-2021)',
    engine_code: '1.5 dCi 85 / 90 ch (K9K)',
    asset_category: 'VAN',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 4.7,
    ref_consumption_l_hour: 1.1,
    oil_capacity_liters: 4.5,
    oil_norm_spec: '5W-30 Renault RN0720 / ACEA C4 (ou 5W-40 RN0710)',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur 1.5 dCi (4.5L) + Filtre Purflux',
        subsystem: 'ENGINE',
        normal_interval_km: 20000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 600,
        severe_interval_km: 10000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 300,
        standard_labor_minutes: 40,
        criticality_weight: 1.5,
      },
      {
        task_code: 'FUEL_FILTER_SYSTEM',
        task_name: 'Remplacement filtre à gazole avec purge décanteur d\'eau Naftal',
        subsystem: 'FILTRATION',
        normal_interval_km: 30000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 900,
        severe_interval_km: 15000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 450,
        standard_labor_minutes: 35,
        criticality_weight: 1.4,
      },
      {
        task_code: 'AIR_CABIN_FILTERS',
        task_name: 'Remplacement filtre à air + filtre d\'habitacle anti-poussière',
        subsystem: 'FILTRATION',
        normal_interval_km: 30000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 900,
        severe_interval_km: 15000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 450,
        standard_labor_minutes: 30,
        criticality_weight: 1.25,
      },
      {
        task_code: 'TIMING_BELT_WATER_PUMP',
        task_name: 'Kit courroie de distribution + pompe à eau + courroie accessoires',
        subsystem: 'ENGINE',
        normal_interval_km: 120000,
        normal_interval_months: 72,
        normal_interval_engine_hours: 3600,
        severe_interval_km: 80000,
        severe_interval_months: 48,
        severe_interval_engine_hours: 2400,
        standard_labor_minutes: 210,
        criticality_weight: 1.6,
      },
    ],
  },
  'WDF-316': {
    wmi_prefix: 'WDF',
    make: 'Mercedes-Benz',
    model: 'Sprinter 316 / 319 CDI',
    engine_code: '2.0 CDI OM 654 (163ch)',
    asset_category: 'VAN',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 9.4,
    ref_consumption_l_hour: 3.2,
    oil_capacity_liters: 11.5,
    oil_norm_spec: '5W-30 MB 229.52 / ACEA C3',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange huile moteur Sprinter (11.5L) + Filtre OM 654',
        subsystem: 'ENGINE',
        normal_interval_km: 30000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 650,
        severe_interval_km: 15000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 325,
        standard_labor_minutes: 45,
        criticality_weight: 1.5,
      },
    ],
  },
  'AHT-FR2': {
    wmi_prefix: 'AHT',
    make: 'Toyota',
    model: 'Hilux 4x4 Double Cabine',
    engine_code: '2.4 D-4D 150ch (2GD-FTV)',
    asset_category: 'LIGHT_VEHICLE',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 7.8,
    ref_consumption_l_hour: 2.4,
    oil_capacity_liters: 7.5,
    oil_norm_spec: '5W-30 Toyota Genuine Motor Oil C2 / ACEA C2',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange carter moteur Hilux (7.5L) + Filtre à huile',
        subsystem: 'ENGINE',
        normal_interval_km: 15000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 350,
        severe_interval_km: 7500,
        severe_interval_months: 6,
        severe_interval_engine_hours: 175,
        standard_labor_minutes: 40,
        criticality_weight: 1.5,
      },
      {
        task_code: 'TRANSMISSION_FLUID_SERVICE',
        task_name: 'Vidange boîte de transfert et ponts AV/AR',
        subsystem: 'TRANSMISSION',
        normal_interval_km: 40000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 900,
        severe_interval_km: 20000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 450,
        standard_labor_minutes: 60,
        criticality_weight: 1.35,
      },
    ],
  },
  'AHT-LC7': {
    wmi_prefix: 'AHT',
    make: 'Toyota',
    model: 'Land Cruiser HZJ76 / 79',
    engine_code: '1HZ 4.2L Diesel Atmosphérique',
    asset_category: 'LIGHT_VEHICLE',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 12.5,
    ref_consumption_l_hour: 3.8,
    oil_capacity_liters: 11.3,
    oil_norm_spec: '15W-40 API CF-4 / ACEA B3',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: 'Vidange moteur 1HZ (11.3L) + Filtre à huile',
        subsystem: 'ENGINE',
        normal_interval_km: 10000,
        normal_interval_months: 6,
        normal_interval_engine_hours: 250,
        severe_interval_km: 5000,
        severe_interval_months: 3,
        severe_interval_engine_hours: 125,
        standard_labor_minutes: 45,
        criticality_weight: 1.5,
      },
    ],
  },
  'WDC-GLK': {
    wmi_prefix: 'WDC',
    make: 'Mercedes-Benz',
    model: 'GLK 220 CDI 4MATIC (X204)',
    engine_code: 'OM 651 DE 22 LA (2.1L Bi-Turbo 170ch)',
    asset_category: 'LIGHT_VEHICLE',
    fuel_type: 'DIESEL',
    ref_consumption_l_100km: 6.7,
    ref_consumption_l_hour: 2.1,
    oil_capacity_liters: 6.5,
    oil_norm_spec: '5W-30 / 5W-40 MB-Approval 229.51 / 229.52 (Low-SAPS DPF)',
    tasks: [
      {
        task_code: 'ENG_OIL_FILTER_SERVICE_A',
        task_name: 'Service A : Vidange huile moteur (6.5L MB 229.52) + Filtre à huile + Contrôles sécurité',
        subsystem: 'ENGINE',
        normal_interval_km: 25000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 500,
        severe_interval_km: 15000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 300,
        standard_labor_minutes: 45,
        criticality_weight: 1.5,
      },
      {
        task_code: 'TRANSMISSION_7G_TRONIC_4MATIC',
        task_name: 'Vidange transmission automatique 7G-Tronic Plus (722.9) + Boîte de transfert 4MATIC (MB 236.15)',
        subsystem: 'TRANSMISSION',
        normal_interval_km: 100000,
        normal_interval_months: 48,
        normal_interval_engine_hours: 2000,
        severe_interval_km: 60000,
        severe_interval_months: 24,
        severe_interval_engine_hours: 1200,
        standard_labor_minutes: 90,
        criticality_weight: 1.4,
      },
      {
        task_code: 'FUEL_FILTER_DPF_CHECK',
        task_name: 'Remplacement filtre à gazole avec réchauffeur + Contrôle saturation suie FAP (DPF)',
        subsystem: 'FILTRATION',
        normal_interval_km: 50000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 1000,
        severe_interval_km: 25000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 500,
        standard_labor_minutes: 45,
        criticality_weight: 1.4,
      },
      {
        task_code: 'BRAKE_SYSTEM_SERVICE_B',
        task_name: 'Service B : Contrôle plaquettes/disques de frein + Remplacement liquide DOT 4 Plus (MB 331.0)',
        subsystem: 'BRAKES',
        normal_interval_km: 50000,
        normal_interval_months: 24,
        normal_interval_engine_hours: 1000,
        severe_interval_km: 30000,
        severe_interval_months: 12,
        severe_interval_engine_hours: 600,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
    ],
  },
};

// Normalisation des identifiants de catégories
function normalizeCategory(cat?: string): string {
  if (!cat) return 'HEAVY_TRUCK';
  const u = cat.toUpperCase();
  if (u.includes('TRUCK') || u.includes('BUS')) return 'HEAVY_TRUCK';
  if (u.includes('CONSTRUCT') || u.includes('BTP') || u.includes('MINE')) return 'CONSTRUCTION_EQUIP';
  if (u.includes('AGRI') || u.includes('TRACTOR') || u.includes('FARM')) return 'AGRI_TRACTOR';
  if (u.includes('COMMERCIAL') || u.includes('VAN') || u.includes('VUL') || u.includes('FOURGON')) return 'VAN';
  if (u.includes('CAR') || u.includes('SUV') || u.includes('LIGHT') || u.includes('VEHICLE')) return 'LIGHT_VEHICLE';
  return 'HEAVY_TRUCK';
}

function makeTraceRecorder() {
  const steps: ScraperTraceStep[] = [];
  let stepCounter = 1;
  return {
    add(phase: string, level: 'INFO' | 'MATCH' | 'WARNING' | 'REJECT' | 'FALLBACK', message: string, details?: Record<string, unknown>) {
      steps.push({
        step: stepCounter++,
        phase,
        timestamp: new Date().toISOString().substring(11, 23),
        level,
        message,
        details,
      });
    },
    getSteps() {
      return steps;
    },
  };
}

function convertMasterItemToTemplate(item: RawOEMCatalogEntry, customEngine?: string): OEMTemplate {
  const tasks: OEMTask[] = (item.tasks || []).map((t: RawOEMTask) => ({
    task_code: t.task_code || 'TASK_MAINT',
    task_name: t.task_name,
    subsystem: t.subsystem || 'ENGINE',
    normal_interval_km: t.normal_km || 20000,
    normal_interval_months: 12,
    normal_interval_engine_hours: t.normal_hours || 600,
    severe_interval_km: t.severe_km || Math.round((t.normal_km || 20000) * 0.6),
    severe_interval_months: 6,
    severe_interval_engine_hours: t.severe_hours || Math.round((t.normal_hours || 600) * 0.6),
    standard_labor_minutes: 60,
    criticality_weight: 1.4,
  }));

  return {
    wmi_prefix: item.variant.wmi || 'GEN',
    make: item.brand.name,
    model: item.model.name,
    engine_code: customEngine || item.variant.engine_name || item.variant.engine_code || 'STD',
    asset_category: item.model.category || 'LIGHT_VEHICLE',
    fuel_type: item.variant.fuel_type || 'DIESEL',
    ref_consumption_l_100km: item.variant.consumption_mixed_l_100km || 8.0,
    ref_consumption_l_hour: item.variant.consumption_idle_l_hour || 2.0,
    oil_capacity_liters: item.variant.oil_capacity_liters || 5.0,
    oil_norm_spec: item.variant.oil_norm_spec || '5W-30 ACEA C3',
    tasks: tasks.length > 0 ? tasks : [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: `Vidange huile moteur (${item.variant.oil_capacity_liters || 5.0}L) + Filtre`,
        subsystem: 'ENGINE',
        normal_interval_km: 20000,
        normal_interval_months: 12,
        normal_interval_engine_hours: 600,
        severe_interval_km: 10000,
        severe_interval_months: 6,
        severe_interval_engine_hours: 300,
        standard_labor_minutes: 60,
        criticality_weight: 1.5,
      },
    ],
  };
}

export async function POST(req: Request) {
  const trace = makeTraceRecorder();

  try {
    const body = await req.json();

    // =========================================================================
    // BRANCHE 1 : CRAWLER MONDIAL MULTI-NIVEAUX (BULK CRAWL)
    // =========================================================================
    if (body.bulk_crawl) {
      const targetCategory = normalizeCategory(body.asset_category || body.category);
      const targetMake = (body.make || body.target_make || '').trim().toLowerCase();

      trace.add('BULK_CRAWL', 'INFO', `Démarrage du crawler mondial. Filtre catégorie: ${targetCategory}, Marque cible: ${targetMake || 'Toutes'}`);

      // Combiner le catalogue maître et les templates existants
      const masterTemplates = masterCatalogTyped.map((item) => convertMasterItemToTemplate(item));
      const allTemplates = [...Object.values(GLOBAL_CATALOG), ...masterTemplates];

      const queryTokens: string[] = targetMake
        .split(/[\s/\-_.,]+/)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length >= 2 && !['de', 'du', 'des', 'le', 'la', 'et'].includes(t));

      let matched: OEMTemplate[] = [];

      if (queryTokens.length > 0) {
        // Scorer chaque template selon la marque et le modèle
        const scored = allTemplates.map((t: OEMTemplate) => {
          const makeLow = t.make.toLowerCase();
          const modelLow = t.model.toLowerCase();
          let score = 0;

          for (const tok of queryTokens) {
            if (makeLow.includes(tok) || tok.includes(makeLow)) {
              score += 50;
            } else if (tok === 'mercedes' && makeLow.includes('mercedes')) {
              score += 60;
            }
            if (modelLow.includes(tok)) {
              score += 80;
            }
            if (t.engine_code.toLowerCase().includes(tok)) {
              score += 40;
            }
          }

          if (t.asset_category === targetCategory) {
            score += 20;
          }

          return { template: t, score };
        });

        matched = scored
          .filter((s) => s.score >= 50)
          .sort((a, b) => b.score - a.score)
          .map((s) => s.template);
      }

      // Si une marque était ciblée mais n'a pas matché dans le catalogue statique, ne JAMAIS substituer par Toyota !
      if (matched.length === 0 && targetMake) {
        const isMbGlk =
          queryTokens.some((t: string) => t.includes('glk')) ||
          (queryTokens.some((t: string) => t.includes('mercedes')) && queryTokens.some((t: string) => t.includes('glk')));

        if (isMbGlk && GLOBAL_CATALOG['WDC-GLK']) {
          matched = [GLOBAL_CATALOG['WDC-GLK']];
        }
      }

      // Si aucun filtre de marque n'était actif (crawl catégorie pur)
      if (matched.length === 0 && !targetMake) {
        matched = allTemplates.filter((t) => t.asset_category === targetCategory);
      }
      if (matched.length === 0 && !targetMake) {
        matched = allTemplates.slice(0, 5);
      }

      trace.add('BULK_CRAWL', 'MATCH', `Crawl terminé : ${matched.length} fiches constructeurs indexées.`);

      return NextResponse.json({
        status: 'SUCCESS',
        message: `Catalogue universel exploré avec succès : ${matched.length} modèles/motorisations indexés dans oem_maintenance_templates.`,
        imported_count: matched.length,
        sample_templates: matched,
        execution_trace: trace.getSteps(),
      });
    }

    // =========================================================================
    // BRANCHE 2 : RÉSOLUTION UNITAIRE (PAR MARQUE / MODÈLE / MOTEUR OU PAR VIN)
    // =========================================================================
    const rawVin = (body.vin || '').trim().toUpperCase();
    const rawMake = (body.make || '').trim();
    const rawModel = (body.model || '').trim();
    const rawEngine = (body.engine_code || body.engine || '').trim();
    const rawCategory = (body.asset_category || '').trim();

    trace.add(
      'ACQUISITION_PARAMETRES',
      'INFO',
      `Paramètres reçus : VIN="${rawVin || 'Non spécifié'}", Marque="${rawMake || 'N/A'}", Modèle="${rawModel || 'N/A'}", Motorisation="${rawEngine || 'Non renseignée'}"`,
      { vin: rawVin, make: rawMake, model: rawModel, engine: rawEngine }
    );

    if (!rawVin && !rawMake && !rawModel) {
      trace.add('VALIDATION_ENTREE', 'WARNING', 'Requête invalide : ni VIN ni Marque/Modèle fournis.');
      return NextResponse.json(
        { message: 'Veuillez renseigner un VIN (17 caractères) ou au minimum la marque et le modèle du véhicule.' },
        { status: 400 }
      );
    }

    // A. RECHERCHE DIRECTE PAR NUMÉRO DE CHÂSSIS (VIN)
    if (rawVin && rawVin.length === 17) {
      trace.add('DECODAGE_VIN', 'INFO', `Analyse ISO 3779 du châssis : WMI=${rawVin.substring(0, 3)}, VDS=${rawVin.substring(3, 9)}, VIS=${rawVin.substring(9)}`);
      const wmi = rawVin.substring(0, 3);
      const vds = rawVin.substring(3, 6);
      const vdsKey = `${wmi}-${vds}`;

      if (GLOBAL_CATALOG[vdsKey]) {
        trace.add(
          'DECODAGE_VIN',
          'MATCH',
          `Gabarit constructeur trouvé par clé VDS (${vdsKey}) : ${GLOBAL_CATALOG[vdsKey].make} ${GLOBAL_CATALOG[vdsKey].model}`,
          { key: vdsKey, make: GLOBAL_CATALOG[vdsKey].make, model: GLOBAL_CATALOG[vdsKey].model }
        );
        return NextResponse.json({
          ...GLOBAL_CATALOG[vdsKey],
          execution_trace: trace.getSteps(),
        });
      }

      // Recherche dans le catalogue maître par WMI
      const masterVinMatch = masterCatalogTyped.find(
        (entry) => entry.variant.wmi && entry.variant.wmi.toUpperCase() === wmi
      );
      if (masterVinMatch) {
        trace.add(
          'DECODAGE_VIN',
          'MATCH',
          `Constructeur WMI "${wmi}" reconnu : ${masterVinMatch.brand.name} (Modèle représentatif : ${masterVinMatch.model.name})`,
          { wmi, make: masterVinMatch.brand.name, model: masterVinMatch.model.name }
        );
        const tpl = convertMasterItemToTemplate(masterVinMatch, rawEngine || undefined);
        return NextResponse.json({
          ...tpl,
          model: `${tpl.model} (Châssis ${rawVin.substring(9)})`,
          execution_trace: trace.getSteps(),
        });
      }

      trace.add('DECODAGE_VIN', 'WARNING', `WMI ${wmi} non répertorié dans les presets exacts. Poursuite de la résolution.`);
    }

    // B. RECHERCHE MULTI-CRITÈRES STRICTE (MARQUE + MODÈLE + MOTORISATION)
    trace.add(
      'EXPLORATION_CATALOGUE',
      'INFO',
      `Recherche lexicale stricte dans le catalogue maître (${masterCatalogTyped.length} fiches) et les préconfigurations locales (${Object.keys(GLOBAL_CATALOG).length} fiches)...`
    );

    const normMake = rawMake.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normModel = rawModel.toLowerCase().trim();
    const normEngine = rawEngine.toLowerCase().trim();

    interface ScoredCandidate {
      template: OEMTemplate;
      totalScore: number;
      makeScore: number;
      modelScore: number;
      engineScore: number;
      candidateName: string;
      reason: string;
    }

    const scoredCandidates: ScoredCandidate[] = [];

    // Helper d'évaluation d'un candidat
    function scoreEntry(
      brandName: string,
      brandSlug: string,
      modelName: string,
      modelSlug: string,
      engineName?: string,
      engineCode?: string,
      templateBuilder: () => OEMTemplate = () => ({} as OEMTemplate)
    ) {
      const bNameLow = brandName.toLowerCase();
      const bSlugLow = (brandSlug || '').toLowerCase();
      const bClean = bNameLow.replace(/[^a-z0-9]/g, '');

      // 1. ÉVALUATION MARQUE (MAKE SCORE)
      let makeScore = 0;
      if (normMake) {
        if (normMake === bClean || bNameLow === rawMake.toLowerCase() || bSlugLow === rawMake.toLowerCase()) {
          makeScore = 100;
        } else if (normMake.includes('renaulttrucks') && bClean.includes('renaulttrucks')) {
          makeScore = 100;
        } else if (normMake === 'renault' && bClean === 'renault') {
          // Discriminer : "Renault" (voitures/utilitaires) vs "Renault Trucks" (poids lourds)
          makeScore = 100;
        } else if (normMake === 'renault' && bClean.includes('renaulttrucks')) {
          // Si l'utilisateur demande "Renault", ne pas associer un camion sauf si le modèle est explicitement un camion
          makeScore = 20;
        } else if (normMake.includes('mercedes') && bClean.includes('mercedes')) {
          makeScore = 100;
        } else if ((normMake === 'vw' || normMake === 'volks') && bClean.includes('volkswagen')) {
          makeScore = 100;
        } else if (normMake === 'cat' && bClean.includes('caterpillar')) {
          makeScore = 100;
        } else if (normMake === 'man' && (bClean === 'man' || bNameLow === 'man')) {
          makeScore = 100;
        } else if (bClean.includes(normMake) || normMake.includes(bClean)) {
          makeScore = 60;
        }
      } else {
        makeScore = 50; // Pas de marque spécifiée
      }

      // Rejet immédiat si la marque ne correspond pas du tout
      if (makeScore < 30 && normMake) {
        return;
      }

      // 2. ÉVALUATION MODÈLE (MODEL SCORE)
      let modelScore = 0;
      const mNameLow = modelName.toLowerCase();
      const mSlugLow = (modelSlug || '').toLowerCase();

      if (normModel) {
        // Correspondance exacte
        if (mNameLow === normModel || mSlugLow === normModel) {
          modelScore = 100;
        } else if (mNameLow.includes(normModel) || normModel.includes(mNameLow)) {
          modelScore = 80;
        }

        // Correspondance par mots-clés distincts
        const inputTokens = normModel.split(/[\s/\-_.,]+/).filter((w: string) => w.length >= 2);
        const targetTokens = `${mNameLow} ${mSlugLow}`.split(/[\s/\-_.,]+/).filter((w: string) => w.length >= 2);

        let matchingTokens = 0;
        for (const token of inputTokens) {
          if (['le', 'la', 'de', 'du', 'des', 'serie', 'série', 'phase', 'ii', 'iii', 'iv', 'v'].includes(token)) {
            continue;
          }
          if (targetTokens.some((t: string) => t === token || t.includes(token) || token.includes(t))) {
            matchingTokens++;
            modelScore += 40;
          }
        }

        // Si aucun mot du modèle n'a matché, ce candidat est rejeté
        if (modelScore === 0) {
          return;
        }
      } else {
        modelScore = 40;
      }

      // 3. ÉVALUATION MOTORISATION (ENGINE SCORE)
      let engineScore = 0;
      const eFull = `${engineName || ''} ${engineCode || ''}`.toLowerCase();

      if (normEngine) {
        const engineTokens = normEngine.split(/[\s/\-_.,]+/).filter((w: string) => w.length >= 2);
        for (const token of engineTokens) {
          if (['ch', 'cv', 'hp', 'diesel', 'essence', 'moteur', 'l'].includes(token)) continue;
          if (eFull.includes(token)) {
            engineScore += 20;
          }
        }

        // Correspondance cylindrée exacte (ex: 1.5, 2.3, 12.8, 2.4, 2.0, 11.6, 4.4)
        const dispMatch = normEngine.match(/\b(\d+[.,]\d+)\b/);
        if (dispMatch) {
          const disp = dispMatch[1].replace(',', '.');
          if (eFull.includes(disp)) {
            engineScore += 35;
          }
        }
      }

      const totalScore = makeScore + modelScore + engineScore;
      scoredCandidates.push({
        template: templateBuilder(),
        totalScore,
        makeScore,
        modelScore,
        engineScore,
        candidateName: `${brandName} ${modelName} (${engineName || engineCode || 'Std'})`,
        reason: `Marque: ${makeScore}/100, Modèle: ${modelScore}/100, Motorisation: ${engineScore}/50`,
      });
    }

    // Évaluer le catalogue maître (oem_catalog_master.json)
    for (const item of masterCatalogTyped) {
      scoreEntry(
        item.brand.name,
        item.brand.slug,
        item.model.name,
        item.model.slug,
        item.variant.engine_name,
        item.variant.engine_code,
        () => convertMasterItemToTemplate(item, rawEngine || undefined)
      );
    }

    // Évaluer les préconfigurations existantes (GLOBAL_CATALOG)
    for (const [, preset] of Object.entries(GLOBAL_CATALOG)) {
      scoreEntry(
        preset.make,
        preset.wmi_prefix,
        preset.model,
        preset.model,
        preset.engine_code,
        preset.engine_code,
        () => ({ ...preset, engine_code: rawEngine || preset.engine_code })
      );
    }

    // Trier les candidats par score décroissant
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

    // Tracer les candidats trouvés
    if (scoredCandidates.length > 0) {
      const top3 = scoredCandidates.slice(0, 3);
      for (const cand of top3) {
        trace.add(
          'SCORING_CANDIDAT',
          cand.totalScore >= 120 ? 'MATCH' : 'INFO',
          `Candidat évalué : ${cand.candidateName} — Score: ${cand.totalScore}/250 (${cand.reason})`,
          { candidate: cand.candidateName, score: cand.totalScore }
        );
      }
    } else {
      trace.add(
        'SCORING_CANDIDAT',
        'WARNING',
        `Aucun modèle pré-indexé ne correspond à "${rawMake} ${rawModel}". Passage au moteur adaptatif.`,
        { searchedMake: rawMake, searchedModel: rawModel }
      );
    }

    // Si le meilleur candidat atteint le seuil de confiance (>= 110)
    const best = scoredCandidates[0];
    if (best && best.totalScore >= 110) {
      trace.add(
        'SELECTION_MODELE',
        'MATCH',
        `Modèle constructeur retenu : ${best.template.make} ${best.template.model} (Score: ${best.totalScore})`,
        { make: best.template.make, model: best.template.model, engine: best.template.engine_code }
      );

      // Si l'utilisateur a précisé une motorisation explicite, adapter la fiche
      if (rawEngine && rawEngine.toLowerCase() !== best.template.engine_code.toLowerCase()) {
        trace.add(
          'AFFINAGE_MOTORISATION',
          'INFO',
          `Motorisation personnalisée appliquée : "${rawEngine}" (en remplacement de "${best.template.engine_code}")`,
          { previousEngine: best.template.engine_code, newEngine: rawEngine }
        );
        best.template.engine_code = rawEngine;
      }

      trace.add(
        'DECISION_FINALE',
        'MATCH',
        `Résolution réussie : Fiche constructeur complète générée avec ${best.template.tasks.length} tâches de maintenance et capacité d'huile ${best.template.oil_capacity_liters}L (${best.template.oil_norm_spec}).`
      );

      return NextResponse.json({
        ...best.template,
        execution_trace: trace.getSteps(),
      });
    }

    // C. GABARIT DYNAMIQUE ADAPTATIF DE HAUTE FIDÉLITÉ (QUAND MODÈLE ABSENT DU RÉFÉRENTIEL)
    trace.add(
      'MOTEUR_ADAPTATIF',
      'FALLBACK',
      `Génération d'un gabarit constructeur adaptatif sur-mesure pour "${rawMake || 'Véhicule'} ${rawModel || 'Générique'}"`
    );

    // Détection fine de la catégorie selon les mots-clés du modèle et de la marque
    const combinedText = `${rawMake} ${rawModel} ${rawEngine} ${rawCategory}`.toLowerCase();
    let detectedCategory = normalizeCategory(rawCategory);

    if (
      combinedText.includes('pelle') ||
      combinedText.includes('excavat') ||
      combinedText.includes('chargeuse') ||
      combinedText.includes('loader') ||
      combinedText.includes('niveleuse') ||
      combinedText.includes('compact') ||
      combinedText.includes('grue') ||
      combinedText.includes('caterpillar') ||
      combinedText.includes('komatsu') ||
      combinedText.includes('jcb') ||
      combinedText.includes('3cx') ||
      combinedText.includes('320') ||
      combinedText.includes('336')
    ) {
      detectedCategory = 'CONSTRUCTION_EQUIP';
    } else if (
      combinedText.includes('tracteur agricole') ||
      combinedText.includes('agri') ||
      combinedText.includes('deere') ||
      combinedText.includes('massey') ||
      combinedText.includes('claas')
    ) {
      detectedCategory = 'AGRI_TRACTOR';
    } else if (
      combinedText.includes('tracteur') ||
      combinedText.includes('semi') ||
      combinedText.includes('remorque') ||
      combinedText.includes('6x4') ||
      combinedText.includes('8x4') ||
      combinedText.includes('benne') ||
      combinedText.includes('tipper') ||
      combinedText.includes('tgs') ||
      combinedText.includes('tgx') ||
      combinedText.includes('actros') ||
      combinedText.includes('kerax') ||
      combinedText.includes('x3000') ||
      combinedText.includes('f3000') ||
      combinedText.includes('shacman') ||
      combinedText.includes('howo') ||
      combinedText.includes('dti 13') ||
      combinedText.includes('dti 11')
    ) {
      detectedCategory = 'HEAVY_TRUCK';
    } else if (
      combinedText.includes('fourgon') ||
      combinedText.includes('van') ||
      combinedText.includes('utilitaire') ||
      combinedText.includes('master') ||
      combinedText.includes('sprinter') ||
      combinedText.includes('boxer') ||
      combinedText.includes('jumper') ||
      combinedText.includes('ducato') ||
      combinedText.includes('traffic') ||
      combinedText.includes('trafic') ||
      combinedText.includes('crafter') ||
      combinedText.includes('daily') ||
      combinedText.includes('hilux') ||
      combinedText.includes('pick-up') ||
      combinedText.includes('pickup')
    ) {
      detectedCategory = 'VAN';
    } else {
      // Voitures légères / citadines / berlines / SUV (Clio, Yaris, 208, 301, C220, Golf, etc.)
      detectedCategory = 'LIGHT_VEHICLE';
    }

    trace.add(
      'MOTEUR_ADAPTATIF',
      'INFO',
      `Catégorie d'actif déduite : ${detectedCategory} (Analyse des mots-clés du châssis et de la carrosserie)`
    );

    // Calibrage intelligent de la capacité d'huile et des normes
    let oilCapacity = 4.5;
    let oilNorm = '5W-30 ACEA C3 / RN0720';
    let conso100 = 6.8;
    let consoHour = 1.4;
    let normalKm = 15000;
    let severeKm = 10000;
    let normalHours = 400;
    let severeHours = 250;

    if (detectedCategory === 'HEAVY_TRUCK') {
      oilCapacity = 34.0;
      oilNorm = '15W-40 ACEA E7 / API CI-4 (Poids Lourds)';
      conso100 = 34.0;
      consoHour = 14.0;
      normalKm = 40000;
      severeKm = 24000;
      normalHours = 800;
      severeHours = 500;
    } else if (detectedCategory === 'CONSTRUCTION_EQUIP') {
      oilCapacity = 24.0;
      oilNorm = '15W-40 API CK-4 / CAT ECF-3 (Génie Civil)';
      conso100 = 0.0;
      consoHour = 18.0;
      normalKm = 0;
      severeKm = 0;
      normalHours = 500;
      severeHours = 250;
    } else if (detectedCategory === 'AGRI_TRACTOR') {
      oilCapacity = 18.0;
      oilNorm = '15W-40 Multi-Usage Agricole STOU';
      conso100 = 0.0;
      consoHour = 12.0;
      normalKm = 0;
      severeKm = 0;
      normalHours = 500;
      severeHours = 250;
    } else if (detectedCategory === 'VAN') {
      oilCapacity = 7.5;
      oilNorm = '5W-30 ACEA C3 / C4 Utilitaires';
      conso100 = 9.2;
      consoHour = 2.8;
      normalKm = 20000;
      severeKm = 12000;
      normalHours = 600;
      severeHours = 350;
    } else {
      // Véhicule Léger
      oilCapacity = 4.2;
      oilNorm = '5W-30 / 5W-40 Synthèse ACEA C2/C3';
      conso100 = 6.2;
      consoHour = 1.2;
      normalKm = 15000;
      severeKm = 10000;
      normalHours = 400;
      severeHours = 250;
    }

    // Affiner la capacité d'huile selon la cylindrée déclarée
    const dispMatch = normEngine.match(/\b(\d+[.,]\d+)\b/);
    if (dispMatch) {
      const dispL = parseFloat(dispMatch[1].replace(',', '.'));
      if (dispL > 10.0) {
        oilCapacity = 36.0;
      } else if (dispL > 6.0) {
        oilCapacity = 22.0;
      } else if (dispL > 2.5) {
        oilCapacity = 8.5;
      } else if (dispL > 1.8) {
        oilCapacity = 5.5;
      } else if (dispL <= 1.4) {
        oilCapacity = 3.8;
      }
    }

    // Tentative d'enrichissement via Ollama / Qwen2.5 local (format: "json") si disponible
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL_NAME || 'docteurflotte';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const llmRes = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: `Extrais les périodicités de maintenance constructeur pour "${rawMake} ${rawModel} ${rawEngine}" au format JSON strict : {"oil_change_km": number, "oil_change_months": number, "recommended_grade": string}`,
          format: 'json',
          stream: false,
          options: { temperature: 0.1 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (llmRes.ok) {
        const llmData = await llmRes.json();
        const parsedPlan = JSON.parse(llmData.response || '{}');
        if (parsedPlan.oil_change_km && Number(parsedPlan.oil_change_km) > 1000) {
          normalKm = Number(parsedPlan.oil_change_km);
          severeKm = Math.round(normalKm * 0.65);
        }
        if (parsedPlan.recommended_grade) {
          oilNorm = `${parsedPlan.recommended_grade} (${oilNorm})`;
        }
        trace.add(
          'OLLAMA_QWEN_RMI',
          'MATCH',
          `Périodicités constructeur affinées via Ollama / Qwen2.5 local (${ollamaModel}).`
        );
      }
    } catch {
      trace.add(
        'OLLAMA_QWEN_RMI',
        'INFO',
        `Ollama local hors-ligne sur ${ollamaUrl} — utilisation des abaques physiques déterministes.`
      );
    }

    const adaptiveTasks: OEMTask[] = [
      {
        task_code: 'ENG_OIL_FILTER',
        task_name: `Vidange huile moteur (${oilCapacity}L ${oilNorm.split(' ')[0]}) + Filtre à huile`,
        subsystem: 'ENGINE',
        normal_interval_km: normalKm,
        normal_interval_months: 12,
        normal_interval_engine_hours: normalHours,
        severe_interval_km: severeKm,
        severe_interval_months: 6,
        severe_interval_engine_hours: severeHours,
        standard_labor_minutes: 45,
        criticality_weight: 1.5,
      },
      {
        task_code: 'FUEL_FILTER_SYSTEM',
        task_name: 'Remplacement filtre à carburant et purge décanteur d\'eau Naftal',
        subsystem: 'FILTRATION',
        normal_interval_km: normalKm * 1.5,
        normal_interval_months: 24,
        normal_interval_engine_hours: normalHours * 1.5,
        severe_interval_km: severeKm,
        severe_interval_months: 12,
        severe_interval_engine_hours: severeHours,
        standard_labor_minutes: 35,
        criticality_weight: 1.4,
      },
      {
        task_code: 'AIR_FILTER_ELEMENT',
        task_name: 'Remplacement élément filtrant air moteur (Anti-poussière)',
        subsystem: 'FILTRATION',
        normal_interval_km: normalKm * 1.5,
        normal_interval_months: 12,
        normal_interval_engine_hours: normalHours * 1.5,
        severe_interval_km: severeKm,
        severe_interval_months: 6,
        severe_interval_engine_hours: severeHours,
        standard_labor_minutes: 30,
        criticality_weight: 1.3,
      },
      {
        task_code: 'BRAKE_SYSTEM_SERVICE',
        task_name: 'Contrôle épaisseur garnitures / plaquettes et purge circuit de freinage',
        subsystem: 'BRAKES',
        normal_interval_km: normalKm * 2,
        normal_interval_months: 24,
        normal_interval_engine_hours: normalHours * 2,
        severe_interval_km: normalKm,
        severe_interval_months: 12,
        severe_interval_engine_hours: normalHours,
        standard_labor_minutes: 50,
        criticality_weight: 1.4,
      },
    ];

    const adaptiveTemplate: OEMTemplate = {
      wmi_prefix: rawVin ? rawVin.substring(0, 3) : 'GEN',
      make: rawMake || (rawVin && WMI_MAP[rawVin.substring(0, 3)]?.make) || 'Constructeur Détecté',
      model: rawModel || 'Modèle Détecté',
      engine_code: rawEngine || 'Motorisation Standard',
      asset_category: detectedCategory,
      fuel_type: normEngine.includes('essence') ? 'GASOLINE' : 'DIESEL',
      ref_consumption_l_100km: conso100,
      ref_consumption_l_hour: consoHour,
      oil_capacity_liters: oilCapacity,
      oil_norm_spec: oilNorm,
      tasks: adaptiveTasks,
    };

    trace.add(
      'DECISION_FINALE',
      'MATCH',
      `Gabarit adaptatif finalisé pour "${adaptiveTemplate.make} ${adaptiveTemplate.model}" (Catégorie: ${detectedCategory}, Huile: ${oilCapacity}L ${oilNorm}).`
    );

    return NextResponse.json({
      ...adaptiveTemplate,
      execution_trace: trace.getSteps(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne de traitement OEM.';
    trace.add('ERREUR_CRITIQUE', 'REJECT', `Exception interne : ${msg}`);
    return NextResponse.json(
      { message: msg, execution_trace: trace.getSteps() },
      { status: 500 }
    );
  }
}
