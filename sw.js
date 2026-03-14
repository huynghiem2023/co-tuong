// sw.js - Service Worker for offline support

const CACHE_NAME = 'co-tuong-v14';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/game.js',
    './js/board.js',
    './js/rules.js',
    './js/ai.js',
    './js/openings.js',
    './js/tutorial.js',
    './js/quiz.js',
    './js/play.js',
    './js/app.js',
    './js/engine/stockfish.js',
    './js/engine/stockfish.wasm',
    './js/engine/stockfish.worker.js',
    './assets/wood_texture.png',
    './assets/piece_K.png',
    './assets/piece_A.png',
    './assets/piece_E.png',
    './assets/piece_R.png',
    './assets/piece_H.png',
    './assets/piece_C.png',
    './assets/piece_P.png',
    './assets/icon-192.png',
    './assets/icon-512.png'
];

// Install: cache all assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first strategy (preserves COOP/COEP headers for SharedArrayBuffer)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).then(response => {
            // Cache successful responses for offline use
            if (response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clone);
                });
            }
            return response;
        }).catch(() => {
            // Network failed — serve from cache (offline mode)
            return caches.match(event.request).then(cached => {
                if (cached) return cached;
                // Offline fallback for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
