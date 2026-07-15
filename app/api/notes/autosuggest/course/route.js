import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../../src/utils/notesApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const collegeId = searchParams.get('collegeId') || '';

  try {
    const res = await fetchApi(`/notes/colleges/${collegeId}/courses`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ courses: data.courses || [] });
    }
  } catch (err) {
    console.error('Error fetching courses autosuggest:', err);
  }

  // Fallback
  return NextResponse.json({
    courses: [
      { id: 'c1', name: 'Bachelor of Science (Computer Science)', slug: 'bsc-cs' },
      { id: 'c2', name: 'Bachelor of Engineering (Computer Engineering)', slug: 'be-comp' },
      { id: 'c3', name: 'Master of Computer Applications', slug: 'mca' }
    ]
  });
}
