// Минимальный сервис-воркер: офлайн-кэш оболочки, network-first для страниц,
// cache-first для статики. Данные Supabase не кэшируем.
const CACHE = 'thai-trainer-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('thai-trainer-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}));
          return res;
        })
        .catch(async () => (await caches.match(e.request)) || (await caches.match('/')) || new Response('Нет подключения. Открой приложение после восстановления связи.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))
    );
    return;
  }

  // Не кэшируем API, RSC-ответы и любые личные данные.
  if (!url.pathname.startsWith('/_next/static/') && !url.pathname.startsWith('/icons/') && url.pathname !== '/manifest.webmanifest') return;

  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          if (res.ok) e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}));
          return res;
        })
    )
  );
});
