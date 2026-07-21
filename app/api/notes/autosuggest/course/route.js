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

  // Fallback with valid PostgreSQL UUIDs
  return NextResponse.json({
    courses: [
      { id: '64d02ead-1a17-4de6-9882-8f3d5c4ffac4', name: 'Bachelor of Science (Computer Science)', slug: 'bsc-cs' },
      { id: 'c703b532-e9c4-4728-8711-0ad6f84f63a8', name: 'Bachelor Of Computer Science (NEP)', slug: 'bachelor-of-computer-science-nep' },
    ]
  });
}
