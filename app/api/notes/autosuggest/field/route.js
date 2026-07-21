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

  // Fallback with valid PostgreSQL UUIDs
  return NextResponse.json({
    fields: [
      { id: '85665ae3-d2dc-43f3-b4d6-1040b2645850', name: 'Computer Science', slug: 'computer-science' },
      { id: '54ba8ca1-5b5c-498f-a583-445bc09d5ee6', name: 'Engineering', slug: 'engineering' }
    ]
  });
}
