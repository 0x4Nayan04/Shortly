import { createHash } from 'node:crypto';

const css = `body{margin:0;background:#f8f9fb;color:#171b25;font:16px/1.6 system-ui,sans-serif}main{box-sizing:border-box;max-width:560px;margin:12vh auto;padding:32px}a{color:#1847bd} .brand{font-size:1.25rem;font-weight:700;text-decoration:none}h1{font-size:2rem;line-height:1.2;margin:48px 0 12px}p{color:#485264}.home{display:inline-block;margin-top:16px;padding:10px 18px;background:#204ecf;color:#fff;text-decoration:none}.home:focus-visible,.brand:focus-visible{outline:3px solid #171b25;outline-offset:3px}`;
const styleHash = createHash('sha256').update(css).digest('base64');

// Only redirect failures use this handler; API and non-browser responses keep JSON.
export function shortLinkErrorPage(err, req, res, next) {
  if (![404, 410].includes(err.statusCode)) return next(err);
  res.vary('Accept');
  const accept = req.get('Accept') || '';
  if (!/text\/html/i.test(accept) || req.accepts(['html', 'json']) !== 'html') {
    return next(err);
  }

  const home = new URL(process.env.FRONT_END_URL).origin
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  res.set('Cache-Control', 'no-store');
  res.set(
    'Content-Security-Policy',
    `default-src 'none'; style-src 'sha256-${styleHash}'; base-uri 'none'; frame-ancestors 'none'`
  );
  return res
    .status(err.statusCode)
    .type('html')
    .send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Link unavailable · Shortly</title><style>${css}</style></head><body><main><a class="brand" href="${home}">Shortly</a><h1>This link is unavailable</h1><p>It may have been disabled, removed, or the address may be incorrect. Check the link or ask its owner for a new one.</p><a class="home" href="${home}">Go to Shortly</a></main></body></html>`
    );
}
