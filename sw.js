// Service worker: pre-cache the app shell so it opens offline. Bump VERSION on every deploy.
const VERSION = 'v6';
const CACHE = 'bhl-year-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/backup.js',
  './js/benchmarks.js',
  './js/calendar.js',
  './js/engine.js',
  './js/format.js',
  './js/main.js',
  './js/nutrition.js',
  './js/program/days.js',
  './js/program/index.js',
  './js/program/rotations.js',
  './js/program/schemes.js',
  './js/store.js',
  './js/ui/days.js',
  './js/ui/dom.js',
  './js/ui/router.js',
  './js/ui/scorecard.js',
  './js/ui/settings.js',
  './js/ui/today.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
