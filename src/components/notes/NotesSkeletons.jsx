import React from 'react';

export function NoteCardSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '260px',
        border: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'var(--card-bg, var(--surface, #111827))',
      }}
    >
      {/* Top cover preview skeleton */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/10',
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '12px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ width: 50, height: 16, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div style={{ width: 40, height: 16, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Body skeleton */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ width: '85%', height: 16, borderRadius: 4, marginBottom: 6, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: '60%', height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <div style={{ width: 50, height: 10, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div style={{ width: 40, height: 10, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </div>
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
