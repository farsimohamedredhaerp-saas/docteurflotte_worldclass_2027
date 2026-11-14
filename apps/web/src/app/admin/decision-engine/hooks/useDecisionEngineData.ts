'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthClient } from '@/lib/api-auth';
import { PlatformAdminClient } from '@/lib/api-platform-admin';
import type {
  CreateDecisionConfigDto,
  DecisionEngineSimulationResult,
  PlatformConfigPublication,
  PlatformDecisionEngineConfig,
  ModalMode,
} from '../types';
import { DEFAULT_CONFIG_FORM_DATA } from '../constants';

export function useDecisionEngineData(
  selectedConfigId: string,
  setSelectedConfigId: (id: string) => void
) {
  const [configs, setConfigs] = useState<PlatformDecisionEngineConfig[]>([]);
  const [activePub, setActivePub] = useState<PlatformConfigPublication | null>(null);
  const [publications, setPublications] = useState<PlatformConfigPublication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulation state
  const [simulationResult, setSimulationResult] = useState<DecisionEngineSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('CREATE');
  const [activeModalTab, setActiveModalTab] = useState<number>(0);
  const [formData, setFormData] = useState<CreateDecisionConfigDto>(DEFAULT_CONFIG_FORM_DATA);

  // Activation Modal
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [activationJustification, setActivationJustification] = useState('');

  const loadData = useCallback(() => {
    const session = AuthClient.getSession();
    if (!session.token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([
      PlatformAdminClient.getDecisionConfigs(session.token),
      PlatformAdminClient.getActivePublication(session.token),
      PlatformAdminClient.getPublications(session.token),
    ])
      .then(([cfgList, actPub, pubList]) => {
        const uniqueConfigs = Array.from(new Map((cfgList || []).map((c) => [c.id, c])).values());
        const uniquePubs = Array.from(new Map((pubList || []).map((p) => [p.id, p])).values());
        setConfigs(uniqueConfigs);
        setActivePub(actPub);
        setPublications(uniquePubs);
        if (uniqueConfigs.length > 0 && !selectedConfigId) {
          const activeCfg = uniqueConfigs.find((c) => c.is_active_publication) || uniqueConfigs[0];
          setSelectedConfigId(activeCfg.id);
        }
      })
      .catch((err) => {
        setError(err.message || 'Erreur lors du chargement des configurations');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedConfigId, setSelectedConfigId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedConfig = useMemo(() => {
    return (
      configs.find((c) => c.id === selectedConfigId) ||
      configs.find((c) => c.is_active_publication) ||
      configs[0] ||
      null
    );
  }, [configs, selectedConfigId]);

  // Open modal for new draft
  const handleOpenCreateModal = useCallback((baseConfig?: PlatformDecisionEngineConfig) => {
    if (baseConfig) {
      setFormData({
        version: `${baseConfig.version}-rev-${Date.now().toString().slice(-4)}`,
        scope_key: baseConfig.scope_key || 'ALGERIA_CORE_DECISION',
        change_justification: `Variante basée sur ${baseConfig.version}`,
        scientific_validation_ref: baseConfig.scientific_validation_ref || '',
        arrhenius_activation_energy: baseConfig.arrhenius_activation_energy,
        arrhenius_ref_temp_c: baseConfig.arrhenius_ref_temp_c,
        arrhenius_idle_degradation_factor: baseConfig.arrhenius_idle_degradation_factor,
        battery_crit_voltage_mv_12v: baseConfig.battery_crit_voltage_mv_12v,
        battery_crit_voltage_mv_24v: baseConfig.battery_crit_voltage_mv_24v,
        battery_temp_comp_factor: baseConfig.battery_temp_comp_factor,
        cooling_ewma_alpha: baseConfig.cooling_ewma_alpha,
        cooling_overheat_threshold_c: baseConfig.cooling_overheat_threshold_c,
        cooling_clogging_threshold_c: baseConfig.cooling_clogging_threshold_c,
        cooling_thermostat_stuck_threshold_c: baseConfig.cooling_thermostat_stuck_threshold_c,
        brake_wear_energy_per_mm_mj: baseConfig.brake_wear_energy_per_mm_mj,
        brake_min_thickness_mm: baseConfig.brake_min_thickness_mm,
        dpf_soot_limit_grams: baseConfig.dpf_soot_limit_grams,
        dpf_backpressure_limit_mbar: baseConfig.dpf_backpressure_limit_mbar,
        fuel_siphon_stop_liters: baseConfig.fuel_siphon_stop_liters,
        fuel_cusum_slack_liters: baseConfig.fuel_cusum_slack_liters,
        fuel_cusum_alarm_ratio: baseConfig.fuel_cusum_alarm_ratio,
        vhi_threshold_green: baseConfig.vhi_threshold_green,
        vhi_threshold_orange: baseConfig.vhi_threshold_orange,
        inaction_risk_multiplier: baseConfig.inaction_risk_multiplier,
      });
    } else {
      setFormData({
        ...DEFAULT_CONFIG_FORM_DATA,
        version: `v2.1-DRAFT-${Date.now().toString().slice(-4)}`,
      });
    }
    setModalMode('CREATE');
    setActiveModalTab(0);
    setIsModalOpen(true);
  }, []);

  // Open modal for editing draft
  const handleOpenEditModal = useCallback((config: PlatformDecisionEngineConfig) => {
    setFormData({
      version: config.version,
      scope_key: config.scope_key,
      change_justification: config.change_justification || '',
      scientific_validation_ref: config.scientific_validation_ref || '',
      arrhenius_activation_energy: config.arrhenius_activation_energy,
      arrhenius_ref_temp_c: config.arrhenius_ref_temp_c,
      arrhenius_idle_degradation_factor: config.arrhenius_idle_degradation_factor,
      battery_crit_voltage_mv_12v: config.battery_crit_voltage_mv_12v,
      battery_crit_voltage_mv_24v: config.battery_crit_voltage_mv_24v,
      battery_temp_comp_factor: config.battery_temp_comp_factor,
      cooling_ewma_alpha: config.cooling_ewma_alpha,
      cooling_overheat_threshold_c: config.cooling_overheat_threshold_c,
      cooling_clogging_threshold_c: config.cooling_clogging_threshold_c,
      cooling_thermostat_stuck_threshold_c: config.cooling_thermostat_stuck_threshold_c,
      brake_wear_energy_per_mm_mj: config.brake_wear_energy_per_mm_mj,
      brake_min_thickness_mm: config.brake_min_thickness_mm,
      dpf_soot_limit_grams: config.dpf_soot_limit_grams,
      dpf_backpressure_limit_mbar: config.dpf_backpressure_limit_mbar,
      fuel_siphon_stop_liters: config.fuel_siphon_stop_liters,
      fuel_cusum_slack_liters: config.fuel_cusum_slack_liters,
      fuel_cusum_alarm_ratio: config.fuel_cusum_alarm_ratio,
      vhi_threshold_green: config.vhi_threshold_green,
      vhi_threshold_orange: config.vhi_threshold_orange,
      inaction_risk_multiplier: config.inaction_risk_multiplier,
    });
    setModalMode('EDIT');
    setActiveModalTab(0);
    setIsModalOpen(true);
  }, []);

  // Save form (Create or Update Draft)
  const handleSaveDraft = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const session = AuthClient.getSession();
      if (!session.token) return;

      setIsProcessing(true);
      setError(null);
      setActionSuccess(null);

      try {
        if (modalMode === 'CREATE') {
          const created = await PlatformAdminClient.createDecisionConfigDraft(formData, session.token);
          setActionSuccess(`Version brouillon ${created.version} créée avec succès.`);
          setIsModalOpen(false);
          setSelectedConfigId(created.id);
          loadData();
        } else {
          if (!selectedConfig) return;
          const updated = await PlatformAdminClient.updateDecisionConfigDraft(
            selectedConfig.id,
            formData,
            session.token
          );
          setActionSuccess(`Version ${updated.version} mise à jour avec succès.`);
          setIsModalOpen(false);
          loadData();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsProcessing(false);
      }
    },
    [formData, loadData, modalMode, selectedConfig, setSelectedConfigId]
  );

  // Approve Draft (Maker-Checker)
  const handleApproveDraft = useCallback(
    async (configId: string, version: string) => {
      if (!confirm(`Confirmez-vous l'approbation Maker-Checker de la version ${version} ?`)) return;

      const session = AuthClient.getSession();
      if (!session.token) return;

      setIsProcessing(true);
      setError(null);
      setActionSuccess(null);

      try {
        const approved = await PlatformAdminClient.approveDecisionConfig(configId, session.token);
        setActionSuccess(`Version ${approved.version} approuvée (Statut : APPROVED). Prête pour activation.`);
        loadData();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsProcessing(false);
      }
    },
    [loadData]
  );

  // Activate Config
  const handleActivateSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedConfig) return;

      const session = AuthClient.getSession();
      if (!session.token) return;

      setIsProcessing(true);
      setError(null);
      setActionSuccess(null);

      try {
        const res = await PlatformAdminClient.activateConfig(
          selectedConfig.id,
          session.token,
          activationJustification || 'Activation SuperAdmin'
        );
        setActionSuccess(`Publication réussie en production ! Version active : ${res.version}.`);
        setIsActivateModalOpen(false);
        setActivationJustification('');
        loadData();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsProcessing(false);
      }
    },
    [activationJustification, loadData, selectedConfig]
  );

  // Rollback
  const handleRollback = useCallback(async () => {
    if (!confirm('Confirmez-vous le ROLLBACK vers la publication précédente ?')) return;

    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsProcessing(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await PlatformAdminClient.rollbackConfig(
        session.token,
        'Rollback manuel déclenché depuis la console SuperAdmin'
      );
      setActionSuccess(`Rollback réussi : version active rétablie (${res.version}).`);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  }, [loadData]);

  // Run Simulation Benchmark
  const handleRunSimulation = useCallback(
    async (config: PlatformDecisionEngineConfig) => {
      const session = AuthClient.getSession();
      if (!session.token) return;

      setIsSimulating(true);
      setError(null);

      try {
        const sim = await PlatformAdminClient.simulateDecisionConfig(
          {
            arrhenius_activation_energy: config.arrhenius_activation_energy,
            arrhenius_ref_temp_c: config.arrhenius_ref_temp_c,
            arrhenius_idle_degradation_factor: config.arrhenius_idle_degradation_factor,
            battery_crit_voltage_mv_12v: config.battery_crit_voltage_mv_12v,
            battery_crit_voltage_mv_24v: config.battery_crit_voltage_mv_24v,
            battery_temp_comp_factor: config.battery_temp_comp_factor,
            cooling_ewma_alpha: config.cooling_ewma_alpha,
            cooling_overheat_threshold_c: config.cooling_overheat_threshold_c,
            cooling_clogging_threshold_c: config.cooling_clogging_threshold_c,
            brake_wear_energy_per_mm_mj: config.brake_wear_energy_per_mm_mj,
            brake_min_thickness_mm: config.brake_min_thickness_mm,
            dpf_soot_limit_grams: config.dpf_soot_limit_grams,
            fuel_siphon_stop_liters: config.fuel_siphon_stop_liters,
            fuel_cusum_slack_liters: config.fuel_cusum_slack_liters,
            inaction_risk_multiplier: config.inaction_risk_multiplier,
          },
          session.token
        );
        setSimulationResult(sim);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Échec simulation : ${msg}`);
      } finally {
        setIsSimulating(false);
      }
    },
    []
  );

  return {
    configs,
    selectedConfig,
    activePub,
    publications,
    isLoading,
    error,
    setError,
    actionSuccess,
    setActionSuccess,
    isProcessing,
    simulationResult,
    setSimulationResult,
    isSimulating,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    activeModalTab,
    setActiveModalTab,
    formData,
    setFormData,
    isActivateModalOpen,
    setIsActivateModalOpen,
    activationJustification,
    setActivationJustification,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveDraft,
    handleApproveDraft,
    handleActivateSubmit,
    handleRollback,
    handleRunSimulation,
  };
}
