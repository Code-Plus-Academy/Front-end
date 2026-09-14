'use client';

import React from 'react';
import { Play, Lock, Globe, Folder, ArrowRight } from 'lucide-react';
import { PlaylistIcon, CollectionIcon, StudyPackIcon, EnvelopeIcon, VaultIcon } from '../icons/ContainerIcons';

export default function CompositeCoverCard({
  container,
  items = [],
  onClick,
  onPlayAll,
}) {
  const containerItems = items.filter(i => container.item_ids?.includes(i.id)) || [];
  const itemCount = container.item_count ?? containerItems.length;

  const defaultNoteThumb = '/notes-default-thumbnail.jpg';
  const defaultVideoThumb = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600';

  const sampleThumbnails = containerItems.slice(0, 4).map(item => {
    if (item.thumbnail_url || item.thumbnail) return item.thumbnail_url || item.thumbnail;
    if (item.file_url && (item.file_url.match(/\.(png|jpe?g|webp|gif)$/i) || ['image', 'jpg', 'png', 'jpeg'].includes(item.file_type))) return item.file_url;
    if (item.item_kind === 'video' || item.type === 'video') return defaultVideoThumb;
    return defaultNoteThumb;
  });

  while (sampleThumbnails.length < 4) {
    sampleThumbnails.push(container.custom_cover_url || (container.container_type === 'playlist' ? defaultVideoThumb : defaultNoteThumb));
  }

  const isPlaylist = container.container_type === 'playlist';

  const typeConfigMap = {
    playlist: { icon: PlaylistIcon, label: 'Video Playlist', color: 'var(--primary, #3B7CFF)' },
    collection: { icon: CollectionIcon, label: 'Social Collection', color: 'var(--accent-purple, #9333EA)' },
    envelope: { icon: EnvelopeIcon, label: 'Course Envelope', color: '#0284C7' },
    packs: { icon: StudyPackIcon, label: 'Study Pack', color: 'var(--green, #34C77B)' },
    study_pack: { icon: StudyPackIcon, label: 'Study Pack', color: 'var(--green, #34C77B)' },
    vaults: { icon: VaultIcon, label: 'Code Vault', color: 'var(--yellow, #F59E0B)' },
    snippet_notebook: { icon: VaultIcon, label: 'Code Vault', color: 'var(--yellow, #F59E0B)' },
  };

  const typeConfig = typeConfigMap[container.container_type] || { icon: Folder, label: 'Container', color: 'var(--primary)' };
  const TypeIcon = typeConfig.icon;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md, 16px)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box',
      }}
      className="group hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
    >
      {/* ── 4-Quadrant Composite Cover ── */}
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

        {/* Floating Play All Trigger for Video Playlists */}
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

        {/* Top Badges: Type & Item Count */}
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
            fontSize: 10,
            fontWeight: 700,
            padding: '2.5px 8px',
            borderRadius: 6,
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <TypeIcon size={12} color={typeConfig.color} />
            <span>{typeConfig.label}</span>
          </span>

          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2.5px 8px',
            borderRadius: 6,
            background: 'rgba(0,0,0,0.85)',
            color: '#ffffff',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* ── Title & Meta ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h3 style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.35,
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

        {container.description && (
          <p style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--sub)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {container.description}
          </p>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          marginTop: 4,
          fontSize: 11.5,
          color: 'var(--sub)',
        }}>
          <span style={{ color: container.color_token || typeConfig.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>Open {typeConfig.label}</span>
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
