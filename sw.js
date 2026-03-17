// sw.js - Service Worker for offline support + SharedArrayBuffer headers
// Injects COOP/COEP headers so Fairy-Stockfish WASM works on GitHub Pages

const CACHE_NAME = 'co-tuong-v29';
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
    './js/sound.js',
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
    './assets/icon-512.png',
    './assets/profile.jpg',
    './assets/loser.png',
    './assets/music/01.mp3',
    './assets/music/02.mp3',
    './assets/music/03.mp3',
    './assets/music/04.mp3',
    './assets/music/05.mp3',
    './assets/music/06.mp3',
    './assets/music/07.mp3',
    './assets/music/08.mp3',
    './assets/music/09.mp3',
    './assets/music/10.mp3'
];

// File extensions that should NOT have COEP headers injected
// (media files need range request support for streaming)
const MEDIA_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.mp4', '.webm'];

// Install: cache all assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches + take control immediately
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

// Add COOP/COEP headers to enable SharedArrayBuffer (for Fairy-Stockfish WASM)
function addCrossOriginHeaders(response) {
    const headers = new Headers(response.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

// Fetch: network-first with COOP/COEP header injection
self.addEventListener('fetch', event => {
    // Only inject headers for same-origin requests
    const url = new URL(event.request.url);
    const isSameOrigin = url.origin === self.location.origin;

    // Don't inject COEP headers on media files — they need range request
    // support for HTML5 Audio/Video streaming to work properly
    const isMedia = MEDIA_EXTENSIONS.some(ext => url.pathname.toLowerCase().endsWith(ext));

    event.respondWith(
        fetch(event.request).then(response => {
            // Cache successful responses for offline use
            if (response.status === 200 && isSameOrigin) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clone);
                });
            }
            // Skip header injection for media files
            if (isMedia) {
                return response;
            }
            // Inject COOP/COEP headers for same-origin responses
            if (isSameOrigin) {
                return addCrossOriginHeaders(response);
            }
            return response;
        }).catch(() => {
            // Network failed — serve from cache (offline mode)
            return caches.match(event.request).then(cached => {
                if (cached) {
                    // Skip header injection for media files
                    if (isMedia) {
                        return cached;
                    }
                    // Also inject headers on cached responses
                    if (isSameOrigin) {
                        return addCrossOriginHeaders(cached);
                    }
                    return cached;
                }
                // Offline fallback for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html').then(page => {
                        return page ? addCrossOriginHeaders(page) : page;
                    });
                }
            });
        })
    );
});
