import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTokenFromRequest,
  isTokenVersionValid
} from '../src/utils/authToken.js';

test('getTokenFromRequest reads cookie token first', () => {
  const req = {
    cookies: { token: 'cookie-token' },
    headers: { authorization: 'Bearer header-token' }
  };
  assert.equal(getTokenFromRequest(req), 'cookie-token');
});

test('getTokenFromRequest reads bearer token when cookie missing', () => {
  const req = {
    cookies: {},
    headers: { authorization: 'Bearer header-token' }
  };
  assert.equal(getTokenFromRequest(req), 'header-token');
});

test('isTokenVersionValid compares token versions', () => {
  assert.equal(
    isTokenVersionValid({ tokenVersion: 2 }, { tokenVersion: 2 }),
    true
  );
  assert.equal(
    isTokenVersionValid({ tokenVersion: 1 }, { tokenVersion: 2 }),
    false
  );
  assert.equal(isTokenVersionValid({ tokenVersion: 0 }, {}), false);
});
