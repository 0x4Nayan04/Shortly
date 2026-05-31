import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl } from '../src/utils/normalizeUrl.js';
import { isBotUserAgent } from '../src/utils/isBotUserAgent.js';
import { normalizeSlug } from '../src/utils/normalizeSlug.js';

test('normalizeUrl lowercases hostname and strips trailing slash', () => {
  assert.equal(
    normalizeUrl('HTTPS://Example.com/path/'),
    'https://example.com/path'
  );
});

test('normalizeUrl preserves query strings', () => {
  assert.equal(
    normalizeUrl('https://example.com/page?a=1&b=2'),
    'https://example.com/page?a=1&b=2'
  );
});

test('normalizeSlug lowercases custom aliases', () => {
  assert.equal(normalizeSlug('Promo'), 'promo');
});

test('isBotUserAgent detects common crawlers', () => {
  assert.equal(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(
    isBotUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    ),
    false
  );
});
