/**
 * Axios instance — CPA Frontend
 *
 * Per dev_team_brief.md (TASK FE-1):
 * All HTTP calls MUST use this instance so `withCredentials: true` is always set.
 * This ensures the `cpa_token` HTTP-only cookie is sent on every request cross-origin.
 */
import axios from 'axios';

export let baseApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
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

// Auth is handled via HTTP-only cookie (withCredentials: true above).
// No localStorage token interceptor — intentionally removed to prevent XSS token theft.

// These endpoints return 401 as part of normal flow — do NOT treat as session expiry
const AUTH_EXPLICIT_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/me'];

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isExpectedAuth = AUTH_EXPLICIT_ENDPOINTS.some(path => url.includes(path));

    if (error.response?.status === 401 && !isExpectedAuth) {
      // Session expired on a protected endpoint — force logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_expired';
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
};

export const getErrorMessage = (error) => {
  const code = error?.response?.data?.error;
  return ERROR_MAP[code] || error?.response?.data?.message || 'Something went wrong. Try again.';
};

export default api;

