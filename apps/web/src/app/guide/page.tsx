'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navigation/Navbar';

interface DocSection {
  id: string;
  title: string;
  badge: string;
  icon: string;
}

const SECTIONS: DocSection[] = [
  { id: 'vision', title: '1. Vision & Modèle Économique', badge: 'OEM-FIRST', icon: '🎯' },
  { id: 'modes', title: '2. Les 3 Modes d’Exploitation (0 / 1 / 2)', badge: 'HARDWARE-AGNOSTIC', icon: '🚗' },
  { id: 'decision-engine', title: '3. Le Cœur Décisionnel (SAD → ADS)', badge: 'ARBITRAGE DZD', icon: '🧠' },
  { id: 'physics-algorithms', title: '4. Les 6 Algorithmes Physiques & VHI', badge: 'DÉTERMINISTE', icon: '🔬' },
  { id: 'tech-architecture', title: '5. Architecture Système & Données', badge: 'FULL-STACK', icon: '🏗️' },
  { id: 'security-compliance', title: '6. Souveraineté & Loi 18-07 ANPDP', badge: 'JORADP / RLS', icon: '🛡️' },
  { id: 'control-plane', title: '7. Console SaaS & Gouvernance', badge: 'SUPERADMIN', icon: '👑' },
  { id: 'roles-workflows', title: '8. Guide Opérationnel par Métier', badge: 'WORKFLOWS', icon: '👥' },
  { id: 'faq', title: '9. FAQ & Bonnes Pratiques', badge: 'SUPPORT', icon: '❓' },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string>('vision');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModeTab, setActiveModeTab] = useState<'mode0' | 'mode1' | 'mode2'>('mode0');
  const [selectedAlgo, setSelectedAlgo] = useState<number>(1);

  // Interactive ROI Simulator State
  const [actionCost, setActionCost] = useState<number>(35000); // 35 000 DZD
  const [towingCost, setTowingCost] = useState<number>(45000); // 45 000 DZD
  const [partReplacement, setPartReplacement] = useState<number>(75000); // 75 000 DZD
  const [immobilizationDays, setImmobilizationDays] = useState<number>(3); // 3 jours
  const [dailyLoss, setDailyLoss] = useState<number>(25000); // 25 000 DZD/jour
  const [failureProb, setFailureProb] = useState<number>(85); // 85%

  const totalInactionRisk = useMemo(() => {
    const rawBreakdownCost = towingCost + partReplacement + (immobilizationDays * dailyLoss);
    return Math.round(rawBreakdownCost * (failureProb / 100));
  }, [towingCost, partReplacement, immobilizationDays, dailyLoss, failureProb]);

  const netSavings = useMemo(() => {
    return totalInactionRisk - actionCost;
  }, [totalInactionRisk, actionCost]);

  const roiRatio = useMemo(() => {
    if (actionCost <= 0) return 0;
    return (netSavings / actionCost).toFixed(1);
  }, [netSavings, actionCost]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      {/* HEADER HERO BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 1) 100%)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '48px 24px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-40px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1360px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              DocteurFlotte Documentation Technique & Opérationnelle v2.0
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ✓ Conforme Loi 18-07 ANPDP & JORADP
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#7dd3fc',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              PostgreSQL 16 RLS Fail-Closed • TimescaleDB
            </span>
          </div>

          <h1
            style={{
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: '16px',
              background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Guide d’Architecture, Fonctionnement & Ingénierie
          </h1>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#94a3b8',
              maxWidth: '860px',
              marginBottom: '24px',
            }}
          >
            Comprendre en profondeur le fonctionnement de DocteurFlotte : sa rupture avec les télématiques classiques, 
            ses <strong>3 modes d’exploitation (dont le Mode 0 Sans Boîtier)</strong>, ses <strong>6 algorithmes déterministes de physique appliquée</strong>, 
            son arbitrage financier en Dinars Algériens (DZD) et sa stricte souveraineté nationale.
          </p>

          {/* Quick Search and Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Rechercher (ex: Arrhenius, RLS, Traccar, CUSUM, Naftal)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '15px', color: '#64748b' }}>
                🔍
              </span>
            </div>

            <Link
              href="/admin/decision-engine"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              <span>⚙️</span>
              <span>Gouvernance du Moteur Décisionnel</span>
            </Link>

            <Link
              href="/decisions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span>📊</span>
              <span>Voir les Décisions en Direct</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN DOCUMENTATION LAYOUT */}
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '36px 24px 80px',
          display: 'grid',
          gridTemplateColumns: '290px 1fr',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* SIDEBAR NAVIGATION */}
        <aside
          style={{
            position: 'sticky',
            top: '84px',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--df-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '12px',
              paddingLeft: '8px',
            }}
          >
            Table des Matières
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SECTIONS.map((sec) => {
              const isSelected = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSection(sec.id);
                    const el = document.getElementById(sec.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: isSelected ? '#818cf8' : 'var(--df-text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--df-bg-surface-2)';
                      e.currentTarget.style.color = 'var(--df-text-main)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--df-text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{sec.icon}</span>
                    <span>{sec.title}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '11.5px',
              color: '#34d399',
              lineHeight: 1.5,
            }}
          >
            <strong>Point d’Appui Réglementaire :</strong> Toutes les règles de maintenance et conformité sont calquées sur les textes officiels 
            du JORADP (Arrêtés ENACTA, Loi de Finances 2025, Loi 18-07).
          </div>
        </aside>

        {/* CONTENT PANELS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

          {/* SECTION 1: VISION & PHILOSOPHIE */}
          <section id="vision" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🎯</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                1. Vision & Philosophie : Rompre avec les Télématiques Classiques
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              La quasi-totalité des solutions de télématique du marché échouent dans les flottes algériennes pour 3 raisons majeures :
              elles exigent l’installation coûteuse d’un boîtier sur 100% des véhicules dès le premier jour, 
              elles se limitent à du pistage passif (points sur une carte) et elles bombardent les gestionnaires de fausses alertes sans quantification financière.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '12px',
                  padding: '20px',
                  borderTop: '4px solid #ef4444',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fca5a5', marginBottom: '8px' }}>
                  ❌ Les Outils Traditionnels (Pistage Passif)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.7 }}>
                  <li>Obligation d'acheter et d'installer des boîtiers GPS sur tout le parc.</li>
                  <li>Simple géolocalisation ("Le camion est à Sétif").</li>
                  <li>Alertes kilométriques aveugles ignorant la sévérité du climat saharien.</li>
                  <li>Aucun arbitrage financier : aucune conversion en Dinars Algériens (DZD).</li>
                  <li>Données souvent hébergées à l'étranger en violation de la Loi 18-07.</li>
                </ul>
              </div>

              <div
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '20px',
                  borderTop: '4px solid #10b981',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#6ee7b7', marginBottom: '8px' }}>
                  ✨ Le Paradigme DocteurFlotte (OEM-First & Décisionnel)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                  <li><strong>Opérationnel dès le Jour 1 en Mode 0</strong> sans aucun investissement matériel.</li>
                  <li><strong>Moteur SAD → ADS :</strong> Recommande ou exécute des actions concrètes.</li>
                  <li><strong>Modélisation de la Physique Réelle :</strong> Équations d'Arrhenius, Archard, thermodynamique culasse.</li>
                  <li><strong>Arbitrage Financier Strict :</strong> Compare le coût d'intervention au risque de panne en DZD.</li>
                  <li><strong>Souveraineté Intégrale :</strong> Hébergement local, RLS Fail-Closed et zéro PII sortante.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 2: LES 3 MODES D'EXPLOITATION */}
          <section id="modes" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🚗</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                2. Les 3 Modes d'Exploitation : Flexibilité Totale du Parc
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              DocteurFlotte permet à un même tenant de mixer différents niveaux d'équipement dans sa flotte sans aucune friction :
            </p>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { key: 'mode0', label: 'Mode 0 : Sans Boîtier (Zero-Hardware)', icon: '📱' },
                { key: 'mode1', label: 'Mode 1 : GPS Standard Traccar', icon: '📡' },
                { key: 'mode2', label: 'Mode 2 : Full CAN / J1939 Haute Fréquence', icon: '⚡' },
              ].map((tab) => {
                const isSelected = activeModeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveModeTab(tab.key as any)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--df-bg-surface-1)',
                      color: isSelected ? '#fff' : 'var(--df-text-muted)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Details */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              {activeModeTab === 'mode0' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                      📱 Mode 0 — Zero-Hardware / OEM-First
                    </h3>
                    <span style={{ fontSize: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      0 DA d'investissement boîtier
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                    Idéal pour les flottes en cours de déploiement, les sous-traitants temporaires ou les véhicules légers. 
                    Le système fonctionne par <strong>croisement intelligent de 4 flux existants</strong> :
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>⛽ Pleins Naftal</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                        Intégration des factures/cartes Naftal (Gasoil, Super, GPL). Reconstitution des consommations et contrôle de fraude.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>📋 DVIR Numérique Mobile</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                        Inspections chauffeur avant/après tournée sur smartphone (kilométrage relevé, niveau d'huile, photos des défauts).
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>🗺️ Routage OSRM / Valhalla</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                        Calcul précis des distances entre points de livraison et intégration des profils d'élévation routiers.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>🌡️ Matrice Climatique 58 Wilayas</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                        Coefficient de sévérité thermique et d'exposition aux poussières sahariennes (ex: Adrar = 1.45, Alger = 1.05).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModeTab === 'mode1' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
                      📡 Mode 1 — Télématique GPS Standard Traccar
                    </h3>
                    <span style={{ fontSize: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Open-Source Souverain & Économique
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                    Compatible avec tous les traceurs du marché (Teltonika FMB920, Coban, Concox, Sinotrack). 
                    Les données sont ingérées directement par notre serveur Traccar auto-hébergé sur le port hôte <strong>8085</strong> :
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Positionnement temps réel & Replay d'itinéraires :</strong> Précision géodésique WGS84, vitesse et cap.</li>
                    <li><strong>Module Éco-Conduite & Gaspillage :</strong> Calcul des pertes financières dues au ralenti excessif valorisées au tarif officiel (31.00 DA/L en 2026, 29.01 DA/L barème historique).</li>
                    <li><strong>Surveillance des Dérives Compteurs :</strong> Algorithme anti-recul d'odomètre avec détection des anomalies de transmission.</li>
                    <li><strong>Contrôle des Franchissements :</strong> Zones d'exploitation autorisées (Wilayas, corridors autoroutiers, carrières).</li>
                  </ul>
                </div>
              )}

              {activeModeTab === 'mode2' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7', margin: 0 }}>
                      ⚡ Mode 2 — Full CAN / J1939 Haute Fréquence & IoT
                    </h3>
                    <span style={{ fontSize: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Télémétrie Constructeur Direct Calculateurs
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                    Réservé aux engins lourds (Poids lourds MAN, Volvo, Renault Trucks, engins Caterpillar, groupes électrogènes et frigorifiques). 
                    Lecture sans contact des trames CAN J1939 / OBD-II :
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Thermique Haute Fréquence :</strong> Température d'huile, liquide de refroidissement, différentiel culasse.</li>
                    <li><strong>Analyse Électrochimique Batterie :</strong> Échantillonnage à 100 ms lors de la phase de démarrage (Cranking).</li>
                    <li><strong>Diagnostic FAP & Dépollution :</strong> Contre-pression différentielle, niveau de suie en grammes.</li>
                    <li><strong>Télémétrie Chaîne du Froid :</strong> Température bi-zone des remorques frigorifiques (Thermo King, Carrier) pour la sécurité alimentaire et pharmaceutique.</li>
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: LE CŒUR DÉCISIONNEL */}
          <section id="decision-engine" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🧠</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                3. Le Cœur Décisionnel (SAD → ADS) & Arbitrage Économique
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              Le rôle de DocteurFlotte n’est pas d’ajouter du travail au gestionnaire de parc, mais de <strong>décider et d’arbitrer</strong> à sa place. 
              Le système opère la transition d’un simple Système d’Aide à la Décision (SAD) vers un Système Décisionnel Autonome (ADS).
            </p>

            {/* Formula box */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '6px' }}>
                Équation Maîtresse d’Arbitrage Économique
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'monospace',
                  letterSpacing: '0.02em',
                  marginBottom: '10px',
                }}
              >
                Arbitrage (DZD) = Risque Financier d’Inaction - Coût de l’Intervention
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                Si <code>Arbitrage &gt; 0</code>, l’intervention est économiquement rentable. Si le montant respecte le plafond de délégation du tenant 
                (<code>approvalExpenseThreshold</code>, ex: 100 000 DZD), l’Ordre de Travail est émis automatiquement sans attendre de réunion.
              </div>
            </div>

            {/* Interactive Simulator Component */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                  🧮 Simulateur Interactif d'Arbitrage (Testez la Rentabilité d'une Décision)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Montants en Dinars Algériens (DZD)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                    Coût de l'Intervention Immédiate (DZD)
                  </label>
                  <input
                    type="number"
                    value={actionCost}
                    onChange={(e) => setActionCost(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--df-border-medium)',
                      background: 'var(--df-bg-surface-2)',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Pièces neuves + Main d'œuvre</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                    Coût Remorquage / Dépannage Extérieur
                  </label>
                  <input
                    type="number"
                    value={towingCost}
                    onChange={(e) => setTowingCost(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--df-border-medium)',
                      background: 'var(--df-bg-surface-2)',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Traction en zone isolée</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                    Casse Mécanique Secondaire (DZD)
                  </label>
                  <input
                    type="number"
                    value={partReplacement}
                    onChange={(e) => setPartReplacement(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--df-border-medium)',
                      background: 'var(--df-bg-surface-2)',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Moteur complet, culasse ou turbo</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-muted)', marginBottom: '4px' }}>
                    Probabilité de Casse Sans Action (%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={failureProb}
                    onChange={(e) => setFailureProb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#818cf8', marginTop: '8px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>
                    <span>10%</span>
                    <span>{failureProb}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result Card */}
              <div
                style={{
                  background: netSavings > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${netSavings > 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
                    Risque Financier de l'Inaction (Pondéré) :
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#f87171' }}>
                    {totalInactionRisk.toLocaleString('fr-DZ')} DZD
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
                    Économie Nette Attendue (Arbitrage SAD) :
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: netSavings > 0 ? '#34d399' : '#f87171' }}>
                    {netSavings > 0 ? '+' : ''}{netSavings.toLocaleString('fr-DZ')} DZD
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Multiplicateur de Rentabilité (ROI) :</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#a5b4fc' }}>
                    x{roiRatio}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: netSavings > 0 ? '#059669' : '#dc2626',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {netSavings > 0 ? '✓ ACTION IMMÉDIATE APPROUVÉE' : '⚠️ INTERVENTION REPORTÉE'}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: LES 6 ALGORITHMES PHYSIQUES */}
          <section id="physics-algorithms" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🔬</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                4. Les 6 Algorithmes Physiques Déterministes & Calcul du Score VHI
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              Le Vehicle Health Index (VHI) global (noté de 0 à 100) est la synthèse pondérée de 6 algorithmes déterministes 
              issus de la thermodynamique, de l’électrochimie et de la tribologie mécanique :
            </p>

            {/* Algorithm Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {[
                { id: 1, name: 'Arrhenius (Huile)', icon: '🛢️', tag: 'Thermodynamique' },
                { id: 2, name: 'Cranking (Batterie)', icon: '🔋', tag: 'Électrochimie' },
                { id: 3, name: 'Thermique Culasse', icon: '🌡️', tag: 'Échangeur / EWMA' },
                { id: 4, name: 'Archard (Freins)', icon: '🛑', tag: 'Tribologie' },
                { id: 5, name: 'Colmatage FAP', icon: '💨', tag: 'Bilan Massique' },
                { id: 6, name: 'CUSUM Anti-Siphon', icon: '⛽', tag: 'Statistique' },
              ].map((algo) => {
                const isSelected = selectedAlgo === algo.id;
                return (
                  <button
                    key={algo.id}
                    onClick={() => setSelectedAlgo(algo.id)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'var(--df-bg-surface-1)',
                      border: isSelected ? '1px solid #818cf8' : '1px solid var(--df-border-subtle)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{algo.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fff' : 'var(--df-text-main)' }}>
                      {algo.name}
                    </div>
                    <div style={{ fontSize: '11px', color: isSelected ? '#a5b4fc' : 'var(--df-text-muted)' }}>
                      {algo.tag}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Algorithm Deep-Dive Card */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              {selectedAlgo === 1 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', margin: '0 0 10px 0' }}>
                    🛢️ Algorithme 1 : Dégradation Chimique de l'Huile (Loi d'Arrhenius)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    L'huile moteur perd sa viscosité et ses additifs détergents de manière exponentielle en fonction de sa température de fonctionnement 
                    et de la contamination par les poussières abrasives (silice saharienne).
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#a5b4fc', marginBottom: '14px' }}>
                    Facteur_Arrhenius = exp((Ea / R) * (1 / T_ref_Kelvin - 1 / T_huile_Kelvin)) * K_poussiere
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.7 }}>
                    <li><strong>Ea / R :</strong> Énergie d'activation sur constante des gaz parfaits (valeur nominale : 6500 K).</li>
                    <li><strong>T_ref :</strong> Température de fonctionnement optimale constructeur (363.15 K = 90°C).</li>
                    <li><strong>Démonstration réelle :</strong> 100 km parcourus à 110°C dans le Sud équivalent exactement à <strong>254,5 km d'usure réelle</strong>.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 2 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', margin: '0 0 10px 0' }}>
                    🔋 Algorithme 2 : Cranking Health CVHI (Santé Électrochimique Batterie)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Une mesure de tension au repos (12.6V) est trompeuse. La véritable santé (SOH) d'une batterie au plomb/calcium ne se révèle 
                    qu'au moment où le démarreur absorbe 300 à 600 Ampères.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#6ee7b7', marginBottom: '14px' }}>
                    SOH (%) = ((V_min - V_critique) / (V_neuve - V_critique)) * Facteur_Recouvrement(t_recovery)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.7 }}>
                    <li><strong>Seuil critique V_min :</strong> 9.6 V (en dessous, sulfatation avancée ou cellule court-circuitée).</li>
                    <li><strong>Temps de recouvrement t_rec :</strong> Le retour à 12.8V puis 14.2V (alternateur) doit s'effectuer en moins de 1.8 seconde.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 3 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444', margin: '0 0 10px 0' }}>
                    🌡️ Algorithme 3 : Modèle Thermique Différentiel Culasse & Échangeur
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Surveille l'équilibre thermique entre le circuit d'huile et le circuit d'eau. Un lissage exponentiel (EWMA) filtre les pics passagers 
                    pour isoler les anomalies structurelles de refroidissement.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#fca5a5', marginBottom: '14px' }}>
                    Delta_T = |T_huile - T_liquide| | EWMA_t = alpha * Mesure_t + (1 - alpha) * EWMA_(t-1)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.7 }}>
                    <li><strong>Delta admissible :</strong> Inférieur à 18°C en régime stabilisé.</li>
                    <li><strong>Détection anticipée :</strong> Détecte un début de joint de culasse ou un calorstat grippé 300 km avant la surchauffe destructrice.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 4 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899', margin: '0 0 10px 0' }}>
                    🛑 Algorithme 4 : Usure des Garnitures de Freins (Loi Tribologique d'Archard)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    L'usure des plaquettes et garnitures dépend de l'énergie cinétique mécanique dissipée lors des décélérations successives.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#f472b6', marginBottom: '14px' }}>
                    Volume_Usure (mm3) = K_archard * (1/2 * Masse_Vehicule * (v_debut^2 - v_fin^2)) / Durete_Materiau
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.7 }}>
                    <li><strong>Épaisseur neuve :</strong> 14 mm | <strong>Épaisseur minimale critique :</strong> 3.0 mm.</li>
                    <li><strong>Intégration du relief :</strong> Les descentes montagneuses prolongées (Gorges de Kherrata, Chréa) accélèrent le calcul d'usure.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 5 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', margin: '0 0 10px 0' }}>
                    💨 Algorithme 5 : Bilan Massique de Colmatage du FAP (Filtre à Particules)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Évalue en continu l'accumulation de suie imbrûlée selon le cycle de roulage (urbain vs autoroute) et la contre-pression d'échappement.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#7dd3fc', marginBottom: '14px' }}>
                    Masse_Suie (g) = f(Delta_Pression_mbar, Debit_Air_kg_h, Temperature_Echappement_C)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.7 }}>
                    <li><strong>Seuil régénération forcée :</strong> 45 grammes.</li>
                    <li><strong>Seuil critique de blocage :</strong> 70 grammes (risque d'incendie ou casse turbo par contre-pression excessive).</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 6 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7', margin: '0 0 10px 0' }}>
                    ⛽ Algorithme 6 : Détection Anti-Siphon CUSUM (Cumulative Sum Control Chart)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Filtre mathématiquement les mouvements normaux de carburant (virages, stationnement en pente, freinages) pour détecter 
                    les vidanges frauduleuses de réservoir avec une précision à 100%.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#c084fc', marginBottom: '14px' }}>
                    CUSUM_t = max(0, CUSUM_(t-1) + (Delta_Volume_L - k_derive)) | Alerte si CUSUM_t &gt; h_seuil
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-muted)', lineHeight: 1.7 }}>
                    <li><strong>Conditions strictes :</strong> Déclenchement uniquement à vitesse nulle ($v = 0$ km/h) et moteur arrêté ou au ralenti prolongé.</li>
                    <li><strong>Tolérance minimale :</strong> Chute supérieure à 15 Litres en moins de 180 secondes.</li>
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 5: ARCHITECTURE TECHNIQUE & PIPELINE */}
          <section id="tech-architecture" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🏗️</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                5. Architecture Système & Pipeline de Données
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              La stack technologique a été sélectionnée pour sa résilience industrielle, sa performance brute et sa souveraineté d’hébergement :
            </p>

            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '14px',
                padding: '24px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                    🐘 PostgreSQL 16 + TimescaleDB
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Hypertables partitionnées dans le temps pour les millions de points télématiques. 
                    Compression en colonnes (ratio 1:12) et continuous aggregates pour les moyennes horaires de vitesse et consommation.
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '6px' }}>
                    🔴 Redis 7 (RESP3 & Streams)
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Cache haute vitesse, pub/sub télématique en direct vers les interfaces web, 
                    files d'attente d'ingestion et verrous distribués Redlock pour éviter les doubles déclenchements d'OT.
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>
                    📡 Traccar Server 6.x Self-Hosted
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Passerelle télématique souveraine décodant plus de 200 protocoles matériels (Teltonika, Coban, Meitrack). 
                    Failover automatique vers Flespi sans transmission de données nominatives.
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7', marginBottom: '6px' }}>
                    ⚡ NestJS Backend & Next.js 15
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Architecture découplée en monorepo TypeScript strict. 
                    Clean Architecture, validation par DTOs class-validator et interface utilisateur fluide en Vanilla CSS sans dépendances superflues.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: SOUVERAINETÉ & LOI 18-07 */}
          <section id="security-compliance" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                6. Souveraineté Nationale, Loi 18-07 & Conformité ANPDP
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              En Algérie, les données de géolocalisation et les identités des chauffeurs relèvent de la <strong>Loi 18-07 du 10 juin 2018</strong> 
              relative à la protection des personnes physiques dans le traitement des données à caractère personnel, contrôlée par l’<strong>ANPDP</strong>.
            </p>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                🔒 Les 4 Piliers de Protection DocteurFlotte :
              </div>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                <li><strong>Hébergement Souverain Local :</strong> Les bases de données sont conçues pour être déployées sur des serveurs physiques en Algérie ou chez des hébergeurs locaux agréés.</li>
                <li><strong>Zéro PII vers les Services Tiers :</strong> Si une passerelle de secours externe (ex: Flespi) est activée, elle ne reçoit <em>que l’IMEI matériel</em>. Zéro nom, zéro matricule, zéro numéro de permis.</li>
                <li><strong>PostgreSQL Row-Level Security (RLS) Fail-Closed :</strong> Tout accès SQL est verrouillé par <code>df_tenant_role</code>. Un tenant ne peut jamais, même en cas de bug applicatif, lire les lignes d'un autre tenant.</li>
                <li><strong>Piste d’Audit Immuable Anti-Tampering :</strong> Table <code>admin_audit_logs</code> protégée par déclencheur SQL interdisant toute modification ou suppression, avec chaînage SHA-256.</li>
              </ol>
            </div>
          </section>

          {/* SECTION 7: CONSOLE SAAS CONTROL PLANE */}
          <section id="control-plane" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>👑</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                7. Console SaaS & Gouvernance (Control Plane SuperAdmin)
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              Accessible sous <code>/admin</code> pour les utilisateurs habilités (<code>role = PLATFORM_ADMIN</code>), 
              le Control Plane centralise l'administration globale de la plateforme :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <Link
                href="/admin/tenants"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🏢</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  Tenants & Quotas
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                  Gestion des abonnements, plafonds de véhicules et attribution des modes d'exploitation.
                </div>
              </Link>

              <Link
                href="/admin/decision-engine"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🧠</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  Moteur Décisionnel (6 Physiques)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                  Création de DRAFTs, banc de simulation en direct, règle Maker-Checker et rollbacks immuables.
                </div>
              </Link>

              <Link
                href="/admin/fiscal"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>⛽</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  Barèmes Fiscaux & Naftal
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                  Prix officiels des carburants (31.00 DA/L), vignettes LF 2025 et périodicités de contrôle ENACTA.
                </div>
              </Link>

              <Link
                href="/admin/audit"
                style={{
                  textDecoration: 'none',
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🛡️</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  Piste d’Audit Immuable
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-muted)', lineHeight: 1.5 }}>
                  Journal d'activité inviolable avec horodatage, empreintes SHA-256 et IP sources.
                </div>
              </Link>
            </div>
          </section>

          {/* SECTION 8: GUIDE OPÉRATIONNEL PAR MÉTIER */}
          <section id="roles-workflows" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>👥</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                8. Guide Opérationnel par Rôle Métier
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              Comment chaque acteur de votre entreprise utilise DocteurFlotte au quotidien :
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  🚗 Responsable de Parc / Directeur d'Exploitation
                </div>
                <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Consulte le tableau de bord décisionnel (<code>/decisions</code>), valide les arbitrages au-dessus de son seuil budgétaire, 
                  surveille les coûts au kilomètre (TCO) et la conformité des contrôles techniques ENACTA.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>
                  🔧 Chef d'Atelier & Équipe de Maintenance
                </div>
                <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Reçoit automatiquement les Ordres de Travail (OT) générés par le moteur décisionnel (<code>/work-orders</code>). 
                  Consulte les pièces requises, renseigne les heures de main d'œuvre passées et clôture les interventions avec pièces jointes.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>
                  📱 Chauffeurs & Conducteurs d'Engins
                </div>
                <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Remplissent en 60 secondes leur fiche DVIR sur smartphone (<code>/dvir</code>) au début de chaque vacation. 
                  Reçoivent des retours immédiats d'éco-conduite pour réduire le ralenti moteur et toucher leurs primes mensuelles.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 9: FAQ */}
          <section id="faq" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>❓</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                9. Questions Fréquentes & Support
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <details
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                  Puis-je commencer à utiliser DocteurFlotte si je n'ai encore aucun boîtier GPS ?
                </summary>
                <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  <strong>Absolument oui.</strong> C'est la force du <em>Mode 0 (Zero-Hardware)</em>. Vous saisissez vos cartes carburant Naftal 
                  et invitez vos chauffeurs à utiliser le DVIR sur leur téléphone. Le moteur décisionnel calcule déjà vos usures d'huile, vos freins 
                  et vos risques de casse moteur.
                </p>
              </details>

              <details
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                  Comment configurer nos traceurs GPS Teltonika ou Coban existants ?
                </summary>
                <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Il vous suffit de configurer l'adresse IP de votre serveur DocteurFlotte et le port correspondant au protocole matériel 
                  (ex: <code>Port 5027</code> pour Teltonika, <code>Port 5001</code> pour Coban). Le serveur Traccar intégré décode automatiquement les trames.
                </p>
              </details>

              <details
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                  Que se passe-t-il si un chauffeur perd la connexion réseau 4G dans le Sahara ?
                </summary>
                <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  L'application mobile DocteurFlotte est <strong>Offline-First</strong>. Toutes les fiches DVIR et pièces jointes sont stockées en local 
                  (IndexedDB / SQLite chiffré) et synchronisées automatiquement dès que le terminal retrouve une couverture réseau.
                </p>
              </details>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
