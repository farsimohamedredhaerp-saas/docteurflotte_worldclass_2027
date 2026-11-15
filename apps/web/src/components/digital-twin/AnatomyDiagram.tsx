import React from 'react';
import { DigitalTwinOrganStatus } from '@docteurflotte/contracts';
import { Droplet, Zap, Disc, Thermometer, Filter, Cog, Activity } from 'lucide-react';
import { getChassisTemplate, HOTSPOT_DIMENSIONS } from './anatomy-config';
import { useI18n } from '../../lib/i18n';

function renderOrganIcon(name: string) {
  const iconProps = { className: 'w-3.5 h-3.5 shrink-0' };
  switch (name?.toLowerCase()) {
    case 'droplet':
      return <Droplet {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'disc':
      return <Disc {...iconProps} />;
    case 'thermometer':
      return <Thermometer {...iconProps} />;
    case 'filter':
      return <Filter {...iconProps} />;
    case 'cog':
      return <Cog {...iconProps} />;
    default:
      return <Activity {...iconProps} />;
  }
}

export interface AnatomyDiagramProps {
  organs: DigitalTwinOrganStatus[];
  activeOrganKey: string | null;
  category?: string;
  algorithmsSummary: string;
  specVersion: string;
  onSelectOrgan: (key: string) => void;
}

export const AnatomyDiagram: React.FC<AnatomyDiagramProps> = ({
  organs,
  activeOrganKey,
  category,
  algorithmsSummary,
  specVersion,
  onSelectOrgan,
}) => {
  const { t } = useI18n();
  const template = getChassisTemplate(category);

  // Filtrer les hotspots qui correspondent aux organes présents dans le jumeau
  const availableHotspots = template.hotspots.filter((hs) =>
    organs.some((o) => o.organ === hs.organKey)
  );

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(20, 29, 47, 0.9) 0%, rgba(12, 17, 29, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '28px',
      }}
    >
      {/* En-tête centré */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
          {t('digitalTwin.anatomy.title')}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          {t('digitalTwin.anatomy.subtitle')}
        </p>
      </div>

      {/* Boutons d'organes centrés */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {organs.map((organ) => {
          const isActive = activeOrganKey === organ.organ;
          return (
            <button
              key={organ.organ}
              onClick={() => onSelectOrgan(organ.organ)}
              style={{
                background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? '#38bdf8' : '#94a3b8',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              {renderOrganIcon(organ.icon)}
              <span>{organ.name.replace(/,/g, '').split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Schéma Anatomique SVG & Hotspots */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '260px',
          background: 'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.2) 0%, rgba(9, 13, 22, 0.8) 70%)',
          borderRadius: '16px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 8px',
          overflow: 'hidden',
        }}
      >
        <svg
          width={template.width}
          height={template.height}
          viewBox={template.viewBox}
          style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
        >
          {/* Chassis outline */}
          <rect
            x={template.outline.x}
            y={template.outline.y}
            width={template.outline.width}
            height={template.outline.height}
            rx={template.outline.rx}
            fill={template.outline.fill}
            stroke={template.outline.stroke}
            strokeWidth={template.outline.strokeWidth}
            strokeDasharray={template.outline.strokeDasharray}
          />

          {/* Cab section */}
          <rect
            x={template.cab.x}
            y={template.cab.y}
            width={template.cab.width}
            height={template.cab.height}
            rx={template.cab.rx}
            fill={template.cab.fill}
            stroke={template.cab.stroke}
            strokeWidth={template.cab.strokeWidth}
          />

          {/* Wheels */}
          {template.wheels.map((wheel, idx) => (
            <rect
              key={idx}
              x={wheel.x}
              y={wheel.y}
              width={wheel.width}
              height={wheel.height}
              rx={wheel.rx}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2"
            />
          ))}

          {/* Hotspots dynamiques configurables */}
          {availableHotspots.map((hs) => {
            const isSelected = activeOrganKey === hs.organKey;
            const r = isSelected ? HOTSPOT_DIMENSIONS.activeRadius : HOTSPOT_DIMENSIONS.inactiveRadius;
            return (
              <g
                key={hs.organKey}
                onClick={() => onSelectOrgan(hs.organKey)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={hs.x}
                  cy={hs.y}
                  r={r}
                  fill="rgba(30, 41, 59, 0.6)"
                  stroke={hs.color}
                  strokeWidth="2"
                  style={{ transition: 'r 0.2s ease, stroke-width 0.2s ease' }}
                />
                <text
                  x={hs.x}
                  y={hs.y + 3.5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="800"
                  fontFamily="monospace"
                  fill="#ffffff"
                  style={{ userSelect: 'none', letterSpacing: '0.04em' }}
                >
                  {hs.icon}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend indicator */}
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
          {t('digitalTwin.anatomy.legend', {
            count: organs.length,
            algorithms: algorithmsSummary,
            specVersion,
          })}
        </div>
      </div>
    </div>
  );
};
