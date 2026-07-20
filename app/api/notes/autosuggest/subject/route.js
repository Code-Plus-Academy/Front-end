import { NextResponse } from 'next/server';
import { SearchEngine } from '../../../../../src/services/searchEngine';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || '';
  const semester = searchParams.get('semester') || '';
  const collegeId = searchParams.get('collegeId') || '';
  const query = searchParams.get('q') || searchParams.get('query') || '';

  try {
    const subjects = await SearchEngine.searchSubjects({ courseId, semester, collegeId, query });
    return NextResponse.json({ subjects });
  } catch (err) {
    console.error('Autosuggest subject error:', err);
    return NextResponse.json({ subjects: [] });
  }
}
