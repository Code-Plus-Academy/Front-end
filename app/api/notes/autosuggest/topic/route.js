import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fieldId = searchParams.get('fieldId') || '';

  try {
    const res = await fetchApi(`/notes/fields/${fieldId}/topics`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ topics: data.topics || [] });
    }
  } catch (err) {
    console.error('Error fetching topics autosuggest:', err);
  }

  // Fallback
  return NextResponse.json({
    topics: [
      { id: 't1', name: 'Database Management Systems', slug: 'dbms' },
      { id: 't2', name: 'Data Structures & Algorithms', slug: 'dsa' },
      { id: 't3', name: 'Computer Networks', slug: 'computer-networks' }
    ]
  });
}
