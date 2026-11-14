import React from 'react';
import { DigitalTwinFinancialArbitrage } from '@docteurflotte/contracts';
import { CalculationProofButton } from '../decisions';
import { formatCurrency } from '../../lib/currency-formatter';
import { useI18n } from '../../lib/i18n';
import { IconCreditCard, IconSliders } from '../navigation/TechIcons';

export interface FinancialArbitrageCardProps {
  financialArbitrage: DigitalTwinFinancialArbitrage;
  currency: string;
  workOrderDisabled?: boolean;
  onOpenProof: () => void;
  onOpenWorkOrder: () => void;
}

export const FinancialArbitrageCard: React.FC<FinancialArbitrageCardProps> = ({
  financialArbitrage,
  currency,
  workOrderDisabled = false,
  onOpenProof,
  onOpenWorkOrder,
}) => {
  const { t, locale } = useI18n();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 78, 59, 0.25) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCreditCard size={20} className="text-emerald-400" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {t('digitalTwin.arbitrage.title', { currency })}
              </h4>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {t('digitalTwin.arbitrage.roi', { roi: financialArbitrage.roiRatio.toFixed(1) })}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {t('digitalTwin.arbitrage.subtitle')}
            </p>
          </div>
        </div>

        <CalculationProofButton
          label={t('digitalTwin.arbitrage.proofButton')}
          size="xs"
          variant="emerald"
          onClick={onOpenProof}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
            {t('digitalTwin.arbitrage.preventiveCost')}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
            {formatCurrency(financialArbitrage.preventiveInterventionCostDzd, currency, locale)}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            {t('digitalTwin.arbitrage.preventiveCostSub')}
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
            {t('digitalTwin.arbitrage.breakdownRisk')}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444' }}>
            {formatCurrency(financialArbitrage.unplannedBreakdownRiskDzd, currency, locale)}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            {t('digitalTwin.arbitrage.breakdownRiskSub')}
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
            {t('digitalTwin.arbitrage.towingAndImmo')}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
            {formatCurrency(financialArbitrage.desertTowingCostDzd, currency, locale)}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            {t('digitalTwin.arbitrage.perDayDowntime', {
              amount: formatCurrency(financialArbitrage.dailyImmobilizationLossDzd, currency, locale),
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.12)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '11px', color: '#a7f3d0', marginBottom: '2px', fontWeight: 600 }}>
            {t('digitalTwin.arbitrage.netSavings')}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>
            +{formatCurrency(financialArbitrage.netBenefitDzd, currency, locale)}
          </div>
          <div style={{ fontSize: '10px', color: '#34d399', marginTop: '2px' }}>
            {t('digitalTwin.arbitrage.actionInDays', { days: financialArbitrage.actionDeadlineDays })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>{t('digitalTwin.arbitrage.recommendation')}</span>
          <span>
            {financialArbitrage.recommendedAction.replace(/_/g, ' ')} —{' '}
            {t('digitalTwin.arbitrage.maxDays', { days: financialArbitrage.actionDeadlineDays })}
          </span>
        </div>

        <button
          onClick={onOpenWorkOrder}
          disabled={workOrderDisabled}
          style={{
            background: workOrderDisabled
              ? 'rgba(255, 255, 255, 0.1)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: workOrderDisabled ? 'var(--df-text-muted)' : '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: workOrderDisabled ? 'not-allowed' : 'pointer',
            opacity: workOrderDisabled ? 0.6 : 1,
            boxShadow: workOrderDisabled ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconSliders size={14} />
          <span>{t('digitalTwin.arbitrage.openWorkOrder', { currency })}</span>
        </button>
      </div>
    </div>
  );
};
