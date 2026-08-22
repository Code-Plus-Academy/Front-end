'use client';

import React from 'react';

export default function SavedHubSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md, 14px)',
            overflow: 'hidden',
            height: 280,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 16,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '100%', height: 130, background: 'var(--s2)', borderRadius: 10, marginBottom: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '70%', height: 16, background: 'var(--s2)', borderRadius: 4 }} />
            <div style={{ width: '45%', height: 12, background: 'var(--s2)', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ width: '30%', height: 12, background: 'var(--s2)', borderRadius: 4 }} />
            <div style={{ width: '25%', height: 24, background: 'var(--s2)', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
