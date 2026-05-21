import axios from 'axios';

/**
 * Base Axios instance for all GreenGuild AI API calls.
 * Set VITE_API_URL in your .env file to point at your backend.
 * Falls back to the production URL if the variable is not set.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.greenguild.ai/v1',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach auth token if present ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gg_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — normalise errors ──────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error — please check your connection.';
    return Promise.reject(new Error(message));
  },
);

export default api;
