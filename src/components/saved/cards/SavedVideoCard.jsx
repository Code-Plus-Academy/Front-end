'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Trash2, FolderPlus, Eye, Heart, Check, Clock, ListVideo } from 'lucide-react';

function formatDuration(seconds) {
  if (!seconds) return 'Video';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function SavedVideoCard({
  item,
  onUnsave,
  onAddToContainer,
  onPlayVideo,
  selected = false,
  onToggleSelect,
  selectable = false,
  containers = [],
}) {
  const isShort = item.content_type === 'short' || item.type === 'short' || item.item_kind === 'short';
  const videoUrl = isShort ? `/shorts/${item.id}` : `/videos/${item.id || item.slug}`;
  const thumbnail = item.thumbnail_url || item.thumbnail || (item.files?.[0]?.storage_url) || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600';
  const durationFormatted = formatDuration(item.duration || item.duration_seconds);
  const assignedContainers = containers.filter(c => c.item_ids?.includes(item.id));

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: selected ? '1px solid var(--primary, #3B7CFF)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md, 14px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: selected ? '0 0 0 2px rgba(59, 124, 255, 0.25), 0 6px 20px rgba(0,0,0,0.25)' : 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
        position: 'relative',
        boxSizing: 'border-box',
        height: '100%',
      }}
      className="group hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
    >
      {/* Thumbnail with Video Play Overlay */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: isShort ? '9/14' : '16/9', 
          overflow: 'hidden', 
          background: '#0a0e17',
          cursor: 'pointer',
        }}
        onClick={() => onPlayVideo ? onPlayVideo(item) : undefined}
      >
        <img
          src={thumbnail}
          alt={item.title || 'Video'}
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
          className="group-hover:scale-105"
          loading="lazy"
        />

        {/* Play Icon Backdrop */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
        }} className="group-hover:bg-black/40">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--primary, #3B7CFF)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'transform 0.2s ease',
          }} className="group-hover:scale-110">
            <Play size={18} fill="#fff" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Selection Checkbox */}
        {selectable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect(item.id);
            }}
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 22,
              height: 22,
              borderRadius: 6,
              background: selected ? 'var(--primary, #3B7CFF)' : 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              color: '#fff',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
            className="active:scale-90"
            aria-label={selected ? 'Deselect video' : 'Select video'}
          >
            {selected && <Check size={14} strokeWidth={3} />}
          </button>
        )}

        {/* Duration Badge Bottom Right */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          background: 'rgba(0, 0, 0, 0.82)',
          color: '#fff',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 10.5,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}>
          <Clock size={10} />
          <span>{durationFormatted}</span>
        </div>

        {/* Content Type Pill (Short vs Video) */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: isShort ? 'rgba(236, 72, 153, 0.85)' : 'rgba(59, 124, 255, 0.85)',
          color: '#fff',
          padding: '2px 7px',
          borderRadius: 4,
          fontSize: 9.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {isShort ? 'Short' : 'Video'}
        </div>
      </div>

      {/* Body Information */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 10 }}>
        <div>
          <Link href={videoUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.35,
              margin: '0 0 4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }} className="group-hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
          </Link>

          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--sub)' }}>
            {item.creator_name || item.author_name || item.creator_username || 'Code+ Creator'}
          </p>

          {/* Assigned Playlists / Containers */}
          {assignedContainers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {assignedContainers.map(c => (
                <span
                  key={c.id}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${c.color_token || 'var(--primary)'}18`,
                    color: c.color_token || 'var(--primary)',
                    border: `1px solid ${c.color_token || 'var(--primary)'}35`,
                  }}
                >
                  <ListVideo size={10} />
                  <span>{c.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions & Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          marginTop: 6,
          fontSize: 11.5,
          color: 'var(--sub)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye size={12} opacity={0.7} /> {item.views_count || item.views || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Heart size={12} opacity={0.7} /> {item.likes_count || item.likes || 0}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Add to Playlist Button (YouTube Standard) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToContainer && onAddToContainer(item);
              }}
              title="Add to Playlist"
              style={{
                background: 'var(--s2, rgba(255,255,255,0.05))',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              className="hover:border-blue-400 hover:text-blue-400 active:scale-95"
            >
              <FolderPlus size={13} />
              <span>Playlist</span>
            </button>

            {/* Unsave Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnsave && onUnsave(item.id, 'video');
              }}
              title="Remove from saved"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
              className="hover:text-red-400 active:scale-90"
              aria-label="Remove bookmark"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
