import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';

export async function GET() {
  try {
    const res = await fetchApi('/notes/fields');
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ fields: data.fields || [] });
    }
  } catch (err) {
    console.error('Error fetching fields autosuggest:', err);
  }

  // Fallback
  return NextResponse.json({
    fields: [
      { id: '1', name: 'Computer Science', slug: 'computer-science' },
      { id: '2', name: 'Electronics Engineering', slug: 'electronics-engineering' },
      { id: '3', name: 'Medical & Healthcare', slug: 'medical-healthcare' }
    ]
  });
}
