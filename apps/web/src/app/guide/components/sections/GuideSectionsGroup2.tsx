'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconZap,
  IconShieldCheck,
  IconAlertOctagon,
  IconCheckCircle,
  IconActivity,
  IconSparkles,
  IconFileText,
  IconCreditCard,
  IconSearch,
  IconRadio,
  IconNavigation,
} from '@/components/navigation/TechIcons';

export function GuideSectionsGroup2() {
  const [selectedInnovation, setSelectedInnovation] = useState<'HWFA' | 'SES_UEB' | 'KMSO' | 'BEP_VCO' | 'CSIS'>('HWFA');
  const [selectedClimateZone, setSelectedClimateZone] = useState<'TELL' | 'STEPPE' | 'SAHARA'>('SAHARA');

  return (
    <>
      {/* SECTION 5: INNOVATIONS TECHNOLOGIQUES DE RUPTURE (MONOPOLE 0 DA / 0 $) */}
      <section id="tech-innovations" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <IconZap size={24} className="text-amber-400" />
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
              Coût Matériel Égal à Zéro (0 DA)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Zéro achat de jauges de contrainte, zéro valve TPMS à piles arrachée en carrière, zéro sonde rapportée.
            </div>
          </div>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--df-accent-blue)', marginBottom: '4px' }}>
              Physique Déterministe Opposable
            </div>
            <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Rejet des boîtes noires statistiques. Lois d&apos;Arrhenius, Archard, bilans d&apos;enthalpie et micro-glissement cinématique.
            </div>
          </div>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>
              Résistance aux Conditions Sahariennes
            </div>
            <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', lineHeight: 1.6 }}>
              Filtres d&apos;échantillonnage quasi-stationnaire isolant la poussière de silice, le dévers routier et les chaleurs extrêmes (&gt; 48°C).
            </div>
          </div>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ec4899', marginBottom: '4px' }}>
              Pouvoir d&apos;Arbitrage DAF / Direction
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
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--df-accent-blue)', marginBottom: '14px' }}>
            Sélecteur des 5 Innovations Mondiales Brevetables DocteurFlotte :
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '20px' }}>
            {[
              { key: 'HWFA', code: 'HWFA', name: 'Hydraulic Work-Factor', domain: 'Engins BTP / Mines' },
              { key: 'SES_UEB', code: 'SES-UEB', name: 'SCR Sniffer & Enthalpy', domain: 'Camions Poids Lourds' },
              { key: 'KMSO', code: 'KMSO', name: 'Micro-Slip Observer', domain: 'Pneus & Essieux' },
              { key: 'BEP_VCO', code: 'BEP-VCO', name: 'Cooling Enthalpy Flow', domain: 'Culasse & Radiateur' },
              { key: 'CSIS', code: 'CSIS', name: 'Spectral In-Cylinder', domain: 'Injecteurs & Moteur' },
            ].map((inv) => {
              const isSelected = selectedInnovation === inv.key;
              return (
                <button
                  key={inv.key}
                  onClick={() => setSelectedInnovation(inv.key as 'HWFA' | 'SES_UEB' | 'KMSO' | 'BEP_VCO' | 'CSIS')}
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
                  <div style={{ fontSize: '11px', fontWeight: 800, opacity: 0.8 }}>{inv.code}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, margin: '2px 0' }}>{inv.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--df-text-secondary)' }}>{inv.domain}</div>
                </button>
              );
            })}
          </div>

          {/* CONTENU DE L'INNOVATION 1 : HWFA */}
          {selectedInnovation === 'HWFA' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <IconZap size={20} className="text-amber-500" />
                <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  HWFA — Hydraulic Work-Factor & Thermodynamic Audit (Engins de Terrassement)
                </h4>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                <strong>Angle Mort Industriel Neutralisé :</strong> Fraude aux heures de location d&apos;engins BTP facturées 8 000 à 15 000 DZD/heure alors que la machine tourne au ralenti accéléré sans creuser. Samsara et Geotab ne mesurent que les heures de contact clés (Engine Running Hours).
              </p>

              <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Équation Déterministe de Puissance Hydraulique Utile (0 Capteur Rapporté)
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
                  <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Validation Heure Terrassement :</strong>
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
                <IconShieldCheck size={20} className="text-cyan-500" />
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
                <IconAlertOctagon size={20} className="text-amber-500" />
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
                <IconActivity size={20} className="text-rose-500" />
                <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  BEP-VCO — Boiling-Enthalpy-Phase & Cavitation Observer (Grand Sud & Hauts-Plateaux)
                </h4>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                <strong>Angle Mort Industriel Neutralisé :</strong> Joint de culasse claqué et moteur coulé sur les cols algériens par 45°C. 
                Une sonde de température classique immergée dans de la vapeur (cavitation) indique une température FAUSSEMENT BASSE (85°C au lieu de 120°C). 
                Quand le voyant rouge s&apos;allume, la culasse est déjà irrémédiablement déformée.
              </p>

              <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Déphasage Thermique Huile / Eau & Équation d&apos;Euler-Antoine
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10b981', lineHeight: 1.6, marginBottom: '10px' }}>
                  τ_déphasage = C_thermique_bloc / h_convection · S  |  T_sat(P_bouchon) = B / [ A - log10(P_circuit + P_baro(Z_GNSS)) ] - C <br />
                  Indice_Ébullition = (T_coolant_out - T_sat) / ΔT_critique
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                  <strong>Vecteur J1939 :</strong> PGN 65262 (SPN 110 Temp Eau, SPN 175 Temp Huile), PGN 65269 (SPN 108 Pression Barométrique), Profil Topographique Valhalla.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Prévention Coup de Feu Culasse :</strong>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                    Alerte 18 minutes AVANT ébullition sur col de montagne (RN1 Chiffa, Ghardaïa). Ordre au chauffeur de rétrograder d&apos;un rapport pour augmenter le débit de pompe à eau.
                  </div>
                </div>
                <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--df-status-ok)' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--df-text-main)' }}>Sauvegarde Moteur :</strong>
                  <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)', marginTop: '4px' }}>
                    Évite 2 400 000 DZD de réfection moteur complète + 45 000 DZD de remorquage désertique lourd.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENU DE L'INNOVATION 5 : CSIS */}
          {selectedInnovation === 'CSIS' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <IconCheckCircle size={20} className="text-emerald-500" />
                <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                  CSIS — Crankshaft-Spectral In-Cylinder Signature (Common Rail & Injecteurs)
                </h4>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                <strong>Angle Mort Industriel Neutralisé :</strong> Grippage d&apos;injecteur haute pression dû au gasoil algérien chargé en soufre et eau. 
                Les chefs de parc n&apos;ont d&apos;autre choix que d&apos;immobiliser les camions chez un diéséliste pour passer les 6 injecteurs au banc (45 000 DZD d&apos;audit). 
                DocteurFlotte analyse les micro-accélérations angulaires du volant moteur via le PGN J1939 haute résolution.
              </p>

              <div style={{ background: 'var(--df-bg-surface-2)', border: '1px solid var(--df-border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--df-accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Décomposition Spectrale & Transformée de Fourier des Accélérations Angulaires
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#10b981', lineHeight: 1.6, marginBottom: '10px' }}>
                  α_vilebrequin(θ) = dω/dt = [ T_combustion,i(θ) - T_charge ] / J_équipage_mobile <br />
                  Énergie_Cylindre_i = ∫ (dω/dt)² · dθ  sur la plage [ TDC_i - 10° ; TDC_i + 50° ]
                </div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                  <strong>Vecteur J1939 :</strong> PGN 61444 (SPN 190 RPM 10 ms), PGN 65214 (Équilibrage cylindre par cylindre si exposé par l&apos;ECU moteur Bosch/Delphi).
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
              <IconShieldCheck size={16} className="inline mr-1 text-emerald-500" /> Rappel des Innovations Algérie-First Déjà Opérationnelles en Base
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
              <IconZap size={14} className="inline mr-1 text-emerald-400" /> <span>Tester les 5 Modèles en Live dans le Cockpit 5.0 &rarr;</span>
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
          <IconSparkles size={24} className="text-cyan-400" />
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
              <IconFileText size={18} className="text-indigo-400" />
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
              <IconCreditCard size={18} className="text-emerald-400" />
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
              <IconFileText size={18} className="text-blue-400" />
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
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #ec4899' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IconSparkles size={18} className="text-pink-400" />
              <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                4. Assistant Vocal d&apos;Atelier Darja Phonétique
              </h4>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Reconnaissance déterministe sous 50 ms des requêtes dialectales des mécaniciens (<em>« choufli zit el moteur »</em>, <em>« aatini l&apos;batterie »</em>, <em>« serrage culasse shacman »</em>).
              Bypass instantané du LLM sans hallucination pour une réponse sécurisée sur le couple de serrage et la viscosité exacte.
            </p>
          </div>

          {/* Pilier 5 */}
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IconActivity size={18} className="text-purple-400" />
              <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                5. Daemon Anti-Echo Storm 72h
              </h4>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Empêche la fatigue décisionnelle et le spam d&apos;alertes.
              Si une anomalie récurrente (ex: batterie faible à 11.8V) fait déjà l&apos;objet d&apos;un Ordre de Travail en cours, le daemon absorbe les occurrences suivantes pendant 72 heures sans spammer l&apos;écran du chef de parc.
            </p>
          </div>

          {/* Pilier 6 */}
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IconShieldCheck size={18} className="text-cyan-400" />
              <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                6. Guardrails Éthiques & Anti-Hallucination
              </h4>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Double vérification systématique de cohérence : l&apos;IA est bridée par des règles physiques strictes.
              Elle ne peut en aucun cas recommander une huile non homologuée par le constructeur ou valider un niveau de liquide contradictoire avec les équations de masse thermique.
            </p>
          </div>

          {/* Pilier 7 */}
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #14b8a6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IconCheckCircle size={18} className="text-teal-400" />
              <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--df-text-main)', margin: 0 }}>
                7. Observabilité en Temps Réel & Auto-Correction
              </h4>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Surveillance continue de la latence d&apos;inférence, de la consommation CPU locale et de l&apos;exactitude des réponses.
              Chaque rejet d&apos;ordre par un chef de parc ré-entraîne les poids de priorisation du moteur pour coller aux spécificités de votre exploitation.
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
            Coupe-Feu Loi 18-07 (ANPDP) & Dual-Engine Fail-Safe
          </h3>
          <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--df-text-secondary)', marginBottom: '16px' }}>
            Aucune donnée à caractère personnel ne pénètre dans le modèle. Avant chaque inférence, un filtre d&apos;expression régulière inspecte et purge les données sensibles :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div style={{ background: 'var(--df-bg-surface-2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--df-accent-blue)' }}>
              <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Plaques d&apos;Immatriculation DZ</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginTop: '4px' }}>
                <code>01492-319-16</code> &rarr; <code>[MATRICULE_ANONYMISE]</code>
              </div>
            </div>
            <div style={{ background: 'var(--df-bg-surface-2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Téléphones Algériens</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginTop: '4px' }}>
                <code>+213 550 12 34 56</code> &rarr; <code>[TEL_ANONYMISE]</code>
              </div>
            </div>
            <div style={{ background: 'var(--df-bg-surface-2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>Numéro d&apos;Identification National (NIN)</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginTop: '4px' }}>
                <code>18 chiffres d&apos;état-civil</code> &rarr; <code>[NIN_ANONYMISE]</code>
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
              <IconZap size={14} className="text-amber-400 inline" />
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
              <IconSearch size={14} className="text-cyan-400 inline" />
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
          <IconRadio size={24} className="text-emerald-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            7. Jumeau Numérique (Digital Twin) & Modélisation Multi-Climats 58 Wilayas
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          Chaque véhicule possède une réplique virtuelle paramétrique calculant la Durée de Vie Résiduelle (RUL) 
          des sous-systèmes selon la zone d&apos;exploitation géographique :
        </p>

        {/* Climate Zone Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { key: 'TELL', label: 'Littoral & Tell (Humidité / Embouteillages)', icon: 'TELL', mult: 'x1.05' },
            { key: 'STEPPE', label: 'Hauts-Plateaux (Amplitude -5°C à 40°C)', icon: 'STEPPE', mult: 'x1.25' },
            { key: 'SAHARA', label: 'Grand Sud & Sahara (Chaleur 50°C / Poussière Silice)', icon: 'SAHARA', mult: 'x1.65' },
          ].map((c) => {
            const isSelected = selectedClimateZone === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedClimateZone(c.key as 'TELL' | 'STEPPE' | 'SAHARA')}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 1 (22%)</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#d97706', margin: '4px 0' }}>Huile Moteur (Arrhenius)</div>
              <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                {selectedClimateZone === 'SAHARA' ? 'Vidange à 7 500 km max (au lieu de 15 000 km constructeur) pour éviter le gommage des segments sous 48°C.' : 'Intervalles standards respectés avec surveillance d’acidification et de viscosité cinématique.'}
              </div>
            </div>

            <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 2 (18%)</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#059669', margin: '4px 0' }}>Batterie Démarrage (CVHI)</div>
              <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                {selectedClimateZone === 'SAHARA' ? 'Évaporation accélérée de l’électrolyte par chaleur ambiante. Tension minimale de démarrage < 9.60V alertée.' : 'Vérification continue de la tension au démarreur et du temps de recouvrement alternateur.'}
              </div>
            </div>

            <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 3 (15%)</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7', margin: '4px 0' }}>Système Freinage (Archard)</div>
              <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                {selectedClimateZone === 'STEPPE' ? 'Échauffement excessif dans les cols (Gorges de Palestro, Chiffa). Usure des plaquettes multipliée par 1.4 sur les descentes à forte pente.' : 'Usure liée aux arrêts urbains et à l’agressivité du conducteur en milieu urbain.'}
              </div>
            </div>

            <div style={{ background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)' }}>
              <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Composant 4 (15%)</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', margin: '4px 0' }}>Circuit de Refroidissement</div>
              <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
                {selectedClimateZone === 'SAHARA' ? 'Risque critique d’entartrage et cavitation de pompe à eau par ajout d’eau non déminéralisée en urgence. Déphasage ΔT surveillé en temps réel.' : 'Stabilité thermique surveillée lors des embouteillages d’Alger ou d’Oran.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href="/digital-twin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'var(--df-accent-blue)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>Accéder au Cockpit Jumeau Numérique 3D &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 8: TÉLÉMÉTRIE TERRAIN & MODULES ALGERIE-FIRST */}
      <section id="field-modules" style={{ scrollMarginTop: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <IconActivity size={24} className="text-cyan-400" />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            8. Télémétrie Terrain &amp; 5 Modules Stratégiques Algérie-First
          </h2>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
          Au-delà de la maintenance prédictive, DocteurFlotte résout les défis logistiques et administratifs spécifiques à l&apos;Algérie :
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--df-bg-surface-1)', border: '1px solid var(--df-border-subtle)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--df-shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <IconCreditCard size={20} className="text-emerald-500" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                Scanner OCR Naftal &amp; Détection d&apos;Anomalies
              </h3>
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                DVIR Mobile PWA Offline-First &amp; Verrou Critique
              </h3>
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                Dossier d&apos;Expertise Technique &amp; Export ERP 1-Clic
              </h3>
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                Cockpit MapLibre Souverain (58 Wilayas &amp; 4 Corridors)
              </h3>
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: 0 }}>
                Routeur Vocal Atelier en Darja Phonétique &amp; Base OEM
              </h3>
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
    </>
  );
}
