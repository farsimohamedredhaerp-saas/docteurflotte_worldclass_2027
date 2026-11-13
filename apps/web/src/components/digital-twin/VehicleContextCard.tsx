import React from 'react';
import { formatNumber } from '../../lib/currency-formatter';
import { useI18n } from '../../lib/i18n';

export interface VehicleContextCardProps {
  assetCode: string;
  odometerKm: number;
  wilayaLocation: string;
  climateFactor: number;
  driverFactor: number;
}

export const VehicleContextCard: React.FC<VehicleContextCardProps> = ({
  assetCode,
  odometerKm,
  wilayaLocation,
  climateFactor,
  driverFactor,
}) => {
  const { t, locale } = useI18n();

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
          {t('digitalTwin.context.plate')}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>{assetCode}</div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
          {t('digitalTwin.context.odometer')}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
          {formatNumber(odometerKm, locale)} km
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
          {t('digitalTwin.context.wilaya')}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
          {wilayaLocation}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
          {t('digitalTwin.context.stress')}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
          {t('digitalTwin.context.climateFactor')}{' '}
          <span style={{ color: '#38bdf8' }}>x{climateFactor.toFixed(2)}</span> |{' '}
          {t('digitalTwin.context.driverFactor')}{' '}
          <span style={{ color: '#f59e0b' }}>x{driverFactor.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
