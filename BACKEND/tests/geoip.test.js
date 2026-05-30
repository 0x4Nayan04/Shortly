import test from 'node:test';
import assert from 'node:assert/strict';
import { getCountryFromRequest } from '../src/utils/geoip.js';

test('getCountryFromRequest returns empty string for malformed IP', () => {
  const req = { ip: 'not-an-ip', headers: {} };
  assert.equal(getCountryFromRequest(req), '');
});

test('getCountryFromRequest handles missing IP gracefully', () => {
  const req = { headers: {} };
  assert.equal(getCountryFromRequest(req), '');
});
