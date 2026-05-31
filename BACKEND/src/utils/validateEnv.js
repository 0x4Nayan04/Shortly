/**
 * Environment variable validation utility
 */

import { logger } from './logger.js';

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'FRONT_END_URL', 'PORT'];

const optionalEnvVars = ['NODE_ENV', 'ALLOWED_ORIGINS', 'RESEND_API_KEY'];

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (process.env.FRONT_END_URL) {
    process.env.FRONT_END_URL = process.env.FRONT_END_URL.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    const presentOptional = optionalEnvVars.filter(
      (varName) => process.env[varName]
    );
    if (presentOptional.length > 0) {
      logger.info('Optional environment variables detected', {
        presentOptional
      });
    }
  }

  logger.info('Environment validation passed');
};

/**
 * Optional: Validate environment variable formats
 */
export const validateEnvFormats = () => {
  if (
    process.env.MONGODB_URI &&
    !process.env.MONGODB_URI.startsWith('mongodb')
  ) {
    logger.warn(
      'MONGODB_URI should start with "mongodb://" or "mongodb+srv://"'
    );
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security'
    );
  }

  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    logger.warn('PORT should be a valid number');
  }

  if (
    process.env.FRONT_END_URL &&
    !process.env.FRONT_END_URL.startsWith('http')
  ) {
    logger.warn('FRONT_END_URL should start with "http://" or "https://"');
  }

  if (process.env.ALLOWED_ORIGINS) {
    const origins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    const hasWildcard = origins.includes('*');

    if (process.env.NODE_ENV === 'production' && hasWildcard) {
      throw new Error(
        'ALLOWED_ORIGINS must not include "*" in production (unsafe with credentials)'
      );
    }

    const invalidOrigins = origins.filter((trimmed) => {
      return (
        trimmed &&
        trimmed !== '*' &&
        !(trimmed.startsWith('http://') || trimmed.startsWith('https://'))
      );
    });

    if (invalidOrigins.length > 0) {
      logger.error('Invalid ALLOWED_ORIGINS configuration', { invalidOrigins });
      throw new Error('Invalid ALLOWED_ORIGINS configuration');
    } else if (process.env.NODE_ENV !== 'production') {
      logger.info('CORS configured', { origins });
    }
  } else if (process.env.NODE_ENV !== 'production') {
    logger.info('Using single origin from FRONT_END_URL for CORS');
  }

  if (
    process.env.RESEND_API_KEY?.trim() &&
    !process.env.RESEND_FROM_EMAIL?.trim()
  ) {
    throw new Error(
      'RESEND_FROM_EMAIL must be set when RESEND_API_KEY is configured'
    );
  }

  if (process.env.NODE_ENV === 'production') {
    if (
      !process.env.PUBLIC_BASE_URL ||
      !process.env.PUBLIC_BASE_URL.startsWith('http')
    ) {
      throw new Error(
        'PUBLIC_BASE_URL must be set to a valid http(s) URL in production'
      );
    }

    if (!process.env.RESEND_API_KEY?.trim()) {
      throw new Error('RESEND_API_KEY must be set in production');
    }

    if (!process.env.RESEND_FROM_EMAIL?.trim()) {
      throw new Error('RESEND_FROM_EMAIL must be set in production');
    }
  } else if (process.env.PUBLIC_BASE_URL) {
    if (!process.env.PUBLIC_BASE_URL.startsWith('http')) {
      logger.warn('PUBLIC_BASE_URL should start with "http://" or "https://"');
    }
  }
};
