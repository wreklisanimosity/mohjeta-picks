// Mohjeta Picks offline helper: the app shell is cached; picks data is always fetched fresh and
// falls back to the last copy only when the phone is offline.
const SHELL = 'mohjeta-shell-nba-lineups-v1';
const FILES = ['./nba-sim.js?v=nba-lineups-v1', './nba-sim-ui.js?v=nba-lineups-v1', './', './index.html', './manifest.webmanifest', './icon-192.png?v=mohjeta-m-20261030', './icon-512.png?v=mohjeta-m-20261030', './apple-touch-icon.png?v=mohjeta-m-20261030'];
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

// phone alerts (Web Push): show the alert; tapping it opens (or focuses) the site at the right spot
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Mohjeta', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || undefined, data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ('focus' in w) { if ('navigate' in w) w.navigate(url); return w.focus(); } }
    return clients.openWindow(url);
  }));
});
