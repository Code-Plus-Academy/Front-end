import React from 'react';
import Link from 'next/link';
import NoteCard from '../../../src/components/notes/NoteCard';
import { fetchApi } from '../../../src/utils/notesApi';

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const q = params.q || '';
  return {
    title: q ? `Search Results for "${q}" | Notes Arena` : 'Search study materials | Notes Arena',
    description: `Find syllabus notes, cheatsheets, lab manuals, and previous year papers for "${q}" on Notes Arena.`,
  };
}

async function searchNotes(query) {
  try {
    const res = await fetchApi(`/notes/search?q=${encodeURIComponent(query || '')}`);
    if (res.ok) {
      const data = await res.json();
      return data.notes || [];
    }
  } catch (err) {
    console.error('Error searching notes:', err);
  }
  return [];
}

export default async function NotesSearchPage({ searchParams }) {
  const params = await searchParams;
  const q = params.q || '';
  const notes = await searchNotes(q);

  return (
    <>
      <style>{`
        .search-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        .search-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
        }
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
      `}</style>

      <header className="search-header">
        <h1 className="search-title">
          {q ? `Search Results for "${q}"` : 'Search Study Materials'}
        </h1>
        <p style={{ color: 'var(--sub)', marginTop: 4 }}>
          {notes.length} resources found matching your search.
        </p>
      </header>

      <section>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--sub)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 32, marginBottom: 8 }}>search_off</span>
            <p>We couldn't find any resources matching your query.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Try checking spelling, broadening your terms, or request a new upload.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <Link href="/notes/upload" className="btn-primary" style={{ padding: '8px 20px' }}>
                Upload Study Material
              </Link>
              <Link href="/notes" className="btn-secondary" style={{ padding: '8px 20px' }}>
                Back to Arena
              </Link>
            </div>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
