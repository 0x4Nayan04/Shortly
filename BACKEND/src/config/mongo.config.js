import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const mongooseOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
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

const connectDB = async () => {
  let retries = 3;

  while (retries > 0) {
    try {
      const connection = await mongoose.connect(
        process.env.MONGODB_URI,
        mongooseOptions
      );

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
