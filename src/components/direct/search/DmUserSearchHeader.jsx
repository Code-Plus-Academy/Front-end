import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function DmUserSearchHeader({ onBack, isDark = false }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: 'max(16px, env(safe-area-inset-top, 16px)) 20px 12px',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
        background: 'transparent',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to inbox"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
          color: isDark ? '#F8FAFC' : '#0F172A',
          cursor: 'pointer',
          boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease',
          flexShrink: 0,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : '#F8FAFC';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
        }}
      >
        <ArrowLeft size={19} strokeWidth={2.4} />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(1.2rem, 3.5vw, 1.45rem)',
            fontWeight: 800,
            color: isDark ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.4px',
            lineHeight: 1.2,
            fontFamily: "'Manrope', 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          New message
        </h1>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '13px',
            fontWeight: 500,
            color: isDark ? '#94A3B8' : '#64748B',
            letterSpacing: '-0.1px',
            lineHeight: 1.3,
            fontFamily: "'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Search people to start a conversation
        </p>
      </div>
    </header>
  );
}
