import React from 'react';
import { CollegeCardSkeleton } from '../../../src/components/notes/NotesSkeletons';

export default function CollegesLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: 280, height: 32, marginBottom: 8, opacity: 0.3 }} />
      <div className="skeleton" style={{ width: '60%', height: 18, marginBottom: 24, opacity: 0.3 }} />
      <div className="skeleton" style={{ width: 240, height: 36, marginBottom: 32, opacity: 0.3 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {[...Array(6)].map((_, i) => (
          <CollegeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
