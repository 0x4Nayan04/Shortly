/**
 * Smoke test: public host should proxy slug redirects to the backend (302).
 *
 * Usage:
 *   PUBLIC_SHORT_HOST=https://shortly.example.com \
 *   SHORT_LINK_PROXY_ORIGIN=https://api.example.com \
 *   node scripts/smoke-short-link-routing.js [slug]
 *
 * Requires an active slug on the backend. When slug is omitted, only routing
 * config and backend reachability are checked.
 */

import { buildVercelRewrites, isShortLinkPath } from '../config/shortLinkRouting.js';

const publicHost = process.env.PUBLIC_SHORT_HOST?.trim()?.replace(/\/$/, '');
const proxyOrigin = process.env.SHORT_LINK_PROXY_ORIGIN?.trim()?.replace(
  /\/$/,
  ''
);
const slug = process.argv[2]?.trim();

if (!publicHost || !proxyOrigin) {
  console.error(
    'PUBLIC_SHORT_HOST and SHORT_LINK_PROXY_ORIGIN are required for the smoke test.'
  );
  process.exit(1);
}

const rewrites = buildVercelRewrites(proxyOrigin);
if (!rewrites.some((rule) => rule.destination.startsWith(proxyOrigin))) {
  console.error('Generated rewrites do not proxy to SHORT_LINK_PROXY_ORIGIN.');
  process.exit(1);
}

if (slug && !isShortLinkPath(`/${slug}`)) {
  console.error(`Slug "${slug}" is not a routable short-link path.`);
  process.exit(1);
}

const backendHealth = await fetch(`${proxyOrigin}/api/health`);
if (!backendHealth.ok) {
  console.error(`Backend health check failed: ${backendHealth.status}`);
  process.exit(1);
}

if (!slug) {
  console.log(
    'Routing config and backend health OK (no slug provided; skipping redirect check).'
  );
  process.exit(0);
}

const response = await fetch(`${publicHost}/${slug}`, { redirect: 'manual' });
if (response.status !== 302) {
  console.error(
    `Expected 302 from ${publicHost}/${slug}, got ${response.status}.`
  );
  process.exit(1);
}

console.log(
  `Smoke OK: ${publicHost}/${slug} → ${response.headers.get('location')}`
);
