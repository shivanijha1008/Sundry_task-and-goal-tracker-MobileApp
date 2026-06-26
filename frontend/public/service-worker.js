/* Sundry — minimal service worker
   Strategy: cache-first for same-origin static assets + navigation fallback.
   This is intentionally small. We do NOT cache /api/* responses. */

const CACHE = "sundry-static-v1";
const PRECACHE = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/logo-mark.png",
  "/favicon-32.png",
  "/favicon-16.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      // Best-effort precache; ignore individual failures
      Promise.all(
        PRECACHE.map((url) =>
          c.add(url).catch(() => {
            /* ignore */
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Never intercept API calls
  if (url.pathname.startsWith("/api/")) return;
  // Skip cross-origin
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first, fallback to cached "/"
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
