import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';
import { GET as handleDownloadGet } from '../../../download/[noteId]/route';

export async function GET(request, context) {
  return handleDownloadGet(request, context);
}

export async function POST(request, context) {
  const params = await context.params;
  const { noteId } = params;

  try {
    const res = await fetchApi(`/notes/${noteId}/download`, {
      method: 'POST',
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error('Error tracking download:', err);
  }

  return NextResponse.json({ success: false });
}
