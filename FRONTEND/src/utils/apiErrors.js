export function mapBackendFieldErrors(errors, fieldMap) {
  const fieldErrors = {};
  for (const { field, message } of errors) {
    const key = fieldMap?.[field] || field;
    fieldErrors[key] = message;
  }
  return fieldErrors;
}
