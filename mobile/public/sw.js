// KA² — HEAVEN Service Worker for Background & Lockscreen Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'KA² — HEAVEN';
    const options = {
      body: data.body || 'New romantic notification ❤️',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [500, 200, 500, 200, 500],
      data: {
        url: data.url || '/',
        ...data,
      },
      tag: data.tag || 'ka2-heaven-notification',
      renotify: true,
      requireInteraction: data.type === 'call',
      actions: data.type === 'call'
        ? [
            { action: 'answer', title: '📞 Answer' },
            { action: 'decline', title: '❌ Decline' },
          ]
        : [
            { action: 'open', title: '💌 View Message' }
          ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.warn('[SW] Push error:', e);
  }
});
