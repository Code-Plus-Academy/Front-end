'use client';

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LottieArticleLoader({ style, label = "Loading article..." }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          width: 'clamp(160px, 25vw, 240px)',
          height: 'clamp(120px, 20vw, 180px)',
          borderRadius: '14px',
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
        padding: '40px 20px',
        margin: '0 auto',
        minHeight: '40vh',
        ...style,
      }}
    >
      <div
        style={{
          width: 'clamp(160px, 30vw, 280px)',
          height: 'clamp(120px, 22vw, 200px)',
        }}
      >
        <DotLottieReact
          src="/loading-article.lottie"
          loop
          autoplay
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      {label && (
        <p style={{
          marginTop: 14,
          fontFamily: 'var(--font-body, sans-serif)',
          fontSize: 'clamp(13px, 1.3vw, 15px)',
          color: 'var(--text-secondary, var(--sub))',
          fontWeight: 600,
        }}>
          {label}
        </p>
      )}
    </div>
  );
}
