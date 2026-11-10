/* FLIPDESK service worker: mínimo para instalar la app y mostrar una página sin conexión.
 * No guarda en caché páginas con datos del usuario (privacidad); solo archivos estáticos. */
const VERSION = "flipdesk-v1";
const PRECACHE = ["/offline.html", "/iconos/icono-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: siempre a la red; si no hay señal, la página sin conexión.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Archivos estáticos con hash: caché primero.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/iconos/")) {
    event.respondWith(
      caches.match(request).then(
        (enCache) =>
          enCache ||
          fetch(request).then((resp) => {
            if (resp.ok) {
              const copia = resp.clone();
              caches.open(VERSION).then((c) => c.put(request, copia));
            }
            return resp;
          }),
      ),
    );
  }
});
