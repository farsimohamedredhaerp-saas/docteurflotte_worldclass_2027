import {
  NormalizedOEMTemplate,
  NormalizedOEMTask,
  ScraperTraceStep,
} from '../../lib/api-oem-scraper';

export type SearchMode = 'VIN' | 'CATALOG' | 'BULK_WORLD';
export type ScraperSource = 'AUTO' | 'OLYSLAGER' | 'AUTODOC' | 'PDF';
export type BulkCategory = 'TRUCKS_BUSES' | 'CONSTRUCTION' | 'AGRICULTURAL' | 'LIGHT_COMMERCIAL' | 'CARS_SUVS';

export type FeedbackState = {
  type: 'success' | 'warning' | 'error';
  message: string;
} | null;

export interface PresetVin {
  label: string;
  vin: string;
  badge: string;
}

export interface PresetCatalogModel {
  make: string;
  model: string;
  engine: string;
  label: string;
}

export interface PresetBulkMake {
  make: string;
  cat: BulkCategory;
  label: string;
}

export interface CategoryOption {
  id: BulkCategory;
  label: string;
}

export interface SourceInfo {
  id: ScraperSource;
  label: string;
  description: string;
  detail: string;
}

export interface OemScraperHeaderProps {
  onBackToAssets?: () => void;
}

export interface OemScraperConsoleProps {
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  vinInput: string;
  onVinInputChange: (val: string) => void;
  manualMake: string;
  onManualMakeChange: (val: string) => void;
  manualModel: string;
  onManualModelChange: (val: string) => void;
  manualEngine: string;
  onManualEngineChange: (val: string) => void;
  bulkCategory: BulkCategory;
  onBulkCategoryChange: (cat: BulkCategory) => void;
  bulkTargetMake: string;
  onBulkTargetMakeChange: (val: string) => void;
  isLoading: boolean;
  onResolve: (vinToUse?: string, customMake?: string, customModel?: string, customEngine?: string) => void;
  onBulkCrawl: (catParam?: BulkCategory, makeParam?: string) => void;
}

export interface OemScraperSourcesCardProps {
  selectedSource: ScraperSource;
  onSourceChange: (source: ScraperSource) => void;
}

export interface OemTraceAuditTrailProps {
  traceSteps: ScraperTraceStep[];
  searchMode: SearchMode;
}

export interface OemTemplateResultProps {
  template: NormalizedOEMTemplate;
  savedSuccess: boolean;
  onSaveToPostgres: () => void;
}

export type { NormalizedOEMTemplate, NormalizedOEMTask, ScraperTraceStep };
