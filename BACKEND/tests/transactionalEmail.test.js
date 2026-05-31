import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFrontEndUrl,
  buildTransactionalEmailHtml,
  buildTransactionalEmailText,
  EMAIL_TOKENS,
  resolveEmailLogoUrl
} from '../src/templates/transactionalEmail.js';

test('EMAIL_TOKENS use Shortly design primary color', () => {
  assert.equal(EMAIL_TOKENS.primary, '#0562ef');
  assert.equal(EMAIL_TOKENS.ink, '#0b1015');
});

test('buildFrontEndUrl avoids double slashes', () => {
  assert.equal(
    buildFrontEndUrl('https://app.example.com/', '/verify-email/abc'),
    'https://app.example.com/verify-email/abc'
  );
  assert.equal(
    buildFrontEndUrl('https://app.example.com/', '/reset-password/abc'),
    'https://app.example.com/reset-password/abc'
  );
});

test('resolveEmailLogoUrl skips localhost frontends', () => {
  const previous = process.env.EMAIL_ASSET_BASE_URL;
  delete process.env.EMAIL_ASSET_BASE_URL;
  assert.equal(resolveEmailLogoUrl('http://127.0.0.1:5173'), null);
  if (previous === undefined) delete process.env.EMAIL_ASSET_BASE_URL;
  else process.env.EMAIL_ASSET_BASE_URL = previous;
});

test('resolveEmailLogoUrl uses EMAIL_ASSET_BASE_URL override', () => {
  const previous = process.env.EMAIL_ASSET_BASE_URL;
  process.env.EMAIL_ASSET_BASE_URL = 'https://shortly.nayan04.me';
  assert.equal(
    resolveEmailLogoUrl('http://127.0.0.1:5173'),
    'https://shortly.nayan04.me/assets/Shortly_Logo_nav.png'
  );
  if (previous === undefined) delete process.env.EMAIL_ASSET_BASE_URL;
  else process.env.EMAIL_ASSET_BASE_URL = previous;
});

test('transactional email html includes brand layout and escaped content', () => {
  const html = buildTransactionalEmailHtml({
    preheader: 'Preview text',
    headline: 'Verify <script>',
    intro: 'Hello & welcome',
    ctaLabel: 'Verify email',
    ctaUrl: 'https://app.example.com/verify-email/token',
    safetyNote: 'Ignore if not you',
    expiryNote: 'Expires in 24 hours',
    frontEndUrl: 'https://app.example.com'
  });

  assert.match(html, /#0562ef/);
  assert.match(html, /Shortly_Logo_nav\.png/);
  assert.match(html, /Verify &lt;script&gt;/);
  assert.match(html, /Hello &amp; welcome/);
  assert.match(html, /font-family:'Space Grotesk'/);
  assert.doesNotMatch(html, /<script>/);
});

test('transactional email html uses text wordmark when logo is unavailable', () => {
  const previous = process.env.EMAIL_ASSET_BASE_URL;
  delete process.env.EMAIL_ASSET_BASE_URL;

  const html = buildTransactionalEmailHtml({
    preheader: 'Preview text',
    headline: 'Reset your password',
    intro: 'Hello',
    ctaLabel: 'Reset password',
    ctaUrl: 'https://app.example.com/reset-password/token',
    safetyNote: 'Ignore if not you',
    expiryNote: 'Expires in 1 hour',
    frontEndUrl: 'http://127.0.0.1:5173'
  });

  assert.doesNotMatch(html, /<img[^>]+Shortly_Logo_nav/);
  assert.match(html, />Shortly</);

  if (previous === undefined) delete process.env.EMAIL_ASSET_BASE_URL;
  else process.env.EMAIL_ASSET_BASE_URL = previous;
});

test('transactional email text includes CTA url', () => {
  const text = buildTransactionalEmailText({
    headline: 'Reset your password',
    intro: 'We received a request.',
    ctaLabel: 'Reset password',
    ctaUrl: 'https://app.example.com/reset-password/abc',
    safetyNote: 'Ignore if not you.',
    expiryNote: 'Expires in 1 hour.'
  });

  assert.match(text, /Reset password: https:\/\/app\.example\.com/);
});
