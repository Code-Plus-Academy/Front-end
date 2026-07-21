import { NextResponse } from 'next/server';
import { getNotesFields } from '../../../../../src/lib/supabaseContent';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || searchParams.get('query') || '';

  try {
    const fields = await getNotesFields(q);
    return NextResponse.json({ fields: fields || [] });
  } catch (err) {
    console.error('[autosuggest/field] Supabase error:', err.message);
    return NextResponse.json({ fields: [], error: 'backend_unavailable' });
  }
}
