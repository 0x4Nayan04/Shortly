import { SEO_PUBLIC_PATHS } from './documentMeta.js';

/** Crawler-facing pages only — keep in sync with SEO_PUBLIC_PATHS. */
export const SITEMAP_PUBLIC_PATHS = SEO_PUBLIC_PATHS;

const SITEMAP_ENTRY_META = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/privacy': { changefreq: 'monthly', priority: '0.6' }
};

/**
 * @param {string} siteOrigin
 * @param {string[]} [paths]
 */
export function buildSitemapXml(siteOrigin, paths = SITEMAP_PUBLIC_PATHS) {
  const origin = siteOrigin.replace(/\/$/, '');
  if (!origin) {
    throw new Error('[Shortly] Site origin is required to build sitemap.xml');
  }

  const urls = paths.map((pathname) => {
    const loc = pathname === '/' ? `${origin}/` : `${origin}${pathname}`;
    const { changefreq, priority } = SITEMAP_ENTRY_META[pathname] ?? {
      changefreq: 'monthly',
      priority: '0.5'
    };

    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>'
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls.join('\n'),
    '</urlset>',
    ''
  ].join('\n');
}

/** @param {string} siteOrigin */
export function buildRobotsTxt(siteOrigin) {
  const origin = siteOrigin.replace(/\/$/, '');
  if (!origin) {
    throw new Error('[Shortly] Site origin is required to build robots.txt');
  }

  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join(
    '\n'
  );
}
