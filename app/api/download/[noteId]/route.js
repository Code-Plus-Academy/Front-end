import { NextResponse } from 'next/server';
import { queryTable } from '../../../../src/lib/supabaseContent';
import { sanitizePdfFilename, buildContentDispositionHeader } from '../../../../src/utils/sanitizeFilename';
import { fetchApi } from '../../../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

async function getNoteByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null;
  const decoded = decodeURIComponent(idOrSlug).trim();

  try {
    // 1. Query by ID
    let notes = await queryTable('notes', '*', {
      id: `eq.${decoded}`,
      limit: '1',
    }).catch(() => []);

    // 2. Query by Slug
    if (!notes || notes.length === 0) {
      notes = await queryTable('notes', '*', {
        slug: `ilike.${decoded}`,
        limit: '1',
      }).catch(() => []);
    }

    if (notes && notes.length > 0) {
      return notes[0];
    }
  } catch (err) {
    console.error(`[Download API] Supabase query note ${decoded} failed:`, err);
  }

  // Fallback to backend API
  try {
    const res = await fetchApi(`/notes/resources/${decoded}`);
    if (res.ok) {
      const data = await res.json();
      return data.note || data;
    }
  } catch (err) {}

  return null;
}

async function incrementDownloadCounter(noteId) {
  if (!noteId) return;
  try {
    // 1. Try backend API counter endpoint
    await fetchApi(`/notes/${noteId}/download`, { method: 'POST' }).catch(() => {});

    // 2. Direct Supabase RPC or REST update if possible
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_CONTENT_URL || 'https://dsgfzikehtxuroabenjr.supabase.co';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_CONTENT_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZ2Z6aWtlaHR4dXJvYWJlbmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTE5MjQsImV4cCI6MjA5MTYyNzkyNH0.k1ob51kFIot-pb51Takq82XkGY8M-Xc09tNBlqLtkns';
    
    // Call Supabase RPC increment if present or PATCH note
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_note_downloads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ p_note_id: noteId }),
    }).catch(() => {});
  } catch (e) {
    console.error('[Download Counter Exception]:', e.message);
  }
}

export async function GET(request, context) {
  const params = await context.params;
  const { noteId } = params;

  if (!noteId) {
    return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
  }

  const note = await getNoteByIdOrSlug(noteId);

  if (!note || !note.file_url) {
    return NextResponse.json({ error: 'Note or file not found' }, { status: 404 });
  }

  // Asynchronously increment download count
  incrementDownloadCounter(note.id || noteId).catch(() => {});

  const fileUrl = note.file_url.trim();

  // Check if link is Google Drive or external non-direct file
  const isGoogleDrive = fileUrl.includes('drive.google.com') || fileUrl.includes('docs.google.com');

  if (isGoogleDrive && note.file_type === 'link') {
    // External link: Redirect directly to source URL
    return NextResponse.redirect(fileUrl, { status: 302 });
  }

  // Determine original filename fallback strategy:
  // 1. Stored original_filename / originalFilename
  // 2. Title + '.pdf'
  const rawOriginalFilename = note.original_filename || note.originalFilename || (note.title ? `${note.title}.pdf` : 'Document.pdf');
  const sanitizedFilename = sanitizePdfFilename(rawOriginalFilename, note.title);

  // Stream raw file from Cloudinary or remote storage
  try {
    const remoteRes = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!remoteRes.ok) {
      console.warn(`[Download API] Remote fetch returned status ${remoteRes.status}, falling back to redirect.`);
      return NextResponse.redirect(fileUrl, { status: 302 });
    }

    const headers = new Headers();
    headers.set('Content-Type', note.file_type === 'pdf' || fileUrl.includes('/raw/') ? 'application/pdf' : (remoteRes.headers.get('content-type') || 'application/pdf'));
    headers.set('Content-Disposition', buildContentDispositionHeader(sanitizedFilename));
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    
    const contentLength = remoteRes.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new Response(remoteRes.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[Download API] Error streaming file:', err);
    return NextResponse.redirect(fileUrl, { status: 302 });
  }
}
