// Déclarations ambiantes pour les bibliothèques cartographiques souveraines
// (MapLibre GL JS, PMTiles et Protomaps Basemaps)
declare module 'maplibre-gl' {
  const content: any;
  export default content;
  export const NavigationControl: any;
  export const Map: any;
  export const addProtocol: any;
}

declare module 'pmtiles' {
  export class Protocol {
    tile: (params: any, callback: any) => any;
  }
}

declare module '@protomaps/basemaps' {
  export function namedFlavor(name: string): any;
  export function layers(source: string, theme: any, options?: any): any[];
}
