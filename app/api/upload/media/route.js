import { NextResponse } from 'next/server';
import { getBackendUrl } from '../../../../src/utils/notesApi';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const resourceType = formData.get('resource_type');

    if (file && typeof file === 'object' && file.name) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      // If resource_type is raw or file extension is pdf, enforce application/pdf MIME type
      if (ext === 'pdf' || (resourceType === 'raw' && ext !== 'doc' && ext !== 'docx' && ext !== 'ppt' && ext !== 'pptx' && ext !== 'txt')) {
        const mimeType = file.type?.toLowerCase() || '';
        if (mimeType && mimeType !== 'application/pdf' && mimeType !== 'application/x-pdf' && mimeType !== 'application/acrobat') {
          return NextResponse.json(
            { error: `Invalid MIME type (${mimeType}). Only application/pdf files are accepted for PDF resources.` },
            { status: 400 }
          );
        }
      }
    }

    const backendUrl = getBackendUrl();
    const cookieStore = await cookies();
    const cpaToken = cookieStore.get('cpa_token')?.value;

    const headers = {};
    if (cpaToken) {
      headers['Cookie'] = `cpa_token=${cpaToken}`;
    }

    let res;
    try {
      res = await fetch(`${backendUrl}/upload/media`, {
        method: 'POST',
        body: formData,
        headers,
      });
    } catch (fetchErr) {
      // Network/URL errors from the internal fetch should never surface
      // raw Node error text (e.g. "Failed to parse URL from ...") to users.
      console.error('Error forwarding upload to backend:', fetchErr);
      return NextResponse.json(
        { error: 'Upload service is temporarily unavailable. Please try again, or use the Google Drive link option.' },
        { status: 502 }
      );
    }

    if (!res.ok) {
      // Read the raw body ONCE. Previously res.json() was called first,
      // which consumed a non-JSON body and left res.text() with an empty
      // stream, hiding the real error behind "Server upload failed".
      const raw = await res.text().catch(() => '');
      let errMessage = `Server upload failed (status ${res.status}). Please try again, or use the Google Drive link option.`;
      try {
        const errJson = JSON.parse(raw);
        errMessage = errJson.error || errJson.message || errMessage;
      } catch (_) {
        if (raw && raw.length <= 200) {
          errMessage = raw;
        }
      }
      console.error(`[upload proxy] backend ${res.status}:`, raw.slice(0, 500));
      return NextResponse.json({ error: errMessage }, { status: res.status });
    }

    const data = await res.json();
    
    // Attach original_filename to response
    if (file && file.name) {
      data.original_filename = file.name;
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error processing upload request:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
