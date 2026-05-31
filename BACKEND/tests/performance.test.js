import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'fs/promises';

test('attachUser does not load user from the database', async () => {
  const source = await readFile(
    new URL('../src/utils/attachUser.js', import.meta.url),
    'utf8'
  );
  const attachStart = source.indexOf('export const attachUser');
  const attachEnd = source.indexOf('export const loadUserIfAuthenticated');
  const attachFn = source.slice(attachStart, attachEnd);
  assert.doesNotMatch(attachFn, /findUserById/);
  assert.match(attachFn, /verifyToken/);
});

test('getUserProfile reuses req.user from isAuthenticated', async () => {
  const source = await readFile(
    new URL('../src/controllers/auth.controller.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /serializeUser\(req\.user\)/);
  assert.doesNotMatch(source, /findUserById/);
});

test('createShortUrl delegates dedup to the service layer', async () => {
  const controller = await readFile(
    new URL('../src/controllers/shortUrl.controllers.js', import.meta.url),
    'utf8'
  );
  const createStart = controller.indexOf('export const createShortUrl');
  const createFn = controller.slice(createStart, createStart + 900);
  assert.doesNotMatch(createFn, /short_urlModel\.findOne/);
  assert.match(createFn, /createShortUrlService/);
  assert.doesNotMatch(createFn, /createShortUrlWithUser/);
  assert.doesNotMatch(createFn, /createShortUrlWithoutUser/);
});

test('getUrlStats consolidates short_url aggregations with $facet', async () => {
  const source = await readFile(
    new URL('../src/controllers/shortUrl.controllers.js', import.meta.url),
    'utf8'
  );
  const statsStart = source.indexOf('export const getUrlStats');
  const statsFn = source.slice(statsStart, statsStart + 1200);
  assert.match(statsFn, /\$facet/);
  assert.doesNotMatch(
    statsFn,
    /Promise\.all\(\[[\s\S]*short_urlModel\.aggregate\([\s\S]*short_urlModel\.aggregate/
  );
});

test('getClickAggregates uses a single $facet pipeline', async () => {
  const source = await readFile(
    new URL('../src/services/analytics.service.js', import.meta.url),
    'utf8'
  );
  assert.match(source, /\$facet/);
  const facetCount = (source.match(/\$facet/g) || []).length;
  assert.equal(facetCount, 1);
});
