import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { shortLinkErrorPage } from '../src/utils/shortLinkErrorPage.js';

process.env.FRONT_END_URL = 'https://shortly.example';
const app = express();
app.get('/:status', (req, _res, next) => next(Object.assign(new Error('failure'), { statusCode: Number(req.params.status) })), shortLinkErrorPage);
app.use((err, _req, res, _next) => res.status(err.statusCode).json({ message: err.message }));

for (const status of [404, 410]) {
  test(`redirect ${status} renders a page for browsers and JSON for clients`, async () => {
    const html = await request(app).get(`/${status}`).set('Accept', 'text/html,application/xhtml+xml');
    assert.equal(html.status, status);
    assert.match(html.headers['content-type'], /text\/html/);
    assert.match(html.text, /This link is unavailable/);
    assert.match(html.headers.vary, /Accept/);
    assert.equal(html.headers['cache-control'], 'no-store');
    const json = await request(app).get(`/${status}`).set('Accept', 'application/json');
    assert.deepEqual(json.body, { message: 'failure' });
    assert.equal((await request(app).get(`/${status}`)).type, 'application/json');
  });
}
