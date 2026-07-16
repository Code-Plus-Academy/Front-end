import { NextResponse } from 'next/server';
import { getBackendUrl } from '../../../../src/utils/notesApi';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const backendUrl = getBackendUrl();
    const cookieStore = await cookies();
    const cpaToken = cookieStore.get('cpa_token')?.value;

    const headers = {};
    if (cpaToken) {
      headers['Cookie'] = `cpa_token=${cpaToken}`;
    }

    const res = await fetch(`${backendUrl}/upload/media`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText || 'Upload failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error forwarding upload to backend:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
