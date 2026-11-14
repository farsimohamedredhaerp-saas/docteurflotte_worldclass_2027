'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../navigation/Navbar';
import { DecisionCard } from '../DecisionCard';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { ApiStatusPanel } from '../ApiStatusPanel';
import { HighDensityKpiGrid } from '../density/HighDensityKpiGrid';
import { FleetHighDensityTable } from '../density/FleetHighDensityTable';
import {
  IconCheck,
  IconX,
  IconShieldCheck,
  IconActivity,
  IconWrench,
  IconFuel,
  IconCpu,
  IconZap,
  IconArrowUpRight,
  IconLayers,
} from '../navigation/TechIcons';

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

export function ExecutiveDashboardClient() {
  const [decisions, setDecisions] = useState<DecisionItem[]>(INITIAL_DECISIONS);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  const handleApprove = (decision: DecisionItem) => {
    setNotification(
      `Ordre de travail généré pour l'actif ${decision.assetName} (${decision.id}) — arbitrage consigné au registre.`
    );
    setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
    setTimeout(() => setNotification(null), 6000);
  };

  const handleDismiss = (decision: DecisionItem) => {
    setNotification(`Recommandation ${decision.id} différée avec motif d'exploitation.`);
    setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
    setTimeout(() => setNotification(null), 5000);
  };

  const handleResetDemo = () => {
    setDecisions(INITIAL_DECISIONS);
    setNotification('Données de démonstration réinitialisées avec succès.');
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
      {/* BARRE HORIZONTALE PRINCIPALE */}
      <Navbar onResetDemo={handleResetDemo} />

      <div className="df-container" style={{ paddingTop: '0.25rem', paddingBottom: '3.5rem' }}>
        {/* BANNIÈRE DE NOTIFICATION FLOTTANTE */}
        {notification && (
          <div
            role="status"
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-focus)',
              color: 'var(--df-text-main)',
              padding: '0.75rem 1.15rem',
              borderRadius: 'var(--df-radius-sm)',
              marginBottom: '1.25rem',
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
              <span style={{ fontSize: '0.825rem', fontWeight: 500 }}>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--df-text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* 1. SECTION COMMAND CENTER HEADER */}
        <section
          style={{
            padding: '1.75rem 1.5rem',
            marginBottom: '1.5rem',
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
          <div style={{ maxWidth: '820px' }}>
            {/* EYEBROW SÉMANTIQUE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
              <Badge variant="ok" pulse>
                Maintenance 5.0 Prescriptive
              </Badge>
              <span style={{ color: 'var(--df-border-medium)', opacity: 0.6 }} aria-hidden="true">•</span>
              <span style={{ fontSize: '0.70rem', color: 'var(--df-text-secondary)', fontWeight: 500 }}>
                Physique Déterministe 0 DA • Arbitrage DZD • Loi 18-07 ANPDP
              </span>
            </div>

            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.025em',
                marginBottom: '0.45rem',
                color: 'var(--df-text-main)',
              }}
            >
              Supervision Télémetrique & Arbitrage Financier de Flotte
            </h1>

            <p style={{ fontSize: '0.86rem', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '1.15rem' }}>
              Chaque signal télématique est transformé en décision financière en Dinars Algériens (DZD). Modélisation continue des 6 organes d’usure sans matériel additionnel et réconciliation instantanée des pleins Naftal.
            </p>

            {/* RACCOURCIS RAPIDES D'EXPLOITATION */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/preventive"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-accent-blue)',
                  color: '#ffffff',
                  padding: '0.42rem 0.9rem',
                  borderRadius: 'var(--df-radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <IconWrench size={13} />
                <span>Cockpit Maintenance</span>
              </Link>

              <Link
                href="/live-cockpit"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  border: '1px solid var(--df-border-medium)',
                  padding: '0.42rem 0.9rem',
                  borderRadius: 'var(--df-radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <IconActivity size={13} style={{ color: 'var(--df-status-ok)' }} />
                <span>Télématique Temps Réel</span>
              </Link>

              <Link
                href="/fuel-scanner"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  border: '1px solid var(--df-border-subtle)',
                  padding: '0.42rem 0.8rem',
                  borderRadius: 'var(--df-radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <IconFuel size={13} />
                <span>Scanner Naftal</span>
              </Link>

              <Link
                href="/digital-twin"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  border: '1px solid var(--df-border-subtle)',
                  padding: '0.42rem 0.8rem',
                  borderRadius: 'var(--df-radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <IconCpu size={13} />
                <span>Jumeau Numérique</span>
              </Link>

              <Link
                href="/copilot"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-2)',
                  color: 'var(--df-text-main)',
                  border: '1px solid var(--df-border-subtle)',
                  padding: '0.42rem 0.8rem',
                  borderRadius: 'var(--df-radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <IconZap size={13} style={{ color: 'var(--df-accent-blue)' }} />
                <span>Copilote IA</span>
              </Link>
            </div>
          </div>

          {/* RÉSUMÉ D'ÉTAT SYSTÈME */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              minWidth: '220px',
              padding: '1rem',
              background: 'var(--df-bg-surface-2)',
              borderRadius: 'var(--df-radius-md)',
              border: '1px solid var(--df-border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--df-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Statut Flotte Temps Réel
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
              <span style={{ color: 'var(--df-text-secondary)' }}>Actifs Supervisés</span>
              <strong className="df-mono" style={{ color: 'var(--df-text-main)', fontWeight: 600 }}>52 Unités</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
              <span style={{ color: 'var(--df-text-secondary)' }}>Qualité Télématique</span>
              <strong className="df-mono" style={{ color: 'var(--df-status-ok)', fontWeight: 600 }}>100% Nominale</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
              <span style={{ color: 'var(--df-text-secondary)' }}>Sécurité Multi-Tenant</span>
              <strong className="df-mono" style={{ color: 'var(--df-accent-blue)', fontWeight: 600 }}>PostgreSQL RLS</strong>
            </div>
          </div>
        </section>

        {/* 2. RANGÉE DE KPIS DÉCISIONNELS HAUTE DENSITÉ */}
        <section style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--df-text-main)', letterSpacing: '-0.015em', margin: 0 }}>
              Métrologie de Flotte & Performance Opérationnelle
            </h2>
            <span className="df-mono" style={{ fontSize: '0.72rem', color: 'var(--df-text-muted)' }}>
              Rafraîchissement &lt; 5s • Référentiel JORADP / ENACTA
            </span>
          </div>

          <HighDensityKpiGrid />
        </section>

        {/* BANNIÈRE ARBITRAGE ÉCONOMIQUE & ROI CLIENT */}
        <section
          style={{
            marginBottom: '1.75rem',
            padding: '1.15rem 1.35rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--df-radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconShieldCheck size={20} strokeWidth={1.75} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--df-text-main)' }}>
                  Arbitrage Décisionnel Mensuel : Coût d&apos;Action vs Risque d&apos;Inaction
                </span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 'var(--df-radius-xs)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  ROI : 14.1x
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--df-text-secondary)', margin: '0.15rem 0 0 0' }}>
                Lois physiques Arrhenius &amp; Archard : 2 avaries critiques anticipées (Turbo Scania &amp; Filtration CAT).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Risque Évité
              </div>
              <div className="df-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--df-status-danger)' }}>
                1 850 000 DA
              </div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--df-border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coût Préventif
              </div>
              <div className="df-mono" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--df-text-secondary)' }}>
                131 000 DA
              </div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--df-border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Gain Net Client
              </div>
              <div className="df-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--df-status-ok)' }}>
                +1 719 000 DA
              </div>
            </div>
          </div>
        </section>

        {/* ── PARADIGME INDUSTRIEL : LES 5 GÉNÉRATIONS DE MAINTENANCE ── */}
        <section
          style={{
            marginBottom: '2rem',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: 'var(--df-radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'inline-flex', gap: '6px', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  Paradigme de Maintenance 5.0
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  Coût Matériel Zéro Capteur (0 DA)
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--df-text-main)', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                Pourquoi DocteurFlotte surpasse la Maintenance 4.0 Traditionnelle
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--df-text-secondary)', maxWidth: '880px', margin: 0, lineHeight: 1.55 }}>
                Tandis que les acteurs mondiaux (Samsara, Geotab) s&apos;arrêtent à la télématique 4.0 passive (alertes kilométriques boîte noire sans arbitrage économique), DocteurFlotte introduit la <strong>Maintenance 5.0 prescriptive</strong> : physique déterministe 6 organes, arbitrage direct en Dinars Algériens (DZD) et assistant d’atelier bilingue.
              </p>
            </div>

            <Link
              href="/preventive"
              style={{
                textDecoration: 'none',
                background: 'var(--df-bg-surface-2)',
                color: 'var(--df-text-main)',
                border: '1px solid var(--df-border-medium)',
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--df-radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all var(--df-transition-fast)',
              }}
            >
              <span>Explorer le Cockpit 5.0</span>
              <IconArrowUpRight size={13} />
            </Link>
          </div>

          {/* Grille comparative des 5 Générations de Maintenance */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
            }}
          >
            {/* 1.0 */}
            <div
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px',
                opacity: 0.75,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1.0 (1970 - 1990)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '2px' }}>
                Réactive &amp; Curative
              </div>
              <div style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 500, marginTop: '4px' }}>
                « On répare quand ça casse »
              </div>
              <p style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
                Casse mécanique sur route, immobilisation lourde, remorquage d&apos;urgence et coûts d&apos;exploitation imprévisibles.
              </p>
            </div>

            {/* 2.0 */}
            <div
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px',
                opacity: 0.8,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2.0 (1990 - 2010)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '2px' }}>
                Préventive Aveugle
              </div>
              <div style={{ fontSize: '10.5px', color: '#f59e0b', fontWeight: 500, marginTop: '4px' }}>
                « Vidange fixe tous les 10 000 km »
              </div>
              <p style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
                Intervalles calendaires rigides. Remplacement prématuré de 35% d’huiles encore viables ou casse sous contrainte saharienne.
              </p>
            </div>

            {/* 3.0 */}
            <div
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px',
                opacity: 0.85,
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3.0 (2010 - 2018)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '2px' }}>
                Conditionnelle Basique
              </div>
              <div style={{ fontSize: '10.5px', color: '#3b82f6', fontWeight: 500, marginTop: '4px' }}>
                « Voyants et seuils simples »
              </div>
              <p style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
                Voyant tableau de bord ou température &gt; 95°C. L&apos;alerte survient quand l&apos;usure mécanique est déjà amorcée.
              </p>
            </div>

            {/* 4.0 */}
            <div
              style={{
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                4.0 (2018 - 2024)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '2px' }}>
                Prédictive Statistique
              </div>
              <div style={{ fontSize: '10.5px', color: '#8b5cf6', fontWeight: 500, marginTop: '4px' }}>
                « Machine Learning boîte noire »
              </div>
              <p style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
                Capteurs rapportés onéreux, modèles probabilistes avec faux positifs fréquents, sans chiffrage de rentabilité en DZD.
              </p>
            </div>

            {/* 5.0 DOCTEURFLOTTE */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--df-radius-md)',
                padding: '12px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-9px',
                  right: '10px',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                DOCTEURFLOTTE
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                5.0 (2026 - 2030+)
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-text-main)', marginTop: '2px' }}>
                Prescriptive &amp; Autonome
              </div>
              <div style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>
                « Physique Déterministe &amp; Arbitrage DZD »
              </div>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '14px', fontSize: '10.5px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                <li><strong>Coût Matériel = 0 DA :</strong> Signaux natifs J1939 + ADC 24V.</li>
                <li><strong>Arbitrage DZD (SAD → ADS) :</strong> Coût d&apos;action vs Risque d&apos;inaction.</li>
                <li><strong>Preuves Physiques :</strong> CUSUM, Arrhenius, Archard.</li>
                <li><strong>Assistant Vocal :</strong> Diagnostic direct en Darja &amp; Français.</li>
                <li><strong>Souveraineté :</strong> 100% On-Premise, résilient aux 58 Wilayas.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. TABLEAU HAUTE DENSITÉ DE SUPERVISION DE FLOTTE */}
        <section style={{ marginBottom: '2rem' }}>
          <FleetHighDensityTable />
        </section>

        {/* 4. FLUX DÉCISIONNEL INTERACTIF (SAD -> ADS) */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                  Arbitrages Décisionnels en Attente
                </h2>
                <Badge variant="warning">{decisions.length} Action{decisions.length > 1 ? 's' : ''}</Badge>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--df-text-muted)', marginTop: '0.2rem', margin: 0 }}>
                Recommandations explicables avec analyse comparative du coût de l&apos;action préventive vs risque de panne.
              </p>
            </div>

            {/* Filtres par catégorie d'actifs */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--df-bg-surface-2)', padding: '0.2rem', borderRadius: 'var(--df-radius-md)', border: '1px solid var(--df-border-subtle)' }}>
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
                    color: selectedFilter === filter.id ? '#ffffff' : 'var(--df-text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--df-radius-sm)',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.74rem',
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
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: 'var(--df-radius-lg)',
              }}
            >
              <div style={{ color: 'var(--df-status-ok)', display: 'flex', justifyContent: 'center', marginBottom: '0.65rem' }}>
                <IconCheck size={24} strokeWidth={2} />
              </div>
              <div style={{ color: 'var(--df-text-main)', fontWeight: 600, fontSize: '0.98rem', marginBottom: '0.25rem' }}>
                Aucune anomalie ou arbitrage en attente pour cette sélection
              </div>
              <p style={{ color: 'var(--df-text-muted)', fontSize: '0.80rem', marginBottom: '1rem', maxWidth: '440px', margin: '0 auto 1rem auto' }}>
                Toutes les recommandations ont été traitées ou les compteurs sont nominaux.
              </p>
              <Button variant="secondary" size="sm" onClick={handleResetDemo}>
                Recharger les Scénarios de Démonstration
              </Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
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
        <section style={{ marginBottom: '2rem' }}>
          <ApiStatusPanel />
        </section>

        {/* 6. PIED DE PAGE OFFICIEL */}
        <footer
          style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--df-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--df-text-muted)',
            fontSize: '0.74rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            DocteurFlotte © 2026-2027 — Console d&apos;Opérations et Maintenance des Actifs Connectés.
          </div>
          <div className="df-mono" style={{ display: 'flex', gap: '1rem', fontSize: '0.70rem' }}>
            <span>PostgreSQL RLS</span>
            <span>Redis 7.2</span>
            <span>Traccar Gateway</span>
            <span>Loi 18-07 ANPDP</span>
          </div>
        </footer>
      </div>
    </>
  );
}
