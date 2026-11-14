'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navigation/Navbar';
import { CalculationProofModal, CalculationProofData } from '@/components/decisions';
import { CalculationProofBuilder } from '@/lib/calculation-proofs';
import { ROUTES, WORK_ORDER_PRIORITY, WORK_ORDER_SOURCE } from '@/lib/routes';
import { useI18n } from '@/lib/i18n';
import { useDigitalTwinPage } from '@/hooks/useDigitalTwinPage';
import {
  DigitalTwinHeader,
  VhiGaugeCard,
  VehicleContextCard,
  AnatomyDiagram,
  OrganAnalysisCard,
  TrajectoryCard,
  FinancialArbitrageCard,
  SimulationStudio,
  AdsActionsCard,
  EmptyState,
  ErrorState,
  LoadingState,
  Toast,
} from '@/components/digital-twin';
import {
  IconAlertTriangle,
  IconAlertOctagon,
  IconCheck,
  IconFileText,
} from '@/components/navigation/TechIcons';

// -----------------------------------------------------------------------------
// Styles — design tokens uniquement, aucun magic number métier en dur
// -----------------------------------------------------------------------------
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--df-bg-base)',
    color: 'var(--df-text-main)',
  },
  container: {
    maxWidth: 'var(--df-container-max, 1280px)',
    margin: '0 auto',
    padding: 'var(--df-page-padding, 32px 24px)',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
    gap: 'var(--df-gap-lg, 20px)',
    marginBottom: 'var(--df-gap-xl, 28px)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(460px, 100%), 1fr))',
    gap: 'var(--df-gap-xl, 24px)',
    alignItems: 'start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--df-gap-xl, 24px)',
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--df-gap-sm, 8px)',
    padding: 'var(--df-space-sm, 12px) var(--df-space-md, 16px)',
    marginBottom: 'var(--df-gap-lg, 16px)',
    borderRadius: 'var(--df-radius-md, 8px)',
    fontSize: 'var(--df-font-sm, 14px)',
    lineHeight: 1.5,
  },
  warningBanner: {
    backgroundColor: 'var(--df-warning-bg, #FEF3C7)',
    color: 'var(--df-warning-text, #92400E)',
    border: '1px solid var(--df-warning-border, #FCD34D)',
  },
  errorBanner: {
    backgroundColor: 'var(--df-error-bg, #FEE2E2)',
    color: 'var(--df-error-text, #991B1B)',
    border: '1px solid var(--df-error-border, #FCA5A5)',
  },
  loadingOverlay: {
    opacity: 0.6,
    pointerEvents: 'none' as const,
    transition: 'opacity 0.2s ease',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'var(--df-gap-sm, 8px)',
    marginBottom: 'var(--df-gap-lg, 16px)',
  },
  toolbarButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--df-gap-xs, 6px)',
    padding: 'var(--df-space-xs, 8px) var(--df-space-sm, 14px)',
    borderRadius: 'var(--df-radius-md, 8px)',
    border: '1px solid var(--df-border-subtle, #E5E7EB)',
    backgroundColor: 'var(--df-bg-surface, #FFFFFF)',
    color: 'var(--df-text-main, #111827)',
    fontSize: 'var(--df-font-sm, 14px)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
  },
  toolbarButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
} as const;

type PageStatus = 'loading' | 'error' | 'empty' | 'ready';

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------
export default function DigitalTwinPage() {
  const router = useRouter();
  const state = useDigitalTwinPage();
  const { t, locale } = useI18n(state.config?.locale);

  const [proofModalData, setProofModalData] = useState<CalculationProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Extraction en const : le narrowing TypeScript est conservé dans les closures
  const {
    digitalTwin,
    activeOrgan,
    activeOrganKey,
    setActiveOrganKey,
    config,
    selectedAssetId,
    assets,
    selectAsset,
    wilayas,
    currentWilayaProfile,
    selectedWilayaCode,
    isDesertTransit,
    climateMultiplier,
    driverMultiplier,
    selectWilaya,
    toggleDesertTransit,
    setClimateMultiplier,
    setDriverMultiplier,
    applyPreset,
    runSimulation,
    isSimulating,
    isLoading,
    errorMessage,
    retry,
    notification,
    showNotification,
  } = state;

  // ---------------------------------------------------------------------------
  // Dérivés mémoïsés
  // ---------------------------------------------------------------------------
  const pageStatus: PageStatus = useMemo(() => {
    if (isLoading && !digitalTwin) return 'loading';
    if (errorMessage && !digitalTwin) return 'error';
    if (!digitalTwin) return 'empty';
    return 'ready';
  }, [isLoading, errorMessage, digitalTwin]);

  const algorithmsSummary = useMemo(
    () =>
      (digitalTwin?.organs ?? [])
        .map((o) => o.algorithmShortName)
        .filter((name): name is string => Boolean(name))
        .join(', '),
    [digitalTwin]
  );

  const specVersion = digitalTwin?.specVersion ?? config?.specVersion;
  const canCreateWorkOrder = Boolean(selectedAssetId);

  // config.modelParameters peut être absent → optional chaining obligatoire
  const desertTowingAmount =
    config?.modelParameters?.desertTowingCostDzd ??
    digitalTwin?.financialArbitrage?.desertTowingCostDzd;
  const substitutionVhiThreshold = config?.modelParameters?.substitutionVhiThreshold;

  // configSource: 'server' | 'default'
  const isDefaultConfig = config?.configSource === 'default';

  // ---------------------------------------------------------------------------
  // Handlers stables (évitent les re-renders en cascade)
  // ---------------------------------------------------------------------------
  const openProof = useCallback(
    (data: CalculationProofData | null) => {
      if (!data) {
        showNotification(t('digitalTwin.proof.unavailable'));
        return;
      }
      setProofModalData(data);
      setIsProofModalOpen(true);
    },
    [showNotification, t]
  );

  const closeProof = useCallback(() => setIsProofModalOpen(false), []);

  const openArbitrageWorkOrder = useCallback(() => {
    if (!selectedAssetId) return;
    router.push(
      ROUTES.workOrderForAsset({
        assetId: selectedAssetId,
        source: WORK_ORDER_SOURCE.DIGITAL_TWIN,
        priority: WORK_ORDER_PRIORITY.HIGH,
      })
    );
  }, [router, selectedAssetId]);

  const openOrganWorkOrder = useCallback(() => {
    if (!selectedAssetId || !activeOrganKey) return;
    router.push(
      ROUTES.workOrderForAsset({
        assetId: selectedAssetId,
        source: WORK_ORDER_SOURCE.DIGITAL_TWIN,
        organ: activeOrganKey,
      })
    );
  }, [router, selectedAssetId, activeOrganKey]);

  // Résumé partageable — 100 % dérivé des données API / config
  const shareSummary = useCallback(async () => {
    if (!digitalTwin) return;
    const summary = t('digitalTwin.share.summary', {
      assetCode: digitalTwin.assetCode,
      vhi: digitalTwin.currentVhi,
      odometer: digitalTwin.currentOdometerKm,
      wilaya: digitalTwin.wilayaLocation,
      organs: digitalTwin.organs.length,
      algorithms: algorithmsSummary || t('digitalTwin.share.noAlgorithms'),
      spec: specVersion ?? t('digitalTwin.share.unknownSpec'),
    });
    try {
      await navigator.clipboard.writeText(summary);
      setShareCopied(true);
      showNotification(t('digitalTwin.share.copied'));
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      showNotification(t('digitalTwin.share.copyFailed'));
    }
  }, [digitalTwin, algorithmsSummary, specVersion, t, showNotification]);

  // ---------------------------------------------------------------------------
  // Rendu par état — plus de cascade de ternaires
  // ---------------------------------------------------------------------------
  const renderFallback = () => {
    switch (pageStatus) {
      case 'loading':
        return <LoadingState label={t('digitalTwin.loading')} />;
      case 'error':
        return (
          <ErrorState
            title={t('digitalTwin.error.title')}
            errorMessage={errorMessage ?? t('digitalTwin.error.unknown')}
            retryLabel={t('digitalTwin.error.retry')}
            onRetry={retry}
          />
        );
      case 'empty':
        return (
          <EmptyState
            title={t('digitalTwin.empty.title')}
            description={t('digitalTwin.empty.description')}
            retryLabel={t('digitalTwin.empty.retry')}
            onRetry={retry}
          />
        );
      default:
        return null;
    }
  };

  const renderReady = () => {
    if (!digitalTwin) return null;
    return (
      <>
        {isDefaultConfig && (
          <div role="status" style={{ ...styles.banner, ...styles.warningBanner }}>
            <IconAlertTriangle size={14} />
            <span>{t('digitalTwin.config.defaultBanner')}</span>
          </div>
        )}

        {errorMessage && (
          <div role="alert" style={{ ...styles.banner, ...styles.errorBanner }}>
            <IconAlertOctagon size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div style={styles.toolbar}>
          <button
            type="button"
            onClick={shareSummary}
            disabled={shareCopied}
            aria-disabled={shareCopied}
            aria-label={t('digitalTwin.share.copyAria')}
            style={{
              ...styles.toolbarButton,
              ...(shareCopied ? styles.toolbarButtonDisabled : {}),
            }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {shareCopied ? <IconCheck size={14} /> : <IconFileText size={14} />}
            </span>
            <span>
              {shareCopied ? t('digitalTwin.share.copiedShort') : t('digitalTwin.share.copy')}
            </span>
          </button>
        </div>

        <div aria-busy={isLoading} style={isLoading ? styles.loadingOverlay : undefined}>
          <div style={styles.topGrid}>
            <VhiGaugeCard
              vhi={digitalTwin.currentVhi}
              organsCount={digitalTwin.organs.length}
              algorithmsSummary={algorithmsSummary}
              thresholds={config?.vhiThresholds}
              onOpenProof={() =>
                openProof(CalculationProofBuilder.buildVhiScoreProof(digitalTwin, config))
              }
            />
            <VehicleContextCard
              assetCode={digitalTwin.assetCode}
              odometerKm={digitalTwin.currentOdometerKm}
              wilayaLocation={digitalTwin.wilayaLocation}
              climateFactor={digitalTwin.climateSeverityFactor}
              driverFactor={digitalTwin.driverAggressivenessScore}
            />
          </div>

          <AnatomyDiagram
            organs={digitalTwin.organs}
            activeOrganKey={activeOrganKey}
            category={digitalTwin.category}
            algorithmsSummary={algorithmsSummary}
            specVersion={specVersion}
            onSelectOrgan={setActiveOrganKey}
          />

          <div style={styles.mainGrid}>
            <div style={styles.column}>
              {activeOrgan && (
                <OrganAnalysisCard
                  organ={activeOrgan}
                  thresholds={config?.vhiThresholds}
                  onOpenProof={() =>
                    openProof(CalculationProofBuilder.buildOrganProof(activeOrgan, digitalTwin, config))
                  }
                />
              )}
              <TrajectoryCard
                projectionTrajectory={digitalTwin.projectionTrajectory}
                thresholds={config?.vhiThresholds}
                onOpenProof={() =>
                  openProof(CalculationProofBuilder.buildTrajectoryProof(digitalTwin, config))
                }
              />
            </div>

            <div style={styles.column}>
              {digitalTwin.financialArbitrage && (
                <FinancialArbitrageCard
                  financialArbitrage={digitalTwin.financialArbitrage}
                  currency={config?.currency}
                  workOrderDisabled={!canCreateWorkOrder}
                  onOpenProof={() =>
                    openProof(CalculationProofBuilder.buildFinancialProof(digitalTwin, config))
                  }
                  onOpenWorkOrder={openArbitrageWorkOrder}
                />
              )}

              <SimulationStudio
                wilayas={wilayas}
                currentWilayaProfile={currentWilayaProfile}
                selection={{
                  wilayaCode: selectedWilayaCode,
                  isDesertTransit,
                  climateMultiplier,
                  driverMultiplier,
                }}
                limits={config?.simulationLimits}
                presets={config?.simulationPresets}
                isSimulating={isSimulating}
                currency={config?.currency}
                desertTowingAmount={desertTowingAmount}
                telemetryTier={digitalTwin?.telemetryTier}
                actions={{
                  selectWilaya,
                  toggleDesertTransit,
                  changeClimateMultiplier: setClimateMultiplier,
                  changeDriverMultiplier: setDriverMultiplier,
                  applyPreset,
                  runSimulation,
                }}
              />

              <AdsActionsCard
                partsReservation={digitalTwin.partsReservation}
                substitutionAsset={digitalTwin.substitutionAsset}
                substitutionThreshold={substitutionVhiThreshold}
                currency={config?.currency}
                workOrderDisabled={!canCreateWorkOrder || !activeOrganKey}
                onGenerateWorkOrder={openOrganWorkOrder}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Layout racine
  // ---------------------------------------------------------------------------
  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} style={styles.page}>
      <Navbar />

      <DigitalTwinHeader
        badgeTitle={t('digitalTwin.header.badgeTitle')}
        specVersion={specVersion}
        title={t('digitalTwin.header.title')}
        description={t('digitalTwin.header.description', {
          count: digitalTwin?.organs.length ?? 0,
          algorithms: algorithmsSummary,
          wilayasCount: wilayas?.length ?? 0,
        })}
        liveCockpitLabel={t('digitalTwin.header.liveCockpit')}
        vehicleSelectLabel={t('digitalTwin.header.vehicleSelectLabel')}
        noVehiclesLabel={t('digitalTwin.header.noVehicles')}
        assets={assets}
        selectedAssetId={selectedAssetId}
        onSelectAsset={selectAsset}
      />

      {notification && <Toast message={notification} />}

      <div style={styles.container}>
        {pageStatus === 'ready' ? renderReady() : renderFallback()}
      </div>

      <CalculationProofModal
        isOpen={isProofModalOpen}
        onClose={closeProof}
        data={proofModalData}
      />
    </div>
  );
}
