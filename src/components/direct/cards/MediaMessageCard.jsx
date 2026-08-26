'use client';

import React, { useState } from 'react';
import { Play, X, ExternalLink } from 'lucide-react';

export default function MediaMessageCard({ attachment, isMine }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!attachment) return null;

  const isVideo = attachment.media_type === 'video' || attachment.url?.match(/\.(mp4|webm|mov|ogg)$/i);
  const mediaUrl = attachment.url;
  const caption = attachment.caption;

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          maxWidth: '360px',
          width: '100%',
          backgroundColor: isMine ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {isVideo ? (
          <div className="relative bg-black flex items-center justify-center">
            <video
              src={mediaUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[340px] rounded-t-2xl object-cover"
            />
          </div>
        ) : (
          <div
            onClick={() => setLightboxOpen(true)}
            className="cursor-pointer overflow-hidden group relative bg-black/20"
          >
            <img
              src={mediaUrl}
              alt={caption || 'Photo'}
              loading="lazy"
              className="w-full max-h-[340px] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </div>
        )}

        {caption && (
          <div className="p-3 text-xs leading-relaxed" style={{ color: isMine ? '#FFFFFF' : '#E2E8F0' }}>
            {caption}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Images */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={mediaUrl}
            alt={caption || 'Enlarged photo'}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
