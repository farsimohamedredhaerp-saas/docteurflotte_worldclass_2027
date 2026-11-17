'use client';

import React, { useEffect, useState } from 'react';
import {
  AccidentClaim,
  TrafficFine,
  InsuranceCase,
  InsuranceRiskScore,
} from '@docteurflotte/contracts';
import {
  fetchClaims,
  fetchFines,
  fetchInsuranceCases,
  fetchFleetRiskSummary,
  payTrafficFine,
  contestTrafficFine,
} from '../../lib/api-claims-fines';
import { AuthClient } from '../../lib/api-auth';
import { Navbar } from '../../components/navigation/Navbar';

export default function ClaimsFinesPage() {
  const [activeTab, setActiveTab] = useState<'claims' | 'fines' | 'insurance' | 'risk'>('claims');
  const [claims, setClaims] = useState<AccidentClaim[]>([]);
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [cases, setCases] = useState<InsuranceCase[]>([]);
  const [riskScores, setRiskScores] = useState<InsuranceRiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const session = AuthClient.getSession();
        const token = session.token || undefined;

        const [cData, fData, iData, rData] = await Promise.all([
          fetchClaims(token).catch(() => []),
          fetchFines(token).catch(() => []),
          fetchInsuranceCases(token).catch(() => []),
          fetchFleetRiskSummary(token).catch(() => []),
        ]);

        setClaims(cData);
        setFines(fData);
        setCases(iData);
        setRiskScores(rData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePayFine = async (fineId: string) => {
    try {
      const session = AuthClient.getSession();
      if (!session.token) return;
      const updated = await payTrafficFine(session.token, fineId);
      setFines((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleContestFine = async (fineId: string) => {
    const reason = prompt('Motif de contestation du procès-verbal :');
    if (!reason) return;
    try {
      const session = AuthClient.getSession();
      if (!session.token) return;
      const updated = await contestTrafficFine(session.token, fineId, reason);
      setFines((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div
      style={{
        padding: '0 2rem 2rem 2rem',
        backgroundColor: 'var(--df-bg-base)',
        minHeight: '100vh',
        color: 'var(--df-text-primary)',
        fontFamily: 'inherit',
      }}
    >
      <Navbar />

      {/* En-tête du cockpit */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Sinistres, Amendes & Assurances
          </h1>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--df-primary-light, rgba(59, 130, 246, 0.1))',
              color: 'var(--df-primary)',
            }}
          >
            Module E • Contentieux & Risques
          </span>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Gestion intégrée des déclarations d’accidents, imputation automatique des amendes au chauffeur à l’instant <em>t</em>, et suivi des dossiers d’indemnisation (SAA, CAAT, CASH, CIAR).
        </p>
      </div>

      {/* Onglets Métier */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--df-border-base)',
          marginBottom: '1.5rem',
          maxWidth: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => setActiveTab('claims')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'claims' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'claims' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Sinistres & Accidents ({claims.length})
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'fines' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'fines' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Procès-Verbaux & Amendes ({fines.length})
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'insurance' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'insurance' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Dossiers Assurances ({cases.length})
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'risk' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'risk' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Scoring Risque Flotte ({riskScores.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--df-text-secondary)' }}>
          Chargement des données réglementaires et sinistres...
        </div>
      ) : error ? (
        <div style={{ padding: '1rem', backgroundColor: 'var(--df-danger-light)', color: 'var(--df-danger)', borderRadius: '0.5rem' }}>
          {error}
        </div>
      ) : (
        <>
          {/* TAB 1: Sinistres & Accidents */}
          {activeTab === 'claims' && (
            <div>
              {claims.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun sinistre déclaré pour cette organisation.
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.5rem' }}>
                    Les déclarations d’accidents génèrent automatiquement un Ordre de Réparation atelier si la gravité est modérée ou sévère.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{claim.claimNumber}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: 'var(--df-bg-subtle)',
                              fontWeight: 600,
                            }}
                          >
                            Actif : {claim.assetCode || claim.assetId}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor:
                                claim.severity === 'SEVERE' || claim.severity === 'TOTAL_LOSS'
                                  ? 'var(--df-danger-light)'
                                  : 'var(--df-warning-light)',
                              color:
                                claim.severity === 'SEVERE' || claim.severity === 'TOTAL_LOSS'
                                  ? 'var(--df-danger)'
                                  : 'var(--df-warning)',
                              fontWeight: 600,
                            }}
                          >
                            Gravité : {claim.severity}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--df-text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                          Date : {new Date(claim.accidentDate).toLocaleDateString('fr-DZ')} • Wilaya {claim.wilayaCode} • {claim.locationDetails}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                          Conducteur : {claim.driverName || 'Non assigné'} • Dégâts estimés : {claim.estimatedDamageDzd.toLocaleString('fr-DZ')} DA
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            padding: '0.3rem 0.75rem',
                            borderRadius: '0.25rem',
                            backgroundColor: 'var(--df-bg-subtle)',
                            color: 'var(--df-text-secondary)',
                          }}
                        >
                          Statut : {claim.status}
                        </span>
                        {claim.workOrderIdGenerated && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--df-primary)' }}>
                              WO généré : {claim.workOrderIdGenerated.slice(0, 8)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Amendes & Infractions */}
          {activeTab === 'fines' && (
            <div>
              {fines.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun procès-verbal ou amende enregistré.
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.5rem' }}>
                    Le système croise automatiquement la télématique GPS et les Ordres de Mission pour imputer l’infraction au conducteur exact à l’instant <em>t</em>.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {fines.map((fine) => (
                    <div
                      key={fine.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>PV N° {fine.fineNoticeNumber}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: 'var(--df-bg-subtle)',
                              fontWeight: 600,
                            }}
                          >
                            Actif : {fine.assetCode || fine.assetId}
                          </span>
                          {fine.locationHighwayCode && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: 'var(--df-primary-light, rgba(59, 130, 246, 0.1))',
                                color: 'var(--df-primary)',
                                fontWeight: 600,
                              }}
                            >
                              Axe : {fine.locationHighwayCode}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--df-text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                          Infraction : {fine.infractionNature} • Wilaya {fine.wilayaCode} • Date : {new Date(fine.infractionDate).toLocaleString('fr-DZ')}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                          Chauffeur imputé : <strong>{fine.attributedDriverName || 'Non identifié'}</strong> (Source : {fine.attributionSource})
                        </p>
                        {fine.isContested && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--df-warning)', marginTop: '0.25rem', marginBottom: 0 }}>
                            Contestation : {fine.contestReason}
                          </p>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--df-danger)' }}>
                          {fine.amountDzd.toLocaleString('fr-DZ')} DA
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginTop: '0.25rem' }}>
                          Échéance : {new Date(fine.dueDate).toLocaleDateString('fr-DZ')}
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                          {fine.isPaid ? (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '0.25rem',
                                backgroundColor: 'var(--df-success-light)',
                                color: 'var(--df-success)',
                                fontWeight: 600,
                              }}
                            >
                              Acquittée
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handlePayFine(fine.id)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: 'var(--df-primary)',
                                  color: 'var(--df-text-inverse, #fff)',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Payer
                              </button>
                              {!fine.isContested && (
                                <button
                                  onClick={() => handleContestFine(fine.id)}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: 'transparent',
                                    color: 'var(--df-warning)',
                                    border: '1px solid var(--df-warning)',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Contester
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Dossiers Assurances */}
          {activeTab === 'insurance' && (
            <div>
              {cases.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun dossier d’assurance en cours.
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.5rem' }}>
                    Suivez ici l’évaluation des experts, les franchises appliquées et les indemnisations perçues.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {cases.map((cs) => (
                    <div
                      key={cs.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{cs.insuranceCompany}</span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--df-text-secondary)' }}>
                            Police N° {cs.insurancePolicyNumber}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--df-text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                          Expert désigné : {cs.expertName || 'Non communiqué'}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                          Dommages constatés : {cs.assessedDamageDzd.toLocaleString('fr-DZ')} DA • Franchise : {cs.deductibleDzd.toLocaleString('fr-DZ')} DA
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--df-success)' }}>
                          Indemnité : {cs.approvedCompensationDzd.toLocaleString('fr-DZ')} DA
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '0.25rem',
                            backgroundColor: cs.isClosed ? 'var(--df-bg-subtle)' : 'var(--df-warning-light)',
                            color: cs.isClosed ? 'var(--df-text-muted)' : 'var(--df-warning)',
                            fontWeight: 600,
                          }}
                        >
                          {cs.isClosed ? 'Dossier Clôturé' : 'Instruction en cours'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Scoring Risque Flotte */}
          {activeTab === 'risk' && (
            <div>
              {riskScores.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun actif référencé pour le calcul actuariel du risque.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {riskScores.map((score) => (
                    <div
                      key={score.assetId}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{score.assetCode}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontWeight: 700,
                              backgroundColor:
                                score.riskCategory === 'CRITICAL'
                                  ? 'var(--df-danger-light)'
                                  : score.riskCategory === 'HIGH'
                                  ? 'var(--df-warning-light)'
                                  : 'var(--df-success-light)',
                              color:
                                score.riskCategory === 'CRITICAL'
                                  ? 'var(--df-danger)'
                                  : score.riskCategory === 'HIGH'
                                  ? 'var(--df-warning)'
                                  : 'var(--df-success)',
                            }}
                          >
                            Risque : {score.riskCategory}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--df-text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                          Sinistres (12m) : {score.claimsCountLast12m} ({score.totalClaimsCostDzd.toLocaleString('fr-DZ')} DA) • Amendes (12m) : {score.finesCountLast12m} ({score.totalFinesAmountDzd.toLocaleString('fr-DZ')} DA)
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>Ajustement Prime Conseillé</div>
                        <div
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: score.recommendedPremiumAdjustmentPct > 0 ? 'var(--df-danger)' : 'var(--df-success)',
                          }}
                        >
                          {score.recommendedPremiumAdjustmentPct > 0 ? `+${score.recommendedPremiumAdjustmentPct}%` : '0% (Standard)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

