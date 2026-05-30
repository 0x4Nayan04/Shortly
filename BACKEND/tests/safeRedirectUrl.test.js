import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeRedirectUrl } from '../src/utils/safeRedirectUrl.js';

test('isSafeRedirectUrl allows http and https URLs', () => {
  assert.equal(isSafeRedirectUrl('https://example.com/path'), true);
  assert.equal(isSafeRedirectUrl('http://localhost:3000'), true);
});

test('isSafeRedirectUrl rejects dangerous schemes', () => {
  assert.equal(isSafeRedirectUrl('javascript:alert(1)'), false);
  assert.equal(isSafeRedirectUrl('//evil.com'), false);
  assert.equal(isSafeRedirectUrl(''), false);
  assert.equal(isSafeRedirectUrl('ftp://files.example.com'), false);
});
