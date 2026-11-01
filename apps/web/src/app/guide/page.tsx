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
  { id: 'vision', title: '1. Vision & Modèle : L\'Ère de la Maintenance 5.0', badge: 'MONOPOLE 5.0', icon: '🧬' },
  { id: 'modes', title: '2. Les 3 Modes d’Exploitation (0 / 1 / 2)', badge: 'HARDWARE-AGNOSTIC', icon: '🚗' },
  { id: 'decision-engine', title: '3. Le Cœur Décisionnel (SAD → ADS)', badge: 'ARBITRAGE DZD', icon: '🧠' },
  { id: 'physics-algorithms', title: '4. Les 6 Algorithmes Physiques & VHI', badge: 'DÉTERMINISTE', icon: '🔬' },
  { id: 'tech-innovations', title: '5. Innovations Technologiques de Rupture (Monopole 0 $ / 0 DA)', badge: 'BREVETABLE', icon: '💡' },
  { id: 'ai-sovereign', title: '6. IA Souveraine & Les 7 Piliers d\'Observabilité', badge: '7 PILIERS IA', icon: '⚡' },
  { id: 'digital-twin', title: '7. Jumeau Numérique & Multi-Climats', badge: 'STRESS 58 WILAYAS', icon: '🌐' },
  { id: 'field-modules', title: '8. Télémétrie Terrain : Naftal, Froid, Dispatch', badge: 'OPÉRATIONNEL', icon: '📦' },
  { id: 'tech-architecture', title: '9. Architecture Système & Pipeline', badge: 'FULL-STACK', icon: '🏗️' },
  { id: 'security-compliance', title: '10. Souveraineté & Loi 18-07 ANPDP', badge: 'JORADP / RLS', icon: '🛡️' },
  { id: 'competitive-matrix', title: '11. Benchmark Mondial vs Samsara / Geotab', badge: 'CONCURRENCE', icon: '🏆' },
  { id: 'strategic-roadmap', title: '12. Vision Futuriste & Roadmap 2027-2030', badge: 'INNOVATION', icon: '🚀' },
  { id: 'roles-workflows', title: '13. Guide Opérationnel par Rôle Métier', badge: 'WORKFLOWS', icon: '👥' },
  { id: 'faq', title: '14. FAQ & Bonnes Pratiques', badge: 'SUPPORT', icon: '❓' },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string>('vision');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModeTab, setActiveModeTab] = useState<'mode0' | 'mode1' | 'mode2'>('mode0');
  const [selectedAlgo, setSelectedAlgo] = useState<number>(1);
  const [selectedInnovation, setSelectedInnovation] = useState<'HWFA' | 'SES_UEB' | 'KMSO' | 'BEP_VCO' | 'CSIS'>('HWFA');
  const [selectedClimateZone, setSelectedClimateZone] = useState<'TELL' | 'STEPPE' | 'SAHARA'>('SAHARA');

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
    if (actionCost <= 0) return '0';
    return (netSavings / actionCost).toFixed(1);
  }, [netSavings, actionCost]);

  // Filtrage par recherche
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.badge.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--df-bg-base)', color: 'var(--df-text-main)' }}>
      <Navbar />

      {/* HEADER HERO BANNER — Adaptatif & Haute Lisibilité */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--df-bg-surface-1) 0%, var(--df-bg-surface-2) 100%)',
          borderBottom: '1px solid var(--df-border-subtle)',
          padding: '44px 24px 36px',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--df-accent-blue)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              DocteurFlotte Documentation Technique & Stratégique v3.0 (World-Class DZ)
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--df-status-ok-bg)',
                color: 'var(--df-status-ok-text)',
                border: '1px solid var(--df-status-ok-border)',
              }}
            >
              ✓ Conforme Loi 18-07 ANPDP • DGI • ENACTA
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#0284c7',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              PostgreSQL 16 RLS Fail-Closed • Ollama Qwen 2.5 Local • TimescaleDB
            </span>
          </div>

          <h1
            style={{
              fontSize: '34px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              marginBottom: '14px',
              color: 'var(--df-text-main)',
            }}
          >
            Guide d’Architecture, Fonctionnalités & Vision Stratégique
          </h1>

          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.65,
              color: 'var(--df-text-secondary)',
              maxWidth: '960px',
              marginBottom: '24px',
            }}
          >
            Référentiel complet de la plateforme souveraine DocteurFlotte : sa rupture avec la télématique passive, 
            ses <strong>3 modes d’exploitation (dont le Mode 0 Sans Boîtier)</strong>, ses <strong>6 algorithmes de physique déterministe</strong>, 
            son <strong>IA souveraine locale Ollama (Qwen 2.5)</strong> avec audit temps réel, son <strong>jumeau numérique multi-climats</strong>, 
            son arbitrage financier en Dinars Algériens (DZD) et sa supériorité concurrentielle face aux géants mondiaux.
          </p>

          {/* Quick Search and Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="Rechercher (Arrhenius, Qwen, Naftal, RLS, CUSUM, Jumeau, Samsara)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--df-border-medium)',
                  background: 'var(--df-bg-surface-1)',
                  color: 'var(--df-text-main)',
                  fontSize: '13px',
                  outline: 'none',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '15px', color: 'var(--df-text-muted)' }}>
                🔍
              </span>
            </div>

            <Link
              href="/copilot"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'var(--df-accent-blue)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <span>🧠</span>
              <span>Ask DocteurFlotte Copilot</span>
            </Link>

            <Link
              href="/admin/ai-observability"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'var(--df-bg-surface-1)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid var(--df-border-medium)',
              }}
            >
              <span>⚡</span>
              <span>Observabilité IA Ollama</span>
            </Link>

            <Link
              href="/fuel-scanner"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'var(--df-bg-surface-1)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid var(--df-border-medium)',
              }}
            >
              <span>⛽</span>
              <span>Scanner Reçus Naftal (OCR)</span>
            </Link>

            <Link
              href="/digital-twin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'var(--df-bg-surface-1)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid var(--df-border-medium)',
              }}
            >
              <span>🌐</span>
              <span>Jumeau Numérique</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN DOCUMENTATION LAYOUT */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '36px 24px 80px',
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
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
            borderRadius: '12px',
            padding: '16px',
            boxShadow: 'var(--df-shadow-sm)',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
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
            Table des Matières ({filteredSections.length})
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredSections.map((sec) => {
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
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    color: isSelected ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '12.5px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '15px' }}>{sec.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sec.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div
            style={{
              marginTop: '18px',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--df-status-ok-bg)',
              border: '1px solid var(--df-status-ok-border)',
              fontSize: '11.5px',
              color: 'var(--df-status-ok-text)',
              lineHeight: 1.5,
            }}
          >
            <strong>Garantie Souveraine :</strong> 100% du code, des données et de l'IA fonctionnent hors-ligne sur le sol algérien, 
            sans dépendance cloud étranger.
          </div>
        </aside>

        {/* CONTENT PANELS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', minWidth: 0 }}>

          {/* SECTION 1: VISION & PHILOSOPHIE */}
          <section id="vision" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🧬</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                1. Vision &amp; Modèle : L&apos;Ère de la Maintenance 5.0 Souveraine
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              La quasi-totalité des solutions de télématique du marché échouent dans les flottes algériennes pour 3 raisons majeures :
              elles exigent l’installation coûteuse d’un boîtier sur 100% des véhicules dès le premier jour, 
              elles se limitent à du pistage passif ("points sur une carte") et elles bombardent les gestionnaires de fausses alertes sans arbitrage financier.
              DocteurFlotte opère une rupture paradigmatique complète en inventant la <strong>Maintenance 5.0</strong>.
            </p>

            {/* Matrice d'Évolution 1.0 à 5.0 */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '2px solid #059669',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(5, 150, 105, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#065F46', margin: 0 }}>
                  L&apos;Échelle des 5 Générations de Maintenance Industrielle
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', fontSize: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px', borderLeft: '3px solid #94A3B8' }}>
                  <div style={{ fontWeight: 800, color: '#475569' }}>1.0 Réactive (1970)</div>
                  <div style={{ color: '#DC2626', fontWeight: 600, marginTop: '2px' }}>« Casse &amp; Dépannage »</div>
                  <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>Réparation d'urgence après avarie sur route. Arrêt d'exploitation brutal.</p>
                </div>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px', borderLeft: '3px solid #D97706' }}>
                  <div style={{ fontWeight: 800, color: '#475569' }}>2.0 Préventive (1990)</div>
                  <div style={{ color: '#D97706', fontWeight: 600, marginTop: '2px' }}>« Calendrier Aveugle »</div>
                  <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>Vidange fixe tous les 10 000 km. Remplacement prématuré de lubrifiants encore viables.</p>
                </div>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px', borderLeft: '3px solid #2563EB' }}>
                  <div style={{ fontWeight: 800, color: '#475569' }}>3.0 Conditionnelle (2010)</div>
                  <div style={{ color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>« Voyants Tableau »</div>
                  <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>Alerte déclenchée sur seuil de capteur critique (&gt; 95°C). L'usure métallique est déjà amorcée.</p>
                </div>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px', borderLeft: '3px solid #6366F1' }}>
                  <div style={{ fontWeight: 800, color: '#475569' }}>4.0 Prédictive (2018)</div>
                  <div style={{ color: '#6366F1', fontWeight: 600, marginTop: '2px' }}>« Samsara / Geotab »</div>
                  <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>Capteurs IoT onéreux ($$$), Machine Learning statistique boîte noire, alertes sans calcul de rentabilité.</p>
                </div>
                <div style={{ padding: '12px', background: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', borderLeft: '4px solid #059669' }}>
                  <div style={{ fontWeight: 800, color: '#065F46' }}>5.0 Prescriptive (2026+)</div>
                  <div style={{ color: '#059669', fontWeight: 700, marginTop: '2px' }}>« DocteurFlotte »</div>
                  <p style={{ margin: '6px 0 0', color: '#1E293B', lineHeight: 1.45 }}>Physique déterministe à 0 DA (zéro capteur externe), arbitrage DZD (Coût Action vs Inaction) et assistant vocal atelier.</p>
                </div>
              </div>
            </div>

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
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', marginBottom: '10px' }}>
                  ❌ Les Outils Traditionnels (Pistage Passif 4.0)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                  <li>Obligation d'acheter et d'installer des boîtiers GPS sur tout le parc.</li>
                  <li>Simple géolocalisation passive ("Le camion est à Sétif").</li>
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
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', marginBottom: '10px' }}>
                  ✨ Le Paradigme DocteurFlotte (Maintenance 5.0)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                  <li><strong>Opérationnel dès le Jour 1 en Mode 0</strong> sans aucun investissement matériel.</li>
                  <li><strong>Moteur SAD → ADS :</strong> Recommande et chiffre des actions en DZD (Coût Action vs Inaction).</li>
                  <li><strong>Physique Déterministe 0 DA :</strong> Arrhenius, Archard, UEB Enthalpie SCR, CSIS spectro-cranking.</li>
                  <li><strong>Symbiose Homme-Machine :</strong> Assistant vocal d'atelier en Darja/Français et RAG sans hallucination.</li>
                  <li><strong>Souveraineté Intégrale :</strong> Hébergement local, RLS Fail-Closed et IA Qwen locale zéro-PII (Loi 18-07).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 2: LES 3 MODES D'EXPLOITATION */}
          <section id="modes" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🚗</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                2. Les 3 Modes d'Exploitation : Flexibilité Totale du Parc
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              DocteurFlotte permet à un même tenant de mixer différents niveaux d'équipement dans sa flotte sans aucune friction :
            </p>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
                      border: isSelected ? '1px solid var(--df-accent-blue)' : '1px solid var(--df-border-subtle)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--df-bg-surface-1)',
                      color: isSelected ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--df-shadow-sm)',
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
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              {activeModeTab === 'mode0' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#d97706', margin: 0 }}>
                      📱 Mode 0 — Zero-Hardware / OEM-First
                    </h3>
                    <span style={{ fontSize: '12px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      0 DA d'investissement boîtier
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                    Idéal pour les flottes en cours de déploiement, les sous-traitants temporaires ou les véhicules légers. 
                    Le système fonctionne par <strong>croisement intelligent de 4 flux existants</strong> :
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>⛽ Pleins Naftal & Scanner OCR</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                        Intégration instantanée des reçus papier par photo mobile ou factures de cartes Naftal (Gasoil, Sans Plomb, Sirghaz). Reconstitution de la consommation et contrôle d'anomalies.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>📋 DVIR Numérique Mobile</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                        Inspections chauffeur avant/après tournée sur smartphone (kilométrage relevé, niveau d'huile, photos des défauts) avec synchronisation hors-ligne.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>🗺️ Routage Valhalla & Topographie</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                        Calcul précis des distances entre points de livraison et intégration des profils d'élévation routiers (cols de montagne, autoroute Est-Ouest).
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>🌡️ Matrice Climatique 58 Wilayas</div>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                        Coefficient de sévérité thermique et d'exposition aux poussières sahariennes (ex: Adrar = 1.45, Alger = 1.05).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModeTab === 'mode1' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0284c7', margin: 0 }}>
                      📡 Mode 1 — Télématique GPS Standard Traccar
                    </h3>
                    <span style={{ fontSize: '12px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Open-Source Souverain & Économique
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                    Compatible avec tous les traceurs du marché (Teltonika FMB920, Ruptela, Coban, Concox, Sinotrack). 
                    Les données sont ingérées directement par notre passerelle Traccar auto-hébergée sur le port <strong>8085</strong> :
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#7c3aed', margin: 0 }}>
                      ⚡ Mode 2 — Full CAN / J1939 Haute Fréquence & IoT
                    </h3>
                    <span style={{ fontSize: '12px', background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Télémétrie Constructeur Direct Calculateurs
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                    Réservé aux engins lourds (Poids lourds MAN, Volvo, Renault Trucks, Shacman, engins Caterpillar, groupes électrogènes et frigorifiques). 
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
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
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
                background: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-medium)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Équation Maîtresse d’Arbitrage Économique
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--df-text-main)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.02em',
                  marginBottom: '10px',
                }}
              >
                Arbitrage (DZD) = Risque Financier d’Inaction - Coût de l’Intervention
              </div>
              <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                Si <code>Arbitrage &gt; 0</code>, l’intervention est économiquement rentable. Si le montant respecte le plafond de délégation du tenant 
                (<code>approvalExpenseThreshold</code>, ex: 100 000 DZD), l’Ordre de Travail est émis automatiquement avec proposition de véhicule de substitution.
              </div>
            </div>

            {/* Interactive Simulator Component */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                  🧮 Simulateur Interactif d'Arbitrage (Testez la Rentabilité d'une Décision)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Montants en Dinars Algériens (DZD)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
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
                      color: 'var(--df-text-main)',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Pièces neuves + Main d'œuvre</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
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
                      color: 'var(--df-text-main)',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Traction en zone isolée</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
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
                      color: 'var(--df-text-main)',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Moteur complet, culasse ou turbo</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                    Probabilité de Casse Sans Action (%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={failureProb}
                    onChange={(e) => setFailureProb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--df-accent-blue)', marginTop: '8px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--df-accent-blue)', fontWeight: 700 }}>
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
                  border: `1px solid ${netSavings > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
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
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                    Risque Financier de l'Inaction (Pondéré) :
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 800, color: '#dc2626' }}>
                    {totalInactionRisk.toLocaleString('fr-DZ')} DZD
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                    Économie Nette Attendue (Arbitrage SAD) :
                  </div>
                  <div style={{ fontSize: '21px', fontWeight: 800, color: netSavings > 0 ? '#059669' : '#dc2626' }}>
                    {netSavings > 0 ? '+' : ''}{netSavings.toLocaleString('fr-DZ')} DZD
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>Multiplicateur de Rentabilité (ROI) :</div>
                  <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--df-accent-blue)' }}>
                    x{roiRatio}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: netSavings > 0 ? '#059669' : '#dc2626',
                    color: '#ffffff',
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
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
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
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--df-bg-surface-1)',
                      border: isSelected ? '1px solid var(--df-accent-blue)' : '1px solid var(--df-border-subtle)',
                      borderRadius: '10px',
                      padding: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--df-shadow-sm)',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{algo.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--df-accent-blue)' : 'var(--df-text-main)' }}>
                      {algo.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>
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
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              {selectedAlgo === 1 && (
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#d97706', margin: '0 0 10px 0' }}>
                    🛢️ Algorithme 1 : Dégradation Chimique de l'Huile (Loi d'Arrhenius)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    L'huile moteur perd sa viscosité et ses additifs détergents de manière exponentielle en fonction de sa température de fonctionnement 
                    et de la contamination par les poussières abrasives (silice saharienne).
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--df-accent-blue)', marginBottom: '14px' }}>
                    Facteur_Arrhenius = exp((Ea / R) * (1 / T_ref_Kelvin - 1 / T_huile_Kelvin)) * K_poussiere
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Ea / R :</strong> Énergie d'activation sur constante des gaz parfaits (valeur nominale : 6500 K).</li>
                    <li><strong>T_ref :</strong> Température de fonctionnement optimale constructeur (363.15 K = 90°C).</li>
                    <li><strong>Preuve terrain :</strong> 100 km parcourus à 110°C dans le Sud équivalent exactement à <strong>254,5 km d'usure réelle</strong>.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 2 && (
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#059669', margin: '0 0 10px 0' }}>
                    🔋 Algorithme 2 : Cranking Health CVHI (Santé Électrochimique Batterie)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Une mesure de tension au repos (12.6V) est trompeuse. La véritable santé (SOH) d'une batterie au plomb/calcium ne se révèle 
                    qu'au moment où le démarreur absorbe 300 à 600 Ampères lors du lancement du moteur.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#059669', marginBottom: '14px' }}>
                    SOH (%) = ((V_min - V_critique) / (V_neuve - V_critique)) * Facteur_Recouvrement(t_recovery)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Seuil critique V_min :</strong> 9.6 V (en dessous, sulfatation avancée ou cellule court-circuitée).</li>
                    <li><strong>Temps de recouvrement t_rec :</strong> Le retour à 12.8V puis 14.2V (alternateur) doit s'effectuer en moins de 1.8 seconde.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 3 && (
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#dc2626', margin: '0 0 10px 0' }}>
                    🌡️ Algorithme 3 : Modèle Thermique Différentiel Culasse & Échangeur
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Surveille l'équilibre thermique entre le circuit d'huile et le circuit d'eau. Un lissage exponentiel (EWMA) filtre les pics passagers 
                    pour isoler les anomalies structurelles de refroidissement.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#dc2626', marginBottom: '14px' }}>
                    Delta_T = |T_huile - T_liquide| | EWMA_t = alpha * Mesure_t + (1 - alpha) * EWMA_(t-1)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Delta admissible :</strong> Inférieur à 18°C en régime stabilisé.</li>
                    <li><strong>Détection anticipée :</strong> Détecte un début de joint de culasse ou un calorstat grippé 300 km avant la surchauffe destructrice.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 4 && (
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#db2777', margin: '0 0 10px 0' }}>
                    🛑 Algorithme 4 : Usure des Garnitures de Freins (Loi Tribologique d'Archard)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    L'usure des plaquettes et garnitures dépend de l'énergie cinétique mécanique dissipée lors des décélérations successives.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#db2777', marginBottom: '14px' }}>
                    Volume_Usure (mm3) = K_archard * (1/2 * Masse_Vehicule * (v_debut^2 - v_fin^2)) / Durete_Materiau
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Épaisseur neuve :</strong> 14 mm | <strong>Épaisseur minimale critique :</strong> 3.0 mm.</li>
                    <li><strong>Intégration du relief :</strong> Les descentes montagneuses prolongées (Gorges de Kherrata, Chréa) accélèrent le calcul d'usure.</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 5 && (
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0284c7', margin: '0 0 10px 0' }}>
                    💨 Algorithme 5 : Bilan Massique de Colmatage du FAP (Filtre à Particules)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Évalue en continu l'accumulation de suie imbrûlée selon le cycle de roulage (urbain vs autoroute) et la contre-pression d'échappement.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#0284c7', marginBottom: '14px' }}>
                    Masse_Suie (g) = f(Delta_Pression_mbar, Debit_Air_kg_h, Temperature_Echappement_C)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Seuil régénération forcée :</strong> 45 grammes.</li>
                    <li><strong>Seuil critique de blocage :</strong> 70 grammes (risque d'incendie ou casse turbo par contre-pression excessive).</li>
                  </ul>
                </div>
              )}

              {selectedAlgo === 6 && (
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#7c3aed', margin: '0 0 10px 0' }}>
                    ⛽ Algorithme 6 : Détection Anti-Siphon CUSUM (Cumulative Sum Control Chart)
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                    Filtre mathématiquement les mouvements normaux de carburant (virages, stationnement en pente, freinages) pour détecter 
                    les vidanges frauduleuses de réservoir avec une précision à 100%.
                  </p>
                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#7c3aed', marginBottom: '14px' }}>
                    CUSUM_t = max(0, CUSUM_(t-1) + (Delta_Volume_L - k_derive)) | Alerte si CUSUM_t &gt; h_seuil
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                    <li><strong>Conditions strictes :</strong> Déclenchement uniquement à vitesse nulle ($v = 0$ km/h) et moteur arrêté ou au ralenti prolongé.</li>
                    <li><strong>Tolérance minimale :</strong> Chute supérieure à 15 Litres en moins de 180 secondes.</li>
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 5: INNOVATIONS TECHNOLOGIQUES DE RUPTURE (MONOPOLE 0 DA / 0 $) */}
          <section id="tech-innovations" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '24px' }}>💡</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                5. Innovations Technologiques de Rupture : Le Monopole « 0 DA / 0 $ »
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--df-status-ok)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                Modèles Brevetables • Zéro Capteur Rapporté
              </span>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              DocteurFlotte impose un standard mondial en brisant le modèle économique traditionnel des acteurs généralistes (Samsara, Geotab, Webfleet). 
              Là où la concurrence exige l’achat et la maintenance de capteurs externes onéreux et fragiles (TPMS, débitmètres, sondes piézoélectriques), 
              notre plateforme exploite <strong>strictement les signaux natifs de série (SAE J1939, ISO 11992, tension ADC 24V de batterie, IMU et GNSS)</strong> 
              couplés aux lois de la thermodynamique, de l&apos;hydrodynamique et de l&apos;électromécanique.
            </p>

            {/* BANDEAU DES 4 PILIERS DE CONCEPTION */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
                marginBottom: '28px',
              }}
            >
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-status-ok)', marginBottom: '4px' }}>
                  💰 Coût Matériel Égal à Zéro (0 DA)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Zéro achat de jauges de contrainte, zéro valve TPMS à piles arrachée en carrière, zéro sonde rapportée.
                </div>
              </div>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '4px' }}>
                  ⚙️ Physique Déterministe Opposable
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Rejet des boîtes noires statistiques. Lois d&apos;Arrhenius, Archard, bilans d&apos;enthalpie et micro-glissement cinématique.
                </div>
              </div>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
                  🏜️ Résistance aux Conditions Sahariennes
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Filtres d&apos;échantillonnage quasi-stationnaire isolant la poussière de silice, le dévers routier et les chaleurs extrêmes (&gt; 48°C).
                </div>
              </div>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ec4899', marginBottom: '4px' }}>
                  ⚖️ Pouvoir d&apos;Arbitrage DAF / Direction
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Chaque anomalie génère un certificat opposable pour bloquer les paiements abusifs de sous-traitance ou de garage.
                </div>
              </div>
            </div>

            {/* SÉLECTEUR INTERACTIF DES 5 INNOVATIONS DE RUPTURE */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '14px',
                padding: '24px',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  Laboratoire R&D : Explorez les 5 Innovations Industrielles
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
                  Sélectionnez une innovation pour inspecter sa formulation physique et son ROI
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
                {[
                  { id: 'HWFA', label: '1. HWFA (Travail Hydraulique BTPH)', icon: '🚜' },
                  { id: 'SES_UEB', label: '2. SES-UEB (Détection Émulateur SCR)', icon: '🧪' },
                  { id: 'KMSO', label: '3. KMSO (Pneus & Surcharge 0 TPMS)', icon: '🛞' },
                  { id: 'BEP_VCO', label: '4. BEP-VCO (Freins vs Ralentisseur)', icon: '🏔️' },
                  { id: 'CSIS', label: '5. CSIS (Oscilloscope Compression 24V)', icon: '⚡' },
                ].map((tab) => {
                  const isSel = selectedInnovation === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedInnovation(tab.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: isSel ? '1px solid var(--df-accent-blue)' : '1px solid var(--df-border-subtle)',
                        background: isSel ? 'rgba(99, 102, 241, 0.15)' : 'var(--df-bg-surface-2)',
                        color: isSel ? 'var(--df-accent-blue)' : 'var(--df-text-secondary)',
                        fontWeight: isSel ? 800 : 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CONTENU DE L'INNOVATION 1 : HWFA */}
              {selectedInnovation === 'HWFA' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🚜</span>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                      HWFA — Hydraulic-Work-Fraud-Auditor (Terrassement, Carrières & Pelles 30-50t)
                    </h4>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                    <strong>Angle Mort Industriel Neutralisé :</strong> Surfacturation des heures de location d&apos;engins (Caterpillar, Komatsu, Liebherr). 
                    Les chauffeurs calent l&apos;accélérateur à 1 200 tr/min avec la climatisation en cabine pendant que le godet reste immobile, 
                    gonflant le compteur d&apos;heures machine (SPN 247). Les télématiques OEM (VisionLink, Komtrax) échouent car elles ne mesurent que le régime moteur.
                  </p>

                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Équation Fondamentale & Bilan Calorifique Utile (0 Capteur Rapporté)
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10b981', lineHeight: 1.6, marginBottom: '10px' }}>
                      P_shaft = (2π · N · T_net) / 60 kW  |  P_hyd = P_shaft - P_aux_parasites(N) <br />
                      η_calorifique = W_hyd / [ ∫ m_dot_fuel · ρ_gasoil · PCI · dt ]  (PCI = 42.6 MJ/kg)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                      <strong>Vecteur J1939 :</strong> PGN 61444 (SPN 190 RPM, SPN 513 Couple Net), PGN 65266 (SPN 183 Débit L/h), PGN 65262 (SPN 175 Temp Huile), PGN 65270 (SPN 102 Turbo).
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--df-status-ok)' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Validation Heure Terrasement :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        P_hyd ≥ 40% de P_nominale ET η_calorifique ≥ 0.22. Heure facturable à 100%.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Rejet Fraude Ralenti Forcé :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Régime ≥ 1 050 tr/min, Couple &lt; 25% et P_hyd &lt; 12% P_nominale. Blocage automatique de la facture sous-traitant (économie moyenne : 334 000 DZD/machine/mois).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENU DE L'INNOVATION 2 : SES_UEB */}
              {selectedInnovation === 'SES_UEB' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🧪</span>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                      SES-UEB — SCR-Emulator-Sniffer & Urea-Enthalpic-Balance (Poids Lourds & BTPH)
                    </h4>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                    <strong>Angle Mort Industriel Neutralisé :</strong> Pose clandestine de boîtiers pirates &quot;CAN SCR Emulators&quot; qui figent artificiellement les trames J1939 de NOx et le niveau DEF à 80% pour économiser l&apos;AdBlue, ou coupage de l&apos;AdBlue à l&apos;eau du robinet. Samsara et Geotab ne voient aucun DTC. Résultat : destruction du catalyseur SCR (1 850 000 DZD) et annulation de la garantie constructeur.
                  </p>

                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Bilan d&apos;Enthalpie Endothermique de Thermolyse & Cryptanalyse de Gigue CAN
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10b981', lineHeight: 1.6, marginBottom: '10px' }}>
                      Q_absorbé = m_dot_DEF · [ h_vap(H2O) + ΔH_thermolyse(Urée) ] <br />
                      ΔT_théorique = Q_absorbé / [ m_dot_gaz_échappement · Cp_gaz ]  |  m_dot_gaz = f(P_boost, T_admission, Régime, FuelRate)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                      <strong>Vecteur J1939 :</strong> PGN 65270 (SPN 173 Temp Gaz), PGN 64923 (SPN 4360 Temp In, SPN 4363 Temp Out), PGN 64947 (SPN 4331 Débit DEF g/h), PGN 65110 (SPN 1761, 3516).
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Détection Émulateur Pirate :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Débit DEF déclaré &gt; 150 g/h sur le bus mais chute thermique réelle ΔT_mesuré &lt; 0.25°C OU variance d&apos;horodatage CAN Var(Δt) &lt; 0.05 ms².
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Urée Coupée à l&apos;Eau :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Abaissement thermique anormalement violent (ΔT &gt; 1.85x attendu) dû à la forte chaleur latente de l&apos;eau pure sans abattement chimique de NOx.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENU DE L'INNOVATION 3 : KMSO */}
              {selectedInnovation === 'KMSO' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🛞</span>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                      KMSO — Kinematic-Micro-Slip & Dynamic Radius Observer (Poids Lourds & Bennes)
                    </h4>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                    <strong>Angle Mort Industriel Neutralisé :</strong> Sous-gonflage insidieux et éclatement de pneumatiques sur autoroute. 
                    Les capteurs TPMS physiques de valve à piles coûtent 1 500 € par camion et sont arrachés sur les chantiers en moins de 3 mois. 
                    Notre technologie observe la vitesse différentielle cinématique de rotation de chaque roue au 1/16ème de km/h via l&apos;EBS remorque et l&apos;ABS de série.
                  </p>

                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Rayon Dynamique sous Charge & Loi de Raideur de Pacejka
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10b981', lineHeight: 1.6, marginBottom: '10px' }}>
                      R_dyn,i = V_sol_GNSS / ω_roue,i  |  R_dyn = R_0 - [ F_z / (k_0 + β · P_pneu) ] <br />
                      Δω_relatif = (ω_gauche - ω_droite) / ω_moyen  |  1.5 bar de sous-gonflage ⟹ ΔR_dyn ≈ -5.2 mm ⟹ Δω &gt; +1.02%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                      <strong>Vecteur Multi-Bus :</strong> PGN 65215 (SPN 904-907 Vitesses de Roue), ISO 11992-2 (EBS Semi-Remorque), GNSS Doppler 1 Hz, IMU Yaw Rate.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Alerte Risque d&apos;Éclatement :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Δω_relatif ≥ 1.25% en ligne droite à vitesse stabilisée. Alarme sonore cockpit pour arrêt sous 15 minutes.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--df-status-ok)' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Économie Financière :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        3 630 000 DZD économisés par an sur une flotte de 40 camions (pneus éclatés évités + suppression du surcroît de traînée carburant).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENU DE L'INNOVATION 4 : BEP_VCO */}
              {selectedInnovation === 'BEP_VCO' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🏔️</span>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                      BEP-VCO — Brake-Energy-Partitioning & Retarder Co-Optimizer (Cols & Reliefs)
                    </h4>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                    <strong>Angle Mort Industriel Neutralisé :</strong> Glaçage et fissuration des disques de frein dans les descentes de cols (Gorges de la Chiffa, Atlas). 
                    Les chauffeurs descendent le pied sur la pédale de frein au lieu d&apos;activer le ralentisseur hydrodynamique (Voith / Intarder). 
                    Puisque la vitesse est constante (accélération = 0 m/s²), les télématiques concurrentes jugent la conduite &quot;douce&quot;, 
                    alors que les disques atteignent 750°C avec risque mortel de perte de freinage (brake fade).
                  </p>

                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Partitionnement de l&apos;Énergie Potentielle Gravitationnelle & Loi d&apos;Archard
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10b981', lineHeight: 1.6, marginBottom: '10px' }}>
                      P_pente = M_total · g · v · sin|θ_Valhalla|  |  P_friction_disques = P_pente - P_retarder(SPN 520) - P_aero(v) - P_roulement <br />
                      Φ_retarder = P_retarder / (P_retarder + P_friction)  (Cible optimale ≥ 0.90)  |  V_usure = k_Archard · E_freins / H_fonte
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                      <strong>Vecteur CAN & Routier :</strong> PGN 61440 (SPN 520 Couple Ralentisseur), PGN 61441 (SPN 527 Pédale de Frein), Altimétrie Valhalla 1 Hz, ISO 11992-2 Pesée Essieux.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Alerte Surchauffe & Évanouissement :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Φ_retarder &lt; 0.65 et P_friction &gt; 100 kW sur 25s ⟹ Température estimée disques &gt; 380°C. Alarme sonore immédiate anti-fade.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--df-status-ok)' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Rejet Factures de Freins Injustifiées :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Preuve opposable d&apos;énergie dissipée. Économie de 16 800 000 DZD/an sur 30 bennes par prolongation de durée de vie des garnitures.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENU DE L'INNOVATION 5 : CSIS */}
              {selectedInnovation === 'CSIS' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>⚡</span>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                      CSIS — Cranking-Sub-Cycle-Impedance-Spectrometry (Oscilloscope Compression 24V)
                    </h4>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                    <strong>Angle Mort Industriel Neutralisé :</strong> Perte de compression sur un seul cylindre (soupape calaminée, segment gommé par la silice, injecteur qui pisse). 
                    Le calculateur moteur masque l&apos;anomalie à chaud via le Smooth Running Control jusqu&apos;à la casse complète du moteur (2 500 000 DZD). 
                    Un test de compression physique en atelier coûte 80 000 DZD et immobilise le camion 2 jours.
                  </p>

                  <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Électromécanique du Démarreur & Analyse Ondulatoire ADC 24V à 250 Hz
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10b981', lineHeight: 1.6, marginBottom: '10px' }}>
                      V_batt(t) = E_0 - R_int · I_démarreur(t)  |  I_démarreur(t) ∝ T_compression_cylindre(k) <br />
                      RCRI_k = [ (E_0 - V_min,k) / Moyenne(Creux_Tension) ] · 100%  (Cylindre affaibli ⟹ Creux moins profond)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                      <strong>Vecteur Matériel Brut :</strong> Entrée ADC 24V du boîtier télématique capturant à 250 Hz pendant les 800 premières millisecondes du lancement démarreur.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Localisation Précise du Cylindre :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Identification immédiate du numéro de cylindre en déficit (ex: Cylindre #4 à 42% d&apos;équilibrage relatif). Alerte atelier préventive évitant le perçage de piston.
                      </div>
                    </div>
                    <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--df-status-ok)' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Audit Qualité Réfection :</strong>
                      <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                        Comparaison de l&apos;empreinte spectrale avant et après passage chez le rectifieur pour valider l&apos;équilibrage avant signature du bon de commande.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SYNTHÈSE DES INNOVATIONS DÉJÀ DÉPLOYÉES */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛡️</span> Rappel des Innovations Algérie-First Déjà Opérationnelles en Base
                </h4>
                <Link
                  href="/preventive"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>⚡</span>
                  <span>Tester les 5 Modèles en Live dans le Cockpit 5.0 ➔</span>
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--df-accent-blue)' }}>CUSUM Anti-Ballottement & Pente :</strong> Correction géométrique avec déport de sonde x_sonde et fenêtre médiane 60s pour éliminer les faux positifs de vol de carburant dans les dévers.
                </div>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--df-status-ok)' }}>RAG Hybride Souverain & Web :</strong> Indexation double (BM25 + pg_trgm + JSONB structuré) sur 62 manuels constructeurs avec auto-ingestion Web sans fuite PII (Loi 18-07).
                </div>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px' }}>
                  <strong style={{ color: '#f59e0b' }}>Daemon Anti-Echo Storm 72h :</strong> Machine à états de dédoublonnage interdisant toute ré-émission d&apos;alerte si un Ordre de Travail est déjà ouvert.
                </div>
                <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px' }}>
                  <strong style={{ color: '#ec4899' }}>Vocal Atelier Darja Phonétique :</strong> Short-circuit SQL déterministe sous les 50 ms pour les chefs d&apos;atelier et mécaniciens sur le terrain.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: IA SOUVERAINE & LES 7 PILIERS */}
          <section id="ai-sovereign" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                6. IA Souveraine & Les 7 Piliers Fondateurs d&apos;Observabilité Décisionnelle
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              DocteurFlotte intègre une rupture technologique majeure : un grand modèle de langage (LLM) <strong>100% auto-hébergé sous Ollama (modèle docteurflotte basé sur Qwen 2.5 1.5B Instruct)</strong>.
              Il fonctionne en local sur le CPU du serveur (3 threads dédiés), sans aucune dépendance vers des API externes américaines ou chinoises (OpenAI, Anthropic).
              Cette intelligence artificielle collaborative et cognitive s&apos;articule autour de <strong>7 Piliers d&apos;Excellence Industrielle</strong> :
            </p>

            {/* GRILLE DES 7 PILIERS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {/* Pilier 1 */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid var(--df-accent-blue)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚖️</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                    1. Greffier Juridique & Huissier CUSUM
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Chaque vol de carburant ou surchauffe suspecte est consolidé par l&apos;algorithme CUSUM couplé au dévers routier Valhalla.
                  L&apos;IA génère un certificat d&apos;infraction infalsifiable avec horodatage, coordonnées GPS et vecteur de preuve opposable devant les prud&apos;hommes ou la direction.
                </p>
              </div>

              {/* Pilier 2 */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid var(--df-status-ok)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>💰</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                    2. Copilot Décisionnel ADS en Dinar (DZD)
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Transformation instantanée de chaque anomalie physique en arbitrage financier direct : <em>Coût d&apos;Action Préventive vs Risque d&apos;Inaction</em> (casse turbo, remorquage, pénalité de retard contractuel Sonatrach/client).
                  Génération automatique d&apos;un Ordre de Travail (OT) en 1 clic.
                </p>
              </div>

              {/* Pilier 3 */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📚</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                    3. RAG Hybride & Web Multi-Moteurs Auto-Ingéré
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Recherche tokenisée haute performance (TSQUERY OR-combiné + trigrammes <code>pg_trgm</code>) dans 62 manuels constructeurs OEM (Renault Kerax, Shacman, Mercedes Actros, Toyota Hilux).
                  En cas d&apos;inconnu, bascule transparente sur DuckDuckGo/Wikipédia et auto-enrichissement du coffre sous 15 ms sans fuite PII.
                </p>
              </div>

              {/* Pilier 4 */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🧾</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                    4. Réconciliateur Automatique de Factures DGI
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Rapprochement intelligent des factures d&apos;ateliers et fournisseurs avec les Ordres de Travail à ± 5 DZD près.
                  Contrôle automatique de validité fiscale algérienne : NIF (15 chiffres), NIS, Registre de Commerce (RC), Article d&apos;Imposition (AI), TVA à 19% et droit de timbre.
                </p>
              </div>

              {/* Pilier 5 */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #ec4899' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🎙️</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                    5. Assistant Vocal Chauffeur & Atelier en Darja
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Interaction vocale mains libres adaptée au terrain algérien (compréhension du dialecte algérien Darja et du français technique atelier).
                  Short-circuit déterministe SQL sous 50 ms pour les requêtes fréquentes (<em>&quot;wech raho khass fil camion 12 ?&quot;</em>, <em>&quot;niveau zith&quot;</em>, <em>&quot;pression pneus&quot;</em>).
                </p>
              </div>

              {/* Pilier 6 */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #06b6d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>📊</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                    6. Arbitrage Actuariel DZD & Véhicule Relais
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Modélisation actuarielle des flux de trésorerie de la flotte : calcul précis du coût d&apos;immobilisation journalier par véhicule (25 000 à 180 000 DZD/jour)
                  et proposition proactive du meilleur véhicule de substitution disponible dans le parc pour sauver la mission de livraison.
                </p>
              </div>

              {/* Pilier 7 */}
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #14b8a6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⏰</span>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                    7. Daemon Proactif 08h00 & Verrou Anti-Echo Storm 72h
                  </h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Agent de veille automatique scrutant le parc chaque matin à 08h00.
                  Machine à états de dédoublonnage interdisant formellement le spam d&apos;alertes si un Ordre de Travail est déjà ouvert sur la même panne dans les 72 dernières heures.
                </p>
              </div>
            </div>

            {/* COUPE-FEU LOI 18-07 */}
            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-accent-blue)', margin: '0 0 14px 0' }}>
                🛡️ Coupe-Feu Loi 18-07 (ANPDP) & Dual-Engine Fail-Safe
              </h3>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                Aucune donnée à caractère personnel ne pénètre dans le modèle. Avant chaque inférence, un filtre d&apos;expression régulière inspecte et purge les données sensibles :
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--df-accent-blue)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Plaques d&apos;Immatriculation DZ</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginTop: '4px' }}>
                    <code>01492-319-16</code> ➔ <code>[MATRICULE_ANONYMISE]</code>
                  </div>
                </div>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Téléphones Algériens</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginTop: '4px' }}>
                    <code>+213 550 12 34 56</code> ➔ <code>[TEL_ANONYMISE]</code>
                  </div>
                </div>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Numéro d&apos;Identification National (NIN)</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginTop: '4px' }}>
                    <code>18 chiffres d&apos;état-civil</code> ➔ <code>[NIN_ANONYMISE]</code>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  href="/admin/ai-observability"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'var(--df-accent-blue)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>⚡</span>
                  <span>Ouvrir la Console d&apos;Observabilité & d&apos;Audit en Direct</span>
                </Link>

                <Link
                  href="/knowledge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'var(--df-bg-surface-2)',
                    color: 'var(--df-text-main)',
                    border: '1px solid var(--df-border-subtle)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>🔍</span>
                  <span>Explorer le Coffre RAG & Moteur Web</span>
                </Link>

                <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', display: 'flex', alignItems: 'center' }}>
                  Télémétrie en direct : 8.5 – 11.2 tokens/seconde sur CPU local • Buffer d&apos;audit circulaire de 50 requêtes
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7: JUMEAU NUMÉRIQUE & MULTI-CLIMATS */}
          <section id="digital-twin" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🌐</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                7. Jumeau Numérique (Digital Twin) & Modélisation Multi-Climats 58 Wilayas
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              Chaque véhicule possède une réplique virtuelle paramétrique calculant la Durée de Vie Résiduelle (RUL) 
              des sous-systèmes selon la zone d'exploitation géographique :
            </p>

            {/* Climate Zone Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { key: 'TELL', label: 'Littoral & Tell (Humidité / Embouteillages)', icon: '🌊', mult: 'x1.05' },
                { key: 'STEPPE', label: 'Hauts-Plateaux (Amplitude -5°C à 40°C)', icon: '🌾', mult: 'x1.25' },
                { key: 'SAHARA', label: 'Grand Sud & Sahara (Chaleur 50°C / Poussière Silice)', icon: '🏜️', mult: 'x1.65' },
              ].map((c) => {
                const isSelected = selectedClimateZone === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelectedClimateZone(c.key as any)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #0284c7' : '1px solid var(--df-border-subtle)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'var(--df-bg-surface-1)',
                      color: isSelected ? '#0284c7' : 'var(--df-text-secondary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: 'var(--df-shadow-sm)',
                    }}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                    <span style={{ fontSize: '11px', background: 'rgba(0, 0, 0, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                      {c.mult}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 1</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#d97706', margin: '4px 0' }}>Huile Moteur</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                    {selectedClimateZone === 'SAHARA' ? 'Vidange à 7 500 km max (au lieu de 15 000 km constructeur) pour éviter le gommage des segments.' : 'Intervalles standards respectés avec surveillance d’acidification.'}
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 2</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', margin: '4px 0' }}>Batterie Démarrage</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                    {selectedClimateZone === 'SAHARA' ? 'Évaporation accélérée de l’électrolyte par chaleur ambiante. SOH alerté dès 65%.' : 'Vérification normale de tension et d’alternateur.'}
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 3</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#db2777', margin: '4px 0' }}>Garnitures de Freins</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                    {selectedClimateZone === 'STEPPE' ? 'Contraintes fortes sur les descentes de cols (Sétif, Médéa, Constantine). Usure Archard x1.3.' : 'Usure liée aux cycles d’arrêt urbains.'}
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 4</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7', margin: '4px 0' }}>Filtres & Dépollution</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                    {selectedClimateZone === 'SAHARA' ? 'Filtre à air colmaté en moins de 3 000 km en période de vent de sable (Sirocco).' : 'Cycle de régénération FAP autoroutier nominal.'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: TÉLÉMÉTRIE OPÉRATIONNELLE TERRAIN */}
          <section id="field-modules" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                8. Télémétrie Opérationnelle Terrain : Naftal, Froid, Dispatch & DVIR
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              L'intégration terrain couvre la totalité des besoins réels d'une entreprise de transport, de logistique ou de BTP en Algérie :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⛽</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                    Scanner OCR de Reçus Naftal
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                  Reconnaissance intelligente des tickets de caisse Naftal froissés ou mal imprimés. Extraction automatique des litres, du type de carburant, de la station, de la Wilaya et du montant en DZD, avec réconciliation télématique immédiate.
                </p>
                <Link href="/fuel-scanner" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
                  Essayer le Scanner OCR ➔
                </Link>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>❄️</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                    Surveillance Chaîne du Froid
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                  Sondes de température bi-zone (-25°C à +4°C) pour remorques frigorifiques pharmaceutiques et agroalimentaires. Alertes immédiates par SMS/Notification dès dépassement de seuil critique pendant le transport.
                </p>
                <Link href="/cold-chain" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
                  Voir la Chaîne du Froid ➔
                </Link>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📜</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                    Ordres de Mission & Dispatch
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                  Édition d'ordres de mission réglementaires conformes au Code de la Route algérien. Jetons cryptographiques hors-ligne (HMAC-SHA256) vérifiables par QR code lors des contrôles routiers sans 4G.
                </p>
                <Link href="/dispatch" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
                  Accéder au Dispatch ➔
                </Link>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📋</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                    Inspections Mobiles DVIR
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                  Fiches d'inspection pré/post-tournée remplies en 60 secondes sur smartphone par les chauffeurs. Mode hors-ligne natif avec synchronisation automatique et remontée directe des anomalies à l'atelier.
                </p>
                <Link href="/dvir" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
                  Ouvrir le Module DVIR ➔
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION 9: ARCHITECTURE TECHNIQUE & PIPELINE */}
          <section id="tech-architecture" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🏗️</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                9. Architecture Système & Pipeline de Données
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              La stack technologique a été sélectionnée pour sa résilience industrielle, sa performance brute et sa souveraineté d’hébergement :
            </p>

            <div
              style={{
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>
                    🐘 PostgreSQL 16 + TimescaleDB
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Hypertables partitionnées dans le temps pour les millions de points télématiques. 
                    Compression en colonnes (ratio 1:12) et continuous aggregates pour les moyennes horaires de vitesse et consommation.
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>
                    🔴 Redis 7 (RESP3 & Streams)
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Cache haute vitesse, pub/sub télématique en direct vers les interfaces web, 
                    files d'attente d'ingestion et verrous distribués Redlock pour éviter les doubles déclenchements d'OT.
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
                    📡 Traccar Server 6.x Self-Hosted
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Passerelle télématique souveraine décodant plus de 200 protocoles matériels (Teltonika, Coban, Meitrack). 
                    Failover automatique vers Flespi sans transmission de données nominatives.
                  </div>
                </div>

                <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '6px' }}>
                    ⚡ NestJS Backend & Next.js 15
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                    Architecture modulaire découplée en monorepo TypeScript strict. 
                    Clean Architecture, validation par DTOs class-validator et interface utilisateur fluide en Vanilla CSS sans dépendances superflues.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 10: SOUVERAINETÉ & LOI 18-07 */}
          <section id="security-compliance" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                10. Souveraineté Nationale, Loi 18-07 & Conformité ANPDP
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              En Algérie, les données de géolocalisation et les identités des chauffeurs relèvent de la <strong>Loi 18-07 du 10 juin 2018</strong> 
              relative à la protection des personnes physiques dans le traitement des données à caractère personnel, contrôlée par l’<strong>ANPDP</strong>.
            </p>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
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

          {/* SECTION 11: BENCHMARK MONDIAL CONCURRENTIEL */}
          <section id="competitive-matrix" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                11. Benchmark Mondial : DocteurFlotte vs Samsara, Geotab & Navixy
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              Pourquoi les leaders mondiaux de la télématique échouent ou s'avèrent inadaptés aux entreprises opérant en Algérie :
            </p>

            <div
              style={{
                overflowX: 'auto',
                background: 'var(--df-bg-surface-1)',
                border: '1px solid var(--df-border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                boxShadow: 'var(--df-shadow-sm)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--df-border-medium)' }}>
                    <th style={{ padding: '12px 14px', color: 'var(--df-text-main)', fontWeight: 700 }}>Critère d’Évaluation</th>
                    <th style={{ padding: '12px 14px', color: '#059669', fontWeight: 800, background: 'rgba(16, 185, 129, 0.08)' }}>DocteurFlotte (DZ)</th>
                    <th style={{ padding: '12px 14px', color: 'var(--df-text-secondary)', fontWeight: 600 }}>Samsara / Geotab (USA)</th>
                    <th style={{ padding: '12px 14px', color: 'var(--df-text-secondary)', fontWeight: 600 }}>Webfleet / Cartrack</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Génération de Maintenance</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ Maintenance 5.0 (Prescriptive & Cognitive)</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Maintenance 4.0 (Statistique boîte noire)</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Maintenance 3.0 (Seuils kilométriques)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Coût Matériel & Capteurs</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ Strictement 0 DA (Bus natif & ADC)</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Capteurs TPMS & sondes payantes</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Accessoires & sondes en sus</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Démarrage sans boîtier</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ Mode 0 (Zero-Hardware natif)</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Obligation d’acheter un boîtier</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Boîtier obligatoire</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Facturation & Devises</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ 100% en Dinars (DZD) avec DGI</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ En Dollars ($/mois/véhicule)</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ En Euros (€/mois)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Loi 18-07 ANPDP (Souveraineté)</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ 100% Hébergement local DZ</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Serveurs AWS US/EU (Non conforme)</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Cloud étranger</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Physique Saharienne & Poussière</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ 6 Modèles physiques (Arrhenius/CUSUM)</td>
                    <td style={{ padding: '12px 14px', color: '#d97706' }}>⚠️ Règles kilométriques génériques</td>
                    <td style={{ padding: '12px 14px', color: '#d97706' }}>⚠️ Intervalles fixes européens</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Carburant Naftal & Scanner OCR</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ Intégration tickets Naftal & GPL</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Inexistant</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Inexistant</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>IA Locale Embarquée (Offline)</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ Qwen 2.5 local sous Ollama</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Cloud IA externe payant</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Pas d’IA locale</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Moteur Décisionnel Financier</td>
                    <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>✓ Arbitrage ADS en DZD (Coût Action vs Inaction)</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Graphes informatifs sans chiffrage</td>
                    <td style={{ padding: '12px 14px', color: '#dc2626' }}>✗ Simple rapport kilométrique</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 12: VISION STRATÉGIQUE & ROADMAP 2027-2030 */}
          <section id="strategic-roadmap" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🚀</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                12. Vision Futuriste & Roadmap Stratégique 2027–2030
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              La trajectoire d'innovation de DocteurFlotte s'articule autour de 4 piliers technologiques d'avant-garde :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '6px' }}>
                  📡 1. Dongle IoT Souverain Edge (ESP32/CAN)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Développement d’un micro-matériel OBD/CAN open-source assemblable localement en Algérie à moins de <strong>5 000 DZD</strong> par véhicule, avec traitement de l'algorithme d'Arrhenius directement au niveau du microcontrôleur embarqué.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
                  ⚙️ 2. Bourse Inter-Parcs de Pièces Détachées
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Plateforme mutualisée permettant aux gestionnaires de flottes algériennes de s'échanger en DZD les pièces critiques en cas de rupture d'importation (injecteurs, filtres FAP, étriers de freins, alternateurs).
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', marginBottom: '6px' }}>
                  💳 3. Intégration Satim, Edahabia & DGI
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Paiement automatisé des pleins de carburant et des factures d'atelier via l'interbancarité algérienne (Satim / CIB / Edahabia), avec télétransmission automatique des factures conformes à la Direction Générale des Impôts (DGI).
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>
                  🌪️ 4. Routage Météo-Topographique Saharien
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Algorithme de dispatch intégrant les prévisions météorologiques locales en direct (tempêtes de sable, pluies torrentielles d'oueds, températures caniculaires) pour dévier proactivement les convois lourds vers les corridors sécurisés.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 13: GUIDE OPÉRATIONNEL PAR MÉTIER */}
          <section id="roles-workflows" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>👥</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                13. Guide Opérationnel par Rôle Métier
              </h2>
            </div>
            <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              Comment chaque acteur de votre entreprise utilise DocteurFlotte au quotidien :
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>
                  🚗 Responsable de Parc / Directeur d'Exploitation
                </div>
                <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Consulte le tableau de bord décisionnel (<code>/decisions</code>), valide les arbitrages au-dessus de son seuil budgétaire, 
                  surveille les coûts au kilomètre (TCO) et la conformité des contrôles techniques ENACTA.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#d97706', marginBottom: '6px' }}>
                  🔧 Chef d'Atelier & Équipe de Maintenance
                </div>
                <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Reçoit automatiquement les Ordres de Travail (OT) générés par le moteur décisionnel (<code>/work-orders</code>). 
                  Consulte les pièces requises, renseigne les heures de main d'œuvre passées et clôture les interventions avec pièces jointes.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
                  📱 Chauffeurs & Conducteurs d'Engins
                </div>
                <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Remplissent en 60 secondes leur fiche DVIR sur smartphone (<code>/dvir</code>) au début de chaque vacation. 
                  Reçoivent des retours immédiats d'éco-conduite pour réduire le ralenti moteur et toucher leurs primes mensuelles.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 14: FAQ */}
          <section id="faq" style={{ scrollMarginTop: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>❓</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                14. Questions Fréquentes & Support
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
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: '14px', color: 'var(--df-text-main)' }}>
                  Puis-je commencer à utiliser DocteurFlotte si je n'ai encore aucun boîtier GPS ?
                </summary>
                <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  <strong>Absolument oui.</strong> C'est la force du <em>Mode 0 (Zero-Hardware)</em>. Vous saisissez vos cartes carburant Naftal, scannez les reçus papier avec notre scanner OCR et invitez vos chauffeurs à utiliser le DVIR sur leur téléphone. Le moteur décisionnel calcule déjà vos usures d'huile, vos freins et vos risques de casse moteur.
                </p>
              </details>

              <details
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: '14px', color: 'var(--df-text-main)' }}>
                  Comment l'IA Qwen 2.5 fonctionne-t-elle sans internet ?
                </summary>
                <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  Le modèle de langage <code>docteurflotte</code> est quantifié en GGUF (1.5 milliard de paramètres) et s'exécute directement sur la mémoire vive et le processeur de votre serveur local via Ollama. Il n'a besoin d'aucune connexion internet, garantissant une souveraineté et une confidentialité totales.
                </p>
              </details>

              <details
                style={{
                  background: 'var(--df-bg-surface-1)',
                  border: '1px solid var(--df-border-subtle)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: '14px', color: 'var(--df-text-main)' }}>
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
                  boxShadow: 'var(--df-shadow-sm)',
                }}
              >
                <summary style={{ fontWeight: 700, fontSize: '14px', color: 'var(--df-text-main)' }}>
                  Que se passe-t-il si un chauffeur perd la connexion réseau 4G dans le Sahara ?
                </summary>
                <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                  L'application mobile DocteurFlotte est <strong>Offline-First</strong>. Toutes les fiches DVIR, ordres de mission cryptographiques et reçus sont stockés en local (IndexedDB) et synchronisés automatiquement dès que le terminal retrouve une couverture réseau.
                </p>
              </details>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
