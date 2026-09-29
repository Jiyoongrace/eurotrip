// 오프라인 캐시: 앱 화면·라이브러리는 캐시 우선, 지도 타일은 본 적 있는 것만 오프라인에서 재사용
const APP = "eurotrip-app-v4";
const TILES = "eurotrip-tiles-v2";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname === "tile.openstreetmap.org" || url.hostname.endsWith("wikimedia.org")) {
    e.respondWith(caches.open(TILES).then(async c => {
      try { const r = await fetch(e.request); c.put(e.request, r.clone()); return r; }
      catch { return (await c.match(e.request)) || Response.error(); }
    }));
    return;
  }
  if (url.origin === location.origin || url.hostname === "cdnjs.cloudflare.com" || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")) {
    // 앱 파일: 네트워크 우선(수정사항 반영), 실패하면 캐시
    e.respondWith(caches.open(APP).then(async c => {
      try { const r = await fetch(e.request); if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }
      catch { return (await c.match(e.request, {ignoreSearch:true})) || (await c.match("./index.html")) || Response.error(); }
    }));
  }
});
