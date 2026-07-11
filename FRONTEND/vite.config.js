import http from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { isShortLinkPath } from './config/shortLinkRouting.js';

const BACKEND_ORIGIN =
  process.env.VITE_BACKEND_DEV_URL || 'http://127.0.0.1:3001';
const BACKEND_HOST = new URL(BACKEND_ORIGIN).host;

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

export default defineConfig(({ mode }) => {
  if (mode === 'production' && !process.env.VITE_APP_URL?.trim()) {
    throw new Error(
      '[Shortly] VITE_APP_URL is required for production builds. Set it to your API origin (e.g. https://api.example.com).'
    );
  }

  return {
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
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      restoreMocks: true,
      exclude: ['**/node_modules/**', '**/e2e/**']
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
  };
});
