// Service Worker Offline para Meta Quest 3S (360pajarillo + Santuario 3D)
const CACHE_NAME = 'pajarillo-360-vr-v1.5.3';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/vr-360.css?v=1.5.3',
  './js/aframe.min.js',
  './js/hotspots-data.js?v=1.5.3',
  './js/app-360.js?v=1.5.3',
  './assets/images/foto_360_magina.jpg',
  './assets/images/foto_360_miramundos.jpg',
  './assets/images/logo-pajarillo-white.png',
  './assets/images/logo-ayuntamiento-huelma-white.png',
  './assets/images/logo-pajarillo.png',
  './assets/images/logos/01-union-europea.png',
  './assets/images/logos/02-ministerio-hacienda.png',
  './assets/images/logos/03-fondos-europeos.png',
  './assets/images/logos/04-junta-andalucia.png',
  './assets/images/logos/05-ayuntamiento-huelma.png',
  './assets/models/santuario_pajarillo_vr.glb'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW Offline] Pre-cacheando experiencia completa para Meta Quest...');
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
