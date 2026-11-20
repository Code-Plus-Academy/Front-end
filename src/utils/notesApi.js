import { cookies } from 'next/headers';

const DEFAULT_API_URL = 'https://api.codeplusacademy.in/api';

/**
 * Build the backend API base URL from environment variables.
 * Sanitizes common env misconfigurations (stray quotes, CRLF line endings,
 * missing scheme) and validates the result so fetch() never receives an
 * unparseable URL. Falls back to the production API on any invalid value.
 */
export function getBackendUrl() {
  let apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_URL;

  // Strip stray whitespace, CR/LF (common with .env files saved on Windows),
  // and wrapping quotes accidentally included in env values.
  apiUrl = String(apiUrl)
    .replace(/[\r\n\t]/g, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  // A scheme is required for fetch() to parse the URL.
  if (apiUrl && !/^https?:\/\//i.test(apiUrl)) {
    apiUrl = `https://${apiUrl.replace(/^\/+/, '')}`;
  }

  // Validate: if the value still isn't a parseable URL, fall back rather
  // than throwing "Failed to parse URL from ..." inside route handlers.
  try {
    new URL(apiUrl); // eslint-disable-line no-new
  } catch (e) {
    console.error(
      `[notesApi] Invalid NEXT_PUBLIC_API_URL / NEXT_PUBLIC_API_BASE_URL value "${apiUrl}". Falling back to ${DEFAULT_API_URL}.`
    );
    apiUrl = DEFAULT_API_URL;
  }

  if (!apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.replace(/\/+$/, '') + '/api';
  }
  return apiUrl;
}

export async function fetchApi(endpoint, options = {}) {
  const baseUrl = getBackendUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Forward cookies from incoming request for server-side auth
  const cookieStore = await cookies();
  const cpaToken = cookieStore.get('cpa_token')?.value;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (cpaToken) {
    headers['Cookie'] = `cpa_token=${cpaToken}`;
    headers['Authorization'] = `Bearer ${cpaToken}`;
  }

  const res = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers,
  });

  return res;
}

export async function getCurrentUser() {
  try {
    const res = await fetchApi('/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.error('Error fetching current user in Notes Arena:', err);
    return null;
  }
}
