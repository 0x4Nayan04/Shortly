import Joi from "joi";

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password cannot exceed 128 characters",
      "any.required": "Password is required",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
});

// ============================================
// URL VALIDATION SCHEMAS
// ============================================

export const createUrlSchema = Joi.object({
  full_url: Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .required()
    .messages({
      "string.empty": "URL is required",
      "string.uri": "Please provide a valid URL (must start with http:// or https://)",
      "any.required": "URL is required",
    }),
});

export const createCustomUrlSchema = Joi.object({
  full_url: Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .required()
    .messages({
      "string.empty": "URL is required",
      "string.uri": "Please provide a valid URL (must start with http:// or https://)",
      "any.required": "URL is required",
    }),
  custom_url: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      "string.empty": "Custom URL is required",
      "string.min": "Custom URL must be at least 3 characters",
      "string.max": "Custom URL cannot exceed 30 characters",
      "string.pattern.base": "Custom URL can only contain letters, numbers, hyphens, and underscores",
      "any.required": "Custom URL is required",
    }),
});

export const deleteUrlSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "URL ID is required",
      "string.pattern.base": "Invalid URL ID format",
      "any.required": "URL ID is required",
    }),
});

// Query params validation for getUserUrls
export const getUserUrlsQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
      "number.base": "Limit must be a number",
    }),
  skip: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      "number.min": "Skip cannot be negative",
      "number.base": "Skip must be a number",
    }),
  search: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .default('')
    .messages({
      "string.max": "Search query cannot exceed 200 characters",
    }),
  sortBy: Joi.string()
    .valid('createdAt', 'click', 'short_url', 'full_url')
    .default('createdAt')
    .messages({
      "any.only": "Sort by must be one of: createdAt, click, short_url, full_url",
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      "any.only": "Sort order must be 'asc' or 'desc'",
    }),
});

// Bulk delete validation schema
export const bulkDeleteUrlsSchema = Joi.object({
  ids: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid URL ID format",
        })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      "array.min": "At least one URL ID is required",
      "array.max": "Cannot delete more than 50 URLs at once",
      "any.required": "URL IDs are required",
    }),
});
