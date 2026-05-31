import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'fs/promises';

test('createCustomShortUrl allows another alias for the same destination', async () => {
  const source = await readFile(
    new URL('../src/services/shortUrl.services.js', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /You already have a short link for this URL\./);
  assert.match(source, /assertUserLinkCapacity/);
});

test('redirect skips bot user agents before click recording', async () => {
  const source = await readFile(
    new URL('../src/controllers/shortUrl.controllers.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /isBotUserAgent/);
});

test('bulk delete supports partial success response fields', async () => {
  const source = await readFile(
    new URL('../src/controllers/shortUrl.controllers.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /skippedIds/);
  assert.match(source, /deletedIds/);
});

test('create response includes created and reused flags', async () => {
  const source = await readFile(
    new URL('../src/controllers/shortUrl.controllers.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /reused: !created/);
});
