import test from 'node:test';
import assert from 'node:assert/strict';

test('validateEnvFormats rejects ALLOWED_ORIGINS wildcard in production', async () => {
  const env = {
    MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
    JWT_SECRET: 'test_jwt_secret_with_at_least_32_chars',
    FRONT_END_URL: 'https://app.example.com',
    PORT: '3001',
    NODE_ENV: 'production',
    PUBLIC_BASE_URL: 'https://api.example.com',
    ALLOWED_ORIGINS: 'https://app.example.com,*'
  };

  const previous = {};
  for (const key of Object.keys(env)) {
    previous[key] = process.env[key];
    process.env[key] = env[key];
  }

  try {
    const { validateEnvFormats } = await import('../src/utils/validateEnv.js');
    assert.throws(() => validateEnvFormats(), /must not include "\*"/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
