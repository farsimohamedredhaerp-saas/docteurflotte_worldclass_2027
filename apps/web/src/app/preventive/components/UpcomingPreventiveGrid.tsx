'use client';

import React from 'react';
import {
  IconSearch,
  IconWrench,
  IconEdit,
  IconTrash,
  IconClock,
  IconCheck,
} from '@/components/navigation/TechIcons';
import type { UpcomingPreventiveDue } from '../types';

interface UpcomingPreventiveGridProps {
  upcoming: UpcomingPreventiveDue[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedUrgency: string;
  onUrgencyChange: (urg: string) => void;
  onCreateWorkOrder: (plate: string, template: string) => void;
  onEditDue: (due: UpcomingPreventiveDue) => void;
  onDeleteDue: (due: UpcomingPreventiveDue) => void;
}

export function UpcomingPreventiveGrid({
  upcoming,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedUrgency,
  onUrgencyChange,
  onCreateWorkOrder,
  onEditDue,
  onDeleteDue,
}: UpcomingPreventiveGridProps) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconClock size={18} className="text-amber-400" />
            Échéancier des Révisions & Vidanges Imminentes (Flotte Active)
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--df-text-secondary)', margin: '3px 0 0 0' }}>
            Suivi des compteurs odométriques et compteurs horaires moteur en temps réel.
          </p>
        </div>
        <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
          {upcoming.length} Véhicules en Suivi
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Rechercher par immatriculation, modèle, dépôt..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              borderRadius: '6px',
              border: '1px solid var(--df-border-medium)',
              background: 'var(--df-bg-base)',
              color: '#fff',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={13} />
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'Toutes Échéances' },
            { id: 'URGENT', label: 'Urgent (< 500 km / 25 h)' },
            { id: 'WARNING', label: 'À Surveiller' },
            { id: 'NOMINAL', label: 'Nominal' },
          ].map((u) => (
            <button
              key={u.id}
              onClick={() => onUrgencyChange(u.id)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: selectedUrgency === u.id ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
                background: selectedUrgency === u.id ? 'rgba(99, 102, 241, 0.2)' : 'var(--df-bg-surface-2)',
                color: selectedUrgency === u.id ? '#fff' : 'var(--df-text-muted)',
                fontSize: '11.5px',
                fontWeight: selectedUrgency === u.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Upcoming Dues */}
      {isLoading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--df-text-muted)', fontSize: '13px' }}>
          Chargement de l'échéancier prévisionnel...
        </div>
      ) : upcoming.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--df-text-muted)', fontSize: '13px' }}>
          Aucune échéance préventive imminente pour le parc sélectionné.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--df-border-medium)', color: 'var(--df-text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Véhicule / Immat</th>
                <th style={{ padding: '8px 12px' }}>Modèle & Affectation</th>
                <th style={{ padding: '8px 12px' }}>Gabarit Préventif</th>
                <th style={{ padding: '8px 12px' }}>Compteur Actuel / Échéance</th>
                <th style={{ padding: '8px 12px' }}>Progression</th>
                <th style={{ padding: '8px 12px' }}>Urgence</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((due) => {
                const urgencyColor =
                  due.urgency === 'URGENT'
                    ? '#EF4444'
                    : due.urgency === 'WARNING'
                    ? '#F59E0B'
                    : '#10B981';

                return (
                  <tr key={due.id} style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#fff' }}>
                      {due.registrationNumber}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{due.makeModel}</div>
                      <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>{due.assignedSite}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#a5b4fc', fontWeight: 600 }}>
                      {due.templateName}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace" }}>
                      <div>{due.currentCounter.toLocaleString('fr-FR')} / {due.dueCounter.toLocaleString('fr-FR')} {due.unit}</div>
                      <div style={{ fontSize: '11px', color: urgencyColor, fontWeight: 700 }}>
                        {due.remainingCounter > 0 ? `Reste ${due.remainingCounter.toLocaleString('fr-FR')} ${due.unit}` : 'Dépassé !'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', width: '130px' }}>
                      <div style={{ background: 'var(--df-bg-base)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div
                          style={{
                            background: urgencyColor,
                            width: `${due.progressPercent}%`,
                            height: '100%',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--df-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {due.progressPercent}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: `${urgencyColor}18`,
                          color: urgencyColor,
                          border: `1px solid ${urgencyColor}35`,
                        }}
                      >
                        {due.urgency}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => onCreateWorkOrder(due.registrationNumber, due.templateName)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#7dd3fc',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <IconWrench size={11} />
                          <span>Déclencher OT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditDue(due)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--df-border-subtle)',
                            color: 'var(--df-text-muted)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <IconEdit size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDue(due)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <IconTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

