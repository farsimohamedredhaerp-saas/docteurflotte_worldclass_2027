'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthClient } from '../../../lib/api-auth';
import { PlatformAdminClient } from '../../../lib/api-platform-admin';
import { PlatformTelematicsGateway } from '@docteurflotte/contracts';
import { IconRadio, IconRefreshCw, IconCheck } from '../../../components/navigation/TechIcons';

export default function AdminGatewaysPage() {
  const [gateways, setGateways] = useState<PlatformTelematicsGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGateways = () => {
    const session = AuthClient.getSession();
    if (!session.token) return;

    setIsLoading(true);
    PlatformAdminClient.getGateways(session.token)
      .then((data) => {
        setGateways(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadGateways();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Passerelles Télématiques Souveraines & Supervision IoT
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Cluster Traccar auto-hébergé en Algérie, protocole Teltonika/GPS et bascule Flespi sans PII (Loi 18-07).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href="/telematics/hardware"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#818cf8',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <IconRadio size={14} />
            <span>Catalogue Matériels Compatibles</span>
          </Link>

          <button
            onClick={loadGateways}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-main)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualiser l'état
          </button>
        </div>
      </div>

      {/* Sovereign Notice Alert */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#93c5fd',
          lineHeight: 1.6,
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: '20px' }}>🇩🇿</span>
        <div>
          <strong>Garantie de Souveraineté & Respect Strict de la Loi 18-07 (ANPDP) :</strong> Le serveur Traccar principal est exécuté localement en conteneur souverain sur le port hôte <strong>8085</strong>. En cas de bascule de secours sur la passerelle cloud Flespi, le moteur garantit par construction cryptographique qu'<strong>aucune donnée nominative (nom de chauffeur, immatriculation, client)</strong> n'est transmise (seul le numéro IMEI matériel de télémétrie brute transite).
        </div>
      </div>

      {/* Gateways Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {gateways.map((gw) => (
          <div
            key={gw.id}
            style={{
              padding: '24px',
              borderRadius: '14px',
              backgroundColor: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              boxShadow: 'var(--df-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)' }}>{gw.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>Type : {gw.provider_type}</div>
              </div>

              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor:
                    gw.health_status === 'HEALTHY'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  color: gw.health_status === 'HEALTHY' ? '#34d399' : '#fca5a5',
                  border: `1px solid ${gw.health_status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                ● {gw.health_status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', background: 'var(--df-bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--df-border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Point de terminaison :</span>
                <strong style={{ color: 'var(--df-text-main)', fontFamily: 'monospace' }}>{gw.endpoint_url}:{gw.api_port}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Ports Protocolaires :</span>
                <strong style={{ color: '#38bdf8' }}>{gw.protocol_ports}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Latence réseau mesurée :</span>
                <strong style={{ color: gw.current_latency_ms < 50 ? '#34d399' : '#fbbf24' }}>
                  {gw.current_latency_ms} ms
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Capacité de traitement :</span>
                <strong style={{ color: 'var(--df-text-main)' }}>{gw.max_packets_per_sec} paquets / sec</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--df-text-muted)' }}>Dernier Heartbeat :</span>
                <span style={{ color: 'var(--df-text-secondary)', fontSize: '12px' }}>
                  {new Date(gw.last_heartbeat_at).toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: gw.is_active_gateway ? '#34d399' : 'var(--df-text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {gw.is_active_gateway ? (
                  <>
                    <IconCheck size={13} />
                    Passerelle Active par Défaut
                  </>
                ) : (
                  'Mode Secours (Failover)'
                )}
              </span>

              <a
                href={gw.endpoint_url.startsWith('http') ? `${gw.endpoint_url}:${gw.api_port}` : `http://${gw.endpoint_url}:${gw.api_port}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--df-accent-blue)',
                  textDecoration: 'none',
                }}
              >
                Ouvrir Console Web ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
