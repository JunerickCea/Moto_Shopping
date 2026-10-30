import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// A 401 from anywhere except the login screens means the session ended.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) onUnauthorized();
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error.response?.data?.error || fallback;

export default api;
