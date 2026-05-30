import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { urlencoded } from 'express';
import helmet from 'helmet';
import { errorHandler, AppError } from './utils/errorHandler.js';
import { redirectFromShortUrl } from './controllers/shortUrl.controllers.js';
import { getQrCode } from './controllers/qr.controller.js';
import authRoutes from './routes/auth.routes.js';
import shortUrlCreate from './routes/shortUrl.routes.js';
import healthRoutes from './routes/health.routes.js';
import { attachUser } from './utils/attachUser.js';
import {
  validateEnvFormats,
  validateEnvironment
} from './utils/validateEnv.js';
import {
  rateLimiter,
  keyGenerators
} from './middleware/rateLimit.middleware.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { latencyMiddleware } from './middleware/latency.middleware.js';
import {
  validateParams,
  validateQuery
} from './middleware/validation.middleware.js';
import { shortUrlParamsSchema, qrQuerySchema } from './validation/schemas.js';
import { logger } from './utils/logger.js';

const redirectLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: keyGenerators.ipPerEndpoint('redirect')
});

const qrLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: keyGenerators.ipPerEndpoint('qr')
});

export function createApp() {
  validateEnvironment();
  validateEnvFormats();

  const app = express();

  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(latencyMiddleware);

  app.use(
    helmet({
      strictTransportSecurity: process.env.NODE_ENV === 'production',
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://*.gravatar.com'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          ...(process.env.NODE_ENV === 'production' && {
            upgradeInsecureRequests: []
          })
        }
      },
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
    })
  );

  app.use(compression());

  const normalizeOrigin = (url) => url?.replace(/\/+$/, '') ?? '';

  const isLocalDevOrigin = (origin) => {
    if (process.env.NODE_ENV !== 'development') return false;
    try {
      const { hostname } = new URL(origin);
      return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
      return false;
    }
  };

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const configured = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((url) => url.trim())
        : [process.env.FRONT_END_URL];
      const allowedOrigins = configured.filter(Boolean);
      const allowWildcard =
        process.env.NODE_ENV !== 'production' && allowedOrigins.includes('*');
      if (
        isLocalDevOrigin(origin) ||
        allowWildcard ||
        allowedOrigins.some(
          (allowed) =>
            allowed !== '*' &&
            normalizeOrigin(allowed) === normalizeOrigin(origin)
        )
      ) {
        callback(null, true);
      } else {
        logger.warn('CORS origin rejected', {
          origin,
          ...(process.env.NODE_ENV !== 'production' && { allowedOrigins })
        });
        callback(
          new AppError(`CORS: Origin ${origin} not allowed by policy`, 403)
        );
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cookie',
      'Cache-Control'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Request-ID',
      'X-Page',
      'X-Per-Page',
      'X-Total-Pages'
    ],
    maxAge: 86400
  };

  app.use(cors(corsOptions));

  app.use(express.json({ limit: '16kb' }));
  app.use(urlencoded({ extended: true, limit: '16kb' }));
  app.use(cookieParser());
  app.use(attachUser);

  app.use('/api/v1/health', healthRoutes);
  app.use('/api/health', healthRoutes);

  app.use('/api/v1/create', shortUrlCreate);
  app.use('/api/create', shortUrlCreate);

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/auth', authRoutes);

  const qrHandler = [
    qrLimiter,
    validateParams(shortUrlParamsSchema),
    validateQuery(qrQuerySchema),
    getQrCode
  ];
  app.get('/api/v1/qr/:short_url', ...qrHandler);
  app.get('/api/qr/:short_url', ...qrHandler);

  app.use('/api/v1', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  });
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  });

  app.get(
    '/:short_url',
    redirectLimiter,
    validateParams(shortUrlParamsSchema),
    redirectFromShortUrl
  );

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}
