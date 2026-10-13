const CACHE = 'benchmark-v11';
const CHART = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
const LOCAL = ['./', 'index.html', 'manifest.json', 'icon.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(LOCAL);
    try { const r = await fetch(CHART); if (r.ok) await cache.put(CHART, r); } catch (err) {}
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Risponde subito dalla copia salvata e intanto aggiorna la copia in background
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) cache.put(e.request, r.clone());
      return r;
    }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
