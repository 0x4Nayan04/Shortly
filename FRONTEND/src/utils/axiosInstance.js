import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true, // Important for cookie-based authentication
});

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    console.error("Axios Error:", error);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      // You could dispatch a global error action here, or show a toast notification
      // For example: showErrorNotification(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.error("Request error:", error.request);
      // For example: showErrorNotification('Network Error: No response received from server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", error.message);
      // For example: showErrorNotification('Error: ' + error.message);
    }

    // It's important to reject the promise so that local .catch() handlers
    // in your components can also process the error if needed.
    return Promise.reject(
      error.response
        ? error.response.data
        : error.message || "An unknown error occurred"
    );
  }
);

export default axiosInstance;
