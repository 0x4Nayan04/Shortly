import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEO_PUBLIC_PATHS,
  SHORTLY_SITE_URL,
  getDocumentMetaForPath
} from '../config/documentMeta.js';
import { injectDocumentMeta } from '../config/injectDocumentMeta.js';
import { buildRobotsTxt, buildSitemapXml } from '../config/sitemap.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(rootDir, 'dist');
const indexPath = resolve(distDir, 'index.html');
const seoDir = resolve(distDir, '_seo');

const siteOrigin =
  process.env.VITE_PUBLIC_SHORT_URL?.trim() || SHORTLY_SITE_URL;

function assertSingleDeferredGoogleFontsStylesheet(html, pathname) {
  const hrefs = [
    ...html.matchAll(
      /href=["'](https:\/\/fonts\.googleapis\.com\/css2[^"']*)["']/gi
    )
  ].map((match) => match[1]);

  if (hrefs.length === 0) {
    return;
  }

  const uniqueHrefs = new Set(hrefs);
  if (uniqueHrefs.size !== 1) {
    throw new Error(
      `[Shortly] ${pathname}: expected one Google Fonts CSS URL; found ${uniqueHrefs.size}.`
    );
  }

  if (hrefs.length > 2) {
    throw new Error(
      `[Shortly] ${pathname}: Google Fonts CSS linked ${hrefs.length} times; expected ≤2 (deferred + noscript).`
    );
  }

  const deferred = [
    ...html.matchAll(
      /<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2[^"']*["'][^>]*>/gi
    )
  ].some(
    (match) =>
      /\bmedia=["']print["']/i.test(match[0]) && /\bonload=/i.test(match[0])
  );

  if (!deferred) {
    throw new Error(
      `[Shortly] ${pathname}: missing deferred Google Fonts stylesheet (media=print onload).`
    );
  }
}

/** Home keeps `#landing-lcp-shell`; other SEO paths hide it. */
function applyLandingLcpShellVisibility(html, pathname) {
  if (!html.includes('id="landing-lcp-shell"')) {
    throw new Error(
      `[Shortly] ${pathname}: missing #landing-lcp-shell in dist/index.html`
    );
  }
  if (pathname === '/') {
    return html;
  }
  return html.replace(
    /id="landing-lcp-shell"/,
    'id="landing-lcp-shell" hidden'
  );
}

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
  let shellHtml = injectDocumentMeta(indexHtml, meta);
  shellHtml = applyLandingLcpShellVisibility(shellHtml, pathname);
  assertSingleDeferredGoogleFontsStylesheet(shellHtml, pathname);
  const slug = pathname === '/' ? 'home' : pathname.slice(1);
  const outputPath = resolve(seoDir, `${slug}.html`);
  writeFileSync(outputPath, shellHtml);
}

if (siteOrigin) {
  writeFileSync(resolve(distDir, 'sitemap.xml'), buildSitemapXml(siteOrigin));
  writeFileSync(resolve(distDir, 'robots.txt'), buildRobotsTxt(siteOrigin));
}

console.log(
  `[Shortly] Wrote ${SEO_PUBLIC_PATHS.length} SEO shells in dist/_seo/ for ${siteOrigin.replace(/\/$/, '') || '(no site origin)'}`
);

if (siteOrigin) {
  console.log(
    `[Shortly] Wrote dist/sitemap.xml and dist/robots.txt for ${siteOrigin.replace(/\/$/, '')}`
  );
}
