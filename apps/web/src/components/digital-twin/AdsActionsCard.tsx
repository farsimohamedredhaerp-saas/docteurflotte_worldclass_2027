import React from 'react';
import { DigitalTwinAsset } from '@docteurflotte/contracts';
import { formatCurrency } from '../../lib/currency-formatter';
import { useI18n } from '../../lib/i18n';

export interface AdsActionsCardProps {
  partsReservation?: DigitalTwinAsset['partsReservation'];
  substitutionAsset?: DigitalTwinAsset['substitutionAsset'];
  substitutionThreshold?: number;
  currency: string;
  workOrderDisabled?: boolean;
  onGenerateWorkOrder: () => void;
}

export const AdsActionsCard: React.FC<AdsActionsCardProps> = ({
  partsReservation,
  substitutionAsset,
  substitutionThreshold,
  currency,
  workOrderDisabled = false,
  onGenerateWorkOrder,
}) => {
  const { t, locale } = useI18n();

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {t('digitalTwin.ads.badge')}
          </span>
        </div>
        <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px', color: '#f8fafc' }}>
          {t('digitalTwin.ads.title')}
        </h4>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8' }}>
          {t('digitalTwin.ads.subtitle')}
        </p>

        {partsReservation && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{partsReservation.partName}</span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {t('digitalTwin.ads.inStock', { qty: partsReservation.warehouseStockQty })}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
              {t('digitalTwin.ads.oemRef', {
                partNumber: partsReservation.partNumber,
                homologation: partsReservation.oemHomologation ?? '',
              })}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
              {formatCurrency(partsReservation.estimatedCostDzd, currency, locale)}
            </div>
          </div>
        )}

        {substitutionAsset && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: '2px' }}>
              {t('digitalTwin.ads.substitutionWarning', { threshold: substitutionThreshold ?? '' })}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
              {t('digitalTwin.ads.suggestedAsset', {
                name: substitutionAsset.assetName,
                code: substitutionAsset.assetCode,
              })}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              {t('digitalTwin.ads.vhiHealth', {
                vhi: substitutionAsset.vhiScore,
                reason: substitutionAsset.reason,
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '18px' }}>
        <button
          onClick={onGenerateWorkOrder}
          disabled={workOrderDisabled}
          style={{
            width: '100%',
            background: workOrderDisabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(56, 189, 248, 0.15)',
            border: workOrderDisabled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #38bdf8',
            color: workOrderDisabled ? 'var(--df-text-muted)' : '#38bdf8',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: workOrderDisabled ? 'not-allowed' : 'pointer',
            opacity: workOrderDisabled ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {t('digitalTwin.ads.generateOrderBtn')}
        </button>
      </div>
    </div>
  );
};
