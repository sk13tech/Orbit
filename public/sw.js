const CACHE_NAME = "orbit-v3";
const PRECACHE = ["/logo.png", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache navigations / HTML / API responses / non-GET
  if (
    e.request.method !== "GET" ||
    e.request.mode === "navigate" ||
    url.pathname.startsWith("/api/") ||
    e.request.destination === "document"
  ) {
    return;
  }

  // Only cache static same-origin assets
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((r) => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return r;
      });
    })
  );
});
