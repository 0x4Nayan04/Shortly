import axios from 'axios';
import {
  isAuthApiPath,
  shouldSuppressSessionExpired
} from '../constants/routes';

const apiBaseUrl =
  import.meta.env.VITE_APP_URL?.trim() || (import.meta.env.DEV ? '/' : '');

if (!import.meta.env.DEV && !import.meta.env.VITE_APP_URL?.trim()) {
  console.error(
    '[Shortly] VITE_APP_URL is not set. Production API requests will use the SPA origin. Set VITE_APP_URL to your API host before deploying.'
  );
}

const axiosInstance = axios.create({
  // Dev: empty → relative /api/* via Vite proxy (same origin, no CORS).
  // Prod: set VITE_APP_URL to your API origin.
  baseURL: apiBaseUrl,
  withCredentials: true
});

/** Merge `{ success, message, data: { ... } }` into a flat payload for callers. */
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

axiosInstance.interceptors.response.use(
  (response) => {
    response.data = mergeApiEnvelope(response.data);
    return response;
  },
  (error) => {
    console.error('Axios Error:', error);

    if (error.response?.data) {
      error.response.data = mergeApiEnvelope(error.response.data);
    }

    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config?.url || '';

      if (
        status === 401 &&
        !isAuthApiPath(requestUrl) &&
        typeof window !== 'undefined' &&
        !shouldSuppressSessionExpired(window.location.pathname)
      ) {
        const returnTo = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.dispatchEvent(
          new CustomEvent('auth:expired', { detail: { returnTo } })
        );
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

/**
 * Flat API payload returned by axios (after interceptor) and `src/api/*` modules.
 * Envelope fields (`success`, `message`, `errors`) sit alongside resource fields
 * (`user`, `urls`, etc.) — never nested under `data`.
 */
export function getApiPayload(response) {
  return response?.data ?? response;
}

/** Read a user object from a flat API payload. */
export function getApiUser(payload) {
  return getApiPayload(payload)?.user ?? null;
}

/** Read a message string from a flat API payload. */
export function getApiMessage(payload, fallback = '') {
  return getApiPayload(payload)?.message || fallback;
}

/** Consistent error message from axios or thrown API errors. */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const raw = error?.response?.data;
  const data = raw && typeof raw === 'object' ? mergeApiEnvelope(raw) : raw;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && data.message) return data.message;
  if (error?.message && !error.message.startsWith('Request failed')) {
    return error.message;
  }
  return fallback;
}
