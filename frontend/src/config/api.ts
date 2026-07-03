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

// Request interceptor — attach access token and log requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("=== [AXIOS REQUEST] ===");
    console.log(`URL: ${config.baseURL || ''}${config.url || ''}`);
    console.log(`Method: ${config.method?.toUpperCase() || ''}`);
    console.log("Headers:", JSON.stringify(config.headers));
    console.log("Body:", JSON.stringify(config.data));
    console.log("Network State (online):", navigator.onLine);
    console.log("=======================");
    return config;
  },
  (error) => {
    console.error("=== [AXIOS REQUEST ERROR] ===", error);
    return Promise.reject(error);
  }
);

// Response interceptor — on 401, clear token and redirect to login
// No refresh-token flow — access-token-only mode for development
api.interceptors.response.use(
  (response) => {
    console.log("=== [AXIOS RESPONSE] ===");
    console.log(`URL: ${response.config.url || ''}`);
    console.log(`Status: ${response.status}`);
    console.log("Headers:", JSON.stringify(response.headers));
    console.log("Response Body:", JSON.stringify(response.data));
    console.log("========================");
    return response;
  },
  (error) => {
    console.error("=== [AXIOS RESPONSE ERROR] ===");
    if (error.response) {
      console.error(`URL: ${error.config?.url || ''}`);
      console.error(`Status: ${error.response.status}`);
      console.error("Headers:", JSON.stringify(error.response.headers));
      console.error("Response Body:", JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error("Request sent but no response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    console.error("Network State (online):", navigator.onLine);
    console.error("=============================");

    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (window.location.pathname !== ROUTES.LOGIN) {
          window.location.href = ROUTES.LOGIN;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
