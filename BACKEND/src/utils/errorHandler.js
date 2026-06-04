import { logger } from './logger.js';
import { classifyError } from './classifyError.js';
import { duplicateKeyMessageForField } from './duplicateKeyMessages.js';

const buildLogContext = (err, req, category, type) => ({
  requestId: req?.requestId,
  method: req?.method,
  path: req?.originalUrl || req?.url,
  statusCode: err.statusCode || 500,
  category,
  type,
  ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
});

const logError = (err, req, category, type) => {
  logger.error(err.message, buildLogContext(err, req, category, type));
};

const handleValidationError = (err) => ({
  status: err.statusCode,
  body: { success: false, message: err.message, errors: err.errors }
});

const handleAppError = (err) => ({
  status: err.statusCode,
  body: {
    success: false,
    message: err.message,
    ...(err.errors && { errors: err.errors })
  }
});

const mapMongooseFieldErrors = (errors) =>
  Object.values(errors).map((e) => ({ field: e.path, message: e.message }));

const handleMongooseValidationError = (err) => ({
  status: 400,
  body: {
    success: false,
    message: 'Validation failed',
    errors: mapMongooseFieldErrors(err.errors)
  }
});

const handleMongoDuplicateError = (err) => {
  const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
  return {
    status: 409,
    body: { success: false, message: duplicateKeyMessageForField(field) }
  };
};

const handleGenericError = (err) => ({
  status: 500,
  body: {
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error'
  }
});

const errorResponders = [
  [(err) => err instanceof ValidationError, handleValidationError],
  [(err) => err instanceof AppError, handleAppError],
  [
    (err) => err.name === 'ValidationError' && err.errors,
    handleMongooseValidationError
  ],
  [
    (err) => err.name === 'MongoServerError' && err.code === 11000,
    handleMongoDuplicateError
  ]
];

export const errorHandler = (err, req, res, _next) => {
  const { category, type } = classifyError(err);
  logError(err, req, category, type);

  for (const [matches, respond] of errorResponders) {
    if (matches(err)) {
      const { status, body } = respond(err);
      return res.status(status).json(body);
    }
  }

  const fallback = handleGenericError(err);
  return res.status(fallback.status).json(fallback.body);
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
