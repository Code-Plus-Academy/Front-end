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
      let errMessage = 'Server upload failed';
      try {
        const errJson = await res.json();
        errMessage = errJson.error || errJson.message || errMessage;
      } catch (e) {
        const errText = await res.text().catch(() => '');
        if (errText) {
          errMessage = errText.length > 200 ? 'Upload server encountered an error. Please try Google Drive link option.' : errText;
        }
      }
      return NextResponse.json({ error: errMessage }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error forwarding upload to backend:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
