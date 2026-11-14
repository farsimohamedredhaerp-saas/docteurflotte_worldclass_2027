'use client';

import React from 'react';
import {
  IconWrench,
  IconShieldCheck,
  IconPlus,
} from '@/components/navigation/TechIcons';
import type { ClimateZone } from '../types';

interface PreventiveHeaderProps {
  climateZone: ClimateZone;
  onClimateZoneChange: (zone: ClimateZone) => void;
  onOpenAddTemplate: () => void;
  onOpenAddDue: () => void;
}

export function PreventiveHeader({
  climateZone,
  onClimateZoneChange,
  onOpenAddTemplate,
  onOpenAddDue,
}: PreventiveHeaderProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 1) 100%)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '36px 24px 28px',
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                MAINTENANCE 5.0 • OEM-FIRST
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Calibrage Bioclimatique 58 Wilayas
              </span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
              Plans Préventifs Constructeurs & Échéancier Flotte
            </h1>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0, maxWidth: '820px', lineHeight: 1.5 }}>
              Intervalles de révision constructeurs (Renault Trucks, Scania, Caterpillar, Shacman, Toyota) ajustés aux conditions sévères sahariennes (chaleur 49°C, silice abrasive, ralenti de chantier).
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={onOpenAddTemplate}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconPlus size={14} />
              <span>Nouveau Gabarit OEM</span>
            </button>

            <button
              onClick={onOpenAddDue}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <IconWrench size={14} />
              <span>Ajouter Échéance Véhicule</span>
            </button>
          </div>
        </div>

        {/* Climate Zone Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '22px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Zone Bioclimatique d'Exploitation :</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'TELL', label: '1. Tell Côtier & Nord (Facteur 0.90 - Humidité & Embouteillages)' },
              { id: 'PLATEAUS', label: '2. Hauts-Plateaux (Facteur 0.78 - Cols & Poussière)' },
              { id: 'SAHARA', label: '3. Sahara Profond (Facteur 0.65 - Canicule 49°C & Silice)' },
            ].map((zone) => (
              <button
                key={zone.id}
                onClick={() => onClimateZoneChange(zone.id as ClimateZone)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: climateZone === zone.id ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: climateZone === zone.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: climateZone === zone.id ? '#fff' : '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: climateZone === zone.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {zone.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
