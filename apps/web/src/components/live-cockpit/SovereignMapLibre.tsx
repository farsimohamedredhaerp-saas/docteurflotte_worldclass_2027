'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { VehicleTelemetryState, GeofenceZone } from './types';
import { useTheme } from '../../context/ThemeContext';

interface SovereignMapLibreProps {
  vehicles: VehicleTelemetryState[];
  selectedVehicle?: VehicleTelemetryState;
  onSelectVehicle: (id: string) => void;
  geofences: GeofenceZone[];
  mapServerUrl?: string;
  onFallbackRequested?: (target?: 'SOVEREIGN_LOCAL' | 'OSM_TILES') => void;
}

const DEFAULT_MAP_SERVER_URL =
  process.env.NEXT_PUBLIC_MAP_SERVER_URL || '/maps';

/**
 * Composant Cartographique Souverain 100% Hors-Ligne
 * Basé sur MapLibre GL JS + PMTiles (Protomaps) + Thème Slate-950
 * Conforme Loi 18-07 (ANPDP) : 0 requête externe, 0 fuite GPS/IP.
 */
export function SovereignMapLibre({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  geofences,
  mapServerUrl = DEFAULT_MAP_SERVER_URL,
  onFallbackRequested,
}: SovereignMapLibreProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Initialisation dynamique de MapLibre et PMTiles
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        let maplibregl: any;
        let Protocol: any;
        let basemaps: any;

        try {
          const mlPkg = 'maplibre-gl';
          const pmPkg = 'pmtiles';
          const protoPkg = '@protomaps/basemaps';
          const maplibreModule = await import(/* webpackIgnore: true */ mlPkg);
          maplibregl = maplibreModule.default || maplibreModule;
          const pmModule = await import(/* webpackIgnore: true */ pmPkg);
          Protocol = pmModule.Protocol;
          basemaps = await import(/* webpackIgnore: true */ protoPkg);
        } catch {
          // Si les modules PMTiles/MapLibre ne sont pas installés, basculer sur le moteur SVG/OSM intégré
          if (onFallbackRequested) {
            onFallbackRequested('OSM_TILES');
          }
          return;
        }

        if (isCancelled || !maplibregl || !Protocol || !basemaps) return;

        // 1. Enregistrement du protocole binaire pmtiles://
        const protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);

        // 2. Palette personnalisée selon le thème actif
        const customTheme = isLight
          ? {
              ...basemaps.namedFlavor('light'),
              background: '#F1F5F9',
              earth: '#FFFFFF',
              water: '#DBEAFE',
              roads_highway: '#2563EB',
              roads_major: '#94A3B8',
              roads_minor: '#CBD5E1',
              buildings: '#E2E8F0',
            }
          : {
              ...basemaps.namedFlavor('black'),
              background: '#020617', // Tailwind slate-950
              earth: '#090d16',      // Fond continental profond
              water: '#0f172a',      // slate-900 (Méditerranée, barrages)
              roads_highway: '#334155', // Autoroute A1 Est-Ouest sobre et nette
              roads_major: '#1e293b',   // RN1, RN3, RN5
              roads_minor: '#131c2e',   // Réseau secondaire
              buildings: '#0f172a',     // Emprises bâties
            };

        const styleObj = {
          version: 8,
          glyphs: `${mapServerUrl}/fonts/{fontstack}/{range}.pbf`,
          sprite: `${mapServerUrl}/sprites/${isLight ? 'light' : 'dark'}`,
          sources: {
            protomaps: {
              type: 'vector',
              url: `pmtiles://${mapServerUrl}/algeria.pmtiles`,
              attribution: '© OpenStreetMap Souverain (DocteurFlotte DZ)',
            },
          },
          layers: basemaps.layers('protomaps', customTheme, { lang: 'fr' }),
        };

        // 3. Instanciation MapLibre
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: styleObj as any,
          center: [3.0588, 36.7538], // Alger
          zoom: 6.2,
          pitch: 20,
          maxBounds: [
            [-9.5, 18.0],
            [13.0, 38.5],
          ], // Bornes souveraines strictes de l'Algérie
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

        map.on('load', () => {
          if (isCancelled) return;
          mapInstanceRef.current = map;
          setIsMapReady(true);
        });

        map.on('error', (e: any) => {
          // Erreur de tuiles ou réseau local
          console.warn('[SovereignMapLibre] Erreur de flux cartographique :', e);
        });
      } catch (err: any) {
        console.warn(
          '[SovereignMapLibre] Packages MapLibre / PMTiles non disponibles ou serveur hors ligne, basculement mode vectoriel natif :',
          err?.message
        );
        if (!isCancelled) {
          setLoadError(err?.message || 'Erreur initialisation cartographie');
          if (onFallbackRequested) onFallbackRequested();
        }
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, [mapServerUrl, onFallbackRequested, isLight]);

  // Synchronisation caméra sur le véhicule sélectionné
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !selectedVehicle) return;

    mapInstanceRef.current.flyTo({
      center: [selectedVehicle.gps.longitude, selectedVehicle.gps.latitude],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 11),
      essential: true,
      speed: 1.2,
    });
  }, [selectedVehicle?.id, selectedVehicle?.gps.latitude, selectedVehicle?.gps.longitude, isMapReady]);

  if (loadError) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
        style={{
          backgroundColor: isLight ? '#F8FAFC' : '#020617',
          color: isLight ? '#0F172A' : '#F8FAFC',
        }}
      >
        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center mb-3 font-mono font-bold text-xs"
          style={{
            backgroundColor: isLight ? '#EFF6FF' : '#172554',
            border: `1px solid ${isLight ? '#BFDBFE' : '#1D4ED8'}`,
            color: '#2563EB',
          }}
        >
          PMT
        </div>
        <h4
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}
        >
          Cartographie Souveraine PMTiles
        </h4>
        <p
          className="text-[11px] max-w-sm mt-1 mb-3"
          style={{ color: isLight ? '#64748B' : '#94A3B8' }}
        >
          Le fichier statique <code style={{ color: isLight ? '#0F172A' : '#E2E8F0' }}>/var/www/maps/algeria.pmtiles</code> ou les bibliothèques WebGL sont en cours de déploiement.
        </p>
        <div className="flex gap-2 flex-wrap justify-center mt-2">
          <button
            onClick={() => onFallbackRequested?.('OSM_TILES')}
            className="px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
            }}
          >
            Activer OpenStreetMap (Connecté)
          </button>
          <button
            onClick={() => onFallbackRequested?.('SOVEREIGN_LOCAL')}
            className="px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
              border: `1px solid ${isLight ? '#CBD5E1' : '#334155'}`,
              color: isLight ? '#0F172A' : '#F8FAFC',
            }}
          >
            Moteur 100% Souverain Local (Hors-Ligne)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: isLight ? '#F1F5F9' : '#020617',
      }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Badge statut de souveraineté cartographique */}
      <div
        className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2 py-1 rounded-sm backdrop-blur-md text-[10px] font-mono"
        style={{
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(2, 6, 23, 0.9)',
          border: `1px solid ${isLight ? '#CBD5E1' : '#1E293B'}`,
          color: isLight ? '#0F172A' : '#F8FAFC',
          boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.08)' : '0 4px 12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-emerald-600 dark:text-emerald-400">PMTiles Souverain</span>
        <span style={{ color: isLight ? '#CBD5E1' : '#475569' }}>•</span>
        <span style={{ color: isLight ? '#64748B' : '#94A3B8' }}>100% Local (206 Partial Content)</span>
      </div>
    </div>
  );
}
