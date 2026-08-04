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
          width: 'clamp(260px, 40vw, 460px)',
          height: 'clamp(200px, 30vw, 340px)',
          borderRadius: '16px',
          background: 'var(--s2, rgba(255,255,255,0.03))',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 'clamp(260px, 45vw, 480px)',
        maxHeight: 'clamp(220px, 35vh, 380px)',
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
