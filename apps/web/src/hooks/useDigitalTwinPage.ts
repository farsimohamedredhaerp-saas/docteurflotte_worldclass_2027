import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DigitalTwinAsset,
  DigitalTwinOrganStatus,
  DigitalTwinUiConfig,
  SimulationPreset,
  AlgeriaWilayaProfile,
  Asset,
  ALGERIA_58_WILAYAS_PROFILES,
  DEFAULT_DIGITAL_TWIN_CONFIG,
  isDesertZone,
} from '@docteurflotte/contracts';
import { DigitalTwinClient } from '../lib/api-digital-twin';
import { AssetClient } from '../lib/api-assets';
import { AuthClient } from '../lib/api-auth';
import { useDemoMode } from '../context/DemoModeContext';

export interface UseDigitalTwinPageReturn {
  // Config & Données de référence
  config: DigitalTwinUiConfig;
  wilayas: AlgeriaWilayaProfile[];
  currentWilayaProfile: AlgeriaWilayaProfile;

  // Liste des actifs et sélection
  assets: Asset[];
  selectedAssetId: string | null;
  selectAsset: (id: string) => void;

  // Jumeau numérique et organe actif
  digitalTwin: DigitalTwinAsset | null;
  activeOrganKey: string | null;
  activeOrgan: DigitalTwinOrganStatus | null;
  setActiveOrganKey: (key: string) => void;

  // Paramètres de simulation
  selectedWilayaCode: number;
  isDesertTransit: boolean;
  climateMultiplier: number;
  driverMultiplier: number;
  selectWilaya: (code: number) => void;
  toggleDesertTransit: (checked: boolean) => void;
  setClimateMultiplier: (val: number) => void;
  setDriverMultiplier: (val: number) => void;
  applyPreset: (preset: SimulationPreset) => void;
  runSimulation: () => Promise<void>;

  // États système
  isLoading: boolean;
  isSimulating: boolean;
  errorMessage: string | null;
  notification: string | null;
  showNotification: (msg: string) => void;
  retry: () => void;
}

export function useDigitalTwinPage(): UseDigitalTwinPageReturn {
  const { session, isDemoMode } = useDemoMode();
  const sessionToken = session?.token || AuthClient.getSession().token;

  // Config UI chargée depuis l'API (avec fallback sur les constantes contrats)
  const [config, setConfig] = useState<DigitalTwinUiConfig>(DEFAULT_DIGITAL_TWIN_CONFIG);

  // Liste des Wilayas
  const wilayas = useMemo(() => {
    return Array.isArray(ALGERIA_58_WILAYAS_PROFILES) && ALGERIA_58_WILAYAS_PROFILES.length > 0
      ? ALGERIA_58_WILAYAS_PROFILES
      : DEFAULT_DIGITAL_TWIN_CONFIG.simulationPresets.map((p) => ({
          code: p.wilayaCode,
          name: p.label,
          nameAr: '',
          zone: 'ZONE_1_TELL' as const,
          zoneLabel: p.label,
          ambientTempSummerC: 35,
          ambientTempWinterC: 10,
          oilArrheniusFactor: 1.2,
          dustSilicaFactor: 1.0,
          brakeGradientFactor: 1.0,
          batteryEvapFactor: 1.1,
          description: '',
          isDesertZone: p.isDesertTransit,
        }));
  }, []);

  // États actifs et jumeau
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinAsset | null>(null);
  const [activeOrganKey, setActiveOrganKey] = useState<string | null>(null);

  // Paramètres de simulation initialisés dynamiquement
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(() => wilayas[0]?.code ?? 16);
  const [isDesertTransit, setIsDesertTransit] = useState<boolean>(false);
  const [climateMultiplier, setClimateMultiplier] = useState<number>(
    () => DEFAULT_DIGITAL_TWIN_CONFIG.simulationLimits.climate.defaultVal
  );
  const [driverMultiplier, setDriverMultiplier] = useState<number>(
    () => DEFAULT_DIGITAL_TWIN_CONFIG.simulationLimits.driver.defaultVal
  );

  // États de chargement et d'erreur
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Nettoyage de notification et requêtes en vol
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const simulationAbortControllerRef = useRef<AbortController | null>(null);

  const showNotification = useCallback((msg: string) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setNotification(msg);
    const duration = config.notificationDurationMs || 4000;
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimerRef.current = null;
    }, duration);
  }, [config.notificationDurationMs]);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (simulationAbortControllerRef.current) {
        simulationAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Profil Wilaya courant résolu de manière sûre sans index magique
  const currentWilayaProfile = useMemo(() => {
    const found = wilayas.find((w) => w.code === selectedWilayaCode);
    return found || wilayas[0];
  }, [wilayas, selectedWilayaCode]);

  // Chargement initial de la configuration API et des actifs
  const loadInitialData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Récupération de la configuration UI serveur
      const remoteConfig = await DigitalTwinClient.getConfig(sessionToken, ac.signal)
        .then((cfg) => ({ ...cfg, configSource: 'server' as const }))
        .catch((err) => {
          console.warn('[useDigitalTwinPage] Erreur récupération config, conservation par défaut:', err);
          return { ...DEFAULT_DIGITAL_TWIN_CONFIG, configSource: 'default' as const };
        });
      setConfig(remoteConfig);

      // 2. Récupération de la liste des actifs (avec fallback Sandbox si démo ou indisponibilité API)
      let resolvedAssets: Asset[] = [];
      if (isDemoMode) {
        const { getSimulationAssets } = await import('@/lib/simulation-sandbox');
        resolvedAssets = await getSimulationAssets();
      } else {
        resolvedAssets = await AssetClient.listAssets(sessionToken || '').catch(async (err) => {
          console.warn('[useDigitalTwinPage] AssetClient.listAssets a échoué, essai DigitalTwinClient.listTwins:', err);
          const twins = await DigitalTwinClient.listTwins(sessionToken, ac.signal).catch((e) => {
            console.error('[useDigitalTwinPage] Impossible de charger les jumeaux:', e);
            return [];
          });
          return twins.map((t) => ({
            id: t.assetId,
            code: t.assetCode,
            name: t.assetName,
            category: t.category,
            status: 'ACTIVE',
          } as unknown as Asset));
        });

        if (resolvedAssets.length === 0) {
          const { getSimulationAssets } = await import('@/lib/simulation-sandbox');
          resolvedAssets = await getSimulationAssets();
        }
      }

      setAssets(resolvedAssets);

      if (resolvedAssets.length === 0) {
        setIsLoading(false);
        return;
      }

      // 3. Sélection du premier actif de la liste
      const firstId = resolvedAssets[0].id;
      setSelectedAssetId(firstId);

      // 4. Chargement du jumeau numérique
      const twin = await DigitalTwinClient.getTwin(firstId, sessionToken, ac.signal);
      if (twin) {
        setDigitalTwin(twin);
        setActiveOrganKey(twin.organs[0]?.organ || null);
        setSelectedWilayaCode(twin.wilayaCode || wilayas[0]?.code || 16);
        setClimateMultiplier(twin.climateSeverityFactor || remoteConfig.simulationLimits.climate.defaultVal);
        setDriverMultiplier(twin.driverAggressivenessScore || remoteConfig.simulationLimits.driver.defaultVal);
        const wilayaProf = wilayas.find((w) => w.code === twin.wilayaCode);
        setIsDesertTransit(isDesertZone(wilayaProf));
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[useDigitalTwinPage] Erreur fatale de chargement:', err);
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, wilayas]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Sélection d'un nouvel actif avec annulation de requête concurrente
  const selectAsset = useCallback(
    async (assetId: string) => {
      setSelectedAssetId(assetId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ac = new AbortController();
      abortControllerRef.current = ac;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const twin = await DigitalTwinClient.getTwin(assetId, sessionToken, ac.signal);
        setDigitalTwin(twin);
        if (twin) {
          setActiveOrganKey(twin.organs[0]?.organ || null);
          setSelectedWilayaCode(twin.wilayaCode || wilayas[0]?.code || 16);
          setClimateMultiplier(twin.climateSeverityFactor || config.simulationLimits.climate.defaultVal);
          setDriverMultiplier(twin.driverAggressivenessScore || config.simulationLimits.driver.defaultVal);
          const wilayaProf = wilayas.find((w) => w.code === twin.wilayaCode);
          setIsDesertTransit(isDesertZone(wilayaProf));
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[useDigitalTwinPage] Erreur lors de la sélection de l'actif ${assetId}:`, err);
          setErrorMessage(message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [sessionToken, config.simulationLimits, wilayas]
  );

  // Changement de Wilaya
  const selectWilaya = useCallback(
    (code: number) => {
      setSelectedWilayaCode(code);
      const profile = wilayas.find((w) => w.code === code);
      if (profile) {
        setClimateMultiplier(profile.oilArrheniusFactor);
        setIsDesertTransit(isDesertZone(profile));
      }
    },
    [wilayas]
  );

  // Toggle Transit Désertique
  const toggleDesertTransit = useCallback((checked: boolean) => {
    setIsDesertTransit(checked);
  }, []);

  // Application d'un scénario prédéfini (Preset)
  const applyPreset = useCallback(
    (preset: SimulationPreset) => {
      selectWilaya(preset.wilayaCode);
      setDriverMultiplier(preset.driverMultiplier);
      if (preset.isDesertTransit !== undefined) {
        setIsDesertTransit(preset.isDesertTransit);
      }
    },
    [selectWilaya]
  );

  // Exécution de la simulation What-If côté serveur
  const runSimulation = useCallback(async () => {
    if (!selectedAssetId) {
      setErrorMessage('Aucun actif sélectionné pour la simulation.');
      return;
    }

    if (simulationAbortControllerRef.current) {
      simulationAbortControllerRef.current.abort();
    }
    const ac = new AbortController();
    simulationAbortControllerRef.current = ac;

    setIsSimulating(true);
    setErrorMessage(null);

    try {
      const simulated = await DigitalTwinClient.simulateTwin(
        selectedAssetId,
        {
          wilayaCode: selectedWilayaCode,
          climateSeverityMultiplier: climateMultiplier,
          driverAggressivenessMultiplier: driverMultiplier,
          isDesertTransitScenario: isDesertTransit,
        },
        sessionToken,
        ac.signal
      );
      setDigitalTwin(simulated);
      showNotification(
        `Simulation validée pour la Wilaya ${currentWilayaProfile.code} - ${currentWilayaProfile.name} (VHI: ${simulated.currentVhi}/100)`
      );
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[useDigitalTwinPage] Erreur simulation:', err);
        showNotification(msg || 'Erreur lors de la simulation.');
      }
    } finally {
      setIsSimulating(false);
    }
  }, [
    selectedAssetId,
    selectedWilayaCode,
    climateMultiplier,
    driverMultiplier,
    isDesertTransit,
    sessionToken,
    currentWilayaProfile,
    showNotification,
  ]);

  // Organe actif résolu
  const activeOrgan = useMemo(() => {
    if (!digitalTwin || !digitalTwin.organs || digitalTwin.organs.length === 0) {
      return null;
    }
    return digitalTwin.organs.find((o) => o.organ === activeOrganKey) || digitalTwin.organs[0];
  }, [digitalTwin, activeOrganKey]);

  // Réessai contextuel : recharge le jumeau actif sélectionné ou réinitialise
  const retry = useCallback(() => {
    if (selectedAssetId) {
      selectAsset(selectedAssetId);
    } else {
      loadInitialData();
    }
  }, [selectedAssetId, selectAsset, loadInitialData]);

  return {
    config,
    wilayas,
    currentWilayaProfile,
    assets,
    selectedAssetId,
    selectAsset,
    digitalTwin,
    activeOrganKey,
    activeOrgan,
    setActiveOrganKey,
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
    isLoading,
    isSimulating,
    errorMessage,
    notification,
    showNotification,
    retry,
  };
}

