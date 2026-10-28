/* La Rubi - service worker (syarat aplikasi terpasang / PWABuilder).
 * Hanya halaman pembungkus ini yang disimpan untuk cadangan saat sinyal hilang.
 * Data La Rubi (Google Apps Script) TIDAK disimpan di HP: selalu diambil langsung dari server. */
var CACHE = 'larubi-v5';
var CADANGAN = ['./', './index.html', './manifest.webmanifest', './ikon/ikon-192.png', './ikon/maskot.webp'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CADANGAN); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;   // Apps Script & pustaka luar: langsung ke internet
  if (/\/ikon\//.test(r.url)) {                                                     // logo: dari HP dulu (hemat data, layar pembuka langsung tampil)
    e.respondWith(caches.match(r).then(function (x) { return x || fetch(r).then(function (res) { if (res && res.ok) { var s2 = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, s2); }); } return res; }); }));
    return;
  }
  e.respondWith(fetch(r).then(function (res) {                                       // selalu versi terbaru; cadangan bila tanpa sinyal
    if (res && res.ok) { var salin = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, salin); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (x) { return x || (r.mode === 'navigate' ? caches.match('./index.html') : undefined); });
  }));
});
