const CACHE_NAME = 'catstego-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

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
