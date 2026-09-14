import React from 'react';

export default function SearchLoadingSkeleton({ count = 5, isDark = false }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '16px',
            background: isDark ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9',
          }}
        >
          {/* Avatar Skeleton */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
              flexShrink: 0,
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
            }}
          />

          {/* Details Skeletons */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Name */}
            <div
              style={{
                width: '42%',
                height: '14px',
                borderRadius: '6px',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                animation: 'skeletonPulse 1.5s ease-in-out infinite',
              }}
            />
            {/* Username */}
            <div
              style={{
                width: '26%',
                height: '11px',
                borderRadius: '4px',
                background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)',
                animation: 'skeletonPulse 1.5s ease-in-out infinite',
              }}
            />
            {/* Role / Profession */}
            <div
              style={{
                width: '60%',
                height: '11px',
                borderRadius: '4px',
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                animation: 'skeletonPulse 1.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Button Skeleton */}
          <div
            style={{
              width: '80px',
              height: '32px',
              borderRadius: '9999px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
              flexShrink: 0,
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}
