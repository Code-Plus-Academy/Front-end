/**
 * Axios instance — CPA Frontend (Next.js)
 *
 * All HTTP calls MUST use this instance so `withCredentials: true` is set.
 * This ensures the `cpa_token` HTTP-only cookie is sent on every request.
 *
 * In Next.js:
 *  - Development: next.config.js proxies /api/* → Express backend, so
 *    baseURL is just '/api' (avoids CORS in dev).
 *  - Production: set NEXT_PUBLIC_API_BASE_URL to your backend domain.
 */
import axios from 'axios';

function buildBaseUrl() {
  // In the browser, prefer a relative /api path when no env var is set.
  // This works with the next.config.js rewrite proxy in development,
  // and with a reverse proxy (nginx, Vercel rewrites) in production.
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!envUrl) return '/api';
    const base = envUrl.replace(/\/$/, '');
    return base.endsWith('/api') ? base : base + '/api';
  }
  // Server-side (SSR/RSC): use the internal URL directly
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const base = envUrl.replace(/\/$/, '');
  return base.endsWith('/api') ? base : base + '/api';
}

export const baseApiUrl = buildBaseUrl();

const api = axios.create({
  baseURL: baseApiUrl,
  withCredentials: true, // REQUIRED — sends cpa_token HTTP-only cookie cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

// These endpoints return 401 as part of normal flow — do NOT treat as session expiry
const AUTH_EXPLICIT_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/me'];

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isExpectedAuth = AUTH_EXPLICIT_ENDPOINTS.some(path => url.includes(path));

    if (error.response?.status === 401 && !isExpectedAuth && typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_expired';
    }

    return Promise.reject(error);
  }
);

export const ERROR_MAP = {
  EMAIL_EXISTS:             'An account with this email already exists.',
  INVALID_CREDENTIALS:      'Incorrect email or password.',
  EMAIL_NOT_VERIFIED:       'Please verify your email first.',
  ACCOUNT_DEACTIVATED:      'Your account has been deactivated. Contact support.',
  TOKEN_INVALID_OR_EXPIRED: 'This link has expired. Request a new one.',
  TOKEN_ALREADY_USED:       'This link has already been used.',
  PROFESSIONAL_REQUIRED:    'This action requires a Professional account.',
  AUTH_REQUIRED:            'Please sign in to continue.',
  ADMIN_REQUIRED:           "You don't have permission to access this page.",
  NOT_FOUND:                'The requested resource was not found.',
};

export const getErrorMessage = (error) => {
  const code = error?.response?.data?.error;
  return ERROR_MAP[code] || error?.response?.data?.message || 'Something went wrong. Try again.';
};

export default api;
