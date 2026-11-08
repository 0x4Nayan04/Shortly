



import { createHash } from 'node:crypto';


const stylesheetHandlerHashes = ["this.media = 'all'", "this.media='all'"]
  .map((handler) => `'sha256-${createHash('sha256').update(handler).digest('base64')}'`)
  .join(' ');

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
    `script-src 'self' 'unsafe-hashes' ${stylesheetHandlerHashes}`,
    `connect-src ${connectSources.join(' ')}`
  ].join('; ');
}


export function buildVercelSecurityHeaders(apiOrigin) {
  const csp = buildContentSecurityPolicyReportOnly(apiOrigin);

  return [
    {
      source: '/assets/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    },
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
