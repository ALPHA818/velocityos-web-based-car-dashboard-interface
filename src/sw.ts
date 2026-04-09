/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'velocityos-runtime-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(new Request('/', { cache: 'reload' }));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((cacheKey) => cacheKey !== CACHE_NAME)
          .map((cacheKey) => caches.delete(cacheKey)),
      );

      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(handleStaticAssetRequest(request));
});

async function handleNavigationRequest(event: FetchEvent): Promise<Response> {
  const preloadResponse = await event.preloadResponse;
  if (preloadResponse) {
    cacheResponse(event.request, preloadResponse.clone());
    return preloadResponse;
  }

  try {
    const networkResponse = await fetch(event.request);
    cacheResponse(event.request, networkResponse.clone());
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const appShell = await caches.match('/');
    if (appShell) {
      return appShell;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}

async function handleStaticAssetRequest(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  cacheResponse(request, networkResponse.clone());
  return networkResponse;
}

function cacheResponse(request: Request, response: Response): void {
  if (!response.ok || response.type === 'opaque') {
    return;
  }

  void caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
}

export {};
