/**
 * Security headers applied to frontend HTML and static assets on Vercel.
 * CSP is report-only so violations can be monitored before enforcement.
 */

function buildContentSecurityPolicyReportOnly(apiOrigin) {
  const connectSources = ["'self'"];
  if (apiOrigin) {
    connectSources.push(apiOrigin.replace(/\/$/, ''));
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self'",
    `connect-src ${connectSources.join(' ')}`
  ].join('; ');
}

/** @param {string} [apiOrigin] Backend origin for connect-src in CSP. */
export function buildVercelSecurityHeaders(apiOrigin) {
  const csp = buildContentSecurityPolicyReportOnly(apiOrigin);

  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value:
            'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        },
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'off'
        },
        {
          key: 'Content-Security-Policy-Report-Only',
          value: csp
        }
      ]
    }
  ];
}
