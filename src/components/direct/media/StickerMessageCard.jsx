import React, { useState, useEffect } from 'react';
import { RotateCw, AlertCircle } from 'lucide-react';

/**
 * StickerMessageCard — Renders transparent, borderless floating stickers in chat
 * with zero Cumulative Layout Shift (CLS) using intrinsic aspect ratio reservation.
 */
export default function StickerMessageCard({ attachment, isMine, status = 'sent', onRetry }) {
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
  const alt = parsed.alt || parsed.name || parsed.title || 'Sticker';
  const width = parsed.width || 256;
  const height = parsed.height || 256;
  const aspectRatio = (width / height) || 1;

  // Revoke temporary blob URL on unmount or URL change
  useEffect(() => {
    return () => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  if (!url || error) {
    return (
      <div
        className="flex items-center justify-between p-3 rounded-2xl text-xs font-mono gap-2"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px dashed rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
        }}
      >
        <span>[Sticker Unavailable]</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] cursor-pointer"
          >
            <RotateCw size={10} /> Retry
          </button>
        )}
      </div>
    );
  }

  const isFailed = status === 'failed';

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
      {!loaded && !isFailed && (
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
          loaded ? (isFailed ? 'opacity-40 grayscale' : 'opacity-100') : 'opacity-0'
        }`}
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.28))',
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      />

      {/* In-Bubble Retry Overlay on Upload Failure */}
      {isFailed && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-2 gap-1.5 z-10">
          <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
            <AlertCircle size={12} /> Failed
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <RotateCw size={10} /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
