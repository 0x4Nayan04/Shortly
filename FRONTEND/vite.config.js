import http from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { isShortLinkPath } from './config/shortLinkRouting.js';

const BACKEND_ORIGIN =
  process.env.VITE_BACKEND_DEV_URL || 'http://127.0.0.1:3001';
const BACKEND_HOST = new URL(BACKEND_ORIGIN).host;

/** Defer built CSS so critical inline hero styles can paint LCP first. */
function deferStylesheetPlugin() {
  return {
    name: 'defer-stylesheet',
    transformIndexHtml(html) {
      return html.replace(
        /<link(\s[^>]*\s|\s)rel="stylesheet"([^>]*href="[^"]+\.css"[^>]*)>/gi,
        (_match, pre, post) => {
          if (/\bmedia=/.test(pre + post)) return _match;
          return `<link${pre}rel="stylesheet"${post} media="print" onload="this.media='all'"><noscript><link${pre}rel="stylesheet"${post}></noscript>`;
        }
      );
    }
  };
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

export default defineConfig(({ mode }) => {
  if (mode === 'production' && !process.env.VITE_APP_URL?.trim()) {
    throw new Error(
      '[Shortly] VITE_APP_URL is required for production builds. Set it to your API origin (e.g. https://api.example.com).'
    );
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      shortUrlProxyPlugin(),
      deferStylesheetPlugin()
    ],
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
          changeOrigin: true,
          // Remote API CORS only allows the prod frontend origin; rewrite when
          // proxying so localhost/127.0.0.1 can hit Railway during local verify.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const allowed =
                process.env.VITE_PUBLIC_SHORT_URL?.trim() ||
                'https://shortly.nayanswarnkar.com';
              try {
                const { origin } = new URL(allowed);
                if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
                  return;
                }
                proxyReq.setHeader('Origin', origin);
                proxyReq.setHeader('Referer', `${origin}/`);
              } catch {
                /* keep browser Origin */
              }
            });
          }
        }
      }
    }
  };
});
