/* 우리집 자산관리 - 오프라인 실행용 서비스 워커
   앱 파일(코드·아이콘)만 기기에 저장합니다. 자산 데이터는 다루지 않습니다.
   앱을 수정해 다시 올릴 때는 아래 버전 숫자를 올려 주세요. */
const CACHE = 'home-asset-v1.5.0';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

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

// 저장된 앱을 바로 보여주고, 인터넷이 연결돼 있으면 뒤에서 최신 파일로 갱신
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(isPage ? './index.html' : req, { ignoreSearch: true });
      const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(isPage ? './index.html' : req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      return res || new Response('오프라인 상태입니다.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});
