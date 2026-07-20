'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '../src/components/layout/RouteWrappers';
import Link from 'next/link';

function NotFoundContent() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      fontFamily: "'Geist', 'Manrope', sans-serif",
      padding: '40px 20px',
    }}>
      <div style={{
        fontSize: '120px',
        fontWeight: 800,
        background: 'linear-gradient(135deg, var(--accent-purple), #0ea5e9)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        marginBottom: '20px',
        letterSpacing: '-0.05em',
      }}>
        404
      </div>
      <h1 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: '12px',
      }}>
        Page Not Found
      </h1>
      <p style={{
        fontSize: '16px',
        color: 'var(--sub)',
        maxWidth: '460px',
        lineHeight: '1.6',
        marginBottom: '32px',
      }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        href="/"
        style={{
          background: 'linear-gradient(135deg, var(--accent-purple), #6366f1)',
          color: '#fff',
          padding: '12px 28px',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '14px',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(122, 0, 255, 0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(122, 0, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(122, 0, 255, 0.3)';
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
