'use client';

import React from 'react';
import { cn } from '../../lib/utils/cn';

export type VehicleSilhouetteType =
  | 'TRACTOR_SEMI'     // Tracteur Routier Semi-Remorque (Renault Trucks K-Range / Mercedes Actros)
  | 'HEAVY_TIPPER_8X4' // Benne Lourde Chantier (Shacman F3000 / Sinotruk)
  | 'EXCAVATOR_BTP'    // Engin de Terrassement Chenillé (Caterpillar 320D)
  | 'VAN_LIGHT'        // Fourgon Utilitaire Messagerie (Renault Master)
  | 'PICKUP_4X4';      // Tout-Terrain Saharien (Toyota Hilux 4x4)

export interface VehicleSilhouetteProps {
  type?: VehicleSilhouetteType;
  brand?: string;
  model?: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  color?: string;
}

/**
 * Résolution automatique du profil de silhouette en fonction des métadonnées du véhicule
 */
export function resolveSilhouetteType(
  brand?: string,
  model?: string,
  category?: string
): VehicleSilhouetteType {
  const text = `${brand || ''} ${model || ''} ${category || ''}`.toLowerCase();

  if (text.includes('cat') || text.includes('caterpillar') || text.includes('pelle') || text.includes('excavator') || text.includes('komatsu') || text.includes('btp')) {
    return 'EXCAVATOR_BTP';
  }
  if (text.includes('shacman') || text.includes('sinotruk') || text.includes('howo') || text.includes('benne') || text.includes('tipper') || text.includes('8x4')) {
    return 'HEAVY_TIPPER_8X4';
  }
  if (text.includes('hilux') || text.includes('4x4') || text.includes('pick-up') || text.includes('pickup') || text.includes('d-max') || text.includes('toyota')) {
    return 'PICKUP_4X4';
  }
  if (text.includes('master') || text.includes('fourgon') || text.includes('vul') || text.includes('utilitaire') || text.includes('h350') || text.includes('van')) {
    return 'VAN_LIGHT';
  }
  // Par défaut : Tracteur routier lourd
  return 'TRACTOR_SEMI';
}

export function VehicleSilhouette({
  type,
  brand,
  model,
  category,
  size = 'md',
  className,
  color = 'currentColor',
}: VehicleSilhouetteProps) {
  const resolvedType = type || resolveSilhouetteType(brand, model, category);

  const sizeDimensions = {
    sm: { width: 48, height: 24 },
    md: { width: 72, height: 36 },
    lg: { width: 104, height: 52 },
    hero: { width: 160, height: 80 },
  }[size];

  const renderPath = () => {
    switch (resolvedType) {
      case 'EXCAVATOR_BTP':
        // Pelle Hydraulique Chenillée (CAT 320D)
        return (
          <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Chenille */}
            <rect x="10" y="28" width="40" height="7" rx="3.5" />
            <circle cx="16" cy="31.5" r="2" />
            <circle cx="25" cy="31.5" r="2" />
            <circle cx="34" cy="31.5" r="2" />
            <circle cx="43" cy="31.5" r="2" />
            {/* Cabine et corps */}
            <path d="M 16 28 L 16 16 L 36 16 L 38 28 Z" />
            <path d="M 24 16 L 24 23 L 34 23 L 35 16" />
            {/* Flèche et godet */}
            <path d="M 28 18 L 46 8 L 60 18 L 66 26" />
            <path d="M 60 22 L 67 24 L 64 28 Z" fill={color} fillOpacity="0.2" />
            {/* Contrepoids */}
            <rect x="11" y="19" width="5" height="8" rx="1" />
          </g>
        );

      case 'HEAVY_TIPPER_8X4':
        // Benne Lourde Chantier 8x4 (Shacman / Sinotruk)
        return (
          <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Roues 8x4 (4 essieux) */}
            <circle cx="14" cy="31" r="4" />
            <circle cx="25" cy="31" r="4" />
            <circle cx="53" cy="31" r="4" />
            <circle cx="63" cy="31" r="4" />
            {/* Châssis bas */}
            <line x1="8" y1="28" x2="68" y2="28" />
            {/* Cabine Shacman haute */}
            <path d="M 8 28 L 8 12 L 18 10 L 28 10 L 28 28" />
            {/* Vitre avant & latérale */}
            <path d="M 10 14 L 17 12 L 26 12 L 26 18 L 10 18 Z" fill={color} fillOpacity="0.15" />
            {/* Benne basculante arrière */}
            <path d="M 31 28 L 31 11 L 68 11 L 68 28 Z" />
            <line x1="31" y1="17" x2="68" y2="17" strokeDasharray="3 2" />
            {/* Visière de benne */}
            <path d="M 31 11 L 27 7 L 34 7 L 33 11" fill={color} fillOpacity="0.2" />
          </g>
        );

      case 'PICKUP_4X4':
        // Tout-Terrain Saharien 4x4 (Toyota Hilux)
        return (
          <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Roues 4x4 tout-terrain */}
            <circle cx="16" cy="30" r="4.5" />
            <circle cx="56" cy="30" r="4.5" />
            {/* Châssis rehaussé */}
            <line x1="8" y1="27" x2="64" y2="27" />
            {/* Pare-buffle saharien avant */}
            <path d="M 7 24 L 7 28 L 10 28" />
            {/* Capot, cabine double et benne */}
            <path d="M 9 24 L 18 23 L 26 15 L 44 15 L 46 22 L 64 22 L 64 27" />
            {/* Vitres teintées anti-reflet désert */}
            <path d="M 28 17 L 42 17 L 43 21 L 26 21 Z" fill={color} fillOpacity="0.25" />
            <line x1="35" y1="15" x2="35" y2="21" />
            {/* Arceau de benne saharien */}
            <path d="M 47 22 L 50 16 L 54 22" />
          </g>
        );

      case 'VAN_LIGHT':
        // Fourgon Utilitaire Messagerie (Renault Master)
        return (
          <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Roues */}
            <circle cx="16" cy="31" r="3.8" />
            <circle cx="56" cy="31" r="3.8" />
            {/* Châssis */}
            <line x1="8" y1="28" x2="66" y2="28" />
            {/* Caisse monocoque utilitaire */}
            <path d="M 8 28 L 8 22 L 15 15 L 24 13 L 66 13 L 66 28 Z" />
            {/* Pare-brise et vitre chauffeur */}
            <path d="M 16 17 L 24 15 L 24 21 L 12 21 Z" fill={color} fillOpacity="0.18" />
            {/* Porte latérale coulissante */}
            <line x1="38" y1="13" x2="38" y2="28" />
            <line x1="50" y1="13" x2="50" y2="28" strokeDasharray="2 2" />
          </g>
        );

      case 'TRACTOR_SEMI':
      default:
        // Tracteur Routier Semi-Remorque (Renault Trucks K-Range / Actros)
        return (
          <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Roues motrices et directionnelles */}
            <circle cx="16" cy="31" r="4.2" />
            <circle cx="52" cy="31" r="4.2" />
            <circle cx="62" cy="31" r="4.2" />
            {/* Châssis avec sellette d'attelage */}
            <line x1="8" y1="28" x2="68" y2="28" />
            <rect x="44" y="24" width="8" height="4" rx="1" fill={color} fillOpacity="0.3" />
            {/* Grande cabine couchette aérodynamique */}
            <path d="M 8 28 L 8 13 L 13 9 L 36 9 L 36 28" />
            {/* Pare-brise et vitre latérale */}
            <path d="M 10 15 L 14 11 L 28 11 L 28 19 L 10 19 Z" fill={color} fillOpacity="0.2" />
            {/* Déflecteur aérodynamique supérieur */}
            <path d="M 24 9 L 34 5 L 37 9" />
            {/* Échappement vertical saharien */}
            <line x1="38" y1="26" x2="38" y2="7" strokeWidth="2" />
          </g>
        );
    }
  };

  return (
    <div
      className={cn('inline-flex items-center justify-center shrink-0 select-none', className)}
      style={{ width: sizeDimensions.width, height: sizeDimensions.height }}
      aria-hidden="true"
      title={`${resolvedType}`}
    >
      <svg
        viewBox="0 0 74 38"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {renderPath()}
      </svg>
    </div>
  );
}

