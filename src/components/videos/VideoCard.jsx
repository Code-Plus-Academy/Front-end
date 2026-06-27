// frontend/src/components/videos/VideoCard.jsx
// Compact card used in feeds, grids, and recommended lists.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';

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

export default function VideoCard({ video, horizontal = false }) {
  const navigate = useNavigate();
  const t = useT();
  const [hov, setHov] = useState(false);

  if (!video) return null;

  const color = categoryColor(video.category);

  // ── Horizontal layout (sidebar / recommended) ───────────────────────────
  if (horizontal) {
    return (
      <div
        onClick={() => navigate(`/videos/${video.id}`)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
          padding: '8px 10px', borderRadius: 10,
          background: hov ? t.bgHov : 'transparent',
          transition: 'background 0.18s',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', width: 130, height: 76, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt={video.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s' }} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${color}40,${color}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎬</div>
          }
          {/* Duration pill */}
          {video.duration_formatted && (
            <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.82)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace" }}>
              {video.duration_formatted}
            </span>
          )}
          {/* Category tag */}
          {video.category && (
            <span style={{ position: 'absolute', top: 4, left: 4, background: `${color}cc`, color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3, fontFamily: "'JetBrains Mono',monospace" }}>
              {video.category}
            </span>
          )}
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text, lineHeight: 1.4, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Outfit',sans-serif", wordBreak: 'break-word' }}>
            {video.title}
          </div>
          <div style={{ fontSize: 11, color: t.purple, fontWeight: 600, marginBottom: 2, fontFamily: "'Outfit',sans-serif" }}>
            {video.creator_name || video.creator_username}
          </div>
          <div style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>
            {video.views_formatted} views
          </div>
        </div>
      </div>
    );
  }

  // ── Vertical card layout (feed / grid) ─────────────────────────────────
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
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt={video.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.4s' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${color}30,${color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎬</div>
        }
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

        {/* Category badge */}
        {video.category && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: `${color}dd`, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em' }}>
            {video.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        {/* Creator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {video.creator_avatar
            ? <img src={video.creator_avatar} alt={video.creator_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${color}44` }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {(video.creator_name || 'U')[0].toUpperCase()}
              </div>
          }
          <span style={{ fontSize: 12, fontWeight: 600, color: t.purple, fontFamily: "'Outfit',sans-serif" }}>
            {video.creator_name || video.creator_username}
          </span>
        </div>

        {/* Title — clamped to 2 lines max */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1.45, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', fontFamily: "'Syne',sans-serif",
          wordBreak: 'break-word',
        }}>
          {video.title}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: t.muted }}>
          <span>{video.views_formatted} views</span>
          <span style={{ color: t.border }}>·</span>
          <span>♥ {video.likes_formatted}</span>
          {video.difficulty && (
            <>
              <span style={{ color: t.border }}>·</span>
              <span style={{ color: color, fontWeight: 700 }}>{video.difficulty}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
