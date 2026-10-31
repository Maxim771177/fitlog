/* FitLog Duo — service worker: приложение открывается мгновенно и работает без сети.
 * Оболочка (index.html, иконки, манифест) берётся из кэша и тихо обновляется в фоне.
 * Запросы к Google Apps Script (данные, запись подходов) НЕ кэшируются. */
const CACHE = "fitlog-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // данные Google — только по сети
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return cached || (await fresh) || (req.mode === "navigate" ? cache.match("index.html") : Response.error());
    })
  );
});
