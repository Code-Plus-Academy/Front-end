import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';

export async function GET() {
  try {
    const res = await fetchApi('/notes/colleges');
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ colleges: data.colleges || [] });
    }
  } catch (err) {
    console.error('Error fetching colleges autosuggest:', err);
  }

  // Fallback
  return NextResponse.json({
    colleges: [
      { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu' },
      { id: '2', name: 'Delhi University', slug: 'du' }
    ]
  });
}
