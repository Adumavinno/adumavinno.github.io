/* VINNO VF8 – service worker: mở được khi mạng yếu. Đổi số phiên bản khi cập nhật app. */
const CACHE = 'vinno-vf8-v7.3.0';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'logo.webp', 'icons.webp', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(ASSETS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('vinno-vf8')) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/(^|\.)google(usercontent)?\.com$/.test(url.hostname) && !/^fonts\./.test(url.hostname)) return; // dữ liệu: luôn đi mạng
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-store' });
        if (res.ok) (await caches.open(CACHE)).put('index.html', res.clone());
        return res;
      } catch (err) {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  const mine = url.origin === self.location.origin && url.pathname.startsWith(new URL('./', self.location).pathname);
  if (!mine && !/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  e.respondWith((async () => {
    const hit = await caches.match(req);
    const net = fetch(req).then(async res => { if (res.ok || res.type === 'opaque') (await caches.open(CACHE)).put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })());
});
