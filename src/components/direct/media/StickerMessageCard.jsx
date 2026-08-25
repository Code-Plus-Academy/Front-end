'use client';

import React, { useState } from 'react';

/**
 * StickerMessageCard — Renders transparent, borderless floating stickers in chat
 * with zero Cumulative Layout Shift (CLS) using intrinsic aspect ratio reservation.
 */
export default function StickerMessageCard({ attachment, isMine }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!attachment) return null;

  const url = attachment.url || attachment.file;
  const alt = attachment.alt || attachment.name || 'Sticker';
  const width = attachment.width || 256;
  const height = attachment.height || 256;
  const aspectRatio = (width / height) || 1;

  if (!url || error) {
    return (
      <div
        className="flex items-center justify-center p-3 rounded-2xl text-xs opacity-60 font-mono"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          color: '#cbd5e1',
        }}
      >
        <span>[Sticker Unavailable]</span>
      </div>
    );
  }

  return (
    <div
      className="sticker-message-container select-none group relative"
      style={{
        width: 'clamp(120px, 32vw, 170px)',
        aspectRatio: `${aspectRatio}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        position: 'relative',
      }}
    >
      {/* Skeleton Pulse before load */}
      {!loaded && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        />
      )}

      <img
        src={url}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-contain transition-all duration-200 group-hover:scale-105 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.28))',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
