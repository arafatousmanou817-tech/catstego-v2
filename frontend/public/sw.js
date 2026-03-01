const CACHE_NAME = 'catstego-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  return self.clients.claim();
});

// Cache API requests (Stale-While-Revalidate) and Images (Cache-First)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Cache API data (Contacts, Messages, Conversation history) - Stale-While-Revalidate
  if (url.pathname.startsWith('/api/contacts') || url.pathname.startsWith('/api/messages')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache Image content (Base64 is already in API JSON, but if external images, use Cache-First)
  // Static assets (CSS, JS, manifest) - Cache-First
  if (url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico'))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }
});

// Réception d'une notification push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'CatStego', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Nouveau message',
    icon: data.icon || '/cat-icon.png',
    badge: '/cat-icon.png',
    tag: data.tag || 'catstego-msg',
    renotify: true,
    data: { url: data.url || '/chat', senderId: data.senderId },
    actions: [
      { action: 'open', title: 'Voir le message' },
      { action: 'close', title: 'Fermer' }
    ],
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🐱 CatStego', options)
  );
});

// Clic sur la notification → ouvrir/focus l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Chercher un onglet déjà ouvert
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.postMessage({ type: 'NOTIFICATION_CLICK', url, senderId: event.notification.data?.senderId });
      } else {
        self.clients.openWindow(self.location.origin + url);
      }
    })
  );
});
