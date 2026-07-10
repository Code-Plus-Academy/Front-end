// frontend/src/pages/VideoDetailPage.jsx
// Full video watch page — cinematic layout, learning UX, comments, recommended.
// FIXES:
//   1. Smart video player: YouTube/Instagram/Vimeo iframe embeds + direct <video>
//   2. Title clamped at 2 lines on mobile, no overflow
//   3. Platform origin badge (YouTube, Instagram, etc.) in description card
//   4. Original Creator Card shows external creator details with proper copyright notice

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DARK as D, LIGHT as L } from '../styles/tokens';
import api from '../api/axios';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import VideoComments from '../components/videos/VideoComments';
import RecommendedVideos from '../components/videos/RecommendedVideos';
// FIX 1: import shared embed helpers — no local copies needed
import { detectPlatform, getEmbedUrl, isDirectVideo } from '../utils/videoEmbed';

// ── Design tokens ──────────────────────────────────────────────────────────────
function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg:        isDark ? '#080a0e'      : '#F4F5F7',
    surface:   isDark ? D.card        : L.surface,
    s2:        isDark ? '#141720'      : '#ECEEF2',
    border:    isDark ? D.cardBorder   : 'rgba(0,0,0,0.08)',
    text:      base.txt,
    sub:       base.txt2,
    muted:     base.txt3,
    purple:    base.accent,
    purpleDim: isDark ? 'rgba(138,43,255,0.18)' : 'rgba(110,0,255,0.10)',
    teal:      '#00B4D8',
    tealDim:   'rgba(0,180,216,0.15)',
    gradient:  'linear-gradient(135deg,#00B4D8,#9333EA)',
    shadow:    isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.12)',
    inputBg:   isDark ? 'rgba(255,255,255,0.04)' : '#F0F1F4',
    inputBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 60)    return `${m}m ago`;
  if (m < 1440)  return `${Math.floor(m / 60)}h ago`;
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 900);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    const h = (e) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

const DIFFICULTY_COLORS = { beginner: '#22C55E', intermediate: '#F59E0B', advanced: '#EF4444' };
const CATEGORY_COLORS   = {
  'AI & ML': '#8A2BFF', 'Web Dev': '#0891B2', 'Blockchain': '#F59E0B',
  'Cybersecurity': '#EF4444', 'System Design': '#10B981', 'GATE CS': '#3B82F6',
};
function catColor(cat) { return CATEGORY_COLORS[cat] || '#8A2BFF'; }

// ── Platform helpers ───────────────────────────────────────────────────────────
// detectPlatform, getEmbedUrl, isDirectVideo are now imported from utils/videoEmbed.

const PLATFORM_META = {
  youtube:   { label: 'YouTube',   color: '#FF0000', icon: '▶', bg: '#FF000018' },
  instagram: { label: 'Instagram', color: '#E1306C', icon: '◈', bg: '#E1306C18' },
  twitter:   { label: 'X / Twitter', color: '#1DA1F2', icon: '✕', bg: '#1DA1F218' },
  vimeo:     { label: 'Vimeo',     color: '#1AB7EA', icon: '●', bg: '#1AB7EA18' },
  tiktok:    { label: 'TikTok',    color: '#010101', icon: '♪', bg: '#69C9D018' },
  direct:    { label: 'Direct',    color: '#22C55E', icon: '▶', bg: '#22C55E18' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#00B4D8,#9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

// ── Native HLS <video> (with controls) for watch-page playback ────────────────
// Used when video_url is an .m3u8 manifest (e.g. converted Instagram → S3/CloudFront).
function HLSVideo({ src, poster, onError }) {
  const vidRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const videoEl = vidRef.current;
    if (!videoEl || !src) return;
    let hls = null;
    let cancelled = false;

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari / iOS — native HLS support
      videoEl.src = src;
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls({ maxBufferLength: 30 });
          hls.loadSource(src);
          hls.attachMedia(videoEl);
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data?.fatal) onError?.();
          });
          hlsRef.current = hls;
        } else {
          onError?.();
        }
      });
    }

    return () => {
      cancelled = true;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [src]);

  return (
    <video
      ref={vidRef}
      poster={poster || undefined}
      controls
      preload="metadata"
      onError={() => onError?.()}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
    />
  );
}

// ── Smart Video Player ─────────────────────────────────────────────────────────
// Contract: video_url is the single source of truth for playback.
//   - YouTube link in video_url        → YouTube iframe embed
//   - .m3u8 in video_url (HLS, incl.
//     converted Instagram → S3/CDN)    → HLSVideo (native controls)
//   - .mp4/.webm/etc in video_url      → plain <video>
//   - no playable video_url            → "watch on original platform" fallback
function VideoPlayer({ video, t, isMobile }) {
  const [playerError, setPlayerError] = useState(false);
  const color = catColor(video.category);
  const videoUrl = video.video_url;
  const platform = video.source_platform || detectPlatform(videoUrl || video.source_url);
  const platformMeta = PLATFORM_META[platform] || null;

  const isYouTube = videoUrl && /youtu\.be|youtube\.com/i.test(videoUrl);
  const isHlsUrl  = videoUrl && /\.m3u8(\?|$)/i.test(videoUrl);
  const isDirect  = videoUrl && isDirectVideo(videoUrl) && !isHlsUrl;

  const embedUrl = isYouTube ? getEmbedUrl({ ...video, source_platform: 'youtube', source_url: videoUrl }) : null;

  const containerStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '100vw',
    aspectRatio: '16/9',
    background: '#000',
    borderRadius: isMobile ? 0 : 16,
    overflow: 'hidden',
    boxShadow: isMobile ? 'none' : `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${t.border}`,
  };

  // 1) YouTube — embed
  if (embedUrl && !playerError) {
    return (
      <div style={containerStyle}>
        <iframe
          src={embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setPlayerError(true)}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
        {/* Platform badge */}
        {platformMeta && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: `rgba(0,0,0,0.75)`, backdropFilter: 'blur(6px)',
            color: platformMeta.color, fontSize: 10, fontWeight: 800,
            padding: '4px 10px', borderRadius: 6,
            fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 5,
            border: `1px solid ${platformMeta.color}44`,
          }}>
            <span>{platformMeta.icon}</span>
            <span>{platformMeta.label}</span>
          </div>
        )}
      </div>
    );
  }

  // 2) HLS manifest — native player w/ hls.js (converted Instagram/S3 videos land here)
  if (isHlsUrl && !playerError) {
    return (
      <div style={containerStyle}>
        <HLSVideo src={videoUrl} poster={video.thumbnail_url} onError={() => setPlayerError(true)} />
        {video.category && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: `${color}dd`, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em', backdropFilter: 'blur(4px)' }}>
            {video.category}
          </div>
        )}
        {video.duration_formatted && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.82)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontFamily: "'JetBrains Mono',monospace" }}>
            {video.duration_formatted}
          </div>
        )}
      </div>
    );
  }

  // 3) Direct video file
  if (isDirect && !playerError) {
    return (
      <div style={containerStyle}>
        <video
          src={videoUrl}
          poster={video.thumbnail_url || undefined}
          controls
          preload="metadata"
          onError={() => setPlayerError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {video.category && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: `${color}dd`, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em', backdropFilter: 'blur(4px)' }}>
            {video.category}
          </div>
        )}
        {video.duration_formatted && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.82)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontFamily: "'JetBrains Mono',monospace" }}>
            {video.duration_formatted}
          </div>
        )}
      </div>
    );
  }

  // 4) No playable video_url yet (still processing) or player error — fallback link
  const sourceUrl = videoUrl || video.source_url;
  const isNonEmbeddable = true;

  return (
    <div style={containerStyle}>
      {/* Thumbnail or gradient bg */}
      {video.thumbnail_url
        ? <img
            src={video.thumbnail_url}
            alt={video.title}
            loading="eager"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${color}30,${color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🎬</div>
      }
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 60%,transparent 100%)' }} />

      {/* Center message */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
        {isNonEmbeddable && sourceUrl ? (
          <>
            {platformMeta && (
              <div style={{ fontSize: 32, color: platformMeta.color }}>{platformMeta.icon}</div>
            )}
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: "'Outfit',sans-serif", maxWidth: 280, lineHeight: 1.5 }}>
              This video is hosted on {platformMeta?.label || 'an external platform'}.
            </div>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: platformMeta?.color || t.purple,
                color: '#fff', textDecoration: 'none',
                padding: '10px 22px', borderRadius: 99,
                fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700,
                boxShadow: `0 4px 20px ${platformMeta?.color || t.purple}44`,
              }}
            >
              Watch on {platformMeta?.label || 'Platform'}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40 }}>🎬</div>
            <div style={{ color: '#fff', opacity: 0.75, fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>
              Preview not available
            </div>
          </>
        )}
      </div>

      {/* Category badge */}
      {video.category && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: `${color}dd`, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em', backdropFilter: 'blur(4px)' }}>
          {video.category}
        </div>
      )}
    </div>
  );
}

// ── Platform Origin Badge ──────────────────────────────────────────────────────
function PlatformBadge({ platform, sourceUrl }) {
  if (!platform || platform === 'direct') return null;
  const meta = PLATFORM_META[platform];
  if (!meta) return null;

  return (
    <a
      href={sourceUrl || '#'}
      target={sourceUrl ? '_blank' : undefined}
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 12px', borderRadius: 99,
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.color}44`,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
        textDecoration: 'none',
        cursor: sourceUrl ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 12 }}>{meta.icon}</span>
      <span>{meta.label.toUpperCase()}</span>
      {sourceUrl && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
        </svg>
      )}
    </a>
  );
}

// ── Action Bar ─────────────────────────────────────────────────────────────────
function ActionBar({ video, t, user, onLike, onSave, onComment }) {
  const [copied, setCopied] = useState(false);

  const share = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const btns = [
    {
      key: 'like',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={video.viewer_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
          <path d="M7 22V11M2 13v7a2 2 0 002 2h13.4a2 2 0 001.96-1.6l1.44-6a2 2 0 00-1.96-2.4H15V6a3 3 0 00-3-3 1 1 0 00-1 1v.5L7.5 11" />
        </svg>
      ),
      label: video.likes_formatted || '0',
      active: video.viewer_liked,
      onClick: onLike,
      color: t.purple,
    },
    {
      key: 'comment',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      label: video.comments_count > 0 ? String(video.comments_count) : 'Comment',
      active: false,
      onClick: onComment,
      color: t.teal,
    },
    {
      key: 'share',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      ),
      label: copied ? 'Copied!' : 'Share',
      active: copied,
      onClick: share,
      color: '#22C55E',
    },
    {
      key: 'save',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill={video.viewer_saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      ),
      label: video.viewer_saved ? 'Saved' : 'Save',
      active: video.viewer_saved,
      onClick: onSave,
      color: '#F59E0B',
    },
  ];

  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
      paddingBottom: 2, WebkitOverflowScrolling: 'touch',
    }}>
      {btns.map(b => (
        <button
          key={b.key}
          onClick={b.onClick}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 99,
            background: b.active ? `${b.color}22` : t.s2,
            border: `1px solid ${b.active ? b.color + '55' : t.border}`,
            color: b.active ? b.color : t.sub,
            cursor: user ? 'pointer' : 'default',
            fontSize: 13, fontWeight: 600,
            fontFamily: "'Outfit',sans-serif",
            transition: 'all 0.18s',
            boxShadow: b.active ? `0 0 12px ${b.color}30` : 'none',
          }}
          onMouseEnter={e => { if (user) { e.currentTarget.style.borderColor = b.color + '88'; e.currentTarget.style.color = b.color; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = b.active ? b.color + '55' : t.border; e.currentTarget.style.color = b.active ? b.color : t.sub; }}
        >
          {b.icon}
          <span>{b.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── CPA Creator Card (the person who curated/shared it on CPA) ────────────────
function CPACreatorCard({ video, t, user }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderTop: `2px solid ${t.purple}`,
      borderRadius: 14,
      marginTop: 4,
    }}>
      <div onClick={() => navigate(`/u/${video.creator_username}`)} style={{ cursor: 'pointer' }}>
        <Avatar src={video.creator_avatar} name={video.creator_name} size={46} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span
            onClick={() => navigate(`/u/${video.creator_username}`)}
            style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: t.text, cursor: 'pointer' }}
          >
            {video.creator_name || video.creator_username}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={t.teal} />
            <path d="M6.5 12.5l3.5 3.5 7.5-7.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {video.creator_followers > 0 && (
          <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em' }}>
            {video.creator_followers >= 1000
              ? `${(video.creator_followers / 1000).toFixed(1)}K`
              : video.creator_followers} followers
          </div>
        )}
        {video.creator_bio && (
          <div style={{ fontSize: 12, color: t.sub, marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Outfit',sans-serif" }}>
            {video.creator_bio}
          </div>
        )}
      </div>
      {user && user.username !== video.creator_username && (
        <button
          onClick={() => setFollowing(p => !p)}
          style={{
            flexShrink: 0,
            padding: '9px 20px', borderRadius: 99, border: 'none', cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700,
            background: following ? t.s2 : t.gradient,
            color: following ? t.sub : '#fff',
            transition: 'all 0.18s',
            boxShadow: following ? 'none' : '0 0 16px rgba(0,180,216,0.25)',
          }}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}

// ── Original Creator Card (copyright-safe external creator info) ───────────────
function OriginalCreatorCard({ video, t }) {
  const platform = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const hasOriginalCreator = video.original_creator_name || video.original_creator_handle;
  const meta = PLATFORM_META[platform] || null;

  if (!hasOriginalCreator && (!platform || platform === 'direct')) return null;

  const creatorName    = video.original_creator_name   || video.original_creator_handle || 'Original Creator';
  const creatorHandle  = video.original_creator_handle;
  const creatorUrl     = video.original_creator_url    || video.source_url;
  const platformLabel  = meta?.label || 'External Platform';
  const platformColor  = meta?.color || t.purple;
  const platformIcon   = meta?.icon  || '▶';

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderLeft: `3px solid ${platformColor}`,
      borderRadius: 14,
      padding: '16px 18px',
      marginTop: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: platformColor }}>{platformIcon}</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: t.text }}>
          Original Creator
        </span>
        {meta && (
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
            background: meta.bg, color: platformColor,
            border: `1px solid ${platformColor}44`,
            fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em',
          }}>
            {platformLabel.toUpperCase()}
          </span>
        )}
      </div>

      {/* Creator row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: meta?.bg || t.s2,
          border: `2px solid ${platformColor}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: platformColor,
        }}>
          {platformIcon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: t.text, marginBottom: 2 }}>
            {creatorName}
          </div>
          {creatorHandle && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: platformColor, marginBottom: 2 }}>
              @{creatorHandle.replace(/^@/, '')}
            </div>
          )}
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: t.muted, lineHeight: 1.5 }}>
            This content is originally published on {platformLabel} and belongs to the creator above.
          </div>
        </div>

        {creatorUrl && (
          <a
            href={creatorUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 99,
              background: meta?.bg || t.s2,
              color: platformColor,
              border: `1px solid ${platformColor}55`,
              fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
              textDecoration: 'none', transition: 'all 0.18s',
            }}
          >
            View
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        )}
      </div>

      {/* Copyright notice */}
      <div style={{
        marginTop: 12, padding: '8px 12px',
        background: t.s2, borderRadius: 8,
        fontFamily: "'Outfit',sans-serif", fontSize: 11, color: t.muted,
        lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <span style={{ flexShrink: 0 }}>©️</span>
        <span>
          All intellectual property rights for this content belong to the original creator and {platformLabel}.
          CodePlus Academy shares this for educational purposes only. If you are the copyright owner and wish to have this removed, please contact us.
        </span>
      </div>
    </div>
  );
}

// ── Description Card ───────────────────────────────────────────────────────────
function DescriptionCard({ video, t }) {
  const [expanded, setExpanded] = useState(false);
  const color = catColor(video.category);
  const platform = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const sourceUrl = video.source_url || null;

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: '16px 18px', marginTop: 4,
    }}>
      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        {video.views_formatted && (
          <span style={{ fontSize: 12, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>
            👁 {video.views_formatted} views
          </span>
        )}
        {video.created_at && (
          <span style={{ fontSize: 12, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>
            · {timeAgo(video.created_at)}
          </span>
        )}
        {video.difficulty && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: `${DIFFICULTY_COLORS[video.difficulty]}22`,
            color: DIFFICULTY_COLORS[video.difficulty],
            border: `1px solid ${DIFFICULTY_COLORS[video.difficulty]}44`,
            fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em',
          }}>
            {video.difficulty.toUpperCase()}
          </span>
        )}
        {video.language && video.language !== 'English' && (
          <span style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>🌐 {video.language}</span>
        )}
        {/* Platform origin badge */}
        <PlatformBadge platform={platform} sourceUrl={sourceUrl} />
      </div>

      {/* Description text */}
      {video.description && (
        <>
          <div style={{
            fontSize: 14, color: t.sub, lineHeight: 1.7,
            maxHeight: expanded ? 'none' : '4.8em',
            overflow: 'hidden',
            fontFamily: "'Outfit',sans-serif",
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {video.description}
          </div>
          {video.description.length > 200 && (
            <button onClick={() => setExpanded(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.purple, fontSize: 13, fontWeight: 600, marginTop: 6, fontFamily: "'Outfit',sans-serif", padding: 0 }}>
              {expanded ? 'Show less ▲' : 'Show more ▼'}
            </button>
          )}
        </>
      )}

      {/* Tags */}
      {video.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {video.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 99,
              background: `${color}14`, color, border: `1px solid ${color}30`,
              fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Learning Outcomes Card ─────────────────────────────────────────────────────
function LearningOutcomesCard({ outcomes, difficulty, t }) {
  if (!outcomes?.length) return null;
  const color = DIFFICULTY_COLORS[difficulty] || t.purple;

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 14, padding: '16px 18px', marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>🎯</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: t.text }}>
          What You'll Learn
        </span>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
          background: `${color}22`, color,
          border: `1px solid ${color}44`,
          fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.05em',
        }}>
          {difficulty?.toUpperCase()}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
        {outcomes.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: t.s2, borderRadius: 10, padding: '10px 12px',
            border: `1px solid ${t.border}`,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{item.icon || '✦'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 2, fontFamily: "'Outfit',sans-serif" }}>{item.label}</div>
              {item.desc && <div style={{ fontSize: 11, color: t.sub, lineHeight: 1.5, fontFamily: "'Outfit',sans-serif" }}>{item.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Resource Attachments ───────────────────────────────────────────────────────
const RESOURCE_ICONS = { github: '🐙', pdf: '📄', docs: '📚', code: '💻', notes: '📝', ppt: '📊', link: '🔗' };

function ResourceAttachments({ links, t }) {
  if (!links?.length) return null;

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: '16px 18px', marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>📦</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: t.text }}>
          Resources & Attachments
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10,
              background: t.s2, border: `1px solid ${t.border}`,
              textDecoration: 'none', transition: 'all 0.18s',
              color: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.purple + '66'; e.currentTarget.style.background = t.purpleDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.s2; }}
          >
            <span style={{ fontSize: 18 }}>{RESOURCE_ICONS[r.type] || '🔗'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text, fontFamily: "'Outfit',sans-serif" }}>{r.label}</div>
              {r.url && <div style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2.2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function PageSkeleton({ t, isMobile }) {
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '64px 0 80px' : '80px 0 40px' }}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: isMobile ? 0 : 16 }} />
          <div style={{ padding: isMobile ? '16px' : '20px 0' }}>
            <div className="skeleton" style={{ height: 24, width: '80%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 36, width: 90, borderRadius: 99 }} />)}
            </div>
          </div>
        </div>
        {!isMobile && <div style={{ width: 320, flexShrink: 0 }}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div>}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function VideoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const commentRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [video, setVideo]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Load video
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get(`/videos/${id}`)
      .then(r => { if (!cancelled) setVideo(r.data.video); })
      .catch(err => {
        if (!cancelled) setError(err.response?.status === 404 ? 'not_found' : 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Optimistic like toggle
  const handleLike = useCallback(async () => {
    if (!user) { navigate('/login'); return; }
    const prev = video.viewer_liked;
    setVideo(v => ({
      ...v,
      viewer_liked: !v.viewer_liked,
      likes_count: v.likes_count + (v.viewer_liked ? -1 : 1),
      likes_formatted: String(v.likes_count + (v.viewer_liked ? -1 : 1)),
    }));
    try { await api.post(`/videos/${id}/like`); }
    catch { setVideo(v => ({ ...v, viewer_liked: prev, likes_count: v.likes_count + (prev ? 1 : -1) })); }
  }, [video, user, id, navigate]);

  // Optimistic save toggle
  const handleSave = useCallback(async () => {
    if (!user) { navigate('/login'); return; }
    setVideo(v => ({ ...v, viewer_saved: !v.viewer_saved }));
    try { await api.post(`/videos/${id}/save`); }
    catch { setVideo(v => ({ ...v, viewer_saved: !v.viewer_saved })); }
  }, [video, user, id, navigate]);

  const scrollToComments = () => {
    commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Error states ────────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <span style={{ fontSize: 48 }}>{error === 'not_found' ? '🎬' : '⚠️'}</span>
        <h2 style={{ fontFamily: "'Syne',sans-serif", color: t.text, margin: 0 }}>
          {error === 'not_found' ? 'Video Not Found' : 'Something went wrong'}
        </h2>
        <p style={{ color: t.muted, fontFamily: "'Outfit',sans-serif", margin: 0 }}>
          {error === 'not_found' ? 'This video may have been removed or made private.' : 'Failed to load video. Please try again.'}
        </p>
        <button onClick={() => navigate(-1)}
          style={{ background: t.gradient, color: '#fff', border: 'none', borderRadius: 99, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
          ← Go Back
        </button>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return <PageSkeleton t={t} isMobile={isMobile} />;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#0B0F14' }} />;
  }

  return (
    <>
      <Helmet>
        <title>{video.title} — CPA Videos</title>
        {video.description && <meta name="description" content={video.description.slice(0, 155)} />}
      </Helmet>

      <div style={{
        background: t.bg,
        minHeight: '100vh',
        paddingTop: isMobile ? 64 : 80,
        paddingBottom: isMobile ? 80 : 40,
        overflowX: 'hidden',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 28, alignItems: 'flex-start',
            flexDirection: isMobile ? 'column' : 'row',
          }}>

            {/* ── LEFT / MAIN ──────────────────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>

              {/* ── Smart Video Player ───────────────────────────────────── */}
              <VideoPlayer video={video} t={t} isMobile={isMobile} />

              {/* ── Content below player ─────────────────────────────────── */}
              <div style={{ padding: isMobile ? '16px 16px 0' : '20px 0 0' }}>

                {/* Title — clamped, no overflow */}
                <h1 style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 800,
                  fontSize: isMobile ? 18 : 24,
                  color: t.text, margin: '0 0 14px',
                  lineHeight: 1.35, letterSpacing: '-0.02em',
                  display: '-webkit-box',
                  WebkitLineClamp: isMobile ? 3 : 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}>
                  {video.title}
                </h1>

                {/* Action bar */}
                <ActionBar
                  video={video} t={t} user={user}
                  onLike={handleLike}
                  onSave={handleSave}
                  onComment={scrollToComments}
                />

                {/* Description (with platform badge inside) */}
                <div style={{ marginTop: 14 }}>
                  <DescriptionCard video={video} t={t} />
                </div>

                {/* CPA Curator / Platform Creator */}
                <div style={{ marginTop: 14 }}>
                  <CPACreatorCard video={video} t={t} user={user} />
                </div>

                {/* Original Creator Card — shows if video is from YouTube/Instagram/etc */}
                <OriginalCreatorCard video={video} t={t} />

                {/* Learning Outcomes */}
                <LearningOutcomesCard
                  outcomes={video.learning_outcomes}
                  difficulty={video.difficulty}
                  t={t}
                />

                {/* Resources */}
                <ResourceAttachments links={video.resource_links} t={t} />

                {/* Mobile: Recommended */}
                {isMobile && (
                  <div style={{ marginTop: 8, overflowX: 'hidden' }}>
                    <RecommendedVideos
                      currentVideoId={video.id}
                      category={video.category}
                      isMobile
                    />
                  </div>
                )}

                {/* Comments */}
                <div ref={commentRef} style={{ marginTop: 24, paddingTop: 8 }}>
                  <VideoComments videoId={video.id} />
                </div>
              </div>
            </div>

            {/* ── RIGHT: Recommended sidebar (desktop only) ─────────────── */}
            {!isMobile && (
              <div style={{ width: 320, flexShrink: 0 }}>
                <RecommendedVideos
                  currentVideoId={video.id}
                  category={video.category}
                  isMobile={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && <MobileBottomNav />}
    </>
  );
}
