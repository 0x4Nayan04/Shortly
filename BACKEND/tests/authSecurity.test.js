import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeUser } from '../src/utils/serializeUser.js';
import { isTokenVersionValid } from '../src/utils/authToken.js';
import { isPasswordResetEmailConfigured } from '../src/services/email.service.js';
import { csrfProtection } from '../src/middleware/csrf.middleware.js';

test('serializeUser strips internal fields', () => {
  const user = {
    _id: 'abc',
    name: 'Test',
    email: 'test@example.com',
    avatar: 'https://example.com/a.png',
    password: 'hash',
    resetPasswordToken: 'secret',
    resetPasswordExpires: new Date(),
    tokenVersion: 2,
    __v: 0
  };

  const serialized = serializeUser(user);
  assert.equal(serialized.name, 'Test');
  assert.equal(serialized.email, 'test@example.com');
  assert.equal('password' in serialized, false);
  assert.equal('resetPasswordToken' in serialized, false);
  assert.equal('resetPasswordExpires' in serialized, false);
  assert.equal('tokenVersion' in serialized, false);
});

test('isTokenVersionValid rejects tokens without tokenVersion', () => {
  const user = { tokenVersion: 1 };
  assert.equal(isTokenVersionValid(user, { id: 'x' }), false);
});

test('isTokenVersionValid accepts matching tokenVersion', () => {
  const user = { tokenVersion: 2 };
  assert.equal(isTokenVersionValid(user, { tokenVersion: 2 }), true);
});

test('isTokenVersionValid rejects stale tokenVersion', () => {
  const user = { tokenVersion: 3 };
  assert.equal(isTokenVersionValid(user, { tokenVersion: 2 }), false);
});

test('isPasswordResetEmailConfigured requires RESEND_API_KEY', () => {
  const previous = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.equal(isPasswordResetEmailConfigured(), false);
  process.env.RESEND_API_KEY = 're_test_key';
  assert.equal(isPasswordResetEmailConfigured(), true);
  if (previous === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = previous;
});

function runCsrf(req) {
  return new Promise((resolve) => {
    csrfProtection(req, {}, (err) => resolve(err || null));
  });
}

test('csrfProtection rejects cookie-backed writes from untrusted origins', async () => {
  const previousFrontEndUrl = process.env.FRONT_END_URL;
  process.env.FRONT_END_URL = 'https://app.example.com';

  const err = await runCsrf({
    method: 'POST',
    protocol: 'https',
    cookies: { token: 'cookie-token' },
    get(header) {
      if (header.toLowerCase() === 'origin') return 'https://evil.example.com';
      if (header.toLowerCase() === 'host') return 'api.example.com';
      return undefined;
    }
  });

  assert.equal(err?.statusCode, 403);
  if (previousFrontEndUrl === undefined) delete process.env.FRONT_END_URL;
  else process.env.FRONT_END_URL = previousFrontEndUrl;
});

test('csrfProtection allows trusted frontend origins', async () => {
  const previousFrontEndUrl = process.env.FRONT_END_URL;
  process.env.FRONT_END_URL = 'https://app.example.com';

  const err = await runCsrf({
    method: 'POST',
    protocol: 'https',
    cookies: { token: 'cookie-token' },
    get(header) {
      if (header.toLowerCase() === 'origin') return 'https://app.example.com';
      if (header.toLowerCase() === 'host') return 'api.example.com';
      return undefined;
    }
  });

  assert.equal(err, null);
  if (previousFrontEndUrl === undefined) delete process.env.FRONT_END_URL;
  else process.env.FRONT_END_URL = previousFrontEndUrl;
});
