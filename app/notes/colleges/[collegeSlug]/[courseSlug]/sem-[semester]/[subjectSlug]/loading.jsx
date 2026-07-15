import React from 'react';
import { NoteCardSkeleton } from '../../../../../../../src/components/notes/NotesSkeletons';

export default function SubjectLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: 340, height: 16, marginBottom: 8, opacity: 0.3 }} />
      <div className="skeleton" style={{ width: '40%', height: 28, marginBottom: 8, opacity: 0.3 }} />
      <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 32, opacity: 0.3 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {[...Array(4)].map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
