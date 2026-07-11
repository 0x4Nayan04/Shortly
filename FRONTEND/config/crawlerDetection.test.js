import { describe, expect, it } from 'vitest';
import { isCrawlerUserAgent } from './crawlerDetection.js';

describe('isCrawlerUserAgent', () => {
  it('detects common crawlers and preview bots', () => {
    expect(isCrawlerUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(
      true
    );
    expect(isCrawlerUserAgent('Twitterbot/1.0')).toBe(true);
    expect(isCrawlerUserAgent('facebookexternalhit/1.1')).toBe(true);
  });

  it('does not flag regular browsers', () => {
    expect(
      isCrawlerUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      )
    ).toBe(false);
  });
});
