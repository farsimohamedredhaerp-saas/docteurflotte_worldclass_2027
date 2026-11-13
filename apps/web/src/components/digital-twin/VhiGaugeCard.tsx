import React from 'react';
import { VhiThresholds, DEFAULT_VHI_THRESHOLDS } from '@docteurflotte/contracts';
import { CalculationProofButton } from '../decisions';
import { getVhiColor, getVhiStatusLabelKey } from '../../lib/vhi-thresholds';
import { useI18n } from '../../lib/i18n';

export interface VhiGaugeCardProps {
  vhi: number;
  organsCount: number;
  algorithmsSummary: string;
  thresholds?: VhiThresholds;
  onOpenProof: () => void;
}

export const VhiGaugeCard: React.FC<VhiGaugeCardProps> = ({
  vhi,
  organsCount,
  algorithmsSummary,
  thresholds = DEFAULT_VHI_THRESHOLDS,
  onOpenProof,
}) => {
  const { t } = useI18n();
  const color = getVhiColor(vhi, thresholds);
  const statusLabel = t(getVhiStatusLabelKey(vhi, thresholds));
  const circumference = 314.16;
  const strokeDashoffset = circumference * (1 - Math.min(100, Math.max(0, vhi)) / 100);

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Gauge SVG */}
      <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '32px', fontWeight: 800, color }}>{vhi}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginTop: '-4px' }}>
            {t('digitalTwin.vhi.scoreUnit')}
          </span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
            {t('digitalTwin.vhi.scoreTitle')}
          </div>
          <CalculationProofButton
            label={t('digitalTwin.vhi.proofButton')}
            size="xs"
            variant="emerald"
            onClick={onOpenProof}
          />
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
          {statusLabel}
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
          {t('digitalTwin.vhi.explanation', { count: organsCount, organs: algorithmsSummary })}
        </div>
      </div>
    </div>
  );
};
