'use client';

import React from 'react';
import {
  IconActivity,
  IconTruck,
  IconSliders,
  IconCpu,
  IconZap,
} from '../../../../components/navigation/TechIcons';
import { ModeTab, RoiSimulatorState } from '../../types';

interface GuideSectionsGroup1Props {
  activeModeTab: ModeTab;
  setActiveModeTab: (tab: ModeTab) => void;
  roiSimulator: RoiSimulatorState;
  selectedAlgo: number;
  setSelectedAlgo: (algo: number) => void;
}

export function GuideSectionsGroup1({
  activeModeTab,
  setActiveModeTab,
  roiSimulator,
  selectedAlgo,
  setSelectedAlgo,
}: GuideSectionsGroup1Props) {
  const {
    actionCost,
    setActionCost,
    towingCost,
    setTowingCost,
    partReplacement,
    setPartReplacement,
    failureProb,
    setFailureProb,
    totalInactionRisk,
    netSavings,
    roiRatio,
  } = roiSimulator;

  return (
    <>
      {/* SECTION 1: VISION & PHILOSOPHIE */}
      <section id="vision" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconActivity size={24} className="text-indigo-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            1. Vision &amp; Modèle : L&apos;Ère de la Maintenance 5.0 Souveraine
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          La quasi-totalité des solutions de télématique du marché échouent dans les flottes algériennes pour 3 raisons majeures :
          elles exigent l’installation coûteuse d’un boîtier sur 100% des véhicules dès le premier jour, 
          elles se limitent à du pistage passif (&quot;points sur une carte&quot;) et elles bombardent les gestionnaires de fausses alertes sans arbitrage financier.
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
            <IconZap size={18} className="text-amber-400" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#065F46', margin: 0 }}>
              L&apos;Échelle des 5 Générations de Maintenance Industrielle
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px', borderLeft: '3px solid #94A3B8' }}>
              <div style={{ fontWeight: 800, color: '#475569' }}>1.0 Réactive (1970)</div>
              <div style={{ color: '#DC2626', fontWeight: 600, marginTop: '2px' }}>« Casse &amp; Dépannage »</div>
              <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>Réparation d&apos;urgence après avarie sur route. Arrêt d&apos;exploitation brutal.</p>
            </div>
            <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px', borderLeft: '3px solid #D97706' }}>
              <div style={{ fontWeight: 800, color: '#475569' }}>2.0 Préventive (1990)</div>
              <div style={{ color: '#D97706', fontWeight: 600, marginTop: '2px' }}>« Calendrier Aveugle »</div>
              <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>Vidange fixe tous les 10 000 km. Remplacement prématuré de lubrifiants encore viables.</p>
            </div>
            <div style={{ padding: '12px', background: 'var(--df-bg-surface-2)', borderRadius: '8px', borderLeft: '3px solid #2563EB' }}>
              <div style={{ fontWeight: 800, color: '#475569' }}>3.0 Conditionnelle (2010)</div>
              <div style={{ color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>« Voyants Tableau »</div>
              <p style={{ margin: '6px 0 0', color: 'var(--df-text-secondary)', lineHeight: 1.45 }}>Alerte déclenchée sur seuil de capteur critique (&gt; 95°C). L&apos;usure métallique est déjà amorcée.</p>
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
              Approche Traditionnelle (Pistage Passif 4.0)
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
              <li>Obligation d&apos;acheter et d&apos;installer des boîtiers GPS sur tout le parc.</li>
              <li>Simple géolocalisation passive (&quot;Le camion est à Sétif&quot;).</li>
              <li>Alertes kilométriques aveugles ignorant la sévérité du climat saharien.</li>
              <li>Aucun arbitrage financier : aucune conversion en Dinars Algériens (DZD).</li>
              <li>Données souvent hébergées à l&apos;étranger en violation de la Loi 18-07.</li>
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
              Le Paradigme DocteurFlotte (Maintenance 5.0)
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
              <li><strong>Opérationnel dès le Jour 1 en Mode 0</strong> sans aucun investissement matériel.</li>
              <li><strong>Moteur SAD → ADS :</strong> Recommande et chiffre des actions en DZD (Coût Action vs Inaction).</li>
              <li><strong>Physique Déterministe 0 DA :</strong> Arrhenius, Archard, UEB Enthalpie SCR, CSIS spectro-cranking.</li>
              <li><strong>Symbiose Homme-Machine :</strong> Assistant vocal d&apos;atelier en Darja/Français et RAG sans hallucination.</li>
              <li><strong>Souveraineté Intégrale :</strong> Hébergement local, RLS Fail-Closed et IA Qwen locale zéro-PII (Loi 18-07).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 2: LES 3 MODES D'EXPLOITATION */}
      <section id="modes" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconTruck size={24} className="text-blue-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            2. Les 3 Modes d&apos;Exploitation : Flexibilité Totale du Parc
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          DocteurFlotte permet à un même tenant de mixer différents niveaux d&apos;équipement dans sa flotte sans aucune friction :
        </p>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { key: 'mode0', label: 'Mode 0 : Sans Boîtier (Zero-Hardware)' },
            { key: 'mode1', label: 'Mode 1 : GPS Standard Traccar' },
            { key: 'mode2', label: 'Mode 2 : Full CAN / J1939 Haute Fréquence' },
          ].map((tab) => {
            const isSelected = activeModeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveModeTab(tab.key as ModeTab)}
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
                  Mode 0 — Zero-Hardware / OEM-First
                </h3>
                <span style={{ fontSize: '12px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  0 DA d&apos;investissement boîtier
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                Idéal pour les flottes en cours de déploiement, les sous-traitants temporaires ou les véhicules légers. 
                Le système fonctionne par <strong>croisement intelligent de 4 flux existants</strong> :
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>Pleins Naftal &amp; Scanner OCR</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                    Intégration instantanée des reçus papier par photo mobile ou factures de cartes Naftal (Gasoil, Sans Plomb, Sirghaz). Reconstitution de la consommation et contrôle d&apos;anomalies.
                  </div>
                </div>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>DVIR Numérique Mobile</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                    Inspections chauffeur avant/après tournée sur smartphone (kilométrage relevé, niveau d&apos;huile, photos des défauts) avec synchronisation hors-ligne.
                  </div>
                </div>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>Routage Valhalla &amp; Topographie</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                    Calcul précis des distances entre points de livraison et intégration des profils d&apos;élévation routiers (cols de montagne, autoroute Est-Ouest).
                  </div>
                </div>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--df-border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--df-text-main)', marginBottom: '6px' }}>Matrice Climatique 58 Wilayas</div>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
                    Coefficient de sévérité thermique et d&apos;exposition aux poussières sahariennes (ex: Adrar = 1.45, Alger = 1.05).
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModeTab === 'mode1' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0284c7', margin: 0 }}>
                  Mode 1 — Télématique GPS Standard Traccar
                </h3>
                <span style={{ fontSize: '12px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Open-Source Souverain &amp; Économique
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
                Compatible avec tous les traceurs du marché (Teltonika FMB920, Ruptela, Coban, Concox, Sinotrack). 
                Les données sont ingérées directement par notre passerelle Traccar auto-hébergée sur le port <strong>8085</strong> :
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                <li><strong>Positionnement temps réel &amp; Replay d&apos;itinéraires :</strong> Précision géodésique WGS84, vitesse et cap.</li>
                <li><strong>Module Éco-Conduite &amp; Gaspillage :</strong> Calcul des pertes financières dues au ralenti excessif valorisées au tarif officiel (31.00 DA/L en 2026, 29.01 DA/L barème historique).</li>
                <li><strong>Surveillance des Dérives Compteurs :</strong> Algorithme anti-recul d&apos;odomètre avec détection des anomalies de transmission.</li>
                <li><strong>Contrôle des Franchissements :</strong> Zones d&apos;exploitation autorisées (Wilayas, corridors autoroutiers, carrières).</li>
              </ul>
            </div>
          )}

          {activeModeTab === 'mode2' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#7c3aed', margin: 0 }}>
                  Mode 2 — Full CAN / J1939 Haute Fréquence &amp; IoT
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
                <li><strong>Thermique Haute Fréquence :</strong> Température d&apos;huile, liquide de refroidissement, différentiel culasse.</li>
                <li><strong>Analyse Électrochimique Batterie :</strong> Échantillonnage à 100 ms lors de la phase de démarrage (Cranking).</li>
                <li><strong>Diagnostic FAP &amp; Dépollution :</strong> Contre-pression différentielle, niveau de suie en grammes.</li>
                <li><strong>Télémétrie Chaîne du Froid :</strong> Température bi-zone des remorques frigorifiques (Thermo King, Carrier) pour la sécurité alimentaire et pharmaceutique.</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: LE CŒUR DÉCISIONNEL */}
      <section id="decision-engine" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconSliders size={24} className="text-indigo-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            3. Le Cœur Décisionnel (SAD → ADS) &amp; Arbitrage Économique
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
              Simulateur d&apos;Arbitrage Financier SAD → ADS (Testez la Rentabilité d&apos;une Décision)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Montants en Dinars Algériens (DZD)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--df-text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                Coût de l&apos;Intervention Immédiate (DZD)
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
              <span style={{ fontSize: '11px', color: 'var(--df-text-muted)' }}>Pièces neuves + Main d&apos;œuvre</span>
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
                Risque Financier de l&apos;Inaction (Pondéré) :
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
              {netSavings > 0 ? 'ACTION IMMÉDIATE APPROUVÉE' : 'INTERVENTION REPORTÉE'}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: LES 6 ALGORITHMES PHYSIQUES */}
      <section id="physics-algorithms" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconCpu size={24} className="text-emerald-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            4. Les 6 Algorithmes Physiques Déterministes &amp; Calcul du Score VHI
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          Le Vehicle Health Index (VHI) global (noté de 0 à 100) est la synthèse pondérée de 6 algorithmes déterministes 
          issus de la thermodynamique, de l’électrochimie et de la tribologie mécanique :
        </p>

        {/* Algorithm Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {[
            { id: 1, name: 'Arrhenius (Huile)', tag: 'Thermodynamique' },
            { id: 2, name: 'Cranking (Batterie)', tag: 'Électrochimie' },
            { id: 3, name: 'Thermique Culasse', tag: 'Échangeur / EWMA' },
            { id: 4, name: 'Archard (Freins)', tag: 'Tribologie' },
            { id: 5, name: 'Colmatage FAP', tag: 'Bilan Massique' },
            { id: 6, name: 'CUSUM Anti-Siphon', tag: 'Statistique' },
          ].map((algo) => {
            const isSelected = selectedAlgo === algo.id;
            return (
              <button
                key={algo.id}
                type="button"
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
                Algorithme 1 : Dégradation Chimique de l&apos;Huile (Loi d&apos;Arrhenius)
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                L&apos;huile moteur perd sa viscosité et ses additifs détergents de manière exponentielle en fonction de sa température de fonctionnement 
                et de la contamination par les poussières abrasives (silice saharienne).
              </p>
              <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--df-accent-blue)', marginBottom: '14px' }}>
                Facteur_Arrhenius = exp((Ea / R) * (1 / T_ref_Kelvin - 1 / T_huile_Kelvin)) * K_poussiere
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                <li><strong>Ea / R :</strong> Énergie d&apos;activation sur constante des gaz parfaits (valeur nominale : 6500 K).</li>
                <li><strong>T_ref :</strong> Température de fonctionnement optimale constructeur (363.15 K = 90°C).</li>
                <li><strong>Preuve terrain :</strong> 100 km parcourus à 110°C dans le Sud équivalent exactement à <strong>254,5 km d&apos;usure réelle</strong>.</li>
              </ul>
            </div>
          )}

          {selectedAlgo === 2 && (
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#059669', margin: '0 0 10px 0' }}>
                Algorithme 2 : Cranking Health CVHI (Santé Électrochimique Batterie)
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                Une mesure de tension au repos (12.6V) est trompeuse. La véritable santé (SOH) d&apos;une batterie au plomb/calcium ne se révèle 
                qu&apos;au moment où le démarreur absorbe 300 à 600 Ampères lors du lancement du moteur.
              </p>
              <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#059669', marginBottom: '14px' }}>
                SOH (%) = ((V_min - V_critique) / (V_neuve - V_critique)) * Facteur_Recouvrement(t_recovery)
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                <li><strong>Seuil critique V_min :</strong> 9.6 V (en dessous, sulfatation avancée ou cellule court-circuitée).</li>
                <li><strong>Temps de recouvrement t_rec :</strong> Le retour à 12.8V puis 14.2V (alternateur) doit s&apos;effectuer en moins de 1.8 seconde.</li>
              </ul>
            </div>
          )}

          {selectedAlgo === 3 && (
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#dc2626', margin: '0 0 10px 0' }}>
                Algorithme 3 : Modèle Thermique Différentiel Culasse &amp; Échangeur
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                Surveille l&apos;équilibre thermique entre le circuit d&apos;huile et le circuit d&apos;eau. Un lissage exponentiel (EWMA) filtre les pics passagers 
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
                Algorithme 4 : Usure des Garnitures de Freins (Loi Tribologique d&apos;Archard)
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                L&apos;usure des plaquettes et garnitures dépend de l&apos;énergie cinétique mécanique dissipée lors des décélérations successives.
              </p>
              <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#db2777', marginBottom: '14px' }}>
                Volume_Usure (mm3) = K_archard * (1/2 * Masse_Vehicule * (v_debut^2 - v_fin^2)) / Durete_Materiau
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                <li><strong>Épaisseur neuve :</strong> 14 mm | <strong>Épaisseur minimale critique :</strong> 3.0 mm.</li>
                <li><strong>Intégration du relief :</strong> Les descentes montagneuses prolongées (Gorges de Kherrata, Chréa) accélèrent le calcul d&apos;usure.</li>
              </ul>
            </div>
          )}

          {selectedAlgo === 5 && (
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0284c7', margin: '0 0 10px 0' }}>
                Algorithme 5 : Bilan Massique de Colmatage du FAP (Filtre à Particules)
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '14px' }}>
                Évalue en continu l&apos;accumulation de suie imbrûlée selon le cycle de roulage (urbain vs autoroute) et la contre-pression d&apos;échappement.
              </p>
              <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#0284c7', marginBottom: '14px' }}>
                Masse_Suie (g) = f(Delta_Pression_mbar, Debit_Air_kg_h, Temperature_Echappement_C)
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.7 }}>
                <li><strong>Seuil régénération forcée :</strong> 45 grammes.</li>
                <li><strong>Seuil critique de blocage :</strong> 70 grammes (risque d&apos;incendie ou casse turbo par contre-pression excessive).</li>
              </ul>
            </div>
          )}

          {selectedAlgo === 6 && (
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#7c3aed', margin: '0 0 10px 0' }}>
                Algorithme 6 : Détection Anti-Siphon CUSUM (Cumulative Sum Control Chart)
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
    </>
  );
}

