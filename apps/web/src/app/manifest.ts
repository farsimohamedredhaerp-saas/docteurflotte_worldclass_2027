import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DocteurFlotte — Plateforme Souveraine de Télémétrie & Maintenance 5.0',
    short_name: 'DocteurFlotte',
    description:
      'Plateforme souveraine de télémétrie, maintenance 5.0 et inspections DVIR Offline-First pour la flotte algérienne (58 Wilayas).',
    start_url: '/dvir',
    display: 'standalone',
    background_color: '#080b11',
    theme_color: '#0284c7',
    icons: [
      {
        src: '/current_hud_screenshot.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
