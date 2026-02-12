/**
 * Standardized response messages for consistent user communication
 */

export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELDS: 'Required fields are missing',
    INVALID_EMAIL: 'Please provide a valid email address',
    INVALID_URL: 'Please provide a valid URL',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
    INVALID_CUSTOM_URL: 'Custom URL must be 3-20 characters, letters and numbers only'
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User already exists with this email',
    UNAUTHORIZED: 'Access denied. Please login to continue',
    TOKEN_EXPIRED: 'Your session has expired. Please login again',
    TOKEN_INVALID: 'Invalid authentication token'
  },
  URL: {
    NOT_FOUND: 'Short URL not found',
    ALREADY_EXISTS: 'This custom URL already exists. Please choose a different one',
    TOO_MANY_REQUESTS: 'Too many URLs created. Please try again later',
    DELETION_FAILED: 'Failed to delete URL',
    PERMISSION_DENIED: 'You can only delete your own URLs'
  },
  SERVER: {
    INTERNAL_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database connection error',
    NETWORK_ERROR: 'Network error occurred'
  }
};

export const SUCCESS_MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: 'Account created successfully',
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully'
  },
  URL: {
    CREATED: 'Short URL created successfully',
    CUSTOM_CREATED: 'Custom short URL created successfully',
    DELETED: 'URL deleted successfully',
    UPDATED: 'URL updated successfully'
  },
  USER: {
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully'
  }
};

/**
 * Helper function to create consistent API responses
 */
export const createResponse = (success, message, data = null, errors = null) => {
  const response = {
    success,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (errors !== null) {
    response.errors = errors;
  }

  return response;
};

/**
 * Helper function for success responses
 */
export const successResponse = (message, data = null) => {
  return createResponse(true, message, data);
};

/**
 * Helper function for error responses
 */
export const errorResponse = (message, errors = null) => {
  return createResponse(false, message, null, errors);
};