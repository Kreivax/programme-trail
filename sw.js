const CACHE = 'kairn-v2';
const ASSETS = [
  '/programme-trail/',
  '/programme-trail/index.html',
  '/programme-trail/manifest.json',
  '/programme-trail/icon.svg',
  '/programme-trail/icon-192.png',
  '/programme-trail/icon-512.png',
];

// Install — précharge les assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.filter(u => !u.endsWith('.png'))))
      .then(() => self.skipWaiting())
  );
});

// Activate — purge les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first pour les assets locaux, network first pour les polices Google
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Polices Google : network first, fallback cache
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets locaux : cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (!r || r.status !== 200 || r.type === 'opaque') return r;
        const c = r.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, c));
        return r;
      });
    })
  );
});
