/* Coach WeightLoss AI — service worker (ASI.HÉLIOS) */
const CACHE = 'cwl-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Réseau d'abord pour les pages (mises à jour rapides), cache sinon (hors ligne) */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

/* Rappel en arrière-plan (Chrome Android, appli installée, si le téléphone l'autorise) */
self.addEventListener('periodicsync', e => {
  if (e.tag === 'rappels') {
    e.waitUntil(self.registration.showNotification('Coach WeightLoss AI', {
      body: "Pense à boire de l'eau et à faire ta séance du jour 💪",
      icon: 'icon-192.png',
      badge: 'badge-96.png',
      tag: 'rappel-jour'
    }));
  }
});

/* Toucher une notification ouvre l'application */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow('./');
    })
  );
});
