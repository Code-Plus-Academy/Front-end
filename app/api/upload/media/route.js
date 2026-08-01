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
    
    // Attach original_filename to response
    if (file && file.name) {
      data.original_filename = file.name;
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error forwarding upload to backend:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
