import React from 'react';
import { NoteCardSkeleton, CollegeCardSkeleton } from '../../src/components/notes/NotesSkeletons';

export default function NotesLoading() {
  return (
    <div>
      {/* Hero Skeleton */}
      <div className="skeleton" style={{ height: 260, borderRadius: 'var(--r-lg)', marginBottom: 32, opacity: 0.3 }} />

      {/* Stats Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-md)', opacity: 0.3 }} />
        ))}
      </div>

      {/* Fields Chips Skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div className="skeleton" style={{ width: 180, height: 24, marginBottom: 16, opacity: 0.3 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 120, height: 36, borderRadius: 20, opacity: 0.3 }} />
          ))}
        </div>
      </div>

      {/* Popular Colleges Skeleton */}
      <div style={{ marginBottom: 40 }}>
        <div className="skeleton" style={{ width: 160, height: 24, marginBottom: 16, opacity: 0.3 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <CollegeCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Recent Notes Skeleton */}
      <div>
        <div className="skeleton" style={{ width: 220, height: 24, marginBottom: 16, opacity: 0.3 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {[...Array(4)].map((_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
