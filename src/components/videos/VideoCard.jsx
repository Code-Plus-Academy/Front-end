// frontend/src/components/videos/VideoCard.jsx
// Clean YouTube-style video card with full 16:9 thumbnail, duration badge, channel avatar, title, and views metadata.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import ContentActionMenu from '../ui/ContentActionMenu';
import LazyImage from '../common/LazyImage';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg:           isDark ? D.card         : '#FFFFFF',
    bgHov:        isDark ? D.cardHover    : '#FAFAFC',
    border:       isDark ? D.cardBorder   : '#E5E7EB',
    divider:      isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    text:         base.txt,
    channelName:  isDark ? '#F9FAFB'      : '#000000',
    videoTitle:   isDark ? '#F3F4F6'      : '#000000',
    meta:         isDark ? '#9CA3AF'      : '#6B7280',
    avatarBg:     '#4338CA',
    purple:       base.accent,
    purpleDim:    isDark ? 'rgba(138,43,255,0.18)' : 'rgba(110,0,255,0.10)',
    shadow:       isDark ? '0 4px 20px rgba(0,0,0,0.45)' : '0 2px 12px rgba(0,0,0,0.06)',
    shadowHov:    isDark ? '0 8px 30px rgba(0,0,0,0.6)'  : '0 8px 24px rgba(0,0,0,0.1)',
  };
}

const CATEGORY_COLORS = {
  'AI & ML':        '#8A2BFF',
  'Web Dev':        '#0891B2',
  'Blockchain':     '#F59E0B',
  'Cybersecurity':  '#EF4444',
  'System Design':  '#10B981',
  'GATE CS':        '#3B82F6',
  'AI Agents':      '#7C3AED',
  'Flutter':        '#06B6D4',
};

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#8A2BFF';
}

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

function fmtCount(n) {
  if (!n) return '0';
  const num = Number(n);
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export default function VideoCard({ video, horizontal = false }) {
  const navigate = useNavigate();
  const t = useT();
  const [hov, setHov] = useState(false);

  if (!video) return null;

  const color = categoryColor(video.category);
  const isCreatorVerified = video.creator_verified || video.creator_username === 'cpaadmin';

  const rawTitle = video.title || 'Untitled Video';
  const creatorName = video.creator_name || video.creator_username || 'Code+ Creator';
  const creatorAvatar = video.creator_avatar || video.creator_avatar_url;
  const duration = video.duration_formatted || (video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : null);
  const views = video.views_formatted || `${fmtCount(video.views)} views`;
  const time = timeAgo(video.created_at || video.published_at);

  // ── Horizontal layout (search list / sidebar) ───────────────────────────
  if (horizontal) {
    return (
      <div
        onClick={() => navigate(`/videos/${video.id}`)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex',
          gap: 'clamp(10px, 1.2vw, 14px)',
          alignItems: 'flex-start',
          cursor: 'pointer',
          padding: '12px 14px',
          border: `1px solid ${hov ? t.purple + '44' : t.border}`,
          borderRadius: 14,
          background: hov ? t.bgHov : t.bg,
          boxShadow: hov ? t.shadow : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', width: 140, aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#0a0a0a' }}>
          <LazyImage 
            src={video.thumbnail_url} 
            alt={rawTitle}
            responsive={true}
            skeletonColor={`${color}20`}
            fallbackIcon="🎬"
            fallbackBackground={`linear-gradient(135deg,${color}40,${color}20)`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s' }}
          />
          {duration && (
            <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono','Roboto Mono',monospace" }}>
              {duration}
            </span>
          )}
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: t.channelName,
            fontFamily: "'Roboto', 'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>{creatorName}</span>
            {isCreatorVerified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.videoTitle, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Roboto','Inter',sans-serif", wordBreak: 'break-word' }}>
            {rawTitle}
          </div>
          <div style={{ fontSize: 11, color: t.meta, fontFamily: "'Inter',sans-serif", marginTop: 2 }}>
            {views} {time ? `• ${time}` : ''}
          </div>
        </div>

        {/* Three-dot action menu */}
        <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
          <ContentActionMenu
            contentId={video.id}
            contentType={video.content_type === 'short' || video.is_short ? 'short' : 'video'}
            contentAuthorId={video.user_id || video.creator_id}
            creatorUsername={video.creator_username}
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/videos/${video.id}` : undefined}
            triggerSize={18}
            sourceSurface="video_feed"
          />
        </div>
      </div>
    );
  }

  // ── Vertical card layout (Explorer page & feeds matching reference image) ─────────────────
  return (
    <div
      onClick={() => navigate(`/videos/${video.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.bg,
        border: `1px solid ${hov ? color + '44' : t.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? t.shadowHov : t.shadow,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {/* ── TOP SECTION (16:9 Video Thumbnail with Duration Badge) ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}>
        <LazyImage
          src={video.thumbnail_url}
          alt={rawTitle}
          responsive={true}
          skeletonColor={`${color}15`}
          fallbackIcon="🎬"
          fallbackBackground={`linear-gradient(135deg,${color}30,${color}10)`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: hov ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
        />

        {/* Duration Badge overlay */}
        {duration && (
          <span style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0,0,0,0.85)',
            color: '#ffffff',
            fontSize: 'clamp(9px, 0.8vw, 11px)',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: "'JetBrains Mono','Roboto Mono',monospace",
            letterSpacing: '0.02em',
          }}>
            {duration}
          </span>
        )}
      </div>

      {/* ── HORIZONTAL DIVIDER ── */}
      <div style={{ width: '100%', height: 1, background: t.divider }} />

      {/* ── BOTTOM SECTION (Avatar, Channel Name, Title & Views) ── */}
      <div style={{
        padding: '14px clamp(12px, 1.4vw, 16px) 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        {/* Channel Avatar */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: t.avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          border: `1.5px solid ${t.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          {creatorAvatar ? (
            <LazyImage
              src={creatorAvatar}
              alt={creatorName}
              responsive={true}
              sizes="38px"
              fallbackIcon={(creatorName[0] || 'A').toUpperCase()}
              fallbackBackground={t.avatarBg}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              fontFamily: "'Roboto', 'Inter', sans-serif",
              fontSize: 17,
              fontWeight: 800,
              color: '#ffffff',
            }}>
              {(creatorName[0] || 'A').toUpperCase()}
            </span>
          )}
        </div>

        {/* Channel Name, Video Title, and Views */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Channel Name */}
          <div style={{
            fontSize: 'clamp(0.88rem, 1.1vw, 0.98rem)',
            fontWeight: 700,
            color: t.channelName,
            fontFamily: "'Roboto', 'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>{creatorName}</span>
            {isCreatorVerified && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* Video Title */}
          <div style={{
            fontSize: 'clamp(0.88rem, 1.05vw, 0.95rem)',
            fontWeight: 700,
            color: t.videoTitle,
            fontFamily: "'Roboto', 'Inter', sans-serif",
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            marginTop: 2,
            marginBottom: 2,
          }}>
            {rawTitle}
          </div>

          {/* Views • time ago */}
          <div style={{
            fontSize: 'clamp(0.75rem, 0.95vw, 0.85rem)',
            color: t.meta,
            fontFamily: "'Inter', sans-serif",
            marginTop: 2,
          }}>
            {views} {time ? `• ${time}` : ''}
          </div>
        </div>

        {/* Three-dot Action Menu */}
        <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
          <ContentActionMenu
            contentId={video.id}
            contentType={video.content_type === 'short' || video.is_short ? 'short' : 'video'}
            contentAuthorId={video.user_id || video.creator_id}
            creatorUsername={video.creator_username}
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/videos/${video.id}` : undefined}
            triggerSize={18}
            sourceSurface="video_feed"
          />
        </div>
      </div>
    </div>
  );
}
