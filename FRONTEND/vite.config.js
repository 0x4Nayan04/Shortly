import http from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const BACKEND_ORIGIN =
  process.env.VITE_BACKEND_DEV_URL || 'http://127.0.0.1:3001';
const BACKEND_HOST = new URL(BACKEND_ORIGIN).host;

/** SPA routes — must not be proxied to the backend redirect handler. */
const SPA_SLUGS = new Set([
  'login',
  'register',
  'dashboard',
  'settings',
  'privacy',
  'forgot-password',
  'reset-password',
  'verify-email'
]);

function isShortLinkPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length !== 1) return false;
  const slug = parts[0];
  if (SPA_SLUGS.has(slug.toLowerCase())) return false;
  return /^[a-zA-Z0-9_-]{3,20}$/.test(slug);
}

/** Dev: proxy /ZcrzivY → backend so short links work on the same port as the SPA (5173). */
function shortUrlProxyPlugin() {
  return {
    name: 'short-url-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        const pathname = req.url?.split('?')[0] ?? '';
        if (!isShortLinkPath(pathname)) return next();

        const target = `${BACKEND_ORIGIN}${req.url}`;
        const proxyReq = http.request(
          target,
          {
            method: req.method,
            headers: { ...req.headers, host: BACKEND_HOST }
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );
        proxyReq.on('error', (err) => {
          console.error('[short-url-proxy]', err.message);
          next(err);
        });
        proxyReq.end();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), shortUrlProxyPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('\\react-dom\\') ||
            id.includes('\\react\\')
          ) {
            return 'react-vendor';
          }
          if (id.includes('react-router')) return 'router-vendor';
          if (id.includes('lucide-react')) return 'lucide-vendor';
          if (id.includes('/axios/')) return 'axios-vendor';
        }
      }
    }
  },
  optimizeDeps: {
    include: ['lucide-react']
  },
  server: {
    host: true, // 0.0.0.0 — required for Windows browser → WSL (mirrored or not)
    port: 5173,
    strictPort: true,
    // Same-origin API in dev — no CORS, cookies work on localhost:5173
    proxy: {
      '/api': {
        target: BACKEND_ORIGIN,
        changeOrigin: true
      }
    }
  }
});
