import { useEffect } from 'react';
import {
  SHORTLY_OG_IMAGE,
  SHORTLY_OG_IMAGE_HEIGHT,
  SHORTLY_OG_IMAGE_WIDTH,
  SHORTLY_SITE_URL,
  getDocumentMetaForPath
} from '../constants/brand';

const ensureMeta = (selector, create) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

const setMetaContent = (selector, content, create) => {
  const el = ensureMeta(selector, create);
  el.setAttribute('content', content);
};

const ensureCanonicalLink = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
};

/** Sync document title, canonical URL, and description / Open Graph tags with the current route. */
export function useDocumentMeta(pathname) {
  useEffect(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : SHORTLY_SITE_URL;
    const meta = getDocumentMetaForPath(pathname, origin);

    document.title = meta.title;
    ensureCanonicalLink(meta.canonicalUrl);

    setMetaContent('meta[name="description"]', meta.description, () => {
      const el = document.createElement('meta');
      el.name = 'description';
      return el;
    });

    const ogTags = [
      ['meta[property="og:type"]', 'website'],
      ['meta[property="og:site_name"]', meta.siteName],
      ['meta[property="og:title"]', meta.title],
      ['meta[property="og:description"]', meta.description],
      ['meta[property="og:url"]', meta.canonicalUrl],
      ['meta[property="og:image"]', meta.ogImageUrl],
      ['meta[property="og:image:width"]', String(meta.ogImageWidth)],
      ['meta[property="og:image:height"]', String(meta.ogImageHeight)],
      ['meta[name="twitter:card"]', 'summary_large_image'],
      ['meta[name="twitter:title"]', meta.title],
      ['meta[name="twitter:description"]', meta.description],
      ['meta[name="twitter:image"]', meta.ogImageUrl]
    ];

    const propertySelectors = new Set();
    for (const [s] of ogTags) {
      if (s.startsWith('meta[property=')) propertySelectors.add(s);
    }
    for (const [selector, content] of ogTags) {
      const isProperty = propertySelectors.has(selector);
      setMetaContent(selector, content, () => {
        const el = document.createElement('meta');
        if (isProperty) {
          el.setAttribute(
            'property',
            selector.match(/property="([^"]+)"/)[1]
          );
        } else {
          el.name = selector.match(/name="([^"]+)"/)[1];
        }
        return el;
      });
    }
  }, [pathname]);
}
