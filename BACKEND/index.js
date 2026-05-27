import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { urlencoded } from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { errorHandler } from './src/utils/errorHandler.js';
import connectDB from './src/config/monogo.config.js';
import { redirectFromShortUrl } from './src/controllers/shortUrl.controllers.js';
import { getQrCode } from './src/controllers/qr.controller.js';
import authRoutes from './src/routes/auth.routes.js';
import shortUrlCreate from './src/routes/shortUrl.routes.js';
import healthRoutes from './src/routes/health.routes.js';
import { attachUser } from './src/utils/attachUser.js';
import {
  validateEnvFormats,
  validateEnvironment
} from './src/utils/validateEnv.js';
import {
  rateLimiter,
  keyGenerators
} from './src/middleware/rateLimit.middleware.js';
import { requestIdMiddleware } from './src/middleware/requestId.middleware.js';
import { latencyMiddleware } from './src/middleware/latency.middleware.js';

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

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

validateEnvironment();
validateEnvFormats();

const app = express();

app.set('trust proxy', 1);

app.use(requestIdMiddleware);
app.use(latencyMiddleware);

app.use(
  helmet({
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
      },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
  })
);

app.use(compression());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((url) => url.trim())
      : [process.env.FRONT_END_URL];
    if (allowedOrigins.filter((o) => o.trim()).includes(origin)) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `CORS: Origin ${origin} not allowed. Allowed origins:`,
          allowedOrigins
        );
      } else {
        console.warn(`CORS: Origin ${origin} not allowed by policy`);
      }
      callback(new Error(`CORS: Origin ${origin} not allowed by policy`));
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

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);

/* Health */
app.use('/api/v1/health', healthRoutes);
app.use('/api/health', healthRoutes);

/* Create */
app.use('/api/v1/create', shortUrlCreate);
app.use('/api/create', shortUrlCreate);

/* Auth */
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

/* QR code */
app.get('/api/v1/qr/:short_url', qrLimiter, getQrCode);
app.get('/api/qr/:short_url', qrLimiter, getQrCode);

/* Redirect (unversioned — public-facing) */
app.get('/:short_url', redirectLimiter, redirectFromShortUrl);

app.use(errorHandler);

const PORT = process.env.PORT;

let server;

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Closing gracefully...`);
  if (!server) return process.exit(0);
  server.close(async () => {
    await mongoose.connection.close();
    console.log('All connections closed. Exiting.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

const start = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
