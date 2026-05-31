import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'fs/promises';

test('redirect click recording uses a transaction', async () => {
  const source = await readFile(
    new URL('../src/controllers/shortUrl.controllers.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /session\.withTransaction/);
  assert.match(source, /short_url\s*\n\s*\}\);/);
  assert.doesNotMatch(source, /short_url:\s*shortUrlData\.short_url/);
});

test('getUserUrls guards search before trim', async () => {
  const source = await readFile(
    new URL('../src/controllers/shortUrl.controllers.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /if \(search && search\.trim\(\)\)/);
});

test('index.js does not export undefined app', async () => {
  const source = await readFile(
    new URL('../index.js', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /export\s*\{\s*app\s*\}/);
});
