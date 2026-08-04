'use client';

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Lottie404Player({ style }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          width: 'clamp(320px, 45vw, 480px)',
          height: 'clamp(280px, 35vw, 380px)',
          borderRadius: '16px',
          background: 'var(--s2, rgba(255,255,255,0.03))',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 'clamp(320px, 50vw, 500px)',
        maxHeight: 'clamp(300px, 45vh, 420px)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        margin: '0 auto',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <DotLottieReact
        src="/error-404.lottie"
        loop
        autoplay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
