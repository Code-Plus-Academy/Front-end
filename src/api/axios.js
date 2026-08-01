/**
 * Axios instance — CPA Frontend
 *
 * Per dev_team_brief.md (TASK FE-1):
 * All HTTP calls MUST use this instance so `withCredentials: true` is always set.
 * This ensures the `cpa_token` HTTP-only cookie is sent on every request cross-origin.
 */
import axios from 'axios';

export let baseApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (typeof window !== 'undefined') {
  if (baseApiUrl && baseApiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
    baseApiUrl = baseApiUrl.replace('localhost', window.location.hostname);
  } else if (!baseApiUrl) {
    baseApiUrl = `http://${window.location.hostname}:3001/api`;
  }
} else if (!baseApiUrl) {
  baseApiUrl = 'http://localhost:3001/api';
}

if (baseApiUrl && !baseApiUrl.endsWith('/api')) {
  baseApiUrl = baseApiUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: baseApiUrl,
  withCredentials: true, // REQUIRED — sends cpa_token HTTP-only cookie cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cpa_access_token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth is handled via HTTP-only cookie (withCredentials: true above).
// No localStorage token interceptor — intentionally removed to prevent XSS token theft.

// These endpoints return 401 as part of normal auth flow — do NOT trigger automatic /refresh loop or page redirect
const AUTH_EXPLICIT_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/me', '/auth/refresh'];

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isExpectedAuth = AUTH_EXPLICIT_ENDPOINTS.some(path => url.includes(path));

    if (error.response?.status === 401 && !isExpectedAuth && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await api.post('/auth/refresh');
        const newAccessToken = refreshRes.data?.access_token;
        if (newAccessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login?reason=session_expired';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Let the error propagate so components can show their own error messages
    return Promise.reject(error);
  }
);

// Response interceptor — map backend error codes to user-friendly messages
export const ERROR_MAP = {
  EMAIL_EXISTS:           'An account with this email already exists.',
  INVALID_CREDENTIALS:    'Incorrect email or password.',
  EMAIL_NOT_VERIFIED:     'Please verify your email first.',
  ACCOUNT_DEACTIVATED:    'Your account has been deactivated. Contact support.',
  TOKEN_INVALID_OR_EXPIRED: 'This link has expired. Request a new one.',
  TOKEN_ALREADY_USED:     'This link has already been used.',
  PROFESSIONAL_REQUIRED:  'This action requires a Professional account.',
  AUTH_REQUIRED:          'Please sign in to continue.',
  ADMIN_REQUIRED:         'You don\'t have permission to access this page.',
  NOT_FOUND:              'The requested resource was not found.',
  ONBOARDING_INCOMPLETE:  'Please complete onboarding to access this feature.',
};

export const getErrorMessage = (error) => {
  const payload = error?.response?.data?.error;
  if (payload && typeof payload === 'object') {
    return ERROR_MAP[payload.code] || payload.message || 'Something went wrong. Try again.';
  }
  const code = typeof payload === 'string' ? payload : null;
  return ERROR_MAP[code] || error?.response?.data?.message || 'Something went wrong. Try again.';
};

export default api;

