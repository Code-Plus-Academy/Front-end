import { NextResponse } from 'next/server';
import { SearchEngine } from '../../../../../src/services/searchEngine';

export async function GET(request) {
  const { searchParams } = new URL(request.url || 'http://localhost');
  const query = searchParams.get('q') || searchParams.get('query') || '';

  try {
    const colleges = await SearchEngine.searchColleges(query);
    return NextResponse.json({ colleges });
  } catch (err) {
    console.error('Autosuggest college error:', err);
    return NextResponse.json({ colleges: [] });
  }
}
