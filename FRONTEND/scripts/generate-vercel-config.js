import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVercelRewrites } from '../config/shortLinkRouting.js';
import { buildVercelSecurityHeaders } from '../config/vercelSecurityHeaders.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const proxyOrigin =
  process.env.SHORT_LINK_PROXY_ORIGIN?.trim() ||
  process.env.VITE_APP_URL?.trim();

if (!proxyOrigin) {
  throw new Error(
    '[Shortly] SHORT_LINK_PROXY_ORIGIN or VITE_APP_URL is required to generate vercel.json for production routing.'
  );
}

const config = {
  headers: buildVercelSecurityHeaders(proxyOrigin),
  rewrites: buildVercelRewrites(proxyOrigin)
};
writeFileSync(
  resolve(rootDir, 'vercel.json'),
  `${JSON.stringify(config, null, 2)}\n`
);

console.log(
  `[Shortly] Wrote vercel.json with short-link proxy → ${proxyOrigin.replace(/\/$/, '')}`
);
