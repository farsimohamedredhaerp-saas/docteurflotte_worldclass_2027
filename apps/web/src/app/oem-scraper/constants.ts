import {
  PresetVin,
  PresetCatalogModel,
  PresetBulkMake,
  CategoryOption,
  SourceInfo,
} from './types';

export const PRESET_VINS: PresetVin[] = [
  {
    label: 'Renault Trucks T480 (DTI 13)',
    vin: 'VF611G16000019284',
    badge: 'Poids Lourd',
  },
  {
    label: 'Shacman X3000 (Weichai WP12)',
    vin: 'LZGJL400000123456',
    badge: 'Chinois / BTP',
  },
  {
    label: 'SNVI K66 / K120 (Deutz F6L912)',
    vin: 'VFAK6600000123456',
    badge: 'National DZ',
  },
  {
    label: 'Renault Master III 2.3 dCi',
    vin: 'VF1MA000000123456',
    badge: 'Utilitaire VUL',
  },
  {
    label: 'Renault Kangoo II 1.5 dCi (2012)',
    vin: 'VF1KW000000123456',
    badge: 'Flotte Urbaine DZ',
  },
  {
    label: 'Toyota Hilux 4x4 (2.4 D-4D)',
    vin: 'AHTFR200000123456',
    badge: 'Pick-up / Flotte',
  },
  {
    label: 'Mercedes-Benz GLK 220 CDI 4MATIC (2012)',
    vin: 'WDC2049841F123456',
    badge: 'SUV 4MATIC Flotte',
  },
];

export const PRESET_CATALOG_MODELS: PresetCatalogModel[] = [
  { make: 'Renault Trucks', model: 'T480', engine: 'DTI 13 (12.8L)', label: 'Renault T480 (DTI 13)' },
  { make: 'Shacman', model: 'X3000', engine: 'Weichai WP12.430', label: 'Shacman X3000 (Weichai)' },
  { make: 'SNVI', model: 'K66', engine: 'Deutz F6L912', label: 'SNVI K66 (Deutz F6L)' },
  { make: 'MAN', model: 'TGS', engine: 'D2066 (10.5L)', label: 'MAN TGS 33.440' },
  { make: 'Renault', model: 'Master', engine: '2.3 dCi 135 (M9T)', label: 'Master III 2.3 dCi' },
  { make: 'Renault', model: 'Kangoo', engine: '1.5 dCi 90 (K9K)', label: 'Kangoo II 1.5 dCi' },
  { make: 'Toyota', model: 'Hilux', engine: '2.4 D-4D (2GD-FTV)', label: 'Toyota Hilux 4x4' },
  { make: 'Mercedes-Benz', model: 'GLK 220 CDI 4MATIC', engine: 'OM 651 (2.1L 170ch)', label: 'Mercedes GLK 2012 4MATIC' },
  { make: 'Peugeot', model: 'Partner', engine: '1.6 HDi 92 (DV6)', label: 'Partner 1.6 HDi' },
  { make: 'Volkswagen', model: 'Caddy', engine: '2.0 TDI 102ch', label: 'VW Caddy 2.0 TDI' },
];

export const PRESET_BULK_MAKES: PresetBulkMake[] = [
  { make: 'Scania', cat: 'TRUCKS_BUSES', label: 'Scania (Poids Lourds)' },
  { make: 'Volvo Trucks', cat: 'TRUCKS_BUSES', label: 'Volvo Trucks (FH/FMX)' },
  { make: 'Caterpillar', cat: 'CONSTRUCTION', label: 'Caterpillar (Pelleteuses BTP)' },
  { make: 'John Deere', cat: 'AGRICULTURAL', label: 'John Deere (Tracteurs)' },
  { make: 'Mercedes-Benz GLK 2012 4MATIC', cat: 'CARS_SUVS', label: 'Mercedes GLK 4MATIC' },
  { make: 'Mercedes-Benz', cat: 'TRUCKS_BUSES', label: 'Mercedes (Actros / Sprinter)' },
  { make: 'Toyota', cat: 'CARS_SUVS', label: 'Toyota (Land Cruiser / Hilux)' },
];

export const BULK_CATEGORIES: CategoryOption[] = [
  { id: 'TRUCKS_BUSES', label: 'Poids Lourds' },
  { id: 'CONSTRUCTION', label: 'Engins BTP' },
  { id: 'AGRICULTURAL', label: 'Machinisme Agricole' },
  { id: 'LIGHT_COMMERCIAL', label: 'Utilitaires VUL' },
  { id: 'CARS_SUVS', label: 'Voitures / SUV' },
];

export const SCRAPER_SOURCES: SourceInfo[] = [
  {
    id: 'AUTO',
    label: 'Auto (Matrice DZ)',
    description: 'Stratégie Déterministe Locale',
    detail: 'Résolution WMI/VDS en cache mémoire < 1 ms. Zéro latence et zéro dépendance externe.',
  },
  {
    id: 'OLYSLAGER',
    label: 'Olyslager Fluides',
    description: 'Sélecteurs B2B (Kroon/Motul/Shell)',
    detail: 'Capacités exactes carter, boîte, pont, refroidissement et viscosités (RLD-3, M 3277, etc.).',
  },
  {
    id: 'AUTODOC',
    label: 'AUTODOC Pièces',
    description: 'Grilles Pièces & Barèmes',
    detail: 'Périodicités courroies de distribution, filtration gazole/air, plaquettes de freins.',
  },
  {
    id: 'PDF',
    label: 'Manuel PDF',
    description: 'Extracteur Tabulaire PDF (pdfplumber)',
    detail: 'Ingestion directe des carnets d\'entretien pour marques chinoises et nationales (Shacman, Sinotruk, SNVI, Cirta).',
  },
];
