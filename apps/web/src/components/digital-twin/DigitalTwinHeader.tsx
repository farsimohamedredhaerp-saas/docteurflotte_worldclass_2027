import React from 'react';
import Link from 'next/link';
import { Asset } from '@docteurflotte/contracts';
import { ROUTES } from '../../lib/routes';
import { IconRadio } from '../navigation/TechIcons';

export interface DigitalTwinHeaderProps {
  badgeTitle: string;
  specVersion: string;
  title: string;
  description: string;
  liveCockpitLabel: string;
  vehicleSelectLabel: string;
  noVehiclesLabel: string;
  assets: Asset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
}

export const DigitalTwinHeader: React.FC<DigitalTwinHeaderProps> = ({
  badgeTitle,
  specVersion,
  title,
  description,
  liveCockpitLabel,
  vehicleSelectLabel,
  noVehiclesLabel,
  assets,
  selectedAssetId,
  onSelectAsset,
}) => {
  return (
    <div
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'linear-gradient(180deg, rgba(14, 24, 44, 0.8) 0%, rgba(9, 13, 22, 0.95) 100%)',
        padding: '36px 24px 28px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {badgeTitle}
          </span>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            {specVersion}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 15, maxWidth: 780, lineHeight: 1.5 }}>
              {description}
            </p>
          </div>

          {/* Actions & Asset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href={ROUTES.LIVE_COCKPIT}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                padding: '9px 16px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <IconRadio size={14} className="text-cyan-400" />
              <span>{liveCockpitLabel}</span>
            </Link>

            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 12,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--df-text-muted)', fontWeight: 600 }}>
                {vehicleSelectLabel}
              </span>
              <select
                value={selectedAssetId || ''}
                onChange={(e) => onSelectAsset(e.target.value)}
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  color: 'var(--df-text-main)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {assets.length > 0 ? (
                  assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {noVehiclesLabel}
                  </option>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

