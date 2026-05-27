const ERROR_TYPES = new Map([
  ['ValidationError', { category: 'client', type: 'validation' }],
  ['BadRequestError', { category: 'client', type: 'bad_request' }],
  ['UnauthorizedError', { category: 'client', type: 'unauthorized' }],
  ['NotFoundError', { category: 'client', type: 'not_found' }],
  ['ConflictError', { category: 'client', type: 'conflict' }],
]);

export function classifyError(err) {
  const name = err.constructor?.name;
  const known = ERROR_TYPES.get(name);
  if (known) return known;

  const statusCode = err.statusCode || 500;
  const category = statusCode >= 500 ? 'server' : statusCode >= 400 ? 'client' : 'unknown';

  const isAppError = err.isOperational !== undefined;
  const type = isAppError
    ? (err.isOperational ? 'operational' : 'programmer')
    : (statusCode >= 500 ? 'server_error' : 'unknown_error');

  return { category, type };
}
