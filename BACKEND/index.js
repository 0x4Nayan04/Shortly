import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { createApp } from './src/app.js';
import connectDB from './src/config/mongo.config.js';
import { logger } from './src/utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const PORT = process.env.PORT;

let app;
let server;

const shutdown = async (signal) => {
  logger.info('Shutdown initiated', { signal });
  if (!server) return process.exit(0);
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('All connections closed. Exiting.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

const start = async () => {
  app = createApp();
  await connectDB();
  server = app.listen(PORT, () => {
    logger.info('Server started', { port: PORT });
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
