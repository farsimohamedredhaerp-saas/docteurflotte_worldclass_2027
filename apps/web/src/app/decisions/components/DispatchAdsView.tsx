'use client';

import React from 'react';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CalculationProofButton } from '@/components/decisions';
import {
  IconCrosshair,
  IconRefreshCw,
  IconShieldCheck,
  IconWrench,
  IconBarChart3,
} from '@/components/navigation/TechIcons';
import { ADS_SIMULATION_SCENARIOS } from '../constants';
import type { SimScenarioId } from '../types';
import type { DispatchDecisionResult } from '@/lib/api-fleet-intelligence';

interface DispatchAdsViewProps {
  simScenario: SimScenarioId;
  onSelectScenario: (id: SimScenarioId) => void;
  isEvaluatingDispatch: boolean;
  onEvaluateDispatch: (scenario?: SimScenarioId) => void;
  dispatchResult: DispatchDecisionResult | null;
  onOpenDispatchProof: (res: DispatchDecisionResult) => void;
}

export function DispatchAdsView({
  simScenario,
  onSelectScenario,
  isEvaluatingDispatch,
  onEvaluateDispatch,
  dispatchResult,
  onOpenDispatchProof,
}: DispatchAdsViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* BANDEAU SCÉNARIOS DE SIMULATION */}
      <Card style={{ padding: '1.5rem', background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--df-text-main)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <IconCrosshair size={18} /> Banc d&apos;Essai ADS : Scénarios Réglementaires Algériens
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--df-text-secondary)', margin: '0.25rem 0 0 0' }}>
              Testez l&apos;arbre de décision SAD &rarr; ADS (Portes 1 à 4, Filtrage Wilayas, Substitution TOPSIS).
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => onEvaluateDispatch()}
            disabled={isEvaluatingDispatch}
            style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isEvaluatingDispatch ? (
              <>
                <IconRefreshCw size={14} className="animate-spin inline" />
                Évaluation en cours...
              </>
            ) : (
              <>
                <IconRefreshCw size={14} className="inline" />
                Lancer l&apos;Arbitrage ADS
              </>
            )}
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {ADS_SIMULATION_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              onClick={() => {
                onSelectScenario(sc.id);
                onEvaluateDispatch(sc.id);
              }}
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--df-radius-md)',
                border: simScenario === sc.id ? '2px solid var(--df-primary)' : '1px solid var(--df-border-subtle)',
                background: simScenario === sc.id ? 'rgba(37, 99, 235, 0.08)' : 'var(--df-bg-surface-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                  {sc.label}
                </span>
                <Badge variant={sc.id === 'COMPLIANT_MISSION' ? 'ok' : 'warning'}>
                  {sc.badge}
                </Badge>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                {sc.desc}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AFFICHAGE DES RÉSULTATS DU MOTEUR ADS */}
      {dispatchResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* CARTE DE DÉCISION MAÎTRESSE */}
          <Card
            style={{
              borderLeft: `6px solid ${
                dispatchResult.decisionOutcome === 'APPROVED_AS_REQUESTED' || dispatchResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                  ? 'var(--df-status-ok)'
                  : dispatchResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT'
                  ? 'var(--df-status-warning)'
                  : 'var(--df-status-danger)'
              }`,
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--df-text-main)' }}>
                    Décision ADS :
                  </span>
                  <CalculationProofButton
                    label="Preuve 4 Portes &amp; TOPSIS"
                    size="sm"
                    variant="purple"
                    onClick={() => onOpenDispatchProof(dispatchResult)}
                  />
                  <Badge
                    variant={
                      dispatchResult.decisionOutcome === 'APPROVED_AS_REQUESTED'
                        ? 'ok'
                        : dispatchResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT'
                        ? 'warning'
                        : dispatchResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY'
                        ? 'ok'
                        : 'danger'
                    }
                  >
                    {dispatchResult.decisionOutcome === 'APPROVED_AS_REQUESTED' && 'MISSION VALIDÉE'}
                    {dispatchResult.decisionOutcome === 'APPROVED_WITH_ETD_OR_ROUTE_SHIFT' && 'ROUTAGE AJUSTÉ'}
                    {dispatchResult.decisionOutcome === 'SUBSTITUTED_AUTOMATICALLY' && 'SUBSTITUTION OPTIMALE (TOPSIS)'}
                    {dispatchResult.decisionOutcome === 'REJECTED_NO_ELIGIBLE_ASSET' && 'MISSION NON ÉLIGIBLE'}
                  </Badge>
                </div>
                <p style={{ color: 'var(--df-text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '850px', lineHeight: 1.5 }}>
                  {dispatchResult.routeAdvisoryNotes?.join(' • ') || 'Analyse de conformité complétée.'}
                </p>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  background: 'var(--df-bg-surface-2)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--df-radius-md)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
                  Statut Décisionnel
                </div>
                <div className="df-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-status-ok)' }}>
                  {dispatchResult.decisionOutcome}
                </div>
              </div>
            </div>

            {/* DÉTAILS DU VÉHICULE ET CHAUFFEUR ASSIGNÉS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--df-border-subtle)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Actif retenu / substitué :</span>
                <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.2rem' }}>
                  {dispatchResult.assignedRegistrationPlate || dispatchResult.assignedVehicleId || 'Aucun actif admissible'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Chauffeur certifié :</span>
                <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.2rem' }}>
                  {dispatchResult.assignedDriverName || dispatchResult.assignedDriverId || 'En attente d\'affectation'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Ordres de travail déclenchés :</span>
                <div style={{ fontWeight: 700, color: 'var(--df-text-main)', marginTop: '0.2rem' }}>
                  {dispatchResult.generatedWorkOrders.length} OT généré(s)
                </div>
              </div>
            </div>
          </Card>

          {/* GRILLE 2 COLONNES : VIOLATIONS DÉTECTÉES & ORDRES DE TRAVAIL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* PORTE 1 À 4 : CONTRÔLE RÉGLEMENTAIRE & VIOLATIONS */}
            <Card style={{ padding: '1.25rem' }}>
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--df-text-main)',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <IconShieldCheck size={18} /> Portes Réglementaires &amp; Santé (Loi 18-07 / JORADP)
              </h4>

              {dispatchResult.violationsDetected.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--df-status-ok)',
                    background: 'rgba(34, 197, 94, 0.08)',
                    borderRadius: 'var(--df-radius-md)',
                  }}
                >
                  Aucune violation réglementaire ni technique constatée. Les 4 portes de conformité sont au vert.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dispatchResult.violationsDetected.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--df-radius-sm)',
                        borderLeft: `4px solid ${v.severity === 'HARD_BLOCK' ? 'var(--df-status-danger)' : 'var(--df-status-warning)'}`,
                        background: 'var(--df-bg-surface-2)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--df-text-main)' }}>
                          {v.code}
                        </span>
                        <Badge variant={v.severity === 'HARD_BLOCK' ? 'danger' : 'warning'}>
                          {v.severity}
                        </Badge>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', margin: '0 0 0.35rem 0' }}>
                        {v.messageFr}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ORDRES DE TRAVAIL AUTOMATIQUES (OTs) */}
            <Card style={{ padding: '1.25rem' }}>
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--df-text-main)',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <IconWrench size={18} /> Remédiation Automatique (Ordres de Travail Émis)
              </h4>

              {dispatchResult.generatedWorkOrders.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--df-text-muted)',
                    background: 'var(--df-bg-surface-2)',
                    borderRadius: 'var(--df-radius-md)',
                  }}
                >
                  Aucun ordre de travail correctif immédiat requis pour ce scénario.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dispatchResult.generatedWorkOrders.map((ot, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--df-radius-sm)',
                        border: '1px solid var(--df-border-subtle)',
                        background: 'var(--df-bg-surface-1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--df-text-main)' }}>
                          {ot.title}
                        </span>
                        <Badge variant="warning">{ot.priority}</Badge>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', margin: '0 0 0.5rem 0' }}>
                        Tâches : {ot.tasksToPerform.join(', ')}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--df-text-muted)' }}>Immat : {ot.registrationPlate}</span>
                        <strong className="df-mono" style={{ color: 'var(--df-status-ok)' }}>
                          Immo. est. : {ot.estimatedDowntimeHours} h
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* TABLEAU DE SUBSTITUTION MULTI-CRITÈRES TOPSIS */}
          {dispatchResult.rankedSubstitutions && dispatchResult.rankedSubstitutions.length > 0 && (
            <Card style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--df-text-main)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <IconBarChart3 size={18} /> Classement des Actifs Alternatifs de Remplacement (Algorithme TOPSIS)
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Arbitrage multicritère : Distance d&apos;approche, Santé VHI résiduelle, Consommation Naftal et Conformité légale.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--df-border-subtle)', textAlign: 'left', color: 'var(--df-text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Rang</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Actif Candidat</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Score TOPSIS</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Distance Approche</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Surcoût Carburant Naftal</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Chauffeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchResult.rankedSubstitutions.map((cand, idx) => (
                      <tr
                        key={cand.vehicleId}
                        style={{
                          borderBottom: '1px solid var(--df-border-subtle)',
                          background: idx === 0 ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>#{idx + 1}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>{cand.makeModel}</div>
                          <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>{cand.registrationPlate}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span className="df-mono" style={{ fontWeight: 800, color: 'var(--df-primary)' }}>
                            {cand.totalScore100} / 100
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{cand.approachDistanceKm} km</td>
                        <td style={{ padding: '0.75rem 0.5rem' }} className="df-mono">
                          {cand.estimatedFuelCostDzd.toLocaleString('fr-DZ')} DA
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {cand.driverName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

