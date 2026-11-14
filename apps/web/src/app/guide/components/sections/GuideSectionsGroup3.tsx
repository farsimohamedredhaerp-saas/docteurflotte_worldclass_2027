'use client';

import React from 'react';
import Link from 'next/link';
import {
  IconTerminal,
  IconShieldCheck,
  IconTrendingUp,
  IconCompass,
  IconUsers,
  IconHelpCircle,
} from '@/components/navigation/TechIcons';

export function GuideSectionsGroup3() {
  return (
    <>
      {/* SECTION 9: ARCHITECTURE TECHNIQUE & PIPELINE */}
      <section id="tech-architecture" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconTerminal size={24} className="text-indigo-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            9. Architecture Système &amp; Pipeline de Données
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
                PostgreSQL 16 + TimescaleDB
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                Hypertables partitionnées dans le temps pour les millions de points télématiques. 
                Compression en colonnes (ratio 1:12) et continuous aggregates pour les moyennes horaires de vitesse et consommation.
              </div>
            </div>

            <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>
                Redis 7 (RESP3 &amp; Streams)
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                Cache haute vitesse, pub/sub télématique en direct vers les interfaces web, 
                files d&apos;attente d&apos;ingestion et verrous distribués Redlock pour éviter les doubles déclenchements d&apos;OT.
              </div>
            </div>

            <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
                Traccar Server 6.x Self-Hosted
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
                Passerelle télématique souveraine décodant plus de 200 protocoles matériels (Teltonika, Coban, Meitrack). 
                Failover automatique vers Flespi sans transmission de données nominatives.
              </div>
            </div>

            <div style={{ background: 'var(--df-bg-surface-2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '6px' }}>
                NestJS Backend &amp; Next.js 15
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
          <IconShieldCheck size={24} className="text-emerald-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            10. Souveraineté Nationale, Loi 18-07 &amp; Conformité ANPDP
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          Conformité absolue avec la législation algérienne relative à la protection des données personnelles (Loi 18-07 du 10 juin 2018) :
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
              Hébergement 100% Algérien
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Les bases de données PostgreSQL et TimescaleDB résident exclusivement sur des serveurs physiques ou cloud souverain (Algérie Télécom, Djezzy Cloud, Ooredoo B2B). Aucune donnée de flotte ne franchit les frontières nationales.
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '4px' }}>
              Anonymisation Matérielle Stricte
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Les flux envoyés aux passerelles IoT externes en cas de failover sont entièrement purgés de tout identifiant personnel : pas de nom de chauffeur, pas de plaque minéralogique, pas de raison sociale d’entreprise.
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', marginBottom: '4px' }}>
              Isolation Multi-Tenant Fail-Closed (RLS)
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Row-Level Security (RLS) appliqué au niveau du moteur PostgreSQL lui-même : un client A ne peut mathématiquement jamais exécuter une requête accédant aux données d’un client B, même en cas de faille applicative.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11: BENCHMARK MONDIAL */}
      <section id="competitive-matrix" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconTrendingUp size={24} className="text-emerald-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            11. Benchmark Mondial vs Samsara, Geotab &amp; Acteurs Traditionnels
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          Pourquoi DocteurFlotte est la seule solution viable pour les flottes en Algérie :
        </p>

        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '12px',
            overflow: 'auto',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)' }}>
                <th style={{ padding: '14px', fontWeight: 800, color: 'var(--df-text-main)' }}>Critère d&apos;Évaluation</th>
                <th style={{ padding: '14px', fontWeight: 800, color: '#059669', background: 'rgba(16, 185, 129, 0.1)' }}>DocteurFlotte 5.0 (DZ)</th>
                <th style={{ padding: '14px', fontWeight: 800, color: 'var(--df-text-secondary)' }}>Samsara (USA)</th>
                <th style={{ padding: '14px', fontWeight: 800, color: 'var(--df-text-secondary)' }}>Geotab (Canada)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Mode Zéro Boîtier (Mode 0)</td>
                <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>Oui (OCR Naftal + DVIR PWA)</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Non (Matériel propriétaire obligatoire)</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Non (Dongle GO obligatoire)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Souveraineté des Données (Loi 18-07)</td>
                <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>100% Hébergement local DZ</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Serveurs AWS US/EU (Non conforme)</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Cloud étranger</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Physique Saharienne &amp; Poussière</td>
                <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>6 Modèles physiques (Arrhenius/CUSUM)</td>
                <td style={{ padding: '12px 14px', color: '#d97706' }}>Règles kilométriques génériques</td>
                <td style={{ padding: '12px 14px', color: '#d97706' }}>Intervalles fixes européens</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Carburant Naftal &amp; Scanner OCR</td>
                <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>Intégration tickets Naftal &amp; GPL</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Inexistant</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Inexistant</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>IA Locale Embarquée (Offline)</td>
                <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>Qwen 2.5 local sous Ollama</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Cloud IA externe payant</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Pas d’IA locale</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--df-text-main)' }}>Moteur Décisionnel Financier</td>
                <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.08)' }}>Arbitrage ADS en DZD (Coût Action vs Inaction)</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Graphes informatifs sans chiffrage</td>
                <td style={{ padding: '12px 14px', color: '#dc2626' }}>Simple rapport kilométrique</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 12: VISION STRATÉGIQUE & ROADMAP 2027-2030 */}
      <section id="strategic-roadmap" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconCompass size={24} className="text-indigo-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            12. Vision Futuriste &amp; Roadmap Stratégique 2027–2030
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          La trajectoire d&apos;innovation de DocteurFlotte s&apos;articule autour de 4 piliers technologiques d&apos;avant-garde :
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '6px' }}>
              1. Dongle IoT Souverain Edge (ESP32/CAN)
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Développement d’un micro-matériel OBD/CAN open-source assemblable localement en Algérie à moins de <strong>5 000 DZD</strong> par véhicule, avec traitement de l&apos;algorithme d&apos;Arrhenius directement au niveau du microcontrôleur embarqué.
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
              2. Bourse Inter-Parcs de Pièces Détachées
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Plateforme mutualisée permettant aux gestionnaires de flottes algériennes de s&apos;échanger en DZD les pièces critiques en cas de rupture d&apos;importation (injecteurs, filtres FAP, étriers de freins, alternateurs).
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', marginBottom: '6px' }}>
              3. Intégration Satim, Edahabia &amp; DGI
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Paiement automatisé des pleins de carburant et des factures d&apos;atelier via l&apos;interbancarité algérienne (Satim / CIB / Edahabia), avec télétransmission automatique des factures conformes à la Direction Générale des Impôts (DGI).
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>
              4. Routage Météo-Topographique Saharien
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Algorithme de dispatch intégrant les prévisions météorologiques locales en direct (tempêtes de sable, pluies torrentielles d&apos;oueds, températures caniculaires) pour dévier proactivement les convois lourds vers les corridors sécurisés.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 13: GUIDE OPÉRATIONNEL PAR MÉTIER */}
      <section id="roles-workflows" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconUsers size={24} className="text-cyan-400" />
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
              Responsable de Parc / Directeur d&apos;Exploitation
            </div>
            <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Consulte le tableau de bord décisionnel (<code>/decisions</code>), valide les arbitrages au-dessus de son seuil budgétaire, 
              surveille les coûts au kilomètre (TCO) et la conformité des contrôles techniques ENACTA.
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#d97706', marginBottom: '6px' }}>
              Chef d&apos;Atelier &amp; Équipe de Maintenance
            </div>
            <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Reçoit automatiquement les Ordres de Travail (OT) générés par le moteur décisionnel (<code>/work-orders</code>). 
              Consulte les pièces requises, renseigne les heures de main d&apos;œuvre passées et clôture les interventions avec pièces jointes.
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
              Chauffeur / Conducteur Routier
            </div>
            <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Effectue son inspection quotidienne obligatoire sur son smartphone avant tout départ (<code>/dvir</code>). 
              Scanne ses tickets de plein de gasoil aux stations Naftal en 3 secondes (<code>/fuel-scanner</code>).
            </div>
          </div>

          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '6px' }}>
              Directeur Financier (DAF) / Contrôleur de Gestion
            </div>
            <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Analyse les économies réelles générées par la maintenance prédictive par rapport au coût des pannes évitées. 
              Télécharge les bilans financiers certifiés pour justifier le ROI de la flotte devant le Conseil d’Administration.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 14: FAQ */}
      <section id="faq" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconHelpCircle size={24} className="text-amber-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            14. Questions Fréquentes &amp; Support
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
              Puis-je commencer à utiliser DocteurFlotte si je n&apos;ai encore aucun boîtier GPS ?
            </summary>
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              <strong>Absolument oui.</strong> C&apos;est la force du <em>Mode 0 (Zero-Hardware)</em>. Vous saisissez vos cartes carburant Naftal, scannez les reçus papier avec notre scanner OCR et invitez vos chauffeurs à utiliser le DVIR sur leur téléphone. Le moteur décisionnel calcule déjà vos usures d&apos;huile, vos freins et vos risques de casse moteur.
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
              Comment l&apos;IA Qwen 2.5 fonctionne-t-elle sans internet ?
            </summary>
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Le modèle de langage <code>docteurflotte</code> est quantifié en GGUF (1.5 milliard de paramètres) et s&apos;exécute directement sur la mémoire vive et le processeur de votre serveur local via Ollama. Il n&apos;a besoin d&apos;aucune connexion internet, garantissant une souveraineté et une confidentialité totales.
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
              Il vous suffit de configurer l&apos;adresse IP de votre serveur DocteurFlotte et le port correspondant au protocole matériel 
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
              L&apos;application mobile DocteurFlotte est <strong>Offline-First</strong>. Toutes les fiches DVIR, ordres de mission cryptographiques et reçus sont stockés en local (<code>localStorage</code> / IndexedDB) dans une file d&apos;attente résiliente. Dès que le terminal retrouve une couverture réseau, les paquets sont téléversés par lot et <strong>rejoués dans l&apos;ordre chronologique strict du terminal (<code>device_timestamp</code>)</strong> pour éliminer tout effet de décalage temporel. Si une défaillance critique a été constatée en zone blanche, le véhicule est immédiatement consigné dans le module de dispatching TOPSIS pour empêcher tout départ dangereux.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
