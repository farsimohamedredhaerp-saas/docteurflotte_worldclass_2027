'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDemoMode } from '../../context/DemoModeContext';
import { Navbar } from '../../components/navigation/Navbar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { MetricCard } from '../../components/MetricCard';
import {
  FleetIntelligenceClient,
  FleetEcoSummary,
  DriverEcoScore,
  DrivingSeverityLevel,
} from '../../lib/api-fleet-intelligence';
import {
  CalculationProofButton,
  CalculationProofModal,
  CalculationProofData,
} from '../../components/decisions';

export default function EcoDrivingPage() {
  const { isDemoMode, session } = useDemoMode();
  const [summary, setSummary] = useState<FleetEcoSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [targetIdlingReductionPct, setTargetIdlingReductionPct] = useState<number>(50);

  // Modal de Preuve de Calcul Déterministe
  const [proofModalData, setProofModalData] = useState<CalculationProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FleetIntelligenceClient.getEcoDrivingSummary(session.token || undefined, isDemoMode);
      setSummary(data);
    } catch (err) {
      console.error('Erreur chargement éco-conduite:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session.token, isDemoMode]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const activeDieselPrice = summary?.activeFuelPriceDzd ?? 0;

  const handleOpenLossProof = () => {
    if (!summary) return;
    setProofModalData({
      title: 'Preuve du Calcul de la Perte Financière au Ralenti (Naftal)',
      decisionOrMetricName: `Perte Trésorerie Flotte : -${summary.totalFinancialLossDzd.toLocaleString('fr-DZ')} DA`,
      category: 'FINANCIAL',
      ruleId: 'ALGO-IDLING-LOSS-01',
      legalOrOemReference:
        summary.fuelPriceReference ||
        'Table platform_fiscal_fuel_prices (Loi de Finances / Ministère des Hydrocarbures et des Mines 2026)',
      deterministicFormula: 'Perte_Trésorerie (DA) = Volume_Ralenti (Litres) × Tarif_Gasoil_Pompe (DA/L)',
      formulaExplanation:
        'Le volume de gasoil gaspillé est calculé selon les abaques OEM constructeur (débit moyen de 2.4 L/h pour tracteurs routiers et poids lourds au ralenti) et valorisé strictement au tarif officiel en vigueur configuré dans le moteur fiscal /admin/fiscal.',
      variables: [
        {
          name: 'Volume Gasoil Gaspillé',
          symbol: 'V_ralenti',
          value: summary.totalWastedFuelLiters.toFixed(1),
          unit: 'Litres',
          source: 'Télématique Traccar & flux CANbus J1939',
        },
        {
          name: 'Tarif Officiel Pompe Gasoil',
          symbol: 'P_gasoil',
          value: activeDieselPrice.toFixed(2),
          unit: 'DA/L',
          source: 'Moteur Fiscal /admin/fiscal (platform_fiscal_fuel_prices)',
        },
        {
          name: 'Heures Moteur au Ralenti',
          symbol: 'T_ralenti',
          value: summary.totalIdlingHours.toFixed(1),
          unit: 'Heures',
          source: 'Capteur Régime Moteur < 800 RPM à vitesse nulle',
        },
        {
          name: 'Débit Moyen Constructeur',
          symbol: 'D_moteur',
          value: '2.4',
          unit: 'L/h',
          source: 'Spécification OEM Poids Lourd (Mode 0 / J1939)',
        },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Calcul du Volume de Carburant Perdu au Ralenti',
          formula: 'V_perte = T_ralenti × Débit_moyen_OEM',
          calculation: `${summary.totalIdlingHours}h × 2.4 L/h`,
          intermediateResult: `${summary.totalWastedFuelLiters} Litres`,
        },
        {
          stepNumber: 2,
          description: 'Valorisation Monétaire au Tarif Officiel en Vigueur',
          formula: 'Perte_DA = V_perte × P_gasoil_2026',
          calculation: `${summary.totalWastedFuelLiters} L × ${activeDieselPrice.toFixed(2)} DA/L`,
          intermediateResult: `${summary.totalFinancialLossDzd.toLocaleString('fr-DZ')} DA`,
        },
        {
          stepNumber: 3,
          description: 'Objectif d\'Économie Récupérable (75%)',
          formula: 'Économie_Cible = Perte_DA × 75%',
          calculation: `${summary.totalFinancialLossDzd.toLocaleString('fr-DZ')} DA × 0.75`,
          intermediateResult: `+${summary.potentialSavingsDzd.toLocaleString('fr-DZ')} DA`,
        },
      ],
      finalResult: {
        label: 'Perte Trésorerie Mensuelle',
        value: `-${summary.totalFinancialLossDzd.toLocaleString('fr-DZ')}`,
        unit: 'DA',
        conclusion: `Perte sèche mensuelle de ${summary.totalFinancialLossDzd.toLocaleString('fr-DZ')} DA valorisée au tarif officiel de ${activeDieselPrice.toFixed(2)} DA/L. Un plan d'action (coupure automatique après 5 min de ralenti) permet de récupérer +${summary.potentialSavingsDzd.toLocaleString('fr-DZ')} DA/mois.`,
      },
    });
    setIsProofModalOpen(true);
  };

  const handleOpenDriverProof = (driver: DriverEcoScore) => {
    setProofModalData({
      title: `Preuve du Gaspillage Ralenti : ${driver.driverName}`,
      decisionOrMetricName: `${driver.driverName} — Ralenti : -${driver.idlingCostDzd.toLocaleString('fr-DZ')} DA`,
      category: 'FINANCIAL',
      ruleId: 'ALGO-DRIVER-IDLING',
      legalOrOemReference:
        summary?.fuelPriceReference ||
        'Barème officiel de carburant en vigueur (platform_fiscal_fuel_prices)',
      deterministicFormula: 'Coût_Ralenti_Conducteur = Litres_Ralenti × Tarif_Pompe_Gasoil',
      formulaExplanation:
        'Calcul du coût direct du ralenti pour ce conducteur en appliquant le tarif officiel du gasoil en vigueur issu du moteur fiscal.',
      variables: [
        { name: 'Heures de Ralenti', symbol: 'H_ralenti', value: driver.idlingHours.toString(), unit: 'h', source: 'Traccar GPS' },
        { name: 'Litres Gaspillés', symbol: 'L_ralenti', value: driver.idlingFuelLiters.toString(), unit: 'L', source: 'CANbus débit ralenti' },
        { name: 'Tarif Gasoil Naftal', symbol: 'P_gasoil', value: activeDieselPrice.toFixed(2), unit: 'DA/L', source: '/admin/fiscal' },
        { name: 'Score Conduite', symbol: 'Score', value: driver.score100.toString(), unit: '/100', source: 'Matrice Comportement' },
      ],
      steps: [
        {
          stepNumber: 1,
          description: 'Valorisation Monétaire du Ralenti Conducteur',
          formula: 'Coût = Litres × P_gasoil',
          calculation: `${driver.idlingFuelLiters} L × ${activeDieselPrice.toFixed(2)} DA/L`,
          intermediateResult: `${driver.idlingCostDzd.toLocaleString('fr-DZ')} DA`,
        },
      ],
      finalResult: {
        label: 'Perte Financière Conducteur',
        value: `-${driver.idlingCostDzd.toLocaleString('fr-DZ')}`,
        unit: 'DA',
        conclusion: `Gaspillage individuel de ${driver.idlingCostDzd.toLocaleString('fr-DZ')} DA (${driver.idlingHours}h à l'arrêt moteur tournant).`,
      },
    });
    setIsProofModalOpen(true);
  };

  const allDrivers: DriverEcoScore[] = summary
    ? [...summary.topDrivers, ...summary.bottomDrivers]
    : [];

  const filteredDrivers = allDrivers.filter((d) => {
    if (filterSeverity === 'ALL') return true;
    return d.level === filterSeverity;
  });

  const simulatedSavingsDzd = summary
    ? Math.round(summary.totalFinancialLossDzd * (targetIdlingReductionPct / 100))
    : 0;

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'ok';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  return (
    <>
      <Navbar />

      <main className="df-container" style={{ paddingTop: '0.5rem' }}>
        {/* EN-TÊTE DE SECTION COCKPIT */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1.25rem',
            borderBottom: '1px solid var(--df-border-subtle)',
            paddingBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.85rem' }}>🌿</span>
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--df-text-main)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Éco-Conduite & Chasse au Gaspillage Naftal
              </h1>
              <Badge variant="ok">
                Tarif Naftal {activeDieselPrice > 0 ? `${activeDieselPrice.toFixed(2)} DA/L` : 'Synchronisation...'} (Moteur Fiscal)
              </Badge>
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--df-text-muted)',
                margin: 0,
                maxWidth: '820px',
                lineHeight: 1.55,
              }}
            >
              Surveillance continue du ralenti excessif, télémétrie des comportements au volant (CAN J1939 & Traccar) et valorisation financière directe en Dinars Algériens selon le tarif officiel synchronisé avec le moteur fiscal.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outline" size="sm" onClick={loadSummary} disabled={isLoading}>
              {isLoading ? '⏳ Chargement...' : '🔄 Actualiser Télémétrie'}
            </Button>
            <Link href="/admin/fiscal" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm">
                ⛽ Barèmes Fiscaux
              </Button>
            </Link>
            <Link href="/decisions" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                Arbitrage & Décision SAD →
              </Button>
            </Link>
          </div>
        </div>

        {/* MÉTRIQUES CLÉS CONSOLIDÉES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <MetricCard
            title="Score Moyen Flotte"
            value={summary ? `${summary.averageFleetScore}` : '--'}
            unit="/ 100"
            description="Indice consolidé de conduite rationnelle"
            icon="🏆"
            progressPercent={summary?.averageFleetScore}
          />
          <MetricCard
            title="Gaspillage Ralenti (Mois)"
            value={summary ? `${summary.totalWastedFuelLiters.toLocaleString('fr-DZ')}` : '--'}
            unit="Litres"
            description={summary ? `${summary.totalIdlingHours} heures moteur à l'arrêt` : '0 L'}
            icon="⏱️"
          />
          <MetricCard
            title="Perte Trésorerie Naftal"
            value={summary ? `${summary.totalFinancialLossDzd.toLocaleString('fr-DZ')}` : '--'}
            unit="DA"
            description={
              activeDieselPrice > 0
                ? `Valorisé au tarif officiel de ${activeDieselPrice.toFixed(2)} DA/L (Moteur Fiscal)`
                : 'Tarif en cours de synchronisation avec le moteur fiscal'
            }
            icon="💸"
            trend={{
              direction: 'down',
              text: 'Perte sèche évitable',
              isPositive: false,
            }}
            actions={
              <CalculationProofButton
                label="Preuve Perte"
                size="xs"
                variant="amber"
                onClick={handleOpenLossProof}
              />
            }
          />
          <MetricCard
            title="Économies Récupérables"
            value={summary ? `+${summary.potentialSavingsDzd.toLocaleString('fr-DZ')}` : '--'}
            unit="DA"
            description="Objectif 75% du gaspillage résorbé"
            icon="📈"
            trend={{
              direction: 'up',
              text: 'Gain direct trésorerie',
              isPositive: true,
            }}
            actions={
              <CalculationProofButton
                label="Preuve Gain"
                size="xs"
                variant="emerald"
                onClick={handleOpenLossProof}
              />
            }
          />
        </div>

        {/* SIMULATEUR D'ARBITRAGE ÉCONOMIQUE & GAIN FINANCIER */}
        <Card
          style={{
            marginBottom: '2rem',
            padding: '1.75rem',
            background: 'linear-gradient(135deg, var(--df-bg-surface-1) 0%, var(--df-bg-surface-2) 100%)',
            border: '1px solid var(--df-border-subtle)',
            borderTop: '2px solid var(--df-accent-cyan)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2rem',
            }}
          >
            <div style={{ maxWidth: '640px', flex: '1 1 360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.35rem' }}>💡</span>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--df-text-main)',
                    margin: 0,
                  }}
                >
                  Simulateur d’Arbitrage Économique (Ralenti Moteur)
                </h3>
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--df-text-muted)',
                  lineHeight: 1.5,
                  marginBottom: '1.25rem',
                }}
              >
                Un tracteur routier au ralenti consomme en moyenne <strong style={{ color: 'var(--df-text-main)' }}>2.4 L/heure</strong>. En sensibilisant les chauffeurs ou en paramétrant l&apos;arrêt moteur automatique Traccar après 5 minutes de stationnement, visualisez votre économie nette.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--df-text-secondary)', fontWeight: 600 }}>
                  Réduction du ralenti ciblée :
                </span>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={targetIdlingReductionPct}
                  onChange={(e) => setTargetIdlingReductionPct(Number(e.target.value))}
                  style={{
                    flex: '1 1 180px',
                    maxWidth: '260px',
                    accentColor: 'var(--df-accent-cyan)',
                    cursor: 'pointer',
                  }}
                />
                <span
                  className="df-mono"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--df-accent-cyan)',
                    minWidth: '50px',
                  }}
                >
                  {targetIdlingReductionPct}%
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--df-bg-surface-3)',
                padding: '1.5rem 2rem',
                borderRadius: 'var(--df-radius-md)',
                border: '1px solid var(--df-border-medium)',
                textAlign: 'center',
                minWidth: '260px',
                boxShadow: 'var(--df-shadow-md)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--df-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Gain Mensuel Estimé
              </span>
              <div
                className="df-mono"
                style={{
                  fontSize: '2.15rem',
                  fontWeight: 800,
                  color: 'var(--df-status-ok)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                +{simulatedSavingsDzd.toLocaleString('fr-DZ')} DA
              </div>
              <span
                className="df-mono"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--df-text-faint)',
                  display: 'block',
                  marginTop: '0.45rem',
                }}
              >
                soit ~{(simulatedSavingsDzd * 12).toLocaleString('fr-DZ')} DA / an
              </span>
            </div>
          </div>
        </Card>

        {/* TABLEAU D'HONNEUR & SCORECARD DES CHAUFFEURS */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--df-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'var(--df-bg-surface-1)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.15rem' }}>🎖️</span>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--df-text-main)',
                    margin: 0,
                  }}
                >
                  Classement Télématique & Scorecard Conducteurs
                </h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--df-text-muted)', margin: '0.2rem 0 0 0' }}>
                Pondération déterministe pénalisant freinages brusques, accélérations brutales, survitesse et surconsommation.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', fontWeight: 600 }}>
                Niveau :
              </span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                style={{
                  background: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: 'var(--df-radius-sm)',
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem',
                  color: 'var(--df-text-main)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Tous les niveaux</option>
                <option value={DrivingSeverityLevel.EXCELLENT}>Excellent (90-100)</option>
                <option value={DrivingSeverityLevel.GOOD}>Bon (75-89)</option>
                <option value={DrivingSeverityLevel.MODERATE}>Modéré (60-74)</option>
                <option value={DrivingSeverityLevel.RISKY}>À Risque (&lt;60)</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Chauffeur
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Score & Statut
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Distance & Service
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Ralenti & Perte Naftal
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Incidents Comportement
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--df-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Prime Éco Suggérée
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--df-text-muted)' }}>
                      Aucun chauffeur correspondant au filtre sélectionné.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr
                      key={driver.driverId}
                      style={{
                        borderBottom: '1px solid var(--df-border-subtle)',
                        transition: 'background var(--df-transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--df-bg-surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--df-text-main)' }}>
                          {driver.driverName}
                        </div>
                        <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                          ID: {driver.driverId}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            className="df-mono"
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 800,
                              color:
                                driver.score100 >= 90
                                  ? 'var(--df-status-ok)'
                                  : driver.score100 >= 75
                                  ? 'var(--df-accent-cyan)'
                                  : driver.score100 >= 60
                                  ? 'var(--df-status-warning)'
                                  : 'var(--df-status-danger)',
                            }}
                          >
                            {driver.score100}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>/ 100</span>
                          <Badge variant={getScoreBadgeVariant(driver.score100)}>
                            {driver.level}
                          </Badge>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div className="df-mono" style={{ fontSize: '0.85rem', color: 'var(--df-text-main)', fontWeight: 600 }}>
                          {driver.totalDistanceKm.toLocaleString('fr-DZ')} km
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                          {driver.totalOperatingHours}h de service actif
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            <div
                              className="df-mono"
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: driver.idlingCostDzd > 0 ? 'var(--df-status-danger)' : 'var(--df-text-main)',
                              }}
                            >
                              -{driver.idlingCostDzd.toLocaleString('fr-DZ')} DA
                            </div>
                            <div className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                              {driver.idlingHours}h ralenti ({driver.idlingFuelLiters} L)
                            </div>
                          </div>
                          {driver.idlingCostDzd > 0 && (
                            <CalculationProofButton
                              label="Preuve"
                              size="xs"
                              variant="amber"
                              onClick={() => handleOpenDriverProof(driver)}
                            />
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem' }}>
                          <span style={{ color: 'var(--df-text-secondary)' }}>
                            Freinages bruts : <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>{driver.harshBrakeCount}</strong>
                          </span>
                          <span style={{ color: 'var(--df-text-secondary)' }}>
                            Accélérations : <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>{driver.harshAccelCount}</strong>
                          </span>
                          <span style={{ color: 'var(--df-text-secondary)' }}>
                            Excès vitesse : <strong className="df-mono" style={{ color: driver.overspeedMinutes > 0 ? 'var(--df-status-warning)' : 'var(--df-text-main)' }}>{driver.overspeedMinutes} min</strong>
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {driver.suggestedEcoBonusDzd > 0 ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span
                              className="df-mono"
                              style={{
                                fontWeight: 800,
                                color: 'var(--df-status-ok)',
                                fontSize: '0.95rem',
                              }}
                            >
                              +{driver.suggestedEcoBonusDzd.toLocaleString('fr-DZ')} DA
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--df-text-muted)' }}>
                              Prime mensuelle
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--df-text-faint)' }}>
                            Aucune prime
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL DE PREUVE DE CALCUL DÉTERMINISTE */}
        <CalculationProofModal
          isOpen={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          data={proofModalData}
        />
      </main>
    </>
  );
}
