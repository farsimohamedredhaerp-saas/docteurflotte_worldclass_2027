'use client';

import React from 'react';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { IconCheck, IconDatabase } from '../../../components/navigation/TechIcons';
import { OemTemplateResultProps } from '../types';
import { NormalizedOEMTask } from '../../../lib/api-oem-scraper';

export function OemTemplateResult({
  template,
  savedSuccess,
  onSaveToPostgres,
}: OemTemplateResultProps) {
  return (
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--df-border-subtle)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Badge variant="primary" size="md">
              {template.asset_category}
            </Badge>
            <span
              style={{
                fontFamily: 'var(--df-font-mono, monospace)',
                fontSize: '0.85rem',
                color: 'var(--df-text-muted)',
              }}
            >
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
            onClick={onSaveToPostgres}
            disabled={savedSuccess}
          >
            {savedSuccess ? (
              <>
                <IconCheck size={14} className="inline mr-1" />
                Enregistré dans PostgreSQL
              </>
            ) : (
              <>
                <IconDatabase size={14} className="inline mr-1" />
                Sauvegarder dans Référentiel Local
              </>
            )}
          </Button>
        </div>
      </div>

      {/* CARTES DE MÉTRIQUES TECHNIQUES CONSTRUCTEUR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            background: 'var(--df-bg-surface-2)',
            padding: '1rem',
            borderRadius: 'var(--df-radius-md)',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--df-text-muted)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Capacité Carter Moteur
          </span>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--df-text-main)',
              marginTop: '0.25rem',
            }}
          >
            {template.oil_capacity_liters} Litres
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>Filtres inclus</span>
        </div>

        <div
          style={{
            background: 'var(--df-bg-surface-2)',
            padding: '1rem',
            borderRadius: 'var(--df-radius-md)',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--df-text-muted)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Norme & Viscosité Huile
          </span>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--df-text-main)',
              marginTop: '0.25rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={template.oil_norm_spec}
          >
            {template.oil_norm_spec}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>Spécification OEM</span>
        </div>

        <div
          style={{
            background: 'var(--df-bg-surface-2)',
            padding: '1rem',
            borderRadius: 'var(--df-radius-md)',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--df-text-muted)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Conso Réf. Route (Mode 0)
          </span>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--df-text-main)',
              marginTop: '0.25rem',
            }}
          >
            {template.ref_consumption_l_100km} L / 100 km
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--df-text-secondary)' }}>Estimation Sans Boîtier</span>
        </div>

        <div
          style={{
            background: 'var(--df-bg-surface-2)',
            padding: '1rem',
            borderRadius: 'var(--df-radius-md)',
            border: '1px solid var(--df-border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--df-text-muted)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Conso Réf. Horaire (Chantier)
          </span>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--df-text-main)',
              marginTop: '0.25rem',
            }}
          >
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
              <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-status-warning)' }}>
                Usage Sévère (Sahara / BTP)
              </th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--df-text-secondary)' }}>
                Main d&apos;Œuvre
              </th>
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
                <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{task.task_name}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div>
                    <strong>{task.normal_interval_km.toLocaleString('fr-DZ')} km</strong>
                  </div>
                  <div style={{ color: 'var(--df-text-muted)', fontSize: '0.75rem' }}>
                    {task.normal_interval_months} mois | {task.normal_interval_engine_hours} h
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--df-status-warning)' }}>
                  <div>
                    <strong>{task.severe_interval_km.toLocaleString('fr-DZ')} km</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                    {task.severe_interval_months} mois | {task.severe_interval_engine_hours} h
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>{task.standard_labor_minutes} min</td>
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
  );
}
