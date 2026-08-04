'use client';

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LottieSearchLoader({ style, label = "Searching..." }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          width: 'clamp(180px, 30vw, 280px)',
          height: 'clamp(140px, 25vw, 220px)',
          borderRadius: '16px',
          background: 'var(--s2, rgba(255,255,255,0.03))',
          margin: '0 auto',
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        padding: '30px 20px',
        margin: '0 auto',
        ...style,
      }}
    >
      <div
        style={{
          width: 'clamp(180px, 35vw, 320px)',
          height: 'clamp(140px, 28vw, 240px)',
        }}
      >
        <DotLottieReact
          src="/loading-search.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      {label && (
        <p style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'clamp(12px, 1.2vw, 14px)',
          color: 'var(--text-secondary, var(--sub))',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}>
          {label}
        </p>
      )}
    </div>
  );
}
