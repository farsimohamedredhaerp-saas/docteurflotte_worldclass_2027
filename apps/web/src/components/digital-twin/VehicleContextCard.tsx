import React from 'react';
import { formatNumber } from '../../lib/currency-formatter';
import { useI18n } from '../../lib/i18n';
import { VehicleSilhouette } from '../ui/VehicleSilhouette';
import { SovereigntySeal } from '../ui/SovereigntySeal';

export interface VehicleContextCardProps {
  assetCode: string;
  odometerKm: number;
  wilayaLocation: string;
  climateFactor: number;
  driverFactor: number;
  category?: string;
  brand?: string;
  model?: string;
}

export const VehicleContextCard: React.FC<VehicleContextCardProps> = ({
  assetCode,
  odometerKm,
  wilayaLocation,
  climateFactor,
  driverFactor,
  category,
  brand,
  model,
}) => {
  const { t, locale } = useI18n();

  return (
    <div
      style={{
        background: 'var(--df-bg-surface-1)',
        border: '1px solid var(--df-border-subtle)',
        borderRadius: 'var(--df-radius-lg, 10px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'between',
        gap: '16px',
        boxShadow: 'var(--df-shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Liseré supérieur biseauté */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'var(--df-border-card-top, #ffffff)',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />

      {/* En-tête : Matricule & Silhouette Vectorielle Algérienne */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--df-font-mono)', color: 'var(--df-text-muted)', marginBottom: '2px', textTransform: 'uppercase' }}>
            {t('digitalTwin.context.plate')}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--df-font-mono)', color: 'var(--df-accent-blue)', letterSpacing: '-0.02em' }}>
            {assetCode}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>
            {brand || model ? `${brand || ''} ${model || ''}`.trim() : 'Actif Connecté J1939'}
          </div>
        </div>

        <VehicleSilhouette
          category={category}
          brand={brand}
          model={model}
          size="lg"
          color="var(--df-text-secondary)"
          className="opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Métriques d'exploitation & Bioclimat */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--df-border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '2px' }}>
            {t('digitalTwin.context.odometer')}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--df-font-mono)', color: 'var(--df-text-main)', fontVariantNumeric: 'tabular-nums' }}>
            {formatNumber(odometerKm, locale)} km
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '2px' }}>
            {t('digitalTwin.context.wilaya')}
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--df-text-main)' }}>
            {wilayaLocation}
          </div>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '2px' }}>
            {t('digitalTwin.context.stress')}
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--df-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>
              {t('digitalTwin.context.climateFactor')}{' '}
              <strong style={{ color: 'var(--df-accent-cyan)', fontFamily: 'var(--df-font-mono)' }}>x{climateFactor.toFixed(2)}</strong>
            </span>
            <span style={{ color: 'var(--df-border-subtle)' }}>•</span>
            <span>
              {t('digitalTwin.context.driverFactor')}{' '}
              <strong style={{ color: 'var(--df-status-warning-text)', fontFamily: 'var(--df-font-mono)' }}>x{driverFactor.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sceaux de Souveraineté & Référentiel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--df-border-subtle)',
          flexWrap: 'wrap',
        }}
      >
        <SovereigntySeal type="ENACTA" size="xs" />
        <SovereigntySeal type="ANPDP_18_07" size="xs" />
      </div>
    </div>
  );
};
