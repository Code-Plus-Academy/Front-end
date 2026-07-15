import { NextResponse } from 'next/server';
import { fetchApi } from '../../../../src/utils/notesApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const res = await fetchApi(`/notes/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data.suggestions || []);
    }
  } catch (err) {
    console.error('Error proxying search suggestions:', err);
  }

  // Fallback mocks
  const allSuggestions = [
    { id: '1', text: 'Database Management Systems', type: 'subject', targetUrl: '/notes/colleges/sppu/bsc-cs/sem-2/dbms' },
    { id: '2', text: 'Data Structures and Algorithms', type: 'subject', targetUrl: '/notes/colleges/sppu/bsc-cs/sem-2/dsa' },
    { id: '3', text: 'Savitribai Phule Pune University', type: 'college', targetUrl: '/notes/colleges/sppu' },
    { id: '4', text: 'Delhi University', type: 'college', targetUrl: '/notes/colleges/du' },
  ];

  const filtered = allSuggestions.filter(item => 
    item.text.toLowerCase().includes(q.toLowerCase())
  );

  return NextResponse.json(filtered);
}
