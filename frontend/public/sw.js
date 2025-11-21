/**
 * Service Worker for Coastal Auto Tech Cooperative Credit Union Login Portal
 * Provides offline functionality, caching, and background sync
 */

// Version number for cache busting
const CACHE_NAME = 'coastal-credit-union-v1.0.0';

// Files to cache for offline functionality
const CACHE_FILES = [
  '/',
  '/login',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Add other critical resources
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/auth/validate-session',
  '/api/user/profile'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isAPIRequest(url)) {
    // Handle API requests with network-first strategy
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    // Handle navigation requests
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(url)) {
    // Handle static assets with cache-first strategy
    event.respondWith(handleStaticAsset(request));
  } else {
    // Default: network-first strategy
    event.respondWith(handleDefaultRequest(request));
  }
});

// Helper functions to identify request types
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Network-first strategy for API requests
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for API request:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for login
    if (request.url.includes('/auth/')) {
      return new Response(
        JSON.stringify({
          error: 'Network unavailable',
          offline: true,
          message: 'Please check your internet connection and try again.'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Network-first strategy for navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Network failed, serving offline page for navigation');
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Coastal Credit Union</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            color: #171717;
          }
          .logo {
            background: #0066CC;
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 24px;
          }
          .error {
            color: #CC0000;
            background: #fef2f2;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            background: #0066CC;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
          }
        </style>
      </head>
      <body>
        <div class="logo"></div>
        <h1>You're Offline</h1>
        <div class="error">
          <strong>Network Connection Required</strong><br>
          Please check your internet connection to access your banking services.
        </div>
        <p>Coastal Auto Tech Cooperative Credit Union requires an internet connection for security purposes.</p>
        <button class="button" onclick="window.location.reload()">Try Again</button>
        <div style="margin-top: 40px; font-size: 14px; color: #666;">
           256-bit SSL Encrypted • PCI DSS Compliant
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url, error);
    throw error;
  }
}

// Default network-first strategy
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'login-attempt') {
    event.waitUntil(syncLoginAttempts());
  }
});

// Sync offline login attempts when connection is restored
async function syncLoginAttempts() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    const loginRequests = requests.filter(request => 
      request.url.includes('/api/auth/login') && request.method === 'POST'
    );
    
    for (const request of loginRequests) {
      try {
        await fetch(request);
        await cache.delete(request);
        console.log('Synced offline login attempt');
      } catch (error) {
        console.error('Failed to sync login attempt:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling (for security alerts)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New security alert from Coastal Credit Union',
    icon: '/favicon-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/action-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/action-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Coastal Credit Union', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REPORT_PERFORMANCE') {
    const { url, duration } = event.data;
    console.log(`Performance: ${url} loaded in ${duration}ms`);
    
    // Send performance data to analytics (if configured)
    // analytics.track('performance', { url, duration });
  }
});