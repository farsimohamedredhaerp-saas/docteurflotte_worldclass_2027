'use client';

import React, { useState } from 'react';
import { ActivityPack } from '@docteurflotte/contracts';
import {
  ActivitySectorCategory,
  RegimeArbitrageEvaluation,
  RegimeCode,
} from '@docteurflotte/contracts';
import { AuthClient } from '../../lib/api-auth';
import { Button } from '../Button';
import { Badge } from '../Badge';
import {
  IconAlertTriangle,
  IconCheck,
  IconTrendingUp,
} from '../navigation/TechIcons';

interface RegimeArbitrageStepProps {
  activityPack: ActivityPack;
  token: string | null;
  selectedRegime: string;
  legalPersonalityType: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  legalForm: string;
  onSelectRegime: (regime: {
    regimeCode: string;
    personalityType: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
    legalForm: string;
  }) => void;
}

export const RegimeArbitrageStep: React.FC<RegimeArbitrageStepProps> = ({
  activityPack,
  token,
  selectedRegime,
  legalPersonalityType,
  legalForm,
  onSelectRegime,
}) => {
  // Déterminer la catégorie par défaut selon le pack
  const getDefaultCategory = (): ActivitySectorCategory => {
    switch (activityPack) {
      case ActivityPack.CONSTRUCTION:
        return 'BTPH';
      case ActivityPack.TRANSPORT:
        return 'SERVICES';
      case ActivityPack.LIGHT_VEHICLES:
        return 'COMMERCE';
      default:
        return 'SERVICES';
    }
  };

  const [category, setCategory] = useState<ActivitySectorCategory>(getDefaultCategory());
  const [revenueGoods, setRevenueGoods] = useState<string>('0');
  const [revenueServices, setRevenueServices] = useState<string>('6000000');
  const [operatingExpenses, setOperatingExpenses] = useState<string>('1800000');
  const [employeeCount, setEmployeeCount] = useState<number>(1);
  const [grossPayroll, setGrossPayroll] = useState<string>('720000');
  const [managerRemun, setManagerRemun] = useState<string>('1200000');

  const [isLoading, setIsLoading] = useState(false);
  const [simResult, setSimResult] = useState<RegimeArbitrageEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const evaluation = await AuthClient.simulateRegimeArbitrage(
        {
          fiscalYear: new Date().getFullYear(),
          activityCategory: category,
          projectedAnnualRevenueGoods: revenueGoods,
          projectedAnnualRevenueServices: revenueServices,
          operatingExpenses,
          employeeCount: Number(employeeCount) || 0,
          totalGrossPayroll: grossPayroll,
          desiredManagerRemuneration: managerRemun,
        },
        token
      );
      setSimResult(evaluation);

      // Pré-sélectionner le régime recommandé
      const recommended = evaluation.regimes.find(
        (r) => r.regimeCode === evaluation.recommendedRegime
      );
      if (recommended) {
        onSelectRegime({
          regimeCode: recommended.regimeCode,
          personalityType: recommended.personalityType,
          legalForm:
            recommended.personalityType === 'PERSONNE_MORALE' ? 'SARL' : 'ENTREPRISE_INDIVIDUELLE',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la simulation d’arbitrage.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Étape 2 : Régime Juridique & Fiscal Algérien
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--df-text-muted)', margin: 0 }}>
            Arbitrage prescriptif souverain : simulez vos cotisations et impôts pour optimiser votre rentabilité nette en Dinars Algériens (DZD).
          </p>
        </div>
        <Badge variant="demo">LF 2025/2026</Badge>
      </div>

      {/* Formulaire des hypothèses */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-2)',
          border: '1px solid var(--df-border-subtle)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <IconTrendingUp size={18} color="var(--df-accent-cyan)" />
          <strong style={{ fontSize: '14px', color: 'var(--df-text-main)' }}>
            Hypothèses d&apos;Exploitation Annuelles Prévisionnelles
          </strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
              Branche d&apos;Activité
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivitySectorCategory)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-3)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
              }}
            >
              <option value="SERVICES">Prestations de Services & Transport (12% IFU / 26% IBS)</option>
              <option value="COMMERCE">Commerce & Vente de Marchandises (5% IFU / 26% IBS)</option>
              <option value="BTPH">Travaux BTPH & Chantiers (23% IBS)</option>
              <option value="PRODUCTION">Fabrication & Production Industrielle (19% IBS)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
              CA Prestations / Travaux (DZD)
            </label>
            <input
              type="number"
              value={revenueServices}
              onChange={(e) => setRevenueServices(e.target.value)}
              placeholder="Ex: 5000000"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-3)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
              CA Vente / Marchandises (DZD)
            </label>
            <input
              type="number"
              value={revenueGoods}
              onChange={(e) => setRevenueGoods(e.target.value)}
              placeholder="Ex: 0"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-3)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
              Charges d&apos;Exploitation (DZD)
            </label>
            <input
              type="number"
              value={operatingExpenses}
              onChange={(e) => setOperatingExpenses(e.target.value)}
              placeholder="Carburant, loyers, pièces..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-3)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
              Salariés Déclarés (CNAS)
            </label>
            <input
              type="number"
              min={0}
              value={employeeCount}
              onChange={(e) => setEmployeeCount(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-3)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--df-text-muted)', marginBottom: '6px' }}>
              Masse Salariale Brute (DZD)
            </label>
            <input
              type="number"
              value={grossPayroll}
              onChange={(e) => setGrossPayroll(e.target.value)}
              placeholder="Ex: 720000"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-3)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={handleRunSimulation}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            ⚖️ Calculer l&apos;Arbitrage Réglementaire (ANAE / IFU / Réel / SARL)
          </Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Résultats de simulation */}
      {simResult && (
        <div style={{ marginBottom: '24px' }}>
          {/* Synthèse prescriptive */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '6px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--df-status-ok)',
              }}
            >
              <IconCheck size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--df-status-ok)', display: 'block', marginBottom: '4px' }}>
                Recommandation Déterministe : {simResult.recommendedRegimeLabelFr}
              </strong>
              <p style={{ fontSize: '13px', color: 'var(--df-text-main)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                {simResult.actionableSummaryFr}
              </p>
              {Number(simResult.annualSavingsVsWorstDzd) > 0 && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--df-accent-cyan)' }}>
                  💰 Gain net préservé : + {Number(simResult.annualSavingsVsWorstDzd).toLocaleString()} DZD / an
                </span>
              )}
            </div>
          </div>

          {/* Cartes comparatives des 4 régimes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {simResult.regimes.map((reg) => {
              const isSelected = selectedRegime === reg.regimeCode;
              const isRec = simResult.recommendedRegime === reg.regimeCode;

              return (
                <div
                  key={reg.regimeCode}
                  onClick={() => {
                    if (reg.isEligible) {
                      onSelectRegime({
                        regimeCode: reg.regimeCode,
                        personalityType: reg.personalityType,
                        legalForm:
                          reg.personalityType === 'PERSONNE_MORALE' ? 'SARL' : 'ENTREPRISE_INDIVIDUELLE',
                      });
                    }
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'var(--df-bg-surface-3)' : 'var(--df-bg-surface-2)',
                    border: isSelected
                      ? '2px solid var(--df-accent-cyan)'
                      : isRec
                        ? '1px solid var(--df-status-ok)'
                        : '1px solid var(--df-border-subtle)',
                    cursor: reg.isEligible ? 'pointer' : 'not-allowed',
                    opacity: reg.isEligible ? 1 : 0.6,
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--df-text-muted)' }}>
                      {reg.personalityType === 'PERSONNE_MORALE' ? 'SOCIÉTÉ' : 'INDIVIDUEL'}
                    </span>
                    {isRec ? (
                      <Badge variant="demo">🏆 OPTIMAL</Badge>
                    ) : reg.isEligible ? (
                      <span style={{ fontSize: '11px', color: 'var(--df-status-ok)', fontWeight: 600 }}>Éligible</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>Inéligible</span>
                    )}
                  </div>

                  <strong style={{ fontSize: '14px', color: 'var(--df-text-main)', display: 'block', marginBottom: '6px' }}>
                    {reg.labelFr}
                  </strong>

                  {!reg.isEligible ? (
                    <p style={{ fontSize: '12px', color: '#fca5a5', margin: '8px 0', minHeight: '40px' }}>
                      {reg.ineligibilityReasonFr}
                    </p>
                  ) : (
                    <div style={{ margin: '10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                        <span>Impôt fiscal :</span>
                        <strong style={{ color: 'var(--df-text-main)' }}>{Number(reg.taxAmountDzd).toLocaleString()} DZD</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                        <span>Cotisations CASNOS/CNAS :</span>
                        <strong style={{ color: 'var(--df-text-main)' }}>{Number(reg.socialContributionsDzd).toLocaleString()} DZD</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                        <span>Taux effectif :</span>
                        <strong style={{ color: 'var(--df-accent-cyan)' }}>{reg.effectiveTaxRatePct}%</strong>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: 'var(--df-text-main)',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          marginTop: '6px',
                        }}
                      >
                        <strong>Revenu net :</strong>
                        <strong style={{ color: 'var(--df-status-ok)' }}>{Number(reg.netDisposableIncomeDzd).toLocaleString()} DZD</strong>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    {reg.accountingRequirementsFr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sélection manuelle directe pour organisations déjà enregistrées */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'var(--df-bg-surface-2)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', display: 'block', marginBottom: '8px' }}>
          Ou confirmez directement votre statut d&apos;enregistrement :
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { code: 'SARL_EURL_IBS', label: 'SARL / EURL (IBS)', type: 'PERSONNE_MORALE' as const, form: 'SARL' },
            { code: 'REEL_SIMPLIFIE', label: 'Personne Physique (Réel IRG)', type: 'PERSONNE_PHYSIQUE' as const, form: 'ENTREPRISE_INDIVIDUELLE' },
            { code: 'IFU_FORFAITAIRE', label: 'Artisan / Commerçant (IFU)', type: 'PERSONNE_PHYSIQUE' as const, form: 'ENTREPRISE_INDIVIDUELLE' },
            { code: 'AUTO_ENTREPRENEUR', label: 'Auto-Entrepreneur (ANAE)', type: 'PERSONNE_PHYSIQUE' as const, form: 'AUTO_ENTREPRENEUR' },
          ].map((item) => (
            <label
              key={item.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: selectedRegime === item.code ? 'var(--df-bg-surface-3)' : 'transparent',
                border: selectedRegime === item.code ? '1px solid var(--df-accent-cyan)' : '1px solid var(--df-border-subtle)',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--df-text-main)',
              }}
            >
              <input
                type="radio"
                name="regimeSelect"
                checked={selectedRegime === item.code}
                onChange={() => {
                  onSelectRegime({
                    regimeCode: item.code,
                    personalityType: item.type,
                    legalForm: item.form,
                  });
                }}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
