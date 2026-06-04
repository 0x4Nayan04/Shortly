import QRCode from 'qrcode';
import asyncHandler from '../utils/asyncHandler.js';
import { buildPublicShortUrl } from '../utils/publicShortUrl.js';
import { normalizeSlug } from '../utils/normalizeSlug.js';
import { getShortUrlService } from '../services/shortUrl.services.js';

const PNG_OPTIONS = {
  type: 'png',
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' }
};

const SVG_OPTIONS = {
  type: 'svg',
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' }
};

export const getQrCode = asyncHandler(async (req, res, _next) => {
  const { short_url } = req.validatedParams;
  const { format } = req.validatedQuery;
  const slug = normalizeSlug(short_url);

  await getShortUrlService(slug);

  const qrPayload = buildPublicShortUrl(slug, req);

  if (format === 'png') {
    const buf = await QRCode.toBuffer(qrPayload, PNG_OPTIONS);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shortly-qr-${slug}.png"`
    );
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buf);
  }

  const svg = await QRCode.toString(qrPayload, SVG_OPTIONS);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});
