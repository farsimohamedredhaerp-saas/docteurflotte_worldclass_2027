import React from 'react';
import { DigitalTwinOrganStatus, VhiThresholds, DEFAULT_VHI_THRESHOLDS } from '@docteurflotte/contracts';
import { Droplet, Zap, Disc, Thermometer, Filter, Cog, Activity } from 'lucide-react';
import { CalculationProofButton } from '../decisions';
import { getOrganStatusStyle } from '../../theme/organ-status';
import { getVhiColor } from '../../lib/vhi-thresholds';
import { formatNumber } from '../../lib/currency-formatter';
import { useI18n } from '../../lib/i18n';

function renderOrganIcon(name: string) {
  const iconProps = { className: 'w-7 h-7 text-sky-400 shrink-0' };
  switch (name?.toLowerCase()) {
    case 'droplet':
      return <Droplet {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'disc':
      return <Disc {...iconProps} />;
    case 'thermometer':
      return <Thermometer {...iconProps} />;
    case 'filter':
      return <Filter {...iconProps} />;
    case 'cog':
      return <Cog {...iconProps} />;
    default:
      return <Activity {...iconProps} />;
  }
}

export interface OrganAnalysisCardProps {
  organ: DigitalTwinOrganStatus;
  thresholds?: VhiThresholds;
  onOpenProof: () => void;
}

export const OrganAnalysisCard: React.FC<OrganAnalysisCardProps> = ({
  organ,
  thresholds = DEFAULT_VHI_THRESHOLDS,
  onOpenProof,
}) => {
  const { t, locale } = useI18n();
  const statusStyle = getOrganStatusStyle(organ.status);
  const healthColor = getVhiColor(organ.healthPercent, thresholds);

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Organ Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderOrganIcon(organ.icon)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>{organ.name}</h2>
              <span
                style={{
                  background: statusStyle.bgColor,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.borderColor}`,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {t(statusStyle.labelKey)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                {t('digitalTwin.organ.algorithmPrefix')} {organ.physicsAlgorithm}
              </span>
              <CalculationProofButton
                label={t('digitalTwin.organ.proofButton')}
                size="xs"
                variant="cyan"
                onClick={onOpenProof}
              />
            </div>
          </div>
        </div>

        {/* RUL Highlight Box */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '10px 16px',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
            {t('digitalTwin.organ.rulLabel')}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>
            {formatNumber(organ.remainingUsefulLifeValue, locale)}{' '}
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{organ.remainingUsefulLifeUnit}</span>
          </div>
        </div>
      </div>

      {/* Health Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>{t('digitalTwin.organ.healthLevelLabel')}</span>
          <span style={{ fontWeight: 700, color: healthColor }}>{organ.healthPercent} %</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, organ.healthPercent))}%`,
              background: healthColor,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>

      {/* Observed Telemetry Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        {organ.observedMetrics.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{m.label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>{m.value}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {t('digitalTwin.organ.thresholdPrefix')} {m.threshold}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Physical Explanation Box */}
      <div
        style={{
          background: 'rgba(56, 189, 248, 0.06)',
          borderLeft: '3px solid #38bdf8',
          padding: '12px 14px',
          borderRadius: '0 8px 8px 0',
          fontSize: '13px',
          color: '#e2e8f0',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: '#38bdf8' }}>{t('digitalTwin.organ.physicalFinding')} </strong>
        {organ.explanation}
      </div>
    </div>
  );
};
