// public/service-worker.js
const CACHE_NAME = 'inventory-v1';
const API_CACHE_NAME = 'inventory-api-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        // Add other critical assets
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache API responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Return offline fallback for API calls
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Offline',
              _local: true 
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
      })
    );
  } else {
    // For non-API requests, use cache-first strategy
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOperations());
  }
});

async function syncOperations() {
  try {
    // Get pending operations from IndexedDB
    const pendingOps = await getPendingOperations();
    
    for (const op of pendingOps) {
      await fetch(op.endpoint, {
        method: op.method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': op.userId,
        },
        body: JSON.stringify(op.data),
      });
      
      // Remove from pending
      await removePendingOperation(op.id);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}