'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ORGANIZATION_SITES,
  type OrganizationSiteOption,
  NAVIGATION_MODULES,
  type NavigationModuleId,
} from './navigationConfig';
import { DemoModeToggle } from './DemoModeToggle';
import {
  IconSearch,
  IconSun,
  IconMoon,
  IconChevronDown,
  IconCheckCircle,
  IconActivity,
  IconTruck,
  IconWrench,
  IconFuel,
  IconBarChart3,
} from './TechIcons';

interface TopGlobalNavbarProps {
  activeModuleId?: NavigationModuleId;
  criticalAlertsCount?: number;
  onOpenCommandPalette?: () => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
}

export function TopGlobalNavbar({
  activeModuleId = 'maintenance',
  criticalAlertsCount = 3,
  onOpenCommandPalette,
  isLightMode = false,
  onToggleTheme,
}: TopGlobalNavbarProps) {
  const pathname = usePathname();
  const [selectedSite, setSelectedSite] = useState<OrganizationSiteOption>(ORGANIZATION_SITES[0]);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Détection du module actif à partir du pathname si non forcé
  const currentModuleKey: NavigationModuleId = activeModuleId || (
    pathname?.startsWith('/assets')
      ? 'fleet'
      : pathname?.startsWith('/maintenance')
      ? 'maintenance'
      : pathname?.startsWith('/fuel-scanner')
      ? 'fuel'
      : pathname?.startsWith('/decisions')
      ? 'decisions'
      : 'operations'
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setUtcTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSiteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navTabs: { id: NavigationModuleId; icon: React.ReactNode }[] = [
    { id: 'operations', icon: <IconActivity size={13} /> },
    { id: 'fleet', icon: <IconTruck size={13} /> },
    { id: 'maintenance', icon: <IconWrench size={13} /> },
    { id: 'fuel', icon: <IconFuel size={13} /> },
    { id: 'decisions', icon: <IconBarChart3 size={13} /> },
  ];

  return (
    <header
      style={{
        height: '48px',
        background: '#111317',
        borderBottom: '1px solid #23272F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* 1. SECTION GAUCHE : IDENTITÉ MONOCHROME & SÉLECTEUR DE SITE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* LOGO MINIMALISTE CHIRURGICAL */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#F3F4F6',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              background: '#181B20',
              border: '1px solid #343A46',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '11px',
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            DF
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: '12.5px',
                letterSpacing: '-0.02em',
                color: '#F3F4F6',
                lineHeight: 1.1,
              }}
            >
              DOCTEURFLOTTE
            </span>
            <span
              style={{
                fontSize: '9px',
                color: '#6B7280',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              COMMAND CENTER v2.0
            </span>
          </div>
        </Link>

        {/* SÉPARATEUR VERTICAL 1PX */}
        <div style={{ width: '1px', height: '20px', background: '#23272F' }} />

        {/* SÉLECTEUR D'ORGANISATION / SITE AVEC DROPDOWN */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
            style={{
              background: '#090A0C',
              border: '1px solid #23272F',
              borderRadius: '2px',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: '#E5E7EB',
              fontSize: '11.5px',
              fontFamily: "'Inter', sans-serif",
              height: '28px',
              transition: 'border-color 100ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#343A46')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#23272F')}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '1px',
                background: '#10B981',
              }}
            />
            <span
              style={{
                fontWeight: 600,
                maxWidth: '170px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {selectedSite.name}
            </span>
            <span
              style={{
                fontSize: '10px',
                color: '#6B7280',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              [{selectedSite.code}]
            </span>
            <span style={{ color: '#9CA3AF', display: 'flex' }}>
              <IconChevronDown size={12} />
            </span>
          </button>

          {/* MENU DÉROULANT DES SITES */}
          {siteDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '32px',
                left: 0,
                width: '290px',
                background: '#111317',
                border: '1px solid #343A46',
                borderRadius: '2px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                zIndex: 1000,
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{
                  padding: '6px 8px',
                  fontSize: '10px',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: "'JetBrains Mono', monospace",
                  borderBottom: '1px solid #23272F',
                  marginBottom: '2px',
                }}
              >
                Périmètre Opérationnel (Algérie)
              </div>
              {ORGANIZATION_SITES.map((site) => {
                const isCurrent = site.id === selectedSite.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => {
                      setSelectedSite(site);
                      setSiteDropdownOpen(false);
                    }}
                    style={{
                      background: isCurrent ? '#181B20' : 'transparent',
                      border: isCurrent ? '1px solid #343A46' : '1px solid transparent',
                      borderRadius: '2px',
                      padding: '6px 8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: isCurrent ? 600 : 500,
                          color: isCurrent ? '#FFFFFF' : '#E5E7EB',
                        }}
                      >
                        {site.name}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#6B7280',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {site.wilaya} • {site.code} • {site.activeFleetCount} engins
                      </div>
                    </div>
                    {site.alertCount > 0 && (
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontFamily: "'JetBrains Mono', monospace",
                          padding: '1px 5px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #EF4444',
                          color: '#EF4444',
                          borderRadius: '2px',
                          fontWeight: 700,
                        }}
                      >
                        {site.alertCount} DTC
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. SECTION CENTRALE : NAVIGATION GLOBALE DE NIVEAU 1 (ONGLETS NETS AVEC INDICATEUR 2PX) */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '100%',
        }}
      >
        {navTabs.map(({ id, icon }) => {
          const mod = NAVIGATION_MODULES[id];
          const isActive = currentModuleKey === id;
          return (
            <Link
              key={id}
              href={mod.href}
              style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '0 12px',
                textDecoration: 'none',
                fontSize: '12.5px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#FFFFFF' : '#9CA3AF',
                background: isActive ? '#181B20' : 'transparent',
                transition: 'color 100ms ease, background 100ms ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#E5E7EB';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#9CA3AF';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ display: 'flex', color: isActive ? '#2563EB' : '#6B7280' }}>
                {icon}
              </span>
              <span>{mod.label}</span>

              {/* INDICATEUR ACTIF INFÉRIEUR DE 2PX */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#2563EB',
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 3. SECTION DROITE : SYSTÈME, STATUT TÉLÉMESURE & CONTRÔLE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* STATUT TÉLÉMÉTRIE EN DIRECT (MQTT / TRACCAR) AVEC PASTILLE VERTE PULSANTE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 7px',
            background: '#090A0C',
            border: '1px solid #23272F',
            borderRadius: '2px',
            fontSize: '10.5px',
            fontFamily: "'JetBrains Mono', monospace",
            height: '26px',
          }}
          title="Traccar & Flespi Gateway Failover - Conforme Loi 18-07 sans PII"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 6px #10B981',
              animation: 'dfPulse 2s infinite ease-in-out',
            }}
          />
          <span style={{ fontWeight: 600, color: '#10B981' }}>MQTT: ONLINE</span>
          <span style={{ color: '#4B5563' }}>|</span>
          <span style={{ color: '#9CA3AF' }}>&lt; 18ms</span>
        </div>

        {/* INDICATEUR CAN-BUS STREAMING */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 7px',
            background: '#090A0C',
            border: '1px solid #23272F',
            borderRadius: '2px',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            height: '26px',
            color: '#9CA3AF',
          }}
          title="Trames CAN J1939 et DM1 décodées via .dbc"
        >
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2563EB' }} />
          <span>J1939 CAN</span>
        </div>

        {/* COMPTEUR D'ALERTES CRITIQUES (DTC / SEUIL) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 7px',
            background: criticalAlertsCount > 0 ? 'rgba(239, 68, 68, 0.12)' : '#090A0C',
            border: criticalAlertsCount > 0 ? '1px solid #EF4444' : '1px solid #23272F',
            borderRadius: '2px',
            fontSize: '10.5px',
            fontFamily: "'JetBrains Mono', monospace",
            height: '26px',
          }}
          title="Codes défauts actifs nécessitant intervention"
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: criticalAlertsCount > 0 ? '#EF4444' : '#6B7280',
            }}
          />
          <span
            style={{
              fontWeight: 700,
              color: criticalAlertsCount > 0 ? '#EF4444' : '#9CA3AF',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {criticalAlertsCount} DTC
          </span>
        </div>

        {/* DÉCLENCHEUR COMMAND PALETTE (CMD+K) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Ouvrir la Command Palette d'ingénierie (Cmd+K / Ctrl+K)"
          style={{
            background: '#090A0C',
            border: '1px solid #23272F',
            borderRadius: '2px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: '#9CA3AF',
            fontSize: '11px',
            height: '26px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <IconSearch size={12} />
          <span style={{ color: '#6B7280', fontSize: '10.5px' }}>Recherche...</span>
          <span
            style={{
              fontSize: '9.5px',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '1px 4px',
              background: '#181B20',
              border: '1px solid #23272F',
              borderRadius: '2px',
              color: '#9CA3AF',
            }}
          >
            ⌘K
          </span>
        </button>

        {/* COMMUTATEUR MODE DÉMO VS RÉEL */}
        <DemoModeToggle />

        {/* SWITCH DE THÈME (DARK OPS / LIGHT FIELD) */}
        <button
          type="button"
          onClick={onToggleTheme}
          suppressHydrationWarning
          title="Basculer Mode Sombre / Mode Terrain Lumineux"
          style={{
            background: '#181B20',
            border: '1px solid #23272F',
            borderRadius: '2px',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9CA3AF',
            padding: 0,
          }}
        >
          {isLightMode ? <IconSun size={13} /> : <IconMoon size={13} />}
        </button>

        {/* HORLOGE HAUTE PRÉCISION TABULAR-NUMS */}
        <div
          suppressHydrationWarning
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontVariantNumeric: 'tabular-nums',
            fontSize: '10.5px',
            color: '#9CA3AF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            lineHeight: 1.15,
            paddingLeft: '4px',
          }}
        >
          <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{localTime || '12:00:00'}</span>
          <span style={{ color: '#6B7280', fontSize: '9px' }}>{utcTime || '11:00:00 UTC'}</span>
        </div>
      </div>
    </header>
  );
}
