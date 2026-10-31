// MAMBA service worker: makes the course installable as an app and usable offline.
// Pages and the search index: network first (fresh when online), falling back to the saved copy.
// Site files: served from the saved copy and refreshed in the background.
// Maths fonts, KaTeX and Plotly from the CDN: saved after first use (their addresses carry a version).
const VERSION = "__VERSION__";
const SITE = "mamba-site-" + VERSION;
const CDN = "mamba-cdn-v1";
const CORE = ["./", "index.html", "lessons.html", "offline.html", "static/css/site.css", "static/js/site.js", "static/js/app.js",
  "static/img/icon.svg", "static/img/app-192.png", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SITE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("mamba-site-") && k !== SITE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(SITE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === "navigate") return caches.match("offline.html");
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(SITE);
  const hit = await caches.match(req, { ignoreSearch: true });
  const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || fresh;
}

async function cacheFirst(req) {
  const cache = await caches.open(CDN);
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return;                 // accounts: always live
  if (url.hostname === "cdn.jsdelivr.net" || url.hostname === "fonts.gstatic.com") { e.respondWith(cacheFirst(req)); return; }
  if (url.hostname === "fonts.googleapis.com") { e.respondWith(staleWhileRevalidate(req)); return; }
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/") || url.pathname.endsWith("search.json")) {
    e.respondWith(networkFirst(req)); return;
  }
  e.respondWith(staleWhileRevalidate(req));
});
