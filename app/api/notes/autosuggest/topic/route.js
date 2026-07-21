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

  // Fallback with valid PostgreSQL UUIDs
  return NextResponse.json({
    topics: [
      { id: 'c066e189-40d5-458e-a499-467fe3726dcd', name: 'Database Management Systems', slug: 'dbms' },
      { id: '4ddb0806-f312-438c-8cf9-f9edb8a6ffd0', name: 'Digital Logic and Design.', slug: 'digital-logic-and-design' }
    ]
  });
}
