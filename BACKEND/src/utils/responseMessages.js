export const SUCCESS_MESSAGES = {
  AUTH: {
    REGISTER_SUCCESS: 'Account created successfully',
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully'
  },
  URL: {
    CREATED: 'Short URL created successfully',
    CUSTOM_CREATED: 'Custom short URL created successfully',
    DELETED: 'URL deleted successfully'
  },
  USER: {
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully'
  }
};

const createResponse = (success, message, data = null, errors = null) => {
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

export const successResponse = (message, data = null) => {
  return createResponse(true, message, data);
};
