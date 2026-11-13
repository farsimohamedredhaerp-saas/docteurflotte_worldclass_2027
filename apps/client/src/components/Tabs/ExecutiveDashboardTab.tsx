import React from 'react';
import {
  TrendingUp,
  Receipt,
  Scale,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { ClientAuditAlert, G50MonthlySummary, IbsAnnualSummary } from '../../types/client';

interface ExecutiveDashboardTabProps {
  healthScore: number;
  alerts: ClientAuditAlert[];
  g50: G50MonthlySummary;
  ibs: IbsAnnualSummary;
  onToggleReview: (alertId: string) => void;
}

export const ExecutiveDashboardTab: React.FC<ExecutiveDashboardTabProps> = ({
  healthScore,
  alerts,
  g50,
  ibs,
  onToggleReview,
}) => {
  const pendingAlerts = alerts.filter((a) => !a.reviewed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      {/* 4 Cartes Métriques Clés */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Score de Santé */}
        <div
          style={{
            backgroundColor: '#0c1631',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
              Indice Global Santé & Conformité
            </span>
            <Scale size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
              {healthScore} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Basé sur la conformité SCF et les textes DGI applicables
            </div>
          </div>
        </div>

        {/* Chiffre d'Affaires Période */}
        <div
          style={{
            backgroundColor: '#0c1631',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
              Chiffre d Affaires Taxable (G50)
            </span>
            <TrendingUp size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }} className="font-mono">
              {Number(g50.turnoverTaxable19).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>DZD</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.2rem' }}>
              Période {g50.period} — Taux TVA normal 19%
            </div>
          </div>
        </div>

        {/* TVA Nette Due */}
        <div
          style={{
            backgroundColor: '#0c1631',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
              TVA Nette à Décaisser
            </span>
            <Receipt size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }} className="font-mono">
              {Number(g50.netVatPayable).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>DZD</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Collectée : {Number(g50.totalVatCollected).toLocaleString('fr-DZ')} DA | Déductible : {Number(g50.totalVatDeductible).toLocaleString('fr-DZ')} DA
            </div>
          </div>
        </div>

        {/* Exposition Fiscale Potentielle */}
        <div
          style={{
            backgroundColor: '#0c1631',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
              Exposition Fiscale Potentielle
            </span>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ marginTop: '0.8rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171' }} className="font-mono">
              [ 13 000 — 97 200 ] <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>DZD</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.2rem' }}>
              {pendingAlerts.length} indice(s) nécessitant un examen contradictoire
            </div>
          </div>
        </div>
      </div>

      {/* Alertes d'Audit & Conformité (Revue Contradictoire Obligatoire - Règle 6) */}
      <div
        style={{
          backgroundColor: '#0c1631',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Cockpit d Audit Préventif & Indices d Anomalies
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Conformément à la déontologie légale, ces indices ne constituent pas une accusation mais requièrent un examen contradictoire préalable.
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            {alerts.filter((a) => a.reviewed).length} / {alerts.length} examiné(s)
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                backgroundColor: alert.reviewed ? 'rgba(15, 23, 42, 0.4)' : 'rgba(30, 41, 59, 0.5)',
                border: alert.reviewed ? '1px solid #1e293b' : '1px solid #334155',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span
                    className={`badge ${
                      alert.severity === 'BLOQUANT'
                        ? 'badge-risk'
                        : alert.severity === 'MAJEUR'
                        ? 'badge-warning'
                        : 'badge-info'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="badge badge-secondary font-mono">{alert.ruleCode}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                    {alert.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  {alert.observation}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '1rem' }}>
                  <span>
                    <strong>Fondement Légal :</strong> {alert.legalBasis}
                  </span>
                  <span>
                    <strong>Impact Potentiel ({alert.financialExposureDzd.taxType}) :</strong>{' '}
                    {alert.financialExposureDzd.min} — {alert.financialExposureDzd.max} DZD
                  </span>
                </div>
              </div>

              {/* Bouton Revue Contradictoire */}
              <div>
                <button
                  onClick={() => onToggleReview(alert.id)}
                  style={{
                    backgroundColor: alert.reviewed ? '#064e3b' : '#1e293b',
                    color: alert.reviewed ? '#34d399' : '#cbd5e1',
                    border: alert.reviewed ? '1px solid #059669' : '1px solid #475569',
                    borderRadius: '6px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {alert.reviewed ? (
                    <>
                      <CheckCircle2 size={14} />
                      Examen Validé
                    </>
                  ) : (
                    <>
                      <HelpCircle size={14} />
                      Revue Contradictoire
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ratios Financiers de Gestion */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#0c1631',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '1.25rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} style={{ color: '#38bdf8' }} />
            Ratios de Liquidité & Solvabilité (SCF)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Ratio de Liquidité Générale (Actif circulant / Dettes CT)</span>
              <span style={{ fontWeight: 700, color: '#34d399' }} className="font-mono">1.84</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Autonomie Financière (Capitaux propres / Total bilan)</span>
              <span style={{ fontWeight: 700, color: '#34d399' }} className="font-mono">54.2 %</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>BFR Normatif en Jours de CA</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }} className="font-mono">38 jours</span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0c1631',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '1.25rem',
          }}
        >
          <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Receipt size={16} style={{ color: '#a78bfa' }} />
            Synthèse Fiscale IBS & TAP (Exercice {ibs.taxableResult ? '2026' : 'N'})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Résultat Fiscal IBS Calculé</span>
              <span style={{ fontWeight: 700, color: '#f8fafc' }} className="font-mono">
                {Number(ibs.taxableResult).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Taux IBS Multi-Activités Retenu</span>
              <span style={{ fontWeight: 700, color: '#a78bfa' }} className="font-mono">{ibs.applicableRatePercent} %</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Solde de Liquidation IBS restant</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }} className="font-mono">
                {Number(ibs.liquidationBalance).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

