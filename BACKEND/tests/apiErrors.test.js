import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';

process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shortly_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_with_at_least_32_chars';
process.env.FRONT_END_URL =
  process.env.FRONT_END_URL || 'http://localhost:5173';
process.env.PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL || 'http://localhost:3001';
process.env.PORT = process.env.PORT || '3099';
process.env.NODE_ENV = 'test';

function request(app, method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.request(
        { host: '127.0.0.1', port, path, method, headers },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            server.close();
            resolve({ status: res.statusCode, headers: res.headers, body });
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

test('unknown API route returns JSON 404 envelope', async () => {
  const app = createApp();
  const res = await request(app, 'GET', '/api/does-not-exist');
  assert.equal(res.status, 404);
  const json = JSON.parse(res.body);
  assert.equal(json.success, false);
  assert.match(json.message, /not found/i);
});

test('rejected CORS origin returns 403 JSON envelope', async () => {
  const app = createApp();
  const res = await request(app, 'GET', '/api/health', {
    Origin: 'https://evil.example.com'
  });
  assert.equal(res.status, 403);
  const json = JSON.parse(res.body);
  assert.equal(json.success, false);
  assert.match(json.message, /CORS/i);
});
