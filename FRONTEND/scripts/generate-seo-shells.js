import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEO_PUBLIC_PATHS,
  SHORTLY_SITE_URL,
  getDocumentMetaForPath
} from '../config/documentMeta.js';
import { injectDocumentMeta } from '../config/injectDocumentMeta.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(rootDir, 'dist');
const indexPath = resolve(distDir, 'index.html');
const seoDir = resolve(distDir, '_seo');

const siteOrigin =
  process.env.VITE_PUBLIC_SHORT_URL?.trim() || SHORTLY_SITE_URL;

let indexHtml;
try {
  indexHtml = readFileSync(indexPath, 'utf8');
} catch {
  throw new Error(
    '[Shortly] dist/index.html not found. Run vite build before generate-seo-shells.'
  );
}

mkdirSync(seoDir, { recursive: true });

for (const pathname of SEO_PUBLIC_PATHS) {
  const meta = getDocumentMetaForPath(pathname, siteOrigin);
  const shellHtml = injectDocumentMeta(indexHtml, meta);
  const slug = pathname === '/' ? 'home' : pathname.slice(1);
  const outputPath = resolve(seoDir, `${slug}.html`);
  writeFileSync(outputPath, shellHtml);
}

console.log(
  `[Shortly] Wrote ${SEO_PUBLIC_PATHS.length} SEO shells in dist/_seo/ for ${siteOrigin.replace(/\/$/, '')}`
);
