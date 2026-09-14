/**
 * Zero-PII Sanitization & URL Scrubber
 * Ensures no sensitive user data, auth tokens, passwords, or emails leak into GA4.
 */

const BLOCKED_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /auth/i,
  /bearer/i,
  /api[_-]?key/i,
  /credential/i,
  /cookie/i,
  /phone/i,
  /mobile/i,
  /email/i,
  /address/i,
  /ssn/i,
  /aadhar/i,
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Sanitizes a URL path by removing sensitive query parameters
 */
export function sanitizeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  try {
    const url = new URL(urlStr, 'https://www.codeplusacademy.in');
    const params = new URLSearchParams(url.search);
    const keysToRemove = [];

    params.forEach((_, key) => {
      if (BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((key) => params.delete(key));
    url.search = params.toString();
    return url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
  } catch (e) {
    return urlStr.split('?')[0]; // fallback to base path
  }
}

/**
 * Recursively scrubs PII from event payloads
 */
export function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return {};

  const clean = {};
  for (const [key, value] of Object.entries(payload)) {
    // Drop blocked keys
    if (BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      continue;
    }

    if (typeof value === 'string') {
      // Redact email addresses embedded in strings
      clean[key] = value.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value.map((item) => (typeof item === 'string' ? item.replace(EMAIL_REGEX, '[REDACTED_EMAIL]') : item));
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizePayload(value);
    }
  }

  return clean;
}
