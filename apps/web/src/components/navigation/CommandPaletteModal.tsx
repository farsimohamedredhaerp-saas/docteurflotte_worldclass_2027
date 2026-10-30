'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconTerminal, IconWrench, IconTruck, IconFuel, IconCpu, IconX } from './TechIcons';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'DIAGNOSTIC' | 'VEHICLE' | 'ACTION';
  title: string;
  subtitle: string;
  code?: string;
  href?: string;
  action?: () => void;
}

const COMMANDS: CommandItem[] = [
  {
    id: 'cmd-maint-rul',
    category: 'NAVIGATION',
    title: 'Santé Prédictive & Matrice RUL',
    subtitle: 'Consulter l’état d’usure physique Weibull / Arrhenius',
    code: 'NAV /maint/rul',
    href: '/maintenance',
  },
  {
    id: 'cmd-maint-can',
    category: 'NAVIGATION',
    title: 'Diagnostic Télématique CAN-bus & J1939',
    subtitle: 'Inspecter les trames .dbc, DM1 et codes défauts en direct',
    code: 'NAV /maint/can',
    href: '/maintenance',
  },
  {
    id: 'cmd-fleet-assets',
    category: 'NAVIGATION',
    title: 'Inventaire Flotte & Engins BTP',
    subtitle: 'Accéder aux 320 fiches techniques, horamètres et VIN',
    code: 'NAV /assets',
    href: '/assets',
  },
  {
    id: 'cmd-fuel-cusum',
    category: 'NAVIGATION',
    title: 'Carburant : Détection Siphonnage CUSUM',
    subtitle: 'Vérifier les alertes de chute de niveau de carburant au repos',
    code: 'NAV /fuel',
    href: '/fuel-scanner',
  },
  {
    id: 'cmd-decisions-arbitrage',
    category: 'NAVIGATION',
    title: 'Système d’Aide à la Décision (SAD / ADS)',
    subtitle: 'Arbitrage coût d’action vs risque d’inaction',
    code: 'NAV /decisions',
    href: '/decisions',
  },
  {
    id: 'cmd-dtc-spn110',
    category: 'DIAGNOSTIC',
    title: 'SPN 110 FMI 0 — Surchauffe Liquide Refroidissement',
    subtitle: 'Renault Trucks K480 (00421-16-16) — Temp: 104.2°C (Seuil 102°C)',
    code: 'DTC #110',
    href: '/maintenance',
  },
  {
    id: 'cmd-dtc-spn1087',
    category: 'DIAGNOSTIC',
    title: 'SPN 1087 FMI 1 — Pression Basse Circuit Freinage APS',
    subtitle: 'Mercedes Actros 3340 (01892-16-16) — Pression: 6.8 bar',
    code: 'DTC #1087',
    href: '/maintenance',
  },
  {
    id: 'cmd-vin-cat336',
    category: 'VEHICLE',
    title: 'CAT 336D2 L — Pelle Hydraulique BTP',
    subtitle: 'Chantier Hassi Messaoud — Horamètre: 6 420 h — RUL Pompe: 18h',
    code: 'VIN CAT0336D2KL8912',
    href: '/maintenance',
  },
  {
    id: 'cmd-vin-rt-k480',
    category: 'VEHICLE',
    title: 'Renault Trucks K480 6x4 Heavy — Tracteur PL',
    subtitle: 'Direction Logistique Alger — Kilométrage: 284 150 km — VHI: 78/100',
    code: 'VIN VF624GPA00004128',
    href: '/maintenance',
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 10, 0.78)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '640px',
          maxWidth: '92vw',
          background: '#111317',
          border: '1px solid #343A46',
          borderRadius: '4px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* EN-TÊTE DE RECHERCHE */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid #23272F',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#0D0F12',
          }}
        >
          <span style={{ color: '#9CA3AF', display: 'flex' }}>
            <IconSearch size={16} />
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Taper un mot-clé (SPN, DTC, VIN, Renault, Weibull, Naftal)..."
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
              color: '#F3F4F6',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#6B7280',
              padding: '2px 6px',
              border: '1px solid #23272F',
              borderRadius: '2px',
              background: '#090A0C',
            }}
          >
            ESC pour fermer
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
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
            maxHeight: '380px',
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
                padding: '32px 16px',
                textAlign: 'center',
                color: '#6B7280',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Aucun résultat technique ne correspond à &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
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
                    padding: '8px 10px',
                    borderRadius: '2px',
                    background: isSelected ? '#181B20' : 'transparent',
                    border: isSelected ? '1px solid #343A46' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span
                      style={{
                        color:
                          item.category === 'DIAGNOSTIC'
                            ? '#EF4444'
                            : item.category === 'VEHICLE'
                            ? '#2563EB'
                            : '#9CA3AF',
                        display: 'flex',
                      }}
                    >
                      {item.category === 'DIAGNOSTIC' ? (
                        <IconTerminal size={14} />
                      ) : item.category === 'VEHICLE' ? (
                        <IconTruck size={14} />
                      ) : (
                        <IconWrench size={14} />
                      )}
                    </span>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: isSelected ? '#FFFFFF' : '#E5E7EB',
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
                          color: '#6B7280',
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
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        color: isSelected ? '#F3F4F6' : '#9CA3AF',
                        background: '#090A0C',
                        border: '1px solid #23272F',
                        borderRadius: '2px',
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
            padding: '8px 12px',
            borderTop: '1px solid #23272F',
            background: '#090A0C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10.5px',
            color: '#6B7280',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>↑↓ Naviguer</span>
            <span>↵ Exécuter</span>
            <span>ESC Quitter</span>
          </div>
          <span>MISSION CRITICAL v2.0 • ANPDP 18-07 COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}
