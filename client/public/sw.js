const CACHE_NAME = 'ngo-learn-shell-v3';
const APP_SHELL = ['/', '/manifest.json'];
const IS_LOCAL = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
    if (!IS_LOCAL) return;
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map((client) => client.navigate(client.url).catch(() => undefined)));
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/videos/') || event.request.headers.has('range')) return;

  const isAppCode = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/@') || url.pathname.startsWith('/assets/');
  if (isAppCode) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(async () => (await caches.match(event.request)) || (await caches.match('/')) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }))));
});
