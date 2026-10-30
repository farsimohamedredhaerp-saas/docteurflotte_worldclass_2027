'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthClient } from '../../lib/api-auth';
import { PlatformAdminClient } from '../../lib/api-platform-admin';
import { PlatformOverviewKpis } from '@docteurflotte/contracts';

export default function AdminOverviewPage() {
  const [kpis, setKpis] = useState<PlatformOverviewKpis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = AuthClient.getSession();
    if (!session.token) {
      setError('Session manquante.');
      setIsLoading(false);
      return;
    }

    PlatformAdminClient.getOverview(session.token)
      .then((data) => {
        setKpis(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--df-text-muted)' }}>
        Chargement des métriques du Control Plane...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#fca5a5',
          fontSize: '14px',
        }}
      >
        ⚠️ Impossible de charger la vue d'ensemble : {error}
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
            Console d'Administration Globale DocteurFlotte
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--df-text-secondary)', margin: 0 }}>
            Supervision centrale SaaS, intégrité des 6 algorithmes physiques, barèmes nationaux et clusters IoT.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            PostgreSQL TimescaleDB Opérationnel (5434)
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Tenants */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
              Organisations SaaS
            </span>
            <span style={{ fontSize: '20px' }}>🏢</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '8px' }}>
            {kpis?.totalTenants ?? 0}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', display: 'flex', gap: '12px' }}>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{kpis?.activeTenants ?? 0} Actifs</span>
            <span>•</span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>{kpis?.trialTenants ?? 0} Essai</span>
          </div>
        </div>

        {/* Global Vehicles */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
              Flotte Globale Sous Contrat
            </span>
            <span style={{ fontSize: '20px' }}>🚗</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '8px' }}>
            {kpis?.totalVehicles ?? 0}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)' }}>
            Répartis sur l’ensemble des organisations clientes
          </div>
        </div>

        {/* Decision Engine Active Version */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase' }}>
              Moteur Décisionnel Actif
            </span>
            <span style={{ fontSize: '20px' }}>🧠</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#818cf8', marginBottom: '8px', wordBreak: 'break-all' }}>
            {kpis?.activeDecisionConfigVersion ?? 'v2.0-PROD-BASELINE'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--df-text-secondary)' }}>
            Scope : <strong style={{ color: 'var(--df-text-main)' }}>{kpis?.activeDecisionScope ?? 'ALGERIA_CORE_DECISION'}</strong>
          </div>
        </div>

        {/* Fiscal & Fuel Prices */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
              Barème Énergie & Fiscal
            </span>
            <span style={{ fontSize: '20px' }}>⛽</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--df-text-main)', marginBottom: '8px' }}>
            {kpis?.fuelPricesCount ?? 0}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)' }}>
            Tarifs officiels Naftal & barèmes ENACTA en vigueur
          </div>
        </div>

        {/* IoT Gateways */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
              Passerelles IoT
            </span>
            <span style={{ fontSize: '20px' }}>📡</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
            {kpis?.healthyGatewaysCount ?? 0} OK
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)' }}>
            Traccar Self-Hosted (8085) & Flespi Failover
          </div>
        </div>

        {/* Audit Log */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            boxShadow: 'var(--df-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--df-text-muted)', textTransform: 'uppercase' }}>
              Traçabilité & Audit
            </span>
            <span style={{ fontSize: '20px' }}>🛡️</span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '8px' }}>
            {kpis?.lastAuditAction ?? 'ACTIVATE_CONFIG'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--df-text-muted)' }}>
            {kpis?.lastAuditTimestamp ? new Date(kpis.lastAuditTimestamp).toLocaleString('fr-FR') : 'Audit actif'}
          </div>
        </div>
      </div>

      {/* Control Plane Fast Actions & Modules */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '16px' }}>
        Modules de Gouvernance & Pilotage
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <Link
          href="/admin/tenants"
          style={{
            display: 'block',
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
            Gestion des Tenants & Quotas
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
            Consultez les organisations abonnées, ajustez les quotas de véhicules/utilisateurs, modifiez le palier (Mode 0, Mode 1, Mode 2) et suspendez ou activez les accès.
          </div>
        </Link>

        <Link
          href="/admin/decision-engine"
          style={{
            display: 'block',
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🧠</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
            Moteur Décisionnel (6 Physiques)
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
            Paramétrez Arrhenius (huile), Cranking CVHI (batterie), EWMA (refroidissement), Archard (freins), FAP et CUSUM (anti-fraude carburant). Gérez les publications et rollbacks transactionnels.
          </div>
        </Link>

        <Link
          href="/admin/fiscal"
          style={{
            display: 'block',
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⛽</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
            Barèmes Fiscaux & Réglementaires
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
            Maintenez les prix des carburants Naftal officiels (avec traçabilité JORADP), les tranches de vignettes automobiles (Loi de Finances) et les périodicités de contrôle technique ENACTA.
          </div>
        </Link>

        <Link
          href="/admin/gateways"
          style={{
            display: 'block',
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📡</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
            Passerelles IoT & Supervision Traccar
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
            Supervisez le serveur télématique souverain Traccar (port 8085), les ports protocolaires Teltonika/GPS et la passerelle de secours Flespi (zéro donnée nominative transmise).
          </div>
        </Link>

        <Link
          href="/admin/audit"
          style={{
            display: 'block',
            padding: '24px',
            borderRadius: '14px',
            backgroundColor: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', marginBottom: '6px' }}>
            Piste d’Audit Immuable
          </div>
          <div style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.5 }}>
            Journal d'audit append-only avec chaînage cryptographique SHA-256 et déclencheur d'anti-altération. Visualisez chaque décision, mise à jour ou rollback.
          </div>
        </Link>
      </div>
    </div>
  );
}
