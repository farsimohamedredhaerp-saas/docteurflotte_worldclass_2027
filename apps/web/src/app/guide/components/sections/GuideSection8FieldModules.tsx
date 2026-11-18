'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconActivity,
  IconHardHat,
  IconThermometer,
  IconSun,
  IconLayers,
  IconFuel,
  IconCreditCard,
  IconShieldCheck,
  IconFileText,
  IconNavigation,
} from '@/components/navigation/TechIcons';

export function GuideSection8FieldModules() {
  const [selectedVertical, setSelectedVertical] = useState<'btph' | 'cold_chain' | 'agriculture' | 'mining' | 'tmd'>('btph');

  return (
    <section id="field-modules" style={{ scrollMarginTop: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <IconActivity size={24} className="text-cyan-400" />
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
          8. Télémétrie Terrain &amp; 5 Métiers Stratégiques Algériens
        </h2>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: '6px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: '#06b6d4',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            textTransform: 'uppercase',
          }}
        >
          Multi-Activités Souverain • Décrets DZ &amp; Spécificités Régionales
        </span>
      </div>
      <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
        DocteurFlotte brise les limites des outils génériques de télématique en fournissant des <strong>moteurs physiques, réglementaires et économiques dédiés</strong> aux cinq secteurs vitaux de l&apos;économie algérienne. Chaque module vertical intègre les décrets exécutifs, les barèmes nationaux et les réalités climatiques sahariennes pour transformer les signaux bruts en arbitrages opposables en Dinars Algériens (DZD).
      </p>

      {/* SOUS-SECTION 8.1 : LES 5 VERTICALES MÉTIER */}
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: 'var(--df-shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--df-accent-blue)' }}>
            Les 5 Modules Métiers Verticaux (Sélecteur Interactif) :
          </div>
          <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
            Cliquez sur une activité pour inspecter son architecture et ses règles
          </div>
        </div>

        {/* SÉLECTEUR D'ACTIVITÉ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          {[
            {
              key: 'btph',
              code: 'BTPH-01',
              name: 'Chantiers & BTPH',
              desc: 'Engins & Cuves Mobiles',
              badge: 'DÉCRET 15-247',
            },
            {
              key: 'cold_chain',
              code: 'FROID-02',
              name: 'Chaîne du Froid',
              desc: 'Reefers Bi-Moteurs HACCP',
              badge: 'ARRÊTÉ 21 SAFAR',
            },
            {
              key: 'agriculture',
              code: 'AGRI-03',
              name: 'Agriculture Saharienne',
              desc: 'Pivots Albiens & Moisson',
              badge: 'BARÈMES CCLS',
            },
            {
              key: 'mining',
              code: 'MINE-04',
              name: 'Mines & Carrières',
              desc: 'Dumpers 100T & TKPH',
              badge: 'OTR HORS-ROUTE',
            },
            {
              key: 'tmd',
              code: 'TMD-05',
              name: 'TMD & Hydrocarbures',
              desc: 'Citernes 36 000L & Vannes',
              badge: 'DÉCRET 04-415',
            },
          ].map((v) => {
            const isSelected = selectedVertical === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setSelectedVertical(v.key as 'btph' | 'cold_chain' | 'agriculture' | 'mining' | 'tmd')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid var(--df-accent-blue)' : '1px solid var(--df-border-subtle)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'var(--df-bg-surface-2)',
                  color: isSelected ? 'var(--df-accent-blue)' : 'var(--df-text-main)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, opacity: 0.8 }}>{v.code}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: isSelected ? 'var(--df-accent-blue)' : 'rgba(148, 163, 184, 0.2)',
                      color: isSelected ? '#000' : 'var(--df-text-secondary)',
                    }}
                  >
                    {v.badge}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{v.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)', marginTop: '2px' }}>{v.desc}</div>
              </button>
            );
          })}
        </div>

        {/* FICHE DÉTAILLÉE DU MÉTIER SÉLECTIONNÉ */}
        {selectedVertical === 'btph' && (
          <div style={{ borderTop: '1px solid var(--df-border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconHardHat size={22} className="text-amber-400" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  1. Travaux Publics, BTPH &amp; Cuves Mobiles de Chantier
                </h3>
              </div>
              <Link
                href="/chantiers"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#000',
                  background: 'var(--df-accent-blue)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Ouvrir le Cockpit Chantiers &rarr;
              </Link>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Surveillance intégrale des chantiers d&apos;infrastructure, terrassement et parcs d&apos;engins (pelles Caterpillar 336, bulldozers Komatsu D155, chargeuses Liugong, niveleuses, camions malaxeurs). Gestion des cuves mobiles de chantier (3 000L à 10 000L) et réconciliation automatique des pleins multi-consommables (Gazole Non Routier GNR, Super, AdBlue, huiles hydrauliques ISO VG 46/68).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Cadre Juridique &amp; Fiscalité
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  <strong>Décret présidentiel 15-247</strong> (marchés publics, retenue de garantie 5%), <strong>Art. 14 CTCA</strong> (TVA à l&apos;encaissement logée au compte d&apos;attente 445780 jusqu&apos;à réception définitive), et <strong>Art. 169 CIDTA</strong> (rejet fiscal de TVA pour paiements espèces &gt; 1 000 000 DZD).
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-status-ok)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Télématique CAN J1939 &amp; IoT Cuves
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Ingestion haute fréquence <strong>J1939 SPN 91</strong> (position pédale) et <strong>SPN 513</strong> (couple moteur). Suivi horaire anti-dérive isolant le ralenti improductif du travail sous charge, couplé aux jauges ultrasons des cuves mobiles.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Arbitrage Économique (DZD)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Coût journalier d&apos;immobilisation d&apos;un engin lourd calibré à <strong>25 000 DZD/jour</strong>. Élimination des réintégrations au Tableau 9 de la liasse fiscale et calcul rigoureux de la rentabilité horaire par chantier.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Détection Fraudes &amp; Ravitaillement
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Balance volumétrique automatique entre la diminution de la cuve mobile de chantier et l&apos;incrément constaté dans le réservoir de l&apos;engin. Déclenchement d&apos;alerte <code>SITE_FUEL_DISCREPANCY_ALERT</code> en cas d&apos;écart non justifié.
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedVertical === 'cold_chain' && (
          <div style={{ borderTop: '1px solid var(--df-border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconThermometer size={22} className="text-cyan-400" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  2. Chaîne du Froid &amp; Reefers Bi-Moteurs (Agroalimentaire &amp; Santé)
                </h3>
              </div>
              <Link
                href="/cold-chain"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#000',
                  background: 'var(--df-accent-blue)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Ouvrir le Cockpit Froid &rarr;
              </Link>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Supervision thermique temps réel des semi-remorques frigorifiques et caisses isothermes sous des températures ambiantes sahariennes dépassant 48°C. Gestion native de la double motorisation : réservoir porteur (400L) et cuve auxiliaire dédiée au groupe frigorifique autonome (200L, Carrier Transicold Vector ou Thermo King SLXi).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Norme Sanitaire &amp; Agrément
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  <strong>Arrêté interministériel du 21 Safar 1414</strong> (conditions de transport des denrées périssables), conformité HACCP et traçabilité exigée par la <strong>Direction des Services Vétérinaires (DSV)</strong> pour produits laitiers, viandes et vaccins.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-status-ok)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Inertie Thermique &amp; Portes
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                    Filtre d&apos;inertie thermique EWMA (moyenne mobile exponentielle 25 min) combiné au capteur d&apos;ouverture de porte (<code>door_open = true</code>), éliminant les faux positifs causés par les livraisons multi-arrêts en ville.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Scellement Cryptographique SHA-256
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Génération instantanée de <strong>Certificats de Conformité HACCP</strong> scellés cryptographiquement par empreinte SHA-256 infalsifiable, opposables aux vétérinaires inspecteurs et aux autorités douanières.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Enjeu Financier Préservé (DZD)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Protection de cargaisons à haute valeur marchande représentant de <strong>3 500 000 DZD à 8 500 000 DZD</strong> par voyage, avec basculement automatique sur alerte sonore et SMS prioritaire en cas de panne de compresseur.
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedVertical === 'agriculture' && (
          <div style={{ borderTop: '1px solid var(--df-border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconSun size={22} className="text-emerald-400" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  3. Agriculture Saharienne, Forages Albiens &amp; Moisson CCLS
                </h3>
              </div>
              <Link
                href="/agriculture"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#000',
                  background: 'var(--df-accent-blue)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Ouvrir le Cockpit Agriculture &rarr;
              </Link>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Gestion télématique et énergétique des méga-exploitations céréalières et maraîchères du Sud (El Oued, Ouargla, Adrar, Ghardaïa, Timimoun). Télémétrie des générateurs Diesel de pompage et pivots géants d&apos;irrigation (Valley, Lindsay 40 à 80 ha) exploitant la nappe du Continental Intercalaire (Albien, 800m à 1 500m de profondeur), couplée au suivi du moisson-battage à la tâche.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Forages Albiens &amp; Débit L/h
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Mesure en continu de la consommation énergétique des groupes motopompes (L/h de gasoil) corrélée au débit d&apos;eau extrait (m³/h) et à la pression en tête de forage (bars).
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-status-ok)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Dérive Pompage &amp; Crépine
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Détection déterministe de la surconsommation par m³ pompé (&gt; 15% au-dessus de la courbe nominale), identifiant immédiatement un encrassement de crépine sablonneuse ou une chute du niveau piézométrique.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Moisson à la Tâche &amp; CCLS / OAIC
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Contrôle des moissonneuses-batteuses (Claas Lexion, New Holland) avec calcul automatique des surfaces récoltées (Hectares) et rendements (Quintaux) pour la facturation contractuelle aux coopératives CCLS.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Rentabilité &amp; Subventions
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Arbitrage DZD entre coût de pompage à l&apos;hectare et prix de soutien céréalier garanti par l&apos;État, avec traçabilité complète des heures moteur évitant les surconsommations de carburant non subventionné.
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedVertical === 'mining' && (
          <div style={{ borderTop: '1px solid var(--df-border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconLayers size={22} className="text-orange-400" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  4. Mines, Carrières &amp; Pneumatiques Hors-Route (OTR)
                </h3>
              </div>
              <Link
                href="/mining"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#000',
                  background: 'var(--df-accent-blue)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Ouvrir le Cockpit Mines &rarr;
              </Link>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Gestion de l&apos;extraction lourde en carrières d&apos;agrégats, cimenteries (Lafarge, GICA) et gisements miniers sahariens (phosphate Djebel Onk, fer Gara Djebilet). Surveillance des flottes de dumpers rigides géants (Caterpillar 777, Komatsu HD785 de 60T à 100T) et modélisation thermique avancée des pneumatiques géants hors-route (OTR).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Physique du TKPH Saharien
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Calcul en continu du <strong>Tonne-Kilomètre Par Heure (TKPH)</strong> : <code>TKPH = Charge_Moyenne * Vitesse_Moyenne_Cycle</code>, avec détarage thermique obligatoire lorsque la température ambiante dépasse 38°C en été saharien.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-status-ok)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Protection Pneus OTR (0 DA Matériel)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Prévention des délaminages et explosions de carcasses par surchauffe interne de gomme sur pneus géants 27.00R49 et 33.00R51 (coût unitaire de <strong>1 800 000 DZD à 3 200 000 DZD</strong> par pneu).
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Mise en Veille Thermique (Standby)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Dès que le TKPH calculé franchit le seuil critique du fabricant (Michelin / Bridgestone), le système impose un ordre de refroidissement d&apos;atelier (standby 45 min) bloquant la remise en rotation dangereuse.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Coût Analytique à la Tonne (DZD/Tonne)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Décomposition rigoureuse du coût direct de roulage par tonne extraite et transportée, incluant l&apos;usure pneumatique horaire, la consommation de gazole et les coûts de chargement à la pelle.
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedVertical === 'tmd' && (
          <div style={{ borderTop: '1px solid var(--df-border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconFuel size={22} className="text-red-400" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  5. Transport de Matières Dangereuses (TMD / ADR) &amp; Citernes Hydrocarbures
                </h3>
              </div>
              <Link
                href="/tmd"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#000',
                  background: 'var(--df-accent-blue)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Ouvrir le Cockpit TMD &rarr;
              </Link>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Flottes de semi-remorques citernes hydrocarbures (36 000L Magyar, Titan) et transport de matières dangereuses classe 3 (carburants Naftal, solvants, bitumes). Conformité stricte aux décrets algériens, suivi des épreuves hydrostatiques périodiques et verrouillage géofencé des vannes de dépotage anti-siphonnage sur corridors pétroliers (RN1, RN3, Skikda, Arzew, Hassi Messaoud).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Décret 04-415 &amp; Brevet Chauffeur DTW
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Vérification automatisée de la validité triennale (3 ans) du <strong>Brevet TMD Chauffeur</strong> délivré par la Direction des Transports de Wilaya (DTW), avec interdiction de départ (Gate Check bloquant) en cas d&apos;expiration.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-status-ok)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Épreuves APAVE / ENACTA Citernes
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Gestion des compartiments multiples (Gazole sans soufre, Sans Plomb, Sirghaz) et suivi des certificats d&apos;épreuve hydrostatique triennale obligatoire (APAVE ou ENACTA) interdisant le chargement en dépôt pétrolier si dépassé.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Vannes de Fond Géofencées
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Capteurs d&apos;ouverture des vannes de dépotage et des dômes asservis au géofencing des dépôts agréés (Naftal Caroubier, El Eulma, Sidi Arcine) et des stations clientes. Tout dépotage hors-zone déclenche <code>UNAUTHORIZED_VALVE_DISCHARGE_ALERT</code>.
                </div>
              </div>

              <div style={{ background: 'var(--df-bg-surface-2)', borderRadius: '8px', padding: '14px', border: '1px solid var(--df-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Sécurité Matérielle &amp; Preuve SHA-256
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--df-text-main)', lineHeight: 1.5 }}>
                  Contrôle des extincteurs homologués 6kg et de la tresse antistatique de masse avant vidange. Scellement immuable SHA-256 des bordereaux de livraison hydrocarbures opposables en commission et devant les tribunaux.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLEAU SYNTHÉTIQUE DES 5 VERTICALES */}
        <div style={{ marginTop: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--df-text-main)' }}>
            <thead>
              <tr style={{ background: 'var(--df-bg-surface-2)', borderBottom: '1px solid var(--df-border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Activité Métier</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Équipements &amp; Flotte</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Texte Légal &amp; Décret</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Signal IoT / Télématique</th>
                <th style={{ padding: '10px 12px', fontWeight: 800 }}>Impact Financier &amp; Sécurité</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--df-accent-blue)' }}>1. Travaux Publics (BTPH)</td>
                <td style={{ padding: '10px 12px' }}>Pelles 30T, Bulldozers, Malaxeurs, Cuves mobiles</td>
                <td style={{ padding: '10px 12px' }}>Décret 15-247 / Art. 14 CTCA (445780)</td>
                <td style={{ padding: '10px 12px' }}>CAN J1939 couple &amp; niveau ultrason cuves</td>
                <td style={{ padding: '10px 12px' }}>25 000 DZD/j d&apos;immobilisation, 0 rejet TVA</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#06b6d4' }}>2. Chaîne du Froid</td>
                <td style={{ padding: '10px 12px' }}>Semi-remorques reefers bi-moteurs (Carrier, Thermo King)</td>
                <td style={{ padding: '10px 12px' }}>Arrêté 21 Safar 1414 / DSV HACCP</td>
                <td style={{ padding: '10px 12px' }}>Sondes PT100 tri-zones + cuve frigo 200L</td>
                <td style={{ padding: '10px 12px' }}>Sauvegarde cargaisons 8 500 000 DZD, SHA-256</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10b981' }}>3. Agriculture Saharienne</td>
                <td style={{ padding: '10px 12px' }}>Pivots 80ha, pompes albiennes, moissonneuses</td>
                <td style={{ padding: '10px 12px' }}>Barèmes CCLS / OAIC / Régie Eaux</td>
                <td style={{ padding: '10px 12px' }}>Débitmètres L/h &amp; m³/h, horamètres</td>
                <td style={{ padding: '10px 12px' }}>Détection dérive crépine, tâche 4 500 DZD/Ha</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--df-border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f59e0b' }}>4. Mines &amp; Carrières</td>
                <td style={{ padding: '10px 12px' }}>Dumpers rigides 100T (CAT 777, Komatsu HD785)</td>
                <td style={{ padding: '10px 12px' }}>Code Minier ANAM / Normes Michelin OTR</td>
                <td style={{ padding: '10px 12px' }}>Pesage charge J1939 + Vitesse cycle</td>
                <td style={{ padding: '10px 12px' }}>Protection pneus 3,2M DZD, coût DZD/Tonne</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ef4444' }}>5. TMD &amp; Hydrocarbures</td>
                <td style={{ padding: '10px 12px' }}>Citernes 36 000L multi-cuves (Magyar, Titan)</td>
                <td style={{ padding: '10px 12px' }}>Décret 04-415 / APAVE épreuve 3 ans</td>
                <td style={{ padding: '10px 12px' }}>Capteurs vannes dépotage géofencées</td>
                <td style={{ padding: '10px 12px' }}>Zéro siphonnage sur route, PV légal scellé</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SOUS-SECTION 8.2 : SOCLE TÉLÉMATIQUE & OUTILS TRANSVERSES */}
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.01em', margin: '0 0 6px 0' }}>
          Socle Télématique &amp; Outils de Terrain Transverses
        </h3>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          Les cinq piliers technologiques communs déployés sur l&apos;ensemble de la flotte algérienne :
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <IconCreditCard size={20} className="text-emerald-500" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
              Scanner OCR Naftal &amp; Détection d&apos;Anomalies
            </h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            Module de reconnaissance optique par caméra mobile entraîné sur les tickets thermiques froissés des stations Naftal. Détection immédiate des fraudes : surconsommation, litrage supérieur au réservoir constructeur, et tickets antidatés.
          </p>
          <Link href="/fuel-scanner" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
            Ouvrir le Scanner de Tickets &rarr;
          </Link>
        </div>

        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <IconShieldCheck size={20} className="text-amber-500" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
              DVIR Mobile PWA Offline-First &amp; Verrou Critique
            </h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            Inspection pré-départ chauffeur sur PWA avec <strong>résilience Offline-First intégrale</strong> (zones blanches du Sud saharien) avec file locale <code>df_dvir_offline_queue</code> et réconciliation chronologique stricte par <code>device_timestamp</code>. Tout échec critique verrouille immédiatement le véhicule (<code>DVIR_CRITICAL_FAILURE_BLOCK</code>) et génère un Ordre de Travail atelier.
          </p>
          <Link href="/dvir" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
            Ouvrir le Module DVIR &rarr;
          </Link>
        </div>

        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <IconFileText size={20} className="text-blue-500" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
              Dossier d&apos;Expertise Technique &amp; Export ERP 1-Clic
            </h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            Édition instantanée du <strong>Dossier d&apos;Expertise Technique &amp; Traçabilité Carburant</strong> avec scellement SHA-256, courbe CUSUM et compensation topographique Valhalla. Export direct sans ressaisie vers les ERPs du marché algérien : <strong>PC Compta (SCF DGI)</strong>, <strong>Sage 100</strong>, <strong>Odoo</strong> et <strong>SAP PM</strong>.
          </p>
          <Link href="/fuel-scanner" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
            Voir les Dossiers Techniques &rarr;
          </Link>
        </div>

        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <IconNavigation size={20} className="text-blue-500" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
              Cockpit MapLibre Souverain (58 Wilayas &amp; 4 Corridors)
            </h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            Cartographie vectorielle souveraine <strong>MapLibre GL JS</strong> pointant sur les serveurs locaux (OSM Algérie) et le profil d&apos;élévation Valhalla. Visualisation des 4 corridors majeurs (RN1, A1, RN3, RN6), des zones blanches sahariennes et filtrage par palier réel : <strong>Mode 0 (Déclaratif)</strong>, <strong>Mode 1 (GNSS)</strong>, <strong>Mode 2 (CAN/J1939)</strong>.
          </p>
          <Link href="/map" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
            Ouvrir la Carte des Corridors &rarr;
          </Link>
        </div>

        <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <IconActivity size={20} className="text-rose-500" />
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
              Routeur Vocal Atelier en Darja Phonétique &amp; Base OEM
            </h4>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
            Conçu pour les mécaniciens en combinaison de travail : interprétation instantanée des requêtes en dialecte algérien (<em>« choufli zit el moteur »</em>, <em>« aatini l&apos;batterie »</em>, <em>« serrage culasse shacman »</em>) avec <strong>court-circuit déterministe sous les 50 ms sans LLM</strong> pointant vers la base officielle multi-constructeurs (Shacman, Renault Trucks, MAN, Mercedes).
          </p>
          <Link href="/copilot" style={{ fontSize: '12.5px', color: 'var(--df-accent-blue)', fontWeight: 700, textDecoration: 'none' }}>
            Tester les Commandes Vocales &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

