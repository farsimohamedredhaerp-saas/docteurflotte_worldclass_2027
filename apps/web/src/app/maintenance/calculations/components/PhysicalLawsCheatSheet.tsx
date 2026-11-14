'use client';

import React from 'react';
import { IconCpu, IconActivity } from '@/components/navigation/TechIcons';

export function PhysicalLawsCheatSheet() {
  const laws = [
    {
      organ: 'ENGINE_OIL (Huile Moteur)',
      formula: 'k(T) = A · exp(-E_a / (R · T)) avec E_a/R = 6 500 K',
      lawName: 'Cinétique d’Oxydation d’Arrhenius',
      explanation: 'Modélise l’altération de la viscosité cinématique et la perte d’additifs anti-usure sous température d’huile élevée (>105°C), exacerbée par les chaleurs sahariennes.',
    },
    {
      organ: 'BATTERY_CRANKING (Batterie de Démarrage)',
      formula: 'V_min = V_ocv - I_crank · R_int > 9.60 V (seuil critique)',
      lawName: 'Chute de Tension CVHI & Impédance Interne',
      explanation: 'Détection du vieillissement par impédance interne lors de l’appel de courant de démarrage (SPN 168), prévenant les pannes d’immobilisation sur piste isolée.',
    },
    {
      organ: 'BRAKE_PADS (Plaquettes & Garnitures)',
      formula: 'W_dissipée = 1/2 · m · Δv² + m · g · sin(θ) · d',
      lawName: 'Loi Tribologique d’Archard & Compensation Dévers',
      explanation: 'Calcul déterministe de l’usure volumétrique des garnitures en intégrant l’énergie de freinage et la pente routière (compensation topographique Valhalla).',
    },
    {
      organ: 'COOLING_SYSTEM (Refroidissement & Culasse)',
      formula: 'ΔT_diff = |T_huile - T_eau| avec lissage EWMA',
      lawName: 'Modèle Différentiel Thermique EWMA',
      explanation: 'Surveillance de l’écart thermique entre fluide caloporteur et huile moteur pour anticiper le claquage de joint de culasse avant l’alerte tardive du tableau de bord.',
    },
    {
      organ: 'DPF_FILTER (Filtre à Particules FAP)',
      formula: 'ΔP_dpf = R_suie · Q_échappement / A_filtre',
      lawName: 'Bilan Massique d’Accumulation de Suie',
      explanation: 'Évaluation de la saturation en suie à partir du différentiel de pression d’échappement et des cycles de régénération thermique sous régime moteur soutenu.',
    },
    {
      organ: 'TRANSMISSION_DRIVETRAIN (Chaîne Cinématique)',
      formula: 'S_slip = (ω_in - i_ratio · ω_out) / ω_in',
      lawName: 'Micro-Glissement sous Couple J1939',
      explanation: 'Détection du patinage et de la dégradation du film d’huile de pont (80W90) croisant le régime d’arbre (SPN 191) et le couple délivré (SPN 524).',
    },
  ];

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconActivity size={18} className="text-sky-400" />
          Référentiel des 6 Lois Physiques Déterministes (Zéro Boîte Noire)
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
          Formules mathématiques explicables (XAI) opposables, calibrées sur les 58 Wilayas d'Algérie.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px',
        }}
      >
        {laws.map((l, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--df-bg-base)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase' }}>
              {l.organ}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
              {l.lawName}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                padding: '6px 8px',
                borderRadius: '6px',
                color: '#6ee7b7',
              }}
            >
              {l.formula}
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--df-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              {l.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

