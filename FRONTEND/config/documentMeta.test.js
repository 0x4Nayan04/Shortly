import { describe, expect, it } from 'vitest';
import {
  SEO_PUBLIC_PATHS,
  getDocumentMetaForPath,
  getMetaDescriptionForPath,
  getSeoShellPath,
  normalizePublicPath
} from './documentMeta.js';

describe('normalizePublicPath', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizePublicPath('/privacy/')).toBe('/privacy');
    expect(normalizePublicPath('/')).toBe('/');
  });
});

describe('getDocumentMetaForPath', () => {
  it('builds homepage canonical without trailing slash', () => {
    const meta = getDocumentMetaForPath('/', 'https://shortly.example.com');
    expect(meta.canonicalUrl).toBe('https://shortly.example.com');
    expect(meta.ogImageUrl).toBe('https://shortly.example.com/og-image.png');
  });

  it('uses route-specific descriptions for legal pages', () => {
    expect(getMetaDescriptionForPath('/privacy')).toContain('privacy policy');
    expect(getMetaDescriptionForPath('/terms')).toContain('Terms of Service');
    expect(getMetaDescriptionForPath('/contact')).toContain('Contact Shortly');
  });

  it('maps SEO routes to crawler shell paths', () => {
    for (const pathname of SEO_PUBLIC_PATHS) {
      expect(getSeoShellPath(pathname)).toMatch(/^\/_seo\/.+\.html$/);
    }
    expect(getSeoShellPath('/dashboard')).toBeNull();
  });
});
