/* eslint-disable no-restricted-globals */

// Importado pelo service worker gerado (ver vite.config.ts), que trata da cache e das atualizações.

// As versões anteriores guardavam aqui respostas privadas da API: não podem ficar no aparelho.
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.delete('api-cache'));
});

self.addEventListener('push', (event) => {
  let data = { title: 'Afroscholars', body: 'Tem uma nova atualização.', url: '/' };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-64x64.png',
      tag: data.tag,
      data: { url: data.url || '/' },
      requireInteraction: !!data.destaque,
      renotify: !!(data.destaque && data.tag),
      vibrate: data.destaque ? [300, 100, 300, 100, 600] : undefined,
      actions: data.destaque ? [{ action: 'ver', title: 'Ver bolsa' }] : [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
