'use client';

import React, { useEffect } from 'react';

export default function NotesError({ error, reset }) {
  useEffect(() => {
    console.error('Notes Arena Route Error:', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: 24 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 64, color: 'var(--red)', marginBottom: 16 }}>
        error
      </span>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--sub)', maxWidth: 480, marginBottom: 24 }}>
        We encountered an error loading the study materials. Please try reloading or check back shortly.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => reset()} className="btn-primary" style={{ padding: '10px 24px' }}>
          Try Again
        </button>
        <a href="/notes" className="btn-secondary" style={{ padding: '10px 24px', textDecoration: 'none' }}>
          Go Home
        </a>
      </div>
    </div>
  );
}
