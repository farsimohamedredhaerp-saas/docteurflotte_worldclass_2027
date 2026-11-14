import React from 'react';
import { IconShieldCheck, IconZap } from '@/components/navigation/TechIcons';

export function SovereignDualGatewayBanner() {
  return (
    <div style={{ maxWidth: '1360px', margin: '24px auto 0', padding: '0 24px' }}>
      <div
        style={{
          background: 'var(--df-bg-surface-1)',
          border: '1px solid var(--df-border-subtle)',
          borderRadius: '14px',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <IconShieldCheck size={20} className="text-emerald-400" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              1. Traccar Auto-Hébergé : Passerelle Souveraine Principale (Défaut)
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Exécuté en conteneur Docker local sur le port <strong>8085</strong> (ports matériels dédiés : Teltonika 5027, Coban 5001, Concox 5023). 
            Toutes les trames télématiques sont ingérées <strong>directement sur le sol algérien</strong>, sans intermédiaire étranger, garantissant la conformité totale à la Loi 18-07.
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--df-border-subtle)', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <IconZap size={20} className="text-sky-400" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
              2. Flespi Cloud Failover : Passerelle de Secours à Zéro PII
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--df-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            En cas de coupure réseau ou d’indisponibilité du serveur local, le flux bascule automatiquement vers Flespi. 
            <strong>Règle ANPDP absolue :</strong> Flespi ne reçoit que l’IMEI matériel et les coordonnées GPS brutes. Zéro nom de chauffeur, zéro immatriculation, zéro donnée client.
          </p>
        </div>
      </div>
    </div>
  );
}

