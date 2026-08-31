import { baseApiUrl } from '../api/axios';

const AUTH_REDIRECT_KEY = 'cpa_auth_redirect';
const LEGACY_KEYS = ['cpa_auth_return', 'cpa_post_login_redirect'];

/**
 * Validates whether a target URL is an authorized and safe redirect destination.
 * Only allows relative paths or domains matching Code Plus Academy and local dev environments.
 */
export function isAuthorizedRedirect(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;

  const trimmed = urlStr.trim();
  if (!trimmed) return false;

  // Safe relative paths starting with / (e.g. /feed, /notes/123, /creator/dashboard)
  // Banned: protocol-relative //evil.com or windows path traversal /\evil.com
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return true;
  }

  // Banned: javascript: or data: schemes
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    
    // Check same-origin
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      return true;
    }

    const hostname = url.hostname.toLowerCase();

    // Allow *.codeplusacademy.in and codeplusacademy.in
    if (hostname === 'codeplusacademy.in' || hostname.endsWith('.codeplusacademy.in')) {
      return true;
    }

    // Allow local development ports
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extracts and authorizes a URL-based redirect target from search query, URL, or plain path.
 */
export function getRedirectTarget(input, fallback = null) {
  if (!input) return fallback;
  
  let candidate = null;

  if (typeof input === 'object' && input !== null) {
    if (input instanceof URLSearchParams) {
      candidate = input.get('next') || input.get('redirectTo') || input.get('redirect');
    } else if (input.search) {
      const params = new URLSearchParams(input.search);
      candidate = params.get('next') || params.get('redirectTo') || params.get('redirect');
    }
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('?') || trimmed.includes('=')) {
      const params = new URLSearchParams(trimmed.startsWith('?') ? trimmed : `?${trimmed}`);
      candidate = params.get('next') || params.get('redirectTo') || params.get('redirect');
    }
    
    // If not found in query params but the input itself is a valid candidate URL/path
    if (!candidate && (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
      candidate = trimmed;
    }
  }

  if (!candidate) return fallback;

  try {
    const decoded = decodeURIComponent(candidate);
    if (isAuthorizedRedirect(decoded)) {
      return decoded;
    }
  } catch {
    if (isAuthorizedRedirect(candidate)) {
      return candidate;
    }
  }

  return fallback;
}

/**
 * Stores the validated URL-based redirect target in sessionStorage before OAuth redirects.
 */
export function setStoredRedirect(target) {
  if (typeof window === 'undefined') return;
  const authorized = getRedirectTarget(target, null);
  if (authorized) {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, authorized);
  }
}

/**
 * Retrieves the stored redirect target from sessionStorage.
 */
export function getStoredRedirect() {
  if (typeof window === 'undefined') return null;
  
  const target = sessionStorage.getItem(AUTH_REDIRECT_KEY);
  if (target && isAuthorizedRedirect(target)) {
    return target;
  }

  // Check legacy keys
  for (const key of LEGACY_KEYS) {
    const legacyTarget = sessionStorage.getItem(key);
    if (legacyTarget && isAuthorizedRedirect(legacyTarget)) {
      return legacyTarget;
    }
  }

  return null;
}

/**
 * Clears all stored auth redirect keys from sessionStorage.
 */
export function clearStoredRedirect() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  for (const key of LEGACY_KEYS) {
    sessionStorage.removeItem(key);
  }
}

/**
 * Constructs an OAuth initialization URL for Google/GitHub while preserving the URL-based redirect target.
 */
export function buildOAuthUrl(provider, searchOrPath = null) {
  if (typeof window === 'undefined') return '';

  const target = getRedirectTarget(searchOrPath) || getStoredRedirect() || null;
  if (target) {
    setStoredRedirect(target);
  }

  const origin = window.location.origin;
  const query = new URLSearchParams({ origin });
  
  if (target) {
    query.set('redirect', target);
    query.set('next', target);
  }

  return `${baseApiUrl}/auth/${provider}?${query.toString()}`;
}

