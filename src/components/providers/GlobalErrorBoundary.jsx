'use client';

import React from 'react';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GlobalErrorBoundary] Render error caught:', error, errorInfo);

    const msg = error?.message || error?.name || String(error || '');
    const isChunkError =
      msg.includes('ChunkLoadError') ||
      msg.includes('Loading chunk') ||
      msg.includes('MIME type') ||
      msg.includes('text/plain') ||
      msg.includes('Failed to fetch dynamically imported module');

    if (isChunkError && typeof window !== 'undefined') {
      if (!sessionStorage.getItem('cpa_eb_chunk_reloaded')) {
        sessionStorage.setItem('cpa_eb_chunk_reloaded', '1');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cpa_eb_chunk_reloaded');
      sessionStorage.removeItem('cpa_chunk_reloaded');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg, #090d16)',
            color: 'var(--text, #f8fafc)',
            padding: 24,
            textAlign: 'center',
            fontFamily: "'Geist', 'Inter', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: '100%',
              background: 'var(--surface, #0f172a)',
              border: '1px solid var(--border, #1e293b)',
              borderRadius: 24,
              padding: 36,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 28,
              }}
            >
              ⚡
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
              Application Updated
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6 }}>
              A new version of Code Plus Academy has been deployed. Please reload the page to get the latest code.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: 99,
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
