import test from 'node:test';
import assert from 'node:assert/strict';
import { retryWithBackoff } from '../src/utils/retry.js';

test('retryWithBackoff succeeds after transient failures', async () => {
  let attempts = 0;
  await retryWithBackoff(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error('temporary');
    },
    { retries: 3, baseDelayMs: 1 }
  );
  assert.equal(attempts, 3);
});

test('retryWithBackoff calls onFinalError without throwing', async () => {
  let finalError;
  await retryWithBackoff(
    async () => {
      throw new Error('permanent');
    },
    {
      retries: 1,
      baseDelayMs: 1,
      onFinalError: (err) => {
        finalError = err;
      }
    }
  );
  assert.equal(finalError?.message, 'permanent');
});
