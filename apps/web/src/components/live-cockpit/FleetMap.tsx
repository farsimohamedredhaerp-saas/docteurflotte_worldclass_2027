'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  VehicleTelemetryState,
  GeofenceZone,
} from './types';
import {
  IconCrosshair,
  IconLayers,
  IconNavigation,
  IconAlertOctagon,
  IconMoon,
  IconSun,
  IconMountain,
  IconGlobe,
} from '../navigation/TechIcons';
import { SovereignMapLibre } from './SovereignMapLibre';
import { useTheme } from '../../context/ThemeContext';

interface FleetMapProps {
  vehicles: VehicleTelemetryState[];
  selectedVehicle?: VehicleTelemetryState;
  onSelectVehicle: (id: string) => void;
  geofences: GeofenceZone[];
}

// Constantes et bornes souveraines Web Mercator (EPSG:3857)
export const MERCATOR_MAX_LAT = 85.05112878;
export const MIN_ZOOM = 4.5;
export const MAX_ZOOM = 19.0;

function lon2tile(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat: number, zoom: number): number {
  const clampedLat = Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function tile2lon(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tile2lat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, lat));
}

// Corridors logistiques souverains en Algérie
const STRATEGIC_CORRIDORS = [
  {
    name: 'A1 Autoroute Est-Ouest (Frontière Ouest -> Frontière Est)',
    points: [
      { lat: 34.88, lng: -1.31 }, // Tlemcen
      { lat: 35.20, lng: -0.63 }, // Sidi Bel Abbès
      { lat: 35.70, lng: -0.63 }, // Oran
      { lat: 35.93, lng: 0.09 },  // Mostaganem
      { lat: 36.16, lng: 1.33 },  // Chlef
      { lat: 36.47, lng: 2.83 },  // Blida
      { lat: 36.75, lng: 3.05 },  // Alger
      { lat: 36.73, lng: 3.28 },  // Boumerdès
      { lat: 36.37, lng: 3.90 },  // Bouira
      { lat: 36.19, lng: 5.41 },  // Sétif
      { lat: 36.36, lng: 6.61 },  // Constantine
      { lat: 36.75, lng: 7.40 },  // Skikda embranchement
      { lat: 36.90, lng: 7.76 },  // Annaba
      { lat: 36.88, lng: 8.44 },  // El Tarf (Frontière Tunisie)
    ],
  },
  {
    name: 'RN1 La Trans-Saharienne (Alger -> Grand Sud -> In Guezzam)',
    points: [
      { lat: 36.75, lng: 3.05 }, // Alger
      { lat: 36.47, lng: 2.83 }, // Blida (Chiffa)
      { lat: 36.26, lng: 2.75 }, // Médéa
      { lat: 35.88, lng: 2.92 }, // Berrouaghia
      { lat: 34.67, lng: 3.25 }, // Djelfa
      { lat: 33.80, lng: 2.86 }, // Laghouat
      { lat: 32.49, lng: 3.67 }, // Ghardaïa (M'Zab)
      { lat: 30.58, lng: 2.87 }, // El Menia
      { lat: 27.20, lng: 2.47 }, // In Salah
      { lat: 25.50, lng: 3.80 }, // Arak
      { lat: 22.79, lng: 5.52 }, // Tamanrasset
      { lat: 18.96, lng: 5.71 }, // In Guezzam (Frontière Niger)
    ],
  },
  {
    name: 'RN5 / RN3 Axe Pétrolier Hassi Messaoud & Djanet',
    points: [
      { lat: 36.36, lng: 6.61 }, // Constantine
      { lat: 35.56, lng: 6.17 }, // Batna
      { lat: 34.85, lng: 5.73 }, // Biskra
      { lat: 33.10, lng: 6.06 }, // Touggourt
      { lat: 31.95, lng: 5.33 }, // Ouargla
      { lat: 31.68, lng: 6.07 }, // Hassi Messaoud
      { lat: 28.05, lng: 9.60 }, // In Amenas
      { lat: 26.49, lng: 8.48 }, // Illizi
      { lat: 24.55, lng: 9.48 }, // Djanet
    ],
  },
  {
    name: 'RN50 Axe Stratégique Minier Gara Djebilet - Tindouf - Béchar',
    points: [
      { lat: 31.62, lng: -2.22 }, // Béchar
      { lat: 31.02, lng: -2.73 }, // Abadla
      { lat: 29.41, lng: -3.25 }, // Tabelbala
      { lat: 28.42, lng: -5.67 }, // Hassi Khebi
      { lat: 27.67, lng: -8.14 }, // Tindouf
      { lat: 26.88, lng: -7.15 }, // Gara Djebilet
    ],
  },
  {
    name: 'Rocade Pétrochimique Hassi R\'Mel - Arzew',
    points: [
      { lat: 32.93, lng: 3.27 }, // Hassi R'Mel
      { lat: 33.80, lng: 2.86 }, // Laghouat
      { lat: 34.33, lng: 1.39 }, // Aflou
      { lat: 34.88, lng: 0.15 }, // Saïda
      { lat: 35.40, lng: 0.14 }, // Mascara
      { lat: 35.85, lng: -0.28 }, // Arzew (Pôle GNL)
    ],
  },
];

// Polygone du Territoire Souverain de l'Algérie (100% hors-ligne, zéro dépendance externe)
const ALGERIA_TERRITORY_POLYGON = [
  // 1. Façade Maritime Méditerranéenne (Ouest -> Est)
  { lat: 35.08, lng: -2.21 }, // Marsa Ben M'Hidi (Frontière Maroc)
  { lat: 35.15, lng: -1.86 }, // Ghazaouet
  { lat: 35.30, lng: -1.39 }, // Béni Saf
  { lat: 35.70, lng: -0.64 }, // Oran / Cap Falcon
  { lat: 35.85, lng: -0.28 }, // Arzew
  { lat: 35.93, lng: 0.09 },  // Mostaganem
  { lat: 36.51, lng: 1.31 },  // Ténès
  { lat: 36.59, lng: 2.44 },  // Tipaza
  { lat: 36.75, lng: 3.06 },  // Baie d'Alger
  { lat: 36.91, lng: 3.91 },  // Dellys
  { lat: 36.75, lng: 5.08 },  // Béjaïa
  { lat: 36.82, lng: 5.77 },  // Jijel
  { lat: 36.88, lng: 6.91 },  // Skikda
  { lat: 36.90, lng: 7.76 },  // Annaba
  { lat: 36.90, lng: 8.44 },  // El Kala (Frontière Tunisie)

  // 2. Frontière Est (Tunisie & Libye)
  { lat: 36.45, lng: 8.35 }, // Souk Ahras
  { lat: 35.40, lng: 8.30 }, // Tébessa
  { lat: 34.00, lng: 8.10 }, // El Oued
  { lat: 33.00, lng: 9.20 }, // Chott Rharsa
  { lat: 30.25, lng: 9.60 }, // Ghadamès
  { lat: 27.50, lng: 9.80 }, // Frontière Libye
  { lat: 24.96, lng: 10.18 }, // Ghat
  { lat: 23.50, lng: 11.99 }, // Djanet Sud-Est

  // 3. Frontière Sud (Niger & Mali)
  { lat: 21.50, lng: 11.00 }, // Passe de Salvador
  { lat: 19.14, lng: 8.50 },  // Frontière Niger
  { lat: 18.96, lng: 5.71 },  // In Guezzam (Extrême Sud)
  { lat: 19.50, lng: 3.00 },  // Frontière Sud Mali
  { lat: 21.33, lng: 0.95 },  // Bordj Badji Mokhtar
  { lat: 23.50, lng: -1.50 }, // Erg Chech
  { lat: 25.00, lng: -4.83 }, // Chenachane (Frontière Mauritanie)

  // 4. Frontière Ouest (Mauritanie, Sahara Occidental & Maroc)
  { lat: 26.00, lng: -6.50 }, // Erg Iguidi
  { lat: 27.30, lng: -8.67 }, // Tindouf Ouest (Frontière Mauritanie)
  { lat: 28.50, lng: -8.67 }, // Tindouf Nord
  { lat: 29.80, lng: -7.00 }, // Hammada du Draa
  { lat: 31.62, lng: -2.22 }, // Béchar
  { lat: 32.30, lng: -1.50 }, // Béni Ounif
  { lat: 33.50, lng: -1.80 }, // El Aricha
  { lat: 34.85, lng: -1.80 }, // Maghnia
  { lat: 35.08, lng: -2.21 }, // Retour Marsa Ben M'Hidi
];

// Pôles Logistiques, Énergétiques et Portuaires Majeurs d'Algérie
const STRATEGIC_HUBS = [
  { name: 'ALGER (Hub Central & Siège)', lat: 36.75, lng: 3.06, type: 'PORT' },
  { name: 'ORAN (Hub Ouest)', lat: 35.70, lng: -0.64, type: 'PORT' },
  { name: 'ARZEW (Pôle GNL)', lat: 35.85, lng: -0.28, type: 'ENERGY' },
  { name: 'ANNABA (Sidérologie)', lat: 36.90, lng: 7.76, type: 'PORT' },
  { name: 'SKIKDA (Pétrochimie)', lat: 36.88, lng: 6.91, type: 'PORT' },
  { name: 'BÉJAÏA (Terminal Portuaire)', lat: 36.75, lng: 5.08, type: 'PORT' },
  { name: 'CONSTANTINE (Hub Est)', lat: 36.36, lng: 6.61, type: 'HUB' },
  { name: 'SÉTIF (Hauts-Plateaux)', lat: 36.19, lng: 5.41, type: 'HUB' },
  { name: 'GHARDAÏA (Plateforme M\'Zab)', lat: 32.49, lng: 3.67, type: 'HUB' },
  { name: 'HASSI MESSAOUD (Pétrole)', lat: 31.68, lng: 6.07, type: 'ENERGY' },
  { name: 'HASSI R\'MEL (Gaz Naturel)', lat: 32.93, lng: 3.27, type: 'ENERGY' },
  { name: 'BÉCHAR (Sud-Ouest)', lat: 31.62, lng: -2.22, type: 'HUB' },
  { name: 'TINDOUF (Gara Djebilet)', lat: 27.67, lng: -8.14, type: 'MINE' },
  { name: 'TAMANRASSET (Hoggar Grand Sud)', lat: 22.79, lng: 5.52, type: 'HUB' },
  { name: 'IN GUEZZAM (Frontière)', lat: 18.96, lng: 5.71, type: 'BORDER' },
  { name: 'BISKRA (Porte du Sahara)', lat: 34.85, lng: 5.73, type: 'HUB' },
];

export function FleetMap({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  geofences,
}: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // État de la vue cartographique (Centré sur l'Algérie)
  const [centerLat, setCenterLat] = useState(35.2);
  const [centerLng, setCenterLng] = useState(3.0);
  const [zoom, setZoom] = useState(6.2); // Zoom idéal pour visualiser le réseau national algérien

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [followVehicle, setFollowVehicle] = useState(true);

  // Calques
  const [showGeofences, setShowGeofences] = useState(true);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  // Types de calques en mode tuiles connecté : Nuit, Jour, Satellite HD, Relief Topo
  const [mapTileLayer, setMapTileLayer] = useState<'OSM_DARK' | 'OSM_LIGHT' | 'SATELLITE' | 'RELIEF_TOPO'>(() =>
    theme === 'light' ? 'OSM_LIGHT' : 'OSM_DARK'
  );
  const [mapEngine, setMapEngine] = useState<'SOVEREIGN_LOCAL' | 'OSM_TILES' | 'PMTILES'>('OSM_TILES');

  useEffect(() => {
    setMapTileLayer((prev) => {
      if (prev === 'OSM_DARK' && theme === 'light') return 'OSM_LIGHT';
      if (prev === 'OSM_LIGHT' && theme === 'dark') return 'OSM_DARK';
      return prev;
    });
  }, [theme]);

  // Mode tuiles connecté actif si sélectionné
  const isOsmActive = mapEngine === 'OSM_TILES';

  // Référence directe vers le HUD des coordonnées (zéro re-render au survol souris)
  const cursorCoordsRef = useRef<HTMLSpanElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // Dimensions dynamiques
  const [dims, setDims] = useState({ width: 900, height: 700 });

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
        const w = containerRef.current.clientWidth || Math.round(rect.width) || Math.round(parentRect?.width || 0) || 900;
        const h = containerRef.current.clientHeight || Math.round(rect.height) || Math.round(parentRect?.height || 0) || (window.innerHeight - 100) || 700;
        setDims({ width: w, height: h });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Suivi verrouillé du véhicule sélectionné (dépendances scalaires stables)
  const targetLat = selectedVehicle?.gps?.latitude;
  const targetLng = selectedVehicle?.gps?.longitude;
  useEffect(() => {
    if (followVehicle && targetLat !== undefined && targetLng !== undefined) {
      setCenterLat(targetLat);
      setCenterLng(targetLng);
    }
  }, [followVehicle, targetLat, targetLng]);

  // Conversion GPS -> Pixels écran (coordonnées entières stables pour éviter les écarts d'hydratation SSR)
  const projectGeoToPixel = useCallback(
    (lat: number, lng: number) => {
      const centerTileX = lon2tile(centerLng, zoom);
      const centerTileY = lat2tile(centerLat, zoom);
      const pointTileX = lon2tile(lng, zoom);
      const pointTileY = lat2tile(lat, zoom);

      const x = Math.round(dims.width / 2 + (pointTileX - centerTileX) * 256);
      const y = Math.round(dims.height / 2 + (pointTileY - centerTileY) * 256);
      return { x, y };
    },
    [centerLat, centerLng, zoom, dims.width, dims.height]
  );

  // Conversion Pixels écran -> GPS
  const unprojectPixelToGeo = useCallback(
    (px: number, py: number) => {
      const centerTileX = lon2tile(centerLng, zoom);
      const centerTileY = lat2tile(centerLat, zoom);

      const tileX = centerTileX + (px - dims.width / 2) / 256;
      const tileY = centerTileY + (py - dims.height / 2) / 256;

      return {
        lat: tile2lat(tileY, zoom),
        lng: tile2lon(tileX, zoom),
      };
    },
    [centerLat, centerLng, zoom, dims.width, dims.height]
  );

  // Calcul des tuiles cartographiques visibles (Slippy Map Tiles) - uniquement si activé en mode connecté
  const visibleTiles = useMemo(() => {
    if (!isOsmActive) return [];

    // OpenTopoMap plafonne nativement à zoom 17 ; au-delà, étirement fluide sans erreur 404
    const maxNativeZ = mapTileLayer === 'RELIEF_TOPO' ? 17 : 19;
    const intZoom = Math.min(maxNativeZ, Math.floor(zoom));
    const scale = Math.pow(2, zoom - intZoom);
    const tileSize = 256 * scale;

    const centerTileX = lon2tile(centerLng, intZoom);
    const centerTileY = lat2tile(centerLat, intZoom);

    const minX = Math.floor(centerTileX - dims.width / (2 * tileSize)) - 1;
    const maxX = Math.ceil(centerTileX + dims.width / (2 * tileSize)) + 1;
    const minY = Math.floor(centerTileY - dims.height / (2 * tileSize)) - 1;
    const maxY = Math.ceil(centerTileY + dims.height / (2 * tileSize)) + 1;

    const tiles: { x: number; y: number; z: number; left: number; top: number; size: number }[] = [];
    const maxCoord = Math.pow(2, intZoom);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (y < 0 || y >= maxCoord) continue;
        const normalizedX = ((x % maxCoord) + maxCoord) % maxCoord;

        const left = dims.width / 2 + (x - centerTileX) * tileSize;
        const top = dims.height / 2 + (y - centerTileY) * tileSize;

        tiles.push({
          x: normalizedX,
          y,
          z: intZoom,
          left,
          top,
          size: tileSize,
        });
      }
    }
    return tiles;
  }, [centerLat, centerLng, zoom, dims.width, dims.height, isOsmActive, mapTileLayer]);

  // Fournisseur de tuiles cartographiques dynamique (OSM / Satellite Orthophoto / Relief Topo)
  const getTileUrl = (x: number, y: number, z: number, layer: 'OSM_DARK' | 'OSM_LIGHT' | 'SATELLITE' | 'RELIEF_TOPO') => {
    switch (layer) {
      case 'SATELLITE':
        // Imagerie Satellite ESRI World Imagery HD (Format REST {z}/{y}/{x})
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

      case 'RELIEF_TOPO': {
        // Relief OpenTopoMap (Courbes de niveau, dénivelés & altimétrie SRTM)
        const subdomains = ['a', 'b', 'c'];
        const s = subdomains[(x + y) % subdomains.length];
        return `https://${s}.tile.opentopomap.org/${z}/${x}/${y}.png`;
      }

      case 'OSM_LIGHT':
      case 'OSM_DARK':
      default: {
        const template =
          process.env.NEXT_PUBLIC_OSM_TILE_SERVER_URL ||
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const subdomains = ['a', 'b', 'c'];
        const s = subdomains[(x + y) % subdomains.length];
        return template
          .replace('{s}', s)
          .replace('{z}', String(z))
          .replace('{x}', String(x))
          .replace('{y}', String(y));
      }
    }
  };

  // Interactions Souris : Pan / Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    containerRef.current?.focus();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Mise à jour directe du DOM des coordonnées du curseur sans aucun re-render React
    if (cursorCoordsRef.current) {
      const geo = unprojectPixelToGeo(px, py);
      cursorCoordsRef.current.textContent = `${geo.lat.toFixed(4)}°N, ${geo.lng.toFixed(4)}°E`;
    }

    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    if (followVehicle) {
      setFollowVehicle(false);
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const centerTileX = lon2tile(centerLng, zoom) - dx / 256;
      const centerTileY = lat2tile(centerLat, zoom) - dy / 256;

      const newLng = tile2lon(centerTileX, zoom);
      const newLat = tile2lat(centerTileY, zoom);

      setCenterLng(newLng);
      setCenterLat(Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, newLat)));
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (cursorCoordsRef.current) {
      cursorCoordsRef.current.textContent = 'Survolez la carte pour les coordonnées';
    }
  };

  // Zoom molette natif avec { passive: false } pour empêcher le scroll de page (P0 React 17+)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;

      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      setZoom((prevZoom) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom + zoomDelta));
        if (Math.abs(newZoom - prevZoom) < 0.001) return prevZoom;

        // Position géographique exacte sous le curseur avant redimensionnement
        const centerTileX = lon2tile(centerLng, prevZoom);
        const centerTileY = lat2tile(centerLat, prevZoom);
        const cursorTileX = centerTileX + (px - dims.width / 2) / 256;
        const cursorTileY = centerTileY + (py - dims.height / 2) / 256;
        const cursorLat = tile2lat(cursorTileY, prevZoom);
        const cursorLng = tile2lon(cursorTileX, prevZoom);

        // Repositionnement dynamique du centre pour ancrer le point sous le curseur
        const newCenterTileX = lon2tile(cursorLng, newZoom) - (px - dims.width / 2) / 256;
        const newCenterTileY = lat2tile(cursorLat, newZoom) - (py - dims.height / 2) / 256;

        setCenterLng(tile2lon(newCenterTileX, newZoom));
        setCenterLat(Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, tile2lat(newCenterTileY, newZoom))));

        return newZoom;
      });

      setFollowVehicle(false);
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [centerLat, centerLng, dims.width, dims.height]);

  // Navigation accessible au clavier (Flèches pour pan, +/- pour zoom)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const panStep = 0.05 / Math.pow(2, Math.max(0, zoom - 6));
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFollowVehicle(false);
      setCenterLat((lat) => Math.min(MERCATOR_MAX_LAT, lat + panStep));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFollowVehicle(false);
      setCenterLat((lat) => Math.max(-MERCATOR_MAX_LAT, lat - panStep));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFollowVehicle(false);
      setCenterLng((lng) => lng - panStep);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFollowVehicle(false);
      setCenterLng((lng) => lng + panStep);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      setZoom((z) => Math.max(MIN_ZOOM, z - 0.5));
    }
  };

  const recenterAlgeria = () => {
    setFollowVehicle(false);
    setCenterLat(35.2);
    setCenterLng(3.0);
    setZoom(6.2);
  };

  // Tracé mémoïsé du contour national souverain de l'Algérie
  const algeriaPath = useMemo(() => {
    return (
      ALGERIA_TERRITORY_POLYGON.map((pt, idx) => {
        const { x, y } = projectGeoToPixel(pt.lat, pt.lng);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ') + ' Z'
    );
  }, [projectGeoToPixel]);

  // Tracés mémoïsés des corridors logistiques stratégiques
  const renderedCorridors = useMemo(() => {
    return STRATEGIC_CORRIDORS.map((corridor) => ({
      name: corridor.name,
      pathData: corridor.points
        .map((pt, pIdx) => {
          const { x, y } = projectGeoToPixel(pt.lat, pt.lng);
          return `${pIdx === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' '),
    }));
  }, [projectGeoToPixel]);

  // Coordonnées mémoïsées des pôles et hubs stratégiques
  const renderedHubs = useMemo(() => {
    return STRATEGIC_HUBS.map((hub, idx) => {
      const { x, y } = projectGeoToPixel(hub.lat, hub.lng);
      return {
        ...hub,
        key: idx,
        x,
        y,
        isOffscreen: x < -100 || x > dims.width + 100 || y < -100 || y > dims.height + 100,
      };
    });
  }, [projectGeoToPixel, dims.width, dims.height]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Console cartographique temps réel de la flotte"
      suppressHydrationWarning
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: '100%',
        alignSelf: 'stretch',
        background: isLight ? '#F1F5F9' : '#090D16',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        outline: 'none',
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      {mapEngine === 'PMTILES' ? (
        <SovereignMapLibre
          vehicles={vehicles}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={onSelectVehicle}
          geofences={geofences}
          onFallbackRequested={(target) => {
            const next = target || 'OSM_TILES';
            setMapEngine(next);
          }}
        />
      ) : (
        <>
          {/* 1. FOND DE TUILES CARTOGRAPHIQUES DYNAMIQUE (MODE CONNECTÉ) */}
          {isOsmActive && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                filter:
                  mapTileLayer === 'OSM_DARK'
                    ? 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(125%)'
                    : 'none',
              }}
            >
              {visibleTiles.map((t) => (
                <img
                  key={`${mapTileLayer}-${t.z}-${t.x}-${t.y}`}
                  src={getTileUrl(t.x, t.y, t.z, mapTileLayer)}
                  alt=""
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    left: `${t.left}px`,
                    top: `${t.top}px`,
                    width: `${t.size}px`,
                    opacity: mapTileLayer === 'OSM_DARK' ? 0.88 : 1,
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </div>
          )}

          {/* 2. CALQUE VECTORIEL SVG : CONTOUR NATIONAL SOUVERAIN, CORRIDORS, GÉOREPÉRAGE & PÔLES */}
          <svg
            suppressHydrationWarning
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {/* Grille technique de repère radar */}
            <defs>
              <pattern id="radarGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke={isLight ? 'rgba(148, 163, 184, 0.25)' : 'rgba(30, 41, 59, 0.35)'}
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#radarGrid)"
              opacity={isOsmActive ? 0.12 : 1}
            />

            {/* Masse continentale souveraine de l'Algérie (mémoïsée) */}
            <g id="sovereign-dz-landmass">
              <path
                d={algeriaPath}
                fill={isOsmActive ? 'transparent' : (isLight ? '#FFFFFF' : '#080E1A')}
                stroke={isOsmActive ? (isLight ? '#2563EB' : '#38BDF8') : (isLight ? '#2563EB' : '#1E3A8A')}
                strokeWidth={isOsmActive ? '2' : (isLight ? '2' : '2.5')}
                strokeLinejoin="round"
                style={{
                  filter: isOsmActive
                    ? 'none'
                    : (isLight
                      ? 'drop-shadow(0 2px 10px rgba(37, 99, 235, 0.15))'
                      : 'drop-shadow(0 0 20px rgba(30, 58, 138, 0.45))'),
                }}
              />
              <path
                d={algeriaPath}
                fill="none"
                stroke={isLight ? '#3B82F6' : '#38BDF8'}
                strokeWidth="1.2"
                strokeDasharray="6,4"
                strokeLinejoin="round"
                opacity={isLight ? '0.6' : '0.75'}
              />
            </g>

            {/* Pôles et Hubs Logistiques Stratégiques (mémoïsés) */}
            {showHubs &&
              renderedHubs.map((hub) => {
                if (hub.isOffscreen) return null;

                const isPort = hub.type === 'PORT';
                const isEnergy = hub.type === 'ENERGY';
                const color = isPort ? '#38BDF8' : isEnergy ? '#F59E0B' : '#10B981';

                return (
                  <g key={hub.key} opacity={zoom >= 5.2 ? 0.95 : 0.4}>
                    <circle cx={hub.x} cy={hub.y} r="3" fill={color} />
                    <circle cx={hub.x} cy={hub.y} r="8" fill="none" stroke={color} strokeWidth="0.75" opacity="0.6" />
                    {zoom >= 6.0 && (
                      <text
                        x={hub.x + 10}
                        y={hub.y + 3}
                        fill={isLight ? '#334155' : '#94A3B8'}
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="600"
                        style={{ pointerEvents: 'none' }}
                      >
                        {hub.name}
                      </text>
                    )}
                  </g>
                );
              })}

            {/* Tracé des Corridors Routiers Stratégiques (mémoïsés) */}
            {showCorridors &&
              renderedCorridors.map((corridor, idx) => (
                <g key={idx}>
                  <path
                    d={corridor.pathData}
                    fill="none"
                    stroke={isLight ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.4)'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={corridor.pathData}
                    fill="none"
                    stroke={isLight ? '#2563EB' : '#38BDF8'}
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    strokeLinecap="round"
                  />
                </g>
              ))}

            {/* Zones de Géorepérage (Geofences Souveraines) */}
            {showGeofences &&
              geofences.map((geo) => {
                const { x, y } = projectGeoToPixel(geo.centerLat, geo.centerLng);
                const edgePoint = projectGeoToPixel(
                  geo.centerLat,
                  geo.centerLng + (geo.radiusKm / (111.32 * Math.cos((geo.centerLat * Math.PI) / 180)))
                );
                const radiusPx = Math.max(4, Math.abs(edgePoint.x - x));

                return (
                  <g key={geo.id}>
                    <circle cx={x} cy={y} r={radiusPx} fill={geo.colorHex} fillOpacity="0.12" />
                    <circle
                      cx={x}
                      cy={y}
                      r={radiusPx}
                      fill="none"
                      stroke={geo.colorHex}
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                    />
                    <text
                      x={x}
                      y={y - radiusPx - 6}
                      textAnchor="middle"
                      fill={geo.colorHex}
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {geo.name}
                    </text>
                  </g>
                );
              })}

            {/* Trace Historique 15 min (Breadcrumbs) du Véhicule Sélectionné */}
            {showBreadcrumbs && selectedVehicle?.breadcrumbs && selectedVehicle.breadcrumbs.length > 1 && (
              <g>
                {selectedVehicle.breadcrumbs.map((pt, index) => {
                  if (index === 0) return null;
                  const prev = selectedVehicle.breadcrumbs![index - 1];
                  if (!prev) return null;
                  const p1 = projectGeoToPixel(prev.latitude, prev.longitude);
                  const p2 = projectGeoToPixel(pt.latitude, pt.longitude);
                  const opacity = 0.3 + (index / selectedVehicle.breadcrumbs!.length) * 0.7;

                  return (
                    <line
                      key={index}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeOpacity={opacity}
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            )}
          </svg>

          {/* 3. MARQUEURS VÉHICULES INTERACTIFS (HAUTE PRÉCISION) */}
          <div suppressHydrationWarning style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {vehicles.map((v) => {
              if (!v.gps) return null;
              const { x, y } = projectGeoToPixel(v.gps.latitude, v.gps.longitude);

              // Si le véhicule est hors du viewport, ne pas rendre le composant lourd
              if (x < -100 || x > dims.width + 100 || y < -100 || y > dims.height + 100) {
                return null;
              }

              const isSelected = v.id === selectedVehicle?.id;

              let colorHex = '#64748B'; // slate
              if (v.status === 'MOTION') colorHex = '#10B981'; // emerald
              if (v.status === 'IDLE_WARNING') colorHex = '#F59E0B'; // amber
              if (v.status === 'DTC_CRITICAL' || v.dvirStatus?.isBlocked) colorHex = '#EF4444'; // rose/rouge

              return (
                <div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Véhicule ${v.registrationNumber || ''} ${v.make || ''} ${v.model || ''} — Statut: ${v.status}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectVehicle(v.id);
                      setFollowVehicle(true);
                    }
                  }}
                  suppressHydrationWarning
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVehicle(v.id);
                    setFollowVehicle(true);
                  }}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: isSelected ? 30 : 15,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Halo d'impulsion si sélectionné ou critique */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-8px',
                    borderRadius: '50%',
                    backgroundColor: colorHex,
                    opacity: 0.35,
                    animation: 'dfPulse 1.8s infinite',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Disque Central & Flèche de Cap rotative avec Différenciation Mode 0 / Mode 1 / Mode 2 */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isLight ? '#FFFFFF' : '#090D16',
                  border: isSelected
                    ? `2px solid ${isLight ? '#2563EB' : '#FFFFFF'}`
                    : v.telemetryMode === 'MODE_0_ZERO_HARDWARE'
                    ? '2px dashed #8B5CF6'
                    : v.telemetryMode === 'MODE_1_GPS_ONLY'
                    ? '2px solid #38BDF8'
                    : `2px solid ${colorHex}`,
                  boxShadow: isLight
                    ? `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 10px ${colorHex}44`
                    : `0 2px 10px rgba(0, 0, 0, 0.6), 0 0 12px ${colorHex}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s ease-out',
                }}
              >
                <div
                  style={{
                    transform: `rotate(${v.gps.headingDegrees}deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease-out',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={colorHex} stroke={isLight ? '#FFFFFF' : '#000'} strokeWidth="1.5">
                    <polygon points="12 2 19 21 12 17 5 21 12 2" />
                  </svg>
                </div>
              </div>

              {/* Étiquette Haute Densité Accrochée au Véhicule */}
              <div
                style={{
                  position: 'absolute',
                  left: '38px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  whiteSpace: 'nowrap',
                  background: isLight
                    ? '#FFFFFF'
                    : isSelected
                    ? '#111827'
                    : 'rgba(9, 13, 22, 0.92)',
                  border: `1px solid ${
                    isSelected
                      ? '#2563EB'
                      : isLight
                      ? '#CBD5E1'
                      : '#334155'
                  }`,
                  borderRadius: '4px',
                  padding: '3px 7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  boxShadow: isLight
                    ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                    : '0 2px 8px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  color: isLight ? '#0F172A' : '#F8FAFC',
                }}
              >
                {/* Badge Mode Matériel (Mode 0, Mode 1, Mode 2) */}
                {v.telemetryMode === 'MODE_0_ZERO_HARDWARE' ? (
                  <span
                    style={{
                      background: 'rgba(139, 92, 246, 0.18)',
                      color: '#A78BFA',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: 700,
                    }}
                    title="Mode 0 : Cinématique Valhalla & Pleins Naftal (Zéro Boîtier)"
                  >
                    M0 Valhalla
                  </span>
                ) : v.telemetryMode === 'MODE_1_GPS_ONLY' ? (
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.18)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: 700,
                    }}
                    title="Mode 1 : GPS Standard Traccar / Teltonika"
                  >
                    M1 GPS
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.18)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: 700,
                    }}
                    title="Mode 2 : Télémétrie Moteur Bus CAN J1939 Complète"
                  >
                    M2 CAN
                  </span>
                )}
                <span style={{ fontWeight: 700 }}>{v.registrationNumber}</span>
                <span style={{ color: isLight ? '#CBD5E1' : '#64748B' }}>|</span>
                <span style={{ color: colorHex, fontWeight: 700 }}>
                  {Math.round(v.gps.speedKmh)} km/h
                </span>
                {v.dvirStatus?.isBlocked && (
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: 700,
                    }}
                    title="Véhicule consigné suite échec critique inspection DVIR"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <IconAlertOctagon size={9} /> DVIR
                    </span>
                  </span>
                )}
                {v.can?.fuelDropAnomalyDetected && (
                  <span
                    style={{
                      background: '#991B1B',
                      color: '#FECDD3',
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontWeight: 800,
                    }}
                  >
                    VOL
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* Badge statut de souveraineté cartographique (Haut-Gauche) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(9, 13, 22, 0.94)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${
            mapEngine === 'SOVEREIGN_LOCAL'
              ? '#10B981'
              : isLight
              ? '#CBD5E1'
              : '#334155'
          }`,
          borderRadius: '4px',
          padding: '6px 12px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          boxShadow: isLight
            ? '0 2px 8px rgba(0, 0, 0, 0.08)'
            : '0 4px 12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor:
              mapEngine === 'SOVEREIGN_LOCAL'
                ? '#10B981'
                : mapEngine === 'OSM_TILES'
                ? '#38BDF8'
                : '#A78BFA',
            boxShadow: `0 0 8px ${
              mapEngine === 'SOVEREIGN_LOCAL'
                ? '#10B981'
                : mapEngine === 'OSM_TILES'
                ? '#38BDF8'
                : '#A78BFA'
            }`,
          }}
        />
        <span style={{ fontWeight: 700, color: isLight ? '#0F172A' : '#F8FAFC' }}>
          {mapEngine === 'SOVEREIGN_LOCAL'
            ? '100% SOUVERAIN (HORS-LIGNE)'
            : mapEngine === 'OSM_TILES'
            ? 'OPENSTREETMAP (CONNECTÉ)'
            : 'MAPLIBRE PMTILES DÉCONNECTÉ'}
        </span>
        <span style={{ color: isLight ? '#94A3B8' : '#475569' }}>•</span>
        <span style={{ color: mapEngine === 'SOVEREIGN_LOCAL' ? (isLight ? '#065F46' : '#A7F3D0') : (isLight ? '#475569' : '#94A3B8'), fontSize: '10px' }}>
          {mapEngine === 'SOVEREIGN_LOCAL'
            ? '0 Requête • 0 Clé API • Loi 18-07'
            : mapEngine === 'OSM_TILES'
            ? 'Tuiles OpenStreetMap Libres'
            : 'Byte-Range 206 Local'}
        </span>

        {/* Bouton de bascule rapide 1-clic */}
        <button
          onClick={() => {
            setMapEngine(mapEngine === 'OSM_TILES' ? 'SOVEREIGN_LOCAL' : 'OSM_TILES');
          }}
          aria-label="Basculer instantanément entre OpenStreetMap et le mode 100% Souverain Local"
          style={{
            marginLeft: '6px',
            padding: '2px 8px',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            border: `1px solid ${isLight ? '#CBD5E1' : '#475569'}`,
            background: isLight ? '#F1F5F9' : '#1E293B',
            color: isLight ? '#2563EB' : '#38BDF8',
          }}
          title="Basculer instantanément entre OpenStreetMap et le mode 100% Souverain Local"
        >
          {mapEngine === 'OSM_TILES' ? '⇄ Passer en Souverain Local' : '⇄ Activer OpenStreetMap'}
        </button>
      </div>

      {/* 4. CONTRÔLES FLOTTANTS DE NAVIGATION (HAUT-DROIT) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}
          title="Zoomer (+)"
          aria-label="Zoomer sur la carte (+)"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '4px',
            background: isLight ? '#FFFFFF' : '#111827',
            border: `1px solid ${isLight ? '#CBD5E1' : '#334155'}`,
            color: isLight ? '#0F172A' : '#F8FAFC',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isLight
              ? '0 2px 8px rgba(0, 0, 0, 0.08)'
              : '0 2px 8px rgba(0, 0, 0, 0.4)',
          }}
        >
          +
        </button>

        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}
          title="Dézoomer (-)"
          aria-label="Dézoomer sur la carte (-)"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '4px',
            background: isLight ? '#FFFFFF' : '#111827',
            border: `1px solid ${isLight ? '#CBD5E1' : '#334155'}`,
            color: isLight ? '#0F172A' : '#F8FAFC',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isLight
              ? '0 2px 8px rgba(0, 0, 0, 0.08)'
              : '0 2px 8px rgba(0, 0, 0, 0.4)',
          }}
        >
          -
        </button>

        <button
          onClick={() => setFollowVehicle(!followVehicle)}
          title={followVehicle ? 'Suivi caméra verrouillé sur véhicule' : 'Activer le mode suivi'}
          aria-label={followVehicle ? 'Désactiver le suivi caméra du véhicule' : 'Activer le suivi caméra du véhicule'}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '4px',
            background: followVehicle && selectedVehicle
              ? (isLight ? '#DBEAFE' : '#1E3A8A')
              : (isLight ? '#FFFFFF' : '#111827'),
            border: `1px solid ${
              followVehicle && selectedVehicle
                ? '#3B82F6'
                : isLight
                ? '#CBD5E1'
                : '#334155'
            }`,
            color: followVehicle && selectedVehicle
              ? (isLight ? '#1D4ED8' : '#93C5FD')
              : (isLight ? '#64748B' : '#94A3B8'),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isLight
              ? '0 2px 8px rgba(0, 0, 0, 0.08)'
              : '0 2px 8px rgba(0, 0, 0, 0.4)',
          }}
        >
          <IconCrosshair size={16} strokeWidth={2} />
        </button>

        <button
          onClick={recenterAlgeria}
          title="Recentrer sur la carte de l'Algérie"
          aria-label="Recentrer la carte sur le territoire national algérien"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '4px',
            background: isLight ? '#FFFFFF' : '#111827',
            border: `1px solid ${isLight ? '#CBD5E1' : '#334155'}`,
            color: isLight ? '#2563EB' : '#38BDF8',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isLight
              ? '0 2px 8px rgba(0, 0, 0, 0.08)'
              : '0 2px 8px rgba(0, 0, 0, 0.4)',
          }}
        >
          DZ
        </button>
      </div>

      {/* 5 & 6. CONTENEUR FLOTTANT BAS UNIFIÉ (CALQUES + TÉLÉMÉTRIE SANS AUCUNE SUPERPOSITION) */}
      <div
        suppressHydrationWarning
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 40,
          pointerEvents: 'none',
        }}
      >
        {/* LIGNE 1 : BARRE FLOTTANTE DE GESTION DES CALQUES */}
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '100%',
            background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(17, 24, 39, 0.94)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isLight ? '#CBD5E1' : '#334155'}`,
            borderRadius: '4px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: isLight ? '#334155' : '#CBD5E1',
            boxShadow: isLight
              ? '0 2px 8px rgba(0, 0, 0, 0.08)'
              : '0 4px 12px rgba(0, 0, 0, 0.5)',
            scrollbarWidth: 'none',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLight ? '#64748B' : '#64748B', borderRight: `1px solid ${isLight ? '#CBD5E1' : '#334155'}`, paddingRight: '8px', flexShrink: 0 }}>
            <IconLayers size={13} />
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calques</span>
          </div>

          {/* Sélecteur Moteur Cartographique Souverain */}
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={() => {
                setMapEngine('OSM_TILES');
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                border: `1px solid ${mapEngine === 'OSM_TILES' ? '#38BDF8' : isLight ? '#CBD5E1' : '#334155'}`,
                background: mapEngine === 'OSM_TILES'
                  ? (isLight ? '#E0F2FE' : '#0C4A6E')
                  : (isLight ? '#F1F5F9' : '#111827'),
                color: mapEngine === 'OSM_TILES'
                  ? (isLight ? '#0369A1' : '#BAE6FD')
                  : (isLight ? '#475569' : '#94A3B8'),
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
              }}
              title="Afficher les tuiles des rues OpenStreetMap (100% libre, aucune clé requise)"
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: mapEngine === 'OSM_TILES' ? '#38BDF8' : '#64748B',
                }}
              />
              <span>OpenStreetMap (OSM)</span>
            </button>

            <button
              onClick={() => {
                setMapEngine('SOVEREIGN_LOCAL');
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                border: `1px solid ${mapEngine === 'SOVEREIGN_LOCAL' ? '#10B981' : isLight ? '#CBD5E1' : '#334155'}`,
                background: mapEngine === 'SOVEREIGN_LOCAL'
                  ? (isLight ? '#ECFDF5' : '#064E3B')
                  : (isLight ? '#F1F5F9' : '#111827'),
                color: mapEngine === 'SOVEREIGN_LOCAL'
                  ? (isLight ? '#065F46' : '#A7F3D0')
                  : (isLight ? '#475569' : '#94A3B8'),
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
              }}
              title="Moteur Vectoriel Déconnecté 100% Hors-Ligne (Zéro requête externe, conforme Loi 18-07)"
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: mapEngine === 'SOVEREIGN_LOCAL' ? '#10B981' : '#64748B',
                }}
              />
              <span>100% Souverain Local</span>
            </button>

            <button
              onClick={() => {
                setMapEngine('PMTILES');
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '3px',
                border: `1px solid ${mapEngine === 'PMTILES' ? '#8B5CF6' : isLight ? '#CBD5E1' : '#334155'}`,
                background: mapEngine === 'PMTILES'
                  ? (isLight ? '#EDE9FE' : '#4C1D95')
                  : (isLight ? '#F1F5F9' : '#111827'),
                color: mapEngine === 'PMTILES'
                  ? (isLight ? '#6D28D9' : '#DDD6FE')
                  : (isLight ? '#475569' : '#94A3B8'),
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '10px',
                flexShrink: 0,
              }}
              title="Moteur MapLibre PMTiles Local (/maps/algeria.pmtiles)"
            >
              PMTiles Local
            </button>
          </div>

          {/* Sélecteur de Calques Cartographiques (Nuit / Jour / Satellite / Relief) */}
          {mapEngine === 'OSM_TILES' && (
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <button
                onClick={() => setMapTileLayer('OSM_DARK')}
                aria-label="Mode cartographique Cockpit Nuit"
                title="Cockpit Nuit (OSM sombre haute lisibilité)"
                style={{
                  padding: '3px 7px',
                  borderRadius: '3px',
                  border: `1px solid ${mapTileLayer === 'OSM_DARK' ? '#38BDF8' : isLight ? '#CBD5E1' : '#334155'}`,
                  background: mapTileLayer === 'OSM_DARK'
                    ? (isLight ? '#E0F2FE' : '#0C4A6E')
                    : (isLight ? '#F1F5F9' : '#111827'),
                  color: mapTileLayer === 'OSM_DARK'
                    ? (isLight ? '#0369A1' : '#BAE6FD')
                    : (isLight ? '#475569' : '#94A3B8'),
                  fontWeight: mapTileLayer === 'OSM_DARK' ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <IconMoon size={11} /> Nuit
              </button>

              <button
                onClick={() => setMapTileLayer('OSM_LIGHT')}
                aria-label="Mode cartographique Rues Jour"
                title="Rues Jour (OpenStreetMap classique)"
                style={{
                  padding: '3px 7px',
                  borderRadius: '3px',
                  border: `1px solid ${mapTileLayer === 'OSM_LIGHT' ? '#38BDF8' : isLight ? '#CBD5E1' : '#334155'}`,
                  background: mapTileLayer === 'OSM_LIGHT'
                    ? (isLight ? '#E0F2FE' : '#0C4A6E')
                    : (isLight ? '#F1F5F9' : '#111827'),
                  color: mapTileLayer === 'OSM_LIGHT'
                    ? (isLight ? '#0369A1' : '#BAE6FD')
                    : (isLight ? '#475569' : '#94A3B8'),
                  fontWeight: mapTileLayer === 'OSM_LIGHT' ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <IconSun size={11} /> Rues
              </button>

              <button
                onClick={() => setMapTileLayer('SATELLITE')}
                aria-label="Mode cartographique Vue Satellite Orthophoto"
                title="Imagerie Satellite Orthophoto Haute Définition (Esri / Maxar)"
                style={{
                  padding: '3px 7px',
                  borderRadius: '3px',
                  border: `1px solid ${mapTileLayer === 'SATELLITE' ? '#10B981' : isLight ? '#CBD5E1' : '#334155'}`,
                  background: mapTileLayer === 'SATELLITE'
                    ? (isLight ? '#ECFDF5' : '#064E3B')
                    : (isLight ? '#F1F5F9' : '#111827'),
                  color: mapTileLayer === 'SATELLITE'
                    ? (isLight ? '#065F46' : '#A7F3D0')
                    : (isLight ? '#475569' : '#94A3B8'),
                  fontWeight: mapTileLayer === 'SATELLITE' ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <IconGlobe size={11} /> Satellite
              </button>

              <button
                onClick={() => setMapTileLayer('RELIEF_TOPO')}
                aria-label="Mode cartographique Relief et Topographie"
                title="Relief Topographique, Courbes de niveau & Dénivelés (OpenTopoMap / SRTM)"
                style={{
                  padding: '3px 7px',
                  borderRadius: '3px',
                  border: `1px solid ${mapTileLayer === 'RELIEF_TOPO' ? '#F59E0B' : isLight ? '#CBD5E1' : '#334155'}`,
                  background: mapTileLayer === 'RELIEF_TOPO'
                    ? (isLight ? '#FEF3C7' : '#78350F')
                    : (isLight ? '#F1F5F9' : '#111827'),
                  color: mapTileLayer === 'RELIEF_TOPO'
                    ? (isLight ? '#B45309' : '#FDE68A')
                    : (isLight ? '#475569' : '#94A3B8'),
                  fontWeight: mapTileLayer === 'RELIEF_TOPO' ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <IconMountain size={11} /> Relief Topo
              </button>
            </div>
          )}

          {/* Toggle Pôles & Hubs Stratégiques */}
          <button
            onClick={() => setShowHubs(!showHubs)}
            style={{
              padding: '3px 8px',
              borderRadius: '3px',
              border: `1px solid ${showHubs ? '#F59E0B' : isLight ? '#CBD5E1' : '#334155'}`,
              background: showHubs
                ? (isLight ? '#FEF3C7' : '#78350F')
                : (isLight ? '#F1F5F9' : 'transparent'),
              color: showHubs
                ? (isLight ? '#B45309' : '#FDE68A')
                : (isLight ? '#475569' : '#64748B'),
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '10px',
              flexShrink: 0,
            }}
            title="Afficher/Masquer les pôles logistiques, énergétiques et portuaires"
          >
            Hubs DZ ({STRATEGIC_HUBS.length})
          </button>

          {/* Toggle Géorepérage */}
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            style={{
              padding: '3px 8px',
              borderRadius: '3px',
              border: `1px solid ${showGeofences ? '#2563EB' : isLight ? '#CBD5E1' : '#334155'}`,
              background: showGeofences
                ? (isLight ? '#EFF6FF' : '#1E3A8A')
                : (isLight ? '#F1F5F9' : 'transparent'),
              color: showGeofences
                ? (isLight ? '#1D4ED8' : '#BFDBFE')
                : (isLight ? '#475569' : '#64748B'),
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '10px',
              flexShrink: 0,
            }}
          >
            Géorepérage ({geofences.length})
          </button>

          {/* Toggle Tracé 15m */}
          <button
            onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
            style={{
              padding: '3px 8px',
              borderRadius: '3px',
              border: `1px solid ${showBreadcrumbs ? '#059669' : isLight ? '#CBD5E1' : '#334155'}`,
              background: showBreadcrumbs
                ? (isLight ? '#ECFDF5' : '#064E3B')
                : (isLight ? '#F1F5F9' : 'transparent'),
              color: showBreadcrumbs
                ? (isLight ? '#065F46' : '#A7F3D0')
                : (isLight ? '#475569' : '#64748B'),
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '10px',
              flexShrink: 0,
            }}
          >
            Trace 15m
          </button>

          {/* Toggle Corridors */}
          <button
            onClick={() => setShowCorridors(!showCorridors)}
            style={{
              padding: '3px 8px',
              borderRadius: '3px',
              border: `1px solid ${showCorridors ? '#0284C7' : isLight ? '#CBD5E1' : '#334155'}`,
              background: showCorridors
                ? (isLight ? '#E0F2FE' : '#0C4A6E')
                : (isLight ? '#F1F5F9' : 'transparent'),
              color: showCorridors
                ? (isLight ? '#0369A1' : '#BAE6FD')
                : (isLight ? '#475569' : '#64748B'),
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '10px',
              flexShrink: 0,
            }}
          >
            Corridors RN/A1
          </button>
        </div>

        {/* LIGNE 2 : BARRE BASSE COMPLÈTE DE TÉLÉMÉTRIE & DONNÉES GÉOSPATIALES */}
        <div
          style={{
            width: '100%',
            height: '28px',
            background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isLight ? '#CBD5E1' : '#334155'}`,
            borderRadius: '4px',
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            color: isLight ? '#64748B' : '#94A3B8',
            boxShadow: isLight
              ? '0 2px 8px rgba(0, 0, 0, 0.08)'
              : '0 4px 12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            pointerEvents: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Données de Zoom & Coordonnées GPS Curseur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ flexShrink: 0 }}>
              Zoom: <strong style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}>{zoom.toFixed(1)}x</strong>
            </span>
            <span style={{ color: isLight ? '#CBD5E1' : '#475569', flexShrink: 0 }}>•</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              GPS: <strong ref={cursorCoordsRef} style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}>
                Survolez la carte pour les coordonnées
              </strong>
            </span>
          </div>

          {/* Attribution Cartographique & Souveraineté */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isOsmActive && (
              <>
                <span style={{ fontSize: '9px', color: isLight ? '#64748B' : '#94A3B8', whiteSpace: 'nowrap' }}>
                  {mapTileLayer === 'SATELLITE' ? (
                    <>
                      Imagerie © <a href="https://www.esri.com" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>Esri</a>, Maxar, Earthstar
                    </>
                  ) : mapTileLayer === 'RELIEF_TOPO' ? (
                    <>
                      Relief © <a href="https://opentopomap.org" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>OpenTopoMap</a> &amp; OSM
                    </>
                  ) : (
                    <>
                      © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>OpenStreetMap</a>
                    </>
                  )}
                </span>
                <span style={{ color: isLight ? '#CBD5E1' : '#475569' }}>•</span>
              </>
            )}
            <span style={{ color: '#10B981', fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              SOUVERAINETÉ GNSS • DZ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
