export function mergeApiEnvelope(body) {
  if (
    !body ||
    typeof body !== 'object' ||
    !Object.prototype.hasOwnProperty.call(body, 'data') ||
    body.data === null ||
    body.data === undefined ||
    typeof body.data !== 'object' ||
    Array.isArray(body.data)
  ) {
    return body;
  }

  const { data, success, message, errors } = body;
  return {
    ...data,
    ...(success !== undefined && { success }),
    ...(message !== undefined && { message }),
    ...(errors !== undefined && { errors })
  };
}
