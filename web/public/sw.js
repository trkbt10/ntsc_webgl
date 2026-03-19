/**
 * Service Worker — NTSC Cam PWA
 *
 * Strategy:
 *   - Navigation requests (HTML): Network-first, cache fallback for offline.
 *   - Hashed assets (/assets/*): Cache-first (immutable by Vite hash).
 *   - Everything else: Network-only (manifest, icons, SW itself — never stale).
 *
 * Auto-update flow:
 *   1. Browser checks for new sw.js on every navigation (24h at most).
 *   2. If byte-different → install event fires.
 *   3. skipWaiting() activates immediately (no waiting for old tabs to close).
 *   4. activate cleans ALL old caches.
 *   5. clients.claim() takes control of open tabs.
 *   6. Client-side listener detects controllerchange → reloads page.
 */

// Cache names — bumped automatically when sw.js content changes (new deploy).
const SHELL_CACHE = "ntsc-shell-v1";
const ASSET_CACHE = "ntsc-assets-v1";

self.addEventListener("install", (event) => {
  // Take over immediately — don't wait for old SW to release.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Don't cache cross-origin or browser-extension requests
  if (url.origin !== self.location.origin) return;

  // ── Hashed assets (Vite: /assets/index-XXXX.js, /assets/index-XXXX.css) ──
  // These are content-addressed — safe to cache permanently.
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // ── Navigation requests (HTML pages) ──
  // Network-first: always try to get fresh HTML so new deploys take effect.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh HTML for offline fallback
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── Other same-origin requests (manifest, icons, wasm, etc.) ──
  // Network-first with cache fallback — keeps them fresh.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
