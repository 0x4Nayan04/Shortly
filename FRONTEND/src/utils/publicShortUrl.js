/**
 * Base URL for public short links (display, copy, QR in SPA).
 * Falls back to VITE_APP_URL when API and short-link host are the same.
 */
export function getPublicShortBaseUrl() {
  const configured =
    import.meta.env.VITE_PUBLIC_SHORT_URL?.trim() ||
    import.meta.env.VITE_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  // Dev: same origin as SPA — Vite proxies slug paths to the backend redirect handler
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

/** Public short link for compact UI (host/slug, no protocol). Falls back to slug alone. */
export function formatPublicShortUrlForDisplay(slug) {
  const slugPart = slug?.trim() ?? '';
  if (!slugPart) return '';

  const full = buildPublicShortUrl(slugPart);
  if (!full) return slugPart;

  return full.replace(/^https?:\/\//, '');
}

/** Host + slug parts for compact dashboard / table display (copy still uses full URL). */
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

/**
 * Host string for landing catalog visuals — uses the same origin as short links.
 * VITE_LANDING_SHORT_HOST overrides; otherwise VITE_PUBLIC_SHORT_URL / dev origin.
 */
export function getLandingCatalogShortHost() {
  const override = import.meta.env.VITE_LANDING_SHORT_HOST?.trim();
  if (override) {
    return override.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  const base = getPublicShortBaseUrl();
  if (!base) return 'localhost';

  return base.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Split host for mono display: brand label + TLD (e.g. shortly + .app). */
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
