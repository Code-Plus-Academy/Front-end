// frontend/src/components/videos/VideoCard.jsx
// Compact card used in feeds, grids, and recommended lists.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import LazyImage from '../common/LazyImage';
import CardActionMenu from '../ui/CardActionMenu';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg:       isDark ? D.card        : L.surface,
    bgHov:    isDark ? D.cardHover   : '#F5F5FA',
    border:   isDark ? D.cardBorder  : 'rgba(0,0,0,0.08)',
    text:     base.txt,
    sub:      base.txt2,
    muted:    base.txt3,
    purple:   base.accent,
    purpleDim:isDark ? 'rgba(138,43,255,0.18)' : 'rgba(110,0,255,0.10)',
    shadow:   isDark ? '0 4px 20px rgba(0,0,0,0.45)' : '0 2px 12px rgba(0,0,0,0.08)',
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

export default function VideoCard({ video, horizontal = false }) {
  const navigate = useNavigate();
  const t = useT();
  const [hov, setHov] = useState(false);

  if (!video) return null;

  const color = categoryColor(video.category);
  const isCreatorVerified = video.creator_verified || video.creator_username === 'cpaadmin';

  // ── Horizontal layout (mobile search list / sidebar) ───────────────────────────
  if (horizontal) {
    return (
      <div
        onClick={() => navigate(`/videos/${video.id}`)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
          padding: '12px 4px',
          borderBottom: `1px solid ${t.border}`,
          borderRadius: 8,
          background: hov ? t.bgHov : 'transparent',
          transition: 'background 0.18s',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', width: 140, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#0a0a0a' }}>
          <LazyImage 
            src={video.thumbnail_url} 
            alt={video.title}
            responsive={true}
            skeletonColor={`${color}20`}
            fallbackIcon="🎬"
            fallbackBackground={`linear-gradient(135deg,${color}40,${color}20)`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s' }}
          />
          {/* Duration pill */}
          {video.duration_formatted && (
            <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.82)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace" }}>
              {video.duration_formatted}
            </span>
          )}
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.text, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Geist',sans-serif", wordBreak: 'break-word' }}>
            {video.title}
          </div>
          <div style={{ fontSize: 12, color: t.purple, fontWeight: 600, fontFamily: "'Geist',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
            {video.creator_name || video.creator_username}
            {isCreatorVerified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>
            {video.views_formatted || `${video.views || 0} views`} {video.created_at ? `• ${timeAgo(video.created_at)}` : ''}
          </div>
        </div>

        {/* Three-dot action menu */}
        <div onClick={e => e.stopPropagation()}>
          <CardActionMenu
            contentId={video.id}
            contentType="video"
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/videos/${video.id}` : undefined}
            triggerSize={18}
            sourceSurface="video_feed"
          />
        </div>
      </div>
    );
  }

  // ── Vertical card layout (desktop search list / grid) ─────────────────────────────────
  return (
    <div
      onClick={() => navigate(`/videos/${video.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: t.bg,
        border: `1px solid ${hov ? color + '44' : t.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? t.shadow : 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#0a0a0a' }}>
        <LazyImage
          src={video.thumbnail_url}
          alt={video.title}
          responsive={true}
          skeletonColor={`${color}15`}
          fallbackIcon="🎬"
          fallbackBackground={`linear-gradient(135deg,${color}30,${color}10)`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s' }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 50%)' }} />

        {/* Play button */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%,-50%) scale(${hov ? 1.1 : 0.9})`,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hov ? 1 : 0, transition: 'all 0.2s',
          border: '1.5px solid rgba(255,255,255,0.3)',
        }}>
          <span style={{ fontSize: 14, color: '#fff', marginLeft: 2 }}>▶</span>
        </div>

        {/* Duration */}
        {video.duration_formatted && (
          <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.82)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, fontFamily: "'JetBrains Mono',monospace" }}>
            {video.duration_formatted}
          </span>
        )}

      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', position: 'relative' }}>
        {/* Creator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${color}44`, flexShrink: 0 }}>
            <LazyImage
              src={video.creator_avatar}
              alt={video.creator_name}
              responsive={true}
              sizes="28px"
              skeletonColor={color + '30'}
              fallbackIcon={(video.creator_name || 'U')[0].toUpperCase()}
              fallbackBackground={color}
              style={{ width: '100%', height: '100%', fontSize: 11, fontWeight: 700, color: '#fff' }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.purple, fontFamily: "'Geist',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
            {video.creator_name || video.creator_username}
            {isCreatorVerified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block' }}>
                <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {(() => {
              const s = (video?.moderation_status || video?.status || '').toLowerCase();
              if (s === 'under_review') return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>UNDER REVIEW</span>;
              if (s === 'removed') return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>REMOVED</span>;
              return null;
            })()}
          </span>
        </div>

        {/* Title — clamped to 2 lines max */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1.45, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', fontFamily: "'Clash Display',sans-serif",
          wordBreak: 'break-word',
        }}>
          {video.title}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: t.muted }}>
          <span>{video.views_formatted || `${video.views || 0} views`}</span>
          {video.created_at && (
            <>
              <span style={{ color: t.border }}>·</span>
              <span>{timeAgo(video.created_at)}</span>
            </>
          )}
          <span style={{ color: t.border }}>·</span>
          <span>♥ {video.likes_formatted || video.likes_count || 0}</span>
        </div>

        {/* Three-dot action menu */}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }} onClick={e => e.stopPropagation()}>
          <CardActionMenu
            contentId={video.id}
            contentType="video"
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/videos/${video.id}` : undefined}
            triggerSize={18}
            sourceSurface="video_feed"
          />
        </div>
      </div>
    </div>
  );
}
