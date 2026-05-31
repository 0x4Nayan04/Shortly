const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/.+/i;
const CUSTOM_ALIAS_REGEX = /^[a-zA-Z0-9_-]+$/;

export const validators = {
  name: (value) => {
    if (!value || !value.trim()) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (value.trim().length > 50) {
      return 'Name cannot exceed 50 characters';
    }
    return null;
  },

  email: (value) => {
    if (!value || !value.trim()) {
      return 'Email is required';
    }
    if (!EMAIL_REGEX.test(value.trim())) {
      return 'Please provide a valid email address';
    }
    return null;
  },

  password: (value, options = {}) => {
    const { minLength = 6, required = true } = options;

    if (required && (!value || !value.trim())) {
      return 'Password is required';
    }
    if (value && value.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    if (value && value.length > 128) {
      return 'Password cannot exceed 128 characters';
    }
    return null;
  },

  loginPassword: (value) => {
    if (!value) {
      return 'Password is required';
    }
    return null;
  },

  confirmPassword: (value, password) => {
    if (!value) {
      return 'Please confirm your password';
    }
    if (value !== password) {
      return 'Passwords do not match';
    }
    return null;
  },

  url: (value) => {
    if (!value || !value.trim()) {
      return 'URL is required';
    }
    if (!URL_REGEX.test(value.trim())) {
      return 'Please provide a valid URL (must start with http:// or https://)';
    }
    return null;
  },

  customAlias: (value, options = {}) => {
    const { required = false } = options;

    if (required && (!value || !value.trim())) {
      return 'Custom alias is required';
    }

    if (value && value.trim()) {
      if (value.trim().length < 3) {
        return 'Custom alias must be at least 3 characters';
      }
      if (value.trim().length > 20) {
        return 'Custom alias cannot exceed 20 characters';
      }
      if (!CUSTOM_ALIAS_REGEX.test(value.trim())) {
        return 'Custom alias can only contain letters, numbers, hyphens, and underscores';
      }
    }
    return null;
  }
};

export const validateForm = (fields, rules) => {
  const errors = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    if (rules[fieldName]) {
      const rule = rules[fieldName];

      if (typeof rule === 'function') {
        errors[fieldName] = rule(value);
      } else if (Array.isArray(rule)) {
        const [validator, ...args] = rule;
        errors[fieldName] = validator(value, ...args);
      }
    }
  }

  return errors;
};

export const hasErrors = (errors) => {
  return Object.values(errors).some((error) => error !== null);
};

export const getFirstError = (errors) => {
  const firstError = Object.values(errors).find((error) => error !== null);
  return firstError || null;
};
