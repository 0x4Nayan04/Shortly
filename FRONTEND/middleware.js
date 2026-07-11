import { isCrawlerUserAgent } from './config/crawlerDetection.js';
import {
  SEO_PUBLIC_PATHS,
  getSeoShellPath,
  normalizePublicPath
} from './config/documentMeta.js';

export const config = {
  matcher: SEO_PUBLIC_PATHS
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
