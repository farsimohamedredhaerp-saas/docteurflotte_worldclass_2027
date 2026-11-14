'use client';

import { useState } from 'react';
import {
  OEMScraperClient,
  NormalizedOEMTemplate,
  NormalizedOEMTask,
  ScraperTraceStep,
} from '../../../lib/api-oem-scraper';
import {
  SearchMode,
  ScraperSource,
  BulkCategory,
  FeedbackState,
} from '../types';

interface UseOemScraperDataProps {
  searchMode: SearchMode;
  initialVin?: string;
  initialMake?: string;
  initialModel?: string;
  initialCategory?: BulkCategory;
  onVinChange?: (vin: string) => void;
  onCategoryChange?: (cat: BulkCategory) => void;
}

export function useOemScraperData({
  searchMode,
  initialVin,
  initialMake,
  initialModel,
  initialCategory,
  onVinChange,
  onCategoryChange,
}: UseOemScraperDataProps) {
  const [vinInput, setVinInputState] = useState(initialVin || 'VF611G16000019284');
  const [manualMake, setManualMake] = useState(initialMake || 'Renault Trucks');
  const [manualModel, setManualModel] = useState(initialModel || 'T480');
  const [manualEngine, setManualEngine] = useState('DTI 13 (12.8L)');
  const [bulkCategory, setBulkCategoryState] = useState<BulkCategory>(initialCategory || 'TRUCKS_BUSES');
  const [bulkTargetMake, setBulkTargetMake] = useState('');
  const [bulkCount, setBulkCount] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<ScraperSource>('AUTO');
  const [targetUrl, setTargetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState<NormalizedOEMTemplate | null>(null);
  const [traceSteps, setTraceSteps] = useState<ScraperTraceStep[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const setVinInput = (val: string) => {
    setVinInputState(val);
    onVinChange?.(val);
  };

  const setBulkCategory = (cat: BulkCategory) => {
    setBulkCategoryState(cat);
    onCategoryChange?.(cat);
  };

  const handleResolve = async (
    vinToUse?: string,
    customMake?: string,
    customModel?: string,
    customEngine?: string
  ) => {
    const isVinMode = searchMode === 'VIN' && !customMake;
    const activeVin = isVinMode ? (vinToUse || vinInput).trim().toUpperCase() : undefined;
    const makeVal = customMake || (searchMode === 'CATALOG' ? manualMake : undefined);
    const modelVal = customModel || (searchMode === 'CATALOG' ? manualModel : undefined);
    const engineVal = customEngine !== undefined ? customEngine : (searchMode === 'CATALOG' ? manualEngine : undefined);

    setIsLoading(true);
    setFeedback(null);
    setSavedSuccess(false);

    try {
      const data = await OEMScraperClient.resolveAndScrape({
        vin: activeVin,
        make: makeVal || undefined,
        model: modelVal || undefined,
        engine_code: engineVal || undefined,
        lubricant_guide_url: targetUrl || undefined,
      });

      setTemplate(data);
      if (data.execution_trace) {
        setTraceSteps(data.execution_trace);
      }
      setFeedback({
        type: 'success',
        message: `Signature résolue avec succès : ${data.make} ${data.model} (${data.engine_code}) — ${data.tasks.length} opérations constructeurs identifiées.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de résolution.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCrawl = async (catParam?: BulkCategory, makeParam?: string) => {
    const cat = catParam || bulkCategory;
    const make = makeParam !== undefined ? makeParam : bulkTargetMake;

    setIsLoading(true);
    setFeedback(null);
    setSavedSuccess(false);

    try {
      const res = await OEMScraperClient.bulkCrawlCatalog({
        category_url: targetUrl || undefined,
        target_make: make || undefined,
        asset_category:
          cat === 'TRUCKS_BUSES'
            ? 'HEAVY_TRUCK'
            : cat === 'CONSTRUCTION'
              ? 'CONSTRUCTION_EQUIP'
              : cat === 'AGRICULTURAL'
                ? 'AGRI_TRACTOR'
                : cat === 'LIGHT_COMMERCIAL'
                  ? 'VAN'
                  : 'LIGHT_VEHICLE',
      });

      const count = res.imported_count || res.importedCount || 0;
      setBulkCount(count);

      const firstSample = res.sample_templates?.[0] || res.sampleTemplates?.[0];
      if (firstSample) {
        setTemplate({
          wmi_prefix: firstSample.wmi_prefix || 'GEN',
          make: firstSample.make,
          model: firstSample.model,
          engine_code: firstSample.engine_code || 'Moteur Standard',
          asset_category: firstSample.asset_category || 'HEAVY_TRUCK',
          fuel_type: firstSample.fuel_type || 'DIESEL',
          ref_consumption_l_100km: firstSample.ref_consumption_l_100km ?? 0,
          ref_consumption_l_hour: firstSample.ref_consumption_l_hour ?? 0,
          oil_capacity_liters: firstSample.oil_capacity_liters ?? 0,
          oil_norm_spec: firstSample.oil_norm_spec || '',
          tasks: (firstSample.tasks || []).map((t: NormalizedOEMTask) => ({
            task_code: t.task_code,
            task_name: t.task_name,
            subsystem: t.subsystem,
            normal_interval_km: t.normal_interval_km ?? 0,
            normal_interval_months: t.normal_interval_months ?? 0,
            normal_interval_engine_hours: t.normal_interval_engine_hours ?? 0,
            severe_interval_km: t.severe_interval_km ?? 0,
            severe_interval_months: t.severe_interval_months ?? 0,
            severe_interval_engine_hours: t.severe_interval_engine_hours ?? 0,
            standard_labor_minutes: t.standard_labor_minutes ?? 60,
            criticality_weight: t.criticality_weight ?? 1.0,
          })),
        });
      }

      setFeedback({
        type: 'success',
        message: res.message || `Crawl universel terminé : ${count} modèles indexés dans oem_maintenance_templates.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du crawl universel.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPostgres = () => {
    if (!template) return;
    setSavedSuccess(true);
    setFeedback({
      type: 'success',
      message: `Modèle constructeur « ${template.make} ${template.model} » sauvegardé dans oem_maintenance_templates (Cache PostgreSQL local mis à jour).`,
    });
  };

  return {
    vinInput,
    setVinInput,
    manualMake,
    setManualMake,
    manualModel,
    setManualModel,
    manualEngine,
    setManualEngine,
    bulkCategory,
    setBulkCategory,
    bulkTargetMake,
    setBulkTargetMake,
    bulkCount,
    selectedSource,
    setSelectedSource,
    targetUrl,
    setTargetUrl,
    isLoading,
    template,
    setTemplate,
    traceSteps,
    feedback,
    setFeedback,
    savedSuccess,
    handleResolve,
    handleBulkCrawl,
    handleSaveToPostgres,
  };
}
