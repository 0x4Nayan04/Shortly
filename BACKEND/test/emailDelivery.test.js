import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchPasswordResetForUser, dispatchVerificationForUser } from '../src/services/email.service.js';

process.env.RESEND_API_KEY = 're_test_only';
process.env.RESEND_FROM_EMAIL = 'Shortly <test@example.com>';
process.env.FRONT_END_URL = 'http://localhost:5173';

for (const [name, dispatch, tokenField, expiresField, generator] of [
  ['verification', dispatchVerificationForUser, 'emailVerificationToken', 'emailVerificationExpires', 'generateEmailVerificationToken'],
  ['reset', dispatchPasswordResetForUser, 'resetPasswordToken', 'resetPasswordExpires', 'generateResetToken']
]) {
  test(`${name} reports provider rejection and clears the issued token`, async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'provider rejected email' }), { status: 403 }));
    const user = { email: 'person@example.com', [tokenField]: 'hash', [expiresField]: new Date(), [generator]: () => 'token', save: mock.fn(async () => {}) };
    try {
      await assert.rejects(dispatch(user), /Failed to send/);
      assert.equal(user[tokenField], null);
      assert.equal(user[expiresField], null);
      assert.equal(user.save.mock.calls.length, 2);
    } finally { fetchMock.mock.restore(); }
  });
}
