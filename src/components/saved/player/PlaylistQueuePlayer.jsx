'use client';

import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, ChevronUp, ChevronDown, ListMusic, Volume2, Maximize2 } from 'lucide-react';

export default function PlaylistQueuePlayer({
  activeVideo,
  playlist,
  queue = [],
  currentIndex = 0,
  onNext,
  onPrev,
  onClose,
  onSelectIndex,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);

  if (!activeVideo) return null;

  const currentItem = queue[currentIndex] || activeVideo;
  const videoUrl = currentItem.file_url || (currentItem.files?.[0]?.storage_url) || null;
  const thumbnail = currentItem.thumbnail_url || currentItem.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 'min(420px, calc(100vw - 32px))',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(59, 124, 255, 0.3)',
        borderRadius: 'var(--r-md, 16px)',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 124, 255, 0.2)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Video Viewport / Thumbnail */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            controls
            onEnded={onNext}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={thumbnail}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Play size={36} fill="#fff" color="#fff" />
            </div>
          </div>
        )}

        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%',
            width: 26,
            height: 26,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            zIndex: 10,
          }}
          aria-label="Close player"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mini Player Control Bar */}
      <div style={{ padding: '12px 14px', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentItem.title}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {playlist ? `Playlist: ${playlist.name}` : (currentItem.creator_name || 'Code+ Academy')} · {currentIndex + 1} of {queue.length || 1}
            </p>
          </div>

          {/* Queue Drawer Toggle */}
          {queue.length > 1 && (
            <button
              type="button"
              onClick={() => setIsQueueExpanded(!isQueueExpanded)}
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                color: 'var(--text)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              <ListMusic size={13} />
              <span>Queue ({queue.length})</span>
              {isQueueExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          )}
        </div>

        {/* Playback Controls */}
        {queue.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={onPrev}
              style={{
                background: 'none',
                border: 'none',
                color: currentIndex === 0 ? 'var(--dim)' : 'var(--text)',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Previous video"
            >
              <SkipBack size={18} />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary, #3B7CFF)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={15} fill="#fff" /> : <Play size={15} fill="#fff" />}
            </button>

            <button
              type="button"
              disabled={currentIndex >= queue.length - 1}
              onClick={onNext}
              style={{
                background: 'none',
                border: 'none',
                color: currentIndex >= queue.length - 1 ? 'var(--dim)' : 'var(--text)',
                cursor: currentIndex >= queue.length - 1 ? 'not-allowed' : 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Next video"
            >
              <SkipForward size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Playlist Queue Drawer */}
      {isQueueExpanded && queue.length > 1 && (
        <div style={{
          maxHeight: 180,
          overflowY: 'auto',
          borderTop: '1px solid var(--border)',
          background: '#090d16',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {queue.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={item.id || idx}
                onClick={() => onSelectIndex && onSelectIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: isCurrent ? 'rgba(59, 124, 255, 0.2)' : 'transparent',
                  border: isCurrent ? '1px solid rgba(59, 124, 255, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
                className="hover:bg-white/5"
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? 'var(--primary)' : 'var(--sub)', width: 16 }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
