// Mohjeta Picks offline helper: the app shell is cached; picks data is always fetched fresh and
// falls back to the last copy only when the phone is offline.
const SHELL = 'mohjeta-shell-mohjeta-m-20261030';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png?v=mohjeta-m-20261030', './icon-512.png?v=mohjeta-m-20261030', './apple-touch-icon.png?v=mohjeta-m-20261030'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== 'mohjeta-data').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (/\.json$/.test(url.pathname)) {               // data: network first, last copy when offline
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open('mohjeta-data').then(c => c.put(url.pathname, copy)); return r; })
      .catch(() => caches.match(url.pathname)));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
