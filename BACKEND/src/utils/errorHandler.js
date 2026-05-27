import { logger } from './logger.js';
import { classifyError } from './classifyError.js';

export const errorHandler = (err, req, res, _next) => {
  const { category, type } = classifyError(err);

  logger.error(err.message, {
    requestId: req?.requestId,
    method: req?.method,
    path: req?.originalUrl || req?.url,
    statusCode: err.statusCode || 500,
    category,
    type,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }

  if (err instanceof AppError) {
    const payload = { success: false, message: err.message };
    if (err.errors) payload.errors = err.errors;
    return res.status(err.statusCode).json(payload);
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
    const message =
      field === 'short_url'
        ? 'This short URL is already taken. Please choose a different one.'
        : 'A record with this value already exists.';
    return res.status(409).json({ success: false, message });
  }

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error'
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, true, errors);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict occurred') {
    super(message, 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
