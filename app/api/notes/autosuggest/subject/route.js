import { NextResponse } from 'next/server';
import { getCourseSubjects } from '../../../../../src/lib/supabaseContent';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || '';
  const semester = searchParams.get('semester') ? parseInt(searchParams.get('semester'), 10) : null;
  const q = searchParams.get('q') || searchParams.get('query') || '';

  if (!courseId) {
    return NextResponse.json({ subjects: [] });
  }

  try {
    const subjects = await getCourseSubjects(courseId, semester, q);
    return NextResponse.json({ subjects: subjects || [] });
  } catch (err) {
    console.error('[autosuggest/subject] Supabase error:', err.message);
    return NextResponse.json({ subjects: [], error: 'backend_unavailable' });
  }
}
