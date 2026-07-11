import { isCrawlerUserAgent } from './config/crawlerDetection.js';
import { getSeoShellPath, normalizePublicPath } from './config/documentMeta.js';

// Vercel parses matcher at build time — must be string literals, not imports.
// Keep in sync with SEO_PUBLIC_PATHS in config/documentMeta.js.
export const config = {
  matcher: ['/', '/privacy']
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = normalizePublicPath(url.pathname);
  const shellPath = getSeoShellPath(pathname);

  if (!shellPath || !isCrawlerUserAgent(request.headers.get('user-agent'))) {
    return;
  }

  return fetch(new URL(shellPath, url));
}
