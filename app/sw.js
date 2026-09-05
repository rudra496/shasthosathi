// ShasthoSathi service worker — offline-first app shell + data.
const CACHE = "shasthosathi-v3";
const ASSETS = [
  "./", "./index.html", "./triage.html", "./register.html", "./followups.html",
  "./maternal.html", "./reader.html", "./camp.html", "./sms.html", "./learn.html", "./dashboard/index.html",
  "./assets/css/app.css",
  "./assets/js/app.js", "./assets/js/i18n.js", "./assets/js/engine.js",
  "./assets/js/scheduler.js", "./assets/js/store.js", "./assets/js/voice.js",
  "./assets/js/dashboard.js", "./assets/js/risk.js", "./assets/js/sms.js",
  "./assets/js/vendor/leaflet/leaflet.js", "./assets/js/vendor/leaflet/leaflet.css",
  "./manifest.webmanifest",
  "./data/dengue_monthly_2023.json", "./data/dengue_annual.json",
  "./data/weather_dhaka_monthly.json", "./data/forecast.json",
  "./data/division_population.json", "./data/clinical_content.json",
  "./data/divisions.geojson", "./data/dengue_decade_2014_2023.json", "./data/hotlines.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // app shell + data: NETWORK-FIRST (bypass HTTP cache), fall back to SW cache offline.
  // (Cache-first let stale subresources survive deploys via the HTTP cache — v2 lesson.)
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request, { cache: "no-cache" }).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || Response.error())
      )
    );
    return;
  }
  // cross-origin (CDN OCR etc.): network-first with runtime cache fallback
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
