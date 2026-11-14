'use client';

import React from 'react';
import {
  IconPlus,
  IconEdit,
  IconX,
  IconFuel,
  IconZap,
  IconThermometer,
  IconAlertOctagon,
  IconActivity,
  IconShieldCheck,
  IconCreditCard,
} from '@/components/navigation/TechIcons';
import { ModalErrorBoundary } from '@/components/ui/ModalErrorBoundary';
import { CONFIG_MODAL_TABS } from '../../constants';
import type { CreateDecisionConfigDto, ModalMode } from '../../types';

interface ConfigDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: ModalMode;
  formData: CreateDecisionConfigDto;
  setFormData: React.Dispatch<React.SetStateAction<CreateDecisionConfigDto>>;
  activeModalTab: number;
  setActiveModalTab: (tab: number) => void;
  isProcessing: boolean;
  onSave: (e: React.FormEvent) => void;
}

export function ConfigDraftModal({
  isOpen,
  onClose,
  modalMode,
  formData,
  setFormData,
  activeModalTab,
  setActiveModalTab,
  isProcessing,
  onSave,
}: ConfigDraftModalProps) {
  if (!isOpen) return null;

  const tabIcons: Record<number, React.ReactNode> = {
    0: <IconFuel size={14} />,
    1: <IconZap size={14} />,
    2: <IconThermometer size={14} />,
    3: <IconAlertOctagon size={14} />,
    4: <IconActivity size={14} />,
    5: <IconShieldCheck size={14} />,
    6: <IconCreditCard size={14} />,
  };

  return (
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
        <ModalErrorBoundary onReset={onClose}>
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
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer', padding: '4px' }}
              aria-label="Fermer"
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
            {CONFIG_MODAL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveModalTab(t.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: activeModalTab === t.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: activeModalTab === t.id ? '1px solid #818cf8' : '1px solid transparent',
                  color: activeModalTab === t.id ? '#fff' : 'var(--df-text-muted)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {tabIcons[t.id]} {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSave}>
            {/* Tab 0: Arrhenius */}
            {activeModalTab === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', background: 'var(--df-bg-surface-2)', padding: '10px 14px', borderRadius: '8px' }}>
                  Modélisation cinétique de dégradation de viscosité et d&apos;oxydation de l&apos;huile moteur en fonction de la température d&apos;huile et du ralenti prolongé.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-secondary)', marginBottom: '4px' }}>
                      Énergie d&apos;activation Ea / R (K)
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
                      Énergie d&apos;Usure par mm de Garniture (MJ/mm)
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
                      Contre-Pression d&apos;Échappement Critique (mbar)
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
                      Chute Brutale Siphon à l&apos;Arrêt (Litres)
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
                onClick={onClose}
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
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
