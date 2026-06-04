import mongoose from 'mongoose';
import { AppError } from './errorHandler.js';

const TRANSACTION_REQUIRED_MESSAGE =
  'This operation requires MongoDB replica set support (transactions). Use Atlas or a local replica set — see BACKEND/.env.example.';

const isTransactionNotSupportedError = (error) => {
  const message = error?.message ?? '';
  return (
    error?.code === 20 ||
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set')
  );
};

export async function runWithTransaction(work) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(() => work(session));
  } catch (error) {
    if (isTransactionNotSupportedError(error)) {
      throw new AppError(TRANSACTION_REQUIRED_MESSAGE, 503);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
