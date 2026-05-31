import Joi from 'joi';
import {
  isReservedSlug,
  RESERVED_SLUG_MESSAGE
} from '../constants/reservedSlugs.js';
import { validateCustomSlug } from '../utils/validateCustomSlug.js';

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

const passwordSchema = Joi.string().min(6).max(128).required().messages({
  'string.empty': 'Password is required',
  'string.min': 'Password must be at least 6 characters',
  'string.max': 'Password cannot exceed 128 characters',
  'any.required': 'Password is required'
});

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: passwordSchema
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
    'any.required': 'Reset token is required'
  }),
  password: passwordSchema.messages({
    'string.empty': 'New password is required',
    'any.required': 'New password is required'
  })
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Old password is required',
    'any.required': 'Old password is required'
  }),
  newPassword: passwordSchema.messages({
    'string.empty': 'New password is required',
    'any.required': 'New password is required'
  })
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token is required',
    'any.required': 'Verification token is required'
  })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  })
});

// ============================================
// URL VALIDATION SCHEMAS
// ============================================

export const createUrlSchema = Joi.object({
  full_url: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.empty': 'URL is required',
      'string.uri':
        'Please provide a valid URL (must start with http:// or https://)',
      'any.required': 'URL is required'
    })
});

export const createCustomUrlSchema = Joi.object({
  full_url: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.empty': 'URL is required',
      'string.uri':
        'Please provide a valid URL (must start with http:// or https://)',
      'any.required': 'URL is required'
    }),
  custom_url: Joi.string()
    .required()
    .custom((value, helpers) => {
      try {
        return validateCustomSlug(value);
      } catch (err) {
        if (err.message === RESERVED_SLUG_MESSAGE) {
          return helpers.error('any.reserved');
        }
        return helpers.message({ custom: err.message });
      }
    })
    .messages({
      'string.empty': 'Custom URL is required',
      'any.reserved': RESERVED_SLUG_MESSAGE,
      'any.required': 'Custom URL is required'
    })
});

export const deleteUrlSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'URL ID is required',
      'string.pattern.base': 'Invalid URL ID format',
      'any.required': 'URL ID is required'
    })
});

// Query params validation for getUserUrls
export const getUserUrlsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
    'number.base': 'Limit must be a number'
  }),
  skip: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Skip cannot be negative',
    'number.base': 'Skip must be a number'
  }),
  search: Joi.string().trim().max(200).allow('').default('').messages({
    'string.max': 'Search query cannot exceed 200 characters'
  }),
  sortBy: Joi.string()
    .valid('createdAt', 'click', 'short_url', 'full_url')
    .default('createdAt')
    .messages({
      'any.only':
        'Sort by must be one of: createdAt, click, short_url, full_url'
    }),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': "Sort order must be 'asc' or 'desc'"
  })
});

// Bulk delete validation schema
export const bulkDeleteUrlsSchema = Joi.object({
  ids: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid URL ID format'
        })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one URL ID is required',
      'array.max': 'Cannot delete more than 50 URLs at once',
      'any.required': 'URL IDs are required'
    })
});

export const shortUrlParamsSchema = Joi.object({
  short_url: Joi.string()
    .trim()
    .lowercase()
    .min(1)
    .max(20)
    .pattern(/^[a-z0-9_-]+$/)
    .required()
    .messages({
      'string.empty': 'Short URL is required',
      'string.pattern.base': 'Invalid short URL format',
      'any.required': 'Short URL is required'
    })
});

export const updateUrlSchema = Joi.object({
  full_url: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .messages({
      'string.uri':
        'Please provide a valid URL (must start with http:// or https://)'
    }),
  short_url: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(20)
    .pattern(/^[a-z0-9_-]+$/)
    .custom((value, helpers) => {
      if (isReservedSlug(value)) {
        return helpers.error('any.reserved');
      }
      return value;
    })
    .messages({
      'string.min': 'Custom URL must be at least 3 characters',
      'string.max': 'Custom URL cannot exceed 20 characters',
      'string.pattern.base':
        'Custom URL can only contain letters, numbers, hyphens, and underscores',
      'any.reserved': RESERVED_SLUG_MESSAGE
    }),
  disabled: Joi.boolean()
})
  .min(1)
  .messages({
    'object.min':
      'Provide at least one field to update (full_url, short_url, or disabled)'
  });

export const claimAnonymousLinksSchema = Joi.object({
  links: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid URL ID format'
          }),
        manage_token: Joi.string().min(16).required()
      })
    )
    .min(1)
    .max(50)
    .required()
});

export const deleteAnonymousUrlSchema = Joi.object({
  manage_token: Joi.string().min(16).required().messages({
    'any.required': 'Manage token is required'
  })
});

export const qrQuerySchema = Joi.object({
  format: Joi.string().valid('png', 'svg').optional()
});
