import { cookies } from 'next/headers';

export function getBackendUrl() {
  let apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://api.codeplusacademy.in/api';

  if (apiUrl && !apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.replace(/\/$/, '') + '/api';
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
