const CACHE_NAME = 'ai-idei-v1';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(['/', '/home', '/manifest.json']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/rest/')) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.ok && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('push', function(event) {
  let data = { title: 'AI-IDEI', message: '', link: '/home' };
  
  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    if (event.data) {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: { url: data.link || '/home' },
    actions: [
      { action: 'open', title: 'Deschide' },
      { action: 'dismiss', title: 'Închide' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});
