import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeRedirectUrl } from '../src/utils/safeRedirectUrl.js';

test('isSafeRedirectUrl allows public http and https URLs', () => {
  assert.equal(isSafeRedirectUrl('https://example.com/path'), true);
  assert.equal(isSafeRedirectUrl('http://example.com/path'), true);
});

test('isSafeRedirectUrl rejects private and local targets', () => {
  assert.equal(isSafeRedirectUrl('http://localhost:3000'), false);
  assert.equal(isSafeRedirectUrl('http://127.0.0.1/admin'), false);
  assert.equal(isSafeRedirectUrl('http://192.168.1.1/'), false);
  assert.equal(isSafeRedirectUrl('http://10.0.0.1/'), false);
});

test('isSafeRedirectUrl rejects dangerous schemes', () => {
  assert.equal(isSafeRedirectUrl('javascript:alert(1)'), false);
  assert.equal(isSafeRedirectUrl('//evil.com'), false);
  assert.equal(isSafeRedirectUrl(''), false);
  assert.equal(isSafeRedirectUrl('ftp://files.example.com'), false);
});
