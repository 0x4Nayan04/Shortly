import { describe, expect, it } from 'vitest';
import { SEO_PUBLIC_PATHS } from './documentMeta.js';
import {
  SITEMAP_PUBLIC_PATHS,
  buildRobotsTxt,
  buildSitemapXml
} from './sitemap.js';

describe('SITEMAP_PUBLIC_PATHS', () => {
  it('matches crawler-facing SEO routes only', () => {
    expect(SITEMAP_PUBLIC_PATHS).toEqual(SEO_PUBLIC_PATHS);
    expect(SITEMAP_PUBLIC_PATHS).toEqual(['/', '/privacy']);
  });
});

describe('buildSitemapXml', () => {
  it('lists only real public indexable pages', () => {
    const xml = buildSitemapXml('https://shortly.example.com');

    expect(xml).toContain('<loc>https://shortly.example.com/</loc>');
    expect(xml).toContain('<loc>https://shortly.example.com/privacy</loc>');
    expect(xml).not.toContain('/terms');
    expect(xml).not.toContain('/contact');
    expect(xml).not.toContain('/dashboard');
  });

  it('requires a site origin', () => {
    expect(() => buildSitemapXml('')).toThrow(/Site origin is required/);
  });
});

describe('buildRobotsTxt', () => {
  it('points crawlers at the generated sitemap', () => {
    const robots = buildRobotsTxt('https://shortly.example.com/');

    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://shortly.example.com/sitemap.xml');
  });
});
