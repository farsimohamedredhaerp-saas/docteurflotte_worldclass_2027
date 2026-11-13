import React from 'react';
import { DigitalTwinAsset, VhiThresholds, DEFAULT_VHI_THRESHOLDS } from '@docteurflotte/contracts';
import { CalculationProofButton } from '../decisions';
import { getVhiColor } from '../../lib/vhi-thresholds';
import { useI18n } from '../../lib/i18n';

export interface TrajectoryCardProps {
  projectionTrajectory: DigitalTwinAsset['projectionTrajectory'];
  thresholds?: VhiThresholds;
  onOpenProof: () => void;
}

export const TrajectoryCard: React.FC<TrajectoryCardProps> = ({
  projectionTrajectory,
  thresholds = DEFAULT_VHI_THRESHOLDS,
  onOpenProof,
}) => {
  const { t } = useI18n();

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
          {t('digitalTwin.trajectory.title')}
        </h4>
        <CalculationProofButton
          label={t('digitalTwin.trajectory.proofButton')}
          size="xs"
          variant="amber"
          onClick={onOpenProof}
        />
      </div>
      <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#94a3b8' }}>
        {t('digitalTwin.trajectory.subtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Day 0 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('digitalTwin.trajectory.day0')}</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: getVhiColor(projectionTrajectory.day0Vhi, thresholds) }}>
            {projectionTrajectory.day0Vhi} VHI
          </span>
        </div>

        {/* Day 30 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{t('digitalTwin.trajectory.day30')}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('digitalTwin.trajectory.day30Sub')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginRight: '12px' }}>
              {projectionTrajectory.day30VhiWithoutAction} VHI
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
              ↗ {projectionTrajectory.day30VhiWithAction} VHI
            </span>
          </div>
        </div>

        {/* Day 60 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('digitalTwin.trajectory.day60')}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
            {projectionTrajectory.day60VhiWithoutAction} VHI
          </span>
        </div>

        {/* Day 90 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('digitalTwin.trajectory.day90')}</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
            {projectionTrajectory.day90VhiWithoutAction} VHI {t('digitalTwin.trajectory.highRisk')}
          </span>
        </div>
      </div>
    </div>
  );
};
