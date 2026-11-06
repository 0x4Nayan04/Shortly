import { describe, expect, it } from 'vitest';
import { buildVercelSecurityHeaders } from './vercelSecurityHeaders.js';

function findRule(rules, source) {
  return rules.find((rule) => rule.source === source);
}

describe('buildVercelSecurityHeaders', () => {
  it('places immutable asset Cache-Control before the catch-all', () => {
    const rules = buildVercelSecurityHeaders('https://api.example.com');
    const assetRule = findRule(rules, '/assets/(.*)');
    const catchAllRule = findRule(rules, '/(.*)');

    expect(assetRule).toBeDefined();
    expect(catchAllRule).toBeDefined();
    expect(rules.indexOf(assetRule)).toBeLessThan(rules.indexOf(catchAllRule));

    expect(assetRule.headers).toEqual([
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ]);
  });

  it('includes baseline security headers for all routes', () => {
    const rules = buildVercelSecurityHeaders('https://api.example.com');
    const rule = findRule(rules, '/(.*)');
    expect(rule).toBeDefined();

    const keys = rule.headers.map((header) => header.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Content-Security-Policy-Report-Only'
      ])
    );
  });

  it('adds API origin to CSP connect-src when provided', () => {
    const rules = buildVercelSecurityHeaders('https://api.example.com/');
    const rule = findRule(rules, '/(.*)');
    const csp = rule.headers.find(
      (header) => header.key === 'Content-Security-Policy-Report-Only'
    );
    expect(csp?.value).toContain("connect-src 'self' https://api.example.com");
    expect(csp?.value).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
  });
});
