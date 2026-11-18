// Déclarations ambiantes pour les bibliothèques cartographiques souveraines
// (MapLibre GL JS, PMTiles et Protomaps Basemaps)
declare module 'maplibre-gl' {
  export interface MapOptions {
    container: string | HTMLElement;
    style?: string | Record<string, unknown>;
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    pitch?: number;
    bearing?: number;
    maxBounds?: [[number, number], [number, number]];
  }

  export class NavigationControl {
    constructor(options?: { showCompass?: boolean; showZoom?: boolean; visualizePitch?: boolean });
  }

  export class Marker {
    constructor(options?: { element?: HTMLElement; anchor?: string; color?: string });
    setLngLat(lnglat: [number, number]): this;
    addTo(map: Map): this;
    remove(): this;
  }

  export class Popup {
    constructor(options?: { offset?: number | [number, number]; closeButton?: boolean; closeOnClick?: boolean });
    setLngLat(lnglat: [number, number]): this;
    setHTML(html: string): this;
    addTo(map: Map): this;
    remove(): this;
  }

  export class Map {
    constructor(options: MapOptions);
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    remove(): void;
    flyTo(options: { center: [number, number]; zoom?: number; pitch?: number; bearing?: number; essential?: boolean }): void;
    addControl(control: unknown, position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'): void;
    getSource(id: string): unknown;
    addSource(id: string, source: unknown): void;
    addLayer(layer: unknown, beforeId?: string): void;
    resize(): void;
  }

  export function addProtocol(
    customProtocol: string,
    loadFn: (requestParameters: { url: string }, callback: (error?: Error | null, data?: ArrayBuffer | null) => void) => { cancel: () => void }
  ): void;

  const content: {
    Map: typeof Map;
    NavigationControl: typeof NavigationControl;
    Marker: typeof Marker;
    Popup: typeof Popup;
    addProtocol: typeof addProtocol;
  };
  export default content;
}

declare module 'pmtiles' {
  export class Protocol {
    tile: (params: { url: string }, callback: (error?: Error | null, data?: ArrayBuffer | null) => void) => { cancel: () => void };
  }
}

declare module '@protomaps/basemaps' {
  export type FlavorTheme = 'light' | 'dark' | 'white' | 'grayscale' | 'black';
  export function namedFlavor(name: string): Record<string, unknown>;
  export function layers(
    source: string,
    theme: string | Record<string, unknown>,
    options?: Record<string, unknown>
  ): Array<Record<string, unknown>>;
}
