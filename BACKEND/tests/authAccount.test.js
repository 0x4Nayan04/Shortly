import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'fs/promises';
import { serializeUser } from '../src/utils/serializeUser.js';

test('serializeUser strips email verification fields', () => {
  const user = {
    _id: 'abc',
    name: 'Test',
    email: 'test@example.com',
    isEmailVerified: false,
    emailVerificationToken: 'secret',
    emailVerificationExpires: new Date()
  };

  const serialized = serializeUser(user);
  assert.equal(serialized.isEmailVerified, false);
  assert.equal('emailVerificationToken' in serialized, false);
  assert.equal('emailVerificationExpires' in serialized, false);
});

test('GET /me uses meLimiter after authentication', async () => {
  const routes = await readFile(
    new URL('../src/routes/auth.routes.js', import.meta.url),
    'utf8'
  );
  assert.match(routes, /const meLimiter = rateLimiter\(/);
  assert.match(
    routes,
    /router\.get\('\/me', isAuthenticated, meLimiter, getUserProfile\)/
  );
});

test('profile and account routes are registered', async () => {
  const routes = await readFile(
    new URL('../src/routes/auth.routes.js', import.meta.url),
    'utf8'
  );
  assert.match(routes, /router\.patch\(\s*'\/me'/);
  assert.match(
    routes,
    /router\.delete\('\/me', isAuthenticated, deleteAccount\)/
  );
  assert.match(routes, /router\.post\(\s*'\/verify-email'/);
});

test('reset password does not issue JWT or set cookie', async () => {
  const service = await readFile(
    new URL('../src/services/auth.services.js', import.meta.url),
    'utf8'
  );
  const resetStart = service.indexOf('export const resetPassword');
  const resetFn = service.slice(resetStart, resetStart + 500);
  assert.doesNotMatch(resetFn, /signToken/);

  const controller = await readFile(
    new URL('../src/controllers/auth.controller.js', import.meta.url),
    'utf8'
  );
  const resetControllerStart = controller.indexOf('export const resetPassword');
  const resetController = controller.slice(
    resetControllerStart,
    resetControllerStart + 300
  );
  assert.doesNotMatch(resetController, /res\.cookie/);
});

test('register requires email verification when email service is configured', async () => {
  const service = await readFile(
    new URL('../src/services/auth.services.js', import.meta.url),
    'utf8'
  );
  assert.match(service, /verificationRequired: true/);
  assert.match(service, /sendVerificationEmail/);
  assert.match(service, /isEmailVerified === false/);
});

test('changePassword rejects new password equal to old password', async () => {
  const service = await readFile(
    new URL('../src/services/auth.services.js', import.meta.url),
    'utf8'
  );
  assert.match(service, /New password must be different from old password/);
});

test('update profile uses PROFILE_UPDATED success message', async () => {
  const controller = await readFile(
    new URL('../src/controllers/auth.controller.js', import.meta.url),
    'utf8'
  );
  assert.match(controller, /SUCCESS_MESSAGES\.USER\.PROFILE_UPDATED/);
});

test('README documents POST change-password', async () => {
  const readme = await readFile(
    new URL('../../README.md', import.meta.url),
    'utf8'
  );
  assert.match(readme, /\| POST\s+\| \/api\/auth\/change-password \|/);
  assert.doesNotMatch(readme, /\| PUT\s+\| \/api\/auth\/change-password \|/);
});
