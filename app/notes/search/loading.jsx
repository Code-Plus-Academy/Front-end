import React from 'react';
import { NoteCardSkeleton } from '../../../src/components/notes/NotesSkeletons';

export default function SearchLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: 260, height: 28, marginBottom: 8, opacity: 0.3 }} />
      <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 32, opacity: 0.3 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {[...Array(4)].map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
