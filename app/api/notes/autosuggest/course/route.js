import { NextResponse } from 'next/server';
import { getCollegeCourses } from '../../../../../src/lib/supabaseContent';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const collegeId = searchParams.get('collegeId') || '';

  if (!collegeId) {
    return NextResponse.json({ courses: [] });
  }

  try {
    const courses = await getCollegeCourses(collegeId);
    return NextResponse.json({ courses: courses || [] });
  } catch (err) {
    console.error('[autosuggest/course] Supabase error:', err.message);
    return NextResponse.json({ courses: [], error: 'backend_unavailable' });
  }
}
