/**
 * Base URL for public short links (display, copy, QR in SPA).
 * Falls back to VITE_APP_URL when API and short-link host are the same.
 */
export function getPublicShortBaseUrl() {
  const configured =
    import.meta.env.VITE_PUBLIC_SHORT_URL?.trim() ||
    import.meta.env.VITE_APP_URL?.trim();
  return configured ? configured.replace(/\/$/, '') : '';
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

const LANDING_SHORT_HOST_FALLBACK = 'shortly.nayan04.me';

/**
 * Host string for landing catalog visuals — readable short-link previews.
 * Uses VITE_LANDING_SHORT_HOST, else production host when env points at localhost.
 */
export function getLandingCatalogShortHost() {
  const override = import.meta.env.VITE_LANDING_SHORT_HOST?.trim();
  if (override) {
    return override.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  const base = getPublicShortBaseUrl();
  if (!base) return LANDING_SHORT_HOST_FALLBACK;

  const host = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const isLocal =
    /^localhost(:\d+)?$/i.test(host) ||
    /^127\.0\.0\.1(:\d+)?$/i.test(host) ||
    host.endsWith('.local');

  if (isLocal) return LANDING_SHORT_HOST_FALLBACK;

  return host;
}

/** Split host for mono display: shortly + .nayan04.me */
export function splitShortHostForDisplay(host) {
  if (!host) return { lead: LANDING_SHORT_HOST_FALLBACK, trail: '' };

  const isSingleLabel =
    !host.includes('.') ||
    /^localhost(:\d+)?$/i.test(host) ||
    /^127\.0\.0\.1(:\d+)?$/i.test(host);

  if (isSingleLabel) {
    return { lead: host, trail: '' };
  }

  const dot = host.indexOf('.');
  return {
    lead: host.slice(0, dot),
    trail: host.slice(dot)
  };
}
