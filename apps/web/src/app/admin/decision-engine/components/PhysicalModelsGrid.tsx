'use client';

import React from 'react';
import {
  IconFuel,
  IconZap,
  IconThermometer,
  IconAlertOctagon,
  IconActivity,
  IconShieldCheck,
} from '@/components/navigation/TechIcons';
import type { PlatformDecisionEngineConfig } from '../types';

interface PhysicalModelsGridProps {
  config: PlatformDecisionEngineConfig;
}

export function PhysicalModelsGrid({ config }: PhysicalModelsGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}
    >
      {/* 1. Arrhenius Oil */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconFuel size={18} className="text-amber-500" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
            1. Vieillissement Huile Moteur (Arrhenius)
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Énergie d&apos;activation (Ea / R) :</span>
            <strong style={{ color: 'var(--df-text-main)' }}>{config.arrhenius_activation_energy} K</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Température de référence :</span>
            <strong style={{ color: 'var(--df-text-main)' }}>{config.arrhenius_ref_temp_c} °C</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Facteur pénalité ralenti :</span>
            <strong style={{ color: '#fbbf24' }}>×{config.arrhenius_idle_degradation_factor}</strong>
          </div>
        </div>
      </div>

      {/* 2. Battery CVHI */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconZap size={18} className="text-emerald-500" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
            2. Santé Batterie Cranking SOH (CVHI)
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Tension critique au démarrage 12V :</span>
            <strong style={{ color: '#fca5a5' }}>{config.battery_crit_voltage_mv_12v} mV</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Tension critique au démarrage 24V :</span>
            <strong style={{ color: '#fca5a5' }}>{config.battery_crit_voltage_mv_24v} mV</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Compensation thermique :</span>
            <strong style={{ color: 'var(--df-text-main)' }}>{config.battery_temp_comp_factor} mV / °C</strong>
          </div>
        </div>
      </div>

      {/* 3. Radiator Cooling EWMA */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconThermometer size={18} className="text-cyan-500" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
            3. Refroidissement Radiateur (EWMA)
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Lissage EWMA (alpha) :</span>
            <strong style={{ color: 'var(--df-text-main)' }}>{config.cooling_ewma_alpha}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Seuil Surchauffe :</span>
            <strong style={{ color: '#fca5a5' }}>+{config.cooling_overheat_threshold_c} °C</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Seuil Colmatage Calandre :</span>
            <strong style={{ color: '#fbbf24' }}>+{config.cooling_clogging_threshold_c} °C</strong>
          </div>
        </div>
      </div>

      {/* 4. Brake Wear Archard */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconAlertOctagon size={18} className="text-rose-500" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
            4. Usure Plaquettes &amp; Disques (Archard)
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Énergie d&apos;usure par mm :</span>
            <strong style={{ color: 'var(--df-text-main)' }}>{config.brake_wear_energy_per_mm_mj} MJ / mm</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Épaisseur minimale critique :</span>
            <strong style={{ color: '#fca5a5' }}>{config.brake_min_thickness_mm} mm</strong>
          </div>
        </div>
      </div>

      {/* 5. DPF Soot */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconActivity size={18} className="text-indigo-500" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
            5. Colmatage Filtre à Particules (FAP)
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Charge suies maximale :</span>
            <strong style={{ color: 'var(--df-text-main)' }}>{config.dpf_soot_limit_grams} g</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Contre-pression d&apos;échappement :</span>
            <strong style={{ color: '#fca5a5' }}>{config.dpf_backpressure_limit_mbar} mbar</strong>
          </div>
        </div>
      </div>

      {/* 6. Fuel Siphon CUSUM */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconShieldCheck size={18} className="text-amber-500" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
            6. Détection Siphon &amp; Vol Carburant (CUSUM)
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Chute brutale à l&apos;arrêt :</span>
            <strong style={{ color: '#fca5a5' }}>&gt; {config.fuel_siphon_stop_liters} L</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Tolérance CUSUM (slack k) :</span>
            <strong style={{ color: 'var(--df-text-main)' }}>{config.fuel_cusum_slack_liters} L</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--df-text-muted)' }}>Risque Inaction Multiplicateur :</span>
            <strong style={{ color: '#38bdf8' }}>×{config.inaction_risk_multiplier}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
