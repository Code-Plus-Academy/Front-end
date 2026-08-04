'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '../src/components/layout/RouteWrappers';
import Link from 'next/link';
import Lottie404Player from '../src/components/ui/Lottie404Player';

function NotFoundContent() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justify: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      fontFamily: "'Geist', 'Manrope', sans-serif",
      padding: 'clamp(20px, 4vw, 40px) 20px',
      boxSizing: 'border-box',
    }}>
      {/* Lottie 404 Animation */}
      <Lottie404Player style={{ marginBottom: 'clamp(12px, 2vh, 24px)' }} />

      <h1 style={{
        fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
        fontWeight: 800,
        color: 'var(--text)',
        marginBottom: '10px',
        letterSpacing: '-0.02em',
      }}>
        Page Not Found
      </h1>
      <p style={{
        fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
        color: 'var(--sub)',
        maxWidth: '460px',
        lineHeight: '1.6',
        marginBottom: '28px',
      }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        href="/"
        style={{
          background: 'linear-gradient(135deg, var(--primary, #3B7CFF), var(--accent-purple, #9333EA))',
          color: '#fff',
          padding: '12px 28px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '14px',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(59, 124, 255, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 124, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 124, 255, 0.3)';
        }}
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <AppLayout>
        <NotFoundContent />
      </AppLayout>
    </Suspense>
  );
}
