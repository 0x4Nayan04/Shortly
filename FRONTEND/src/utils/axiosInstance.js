import axios from 'axios';
import {
  isAuthApiPath,
  shouldSuppressSessionExpired
} from '../constants/routes';
import { apiBaseUrl } from '../config/api.js';

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

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

export function getApiPayload(response) {
  return response?.data ?? response;
}

export function getApiUser(payload) {
  return getApiPayload(payload)?.user ?? null;
}

export function getApiMessage(payload, fallback = '') {
  return getApiPayload(payload)?.message || fallback;
}

function isHtmlResponse(error) {
  const contentType = error?.response?.headers?.['content-type'];
  return (
    typeof contentType === 'string' &&
    contentType.toLowerCase().includes('text/html')
  );
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (isHtmlResponse(error)) {
    return fallback;
  }

  const raw = error?.response?.data;
  const data = raw && typeof raw === 'object' ? mergeApiEnvelope(raw) : raw;
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  if (data && typeof data === 'object' && data.message) {
    return data.message;
  }
  if (error?.message && !error.message.startsWith('Request failed')) {
    return error.message;
  }
  return fallback;
}
