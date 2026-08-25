import React, { useState, useEffect } from 'react';
import { RotateCw, AlertCircle } from 'lucide-react';

/**
 * GifMessageCard — Renders high-performance animated GIFs with aspect ratio locking
 * to completely eliminate layout shifts during scrolling and real-time updates.
 */
export default function GifMessageCard({ attachment, isMine, status = 'sent', onRetry }) {
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

  // Revoke temporary blob URL once unmounted or replaced with CDN URL
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
        <span>[GIF Unavailable]</span>
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
  const isSending = status === 'sending';

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
      {!loaded && !isFailed && (
        <div
          className="absolute inset-0 animate-pulse flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
        >
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase opacity-60">
            {isSending ? 'Sending GIF...' : 'GIF'}
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
          loaded ? (isFailed ? 'opacity-40 grayscale' : 'opacity-100') : 'opacity-0'
        }`}
      />

      {/* In-Bubble Failure & Retry Overlay */}
      {isFailed && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-3 gap-2 z-10">
          <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
            <AlertCircle size={14} />
            <span>Upload failed</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <RotateCw size={11} /> Tap to retry
            </button>
          )}
        </div>
      )}

      {/* Subtle GIF Badge */}
      {!isFailed && (
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
      )}
    </div>
  );
}
