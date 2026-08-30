/**
 * src/utils/navigation.js
 * Unified URL-based redirection resolver for Code Plus Academy
 */

export function getRedirectTarget(search, fallback = null) {
  if (!search) return fallback;
  
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const target = params.get('next') || params.get('redirectTo') || params.get('redirect');
  
  if (!target) return fallback;

  const decoded = decodeURIComponent(target);
  
  // Allow safe relative paths starting with / (e.g. /career/123, /notes/upload)
  if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.startsWith('/\\')) {
    return decoded;
  }

  // Trusted external origins
  const TRUSTED_ORIGINS = [
    'https://codeplusacademy.in',
    'https://studio.codeplusacademy.in',
    'https://notes.codeplusacademy.in',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ];

  try {
    const url = new URL(decoded);
    if (TRUSTED_ORIGINS.some(origin => url.origin === origin)) {
      return decoded;
    }
  } catch (e) {
    // If not a full URL string, check prefix match
    if (TRUSTED_ORIGINS.some(origin => decoded.startsWith(origin))) {
      return decoded;
    }
  }

  return fallback;
}
