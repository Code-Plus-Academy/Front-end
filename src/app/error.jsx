'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050507',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'monospace',
      gap: 16,
    }}>
      <p style={{ color: '#888', fontSize: 13 }}>Something went wrong.</p>
      <button
        onClick={reset}
        style={{ background: '#7c3aed', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
      >
        Try again
      </button>
    </div>
  );
}
