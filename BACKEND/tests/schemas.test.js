import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  resetPasswordSchema,
  shortUrlParamsSchema,
  qrQuerySchema
} from '../src/validation/schemas.js';

test('registerSchema rejects passwords shorter than 6 characters', () => {
  const { error } = registerSchema.validate({
    name: 'Test User',
    email: 'user@example.com',
    password: '12345'
  });
  assert.ok(error);
});

test('registerSchema accepts passwords with at least 6 characters', () => {
  const { error, value } = registerSchema.validate({
    name: 'Test User',
    email: 'user@example.com',
    password: 'pass12'
  });
  assert.equal(error, undefined);
  assert.equal(value.password, 'pass12');
});

test('resetPasswordSchema requires at least 6 characters', () => {
  const { error } = resetPasswordSchema.validate({
    token: 'abc123',
    password: '12345'
  });
  assert.ok(error);
});

test('shortUrlParamsSchema rejects invalid slug characters', () => {
  const { error } = shortUrlParamsSchema.validate({ short_url: '../etc/passwd' });
  assert.ok(error);
});

test('qrQuerySchema accepts png and svg formats', () => {
  assert.equal(qrQuerySchema.validate({ format: 'png' }).error, undefined);
  assert.equal(qrQuerySchema.validate({ format: 'svg' }).error, undefined);
  assert.ok(qrQuerySchema.validate({ format: 'pdf' }).error);
});
