'use client';

import React, { useState } from 'react';

/**
 * GifMessageCard — Renders high-performance animated GIFs with aspect ratio locking
 * to completely eliminate layout shifts during scrolling and real-time updates.
 */
export default function GifMessageCard({ attachment, isMine }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!attachment) return null;

  let parsed = attachment;
  if (typeof attachment === 'string') {
    try {
      parsed = JSON.parse(attachment);
    } catch {
      parsed = { url: attachment };
    }
  }

  const url = parsed.url || parsed.preview_url || parsed.file || parsed.src || (typeof parsed === 'string' ? parsed : null);
  const previewUrl = parsed.preview_url || parsed.preview || url;
  const title = parsed.title || 'Animated GIF';
  const width = parsed.width || 480;
  const height = parsed.height || 270;
  const aspectRatio = parsed.aspect_ratio || ((width / height) || 1.77);

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
        <span>[GIF Unavailable]</span>
      </div>
    );
  }

  return (
    <div
      className="gif-message-card relative rounded-2xl overflow-hidden shadow-lg transition-transform duration-200 hover:scale-[1.01]"
      style={{
        width: 'min(320px, 75vw)',
        aspectRatio: `${aspectRatio}`,
        backgroundColor: 'rgba(15, 20, 25, 0.6)',
        border: isMine ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(74, 68, 87, 0.35)',
      }}
    >
      {/* Skeleton Pulse */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
        >
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase opacity-60">
            GIF
          </span>
        </div>
      )}

      <img
        src={url}
        alt={title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Subtle GIF Badge */}
      <div
        className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black tracking-wider uppercase backdrop-blur-md"
        style={{
          background: 'rgba(0, 0, 0, 0.55)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        GIF
      </div>
    </div>
  );
}
