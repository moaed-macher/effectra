// Effectra – Blitzstart: hält die App-Dateien auf dem Gerät.
// index.html kommt immer zuerst aus dem Netz (damit Updates sofort da sind), nur offline aus dem Speicher.
// Dateien mit Versionsnummer (?v=…, auch vendor/supabase.js) kommen direkt aus dem Speicher.
// Fremde Adressen (Supabase-Daten) und version.json laufen nie über den Speicher –
// der Service Worker darf wegen der CSP (connect-src) keine fremden Server abrufen.
const CACHE = 'effectra-4.0.0';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function fromCache(req) {
  return caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') c.put(req, res.clone());
    return res;
  })));
}
function networkFirst(req) {
  const net = fetch(req).then((res) => {
    if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
    return res;
  });
  const slow = new Promise((resolve) => setTimeout(resolve, 3500)).then(() => caches.match(req));
  return Promise.race([net.catch(() => caches.match(req)), slow.then((hit) => hit || net)])
    .then((res) => res || net);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) return;
    if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) { e.respondWith(networkFirst(req)); return; }
    if (url.search.includes('v=') || url.pathname.includes('/icons/') || url.pathname.endsWith('.webmanifest')) { e.respondWith(fromCache(req)); return; }
  }
});
