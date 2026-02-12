/**
 * Frontend Validation Utilities
 * 
 * These validators mirror the backend validation rules to provide
 * immediate feedback before form submission.
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL validation regex (must start with http:// or https://)
const URL_REGEX = /^https?:\/\/.+/i;

// Custom alias validation regex (alphanumeric, hyphens, underscores only)
const CUSTOM_ALIAS_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate a single field and return error message or null
 */
export const validators = {
  // Name validation
  name: (value) => {
    if (!value || !value.trim()) {
      return "Name is required";
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    if (value.trim().length > 50) {
      return "Name cannot exceed 50 characters";
    }
    return null;
  },

  // Email validation
  email: (value) => {
    if (!value || !value.trim()) {
      return "Email is required";
    }
    if (!EMAIL_REGEX.test(value.trim())) {
      return "Please provide a valid email address";
    }
    return null;
  },

  // Password validation (for registration)
  password: (value, options = {}) => {
    const { minLength = 6, required = true } = options;
    
    if (required && (!value || !value.trim())) {
      return "Password is required";
    }
    if (value && value.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    if (value && value.length > 128) {
      return "Password cannot exceed 128 characters";
    }
    return null;
  },

  // Login password (just check if provided)
  loginPassword: (value) => {
    if (!value) {
      return "Password is required";
    }
    return null;
  },

  // Confirm password validation
  confirmPassword: (value, password) => {
    if (!value) {
      return "Please confirm your password";
    }
    if (value !== password) {
      return "Passwords do not match";
    }
    return null;
  },

  // URL validation
  url: (value) => {
    if (!value || !value.trim()) {
      return "URL is required";
    }
    if (!URL_REGEX.test(value.trim())) {
      return "Please provide a valid URL (must start with http:// or https://)";
    }
    return null;
  },

  // Custom alias validation
  customAlias: (value, options = {}) => {
    const { required = false } = options;
    
    if (required && (!value || !value.trim())) {
      return "Custom alias is required";
    }
    
    if (value && value.trim()) {
      if (value.trim().length < 3) {
        return "Custom alias must be at least 3 characters";
      }
      if (value.trim().length > 30) {
        return "Custom alias cannot exceed 30 characters";
      }
      if (!CUSTOM_ALIAS_REGEX.test(value.trim())) {
        return "Custom alias can only contain letters, numbers, hyphens, and underscores";
      }
    }
    return null;
  },
};

/**
 * Validate multiple fields at once
 * @param {Object} fields - Object with field names as keys and values to validate
 * @param {Object} rules - Object with field names as keys and validator functions or arrays
 * @returns {Object} - Object with field names as keys and error messages (or null) as values
 */
export const validateForm = (fields, rules) => {
  const errors = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (rules[fieldName]) {
      const rule = rules[fieldName];
      
      if (typeof rule === "function") {
        errors[fieldName] = rule(value);
      } else if (Array.isArray(rule)) {
        // Support passing extra args like [validators.confirmPassword, password]
        const [validator, ...args] = rule;
        errors[fieldName] = validator(value, ...args);
      }
    }
  }
  
  return errors;
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object from validateForm
 * @returns {boolean} - True if there are errors
 */
export const hasErrors = (errors) => {
  return Object.values(errors).some((error) => error !== null);
};

/**
 * Get first error message from errors object
 * @param {Object} errors - Errors object from validateForm
 * @returns {string|null} - First error message or null
 */
export const getFirstError = (errors) => {
  const firstError = Object.values(errors).find((error) => error !== null);
  return firstError || null;
};
