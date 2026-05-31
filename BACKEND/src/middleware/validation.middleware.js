import { ValidationError } from '../utils/errorHandler.js';

const validate = (source, target) => (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return next(new ValidationError('Validation failed', errors));
  }

  req[target] = value;
  next();
};

export const validateBody = validate('body', 'validatedBody');
export const validateParams = validate('params', 'validatedParams');
export const validateQuery = validate('query', 'validatedQuery');
