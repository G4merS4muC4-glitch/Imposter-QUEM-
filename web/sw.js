/* Service Worker — IMPOSTOR QUEM?
 * Estratégia:
 *  - Precache do app shell (index, manifest, ícones) na instalação
 *  - Cache-first com revalidação em background para o shell
 *  - Cache-first para Google Fonts (CSS + woff2) — depois do primeiro load, 100% offline
 */
const VERSION = 'v1.1.0';
const SHELL_CACHE = `impostor-shell-${VERSION}`;
const FONT_CACHE = 'impostor-fonts-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('impostor-shell-') && k !== SHELL_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Google Fonts: cache-first permanente (CSS muda raramente; woff2 é imutável)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const fresh = await fetch(event.request);
          if (fresh.ok || fresh.type === 'opaque') {
            cache.put(event.request, fresh.clone());
          }
          return fresh;
        } catch (e) {
          // Offline e sem cache — devolve erro; o jogo segue com fontes do sistema
          return new Response('', { status: 503 });
        }
      }),
    );
    return;
  }

  // Só intercepta GET do mesmo domínio
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // App shell: cache-first + revalidação em background (stale-while-revalidate)
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const fetchAndUpdate = fetch(event.request)
        .then((fresh) => {
          if (fresh && fresh.ok) cache.put(event.request, fresh.clone());
          return fresh;
        })
        .catch(() => null);
      if (cached) {
        // devolve cache na hora, atualiza em background
        fetchAndUpdate;
        return cached;
      }
      const fresh = await fetchAndUpdate;
      if (fresh) return fresh;
      // fallback: navegação offline sem cache exato → devolve index
      if (event.request.mode === 'navigate') {
        const home = await cache.match('./index.html');
        if (home) return home;
      }
      return new Response('Offline', { status: 503 });
    }),
  );
});
