'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/navigation/Navbar';
import { MetricCard } from '../components/MetricCard';
import { DecisionCard } from '../components/DecisionCard';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ApiStatusPanel } from '../components/ApiStatusPanel';
import { HighDensityKpiGrid } from '../components/density/HighDensityKpiGrid';
import { FleetHighDensityTable } from '../components/density/FleetHighDensityTable';
import {
  IconCheck,
  IconX,
  IconShieldCheck,
  IconActivity,
  IconTruck,
  IconWrench,
  IconSlidersHorizontal,
} from '../components/navigation/TechIcons';

interface DecisionItem {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  urgency: 'danger' | 'warning' | 'info';
  anomalyTitle: string;
  anomalyDescription: string;
  costEstimate: string;
  costInactionEstimate?: string;
  confidenceScore: number;
  isDemo: boolean;
  telemetryDetails: {
    lastPing: string;
    ignition: 'ON' | 'OFF';
    gpsFix: boolean;
    currentSpeed: number;
  };
}

const INITIAL_DECISIONS: DecisionItem[] = [
  {
    id: 'DEC-001',
    assetId: 'PL-16-042-DZ',
    assetName: 'Tracteur Routier Scania R450',
    assetCategory: 'Poids Lourds',
    urgency: 'danger',
    anomalyTitle: 'Échéance de révision critique dépassée (+1 250 km)',
    anomalyDescription:
      'Le compteur kilométrique validé (181 250 km) a franchi le seuil de vidange moteur et remplacement filtre. Risque d\'usure prématurée du turbocompresseur en cas de maintien en mission.',
    costEstimate: '68 000 DA',
    costInactionEstimate: '380 000 DA (Casse turbo/moteur)',
    confidenceScore: 98,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 45s',
      ignition: 'ON',
      gpsFix: true,
      currentSpeed: 72,
    },
  },
  {
    id: 'DEC-002',
    assetId: 'ENG-23-018-DZ',
    assetName: 'Pelle Hydraulique Caterpillar 320D',
    assetCategory: 'Engins BTP',
    urgency: 'warning',
    anomalyTitle: 'Seuil de maintenance hydraulique atteint (512 h / 500 h)',
    anomalyDescription:
      'L\'analyse du compteur horaire télématique indique un franchissement du cycle préventif de filtration hydraulique. Intervention recommandée sous 48h pour éviter l\'immobilisation sur chantier.',
    costEstimate: '45 000 DA',
    costInactionEstimate: '290 000 DA (Arrêt de chantier)',
    confidenceScore: 96,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 1 min',
      ignition: 'ON',
      gpsFix: true,
      currentSpeed: 0,
    },
  },
  {
    id: 'DEC-003',
    assetId: 'VL-09-114-DZ',
    assetName: 'Toyota Hilux 2.4 D-4D',
    assetCategory: 'Véhicules Légers',
    urgency: 'info',
    anomalyTitle: 'Permutation et contrôle géométrie pneumatiques',
    anomalyDescription:
      'Recommandation préventive suite à un différentiel de consommation et 20 000 km parcourus depuis la dernière inspection du train roulant.',
    costEstimate: '18 000 DA',
    confidenceScore: 94,
    isDemo: true,
    telemetryDetails: {
      lastPing: '< 3 min',
      ignition: 'OFF',
      gpsFix: true,
      currentSpeed: 0,
    },
  },
];

export default function HomePage() {
  const [decisions, setDecisions] = useState<DecisionItem[]>(INITIAL_DECISIONS);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  const handleApprove = (decision: DecisionItem) => {
    setNotification(
      `✓ Ordre de travail généré avec succès pour l'actif ${decision.assetName} (${decision.id}) ! Impact économique consigné.`
    );
    setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
    setTimeout(() => setNotification(null), 6000);
  };

  const handleDismiss = (decision: DecisionItem) => {
    setNotification(`ℹ Décision ${decision.id} différée avec motif d'exploitation.`);
    setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
    setTimeout(() => setNotification(null), 5000);
  };

  const handleResetDemo = () => {
    setDecisions(INITIAL_DECISIONS);
    setNotification('✓ Données de démonstration réinitialisées avec succès.');
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredDecisions = decisions.filter((d) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PL') return d.assetCategory === 'Poids Lourds';
    if (selectedFilter === 'BTP') return d.assetCategory === 'Engins BTP';
    if (selectedFilter === 'VL') return d.assetCategory === 'Véhicules Légers';
    return true;
  });

  return (
    <>
      {/* BARRE HORIZONTALE PRINCIPALE AVEC MEGAMENU DE NIVEAU 1 */}
      <Navbar onResetDemo={handleResetDemo} />

      <div className="df-container" style={{ paddingTop: '0.5rem', paddingBottom: '3rem' }}>
        {/* BANNIÈRE DE NOTIFICATION FLOTTANTE */}
        {notification && (
          <div
            role="status"
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-accent-blue)',
              color: 'var(--df-text-main)',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--df-radius-md)',
              marginBottom: '1.5rem',
              boxShadow: 'var(--df-shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--df-status-ok)' }}>
                <IconCheck size={16} strokeWidth={2} />
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <IconX size={15} />
            </button>
          </div>
        )}

        {/* 1. SECTION HÉROS — COCKPIT D'OPÉRATIONS CONNECTÉES (DESIGN INDUSTRIAL SLATE CLAIR) */}
        <section
          style={{
            padding: '2rem 1.75rem',
            marginBottom: '1.75rem',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
            boxShadow: 'var(--df-shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
              <Badge variant="ok">
                Centre d&apos;Opérations Connectées • Traccar Gateway Synced (Loi 18-07)
              </Badge>
            </div>

            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                marginBottom: '0.65rem',
                color: 'var(--df-text-main)',
              }}
            >
              Le Décisionnel au Cœur de la Maintenance de Vos Actifs
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--df-text-secondary)', lineHeight: 1.55, marginBottom: '1.25rem' }}>
              Supervision de flotte de classe mondiale : fusionnez les flux télématiques en continu, anticipez les dérives d&apos;intervalles mécaniques et orchestrez les interventions au coût réel calculé.
            </p>

            {/* RACCOURCIS DE DÉMONSTRATION CLIENT & ESSAI 1-CLIC */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/live-cockpit"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-accent-blue)',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.15rem',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
                }}
              >
                <IconActivity size={15} />
                <span>Tester la Démo Sans Connexion</span>
              </Link>

              <Link
                href="/register"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-status-ok-bg)',
                  border: '1px solid var(--df-status-ok)',
                  color: 'var(--df-status-ok-text)',
                  padding: '0.55rem 1.05rem',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>✨ Créer mon Compte Entreprise</span>
              </Link>

              <Link
                href="/maintenance"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  border: '1px solid var(--df-border-subtle)',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <IconWrench size={14} />
                <span>Maintenance 4.0</span>
              </Link>

              <Link
                href="/fuel-scanner"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  border: '1px solid var(--df-border-subtle)',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>⛽ Scanner Naftal</span>
              </Link>

              <Link
                href="/digital-twin"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  border: '1px solid var(--df-border-subtle)',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--df-radius-md)',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>🔬 Jumeau Numérique</span>
              </Link>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              minWidth: '240px',
              padding: '1.15rem',
              background: 'var(--df-bg-surface-2)',
              borderRadius: 'var(--df-radius-md)',
              border: '1px solid var(--df-border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Statut Flotte Temps Réel
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--df-text-secondary)' }}>Véhicules Actifs</span>
              <strong className="df-mono" style={{ color: 'var(--df-text-main)' }}>52 Unités</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--df-text-secondary)' }}>Qualité Télématique</span>
              <strong className="df-mono" style={{ color: 'var(--df-status-ok)' }}>100% Validée</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--df-text-secondary)' }}>Isolation Multi-Tenant</span>
              <strong className="df-mono" style={{ color: 'var(--df-accent-blue)' }}>PostgreSQL RLS</strong>
            </div>
          </div>
        </section>

        {/* 2. RANGÉE DE KPIS DÉCISIONNELS HAUTE DENSITÉ */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--df-text-main)', letterSpacing: '-0.015em' }}>
              Métrologie de Flotte & Performance Opérationnelle
            </h2>
            <span className="df-mono" style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
              Rafraîchissement &lt; 5s • Données certifiées JORADP
            </span>
          </div>

          <HighDensityKpiGrid />
        </section>

        {/* BANNIÈRE ARBITRAGE ÉCONOMIQUE & ROI CLIENT */}
        <section
          style={{
            marginBottom: '2rem',
            padding: '1.25rem 1.5rem',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
            boxShadow: 'var(--df-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--df-radius-md)',
                background: 'var(--df-status-ok-bg)',
                border: '1px solid var(--df-status-ok-border)',
                color: 'var(--df-status-ok-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconShieldCheck size={24} strokeWidth={2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--df-text-main)' }}>
                  Arbitrage Décisionnel Mensuel : Coût d&apos;Action vs Risque d&apos;Inaction
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--df-radius-xs)',
                    background: 'var(--df-status-ok-bg)',
                    color: 'var(--df-status-ok-text)',
                    border: '1px solid var(--df-status-ok-border)',
                  }}
                >
                  ROI : 14.1x
                </span>
              </div>
              <p style={{ fontSize: '0.80rem', color: 'var(--df-text-secondary)', margin: '0.2rem 0 0 0' }}>
                Algorithmes Arrhenius &amp; Archard : 2 avaries critiques anticipées (Casse turbo Scania &amp; Filtration CAT).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Risque Évité
              </div>
              <div className="df-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-status-danger)' }}>
                1 850 000 DA
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'var(--df-border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coût Préventif
              </div>
              <div className="df-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--df-text-secondary)' }}>
                131 000 DA
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'var(--df-border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Gain Net Client
              </div>
              <div className="df-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--df-status-ok)' }}>
                +1 719 000 DA
              </div>
            </div>
          </div>
        </section>

        {/* 3. TABLEAU HAUTE DENSITÉ DE SUPERVISION DE FLOTTE (50+ UNITÉS) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <FleetHighDensityTable />
        </section>

        {/* 4. SECTION DU FLUX DÉCISIONNEL INTERACTIF (SAD -> ADS) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--df-text-main)', letterSpacing: '-0.02em' }}>
                  Arbitrages Décisionnels en Attente
                </h2>
                <Badge variant="warning">{decisions.length} Action{decisions.length > 1 ? 's' : ''}</Badge>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--df-text-muted)', marginTop: '0.2rem' }}>
                Recommandations explicables avec analyse comparative du coût de l&apos;action vs risque de panne.
              </p>
            </div>

            {/* Filtres par catégorie d'actifs */}
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--df-bg-surface-2)', padding: '0.25rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }}>
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'PL', label: 'Poids Lourds' },
                { id: 'BTP', label: 'Engins BTP' },
                { id: 'VL', label: 'Véhicules Légers' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  style={{
                    background: selectedFilter === filter.id ? 'var(--df-accent-blue)' : 'transparent',
                    color: selectedFilter === filter.id ? '#fff' : 'var(--df-text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--df-radius-sm)',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--df-transition-fast)',
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredDecisions.length === 0 ? (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-lg)',
              }}
            >
              <div style={{ color: 'var(--df-status-ok)', display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <IconCheck size={28} strokeWidth={2} />
              </div>
              <div style={{ color: 'var(--df-text-main)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                Aucune anomalie ou arbitrage en attente pour cette sélection
              </div>
              <p style={{ color: 'var(--df-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
                Toutes les recommandations ont été traitées ou les compteurs sont nominaux.
              </p>
              <Button variant="secondary" size="sm" onClick={handleResetDemo}>
                Recharger les Scénarios de Démonstration
              </Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {filteredDecisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  assetId={decision.assetId}
                  assetName={decision.assetName}
                  assetCategory={decision.assetCategory}
                  urgency={decision.urgency}
                  anomalyTitle={decision.anomalyTitle}
                  anomalyDescription={decision.anomalyDescription}
                  costEstimate={decision.costEstimate}
                  costInactionEstimate={decision.costInactionEstimate}
                  confidenceScore={decision.confidenceScore}
                  isDemo={decision.isDemo}
                  telemetryDetails={decision.telemetryDetails}
                  onApprove={() => handleApprove(decision)}
                  onDismiss={() => handleDismiss(decision)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 5. SUPERVISION TECHNIQUE & SANTÉ SYSTÈME */}
        <section style={{ marginBottom: '2.5rem' }}>
          <ApiStatusPanel />
        </section>

        {/* 6. FOOTER OFFICIEL */}
        <footer
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid var(--df-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--df-text-muted)',
            fontSize: '0.8rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            DocteurFlotte © 2026-2027 — Console d&apos;Opérations et Maintenance des Actifs Connectés.
          </div>
          <div className="df-mono" style={{ display: 'flex', gap: '1.25rem' }}>
            <span>PostgreSQL RLS</span>
            <span>Redis 7.2</span>
            <span>Traccar Gateway (Port 8085)</span>
            <span>Conformité Loi 18-07</span>
          </div>
        </footer>
      </div>
    </>
  );
}
