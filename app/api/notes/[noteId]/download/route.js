import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';

export async function POST(request, { params }) {
  const { noteId } = await params;

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
