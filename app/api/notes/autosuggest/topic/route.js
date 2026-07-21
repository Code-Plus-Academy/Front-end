import { NextResponse } from 'next/server';
import { getFieldTopics } from '../../../../../src/lib/supabaseContent';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fieldId = searchParams.get('fieldId') || '';
  const q = searchParams.get('q') || searchParams.get('query') || '';

  if (!fieldId) {
    return NextResponse.json({ topics: [] });
  }

  try {
    const topics = await getFieldTopics(fieldId, q);
    return NextResponse.json({ topics: topics || [] });
  } catch (err) {
    console.error('[autosuggest/topic] Supabase error:', err.message);
    return NextResponse.json({ topics: [], error: 'backend_unavailable' });
  }
}
