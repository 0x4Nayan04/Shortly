import { Router } from 'express';
import mongoose from 'mongoose';
import { successResponse } from '../utils/responseMessages.js';

const router = Router();

router.get('/', (_req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const mongoState = mongoose.connection.readyState;

  res.json(successResponse('Service is healthy', {
    status: 'ok',
    uptime: process.uptime(),
    uptimeHuman: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    mongo: {
      state: mongoStates[mongoState] || 'unknown',
      connected: mongoState === 1,
    },
  }));
});

export default router;
