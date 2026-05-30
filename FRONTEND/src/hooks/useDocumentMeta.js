import { useEffect } from 'react';
import {
  getDocumentTitleForPath,
  SHORTLY_META_DESCRIPTION,
  SHORTLY_OG_IMAGE,
  SHORTLY_OG_IMAGE_HEIGHT,
  SHORTLY_OG_IMAGE_WIDTH,
  SHORTLY_SITE_URL
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

/** Sync document title and description / Open Graph tags with the current route. */
export function useDocumentMeta(pathname) {
  useEffect(() => {
    const title = getDocumentTitleForPath(pathname);
    document.title = title;

    const origin =
      typeof window !== 'undefined' ? window.location.origin : SHORTLY_SITE_URL;
    const canonicalUrl = `${origin}${pathname === '/' ? '' : pathname}`;
    const ogImageUrl = `${origin}${SHORTLY_OG_IMAGE}`;

    setMetaContent('meta[name="description"]', SHORTLY_META_DESCRIPTION, () => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      return meta;
    });

    const ogTags = [
      ['meta[property="og:type"]', 'website'],
      ['meta[property="og:site_name"]', 'Shortly'],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', SHORTLY_META_DESCRIPTION],
      ['meta[property="og:url"]', canonicalUrl],
      ['meta[property="og:image"]', ogImageUrl],
      ['meta[property="og:image:width"]', String(SHORTLY_OG_IMAGE_WIDTH)],
      ['meta[property="og:image:height"]', String(SHORTLY_OG_IMAGE_HEIGHT)],
      ['meta[name="twitter:card"]', 'summary_large_image'],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', SHORTLY_META_DESCRIPTION],
      ['meta[name="twitter:image"]', ogImageUrl]
    ];

    for (const [selector, content] of ogTags) {
      const isProperty = selector.includes('property=');
      setMetaContent(selector, content, () => {
        const meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute(
            'property',
            selector.match(/property="([^"]+)"/)[1]
          );
        } else {
          meta.name = selector.match(/name="([^"]+)"/)[1];
        }
        return meta;
      });
    }
  }, [pathname]);
}
