import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'fs/promises';

test('createCustomShortUrl distinguishes full_url duplicate from slug collision', async () => {
  const source = await readFile(
    new URL('../src/services/shortUrl.services.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /You already have a short link for this URL\./);
  assert.match(
    source,
    /keys\.includes\('full_url'\) && keys\.includes\('user'\)/
  );
});
