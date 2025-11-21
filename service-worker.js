// Service Worker for Vocabulary Spelling Practice PWA
// Version 1.0.0

const CACHE_NAME = 'vocab-practice-v1.0.0';
const ASSETS_TO_CACHE = [
    './vocabulary_spelling_practice_pwa.html',
    './manifest.json'
];

// Install Event - Cache all resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] All assets cached successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache assets:', error);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activated successfully');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch Event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // Otherwise, fetch from network
                console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response (it can only be consumed once)
                        const responseToCache = response.clone();

                        // Cache the fetched resource for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                                console.log('[Service Worker] Cached new resource:', event.request.url);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);
                        
                        // Return offline page or fallback content if available
                        return caches.match('./vocabulary_spelling_practice_pwa.html');
                    });
            })
    );
});

// Background Sync - For future features (currently not used)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync triggered');
    
    if (event.tag === 'sync-progress') {
        event.waitUntil(syncUserProgress());
    }
});

// Sync user progress (placeholder for future implementation)
async function syncUserProgress() {
    try {
        console.log('[Service Worker] Syncing user progress...');
        // Future implementation: sync with server
        return Promise.resolve();
    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
        return Promise.reject(error);
    }
}

// Push Notification - For future features (currently not used)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New content available!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23667eea" width="192" height="192" rx="30"/><text y="140" font-size="120" fill="white" text-anchor="middle" x="96">📚</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23667eea" width="96" height="96" rx="15"/><text y="70" font-size="60" fill="white" text-anchor="middle" x="48">📚</text></svg>',
        vibrate: [200, 100, 200],
        tag: 'vocab-practice',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('Vocabulary Practice', options)
    );
});

// Notification Click - Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./vocabulary_spelling_practice_pwa.html')
    );
});

// Message Event - Communication with main app
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then((cacheNames) => {
                    return Promise.all(
                        cacheNames.map((cacheName) => caches.delete(cacheName))
                    );
                })
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
        );
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('[Service Worker] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Service Worker] Unhandled promise rejection:', event.reason);
});

console.log('[Service Worker] Script loaded successfully');
