'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

import {
  IconTruck,
  IconWrench,
  IconBarChart3,
  IconActivity,
  IconSlidersHorizontal,
  IconShieldCheck,
  IconChevronDown,
  IconX,
} from './TechIcons';

interface SubFeature {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  isExternal?: boolean;
}

interface FeatureCategory {
  id: string;
  label: string;
  shortLabel?: string;
  iconNode: React.ReactNode;
  subfeatures: SubFeature[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: 'assets',
    label: 'Parc & Actifs',
    shortLabel: 'Parc',
    iconNode: <IconTruck size={14} strokeWidth={1.75} />,
    subfeatures: [
      {
        title: 'Inventaire des Actifs',
        desc: 'Poids lourds, engins BTP, véhicules légers et équipements industriels.',
        href: '/assets',
        badge: 'ACTIF',
      },
      {
        title: 'Compteurs & Métrologie',
        desc: 'Suivi kilométrique, heures moteur et cycles sans saut négatif.',
        href: '/assets',
        badge: 'ACTIF',
      },
      {
        title: 'Jumeau Numérique & RUL',
        desc: 'Modélisation physique en continu des 5 organes d’usure et simulation What-If.',
        href: '/digital-twin',
        badge: 'PHYSIQUE IA',
      },
      {
        title: 'Conducteurs & Affectations',
        desc: 'Missions opérationnelles, validité permis et attribution des cartes/clés.',
        href: '/drivers',
        badge: 'RH & PERMIS',
      },
      {
        title: 'Dispatch & Ordres de Mission (OM)',
        desc: 'Machine à états Gate DZ, restrictions 58 Wilayas et jetons QR cryptographiques HMAC-256.',
        href: '/dispatch',
        badge: 'OFFICIEL DZ',
      },
      {
        title: 'Référentiel & Scraper OEM RMI',
        desc: 'Extraction souveraine (Olyslager, AUTODOC, PDF) et décodage VIN Algérie.',
        href: '/oem-scraper',
        badge: 'OEM RMI',
      },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance 5.0',
    shortLabel: 'Maintenance',
    iconNode: <IconWrench size={14} strokeWidth={1.75} />,
    subfeatures: [
      {
        title: 'Maintenance 5.0 Cognitive & RUL',
        desc: 'Physique déterministe 0 DA, J1939/OBD, arbitrage financier DZD (SAD -> ADS) et RUL sous-systèmes.',
        href: '/maintenance',
        badge: 'MONOPOLE 5.0',
      },
      {
        title: 'Cockpit Maintenance 5.0 & Plans OEM',
        desc: '5 innovations de rupture 0 DA, usure saharienne et arbitrage financier prescriptif.',
        href: '/preventive',
        badge: 'MAINTENANCE 5.0',
      },
      {
        title: 'Ask DocteurFlotte (Copilote IA)',
        desc: 'Diagnostic conversationnel de panne, preuves physiques et arbitrage ADS.',
        href: '/copilot',
        badge: 'COPILOT IA',
      },
      {
        title: 'DVIR Inspection Numérique Mobile',
        desc: 'Contrôles avant départ et fin de tournée, conformité ENACTA et déclenchement d’OT.',
        href: '/dvir',
        badge: 'OFFLINE-FIRST',
      },
      {
        title: 'Ordres de Travail (OT)',
        desc: 'Gestion des interventions atelier, pièces et main d\'œuvre.',
        href: '/work-orders',
        badge: 'ACTIF',
      },
      {
        title: 'Conformité Réglementaire',
        desc: 'Contrôles techniques ENACTA, assurances et restrictions JORADP.',
        href: '/compliance',
        badge: 'ENACTA DZ',
      },
      {
        title: 'Tableau Décisionnel',
        desc: 'Arbitrages économiques explicables et boucle décision → action.',
        href: '/decisions',
        badge: 'ACTIF',
      },
    ],
  },
  {
    id: 'telematics',
    label: 'Télématique & IoT',
    shortLabel: 'Télématique',
    iconNode: <IconActivity size={14} strokeWidth={1.75} />,
    subfeatures: [
      {
        title: 'Live Cockpit & Télémétrie GIS',
        desc: 'Vue temps réel ultra-haute densité : carte vectorielle, double vitesse, jauges OBD-II/J1939 et console CAN brute.',
        href: '/live-cockpit',
        badge: 'COCKPIT GIS',
      },
      {
        title: 'Tactical HUD (Scanner Châssis)',
        desc: 'Inspection vectorielle Hard Sci-Fi : 6 gabarits (Tourisme à Articulé), 5 organes CAN/J1939 cliquables, VHI & RUL.',
        href: '/live-cockpit/hud',
        badge: 'TACTICAL HUD',
      },
      {
        title: 'Console Fleet Live & GPS',
        desc: 'Positionnement en temps réel, vitesse et contact via passerelle Traccar.',
        href: '/telematics',
        badge: 'TRACCAR LIVE',
      },
      {
        title: 'Scanner Naftal & Anti-Fraude',
        desc: 'Extraction OCR des reçus de carburant et certification jauge Traccar.',
        href: '/fuel-scanner',
        badge: 'ANTI-FRAUDE',
      },
      {
        title: 'Éco-Conduite & Gaspillage Naftal',
        desc: 'Chasse au ralenti excessif, primes de conduite et valorisation financière selon le barème officiel.',
        href: '/eco-driving',
        badge: 'SAMSARA ECO',
      },
      {
        title: 'Chaîne du Froid & Groupes Frigo',
        desc: 'Télémétrie thermique Reefers (lait, viandes, vaccins) sous climat saharien.',
        href: '/cold-chain',
        badge: 'REEFER IOT',
      },
      {
        title: 'Matériels IoT & Protocoles',
        desc: 'Référentiel certifié des boîtiers Traccar & Flespi (Teltonika, Coban, Ruptela, Queclink, CAN J1939).',
        href: '/telematics/hardware',
        badge: 'CATALOGUE',
      },
    ],
  },
  {
    id: 'economics',
    label: 'Gestion & TCO',
    shortLabel: 'Gestion',
    iconNode: <IconBarChart3 size={14} strokeWidth={1.75} />,
    subfeatures: [
      {
        title: 'TCO & Coût au km / h',
        desc: 'Décomposition des coûts directs de possession et d\'usage.',
        href: '/tco',
        badge: 'ANALYTIQUE',
      },
      {
        title: 'Écarts Budgétaires',
        desc: 'Comparatif dépenses réelles vs budgets prévisionnels alloués.',
        href: '/decisions',
        badge: 'ACTIF',
      },
      {
        title: 'Coût du Risque d\'Inaction',
        desc: 'Calcul financier des pannes potentielles non traitées.',
        href: '/decisions',
        badge: 'ARBITRAGE ADS',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Paramètres',
    shortLabel: 'Paramètres',
    iconNode: <IconSlidersHorizontal size={14} strokeWidth={1.75} />,
    subfeatures: [
      {
        title: 'Configuration Tenant',
        desc: 'Seuils opérationnels, barèmes financiers et devise sans valeur en dur.',
        href: '/settings',
        badge: 'ZÉRO HARDCODE',
      },
      {
        title: 'Données & Purge Démo',
        desc: 'Bascule propre vers les données réelles et purge synthétique.',
        href: '/settings',
        badge: 'SOUVERAINETÉ',
      },
      {
        title: 'Abonnement & Facturation DGI',
        desc: 'Plan actif, décompte des véhicules roulants et factures proformas.',
        href: '/settings/subscription',
        badge: 'DZD',
      },
      {
        title: 'Assistant d\'Onboarding',
        desc: 'Configuration initiale guidée par étape d\'activation.',
        href: '/setup',
      },
    ],
  },
  {
    id: 'control-plane',
    label: 'Administration',
    shortLabel: 'Admin',
    iconNode: <IconShieldCheck size={14} strokeWidth={1.75} />,
    subfeatures: [
      {
        title: 'Console SuperAdmin',
        desc: 'Pilotage global du SaaS, quotas tenants et métriques de la plateforme.',
        href: '/admin',
        badge: 'SUPERADMIN',
      },
      {
        title: 'Surveillance IA Souveraine (Ollama / Qwen)',
        desc: 'Console d’observabilité en temps réel, télémétrie GPU/CPU, buffer d’audit Loi 18-07 et test d’inférence.',
        href: '/admin/ai-observability',
        badge: 'QWEN 2.5 LIVE',
      },
      {
        title: 'Organisations & Tenants',
        desc: 'Gestion des quotas, statuts et attribution des modes d\'exploitation 0/1/2.',
        href: '/admin/tenants',
      },
      {
        title: 'Moteur Décisionnel (6 Physiques)',
        desc: 'Gouvernance des 6 algorithmes physiques déterministes et rollbacks immuables.',
        href: '/admin/decision-engine',
        badge: 'v2.0 REVISED',
      },
      {
        title: 'Barèmes Fiscaux & Naftal',
        desc: 'Prix des carburants 2026, vignettes LF 2025 et périodicités ENACTA.',
        href: '/admin/fiscal',
      },
      {
        title: 'Passerelles Télématiques',
        desc: 'Supervision Traccar Souverain (port 8085) et bascule Flespi sans PII.',
        href: '/admin/gateways',
      },
      {
        title: 'Piste d’Audit Immuable',
        desc: 'Journal append-only avec chaînage SHA-256 et déclencheur anti-tampering.',
        href: '/admin/audit',
      },
      {
        title: 'Guide d’Architecture & Fonctionnement',
        desc: 'Documentation intégrale du SaaS : 3 modes, 6 algorithmes physiques, RLS et Loi 18-07.',
        href: '/guide',
        badge: 'GUIDE v2.0',
      },
    ],
  },
];

export function NavFeaturesMenu() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav ref={menuRef} style={{ position: 'relative' }} aria-label="Navigation principale">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'var(--df-bg-surface-2)',
          padding: '0.25rem 0.35rem',
          borderRadius: 'var(--df-radius-md)',
          border: '1px solid var(--df-border-subtle)',
        }}
      >
        {FEATURE_CATEGORIES.map((cat) => {
          const isOpen = activeMenu === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveMenu(isOpen ? null : cat.id)}
              type="button"
              aria-expanded={isOpen}
              title={cat.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.28rem',
                padding: '0.24rem 0.50rem',
                borderRadius: 'var(--df-radius-sm)',
                background: isOpen ? 'var(--df-bg-surface-3)' : 'transparent',
                color: isOpen ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: isOpen ? 700 : 600,
                transition: 'all var(--df-transition-fast)',
                outline: 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isOpen) {
                  e.currentTarget.style.color = 'var(--df-text-main)';
                  e.currentTarget.style.background = 'var(--df-bg-surface-3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isOpen) {
                  e.currentTarget.style.color = 'var(--df-text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ display: 'flex', color: 'var(--df-accent-blue)' }}>{cat.iconNode}</span>
              <span className="hidden 2xl:inline">{cat.label}</span>
              <span className="inline 2xl:hidden">{cat.shortLabel || cat.label}</span>
              <span
                style={{
                  display: 'flex',
                  transition: 'transform var(--df-transition-fast)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  opacity: 0.6,
                }}
              >
                <IconChevronDown size={11} strokeWidth={2} />
              </span>
            </button>
          );
        })}
      </div>

      {/* PANNEAU DÉROULANT (MEGAMENU CONTEXTUEL LARGE À 2 COLONNES) */}
      {activeMenu && (
        <div
          role="region"
          aria-label="Sous-menu détaillé"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 'min(640px, calc(100vw - 2rem))',
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-focus)',
            borderRadius: 'var(--df-radius-lg)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--df-border-subtle)',
            padding: '1.25rem',
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          {(() => {
            const cat = FEATURE_CATEGORIES.find((c) => c.id === activeMenu);
            if (!cat) return null;

            return (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--df-border-subtle)',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'flex', color: 'var(--df-accent-blue)' }}>{cat.iconNode}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--df-text-main)' }}>
                      {cat.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveMenu(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--df-text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <IconX size={14} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: cat.subfeatures.length > 2 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
                    gap: '0.5rem',
                    maxHeight: 'min(500px, calc(100vh - 120px))',
                    overflowY: 'auto',
                    paddingRight: '0.2rem',
                  }}
                >
                  {cat.subfeatures.map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setActiveMenu(null)}
                      style={{
                        display: 'block',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--df-radius-md)',
                        background: 'var(--df-bg-surface-2)',
                        border: '1px solid transparent',
                        textDecoration: 'none',
                        transition: 'all var(--df-transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--df-border-focus)';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--df-text-main)' }}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--df-radius-full)',
                              background: 'var(--df-accent-blue-subtle)',
                              color: 'var(--df-accent-blue)',
                              border: '1px solid var(--df-border-subtle)',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {item.desc}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </nav>
  );
}
