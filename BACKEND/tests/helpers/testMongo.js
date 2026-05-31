import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer;

export async function connectTestMongo() {
  if (mongoose.connection.readyState === 1) {
    return memoryServer?.getUri();
  }

  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  await mongoose.connect(memoryServer.getUri(), {
    serverSelectionTimeoutMS: 5000
  });

  return memoryServer.getUri();
}

export async function disconnectTestMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
