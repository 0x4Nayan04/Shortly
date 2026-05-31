import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shortly_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_with_at_least_32_chars';
process.env.FRONT_END_URL =
  process.env.FRONT_END_URL || 'http://localhost:5173';
process.env.PORT = process.env.PORT || '3099';
process.env.NODE_ENV = 'test';

import { createApp } from '../src/app.js';
import { connectTestMongo, disconnectTestMongo } from './helpers/testMongo.js';

function request(app, method, path) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.request(
        { host: '127.0.0.1', port, path, method },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            server.close();
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body
            });
          });
        }
      );
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      req.end();
    });
  });
}

test('unmatched multi-segment path returns JSON 404', async () => {
  const app = createApp();
  const res = await request(app, 'GET', '/foo/bar/baz');
  assert.equal(res.status, 404);
  const json = JSON.parse(res.body);
  assert.equal(json.success, false);
  assert.match(json.message, /not found/i);
});

test('QR route rejects invalid slug format', async () => {
  const app = createApp();
  const res = await request(app, 'GET', '/api/qr/bad%20slug');
  assert.equal(res.status, 400);
});

test.describe('MongoDB integration', () => {
  test.before(async () => {
    await connectTestMongo();
  });

  test.after(async () => {
    await disconnectTestMongo();
  });

  test('health endpoint returns structured payload', async () => {
    const app = createApp();
    const res = await request(app, 'GET', '/api/health');
    assert.equal(res.status, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(json.data.mongo);
  });

  test('unknown short URL returns 404 JSON', async () => {
    const app = createApp();
    const res = await request(app, 'GET', '/does-not-exist-xyz');
    assert.equal(res.status, 404);
    const json = JSON.parse(res.body);
    assert.equal(json.success, false);
  });
});
