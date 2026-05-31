import { Router } from 'express';
import mongoose from 'mongoose';
import { successResponse } from '../utils/responseMessages.js';
import {
  rateLimiter,
  keyGenerators
} from '../middleware/rateLimit.middleware.js';

const router = Router();

const healthLimiter = rateLimiter({
  windowMs: 10 * 1000,
  max: 10,
  keyGenerator: keyGenerators.ip,
  failClosed: false
});

router.get('/', healthLimiter, (_req, res) => {
  const mongoStates = [
    'disconnected',
    'connected',
    'connecting',
    'disconnecting'
  ];
  const mongoState = mongoose.connection.readyState;
  const mongoConnected = mongoState === 1;

  const payload = {
    status: mongoConnected ? 'ok' : 'degraded',
    uptime: process.uptime(),
    uptimeHuman: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    mongo: {
      state: mongoStates[mongoState] || 'unknown',
      connected: mongoConnected
    }
  };

  if (!mongoConnected) {
    return res
      .status(503)
      .json(successResponse('Service unavailable', payload));
  }

  res.json(successResponse('Service is healthy', payload));
});

export default router;
