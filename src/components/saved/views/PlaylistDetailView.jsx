'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Shuffle, Share2, Trash2, Lock, Globe, Clock, GripVertical, Plus, Check, MoreVertical } from 'lucide-react';
import SavedVideoCard from '../cards/SavedVideoCard';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m`;
  }
  return `${m}m ${s}s`;
}

export default function PlaylistDetailView({
  playlist,
  items = [],
  onBack,
  onPlayAll,
  onPlayItem,
  onRemoveItemFromPlaylist,
  onDeletePlaylist,
}) {
  const playlistItems = items.filter(i => playlist.item_ids?.includes(i.id)) || [];
  
  const totalSeconds = playlistItems.reduce((acc, item) => acc + (item.duration || item.duration_seconds || 180), 0);
  const totalDurationFormatted = formatDuration(totalSeconds);
  const heroThumb = playlistItems[0]?.thumbnail_url || playlistItems[0]?.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600';

  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'var(--sub)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 16,
          padding: 0,
        }}
        className="hover:text-cyan-400"
      >
        <ArrowLeft size={16} />
        <span>Back to All Saved</span>
      </button>

      {/* ── Dual Column YouTube Layout: Hero Sidebar on Left + Video Queue on Right ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* ── Left Hero Card (YouTube Playlist Sidebar) ── */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(59, 124, 255, 0.12) 0%, var(--surface) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md, 18px)',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'sticky',
          top: 20,
        }}>
          {/* Cover Snapshot with Overlay */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#0a0e17',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <img
              src={heroThumb}
              alt={playlist.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              fontSize: 11.5,
              fontWeight: 700,
            }}>
              <span>🎬 Playlist</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{playlistItems.length} videos</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(59, 124, 255, 0.2)',
              color: 'var(--primary, #3B7CFF)',
              textTransform: 'uppercase',
            }}>
              Video Playlist
            </span>
            <span style={{ fontSize: 11, color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {playlist.is_public ? <Globe size={12} /> : <Lock size={12} />}
              <span>{playlist.is_public ? 'Public' : 'Private'}</span>
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontWeight: 800,
            color: 'var(--text)',
            margin: '0 0 8px',
            lineHeight: 1.3,
          }}>
            {playlist.name}
          </h1>

          {playlist.description && (
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--sub)', lineHeight: 1.5 }}>
              {playlist.description}
            </p>
          )}

          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 14px',
            background: 'var(--s2)',
            borderRadius: 10,
            border: '1px solid var(--border)',
            marginBottom: 18,
            fontSize: 12,
            color: 'var(--sub)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color="var(--primary)" /> Total: <strong>{totalDurationFormatted}</strong>
            </span>
            <span>•</span>
            <span><strong>{playlistItems.length}</strong> videos</span>
          </div>

          {/* YouTube Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              disabled={playlistItems.length === 0}
              onClick={() => onPlayAll && onPlayAll(playlist)}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 24,
                background: 'var(--primary, #3B7CFF)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13.5,
                border: 'none',
                cursor: playlistItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(59, 124, 255, 0.4)',
                opacity: playlistItems.length === 0 ? 0.5 : 1,
              }}
            >
              <Play size={16} fill="#fff" />
              <span>Play All Sequential</span>
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'var(--s2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Share2 size={14} />
                <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={() => onDeletePlaylist && onDeletePlaylist(playlist.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'var(--s2)',
                  border: '1px solid var(--border)',
                  color: 'var(--danger)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                title="Delete Playlist"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Numbered Video List Rows (YouTube Queue Style) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              Playlist Queue ({playlistItems.length})
            </span>
          </div>

          {playlistItems.length === 0 ? (
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px dashed var(--border)',
              borderRadius: 14,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
                This playlist is empty
              </h3>
              <p style={{ fontSize: 13, color: 'var(--sub)', margin: '0 0 16px' }}>
                Save videos or dev shorts to this playlist to build your continuous watch queue.
              </p>
            </div>
          ) : (
            playlistItems.map((video, index) => {
              const videoThumb = video.thumbnail_url || video.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600';
              const duration = formatDuration(video.duration || video.duration_seconds || 180);

              return (
                <div
                  key={video.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  className="group hover:border-blue-500/40"
                >
                  {/* Number Index */}
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--sub)',
                    width: 22,
                    textAlign: 'center',
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </span>

                  {/* Thumbnail with Play Trigger */}
                  <div
                    onClick={() => onPlayItem && onPlayItem(video, playlist)}
                    style={{
                      position: 'relative',
                      width: 96,
                      aspectRatio: '16/9',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#0a0e17',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={videoThumb}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }} className="group-hover:opacity-100">
                      <Play size={16} fill="#fff" color="#fff" />
                    </div>
                    <span style={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.85)',
                      color: '#fff',
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 3,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {duration}
                    </span>
                  </div>

                  {/* Video Details */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4
                      onClick={() => onPlayItem && onPlayItem(video, playlist)}
                      style={{
                        margin: '0 0 3px',
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text)',
                        lineHeight: 1.35,
                        cursor: 'pointer',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      className="hover:text-blue-400"
                    >
                      {video.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'var(--sub)' }}>
                      {video.creator_name || video.author_name || 'Code+ Creator'}
                    </p>
                  </div>

                  {/* Remove from playlist action */}
                  <button
                    type="button"
                    onClick={() => onRemoveItemFromPlaylist && onRemoveItemFromPlaylist(playlist.id, video.id)}
                    title="Remove from playlist"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--sub)',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                    className="hover:text-red-400"
                    aria-label="Remove video"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
