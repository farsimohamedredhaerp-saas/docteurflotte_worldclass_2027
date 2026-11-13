import React from 'react';
import { ShieldCheck, Building2, Calendar, MapPin, Clock } from 'lucide-react';
import { TenantProfile } from '../types/client';

interface HeaderProps {
  tenant: TenantProfile;
  healthScore: number;
  openAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  tenant,
  healthScore,
  openAlertsCount,
}) => {
  return (
    <header
      style={{
        backgroundColor: '#070d1e',
        borderBottom: '1px solid #1e293b',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      {/* Identité Tenant */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#064e3b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #059669',
            color: '#34d399',
          }}
        >
          <Building2 size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              {tenant.companyName}
            </span>
            <span className="badge badge-info font-mono">
              NIF: {tenant.nif}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                color: '#94a3b8',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                border: '1px solid #334155',
              }}
            >
              RC: {tenant.rc}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.78rem',
              color: '#94a3b8',
              marginTop: '0.2rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={13} style={{ color: '#38bdf8' }} />
              Wilaya : {tenant.wilaya} ({tenant.wilayaCode})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} style={{ color: '#a78bfa' }} />
              Exercice : {tenant.fiscalYear}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={13} style={{ color: '#34d399' }} />
              {tenant.legalTimezone}
            </span>
          </div>
        </div>
      </div>

      {/* Badges de Statut & Santé */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Pack réglementaire actif */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '0.4rem 0.75rem',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pack Actif Scellé</div>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <ShieldCheck size={14} />
            {tenant.activePackId} (Ed25519)
          </div>
        </div>

        {/* Health Score */}
        <div
          style={{
            backgroundColor: healthScore >= 80 ? 'rgba(6, 78, 59, 0.3)' : 'rgba(153, 27, 27, 0.3)',
            border: `1px solid ${healthScore >= 80 ? '#059669' : '#dc2626'}`,
            borderRadius: '8px',
            padding: '0.4rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Santé Fiscale & SCF</div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: healthScore >= 80 ? '#34d399' : '#f87171',
                lineHeight: 1,
              }}
            >
              {healthScore}/100
            </div>
          </div>
          {openAlertsCount > 0 && (
            <span
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              {openAlertsCount} à examiner
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

