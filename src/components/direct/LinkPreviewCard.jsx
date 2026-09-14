'use client';

import React, { useState } from 'react';
import { Play, FileText, Video, Film, Globe, ExternalLink, BookOpen } from 'lucide-react';

export default function LinkPreviewCard({ preview, isMine = false }) {
  const [imageError, setImageError] = useState(false);

  if (!preview || (!preview.title && !preview.url && !preview.domain)) return null;

  const {
    url,
    domain = 'www.codeplusacademy.in',
    favicon = '',
    title = '',
    description = '',
    image = '',
    contentType = 'website',
    badge = '',
    isInternal = false,
  } = preview;

  const isVideo = contentType === 'long_video';
  const isShort = contentType === 'short_video';
  const isNotes = contentType === 'notes';
  const isArticle = contentType === 'article';

  const handleClick = (e) => {
    e.stopPropagation();
    if (!url) return;
    if (isInternal && typeof window !== 'undefined') {
      try {
        const parsed = new URL(url, window.location.origin);
        if (parsed.origin === window.location.origin) {
          window.location.href = parsed.pathname + parsed.search;
          return;
        }
      } catch {}
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  // Determine fallback image for notes/videos if missing
  const effectiveImage = image || (isNotes ? 'https://codeplusacademy.in/notes-arena-og.jpg' : null);
  const hasValidImage = Boolean(effectiveImage && !imageError);

  const cleanDomain = (domain || 'www.codeplusacademy.in').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="whatsapp-preview-card group"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: '10px',
        backgroundColor: isMine ? 'rgba(0, 0, 0, 0.16)' : 'rgba(0, 0, 0, 0.06)',
        border: '1px solid var(--border-default, rgba(0, 0, 0, 0.08))',
        overflow: 'hidden',
        cursor: 'pointer',
        textDecoration: 'none',
        marginBottom: '6px',
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.94';
        e.currentTarget.style.transform = 'scale(0.995)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* ── Top Full-Width Banner Image ─────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          height: isShort ? '190px' : '155px',
          position: 'relative',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {hasValidImage ? (
          <img
            src={effectiveImage}
            alt={title || cleanDomain}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.3s ease',
            }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
              gap: 8,
              padding: 12,
              textAlign: 'center',
            }}
          >
            {isNotes ? (
              <BookOpen size={36} color="#00b4d8" />
            ) : isVideo ? (
              <Video size={36} color="#ef4444" />
            ) : (
              <Film size={36} color="#ec4899" />
            )}
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'monospace' }}>
              {isNotes ? 'NOTES ARENA' : 'CODE PLUS ACADEMY'}
            </span>
          </div>
        )}

        {/* Video / Shorts Play Button Overlay */}
        {(isVideo || isShort) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <Play size={16} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Middle Info Box (WhatsApp style) ─────────────────────────────── */}
      <div
        style={{
          padding: '8px 10px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          boxSizing: 'border-box',
        }}
      >
        {/* Title (Bold, 2 lines clamp) */}
        <h4
          style={{
            margin: 0,
            fontSize: '13.5px',
            fontWeight: 700,
            lineHeight: 1.35,
            color: isMine ? '#fff' : 'inherit',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}
        >
          {title || cleanDomain}
        </h4>

        {/* Description (2 lines clamp) */}
        {description && (
          <p
            style={{
              margin: '1px 0 0',
              fontSize: '11.5px',
              lineHeight: 1.35,
              color: isMine ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 116, 139, 0.95)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
            }}
          >
            {description}
          </p>
        )}

        {/* Domain Footer */}
        <span
          style={{
            fontSize: '11px',
            lineHeight: 1.2,
            marginTop: '2px',
            color: isMine ? 'rgba(255, 255, 255, 0.65)' : 'rgba(100, 116, 139, 0.8)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {cleanDomain}
        </span>
      </div>
    </div>
  );
}
