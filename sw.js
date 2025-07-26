const CACHE_NAME = 'duck-vibes-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/world-map.html',
  '/contact.html',
  '/gallery.html',
  '/duck-game.html',
  '/guestbook.html',
  '/login.html',
  '/duck-ranks.html',
  '/go-here.html',
  '/from-here.html',
  '/synthwave-bg.css',
  '/responsive.css',
  '/footer.css',
  '/audio-controls.css',
  '/footer.js',
  '/audio-controls.js',
  '/guestbook.js',
  '/enhanced-effects.js',
  '/auth.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('🦆 Duck Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🦆 Caching duck assets...');
        return cache.addAll(STATIC_CACHE_URLS.map(url => {
          // Handle relative URLs
          return url.startsWith('/') ? url : new URL(url, self.location).href;
        }));
      })
      .catch((error) => {
        console.log('🦆 Cache error (some assets may not be available):', error);
        // Don't fail installation if some resources can't be cached
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🦆 Duck Service Worker activated!');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🦆 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests for external APIs
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdnjs.cloudflare.com') &&
      !event.request.url.includes('jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('🦆 Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        console.log('🦆 Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.log('🦆 Network fetch failed:', error);
            
            // Return offline fallback for HTML pages
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For other resources, just fail
            throw error;
          });
      })
  );
});

// Background sync for guestbook entries
self.addEventListener('sync', (event) => {
  if (event.tag === 'guestbook-sync') {
    console.log('🦆 Syncing guestbook entries...');
    event.waitUntil(syncGuestbookEntries());
  }
});

// Push notifications for new guestbook entries
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('🦆 Push notification received:', data);
    
    const options = {
      body: data.body || 'Someone new signed the guestbook!',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='90'%3E🦆%3C/text%3E%3C/svg%3E",
      badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='90'%3E📖%3C/text%3E%3C/svg%3E",
      tag: 'guestbook-entry',
      actions: [
        {
          action: 'view',
          title: 'View Guestbook',
          icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='90'%3E👀%3C/text%3E%3C/svg%3E"
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='90'%3E❌%3C/text%3E%3C/svg%3E"
        }
      ],
      data: {
        url: '/guestbook.html'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('🦆 Duck Vibes Guestbook', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync guestbook entries when online
async function syncGuestbookEntries() {
  // This would normally sync with a server
  // For now, just log that sync would happen
  console.log('🦆 Guestbook sync completed (offline-first with PouchDB)');
}

// Handle client messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case 'DUCK_ACHIEVEMENT':
        console.log('🦆 Achievement unlocked:', event.data.achievement);
        // Could trigger special effects or notifications
        break;
    }
  }
});

// Easter egg: Special duck quack sound for Konami code
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'KONAMI_QUACK') {
    // Broadcast to all clients for synchronized duck explosion
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'DUCK_EXPLOSION',
          timestamp: Date.now()
        });
      });
    });
  }
});