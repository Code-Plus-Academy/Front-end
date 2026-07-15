import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || '';
  const semester = searchParams.get('semester') || '';

  try {
    const res = await fetchApi(`/notes/courses/${courseId}/semesters/${semester}/subjects`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ subjects: data.subjects || [] });
    }
  } catch (err) {
    console.error('Error fetching subjects autosuggest:', err);
  }

  // Fallback
  return NextResponse.json({
    subjects: [
      { id: 's3', name: 'Database Management Systems', slug: 'dbms' },
      { id: 's4', name: 'Data Structures and Algorithms', slug: 'dsa' },
      { id: 's5', name: 'Computer Networks', slug: 'computer-networks' }
    ]
  });
}
