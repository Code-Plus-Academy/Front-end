'use client';

import React from 'react';
import { Globe, Lock, Play, ArrowRight } from 'lucide-react';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';

const CONTAINER_META = {
  envelope: {
    label: 'LEARNING ENVELOPE',
    icon: EnvelopeIcon,
    accent: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7, #38BDF8)',
    defaultThumb: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600',
  },
  playlist: {
    label: 'VIDEO PLAYLIST',
    icon: PlaylistIcon,
    accent: 'var(--primary, #3B7CFF)',
    gradient: 'linear-gradient(135deg, #3B7CFF, #6366F1)',
    defaultThumb: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
  },
  packs: {
    label: 'STUDY PACK',
    icon: StudyPackIcon,
    accent: 'var(--green, #34C77B)',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    defaultThumb: '/notes-default-thumbnail.jpg',
  },
  study_pack: {
    label: 'STUDY PACK',
    icon: StudyPackIcon,
    accent: 'var(--green, #34C77B)',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    defaultThumb: '/notes-default-thumbnail.jpg',
  },
  collection: {
    label: 'COLLECTION',
    icon: CollectionIcon,
    accent: 'var(--accent-purple, #9333EA)',
    gradient: 'linear-gradient(135deg, #9333EA, #EC4899)',
    defaultThumb: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600',
  },
  vaults: {
    label: 'CODE VAULT',
    icon: VaultIcon,
    accent: 'var(--yellow, #F59E0B)',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    defaultThumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
  },
  snippet_notebook: {
    label: 'CODE VAULT',
    icon: VaultIcon,
    accent: 'var(--yellow, #F59E0B)',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    defaultThumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
  },
};

export default function ContainerCard({
  container,
  items = [],
  onClick,
  onPlayAll,
  fixedWidth = true,
}) {
  const meta = CONTAINER_META[container.container_type] || CONTAINER_META.collection;
  const Icon = meta.icon;
  const isPlaylist = container.container_type === 'playlist';

  const containerItems = items.filter(i => container.item_ids?.includes(i.id)) || [];
  const itemCount = container.item_count ?? containerItems.length;

  // Quad or Single Thumbnails
  const sampleThumbnails = containerItems.slice(0, 4).map(item => {
    if (item.thumbnail_url || item.thumbnail) return item.thumbnail_url || item.thumbnail;
    if (item.file_url && (item.file_url.match(/\.(png|jpe?g|webp|gif)$/i) || ['image', 'jpg', 'png', 'jpeg'].includes(item.file_type))) return item.file_url;
    return meta.defaultThumb;
  });

  while (sampleThumbnails.length < 4) {
    sampleThumbnails.push(container.custom_cover_url || meta.defaultThumb);
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md, 18px)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box',
        width: fixedWidth ? 'var(--container-card-width, clamp(210px, 60vw, 290px))' : '100%',
        maxWidth: 'calc(100vw - 40px)',
        flexShrink: fixedWidth ? 0 : 1,
      }}
      className="container-card-fluid group hover:border-purple-400 hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98]"
    >
      {/* ── Top Cover Image Section ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden', background: '#0a0e17' }}>
        {container.custom_cover_url ? (
          <img
            src={container.custom_cover_url}
            alt={container.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            width: '100%',
            height: '100%',
            gap: 1,
            background: 'var(--border)',
          }}>
            {sampleThumbnails.map((thumb, idx) => (
              <div key={idx} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#111827' }}>
                <img
                  src={thumb}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  className="group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Hover Play Trigger for Video Playlists */}
        {isPlaylist && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
            }}
            className="group-hover:opacity-100"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAll && onPlayAll(container);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 20,
                background: 'var(--primary, #3B7CFF)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                transition: 'all 0.15s ease',
              }}
              className="active:scale-95"
            >
              <Play size={14} fill="#fff" />
              <span>Play All</span>
            </button>
          </div>
        )}

        {/* Badges Overlay */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 9.5,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(15, 23, 42, 0.88)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            letterSpacing: '0.04em',
          }}>
            <Icon size={11} color={meta.accent} />
            <span>{meta.label}</span>
          </span>

          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(0,0,0,0.85)',
            color: '#ffffff',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* ── Card Content Body ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Header Row: Title & Privacy */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
            <h3 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--text)',
              lineHeight: 1.3,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }} className="group-hover:text-blue-400 transition-colors">
              {container.name}
            </h3>

            <span title={container.is_public ? 'Public' : 'Private'} style={{ color: 'var(--sub)', flexShrink: 0 }}>
              {container.is_public ? <Globe size={13} /> : <Lock size={13} />}
            </span>
          </div>

          <p style={{
            margin: 0,
            fontSize: 11.5,
            color: 'var(--sub)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {itemCount} Items Enclosed {container.description ? `• ${container.description}` : ''}
          </p>
        </div>

        {/* Footer Link */}
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
          <span style={{ color: container.color_token || meta.accent, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>Open {meta.label.toLowerCase()}</span>
            <ArrowRight size={13} />
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--dim)' }}>
            Updated recently
          </span>
        </div>
      </div>
    </div>
  );
}
