// DocteurFlotte Sovereign PWA Service Worker (v1.1.0)
// Conforme Loi 18-07 ANPDP : Zéro cache sortant, 100% hébergement local air-gapped
// Stratégie : Network-First pour les navigations HTML (garantit zéro jank de mise à jour), Offline Fallback

const CACHE_NAME = 'df-sovereign-cache-v2';
const OFFLINE_URL = '/dvir';

const PRECACHE_ASSETS = [
  '/',
  '/dvir',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorer les requêtes d'API dynamiques, HMR Turbopack et chunks internes Next.js
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return;
  }

  // Navigations HTML : Network-First systématique (fraîcheur garantie en ligne), fallback cache hors-ligne
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Autres ressources : Network-First avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
