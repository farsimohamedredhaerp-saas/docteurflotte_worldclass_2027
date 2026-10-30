'use client';

import React, { useEffect, useState } from 'react';
import { NodeSchemaItem, SeverityStatus } from './demoFallbackData';

export interface DiagnosticNodeOverlayProps {
  nodes: (NodeSchemaItem & { status: SeverityStatus })[];
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  visible?: boolean;
}

/**
 * DOCTEURFLOTTE — Overlay Dynamique des Noeuds de Diagnostic Châssis (GPU-Accelerated)
 * 
 * Sépare le calque interactif du calque statique pour éviter tout repaint global du SVG.
 * 1. Utilise drop-shadow CSS au lieu de filtres SVG lourds <feGaussianBlur>.
 * 2. Utilise willChange: 'transform, opacity' pour l'accélération matérielle GPU.
 * 3. Désactive l'animation CSS ping quand l'onglet est masqué pour 0% CPU en arrière-plan.
 */
export const DiagnosticNodeOverlay = React.memo(function DiagnosticNodeOverlay({
  nodes,
  selectedNodeId,
  onSelectNode,
  visible = true,
}: DiagnosticNodeOverlayProps) {
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVis = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  if (!visible) return null;

  return (
    <g className="diagnostic-nodes-overlay" style={{ willChange: 'transform, opacity' }}>
      {nodes.map((node) => {
        const isSelected = selectedNodeId === node.id;
        const color =
          node.status === 'critical'
            ? '#f43f5e'
            : node.status === 'warning'
            ? '#fbbf24'
            : '#34d399';

        const shouldAnimate =
          isTabVisible && (node.status === 'critical' || isSelected);

        return (
          <g
            key={node.id}
            className="cursor-pointer group select-none transition-transform duration-150"
            onClick={() => onSelectNode(node.id)}
            style={{
              filter: isSelected
                ? `drop-shadow(0 0 6px ${color}80)`
                : undefined,
            }}
          >
            {/* Ligne directrice vers le noeud */}
            <line
              x1={node.x}
              y1={node.y}
              x2={node.x > 180 ? 326 : 34}
              y2={node.y}
              stroke={color}
              strokeOpacity={isSelected ? '0.9' : '0.35'}
              strokeWidth={isSelected ? '1.5' : '1'}
              strokeDasharray={isSelected ? 'none' : '2 2'}
            />

            {/* Badge code de composant */}
            <rect
              x={node.x > 180 ? 302 : 12}
              y={node.y - 14}
              width="46"
              height="13"
              fill="#020617"
              stroke={color}
              strokeWidth={isSelected ? '1.3' : '0.8'}
              rx="1.5"
            />
            <text
              x={node.x > 180 ? 325 : 35}
              y={node.y - 5}
              textAnchor="middle"
              fill={color}
              fontSize="7.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {node.code}
            </text>

            {/* Pulsation critique GPU accélérée (désactivée si onglet en arrière-plan) */}
            {shouldAnimate && (
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? '18' : '14'}
                fill="none"
                stroke={color}
                strokeWidth="1.2"
                strokeOpacity="0.6"
                className="animate-ping origin-center"
              />
            )}

            {/* Point de connexion central */}
            <circle
              cx={node.x}
              cy={node.y}
              r={isSelected ? '11' : '8'}
              fill="#020617"
              fillOpacity="0.9"
              stroke={color}
              strokeWidth={isSelected ? '2' : '1.4'}
            />

            {isSelected && (
              <g stroke={color} strokeWidth="1.2">
                <line x1={node.x - 16} y1={node.y} x2={node.x - 11} y2={node.y} />
                <line x1={node.x + 11} y1={node.y} x2={node.x + 16} y2={node.y} />
                <line x1={node.x} y1={node.y - 16} x2={node.x} y2={node.y - 11} />
                <line x1={node.x} y1={node.y + 11} x2={node.x} y2={node.y + 16} />
              </g>
            )}

            <circle cx={node.x} cy={node.y} r="3.5" fill={color} />
          </g>
        );
      })}
    </g>
  );
});

