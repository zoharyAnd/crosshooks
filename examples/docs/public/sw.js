// Minimal service worker for the crosshooks demo.
// Its main job here is to exist with a fetch handler — that, plus a valid
// manifest served over HTTPS, is what lets the browser fire
// `beforeinstallprompt`. It also provides a tiny offline fallback for '/'.

const CACHE = 'crosshooks-demo-v1';
const OFFLINE_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Network-first for navigations, falling back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/', { ignoreSearch: true })),
    );
    return;
  }
});
