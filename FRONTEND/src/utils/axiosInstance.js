import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_URL,
  withCredentials: true
});

axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
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
        window.location.assign(`/login?session=expired&returnTo=${returnTo}`);
        return Promise.reject(error);
      }

      console.error('Response data:', error.response.data);
      console.error('Response status:', status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error('Request error:', error.request);
      // For example: showErrorNotification('Network Error: No response received from server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
      // For example: showErrorNotification('Error: ' + error.message);
    }

    // It's important to reject the promise so that local .catch() handlers
    // in your components can also process the error if needed.
    return Promise.reject(error);
  }
);

export default axiosInstance;
