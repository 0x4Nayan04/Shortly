import { showToast } from './showToast';
import { getApiErrorMessage } from './apiErrorMessage';

function mapBackendFieldErrors(errors, fieldMap) {
  const fieldErrors = {};
  for (const { field, message } of errors) {
    const key = fieldMap?.[field] || field;
    fieldErrors[key] = message;
  }
  return fieldErrors;
}

export function handleApiFormError(
  err,
  { setError, mergeFieldErrors },
  options = {}
) {
  const {
    fallbackMessage = 'Something went wrong',
    fieldMap,
    formMessage
  } = options;
  const data = err?.response ? err.response.data : err;
  if (data && typeof data === 'object' && Array.isArray(data.errors)) {
    const backendErrors = mapBackendFieldErrors(data.errors, fieldMap);
    mergeFieldErrors(backendErrors);
    showToast.error(formMessage || 'Please check the form for errors.');
  } else {
    const errorMsg = getApiErrorMessage(err, fallbackMessage);
    setError(errorMsg);
    showToast.error(errorMsg);
  }
}
