const CACHE_NAME = 'cinemetrics-v2';
const OFFLINE_URL = '/offline.html';

// Cache the shell on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/', '/index.html', OFFLINE_URL])
    )
  );
  self.skipWaiting();
});

// Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // API calls: network-first, no cache fallback
  if (url.hostname.includes('themoviedb.org') ||
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('omdbapi.com') ||
      url.hostname.includes('watchmode.com') ||
      url.hostname.includes('anthropic.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // TMDB images: cache-first (they never change)
  if (url.hostname.includes('image.tmdb.org')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // App shell: network-first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) =>
          cached || (e.request.mode === 'navigate' ? caches.match(OFFLINE_URL) : new Response('', { status: 404 }))
        )
      )
  );
});
