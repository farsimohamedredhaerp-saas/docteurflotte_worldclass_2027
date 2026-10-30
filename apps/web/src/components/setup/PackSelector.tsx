import React from 'react';
import { ActivityPack } from '@docteurflotte/contracts';

interface PackOption {
  id: ActivityPack;
  title: string;
  badge: string;
  desc: string;
  metrics: string[];
}

const PACKS: PackOption[] = [
  {
    id: ActivityPack.TRANSPORT,
    title: 'Transport Routier & Poids Lourds',
    badge: 'Logistique',
    desc: 'Flottes de camions, tracteurs routiers, semi-remorques et livraison fret.',
    metrics: ['Compteurs kilométriques (km)', 'Suivi du TCO / km', 'Vidanges & pneumatiques'],
  },
  {
    id: ActivityPack.CONSTRUCTION,
    title: 'BTP & Engins de Chantier',
    badge: 'Chantier',
    desc: 'Pelleteuses, chargeuses, niveleuses, dumpers et engins de génie civil.',
    metrics: ['Heures moteur réelles', 'Cycles de graissage hydraulique', 'Alertes surchauffe'],
  },
  {
    id: ActivityPack.LIGHT_VEHICLES,
    title: 'Véhicules Légers & Utilitaires',
    badge: 'Flotte Commerciale',
    desc: 'Voitures de société, utilitaires de techniciens, navettes d’entreprise.',
    metrics: ['Calendrier de révision', 'Contrôles périodiques', 'Consommation carburant'],
  },
  {
    id: ActivityPack.CUSTOM,
    title: 'Mixte & Équipements Industriels',
    badge: 'Multi-Métier',
    desc: 'Parcs hétérogènes combinant engins fixes, groupes électrogènes et véhicules.',
    metrics: ['Compteurs hybrides (km / h)', 'Plans de maintenance sur-mesure'],
  },
];

interface Props {
  selected: ActivityPack;
  onSelect: (pack: ActivityPack) => void;
}

export const PackSelector: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
      {PACKS.map((pack) => {
        const isSelected = selected === pack.id;
        return (
          <div
            key={pack.id}
            onClick={() => onSelect(pack.id)}
            style={{
              padding: '20px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              backgroundColor: isSelected ? 'var(--df-bg-surface-3)' : 'var(--df-bg-surface-1)',
              border: isSelected ? '2px solid var(--df-accent-cyan)' : '1px solid var(--df-border-subtle)',
              boxShadow: isSelected ? '0 0 20px rgba(6, 182, 212, 0.25)' : 'none',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--df-accent-cyan)',
                  letterSpacing: '0.5px',
                }}
              >
                {pack.badge}
              </span>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isSelected ? '5px solid var(--df-accent-cyan)' : '2px solid var(--df-border-subtle)',
                  backgroundColor: isSelected ? '#ffffff' : 'transparent',
                }}
              />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--df-text-main)', margin: '0 0 6px 0' }}>
              {pack.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--df-text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
              {pack.desc}
            </p>
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
              {pack.metrics.map((m, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--df-text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--df-accent-cyan)', fontSize: '10px' }}>▸</span>
                  {m}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
