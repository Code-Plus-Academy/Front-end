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
    const authHeader = req.headers.get('authorization');
    const userAgent = req.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    const headers = {
      'User-Agent': userAgent,
      'Origin': 'https://www.codeplusacademy.in',
    };
    if (cpaToken) {
      headers['Cookie'] = `cpa_token=${cpaToken}`;
    }
    if (authHeader) {
      headers['Authorization'] = authHeader;
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
      // Read the body exactly ONCE. Previously res.json() was attempted
      // first, which consumed the stream; non-JSON error bodies (rate
      // limiter HTML, nginx 413 pages, gateway responses) then produced
      // an empty res.text() and users saw a generic "Server upload failed".
      const rawBody = await res.text().catch(() => '');
      let errMessage = `Upload server error (status ${res.status})`;
      try {
        const errJson = JSON.parse(rawBody);
        errMessage = errJson.message || errJson.error || errMessage;
      } catch {
        if (rawBody && (rawBody.includes('Just a moment...') || rawBody.includes('cf-mitigated') || rawBody.includes('challenge-platform'))) {
          errMessage = 'Upload server security check encountered. Please use the Google Drive link or direct upload.';
        } else if (rawBody && rawBody.length <= 200 && !rawBody.includes('<')) {
          errMessage = rawBody;
        }
      }
      console.error(`[upload/media proxy] backend responded ${res.status}:`, rawBody.slice(0, 500));
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
