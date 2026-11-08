import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const logo = readFileSync(
  new URL('../assets/shortly-logo.webp', import.meta.url)
).toString('base64');

const css = `
*{box-sizing:border-box}
body{margin:0;background:#f5f9ff;color:#0b1015;font:16px/1.6 "DM Sans",system-ui,sans-serif}
.frame{width:min(100%,72rem);min-height:100dvh;margin:auto;border-inline:1px solid #c5dbf2;background:#fff;display:flex;flex-direction:column}
header{height:64px;border-bottom:1px solid #c5dbf2;display:flex;align-items:center;padding:0 clamp(1.25rem,4vw,3rem)}
.brand{display:inline-flex;align-items:center;color:#0b1015;font-size:1.45rem;font-weight:700;text-decoration:none}.brand img{width:124px;height:28px;object-fit:contain;object-position:left}
main{flex:1;display:grid;place-items:center;padding:4rem 1.25rem;text-align:center}
.content{max-width:35rem}h1{margin:0 0 1rem;font-size:clamp(2.25rem,5vw,3.5rem);line-height:1.08;letter-spacing:-.03em;font-weight:600;text-wrap:balance}
p{margin:0 auto;max-width:31rem;color:#485769;font-size:1rem;line-height:1.65}
.home{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin-top:2rem;padding:.65rem 1.25rem;background:#0562ef;color:#fff;text-decoration:none;font-weight:600}
.home:hover{background:#004ec4}.home:focus-visible,.brand:focus-visible{outline:3px solid #0562ef;outline-offset:4px}
footer{border-top:1px solid #c5dbf2;padding:1.25rem clamp(1.25rem,4vw,3rem);color:#485769;font-size:.875rem}
@media(max-width:600px){main{padding:3rem 1.25rem}header{height:60px}footer{text-align:center}}
`;
const styleHash = createHash('sha256').update(css).digest('base64');


export function shortLinkErrorPage(err, req, res, next) {
  if (![404, 410].includes(err.statusCode)) return next(err);
  res.vary('Accept');
  const accept = req.get('Accept') || '';
  if (!/text\/html/i.test(accept) || req.accepts(['html', 'json']) !== 'html') {
    return next(err);
  }

  const origin = new URL(process.env.FRONT_END_URL).origin;
  const home = origin.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  res.set('Cache-Control', 'no-store');
  res.set(
    'Content-Security-Policy',
    `default-src 'none'; style-src 'sha256-${styleHash}'; img-src data:; base-uri 'none'; frame-ancestors 'none'`
  );
  return res
    .status(err.statusCode)
    .type('html')
    .send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Link unavailable · Shortly</title><style>${css}</style></head><body><div class="frame"><header><a class="brand" href="${home}" aria-label="Shortly — home"><img src="data:image/webp;base64,${logo}" alt="Shortly" width="124" height="28"></a></header><main id="main-content"><div class="content"><h1>This link is unavailable</h1><p>It may have been disabled, removed, or the address may be incorrect. Check the link or ask its owner for a new one.</p><a class="home" href="${home}">Go to Shortly</a></div></main><footer>Shortly · Short links, made simple.</footer></div></body></html>`
    );
}
