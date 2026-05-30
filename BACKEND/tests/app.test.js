import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import mongoose from 'mongoose';

process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shortly_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_with_at_least_32_chars';
process.env.FRONT_END_URL =
  process.env.FRONT_END_URL || 'http://localhost:5173';
process.env.PORT = process.env.PORT || '3099';
process.env.NODE_ENV = 'test';

import { createApp } from '../src/app.js';

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

async function canReachMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    await mongoose.disconnect();
    return true;
  } catch {
    return false;
  }
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
  const res = await request(app, 'GET', '/api/v1/qr/bad%20slug');
  assert.equal(res.status, 400);
});

test('health endpoint returns structured payload', async (t) => {
  if (!(await canReachMongo())) {
    t.skip('MongoDB not available');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  });
  const app = createApp();
  const res = await request(app, 'GET', '/api/v1/health');
  await mongoose.disconnect();
  assert.equal(res.status, 200);
  const json = JSON.parse(res.body);
  assert.equal(json.success, true);
  assert.ok(json.data.mongo);
});

test('unknown short URL returns 404 JSON', async (t) => {
  if (!(await canReachMongo())) {
    t.skip('MongoDB not available');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  });
  const app = createApp();
  const res = await request(app, 'GET', '/does-not-exist-xyz');
  await mongoose.disconnect();
  assert.equal(res.status, 404);
  const json = JSON.parse(res.body);
  assert.equal(json.success, false);
});
