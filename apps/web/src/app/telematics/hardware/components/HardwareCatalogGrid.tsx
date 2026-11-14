import React from 'react';
import { IconSliders } from '@/components/navigation/TechIcons';
import type { DeviceItem } from '../types';

interface HardwareCatalogGridProps {
  devices: DeviceItem[];
  onSelectDevice: (device: DeviceItem) => void;
}

export function HardwareCatalogGrid({ devices, onSelectDevice }: HardwareCatalogGridProps) {
  if (devices.length === 0) {
    return (
      <div style={{ maxWidth: '1360px', margin: '24px auto', padding: '0 24px' }}>
        <div
          style={{
            background: 'var(--df-bg-surface-1)',
            border: '1px solid var(--df-border-subtle)',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--df-text-secondary)', fontSize: '15px', margin: 0 }}>
            Aucun matériel ou protocole ne correspond à vos critères de recherche.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '24px auto', padding: '0 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '20px',
        }}
      >
        {devices.map((device) => (
          <div
            key={device.id}
            style={{
              background: 'var(--df-bg-surface-1)',
              border: '1px solid var(--df-border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--df-shadow-sm)',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--df-border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              {/* Header Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--df-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {device.manufacturer}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '2px 0 0 0' }}>
                    {device.name}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background:
                      device.algeriaReadiness === 'EXCELLENT'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(56, 189, 248, 0.15)',
                    color: device.algeriaReadiness === 'EXCELLENT' ? '#34d399' : '#38bdf8',
                    border: `1px solid ${
                      device.algeriaReadiness === 'EXCELLENT' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'
                    }`,
                  }}
                >
                  {device.algeriaReadiness === 'EXCELLENT' ? 'Recommandé Algérie' : 'Compatible'}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.5 }}>
                {device.description}
              </div>

              {/* Ports & Protocol Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div
                  style={{
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#a5b4fc',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  Traccar : Port <strong>{device.traccarPort}</strong> ({device.traccarProtocol})
                </div>

                {device.flespiSupported && (
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      background: 'rgba(2, 132, 199, 0.12)',
                      color: '#7dd3fc',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    Flespi : <strong>{device.flespiDeviceType}</strong>
                  </div>
                )}
              </div>

              {/* Specs Highlights */}
              <div
                style={{
                  background: 'var(--df-bg-surface-2)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--df-text-muted)' }}>Alimentation :</span>
                  <strong style={{ color: 'var(--df-text-main)' }}>{device.specs.voltage}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--df-text-muted)' }}>Bus CAN :</span>
                  <strong style={{ color: '#38bdf8' }}>{device.canSupport.includes('J1939') ? 'Full J1939 / FMS' : 'OBD / Adaptateur'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--df-text-muted)' }}>Indice de protection :</span>
                  <strong style={{ color: 'var(--df-text-main)' }}>{device.specs.ipRating}</strong>
                </div>
              </div>

              {/* Recommended Algorithms Tags */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--df-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Algorithmes DocteurFlotte Débloqués :
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {device.recommendedAlgorithms.map((algo, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '10.5px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#cbd5e1',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {algo}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onSelectDevice(device)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <IconSliders size={14} />
              <span>Générer Configuration SMS / GPRS</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

