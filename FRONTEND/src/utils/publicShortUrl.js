/**
 * Base URL for public short links (display, copy, QR in SPA).
 */
export function getPublicShortBaseUrl() {
  const configured =
    import.meta.env.VITE_PUBLIC_SHORT_URL?.trim() ||
    import.meta.env.VITE_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export function buildPublicShortUrl(slug) {
  const base = getPublicShortBaseUrl();
  if (!base || !slug) return '';
  return `${base}/${slug}`;
}

export function formatPublicShortUrlForDisplay(slug) {
  const slugPart = slug?.trim() ?? '';
  if (!slugPart) return '';

  const full = buildPublicShortUrl(slugPart);
  if (!full) return slugPart;

  return full.replace(/^https?:\/\//, '');
}

export function getShortLinkDisplayParts(slug) {
  const slugPart = slug?.trim() ?? '';
  const full = buildPublicShortUrl(slugPart);

  if (!slugPart) {
    return { full: '', hostLead: '', hostTrail: '', slug: '' };
  }

  if (!full) {
    return { full: '', hostLead: '', hostTrail: '', slug: slugPart };
  }

  try {
    const { host } = new URL(full);
    const { lead, trail } = splitShortHostForDisplay(host);
    return { full, hostLead: lead, hostTrail: trail, slug: slugPart };
  } catch {
    return { full, hostLead: '', hostTrail: '', slug: slugPart };
  }
}

export function getLandingCatalogShortHost() {
  const override = import.meta.env.VITE_LANDING_SHORT_HOST?.trim();
  if (override) {
    return override.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  const base = getPublicShortBaseUrl();
  if (!base) return 'localhost';

  return base.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function splitShortHostForDisplay(host) {
  if (!host) return { lead: 'localhost', trail: '' };

  const isSingleLabel =
    !host.includes('.') ||
    /^localhost(:\d+)?$/i.test(host) ||
    /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(host) ||
    host.endsWith('.local');

  if (isSingleLabel) {
    return { lead: host, trail: '' };
  }

  const dot = host.indexOf('.');
  return {
    lead: host.slice(0, dot),
    trail: host.slice(dot)
  };
}
