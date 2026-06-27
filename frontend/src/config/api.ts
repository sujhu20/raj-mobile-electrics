import axios from 'axios';
import { STORAGE_KEYS, ROUTES } from './constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — on 401, clear token and redirect to login
// No refresh-token flow — access-token-only mode for development
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';

      // Don't redirect on login/register endpoints (those are expected 401s for bad creds)
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        // Only redirect if not already on login page to prevent loops
        if (window.location.pathname !== ROUTES.LOGIN) {
          window.location.href = ROUTES.LOGIN;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
