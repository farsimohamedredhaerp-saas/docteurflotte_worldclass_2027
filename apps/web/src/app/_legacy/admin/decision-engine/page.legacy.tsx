'use client';

import React, { useEffect, useState } from 'react';
import { AuthClient } from '@/lib/api-auth';
import { PlatformAdminClient } from '@/lib/api-platform-admin';
import {
  CreateDecisionConfigDto,
  DecisionEngineSimulationResult,
  PlatformConfigPublication,
  PlatformDecisionEngineConfig,
} from '@docteurflotte/contracts';
import {
  IconFuel,
  IconZap,
  IconThermometer,
  IconAlertOctagon,
  IconShieldCheck,
  IconAlertTriangle,
  IconCreditCard,
  IconPlus,
  IconFileText,
  IconCheck,
  IconEdit,
  IconX,
  IconActivity,
  IconSliders,
} from '@/components/navigation/TechIcons';

export default function AdminDecisionEnginePage() {
  const [configs, setConfigs] = useState<PlatformDecisionEngineConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
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
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [activeModalTab, setActiveModalTab] = useState<number>(0);
  const [formData, setFormData] = useState<CreateDecisionConfigDto>({
    version: '',
    scope_key: 'ALGERIA_CORE_DECISION',
    change_justification: '',
    scientific_validation_ref: '',
    arrhenius_activation_energy: 6500,
    arrhenius_ref_temp_c: 90,
    arrhenius_idle_degradation_factor: 1.8,
    battery_crit_voltage_mv_12v: 9600,
    battery_crit_voltage_mv_24v: 19200,
    battery_temp_comp_factor: 15,
    cooling_ewma_alpha: 0.15,
    cooling_overheat_threshold_c: 11,
    cooling_clogging_threshold_c: 7.5,
    cooling_thermostat_stuck_threshold_c: -12,
    brake_wear_energy_per_mm_mj: 25,
    brake_min_thickness_mm: 3,
    dpf_soot_limit_grams: 45,
    dpf_backpressure_limit_mbar: 300,
    fuel_siphon_stop_liters: 15,
    fuel_cusum_slack_liters: 0.6,
    fuel_cusum_alarm_ratio: 0.05,
    vhi_threshold_green: 80,
    vhi_threshold_orange: 50,
    inaction_risk_multiplier: 3.5,
  });

  // Activation Modal
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [activationJustification, setActivationJustification] = useState('');

  const loadData = () => {
    const session = AuthClient.getSession();
    if (!session.token) return;

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
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedConfig =
    configs.find((c) => c.id === selectedConfigId) ||
    configs.find((c) => c.is_active_publication) ||
    configs[0];

  // Open modal for new draft
  const handleOpenCreateModal = (baseConfig?: PlatformDecisionEngineConfig) => {
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
        version: `v2.1-DRAFT-${Date.now().toString().slice(-4)}`,
        scope_key: 'ALGERIA_CORE_DECISION',
        change_justification: 'Nouvelle configuration optimisée',
        scientific_validation_ref: '',
        arrhenius_activation_energy: 6500,
        arrhenius_ref_temp_c: 90,
        arrhenius_idle_degradation_factor: 1.8,
        battery_crit_voltage_mv_12v: 9600,
        battery_crit_voltage_mv_24v: 19200,
        battery_temp_comp_factor: 15,
        cooling_ewma_alpha: 0.15,
        cooling_overheat_threshold_c: 11,
        cooling_clogging_threshold_c: 7.5,
        cooling_thermostat_stuck_threshold_c: -12,
        brake_wear_energy_per_mm_mj: 25,
        brake_min_thickness_mm: 3,
        dpf_soot_limit_grams: 45,
        dpf_backpressure_limit_mbar: 300,
        fuel_siphon_stop_liters: 15,
        fuel_cusum_slack_liters: 0.6,
        fuel_cusum_alarm_ratio: 0.05,
        vhi_threshold_green: 80,
        vhi_threshold_orange: 50,
        inaction_risk_multiplier: 3.5,
      });
    }
    setModalMode('CREATE');
    setActiveModalTab(0);
    setIsModalOpen(true);
  };

  // Open modal for editing draft
  const handleOpenEditModal = (config: PlatformDecisionEngineConfig) => {
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
  };

  // Save form (Create or Update Draft)
  const handleSaveDraft = async (e: React.FormEvent) => {
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
  };

  // Approve Draft (Maker-Checker)
  const handleApproveDraft = async (configId: string, version: string) => {
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
  };

  // Activate Config
  const handleActivateSubmit = async (e: React.FormEvent) => {
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
  };

  // Rollback
  const handleRollback = async () => {
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
  };

  // Run Simulation Benchmark
  const handleRunSimulation = async (config: PlatformDecisionEngineConfig) => {
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
  };

  const modalTabs = [
    { label: '1. Arrhenius (Huile)', icon: <IconFuel size={14} /> },
    { label: '2. Batterie (CVHI)', icon: <IconZap size={14} /> },
    { label: '3. Refroidissement (EWMA)', icon: <IconThermometer size={14} /> },
    { label: '4. Freinage (Archard)', icon: <IconAlertOctagon size={14} /> },
    { label: '5. Colmatage (FAP)', icon: <IconActivity size={14} /> },
    { label: '6. Anti-Fraude (CUSUM)', icon: <IconShieldCheck size={14} /> },
    { label: '7. VHI & Risque Inaction', icon: <IconCreditCard size={14} /> },
  ];

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Gouvernance & Cycle de Vie du Moteur Décisionnel (6 Physiques)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Création de versions (Draft), calibration des 6 modèles déterministes, banc d’essai et activation transactionnelle.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenCreateModal()}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-accent-blue)',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconPlus size={14} />
            Nouvelle Version (Draft)
          </button>

          {selectedConfig && (
            <button
              onClick={() => handleOpenCreateModal(selectedConfig)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconFileText size={14} />
              Dupliquer la Version
            </button>
          )}

          <button
            onClick={handleRollback}
            disabled={isProcessing}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Rollback
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCheck size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Version Selector Bar */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-muted)' }}>
            VERSION INSPECTÉE :
          </span>
          <select
            value={selectedConfigId}
            onChange={(e) => setSelectedConfigId(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-main)',
              fontSize: '14px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {configs.map((c, idx) => (
              <option key={`${c.id}-${idx}`} value={c.id}>
                {c.version} — [{c.status}] {c.is_active_publication ? '(Active en Production)' : ''}
              </option>
            ))}
          </select>

          {selectedConfig && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor:
                  selectedConfig.status === 'APPROVED'
                    ? 'rgba(59, 130, 246, 0.15)'
                    : selectedConfig.is_active_publication
                    ? 'rgba(16, 185, 129, 0.15)'
                    : selectedConfig.status === 'DRAFT'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                color:
                  selectedConfig.status === 'APPROVED'
                    ? '#60a5fa'
                    : selectedConfig.is_active_publication
                    ? '#34d399'
                    : selectedConfig.status === 'DRAFT'
                    ? '#fbbf24'
                    : '#fca5a5',
                border: '1px solid currentColor',
              }}
            >
              {selectedConfig.is_active_publication ? '● PUBLICATION ACTIVE (PROD)' : `STATUT : ${selectedConfig.status}`}
            </span>
          )}
        </div>

        {/* Action Buttons for Selected Version */}
        {selectedConfig && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleRunSimulation(selectedConfig)}
              disabled={isSimulating}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid #818cf8',
                color: '#818cf8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSimulating ? (
                <>
                  <IconActivity size={14} className="inline animate-spin" /> Calcul en cours...
                </>
              ) : (
                <>
                  <IconActivity size={14} className="inline" /> Simuler sur Banc d’Essai
                </>
              )}
            </button>

            {selectedConfig.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => handleOpenEditModal(selectedConfig)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--df-bg-surface-2)',
                    border: '1px solid var(--df-border-subtle)',
                    color: 'var(--df-text-main)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconEdit size={14} /> Modifier les Paramètres
                </button>

                <button
                  onClick={() => handleApproveDraft(selectedConfig.id, selectedConfig.version)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid #3b82f6',
                    color: '#93c5fd',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconCheck size={14} /> Approuver (Maker-Checker)
                </button>
              </>
            )}

            {selectedConfig.status === 'APPROVED' && !selectedConfig.is_active_publication && (
              <button
                onClick={() => setIsActivateModalOpen(true)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconZap size={14} /> Activer en Production
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selected Version Meta & Hashes */}
      {selectedConfig && (
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)' }}>
              Auteur : <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.author_email}</strong>
              {selectedConfig.approved_by_email && (
                <> • Approuvé par : <strong style={{ color: '#38bdf8' }}>{selectedConfig.approved_by_email}</strong> ({selectedConfig.approved_at ? new Date(selectedConfig.approved_at).toLocaleDateString('fr-FR') : ''})</>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
              Créé le : {new Date(selectedConfig.created_at).toLocaleString('fr-FR')}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginBottom: '8px' }}>
            <strong>Justification :</strong> {selectedConfig.change_justification || 'Baseline initiale certifiée.'}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', fontFamily: 'monospace', background: 'var(--df-bg-surface-2)', padding: '8px 12px', borderRadius: '6px' }}>
            Empreinte Canonique SHA-256 : <span style={{ color: '#38bdf8' }}>{selectedConfig.canonical_content_hash || selectedConfig.config_hash}</span>
          </div>
        </div>
      )}

      {/* Physical Models Display Cards */}
      {selectedConfig && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {/* 1. Arrhenius Oil */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconFuel size={18} className="text-amber-500" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                1. Vieillissement Huile Moteur (Arrhenius)
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Énergie d'activation (Ea / R) :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.arrhenius_activation_energy} K</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Température de référence :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.arrhenius_ref_temp_c} °C</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Facteur pénalité ralenti :</span>
                <strong style={{ color: '#fbbf24' }}>×{selectedConfig.arrhenius_idle_degradation_factor}</strong>
              </div>
            </div>
          </div>

          {/* 2. Battery CVHI */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconZap size={18} className="text-emerald-500" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                2. Santé Batterie Cranking SOH (CVHI)
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Tension critique au démarrage 12V :</span>
                <strong style={{ color: '#fca5a5' }}>{selectedConfig.battery_crit_voltage_mv_12v} mV</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Tension critique au démarrage 24V :</span>
                <strong style={{ color: '#fca5a5' }}>{selectedConfig.battery_crit_voltage_mv_24v} mV</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Compensation thermique :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.battery_temp_comp_factor} mV / °C</strong>
              </div>
            </div>
          </div>

          {/* 3. Radiator Cooling EWMA */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconThermometer size={18} className="text-cyan-500" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                3. Refroidissement Radiateur (EWMA)
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Lissage EWMA (alpha) :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.cooling_ewma_alpha}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Seuil Surchauffe :</span>
                <strong style={{ color: '#fca5a5' }}>+{selectedConfig.cooling_overheat_threshold_c} °C</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Seuil Colmatage Calandre :</span>
                <strong style={{ color: '#fbbf24' }}>+{selectedConfig.cooling_clogging_threshold_c} °C</strong>
              </div>
            </div>
          </div>

          {/* 4. Brake Wear Archard */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconAlertOctagon size={18} className="text-rose-500" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                4. Usure Plaquettes & Disques (Archard)
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Énergie d'usure par mm :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.brake_wear_energy_per_mm_mj} MJ / mm</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Épaisseur minimale critique :</span>
                <strong style={{ color: '#fca5a5' }}>{selectedConfig.brake_min_thickness_mm} mm</strong>
              </div>
            </div>
          </div>

          {/* 5. DPF Soot */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconActivity size={18} className="text-indigo-500" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                5. Colmatage Filtre à Particules (FAP)
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Charge suies maximale :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.dpf_soot_limit_grams} g</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Contre-pression d'échappement :</span>
                <strong style={{ color: '#fca5a5' }}>{selectedConfig.dpf_backpressure_limit_mbar} mbar</strong>
              </div>
            </div>
          </div>

          {/* 6. Fuel Siphon CUSUM */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconShieldCheck size={18} className="text-amber-500" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                6. Détection Siphon & Vol Carburant (CUSUM)
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Chute brutale à l'arrêt :</span>
                <strong style={{ color: '#fca5a5' }}>&gt; {selectedConfig.fuel_siphon_stop_liters} L</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Tolérance CUSUM (slack k) :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{selectedConfig.fuel_cusum_slack_liters} L</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Risque Inaction Multiplicateur :</span>
                <strong style={{ color: '#38bdf8' }}>×{selectedConfig.inaction_risk_multiplier}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Result Drawer / Panel */}
      {simulationResult && (
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '2px solid #818cf8',
            marginBottom: '32px',
            boxShadow: 'var(--df-shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconActivity size={20} className="text-indigo-400" />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--df-text-main)' }}>
                Résultats du Banc d'Essai Physique sur Véhicules Étalons Algérie
              </h3>
            </div>
            <button
              onClick={() => setSimulationResult(null)}
              style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <IconX size={14} /> Fermer
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {simulationResult.benchmarks.map((b, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#38bdf8', marginBottom: '4px' }}>
                  {b.vehicleModel}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '12px' }}>
                  Code Moteur : {b.engineCode} • Catégorie : {b.category}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>Usure Huile à 110°C (100 km) :</span>
                    <strong style={{ color: '#fbbf24' }}>{b.arrheniusOilEquivalentKmAt110C} km eq.</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>Chute Démarrage à -5°C :</span>
                    <strong style={{ color: '#fca5a5' }}>{b.batteryCrankingDropAtMinus5C_mV} mV</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>Seuil Siphon Détectable :</span>
                    <strong style={{ color: 'var(--df-text-main)' }}>{b.fuelSiphonDetectionThresholdLiters} L</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>VHI Santé Projeté :</span>
                    <strong style={{ color: '#34d399' }}>{b.projectedVhiScore} / 100</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '6px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--df-text-muted)' }}>Risque Inaction Financier :</span>
                    <strong style={{ color: '#f87171' }}>{b.projectedInactionRiskDzd.toLocaleString('fr-FR')} DZD</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications History Ledger */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '16px' }}>
        Historique Immuable des Publications & Rollbacks (Ledger)
      </h2>

      <div style={{ borderRadius: '12px', border: '1px solid var(--df-border-subtle)', backgroundColor: 'var(--df-bg-surface-1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ÉVÉNEMENT</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>VERSION</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>ACTEUR</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>DATE D'EFFET</th>
              <th style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>JUSTIFICATION</th>
            </tr>
          </thead>
          <tbody>
            {publications.map((p, idx) => (
              <tr key={p.id ? `${p.id}-${idx}` : `pub-${idx}`} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor:
                        p.event_type === 'PUBLICATION_ACTIVATE'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                      color:
                        p.event_type === 'PUBLICATION_ACTIVATE'
                          ? '#34d399'
                          : '#fca5a5',
                    }}
                  >
                    {p.event_type}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--df-text-main)' }}>
                  {p.version}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--df-text-secondary)' }}>
                  {p.published_by}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--df-text-muted)' }}>
                  {new Date(p.effective_from).toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--df-text-secondary)' }}>
                  {p.justification || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Draft Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--df-bg-surface-1)',
              borderRadius: '16px',
              border: '1px solid var(--df-border-subtle)',
              padding: '28px',
              width: '100%',
              maxWidth: '780px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--df-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {modalMode === 'CREATE' ? (
                    <>
                      <IconPlus size={18} className="text-emerald-400" /> Créer une Nouvelle Version Algorithmique (DRAFT)
                    </>
                  ) : (
                    <>
                      <IconEdit size={18} className="text-blue-400" /> Modifier la Version Brouillon : {formData.version}
                    </>
                  )}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', marginTop: '4px' }}>
                  Scope : {formData.scope_key} • Mode Brouillon Immuable dès Approbation
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Version & Justification Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Numéro de Version
                </label>
                <input
                  type="text"
                  disabled={modalMode === 'EDIT'}
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px', fontWeight: 700 }}
                  placeholder="ex: v2.1-ALGERIA-HIGH-HEAT"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Référence Scientifique / Étalonnage
                </label>
                <input
                  type="text"
                  value={formData.scientific_validation_ref || ''}
                  onChange={(e) => setFormData({ ...formData, scientific_validation_ref: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                  placeholder="ex: SAE J300 / Arrhenius API CI-4"
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                Justification Métier du Changement (Obligatoire pour audit trail)
              </label>
              <textarea
                required
                rows={2}
                value={formData.change_justification}
                onChange={(e) => setFormData({ ...formData, change_justification: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                placeholder="Expliquez pourquoi ces nouveaux seuils sont introduits..."
              />
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', borderBottom: '1px solid var(--df-border-subtle)', marginBottom: '20px', paddingBottom: '4px' }}>
              {modalTabs.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveModalTab(idx)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: activeModalTab === idx ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: activeModalTab === idx ? '1px solid #818cf8' : '1px solid transparent',
                    color: activeModalTab === idx ? '#fff' : 'var(--df-text-muted)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveDraft}>
              {/* Tab 0: Arrhenius */}
              {activeModalTab === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', background: 'var(--df-bg-surface-2)', padding: '10px 14px', borderRadius: '8px' }}>
                    Modélisation cinétique de dégradation de viscosité et d'oxydation de l'huile moteur en fonction de la température d'huile et du ralenti prolongé.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Énergie d'activation Ea / R (K)
                      </label>
                      <input
                        type="number"
                        min="3000"
                        max="12000"
                        value={formData.arrhenius_activation_energy}
                        onChange={(e) => setFormData({ ...formData, arrhenius_activation_energy: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Température de référence (°C)
                      </label>
                      <input
                        type="number"
                        min="70"
                        max="110"
                        value={formData.arrhenius_ref_temp_c}
                        onChange={(e) => setFormData({ ...formData, arrhenius_ref_temp_c: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                      Facteur de pénalité de ralenti prolongé (avec climatisation)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="3.0"
                      value={formData.arrhenius_idle_degradation_factor}
                      onChange={(e) => setFormData({ ...formData, arrhenius_idle_degradation_factor: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 1: Battery */}
              {activeModalTab === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', background: 'var(--df-bg-surface-2)', padding: '10px 14px', borderRadius: '8px' }}>
                    Indicateur de santé au démarrage (CVHI) basé sur la chute de tension minimale au lancement démarreur et compensation thermique NTC.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Tension Critique 12V au Démarrage (mV)
                      </label>
                      <input
                        type="number"
                        min="8000"
                        max="11000"
                        value={formData.battery_crit_voltage_mv_12v}
                        onChange={(e) => setFormData({ ...formData, battery_crit_voltage_mv_12v: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Tension Critique 24V au Démarrage (mV)
                      </label>
                      <input
                        type="number"
                        min="16000"
                        max="22000"
                        value={formData.battery_crit_voltage_mv_24v}
                        onChange={(e) => setFormData({ ...formData, battery_crit_voltage_mv_24v: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                      Facteur de Compensation Thermique (mV / °C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="30"
                      value={formData.battery_temp_comp_factor}
                      onChange={(e) => setFormData({ ...formData, battery_temp_comp_factor: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Cooling */}
              {activeModalTab === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Facteur de Lissage EWMA (alpha)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="0.5"
                        value={formData.cooling_ewma_alpha}
                        onChange={(e) => setFormData({ ...formData, cooling_ewma_alpha: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Seuil Surchauffe Delta T (°C)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.cooling_overheat_threshold_c}
                        onChange={(e) => setFormData({ ...formData, cooling_overheat_threshold_c: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Seuil Colmatage Calandre (°C)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.cooling_clogging_threshold_c}
                        onChange={(e) => setFormData({ ...formData, cooling_clogging_threshold_c: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Seuil Calorstat Bloqué Ouvert (°C)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.cooling_thermostat_stuck_threshold_c}
                        onChange={(e) => setFormData({ ...formData, cooling_thermostat_stuck_threshold_c: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Brakes */}
              {activeModalTab === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Énergie d'Usure par mm de Garniture (MJ/mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.brake_wear_energy_per_mm_mj}
                        onChange={(e) => setFormData({ ...formData, brake_wear_energy_per_mm_mj: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Épaisseur Minimale Critique Légale (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.brake_min_thickness_mm}
                        onChange={(e) => setFormData({ ...formData, brake_min_thickness_mm: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: DPF */}
              {activeModalTab === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Charge de Suies Maximale (g)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.dpf_soot_limit_grams}
                        onChange={(e) => setFormData({ ...formData, dpf_soot_limit_grams: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Contre-Pression d'Échappement Critique (mbar)
                      </label>
                      <input
                        type="number"
                        step="10"
                        value={formData.dpf_backpressure_limit_mbar}
                        onChange={(e) => setFormData({ ...formData, dpf_backpressure_limit_mbar: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Fuel CUSUM */}
              {activeModalTab === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Chute Brutale Siphon à l'Arrêt (Litres)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.fuel_siphon_stop_liters}
                        onChange={(e) => setFormData({ ...formData, fuel_siphon_stop_liters: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Tolérance CUSUM Slack k (Litres)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={formData.fuel_cusum_slack_liters}
                        onChange={(e) => setFormData({ ...formData, fuel_cusum_slack_liters: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: VHI & Inaction Risk */}
              {activeModalTab === 6 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Multiplicateur Coût Risque Inaction
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.inaction_risk_multiplier}
                        onChange={(e) => setFormData({ ...formData, inaction_risk_multiplier: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                        Seuil VHI Vert (Bonne santé)
                      </label>
                      <input
                        type="number"
                        value={formData.vhi_threshold_green}
                        onChange={(e) => setFormData({ ...formData, vhi_threshold_green: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--df-border-subtle)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', background: 'none', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '13px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{ padding: '9px 20px', borderRadius: '8px', backgroundColor: 'var(--df-accent-blue)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  {isProcessing ? 'Enregistrement...' : modalMode === 'CREATE' ? 'Créer le Brouillon (DRAFT)' : 'Mettre à Jour le Brouillon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activation Modal */}
      {isActivateModalOpen && selectedConfig && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--df-bg-surface-1)',
              borderRadius: '16px',
              border: '1px solid var(--df-border-subtle)',
              padding: '28px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--df-shadow-lg)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: 'var(--df-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconZap size={18} className="text-emerald-400" /> Activation en Production : {selectedConfig.version}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Vous êtes sur le point d'activer cette configuration au statut <strong>APPROVED</strong> en tant que nouvelle baseline active. Cette opération clôturera automatiquement la publication active précédente dans le grand livre append-only et notifiera le bus Outbox pour invalidation des caches runtime.
            </p>

            <form onSubmit={handleActivateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                  Motif d'Ingénierie pour la Piste d'Audit (Obligatoire)
                </label>
                <textarea
                  required
                  rows={3}
                  value={activationJustification}
                  onChange={(e) => setActivationJustification(e.target.value)}
                  placeholder="ex: Mise en production de la baseline validée par le comité technique pour le climat estival saharien..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-main)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsActivateModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', background: 'none', border: '1px solid var(--df-border-subtle)', color: 'var(--df-text-muted)', fontSize: '13px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{ padding: '9px 20px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                >
                  {isProcessing ? 'Activation...' : 'Confirmer & Publier en Prod'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
