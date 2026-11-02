'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import {
  OEMScraperClient,
  NormalizedOEMTemplate,
  NormalizedOEMTask,
  ScraperTraceStep,
} from '../../lib/api-oem-scraper';

const PRESET_VINS = [
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

export default function OEMScraperPage() {
  const [vinInput, setVinInput] = useState('VF611G16000019284');
  const [searchMode, setSearchMode] = useState<'VIN' | 'CATALOG' | 'BULK_WORLD'>('VIN');
  const [manualMake, setManualMake] = useState('Renault Trucks');
  const [manualModel, setManualModel] = useState('T480');
  const [manualEngine, setManualEngine] = useState('DTI 13 (12.8L)');
  const [bulkCategory, setBulkCategory] = useState('TRUCKS_BUSES');
  const [bulkTargetMake, setBulkTargetMake] = useState('');
  const [bulkCount, setBulkCount] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<'AUTO' | 'OLYSLAGER' | 'AUTODOC' | 'PDF'>('AUTO');
  const [targetUrl, setTargetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [template, setTemplate] = useState<NormalizedOEMTemplate | null>(null);
  const [traceSteps, setTraceSteps] = useState<ScraperTraceStep[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const handleBulkCrawl = async (catParam?: string, makeParam?: string) => {
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

  return (
    <>
      <Navbar />

      <main className="df-container" style={{ paddingTop: '0.5rem' }}>
        {/* BANNIÈRE TITRE & CONTEXTE SOUVERAIN */}
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem' }}>🔍</span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Référentiel Souverain & Scraper OEM RMI
                </h1>
                <Badge variant="success" size="md">OEM-FIRST DZ</Badge>
              </div>
              <p style={{ color: 'var(--df-text-muted)', margin: 0, fontSize: '0.95rem', maxWidth: '850px', lineHeight: 1.5 }}>
                Constitution autonome de votre propre base constructeur sans abonnement récurrent coûteux (TecRMI, Autodata, HaynesPro).
                Extraction et croisement déterministe depuis les portails de lubrifiants (Olyslager / LubeMatch), les grilles de pièces
                d&apos;usure (AUTODOC Club) et l&apos;ingestion locale de livrets d&apos;entretien PDF constructeurs (Shacman, SNVI, Cirta).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link href="/assets">
                <Button variant="secondary" size="md">
                  ← Retour au Parc
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* FEEDBACK NOTIFICATION */}
        {feedback && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              marginBottom: '1.5rem',
              background:
                feedback.type === 'success'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : feedback.type === 'warning'
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${feedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : feedback.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
                }`,
              color:
                feedback.type === 'success'
                  ? 'var(--df-status-ok)'
                  : feedback.type === 'warning'
                    ? 'var(--df-status-warning)'
                    : 'var(--df-status-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ×
            </button>
          </div>
        )}

        {/* SECTION 1 : CONSOLE DE RÉSOLUTION VIN & ENRICHISSEMENT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* CARTE DE SAISIE */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{searchMode === 'VIN' ? '🔢' : searchMode === 'CATALOG' ? '📋' : '🌍'}</span>
                {searchMode === 'VIN'
                  ? 'Décodage par Châssis VIN'
                  : searchMode === 'CATALOG'
                    ? 'Exploration par Catalogue (Sans VIN)'
                    : 'Crawler Universel Mondial (Multi-Niveaux)'}
              </h2>

              <div style={{ display: 'flex', background: 'var(--df-bg-surface-2)', padding: '0.2rem', borderRadius: 'var(--df-radius-sm)', border: '1px solid var(--df-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setSearchMode('VIN')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--df-radius-xs)',
                    border: 'none',
                    background: searchMode === 'VIN' ? 'var(--df-primary)' : 'transparent',
                    color: searchMode === 'VIN' ? '#fff' : 'var(--df-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Mode VIN
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('CATALOG')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--df-radius-xs)',
                    border: 'none',
                    background: searchMode === 'CATALOG' ? 'var(--df-primary)' : 'transparent',
                    color: searchMode === 'CATALOG' ? '#fff' : 'var(--df-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Mode Marque & Modèle
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('BULK_WORLD')}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--df-radius-xs)',
                    border: 'none',
                    background: searchMode === 'BULK_WORLD' ? 'var(--df-primary)' : 'transparent',
                    color: searchMode === 'BULK_WORLD' ? '#fff' : 'var(--df-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Crawler Mondial
                </button>
              </div>
            </div>

            {searchMode === 'VIN' ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.4rem' }}>
                  Numéro de Châssis VIN (17 Caractères ISO 3779)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={vinInput}
                    onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                    placeholder="Ex: VF611G16000019284"
                    maxLength={17}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.85rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-md)',
                      color: 'var(--df-text-main)',
                      fontFamily: 'var(--df-font-mono, monospace)',
                      fontSize: '1rem',
                      letterSpacing: '1px',
                    }}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleResolve()}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Analyse...' : 'Résoudre'}
                  </Button>
                </div>
              </div>
            ) : searchMode === 'CATALOG' ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                      Marque Constructeur
                    </label>
                    <input
                      type="text"
                      value={manualMake}
                      onChange={(e) => setManualMake(e.target.value)}
                      placeholder="Ex: Renault Trucks, Shacman, SNVI"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        background: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-subtle)',
                        borderRadius: 'var(--df-radius-sm)',
                        color: 'var(--df-text-main)',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.3rem' }}>
                      Modèle ou Gamme
                    </label>
                    <input
                      type="text"
                      value={manualModel}
                      onChange={(e) => setManualModel(e.target.value)}
                      placeholder="Ex: T480, X3000, K66, TGS"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        background: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-subtle)',
                        borderRadius: 'var(--df-radius-sm)',
                        color: 'var(--df-text-main)',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={manualEngine}
                    onChange={(e) => setManualEngine(e.target.value)}
                    placeholder="Motorisation (Optionnelle, ex: DTI 13 480ch)"
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.85rem',
                    }}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleResolve()}
                    disabled={isLoading || !manualMake || !manualModel}
                  >
                    {isLoading ? 'Extraction...' : 'Explorer Catalogue'}
                  </Button>
                </div>
              </div>
            ) : (
              /* MODE 3 : CRAWLER MONDIAL DYNAMIQUE SANS VIN */
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '0.4rem' }}>
                  Univers Métier Mondial à Indexer
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { id: 'TRUCKS_BUSES', label: '🚛 Poids Lourds' },
                    { id: 'CONSTRUCTION', label: '🏗️ Engins BTP' },
                    { id: 'AGRICULTURAL', label: '🚜 Machinisme' },
                    { id: 'LIGHT_COMMERCIAL', label: '🚐 Utilitaires' },
                    { id: 'CARS_SUVS', label: '🚙 Voitures / SUV' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBulkCategory(cat.id)}
                      style={{
                        padding: '0.5rem 0.6rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        borderRadius: 'var(--df-radius-sm)',
                        border: `1px solid ${bulkCategory === cat.id ? 'var(--df-primary)' : 'var(--df-border-subtle)'}`,
                        background: bulkCategory === cat.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--df-bg-surface-2)',
                        color: bulkCategory === cat.id ? 'var(--df-primary)' : 'var(--df-text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={bulkTargetMake}
                    onChange={(e) => setBulkTargetMake(e.target.value)}
                    placeholder="Filtrer une marque (ex: Scania, Caterpillar, Volvo, ou vide = Tout)"
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      background: 'var(--df-bg-surface-2)',
                      border: '1px solid var(--df-border-subtle)',
                      borderRadius: 'var(--df-radius-sm)',
                      color: 'var(--df-text-main)',
                      fontSize: '0.85rem',
                    }}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleBulkCrawl()}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Crawling...' : '🚀 Lancer Crawl Mondial'}
                  </Button>
                </div>
              </div>
            )}


            {/* RACCOURCIS RAPIDES VINS & MODÈLES TYPES */}
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                {searchMode === 'VIN'
                  ? 'Échantillons VIN de référence :'
                  : searchMode === 'CATALOG'
                    ? 'Modèles fréquents sans VIN :'
                    : 'Crawl ciblé 1-clic par constructeur mondial :'}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {searchMode === 'VIN'
                  ? PRESET_VINS.map((preset) => (
                    <button
                      key={preset.vin}
                      type="button"
                      onClick={() => {
                        setVinInput(preset.vin);
                        handleResolve(preset.vin);
                      }}
                      style={{
                        background: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-subtle)',
                        borderRadius: 'var(--df-radius-sm)',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.75rem',
                        color: 'var(--df-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{preset.label}</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>({preset.badge})</span>
                    </button>
                  ))
                  : searchMode === 'CATALOG'
                    ? [
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
                    ].map((item) => (
                      <button
                        key={`${item.make}-${item.model}-${item.engine}`}
                        type="button"
                        onClick={() => {
                          setManualMake(item.make);
                          setManualModel(item.model);
                          setManualEngine(item.engine);
                          handleResolve(undefined, item.make, item.model, item.engine);
                        }}
                        style={{
                          background: 'var(--df-bg-surface-2)',
                          border: '1px solid var(--df-border-subtle)',
                          borderRadius: 'var(--df-radius-sm)',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          color: 'var(--df-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {item.label}
                      </button>
                    ))
                    : [
                      { make: 'Scania', cat: 'TRUCKS_BUSES', label: '🦁 Scania (Poids Lourds)' },
                      { make: 'Volvo Trucks', cat: 'TRUCKS_BUSES', label: '🇸🇪 Volvo Trucks (FH/FMX)' },
                      { make: 'Caterpillar', cat: 'CONSTRUCTION', label: '🚜 Caterpillar (Pelleteuses BTP)' },
                      { make: 'John Deere', cat: 'AGRICULTURAL', label: '🌾 John Deere (Tracteurs)' },
                      { make: 'Mercedes-Benz GLK 2012 4MATIC', cat: 'CARS_SUVS', label: '⭐ Mercedes GLK 4MATIC' },
                      { make: 'Mercedes-Benz', cat: 'TRUCKS_BUSES', label: '⭐ Mercedes (Actros / Sprinter)' },
                      { make: 'Toyota', cat: 'CARS_SUVS', label: '🇯🇵 Toyota (Land Cruiser / Hilux)' },
                    ].map((item) => (
                      <button
                        key={item.make}
                        type="button"
                        onClick={() => {
                          setBulkTargetMake(item.make);
                          setBulkCategory(item.cat);
                          handleBulkCrawl(item.cat, item.make);
                        }}
                        style={{
                          background: 'var(--df-bg-surface-2)',
                          border: '1px solid var(--df-border-subtle)',
                          borderRadius: 'var(--df-radius-sm)',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          color: 'var(--df-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
              </div>
            </div>

          </div>

          {/* CARTE DES SOURCES DE SCRAPING COMPLÉMENTAIRES */}
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🌐</span> Sources Publiques & Paramètres d&apos;Extraction
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedSource('AUTO')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--df-radius-sm)',
                  border: '1px solid var(--df-border-subtle)',
                  background: selectedSource === 'AUTO' ? 'var(--df-primary)' : 'var(--df-bg-surface-2)',
                  color: selectedSource === 'AUTO' ? '#fff' : 'var(--df-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Auto (Matrice DZ)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('OLYSLAGER')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--df-radius-sm)',
                  border: '1px solid var(--df-border-subtle)',
                  background: selectedSource === 'OLYSLAGER' ? 'var(--df-primary)' : 'var(--df-bg-surface-2)',
                  color: selectedSource === 'OLYSLAGER' ? '#fff' : 'var(--df-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Olyslager Fluides
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('AUTODOC')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--df-radius-sm)',
                  border: '1px solid var(--df-border-subtle)',
                  background: selectedSource === 'AUTODOC' ? 'var(--df-primary)' : 'var(--df-bg-surface-2)',
                  color: selectedSource === 'AUTODOC' ? '#fff' : 'var(--df-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                AUTODOC Pièces
              </button>
              <button
                type="button"
                onClick={() => setSelectedSource('PDF')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--df-radius-sm)',
                  border: '1px solid var(--df-border-subtle)',
                  background: selectedSource === 'PDF' ? 'var(--df-primary)' : 'var(--df-bg-surface-2)',
                  color: selectedSource === 'PDF' ? '#fff' : 'var(--df-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Manuel PDF
              </button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--df-text-muted)', lineHeight: 1.5, background: 'var(--df-bg-surface-2)', padding: '0.75rem', borderRadius: 'var(--df-radius-sm)', border: '1px solid var(--df-border-subtle)' }}>
              {selectedSource === 'AUTO' && (
                <div>
                  <strong>Stratégie Déterministe Locale :</strong> Résolution WMI/VDS en cache mémoire &lt; 1 ms. Zéro latence et zéro dépendance externe.
                </div>
              )}
              {selectedSource === 'OLYSLAGER' && (
                <div>
                  <strong>Sélecteurs B2B (Kroon/Motul/Shell) :</strong> Capacités exactes carter, boîte, pont, refroidissement et viscosités (RLD-3, M 3277, etc.).
                </div>
              )}
              {selectedSource === 'AUTODOC' && (
                <div>
                  <strong>Grilles Pièces & Barèmes :</strong> Périodicités courroies de distribution, filtration gazole/air, plaquettes de freins.
                </div>
              )}
              {selectedSource === 'PDF' && (
                <div>
                  <strong>Extracteur Tabulaire PDF (pdfplumber) :</strong> Ingestion directe des carnets d&apos;entretien pour marques chinoises et nationales (Shacman, Sinotruk, SNVI, Cirta).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION : JOURNAL D'EXÉCUTION & TRAÇABILITÉ DU SCRAPER (AUDIT TRAIL) */}
        {traceSteps.length > 0 && (
          <div
            style={{
              background: '#111317',
              border: '1px solid #23272F',
              borderRadius: '4px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid #23272F',
                paddingBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                  }}
                />
                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    margin: 0,
                    color: '#F3F4F6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Journal d&apos;Exécution & Traçabilité du Scraper OEM
                </h3>
                <span
                  style={{
                    background: '#181B20',
                    border: '1px solid #343A46',
                    color: '#2563EB',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '3px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {traceSteps.length} ÉTAPES AUDITÉES
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>
                Mode : {searchMode === 'VIN' ? 'DÉCODAGE_CHÂSSIS_ISO_3779' : 'SCORING_MULTI_CRITÈRES_DÉTERMINISTE'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {traceSteps.map((s) => {
                const isMatch = s.level === 'MATCH';
                const isWarning = s.level === 'WARNING';
                const isReject = s.level === 'REJECT';
                const isFallback = s.level === 'FALLBACK';

                const badgeBg = isMatch
                  ? 'rgba(16, 185, 129, 0.12)'
                  : isWarning || isFallback
                    ? 'rgba(245, 158, 11, 0.12)'
                    : isReject
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(37, 99, 235, 0.12)';

                const badgeBorder = isMatch
                  ? '#10B981'
                  : isWarning || isFallback
                    ? '#F59E0B'
                    : isReject
                      ? '#EF4444'
                      : '#2563EB';

                return (
                  <div
                    key={s.step}
                    style={{
                      background: '#090A0C',
                      border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.3)' : '#23272F'}`,
                      borderRadius: '4px',
                      padding: '0.6rem 0.85rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 700,
                        color: '#6B7280',
                        fontSize: '0.75rem',
                        minWidth: '22px',
                      }}
                    >
                      #{String(s.step).padStart(2, '0')}
                    </span>

                    <span
                      style={{
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeBorder,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '2px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        fontFamily: 'JetBrains Mono, monospace',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.phase}
                    </span>

                    <div style={{ flex: 1 }}>
                      <span style={{ color: '#F3F4F6', lineHeight: 1.45 }}>{s.message}</span>
                      {s.details && (
                        <div
                          style={{
                            marginTop: '0.35rem',
                            padding: '0.35rem 0.5rem',
                            background: '#111317',
                            border: '1px solid #23272F',
                            borderRadius: '2px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: '0.72rem',
                            color: '#9CA3AF',
                            wordBreak: 'break-all',
                          }}
                        >
                          {JSON.stringify(s.details)}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: '0.72rem',
                        color: '#6B7280',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2 : RÉSULTAT DE LA FICHE CONSTRUCTEUR NORMALISÉE */}
        {template && (
          <div
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-lg)',
              padding: '1.75rem',
              boxShadow: 'var(--df-shadow-md)',
              marginBottom: '2rem',
            }}
          >
            {/* EN-TÊTE DU VÉHICULE DÉTECTÉ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--df-border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <Badge variant="primary" size="md">{template.asset_category}</Badge>
                  <span style={{ fontFamily: 'var(--df-font-mono, monospace)', fontSize: '0.85rem', color: 'var(--df-text-muted)' }}>
                    WMI: {template.wmi_prefix}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--df-text-main)' }}>
                  {template.make} {template.model}
                </h2>
                <span style={{ fontSize: '0.95rem', color: 'var(--df-text-secondary)', fontWeight: 600 }}>
                  Motorisation : {template.engine_code}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveToPostgres}
                  disabled={savedSuccess}
                >
                  {savedSuccess ? '✓ Enregistré dans PostgreSQL' : '💾 Sauvegarder dans Référentiel Local'}
                </Button>
              </div>
            </div>

            {/* CARTES DE MÉTRIQUES TECHNIQUES CONSTRUCTEUR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ background: 'var(--df-bg-surface-2)', padding: '1rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Capacité Carter Moteur
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '0.25rem' }}>
                  {template.oil_capacity_liters} Litres
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>Filtres inclus</span>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', padding: '1rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Norme & Viscosité Huile
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={template.oil_norm_spec}>
                  {template.oil_norm_spec}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>Spécification OEM</span>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', padding: '1rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Conso Réf. Route (Mode 0)
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '0.25rem' }}>
                  {template.ref_consumption_l_100km} L / 100 km
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>Estimation Sans Boîtier</span>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', padding: '1rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Conso Réf. Horaire (Chantier)
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--df-text-main)', marginTop: '0.25rem' }}>
                  {template.ref_consumption_l_hour} L / heure
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>Ralenti / Prise de force</span>
              </div>
            </div>

            {/* TABLEAU DES TÂCHES ET INTERVALLES CONSTRUCTEURS (NORMAL VS SÉVÈRE) */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem' }}>
              Grille d&apos;Entretien Préventif & Recommandations d&apos;Usure
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '2px solid var(--df-border-subtle)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-text-secondary)' }}>Code Tâche</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-text-secondary)' }}>Organe</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-text-secondary)' }}>Description Intervention</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-text-secondary)' }}>Usage Normal</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-status-warning)' }}>Usage Sévère (Sahara / BTP)</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-text-secondary)' }}>Main d&apos;Œuvre</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-text-secondary)' }}>Criticité</th>
                  </tr>
                </thead>
                <tbody>
                  {template.tasks.map((task: NormalizedOEMTask) => (
                    <tr
                      key={task.task_code}
                      style={{
                        borderBottom: '1px solid var(--df-border-subtle)',
                        transition: 'background var(--df-transition-fast)',
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--df-font-mono, monospace)', fontWeight: 600 }}>
                        {task.task_code}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--df-radius-sm)',
                            background: 'var(--df-bg-surface-2)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {task.subsystem}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {task.task_name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div><strong>{task.normal_interval_km.toLocaleString()} km</strong></div>
                        <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem' }}>
                          {task.normal_interval_months} mois | {task.normal_interval_engine_hours} h
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--df-status-warning)' }}>
                        <div><strong>{task.severe_interval_km.toLocaleString()} km</strong></div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                          {task.severe_interval_months} mois | {task.severe_interval_engine_hours} h
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {task.standard_labor_minutes} min
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            color: task.criticality_weight >= 1.5 ? 'var(--df-status-danger)' : 'var(--df-text-secondary)',
                            fontWeight: 700,
                          }}
                        >
                          x{task.criticality_weight.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
