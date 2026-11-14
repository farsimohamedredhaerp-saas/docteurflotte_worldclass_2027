import React from 'react';
import Link from 'next/link';
import {
  IconExternalLink,
  IconRadio,
  IconNavigation,
} from '@/components/navigation/TechIcons';

export function HardwareHeroBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 1) 100%)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '44px 24px 36px',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
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
            Référentiel Matériel IoT & Protocoles Télématiques
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
            Cluster Traccar Local (Port 8085) + Flespi Failover (Zéro PII)
          </span>
          <a
            href="https://www.traccar.org/devices/"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#7dd3fc',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconExternalLink size={13} />
            <span>Source Officielle Traccar (2 175 Appareils • 266 Protocoles)</span>
          </a>
        </div>

        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            marginBottom: '14px',
            color: '#fff',
          }}
        >
          Matériels IoT & Boîtiers Compatibles Traccar & Flespi
        </h1>

        <p
          style={{
            fontSize: '15.5px',
            lineHeight: 1.6,
            color: '#94a3b8',
            maxWidth: '880px',
            marginBottom: '24px',
          }}
        >
          Guide d’appairage et catalogue certifié des traceurs GPS, sondes de carburant, balises BLE frigo et caméras vidéo IA. 
          DocteurFlotte prend en charge nativement <strong>les 2 175 modèles et 266 protocoles officiels de Traccar</strong> ainsi que le pont unifié <strong>Flespi</strong> sous conformité Loi 18-07.
        </p>

        {/* Verification Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            maxWidth: '840px',
            marginBottom: '24px',
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Appareils Traccar</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>2 175</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Protocoles Pris en Charge</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#a5b4fc' }}>266</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Modèles Teltonika</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>92+</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Modèles Queclink</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>101</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            href="/admin/gateways"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <IconRadio size={14} />
            <span>Supervision Passerelles Traccar/Flespi</span>
          </Link>

          <Link
            href="/telematics"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <IconNavigation size={14} />
            <span>Console Flotte en Temps Réel</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

