// Guarda la app en el iPhone para que funcione sin internet.
const V = 'entrena-v1';
const CORE = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'js/app.js', 'js/exercises.js', 'js/figure.js', 'js/workouts.js', 'js/voice.js', 'js/coach.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/mediapipe/vision_bundle.mjs', 'vendor/mediapipe/vision_wasm_internal.js', 'vendor/mediapipe/vision_wasm_internal.wasm',
  'vendor/mediapipe/pose_landmarker_full.task',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Red primero para el código (así llegan las actualizaciones); caché si no hay conexión
  const url = new URL(e.request.url);
  const heavy = url.pathname.includes('/vendor/');
  e.respondWith(
    heavy
      ? caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put(e.request, cp)); return res; }))
      : fetch(e.request).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
