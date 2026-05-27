import QRCode from 'qrcode';
import short_urlModel from '../schema/shortUrl.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError, NotFoundError } from '../utils/errorHandler.js';
import { buildPublicShortUrl } from '../utils/publicShortUrl.js';

export const getQrCode = asyncHandler(async (req, res, next) => {
  const { short_url } = req.params;
  const { format } = req.query;

  if (!short_url) {
    return next(new AppError('Short URL is required', 400));
  }

  const exists = await short_urlModel.exists({ short_url });

  if (!exists) {
    return next(new NotFoundError('Short URL not found'));
  }

  const qrPayload = buildPublicShortUrl(short_url, req);

  if (format === 'png') {
    const buf = await QRCode.toBuffer(qrPayload, {
      type: 'png',
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shortly-qr-${short_url}.png"`
    );
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buf);
  }

  const svg = await QRCode.toString(qrPayload, {
    type: 'svg',
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});
