import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';

export async function POST(request, { params }) {
  const { noteId } = await params;

  try {
    const res = await fetchApi(`/notes/${noteId}/bookmark`, {
      method: 'POST',
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    }

    const err = await res.json();
    return NextResponse.json({ message: err.message || 'Bookmark failed' }, { status: res.status });
  } catch (err) {
    console.error('Error bookmarking note:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
