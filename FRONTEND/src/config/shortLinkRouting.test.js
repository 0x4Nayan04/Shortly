import { describe, expect, it } from 'vitest';
import {
  SPA_SLUGS,
  SLUG_PATH_PATTERN,
  buildVercelRewrites,
  isShortLinkPath
} from '../../config/shortLinkRouting.js';

describe('isShortLinkPath', () => {
  it.each([...SPA_SLUGS])('excludes SPA route /%s', (slug) => {
    expect(isShortLinkPath(`/${slug}`)).toBe(false);
  });

  it.each(['/login/extra', '/a/b', '/'])(
    'rejects non-single-segment path %s',
    (path) => {
      expect(isShortLinkPath(path)).toBe(false);
    }
  );

  it.each(['/ab', '/this-slug-is-way-too-long-for-rules'])(
    'rejects invalid slug length %s',
    (path) => {
      expect(isShortLinkPath(path)).toBe(false);
    }
  );

  it.each(['/abc', '/ZcrzivY', '/my_alias-1'])(
    'accepts valid short-link slug %s',
    (path) => {
      expect(isShortLinkPath(path)).toBe(true);
    }
  );
});

describe('buildVercelRewrites', () => {
  it('orders SPA exclusions before slug proxy and SPA fallback', () => {
    const rewrites = buildVercelRewrites('https://api.example.com');
    const sources = rewrites.map((rule) => rule.source);

    expect(sources.at(-1)).toBe('/(.*)');
    expect(sources).toContain(`/:slug(${SLUG_PATH_PATTERN})`);

    const slugIndex = sources.indexOf(`/:slug(${SLUG_PATH_PATTERN})`);
    for (const slug of SPA_SLUGS) {
      expect(sources.indexOf(`/${slug}`)).toBeLessThan(slugIndex);
    }

    const slugRule = rewrites.find(
      (rule) => rule.source === `/:slug(${SLUG_PATH_PATTERN})`
    );
    expect(slugRule.destination).toBe('https://api.example.com/:slug');
  });
});
