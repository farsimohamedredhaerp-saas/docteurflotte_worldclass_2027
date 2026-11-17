'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconTerminal,
  IconWrench,
  IconTruck,
  IconFuel,
  IconCpu,
  IconActivity,
  IconLayers,
  IconShieldCheck,
  IconCompass,
  IconX,
} from './TechIcons';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'DIAGNOSTIC' | 'VEHICLE' | 'ACTION';
  title: string;
  subtitle: string;
  code?: string;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  // Navigation Rapide
  {
    id: 'cmd-nav-dashboard',
    category: 'NAVIGATION',
    title: 'Dashboard Exécutif & Arbitrage DZD',
    subtitle: 'Vue d\'ensemble, ROI préventif et décisions prioritaires',
    code: 'G D',
    href: '/',
  },
  {
    id: 'cmd-nav-assets',
    category: 'NAVIGATION',
    title: 'Inventaire Flotte & Actifs Haute Densité',
    subtitle: 'Tableau des 58 Wilayas, odomètres, horamètres et VHI',
    code: 'G F',
    href: '/assets',
  },
  {
    id: 'cmd-nav-preventive',
    category: 'NAVIGATION',
    title: 'Cockpit Maintenance 5.0 (Arrhenius & Archard)',
    subtitle: 'Cinétique d\'oxydation huile, freins et seuils prédictifs',
    code: 'G P',
    href: '/preventive',
  },
  {
    id: 'cmd-nav-digital-twin',
    category: 'NAVIGATION',
    title: 'Jumeau Numérique des 6 Organes',
    subtitle: 'Modélisation physique temps réel sans capteur additionnel',
    code: 'G T',
    href: '/digital-twin',
  },
  {
    id: 'cmd-nav-live-cockpit',
    category: 'NAVIGATION',
    title: 'Télématique Directe CAN-bus & J1939',
    subtitle: 'Flux haute fréquence Traccar, trames SPN/FMI et régime moteur',
    code: 'G C',
    href: '/live-cockpit',
  },
  {
    id: 'cmd-nav-map',
    category: 'NAVIGATION',
    title: 'Cartographie Corridors & 58 Wilayas',
    subtitle: 'Fret national, RN1 Transsaharienne, A1 Est-Ouest MapLibre',
    code: 'G M',
    href: '/map',
  },
  {
    id: 'cmd-nav-fuel',
    category: 'NAVIGATION',
    title: 'Scanner Reçus Naftal & Anti-Fraude CUSUM',
    subtitle: 'Détection siphonnage au repos et réconciliation des pleins',
    code: 'G S',
    href: '/fuel-scanner',
  },
  {
    id: 'cmd-nav-work-orders',
    category: 'NAVIGATION',
    title: 'Ordres de Travail & Maintenance d\'Atelier',
    subtitle: 'Gestion des OT préventifs, curatifs et fiches d\'intervention',
    code: 'G W',
    href: '/work-orders',
  },
  {
    id: 'cmd-nav-cold-chain',
    category: 'NAVIGATION',
    title: 'Chaîne du Froid & Agrément Sanitaire',
    subtitle: 'Températures tri-zones, traçabilité pharmaceutique et agro',
    code: 'NAV /cold-chain',
    href: '/cold-chain',
  },
  {
    id: 'cmd-nav-dispatch',
    category: 'NAVIGATION',
    title: 'Dispatch Algorithmique & Tournées Fret',
    subtitle: 'Affectation chauffeurs, corridors pétroliers et permis ADR',
    code: 'NAV /dispatch',
    href: '/dispatch',
  },
  {
    id: 'cmd-nav-copilot',
    category: 'NAVIGATION',
    title: 'Copilote IA Souverain (Ollama Qwen 2.5)',
    subtitle: 'Assistant d\'atelier bilingue Français / Darja déterministe',
    code: 'NAV /copilot',
    href: '/copilot',
  },
  {
    id: 'cmd-nav-dvir',
    category: 'NAVIGATION',
    title: 'Inspections DVIR PWA Hors-Ligne',
    subtitle: 'Ronde de sécurité chauffeur avec photos et signature',
    code: 'NAV /dvir',
    href: '/dvir',
  },
  {
    id: 'cmd-nav-fiscal',
    category: 'NAVIGATION',
    title: 'Conformité Fiscale & Déclarations G50',
    subtitle: 'Tableau 9 liasse SCF, réintégrations IBS, TVA hybride et scellement SHA-256',
    code: 'NAV /fiscal',
    href: '/fiscal',
  },
  {
    id: 'cmd-nav-chantiers',
    category: 'NAVIGATION',
    title: 'Chantiers & Engins BTP',
    subtitle: 'Affectations, suivi horaire CAN J1939 et rentabilité par chantier',
    code: 'NAV /chantiers',
    href: '/chantiers',
  },
  {
    id: 'cmd-nav-rental',
    category: 'NAVIGATION',
    title: 'Location & Rental Flotte',
    subtitle: 'Contrats de mise à disposition, plannings, check-in/out et facturation DZD',
    code: 'NAV /rental',
    href: '/rental',
  },
  {
    id: 'cmd-nav-logistics',
    category: 'NAVIGATION',
    title: 'Logistique & POD (Lettres de Voiture)',
    subtitle: 'LVE Décret exécutif 03-223, preuves de livraison mobile et indicateurs OTIF',
    code: 'NAV /logistics',
    href: '/logistics',
  },
  {
    id: 'cmd-nav-claims-fines',
    category: 'NAVIGATION',
    title: 'Sinistres, Amendes & Assurances',
    subtitle: 'Constats d\'accidents, contraventions de police et dossiers d\'indemnisation',
    code: 'NAV /claims-fines',
    href: '/claims-fines',
  },
  {
    id: 'cmd-nav-parts',
    category: 'NAVIGATION',
    title: 'Stock Pièces & Approvisionnement',
    subtitle: 'Catalogue pièces d\'usure PDR, multi-dépôts Wilayas et commandes d\'achat',
    code: 'NAV /parts',
    href: '/parts',
  },
  {
    id: 'cmd-nav-tco',
    category: 'NAVIGATION',
    title: 'TCO & Rentabilité par Asset',
    subtitle: 'Décomposition des coûts directs, marges nettes et simulateur Réparation vs Remplacement',
    code: 'NAV /tco',
    href: '/tco',
  },

  // Diagnostics Techniques
  {
    id: 'cmd-dtc-spn110',
    category: 'DIAGNOSTIC',
    title: 'SPN 110 FMI 0 — Surchauffe Liquide Refroidissement',
    subtitle: 'Renault Trucks K480 (00421-116-16) — T°: 104.2°C (Seuil 102°C)',
    code: 'DTC #110',
    href: '/preventive',
  },
  {
    id: 'cmd-dtc-spn1087',
    category: 'DIAGNOSTIC',
    title: 'SPN 1087 FMI 1 — Pression Basse Circuit Freinage APS',
    subtitle: 'Mercedes Actros 3340 (01892-116-16) — Pression: 6.8 bar',
    code: 'DTC #1087',
    href: '/preventive',
  },
  {
    id: 'cmd-dtc-spn100',
    category: 'DIAGNOSTIC',
    title: 'SPN 100 FMI 1 — Pression Huile Moteur Basse',
    subtitle: 'Shacman X3000 (09124-118-23) — Pression: 1.2 bar sous charge',
    code: 'DTC #100',
    href: '/preventive',
  },

  // Véhicules Clés
  {
    id: 'cmd-vin-cat336',
    category: 'VEHICLE',
    title: 'CAT 336D2 L — Pelle Hydraulique BTP',
    subtitle: 'Chantier Hassi Messaoud — Horamètre: 6 420 h — RUL Pompe: 18h',
    code: 'VIN CAT0336D2KL8912',
    href: '/assets',
  },
  {
    id: 'cmd-vin-rt-k480',
    category: 'VEHICLE',
    title: 'Renault Trucks K480 6x4 Heavy — Tracteur PL',
    subtitle: 'Corridor RN1 Ghardaïa — Odomètre: 284 150 km — VHI: 88/100',
    code: 'VIN VF624GPA00004128',
    href: '/assets',
  },
  {
    id: 'cmd-vin-actros',
    category: 'VEHICLE',
    title: 'Mercedes-Benz Actros 3340 6x4 S — Tracteur PL',
    subtitle: 'Base Rouiba — Odomètre: 342 900 km — VHI: 62/100 (DTC Actif)',
    code: 'VIN WDB9634031L89214',
    href: '/assets',
  },

  // Actions Rapides
  {
    id: 'cmd-act-new-wo',
    category: 'ACTION',
    title: 'Créer un Ordre de Travail Prescriptif',
    subtitle: 'Émettre un OT d\'intervention avec chiffrage DZD immédiat',
    code: 'N',
    href: '/work-orders',
  },
  {
    id: 'cmd-act-scan-naftal',
    category: 'ACTION',
    title: 'Scanner un Reçu Carburant Naftal',
    subtitle: 'Traitement OCR haute précision et contrôle odométrique Valhalla',
    code: 'SCAN',
    href: '/fuel-scanner',
  },
];

export function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filtered = COMMANDS.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      (cmd.code && cmd.code.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        if (target.action) {
          target.action();
        } else if (target.href) {
          router.push(target.href);
        }
        onClose();
      }
    }
  };

  const getCategoryColor = (cat: CommandItem['category']) => {
    switch (cat) {
      case 'DIAGNOSTIC':
        return 'var(--df-status-danger)';
      case 'VEHICLE':
        return 'var(--df-accent-blue)';
      case 'ACTION':
        return 'var(--df-status-ok)';
      default:
        return 'var(--df-text-secondary)';
    }
  };

  const renderCategoryIcon = (cat: CommandItem['category']) => {
    switch (cat) {
      case 'DIAGNOSTIC':
        return <IconTerminal size={14} strokeWidth={1.75} />;
      case 'VEHICLE':
        return <IconTruck size={14} strokeWidth={1.75} />;
      case 'ACTION':
        return <IconWrench size={14} strokeWidth={1.75} />;
      default:
        return <IconCompass size={14} strokeWidth={1.75} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--df-z-command, 600)',
        background: 'rgba(5, 7, 10, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '680px',
          maxWidth: '92vw',
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: 'var(--df-radius-lg, 10px)',
          boxShadow: 'var(--df-shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Liseré supérieur biseauté */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'var(--df-border-card-top, #ffffff)',
            opacity: 0.12,
            pointerEvents: 'none',
          }}
        />

        {/* EN-TÊTE DE RECHERCHE */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--df-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--df-bg-surface-2)',
          }}
        >
          <span style={{ color: 'var(--df-text-muted)', display: 'flex' }}>
            <IconSearch size={16} strokeWidth={2} />
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Taper une commande, matricule, SPN, DTC, ou route..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--df-text-main)',
              fontSize: '13px',
              fontFamily: 'var(--df-font-sans)',
            }}
          />
          <span
            style={{
              fontSize: '10.5px',
              fontFamily: 'var(--df-font-mono)',
              color: 'var(--df-text-muted)',
              padding: '2px 6px',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: 'var(--df-radius-xs, 4px)',
              background: 'var(--df-bg-surface-1)',
            }}
          >
            ESC
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la palette"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--df-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
          >
            <IconX size={15} />
          </button>
        </div>

        {/* LISTE DES RÉSULTATS */}
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                color: 'var(--df-text-muted)',
                fontSize: '12px',
                fontFamily: 'var(--df-font-mono)',
              }}
            >
              Aucun résultat technique ne correspond à &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const catColor = getCategoryColor(item.category);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                    else if (item.href) router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--df-radius-sm, 6px)',
                    background: isSelected ? 'var(--df-accent-blue-subtle)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--df-accent-blue)' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'background var(--df-dur-fast, 120ms)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span style={{ color: catColor, display: 'flex', flexShrink: 0 }}>
                      {renderCategoryIcon(item.category)}
                    </span>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: isSelected ? 'var(--df-text-main)' : 'var(--df-text-secondary)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--df-text-muted)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {item.code && (
                    <span
                      style={{
                        fontFamily: 'var(--df-font-mono)',
                        fontSize: '10.5px',
                        color: isSelected ? 'var(--df-text-main)' : 'var(--df-text-muted)',
                        background: 'var(--df-bg-surface-2)',
                        border: '1px solid var(--df-border-subtle)',
                        borderRadius: 'var(--df-radius-xs, 4px)',
                        padding: '2px 6px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {item.code}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PIED DE COMMAND PALETTE */}
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--df-border-subtle)',
            background: 'var(--df-bg-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10.5px',
            color: 'var(--df-text-muted)',
            fontFamily: 'var(--df-font-mono)',
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>↑↓ Naviguer</span>
            <span>↵ Exécuter</span>
            <span>ESC Quitter</span>
          </div>
          <span>SOUVERAINETÉ ALGÉRIE • LOI 18-07 ANPDP</span>
        </div>
      </div>
    </div>
  );
}
