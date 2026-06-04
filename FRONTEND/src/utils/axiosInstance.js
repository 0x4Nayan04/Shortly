import axios from 'axios';
import {
  isAuthApiPath,
  shouldSuppressSessionExpired
} from '../constants/routes';
import { apiBaseUrl } from '../config/api.js';
import { mergeApiEnvelope } from './apiEnvelope';

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

function shouldDispatchSessionExpired(status, requestUrl) {
  return (
    status === 401 &&
    !isAuthApiPath(requestUrl) &&
    typeof window !== 'undefined' &&
    !shouldSuppressSessionExpired(window.location.pathname)
  );
}

function dispatchSessionExpired() {
  const returnTo = encodeURIComponent(
    window.location.pathname + window.location.search
  );
  window.dispatchEvent(
    new CustomEvent('auth:expired', { detail: { returnTo } })
  );
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

    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    if (error.response && shouldDispatchSessionExpired(status, requestUrl)) {
      dispatchSessionExpired();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

/** Returns the (possibly envelope-merged) API body from an axios response or raw body object. */
export function getApiPayload(response) {
  return response?.data ?? response;
}

export { getApiErrorMessage } from './apiErrorMessage';
