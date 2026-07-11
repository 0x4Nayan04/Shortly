import { Router } from 'express';
import mongoose from 'mongoose';
import { successResponse } from '../utils/responseMessages.js';

const router = Router();

router.get('/live', (_req, res) => {
  res.json(
    successResponse('Service is live', {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    })
  );
});

export async function checkMongoReadiness(connection = mongoose.connection) {
  if (connection.readyState !== 1 || !connection.db) return false;
  let timeout;
  try {
    await Promise.race([
      connection.db.admin().command({ ping: 1 }, { maxTimeMS: 1000 }),
      new Promise(
        (_, reject) =>
          (timeout = setTimeout(
            () => reject(new Error('MongoDB readiness ping timed out')),
            1500
          ))
      )
    ]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

const readiness = async (_req, res) => {
  const mongoStates = [
    'disconnected',
    'connected',
    'connecting',
    'disconnecting'
  ];
  const mongoState = mongoose.connection.readyState;
  const mongoConnected = await checkMongoReadiness();

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
    return res.status(503).json({
      success: false,
      message: 'Service unavailable',
      data: payload
    });
  }

  res.json(successResponse('Service is healthy', payload));
};

router.get('/', readiness);
router.get('/ready', readiness);

export default router;
