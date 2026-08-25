import React from 'react';
import { Lock, Clock, UserPlus } from 'lucide-react';

export default function PrivateProfileLock({ user, isDark, hasRequested, onFollowToggle, followLoading, C }) {
  return (
    <div
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.75) 0%, rgba(10, 15, 25, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        border: `1px solid ${C?.border || 'rgba(122, 0, 255, 0.2)'}`,
        borderRadius: 20,
        padding: 'clamp(32px, 5vw, 64px) 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        boxShadow: isDark
          ? '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 12px 32px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        margin: '16px 0',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Glowing Neon Lock Icon */}
      <div
        style={{
          width: 'clamp(64px, 6vw, 84px)',
          height: 'clamp(64px, 6vw, 84px)',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(122, 0, 255, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1.5px solid rgba(168, 85, 247, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(122, 0, 255, 0.35), inset 0 0 12px rgba(168, 85, 247, 0.2)',
          color: '#a855f7',
          marginBottom: 4,
        }}
      >
        <Lock size={32} strokeWidth={2.2} />
      </div>

      {/* Lock Heading */}
      <div style={{ maxWidth: 460 }}>
        <h2
          style={{
            fontSize: 'clamp(18px, 2.2vw, 24px)',
            fontWeight: 800,
            color: C?.text || 'var(--text)',
            margin: '0 0 8px 0',
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '-0.02em',
          }}
        >
          This Account is Private
        </h2>
        <p
          style={{
            fontSize: 'clamp(13px, 1.4vw, 15px)',
            color: C?.textSec || 'var(--sub)',
            lineHeight: 1.6,
            margin: 0,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          Follow <span style={{ color: '#a855f7', fontWeight: 700 }}>@{user?.username}</span> to view their activity, posts, articles, projects, and certifications.
        </p>
      </div>

      {/* Interactive Action Button */}
      {onFollowToggle && (
        <button
          type="button"
          disabled={followLoading}
          onClick={onFollowToggle}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
            padding: '12px 28px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Manrope', sans-serif",
            cursor: followLoading ? 'not-allowed' : 'pointer',
            border: hasRequested
              ? `1.5px solid ${C?.border || 'rgba(168, 85, 247, 0.3)'}`
              : 'none',
            background: hasRequested
              ? isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'
              : 'linear-gradient(135deg, #7A00FF 0%, #9333ea 100%)',
            color: hasRequested
              ? isDark ? '#D1D5DB' : '#475569'
              : '#ffffff',
            boxShadow: hasRequested
              ? 'none'
              : '0 4px 18px rgba(122, 0, 255, 0.4)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: followLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!hasRequested && !followLoading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(122, 0, 255, 0.55)';
            }
          }}
          onMouseLeave={(e) => {
            if (!hasRequested) {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(122, 0, 255, 0.4)';
            }
          }}
        >
          {followLoading ? (
            <span>Processing...</span>
          ) : hasRequested ? (
            <>
              <Clock size={16} />
              <span>Requested</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Request to Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
