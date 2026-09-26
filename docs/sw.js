const CACHE = 'wmg-a6434554d0';
const FILES = ["./", "about/", "card-game/", "charades/", "couple-match/", "couple/", "deep-talk/", "dont-overflow/", "drink-hard/", "drinking-dice/", "finger-chooser/", "flirt-duel/", "funny/", "guess-my-answer/", "heart-cards/", "most-likely/", "never-have-i-ever/", "no-laugh/", "number-bomb/", "penalty-wheel/", "privacy/", "reaction-duel/", "ride-the-bus/", "spicy-dice/", "spicy/", "spin-the-bottle/", "time-bomb/", "truth-or-dare/", "who-is-spy/", "would-you-rather/", "assets/app.js", "assets/data.js", "assets/data2.js", "assets/games.js", "assets/games2.js", "assets/packs.js", "assets/style.css", "icon.svg", "manifest.json"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // หน้าเว็บ: ลองเน็ตก่อน ถ้าไม่มีใช้ของที่เก็บไว้
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((cc) => cc.put(req, c)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./'))));
  } else if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((cc) => cc.put(req, c)); return res; })));
  }
});
