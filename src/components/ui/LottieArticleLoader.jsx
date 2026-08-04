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
          width: 'min(90vw, 520px)',
          height: 'min(75vw, 400px)',
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
        justifyContent: 'center',
        padding: '40px 20px',
        margin: '0 auto',
        minHeight: '40vh',
        ...style,
      }}
    >
      <div
        style={{
          width: 'min(90vw, 520px)',
          height: 'min(75vw, 400px)',
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
