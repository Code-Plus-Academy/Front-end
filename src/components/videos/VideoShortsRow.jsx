'use client';
// frontend/src/components/videos/VideoShortsRow.jsx
// Shorts → tap card → fullscreen vertical reel player (YT Shorts / Instagram style)
// Swipe up/down or arrow buttons to navigate between shorts.
// Long videos remain in the 16:9 grid below.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import api from '../../api/axios';
import VideoCard from './VideoCard';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return { isDark, text: base.txt, sub: base.txt2, muted: base.txt3, purple: base.accent, border: isDark ? D.cardBorder : 'rgba(0,0,0,0.08)' };
}

const CARD_GRADS = [
  'linear-gradient(145deg,#1a0060,#0a0030)',
  'linear-gradient(145deg,#002a38,#001520)',
  'linear-gradient(145deg,#2a0018,#180008)',
  'linear-gradient(145deg,#0a1a4a,#1a0a4a)',
  'linear-gradient(145deg,#1a1060,#0a0830)',
  'linear-gradient(145deg,#3a0018,#180008)',
];

const CATEGORY_COLORS = {
  'AI & ML': '#8A2BFF', 'Web Dev': '#0891B2', 'Blockchain': '#F59E0B',
  'Cybersecurity': '#EF4444', 'System Design': '#10B981', 'GATE CS': '#3B82F6',
};
function catColor(cat) { return CATEGORY_COLORS[cat] || '#8A2BFF'; }

function durationToSeconds(str) {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function isShortVideo(v) {
  if (v.is_short) return true;
  const secs = durationToSeconds(v.duration_formatted);
  if (secs === 0) return true;
  return secs <= 180;
}

// ── Platform / embed helpers (mirrors VideoDetailPage) ────────────────────────
function detectPlatform(url) {
  if (!url) return null;
  if (/youtu\.be|youtube\.com/i.test(url))  return 'youtube';
  if (/instagram\.com/i.test(url))           return 'instagram';
  if (/vimeo\.com/i.test(url))               return 'vimeo';
  if (/tiktok\.com/i.test(url))              return 'tiktok';
  return 'direct';
}

function toYouTubeEmbed(url) {
  if (!url) return null;
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}?rel=0&autoplay=1&modestbranding=1`;
  const long = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
  if (long) return `https://www.youtube.com/embed/${long[1]}?rel=0&autoplay=1&modestbranding=1`;
  return null;
}

function toVimeoEmbed(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1&title=0&byline=0&portrait=0`;
  return null;
}

function getEmbedUrl(video) {
  const platform = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const rawUrl = video.source_url || video.video_url;
  if (platform === 'youtube') return toYouTubeEmbed(rawUrl);
  if (platform === 'vimeo')   return toVimeoEmbed(rawUrl);
  return null;
}

function isDirectVideo(url) {
  return url && /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}

// Mock data
const MOCK_SHORTS = [
  { id: 'm1', title: 'RAG in 60s', category: 'AI & ML', duration_formatted: '1:02', views_formatted: '48.2K', thumbnail_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80' },
  { id: 'm2', title: 'ZK Proofs Quick', category: 'Blockchain', duration_formatted: '2:31', views_formatted: '21.7K', thumbnail_url: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&q=80' },
  { id: 'm3', title: 'Redis in 3 Min', category: 'System Design', duration_formatted: '2:48', views_formatted: '33.9K', thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80' },
];

const MOCK_LONGS = [
  { id: 'ml1', title: 'LangChain Full Quickstart Guide', category: 'AI & ML', duration_formatted: '11:22', views_formatted: '62.1K', likes_formatted: '4.2K', difficulty: 'beginner', creator_name: 'The Solo Entrepreneur', thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&q=80' },
  { id: 'ml2', title: 'Prompt Injection & Security 101', category: 'Cybersecurity', duration_formatted: '18:55', views_formatted: '18.4K', likes_formatted: '1.1K', difficulty: 'intermediate', creator_name: 'SecDev Labs', thumbnail_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=640&q=80' },
  { id: 'ml3', title: 'System Design: Build a URL Shortener', category: 'System Design', duration_formatted: '24:10', views_formatted: '91.3K', likes_formatted: '7.8K', difficulty: 'intermediate', creator_name: 'Arpit Bhayani', thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&q=80' },
];

// ── Inline reel player ─────────────────────────────────────────────────────────
function ShortsPlayer({ shorts, startIndex, onClose, onOpenDetail }) {
  const [idx, setIdx]       = useState(startIndex);
  const [animDir, setAnimDir] = useState(null); // 'up' | 'down' | null
  const [liked, setLiked]   = useState({});
  const touchStartY         = useRef(null);
  const containerRef        = useRef(null);

  const video = shorts[idx];
  const color = catColor(video?.category);

  // Lock body scroll while player is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowDown')   goNext();
      if (e.key === 'ArrowUp')     goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const goNext = useCallback(() => {
    if (idx >= shorts.length - 1) return;
    setAnimDir('up');
    setTimeout(() => { setIdx(i => i + 1); setAnimDir(null); }, 220);
  }, [idx, shorts.length]);

  const goPrev = useCallback(() => {
    if (idx <= 0) return;
    setAnimDir('down');
    setTimeout(() => { setIdx(i => i - 1); setAnimDir(null); }, 220);
  }, [idx]);

  // Touch swipe
  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd   = (e) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 50)  goNext();
    if (delta < -50) goPrev();
    touchStartY.current = null;
  };

  if (!video) return null;

  const embedUrl  = getEmbedUrl(video);
  const directUrl = isDirectVideo(video.video_url) ? video.video_url : null;
  const isMock    = String(video.id).startsWith('m');

  const slideStyle = {
    transform: animDir === 'up'   ? 'translateY(-100%)' :
               animDir === 'down' ? 'translateY(100%)'  : 'translateY(0)',
    transition: animDir ? 'transform 0.22s cubic-bezier(0.4,0,0.2,1)' : 'none',
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── Video area ── */}
      <div style={{ position: 'relative', width: '100%', height: '100%', ...slideStyle }}>

        {/* Player */}
        {embedUrl ? (
          <iframe
            key={video.id}
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }}
          />
        ) : directUrl ? (
          <video
            key={video.id}
            src={directUrl}
            poster={video.thumbnail_url}
            autoPlay
            controls
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
        ) : (
          /* Thumbnail fallback for mock / no URL */
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {video.thumbnail_url
              ? <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }} />
              : <div style={{ width: '100%', height: '100%', background: CARD_GRADS[idx % CARD_GRADS.length] }} />
            }
            {/* Glowing play circle */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: `3px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 32px ${color}80`,
              }}>
                <span style={{ color: '#fff', fontSize: 28, marginLeft: 5 }}>▶</span>
              </div>
            </div>
            {/* "No embed" notice */}
            <div style={{
              position: 'absolute', bottom: 120, left: 0, right: 0,
              textAlign: 'center', fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, color: 'rgba(255,255,255,0.45)',
            }}>
              {isMock ? 'Demo short — tap "View Full" to open' : 'No embeddable source available'}
            </div>
          </div>
        )}

        {/* Dark gradient overlays for readability */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(#000a, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(transparent, rgba(0,0,0,0.88))', pointerEvents: 'none' }} />
      </div>

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', zIndex: 10,
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5 }}>
          {shorts.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
              background: i === idx ? color : 'rgba(255,255,255,0.35)',
              transition: 'all 0.2s', cursor: 'pointer',
            }} />
          ))}
        </div>
        {/* Close */}
        <button onClick={onClose} style={{
          background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff',
          width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}>✕</button>
      </div>

      {/* ── Right action rail (like YT Shorts) ── */}
      <div style={{
        position: 'absolute', right: 14, bottom: 100,
        display: 'flex', flexDirection: 'column', gap: 18, zIndex: 10, alignItems: 'center',
      }}>
        {/* Like */}
        <ActionBtn
          icon={liked[video.id] ? '❤️' : '🤍'}
          label={video.likes_formatted || '—'}
          onClick={() => setLiked(l => ({ ...l, [video.id]: !l[video.id] }))}
          active={liked[video.id]}
          color={color}
        />
        {/* Share */}
        <ActionBtn icon="↗" label="Share" onClick={() => {
          if (navigator.share) navigator.share({ title: video.title, url: window.location.href });
        }} color={color} />
        {/* View full detail */}
        <ActionBtn icon="⤢" label="Full" onClick={() => onOpenDetail(video)} color={color} />
      </div>

      {/* ── Bottom info ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 70,
        padding: '0 16px 24px', zIndex: 10,
      }}>
        {/* Category pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: `${color}30`, border: `1px solid ${color}55`,
          borderRadius: 6, padding: '3px 10px', marginBottom: 8,
          backdropFilter: 'blur(6px)',
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color, fontWeight: 700, letterSpacing: '0.06em' }}>
            ⚡ {video.category || 'SHORT'}
          </span>
        </div>
        {/* Title */}
        <div style={{
          fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800,
          color: '#fff', lineHeight: 1.3, marginBottom: 6,
          textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {video.title}
        </div>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {video.creator_name && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              @{video.creator_name}
            </span>
          )}
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
            {video.views_formatted} views · {video.duration_formatted}
          </span>
        </div>
      </div>

      {/* ── Prev / Next arrows (desktop) ── */}
      {idx > 0 && (
        <button onClick={goPrev} style={arrowBtn('top')}>↑</button>
      )}
      {idx < shorts.length - 1 && (
        <button onClick={goNext} style={arrowBtn('bottom')}>↓</button>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active, color }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.45)',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '50%', width: 48, height: 48, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', backdropFilter: 'blur(6px)', transition: 'all 0.15s',
        transform: hov ? 'scale(1.08)' : 'scale(1)',
        boxShadow: active ? `0 0 12px ${color}60` : 'none',
        padding: 0,
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      {label && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{label}</span>}
    </button>
  );
}

function arrowBtn(pos) {
  return {
    position: 'absolute',
    [pos === 'top' ? 'top' : 'bottom']: 80,
    left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', width: 40, height: 40, borderRadius: '50%',
    cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(6px)', zIndex: 10, transition: 'background 0.15s',
  };
}

// ── Short portrait card (unchanged) ───────────────────────────────────────────
function ShortCard({ v, i, onClick }) {
  const [hov, setHov] = useState(false);
  const color = catColor(v.category);
  return (
    <div
      onClick={() => onClick(v)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 136, height: 220, borderRadius: 13,
        background: v.thumbnail_url ? '#0a0a0a' : CARD_GRADS[i % CARD_GRADS.length],
        border: `1px solid ${hov ? color + '66' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${color}30` : '0 4px 16px rgba(0,0,0,0.35)',
        transform: hov ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'all 0.22s ease',
      }}
    >
      {v.thumbnail_url && (
        <img src={v.thumbnail_url} alt={v.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 50% 18%, ${color}50 0%, transparent 68%)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(transparent, rgba(0,0,0,0.82))' }} />
      {/* Play icon on hover */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: hov ? 1 : 0, transition: 'opacity 0.18s', pointerEvents: 'none',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 14px ${color}70`,
        }}>
          <span style={{ color: '#fff', fontSize: 13, marginLeft: 3 }}>▶</span>
        </div>
      </div>
      <div style={{ position: 'relative', background: `${color}40`, border: `1px solid ${color}60`, borderRadius: 7, padding: '4px 9px', alignSelf: 'flex-start', backdropFilter: 'blur(6px)' }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>{v.category || 'video'}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.35, fontFamily: "'Syne',sans-serif", marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.015em' }}>
          {v.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{v.views_formatted} views</span>
          {v.duration_formatted && (
            <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace" }}>{v.duration_formatted}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ emoji, label, badge, onSeeAll, t }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>
          {emoji} {label}
        </span>
        <div style={{ background: '#8A2BFF18', border: '1px solid #8A2BFF28', borderRadius: 5, padding: '1px 7px' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: '#8A2BFF', fontWeight: 600, letterSpacing: '0.06em' }}>{badge}</span>
        </div>
      </div>
      <span onClick={onSeeAll} style={{ fontSize: 11, color: t.purple, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
        See all →
      </span>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function VideoShortsRow({ limit = 8 }) {
  const t = useT();
  const router = useRouter();
  const scrollRef = useRef(null);
  const [videos, setVideos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [playerIdx, setPlayerIdx]   = useState(null); // null = closed

  useEffect(() => {
    let cancelled = false;
    api.get('/videos', { params: { limit, offset: 0 } })
      .then(res => { if (!cancelled) setVideos(res.data.videos || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  const allVideos = loading ? [] : (videos.length ? videos.slice(0, limit) : null);
  const shorts = allVideos ? allVideos.filter(isShortVideo)    : MOCK_SHORTS;
  const longs  = allVideos ? allVideos.filter(v => !isShortVideo(v)) : MOCK_LONGS;

  const handleShortClick = (v) => {
    const idx = shorts.findIndex(s => s.id === v.id);
    setPlayerIdx(idx >= 0 ? idx : 0);
  };

  const handleOpenDetail = (v) => {
    if (!String(v.id).startsWith('m')) {
      router.push(`/videos/${v.id}`);
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>

      {/* Fullscreen inline reel player */}
      {playerIdx !== null && (
        <ShortsPlayer
          shorts={shorts}
          startIndex={playerIdx}
          onClose={() => setPlayerIdx(null)}
          onOpenDetail={handleOpenDetail}
        />
      )}

      {/* ── LONG VIDEOS: Traditional 16:9 grid ──────────────────────────── */}
      {(loading || longs.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader emoji="🎬" label="Videos" badge="LONG-FORM" onSeeAll={() => router.push('/videos')} t={t} />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {longs.map(v => <VideoCard key={v.id} video={v} />)}
            </div>
          )}
        </div>
      )}

      {/* ── SHORT VIDEOS: Horizontal scroll portrait cards ───────────────── */}
      {(loading || shorts.length > 0) && (
        <div style={{ marginBottom: 14 }}>
          <SectionHeader emoji="⚡" label="Quick Bites" badge="SHORTS" onSeeAll={() => router.push('/videos')} t={t} />
          <div
            ref={scrollRef}
            style={{
              display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
              marginLeft: -18, marginRight: -18, paddingLeft: 18, paddingRight: 18,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ flexShrink: 0, width: 136, height: 220, borderRadius: 13 }} />
                ))
              : shorts.map((v, i) => (
                  <ShortCard key={v.id} v={v} i={i} onClick={handleShortClick} />
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
