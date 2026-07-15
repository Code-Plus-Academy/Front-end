import React from 'react';

export function NoteCardSkeleton() {
  return (
    <div className="skeleton" style={{ height: 180, borderRadius: 'var(--r-md)', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="skeleton" style={{ width: 60, height: 16, opacity: 0.3 }} />
          <div className="skeleton" style={{ width: 40, height: 16, opacity: 0.3 }} />
        </div>
        <div className="skeleton" style={{ width: '80%', height: 20, marginBottom: 8, opacity: 0.3 }} />
        <div className="skeleton" style={{ width: '50%', height: 14, opacity: 0.3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
        <div className="skeleton" style={{ width: 60, height: 14, opacity: 0.3 }} />
        <div className="skeleton" style={{ width: 80, height: 14, opacity: 0.3 }} />
      </div>
    </div>
  );
}

export function CollegeCardSkeleton() {
  return (
    <div className="skeleton" style={{ height: 140, borderRadius: 'var(--r-md)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="skeleton" style={{ width: 80, height: 12, opacity: 0.3 }} />
        <div className="skeleton" style={{ width: '90%', height: 18, marginTop: 8, opacity: 0.3 }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 14, opacity: 0.3 }} />
    </div>
  );
}
