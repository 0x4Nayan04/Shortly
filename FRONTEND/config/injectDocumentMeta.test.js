import { describe, expect, it } from 'vitest';
import { getDocumentMetaForPath } from './documentMeta.js';
import { injectDocumentMeta } from './injectDocumentMeta.js';

const BASE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Shortly · Short links &amp; analytics</title>
    <meta name="description" content="Default description" />
    <meta property="og:title" content="Shortly · Short links &amp; analytics" />
    <meta property="og:description" content="Default description" />
    <meta name="twitter:title" content="Shortly · Short links &amp; analytics" />
  </head>
  <body><div id="root"></div></body>
</html>`;

describe('injectDocumentMeta', () => {
  it('replaces title, description, social tags, and canonical link', () => {
    const meta = getDocumentMetaForPath('/privacy', 'https://shortly.example.com');
    const html = injectDocumentMeta(BASE_HTML, meta);

    expect(html).toContain('<title>Privacy · Shortly</title>');
    expect(html).toContain('content="Shortly privacy policy');
    expect(html).toContain('property="og:url" content="https://shortly.example.com/privacy"');
    expect(html).toContain('rel="canonical" href="https://shortly.example.com/privacy"');
    expect(html).toContain('name="twitter:title" content="Privacy · Shortly"');
  });
});
