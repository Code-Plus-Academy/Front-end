/**
 * Axios instance — CPA Frontend (Next.js)
 *
 * All HTTP calls MUST use this instance so `withCredentials: true` is set.
 * This ensures the `cpa_token` HTTP-only cookie is sent on every request.
 *
 * Routing strategy:
 *  - All environments: use a relative `/api` base URL so that requests go
 *    through Next.js rewrites (next.config.js) → Express backend.
 *  - This avoids CORS entirely and works in dev, staging, and production
 *    as long as NEXT_PUBLIC_API_BASE_URL is set in the environment.
 *
 * SSR/RSC (server-side):
 *  - Relative URLs don't work server-side, so we fall back to the full
 *    internal backend URL via NEXT_PUBLIC_API_BASE_URL.
 */
import axios from 'axios';

function buildBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser: always use relative /api — routed through next.config.js rewrites.
    // Do NOT use NEXT_PUBLIC_API_BASE_URL here; let the rewrite handle it.
    return '/api';
  }

  // Server-side (SSR/RSC): must use the absolute backend URL directly.
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
