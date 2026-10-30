/**
 * DLIskills service worker (M25 — design: docs/SPEC.md §5.5). Serves
 * Conjuga at the root and 📚 Cuentos under cuentos/ (docs/CUENTOS.md;
 * registered by both apps, same root scope). Hand-written;
 * the site has no build step, so every shell file below is unhashed:
 * the shell is NETWORK-FIRST with cache fallback (freshness beats speed —
 * stale-while-revalidate could pair a new app.js with a stale game.js).
 * Audio clips are CACHE-FIRST lookups in the per-group `audio-gNN` caches
 * that ONLY the Descargas UI populates — this worker never fills them.
 * Navigations fall back to the cached shell with ignoreSearch ONLY when
 * the network fails; online, querystrings like ?m18demo=1 pass through
 * untouched.
 */

// Bump on any shell-file change that must invalidate old caches.
const VERSION = "shell-v5";
const AUDIO_PREFIX = "audio-g";

const SHELL = [
  "index.html",
  "about.html",
  "manifest.webmanifest",
  "css/styles.css",
  "css/tokens.css",
  "css/redesign.css",
  "js/app.js",
  "js/audio.js",
  "js/beacon.js",
  "js/conjugator.js",
  "js/descargas.js",
  "js/game.js",
  "js/mascot-jersey.js",
  "js/mascot.js",
  "js/menu.js",
  "js/nido.js",
  "js/standards-info.js",
  "js/static-menu.js",
  "js/storage.js",
  "js/verbs.js",
  "js/vuelo.js",
  "audio/manifest.json",
  // 📚 Cuentos shell — list every file explicitly (no build step)
  "cuentos/",
  "cuentos/index.html",
  "cuentos/css/cuentos.css",
  "cuentos/js/app.js",
  "cuentos/js/activities.js",
  "cuentos/js/reader.js",
  "cuentos/js/standards-info.js",
  "cuentos/js/stories.js",
  "cuentos/js/storage.js",
  "cuentos/js/data/leon-raton.js",
  "cuentos/js/data/liebre-tortuga.js",
  "cuentos/js/data/pobre-viejecita.js",
  "cuentos/js/data/tortuga-gigante.js",
  "cuentos/js/data/muneca-negra.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== VERSION && !k.startsWith(AUDIO_PREFIX)).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function audioLookup(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  return fetch(req);
}

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw err;
  }
}

async function navigate(req) {
  try {
    return await networkFirst(req);
  } catch {
    // OFFLINE ONLY: ignoreSearch so /?m18demo=1 still reaches the shell.
    // Each app falls back to its OWN shell (Cuentos lives under cuentos/).
    const cache = await caches.open(VERSION);
    const inCuentos = new URL(req.url).pathname.includes("/cuentos/");
    return (await cache.match(req, { ignoreSearch: true }))
      || (await cache.match(inCuentos ? "cuentos/index.html" : "index.html"))
      || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith(".mp3")) {
    event.respondWith(audioLookup(req));
  } else if (req.mode === "navigate") {
    event.respondWith(navigate(req));
  } else {
    event.respondWith(networkFirst(req).catch(() => Response.error()));
  }
});
