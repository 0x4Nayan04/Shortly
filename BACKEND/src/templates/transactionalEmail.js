/**
 * Transactional email layout — table + inline styles for email client support.
 */

/** @type {Readonly<Record<string, string>>} */
export const EMAIL_TOKENS = Object.freeze({
  primary: '#0562ef',
  primaryActive: '#0263ef',
  ink: '#0b1015',
  muted: '#6b7480',
  mutedLight: '#888e94',
  border: '#c5dbf2',
  surface: '#ffffff',
  background: '#f5f9ff',
  blueTint: '#eaf2ff',
  backgroundAlt: '#e9f2ff',
  accent: '#7cb7ff',
  fontSans: "'DM Sans', Arial, Helvetica, sans-serif",
  fontDisplay: "'Space Grotesk', 'DM Sans', Arial, Helvetica, sans-serif",
  fontMono: "'DM Mono', 'Courier New', monospace"
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function normalizeFrontEndBase(url) {
  return (url || '').replace(/\/+$/, '');
}

export function buildFrontEndUrl(base, path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeFrontEndBase(base)}${normalizedPath}`;
}

const LOGO_PATH = '/assets/Shortly_Logo_nav.png';

function isPrivateOrigin(url) {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    );
  } catch {
    return true;
  }
}

/** Public origin for email images (Gmail etc. cannot load localhost). */
export function resolveEmailAssetBase(frontEndUrl) {
  const explicit = process.env.EMAIL_ASSET_BASE_URL?.trim();
  if (explicit) {
    return normalizeFrontEndBase(explicit);
  }

  const base = normalizeFrontEndBase(frontEndUrl);
  if (base && !isPrivateOrigin(base)) {
    return base;
  }

  return null;
}

export function resolveEmailLogoUrl(frontEndUrl) {
  const assetBase = resolveEmailAssetBase(frontEndUrl);
  if (!assetBase) {
    return null;
  }
  return `${assetBase}${LOGO_PATH}`;
}

function buildEmailHeaderHtml({ homeUrl, logoUrl, tokens: t }) {
  const wordmark = `<span style="font-family:${t.fontDisplay};font-size:20px;font-weight:500;letter-spacing:-0.04em;color:${t.primary};">Shortly</span>`;

  const logoCell = logoUrl
    ? `<a href="${homeUrl}" style="text-decoration:none;display:inline-block;">
        <img src="${logoUrl}" width="120" height="32" alt="Shortly" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:120px;" />
      </a>`
    : `<a href="${homeUrl}" style="text-decoration:none;display:inline-block;">${wordmark}</a>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;">
                    ${logoCell}
                  </td>
                  <td align="right" style="vertical-align:middle;font-family:${t.fontDisplay};font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${t.primary};">
                    Shortly
                  </td>
                </tr>
              </table>`;
}

export function buildTransactionalEmailHtml({
  preheader,
  headline,
  intro,
  ctaLabel,
  ctaUrl,
  safetyNote,
  expiryNote,
  frontEndUrl
}) {
  const t = EMAIL_TOKENS;
  const safePreheader = escapeHtml(preheader);
  const safeHeadline = escapeHtml(headline);
  const safeIntro = escapeHtml(intro);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeCtaUrl = escapeHtml(ctaUrl);
  const safeSafety = escapeHtml(safetyNote);
  const safeExpiry = escapeHtml(expiryNote);
  const logoUrlRaw = resolveEmailLogoUrl(frontEndUrl);
  const logoUrl = logoUrlRaw ? escapeHtml(logoUrlRaw) : null;
  const homeUrl = escapeHtml(normalizeFrontEndBase(frontEndUrl) || '#');
  const headerHtml = buildEmailHeaderHtml({ homeUrl, logoUrl, tokens: t });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${safeHeadline}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${t.background};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${t.background};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;border-collapse:collapse;background-color:${t.surface};border:1px solid ${t.border};">
          <tr>
            <td style="height:4px;background-color:${t.primary};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 20px;background-color:${t.blueTint};border-bottom:1px solid ${t.border};">
              ${headerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;font-family:${t.fontSans};">
              <h1 style="margin:0 0 16px;font-family:${t.fontDisplay};font-size:24px;font-weight:500;line-height:1.25;letter-spacing:-0.04em;color:${t.ink};">
                ${safeHeadline}
              </h1>
              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${t.muted};">
                ${safeIntro}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td align="left" style="background-color:${t.primary};">
                    <a href="${safeCtaUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${t.fontSans};font-size:15px;font-weight:500;line-height:1;color:#ffffff;text-decoration:none;background-color:${t.primary};border:1px solid ${t.primary};">
                      ${safeCtaLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;font-family:${t.fontSans};">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${t.muted};">
                ${safeSafety}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:${t.mutedLight};">
                ${safeExpiry}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background-color:${t.backgroundAlt};border-top:1px solid ${t.border};font-family:${t.fontSans};">
              <p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:${t.mutedLight};">
                If the button doesn&apos;t work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-family:${t.fontMono};font-size:11px;line-height:1.6;word-break:break-all;">
                <a href="${safeCtaUrl}" style="color:${t.primary};text-decoration:underline;">${safeCtaUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;background-color:${t.backgroundAlt};font-family:${t.fontSans};">
              <p style="margin:0;font-size:11px;line-height:1.5;color:${t.mutedLight};text-align:center;">
                Privacy-first URL shortening · <a href="${homeUrl}" style="color:${t.primary};text-decoration:none;">Open Shortly</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTransactionalEmailText({
  headline,
  intro,
  ctaLabel,
  ctaUrl,
  safetyNote,
  expiryNote
}) {
  return [
    headline,
    '',
    intro,
    '',
    `${ctaLabel}: ${ctaUrl}`,
    '',
    safetyNote,
    expiryNote,
    '',
    '— Shortly'
  ].join('\n');
}
