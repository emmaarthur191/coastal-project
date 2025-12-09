// Service Worker for caching React chunks and static assets
const CACHE_NAME = 'coastal-banking-v1';
const STATIC_CACHE = 'coastal-static-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Cache chunks and assets on install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
    ]).then(() => {
      console.log('[SW] Service worker installed');
      return self.skipWaiting();
    })
  );
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Handle fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Handle different types of requests
  if (url.pathname.startsWith('/assets/')) {
    // Cache JavaScript chunks, CSS, and other assets
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version but also update cache in background
            fetch(request).then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
            }).catch(() => {
              // Network failed, but we have cache - that's fine
            });
            return cachedResponse;
          }

          // Not in cache, fetch from network
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Network failed and not in cache
            return new Response('Offline - Asset not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        });
      })
    );
  } else if (url.pathname === '/' || url.pathname === '/index.html') {
    // Handle main app shell
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match('/').then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request);
        });
      })
    );
  } else if (!url.pathname.startsWith('/api/') &&
             !url.pathname.startsWith('/admin/') &&
             !url.pathname.startsWith('/static/') &&
             !url.pathname.startsWith('/media/')) {
    // Handle other app routes (SPA routing)
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match('/').then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request);
        });
      })
    );
  }
  // Let API calls, admin routes, and media files pass through to network
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting');
    self.skipWaiting();
  }
});