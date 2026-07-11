import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeRedirectUrl } from '../src/utils/safeRedirectUrl.js';
import { normalizeReferrerHostname } from '../src/utils/normalizeReferrerHostname.js';
import { parseUserAgent } from '../src/utils/userAgent.js';
import { keyGenerators } from '../src/middleware/rateLimit.middleware.js';
import { resolveSameSite } from '../src/config/config.js';
import { checkMongoReadiness } from '../src/routes/health.routes.js';
import { verifyRequiredMigration } from '../src/config/mongo.config.js';
import { errorHandler } from '../src/utils/errorHandler.js';
import { logger } from '../src/utils/logger.js';

test('redirect validation blocks unsafe schemes and literal local addresses', () => {
  const blocked = [
    'javascript:alert(1)',
    'file:///etc/passwd',
    'http://localhost/admin',
    'http://api.localhost/admin',
    'http://127.0.0.1',
    'http://10.0.0.1',
    'http://169.254.169.254',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]'
  ];
  for (const url of blocked) assert.equal(isSafeRedirectUrl(url), false, url);

  assert.equal(isSafeRedirectUrl('https://example.com/path'), true);
  assert.equal(isSafeRedirectUrl('http://public.example'), true);
});

test('hostnames are checked syntactically and are not DNS-resolved', () => {
  assert.equal(isSafeRedirectUrl('http://127.0.0.1.nip.io'), true);
  assert.equal(isSafeRedirectUrl('http://localtest.me'), true);
});

test('referrer normalization retains only a lowercase hostname', () => {
  assert.equal(
    normalizeReferrerHostname(
      'https://User:secret@Example.COM:8443/private?q=token#fragment'
    ),
    'example.com'
  );
  assert.equal(normalizeReferrerHostname('not a url'), '');
  assert.equal(normalizeReferrerHostname('ftp://example.com/file'), '');
  assert.equal(normalizeReferrerHostname(''), '');
});

test('analytics metadata is bounded before database validation', () => {
  const parsed = parseUserAgent({
    headers: { 'user-agent': `Browser/${'x'.repeat(2000)}` }
  });
  assert.equal(parsed.user_agent.length, 512);
  assert.ok(parsed.browser.length <= 128);
  assert.ok(parsed.os.length <= 128);
  assert.ok(parsed.device_type.length <= 64);
});

test('credential rate-limit keys hash emails and include IP-wide layers', () => {
  const req = { body: { email: 'Person@Example.com' }, ip: '203.0.113.5' };
  const accountKey = keyGenerators.loginAccount(req);
  assert.equal(accountKey.includes('person@example.com'), false);
  assert.match(accountKey, /^login-account:[a-f0-9]{64}$/);
  assert.equal(keyGenerators.loginIp(req), 'login-ip:203.0.113.5');
});

test('same-site cookies default to lax and cross-site use requires opt-in', () => {
  const previous = process.env.COOKIE_SAME_SITE;
  delete process.env.COOKIE_SAME_SITE;
  assert.equal(resolveSameSite(), 'lax');
  process.env.COOKIE_SAME_SITE = 'none';
  assert.equal(resolveSameSite(), 'none');
  if (previous === undefined) delete process.env.COOKIE_SAME_SITE;
  else process.env.COOKIE_SAME_SITE = previous;
});

test('readiness requires a successful MongoDB ping', async () => {
  const healthy = {
    readyState: 1,
    db: { admin: () => ({ command: async () => ({ ok: 1 }) }) }
  };
  const stalled = {
    readyState: 1,
    db: {
      admin: () => ({ command: async () => Promise.reject(new Error('down')) })
    }
  };
  assert.equal(await checkMongoReadiness(healthy), true);
  assert.equal(await checkMongoReadiness(stalled), false);
  assert.equal(await checkMongoReadiness({ readyState: 0 }), false);
});

test('startup refuses to run without the required migration marker', async () => {
  const connection = {
    db: {
      collection: () => ({ findOne: async () => null })
    }
  };
  await assert.rejects(
    verifyRequiredMigration(connection),
    (error) => error.code === 'MIGRATION_REQUIRED'
  );
});

test('MongoDB duplicate conflicts are logged as warnings with status 409', () => {
  const originalError = logger.error;
  const originalWarn = logger.warn;
  let errors = 0;
  let warning;
  logger.error = () => {
    errors += 1;
  };
  logger.warn = (_message, context) => {
    warning = context;
  };
  try {
    const duplicate = new Error('duplicate');
    duplicate.name = 'MongoServerError';
    duplicate.code = 11000;
    duplicate.keyPattern = { canonical_url: 1 };
    const response = {
      statusCode: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json() {
        return this;
      }
    };
    errorHandler(duplicate, {}, response, () => {});
    assert.equal(response.statusCode, 409);
    assert.equal(errors, 0);
    assert.equal(warning.statusCode, 409);
  } finally {
    logger.error = originalError;
    logger.warn = originalWarn;
  }
});
