import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { performance } from 'node:perf_hooks';

const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 4,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
};

const ipFamily = process.env.MONGODB_IP_FAMILY?.trim();
if (ipFamily !== undefined && ipFamily !== '') {
  mongooseOptions.family = Number(ipFamily);
}



export async function warmMongoPool(connection) {
  const client = connection.getClient();
  const readyConnections = new Map();
  let primary;
  let resolveReady;
  let timeout;
  const check = () => {
    if ((readyConnections.get(primary)?.size ?? 0) >= mongooseOptions.minPoolSize) {
      resolveReady?.();
    }
  };
  const remember = ({ address, connectionId }) => {
    if (!readyConnections.has(address)) readyConnections.set(address, new Set());
    readyConnections.get(address).add(connectionId);
    check();
  };
  const forget = ({ address, connectionId }) => {
    readyConnections.get(address)?.delete(connectionId);
  };
  const clear = ({ address }) => { readyConnections.delete(address); };
  client.on('connectionReady', remember);
  client.on('connectionCheckedOut', remember);
  client.on('connectionClosed', forget);
  client.on('connectionPoolCleared', clear);
  const start = performance.now();
  try {
    await Promise.race([
      (async () => {
        const hello = await connection.db.admin().command({ hello: 1 });

        const singleHost = client.options?.hosts?.length === 1
          ? client.options.hosts[0].toString() : null;
        primary = hello.me ?? hello.primary ?? singleHost;
        if (!primary) throw new Error('Could not identify the MongoDB primary');
        check();

        await Promise.all(Array.from({ length: mongooseOptions.minPoolSize }, () =>
          connection.db.admin().command({ ping: 1 })
        ));
        await new Promise((resolve) => {
          resolveReady = resolve;
          check();
        });
      })(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('MongoDB pool warmup timed out')),
          mongooseOptions.connectTimeoutMS);
      })
    ]);
    logger.info('MongoDB pool ready', {
      minimumConnections: mongooseOptions.minPoolSize,
      warmupMs: Math.round(performance.now() - start)
    });
  } finally {
    clearTimeout(timeout);
    client.off('connectionReady', remember);
    client.off('connectionCheckedOut', remember);
    client.off('connectionClosed', forget);
    client.off('connectionPoolCleared', clear);
  }
}

const connectDB = async () => {
  let retries = 3;

  while (retries > 0) {
    try {
      const connection = await mongoose.connect(
        process.env.MONGODB_URI,
        mongooseOptions
      );

      await warmMongoPool(connection.connection);

      logger.info('MongoDB connected', { host: connection.connection.host });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      break;
    } catch (error) {
      await mongoose.disconnect();
      retries--;
      logger.error('MongoDB connection error', {
        error: error.message,
        retriesRemaining: retries
      });

      if (retries === 0) {
        throw new Error('Failed to connect to MongoDB after 3 attempts');
      }

      logger.info('Retrying MongoDB connection', { retriesRemaining: retries });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export default connectDB;
