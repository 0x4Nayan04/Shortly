import { describe, expect, it } from 'vitest';
import { buildVercelSecurityHeaders } from './vercelSecurityHeaders.js';

describe('buildVercelSecurityHeaders', () => {
  it('includes baseline security headers for all routes', () => {
    const [rule] = buildVercelSecurityHeaders('https://api.example.com');
    expect(rule.source).toBe('/(.*)');

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
    const [rule] = buildVercelSecurityHeaders('https://api.example.com/');
    const csp = rule.headers.find(
      (header) => header.key === 'Content-Security-Policy-Report-Only'
    );
    expect(csp?.value).toContain("connect-src 'self' https://api.example.com");
    expect(csp?.value).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
  });
});
