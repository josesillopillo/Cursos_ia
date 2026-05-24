const CACHE_NAME = 'ia-courses-v3';
const urlsToCache = [
  '/manifest.json',
  '/css/styles.css',
  '/css/perfil.css',
  '/js/script.js',
  '/js/perfil.js',
  '/js/curso.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for HTML and JS
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Cache-first for other static assets (CSS, images, etc.)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
