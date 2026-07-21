import { NextResponse } from 'next/server';
import { searchColleges } from '../../../../../src/lib/supabaseContent';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || searchParams.get('query') || '';

  try {
    const colleges = await searchColleges(q);
    return NextResponse.json({ colleges });
  } catch (err) {
    console.error('[autosuggest/college] Supabase error:', err.message);
    return NextResponse.json({ colleges: [], error: 'backend_unavailable' });
  }
}
