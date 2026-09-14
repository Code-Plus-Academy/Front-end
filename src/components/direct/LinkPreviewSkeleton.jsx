'use client';

import React from 'react';

export default function LinkPreviewSkeleton() {
  return (
    <div
      className="link-preview-skeleton animate-pulse"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        marginBottom: '6px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Banner Skeleton */}
      <div
        style={{
          width: '100%',
          height: '155px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }}
      />

      {/* Bottom Content Skeleton */}
      <div
        style={{
          padding: '8px 10px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ width: '85%', height: '13px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        <div style={{ width: '65%', height: '11px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
        <div style={{ width: '40%', height: '10px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginTop: '2px' }} />
      </div>
    </div>
  );
}
