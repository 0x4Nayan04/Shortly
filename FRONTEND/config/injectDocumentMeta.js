/**
 * Inject route-specific document metadata into a built index.html shell.
 * Used for crawler-facing SEO pages generated at build time.
 */

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertMetaByAttr(html, attrName, attrValue, content) {
  const regex = new RegExp(
    `<meta[^>]*${attrName}=["']${escapeRegExp(attrValue)}["'][^>]*>`,
    'i'
  );
  const tag = `<meta ${attrName}="${escapeHtml(attrValue)}" content="${escapeHtml(content)}" />`;

  if (regex.test(html)) {
    return html.replace(regex, tag);
  }

  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function upsertLink(html, rel, href) {
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}" />`;
  const existing = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]*>`, 'i');
  if (existing.test(html)) {
    return html.replace(existing, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

/** @param {string} html @param {ReturnType<import('./documentMeta.js').getDocumentMetaForPath>} meta */
export function injectDocumentMeta(html, meta) {
  let next = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(meta.title)}</title>`
  );

  next = upsertMetaByAttr(next, 'name', 'description', meta.description);

  const ogEntries = [
    ['og:type', 'website'],
    ['og:site_name', meta.siteName],
    ['og:title', meta.title],
    ['og:description', meta.description],
    ['og:url', meta.canonicalUrl],
    ['og:image', meta.ogImageUrl],
    ['og:image:width', String(meta.ogImageWidth)],
    ['og:image:height', String(meta.ogImageHeight)]
  ];

  for (const [property, content] of ogEntries) {
    next = upsertMetaByAttr(next, 'property', property, content);
  }

  const twitterEntries = [
    ['twitter:card', 'summary_large_image'],
    ['twitter:title', meta.title],
    ['twitter:description', meta.description],
    ['twitter:image', meta.ogImageUrl]
  ];

  for (const [name, content] of twitterEntries) {
    next = upsertMetaByAttr(next, 'name', name, content);
  }

  next = upsertLink(next, 'canonical', meta.canonicalUrl);
  return next;
}
