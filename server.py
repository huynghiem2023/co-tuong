import http.server
import sys

MEDIA_EXTENSIONS = ('.mp3', '.wav', '.ogg', '.mp4', '.webm')

class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Skip COEP headers for media files — they need range request
        # support for HTML5 Audio/Video streaming to work properly
        is_media = self.path.split('?')[0].lower().endswith(MEDIA_EXTENSIONS)
        if not is_media:
            # Required for SharedArrayBuffer (WASM pthreads)
            self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
            self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        # Cache control to avoid stale files
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    server = http.server.HTTPServer(('', port), CORSHandler)
    print(f'Server running at http://127.0.0.1:{port}')
    print('With COOP/COEP headers for SharedArrayBuffer support')
    server.serve_forever()
