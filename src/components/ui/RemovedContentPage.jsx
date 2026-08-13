'use client';

import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from 'react-router-dom';

export default function RemovedContentPage({
  title = "This Content Was Removed",
  message = "This content has been taken down or removed by moderation for violating community guidelines.",
  backUrl = "/feed"
}) {
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        textAlign: 'center',
        fontFamily: "'Geist', 'Manrope', -apple-system, sans-serif",
        padding: '30px 20px',
        boxSizing: 'border-box',
        background: 'var(--bg, #fafafa)',
        color: 'var(--text, #191919)',
      }}
    >
      {/* Tumbleweed Lottie Animation */}
      <div
        style={{
          width: 'min(90vw, 360px)',
          height: 'min(70vw, 260px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        {mounted ? (
          <DotLottieReact
            src="/Tumbleweed.lottie"
            loop
            autoplay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '16px',
              background: 'var(--s2, rgba(0,0,0,0.04))',
            }}
          />
        )}
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
          fontWeight: 800,
          color: 'var(--text, #191919)',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
          fontFamily: "'Space Grotesk', 'Clash Display', sans-serif",
        }}
      >
        {title}
      </h1>

      <p
        style={{
          fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
          color: 'var(--sub, #666666)',
          maxWidth: '460px',
          lineHeight: '1.6',
          margin: '0 0 28px',
        }}
      >
        {message}
      </p>

      <button
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            navigate(-1);
          } else {
            navigate(backUrl);
          }
        }}
        style={{
          background: 'linear-gradient(135deg, var(--green, #10b981), #059669)',
          color: '#ffffff',
          border: 'none',
          padding: '12px 28px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.02em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
        }}
      >
        Go Back
      </button>
    </div>
  );
}
