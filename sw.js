// Mohjeta Picks offline helper: the app shell is cached; picks data is always fetched fresh and
// falls back to the last copy only when the phone is offline.
const SHELL = 'mohjeta-shell-legs-v37';
// fix464 (owner, Nov 15 2026: "When my signal is bad the site won't load ... android doesn't load logos"). On a weak
// signal a request can hang for a minute before it fails, so "network first" alone left a blank page and empty logos.
// Now: the page and its files answer from the phone's copy if the network is slow (3.5 s), pictures (team portraits,
// logos, icons) come straight from the phone's copy once seen, and picks data (this site and data.mohjeta.com) waits
// 5 s for fresh data, then shows the last copy. Fresh copies are still fetched in the background every time.
const IMG = 'mohjeta-img-v1', DATA = 'mohjeta-data';
const FILES = ['./languages.js?v=13', './languages.css?v=4', './game-matchups.js?v=3', './game-matchups.css?v=3', './live-data.js?v=3', './community.css?v=1', './mohjeta-icons.js?v=10', './mohjeta-icons.css?v=8', './sounds.js?v=2', './intro.js?v=3', './intro.css?v=3', './sport-art.js?v=2', './logo-cut.webp?v=2', './notification-badge.png', './nba-sim.js?v=nba-lineups-v1', './nba-sim-ui.js?v=nba-lineups-v1', './', './index.html', './manifest.webmanifest', './icon-192.png?v=mohjeta-black-v1', './icon-512.png?v=mohjeta-black-v1', './apple-touch-icon.png?v=mohjeta-black-v1'];
const DATA_HOSTS = ['data.mohjeta.com'];
self.addEventListener('install', e => {   // one missing file never stops the others from being saved
  e.waitUntil(caches.open(SHELL).then(c => Promise.allSettled(FILES.map(f => c.add(f)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![SHELL, IMG, DATA].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const late = (ms) => new Promise(res => setTimeout(() => res(null), ms));
function save(name, key, r) { if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(name).then(c => c.put(key, copy)).catch(() => {}); } return r; }
// fresh copy if it arrives within `ms`, else the saved copy; with no saved copy, keep waiting for the network
function freshOrSaved(e, name, key, ms, opts) {
  const net = (opts ? fetch(e.request.url, opts) : fetch(e.request)).then(r => save(name, key, r));
  e.waitUntil(net.catch(() => {}));
  return Promise.race([net.catch(() => null), late(ms)]).then(r => r || caches.match(key, {ignoreVary: true}).then(c => c || net))
    .catch(() => caches.match(key, {ignoreVary: true}).then(c => c || Response.error()));
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const same = url.origin === location.origin;
  if (!same && !DATA_HOSTS.includes(url.hostname)) return;
  if (/\.json$/.test(url.pathname)) {                     // picks data: fresh within 5 s, else the last copy
    e.respondWith(freshOrSaved(e, DATA, url.origin + url.pathname, 5000));
    return;
  }
  if (!same) return;
  if (/\.(webp|png|jpe?g|svg|gif)$/.test(url.pathname)) {   // pictures: the phone's copy first, refreshed quietly
    e.respondWith(caches.match(e.request, {ignoreVary: true}).then(hit => {
      const net = fetch(e.request).then(r => save(IMG, e.request, r));
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.catch(() => Response.error());
    }));
    return;
  }
  if (e.request.mode === 'navigate') {                       // the page: fresh within 3.5 s, else the saved page
    e.respondWith(freshOrSaved(e, SHELL, './index.html', 3500, {cache: 'no-cache', credentials: 'same-origin'}));
    return;
  }
  if (/\.(js|css|webmanifest)$/.test(url.pathname)) {        // the page's files: the phone's copy first, refreshed quietly
    e.respondWith(caches.match(e.request, {ignoreVary: true}).then(hit => {
      const net = fetch(e.request).then(r => save(SHELL, e.request, r));
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.catch(() => Response.error());
    }));
    return;
  }
  e.respondWith(freshOrSaved(e, SHELL, e.request, 3500));
});

// phone alerts (Web Push): show the alert; tapping it opens (or focuses) the site at the right spot
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification((d.title || 'Mohjeta').replace(/^[\s🔄📈📉⏰✅❌🏀➖\uFE0F]+/u, '') || 'Mohjeta', {
    body: d.body || '', icon: 'icon-192.png', badge: 'notification-badge.png', tag: d.tag || undefined, data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ('focus' in w) { if ('navigate' in w) w.navigate(url); return w.focus(); } }
    return clients.openWindow(url);
  }));
});
