import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_URL,
  withCredentials: true
});

axiosInstance.interceptors.response.use(
  (response) => {
    // Unwrap nested data.data pattern
    if (response.data && response.data.data && !Array.isArray(response.data.data)) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    console.error('Axios Error:', error);

    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config?.url || '';

      if (
        status === 401 &&
        !requestUrl.includes('/auth/me') &&
        !requestUrl.includes('/auth/login') &&
        !requestUrl.includes('/auth/register') &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
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
