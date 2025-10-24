// Define um nome e versão para o cache
const CACHE_NAME = 'reservas-verao2526-v1';

// Lista de arquivos que devem ser cacheados (o "App Shell")
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'imagens/icon-192x192.png', // Adicione todos os seus ícones e imagens
  'imagens/icon-512x512.png'
];

// Evento 'install': Roda quando o Service Worker é instalado
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        // Adiciona todos os arquivos do "App Shell" ao cache
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': Roda toda vez que o app faz uma requisição (ex: carregar CSS, JS, imagem, API)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 1. Tenta encontrar o recurso no Cache
    caches.match(event.request)
      .then((response) => {
        // 2. Se encontrou no cache, retorna ele
        if (response) {
          return response;
        }
        // 3. Se não encontrou, faz a requisição à rede
        return fetch(event.request);
      }
    )
  );

});
