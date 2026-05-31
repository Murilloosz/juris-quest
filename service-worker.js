// ============================================================
// 🛡️ SERVICE WORKER — JURIS QUEST
// Permite instalar no celular e abrir offline
// ============================================================

const CACHE_NAME = 'juris-quest-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instala e guarda os arquivos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Limpa caches antigos quando atualiza
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: rede primeiro, cache como reserva (offline)
// (assim a aluna sempre pega a versão mais nova quando tem internet,
//  mas o app ainda abre sem internet)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Não interferir em chamadas ao Supabase (precisa de rede sempre)
  if (req.url.includes('supabase.co') || req.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Atualiza o cache com a versão nova
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, resClone).catch(() => {});
        });
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
