// frontend/src/pages/ShortsPage.jsx
// Instagram Reels-style layout:
//   - Top bar (back + "Shorts" label)  → position:fixed, never scrolls
//   - Right side rail (avatar, like, save, share) → position:fixed, never scrolls
//   - Bottom caption (creator, title, desc, tags)  → position:fixed, never scrolls
//   - Only the VIDEO PLAYER COLUMN scrolls (scroll-snap, 100dvh per slide)
//   - All UI panels read from `activeVideo` which updates as you scroll

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate }                   from 'react-router-dom';
import { Helmet }                                   from 'react-helmet-async';
import { useAuth }                                  from '../context/AuthContext';
import api                                          from '../api/axios';
import MobileBottomNav                              from '../components/layout/MobileBottomNav';
import { toInstagramEmbed, isDirectVideo, detectPlatform } from '../utils/videoEmbed';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       '#000',
  text:     '#fff',
  sub:      'rgba(255,255,255,0.72)',
  muted:    'rgba(255,255,255,0.42)',
  border:   'rgba(255,255,255,0.12)',
  accent:   '#00B4D8',
  purple:   '#9333EA',
  gradient: 'linear-gradient(135deg,#00B4D8,#9333EA)',
  red:      '#ff4757',
  green:    '#22c55e',
  warn:     '#f59e0b',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtN(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60)    return `${m}m ago`;
  if (m < 1440)  return `${Math.floor(m / 60)}h ago`;
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
const PMETA = {
  youtube:   { label: 'YouTube',   color: '#FF0000' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  tiktok:    { label: 'TikTok',    color: '#69C9D0' },
  direct:    { label: 'Direct',    color: '#22C55E' },
};
function buildYTEmbed(url) {
  const pats = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:watch\?v=|embed\/)([A-Za-z0-9_-]{11})/,
  ];
  let id = null;
  for (const p of pats) { const m = url?.match(p); if (m) { id = m[1]; break; } }
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&autoplay=1&mute=1`;
}

// ─── Poster (non-active slide — no iframe, no audio leak) ──────────────────────
function Poster({ video }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {video.thumbnail_url && (
        <img src={video.thumbnail_url} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px) brightness(0.45)' }} />
      )}
      <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
      </div>
    </div>
  );
}

// ─── Player (only mounted when active) ────────────────────────────────────────
function ShortPlayer({ video, active }) {
  const [err, setErr] = useState(false);
  const [muted, setMuted] = useState(true);
  const vidRef = useRef(null);

  const platform  = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const rawUrl    = video.source_url || video.video_url;
  const directUrl = isDirectVideo(rawUrl) ? rawUrl : null;

  useEffect(() => {
    const el = vidRef.current;
    if (!el) return;
    el.muted = muted;
    if (active) el.play().catch(() => {});
    else { el.pause(); el.currentTime = 0; }
  }, [active, muted]);

  if (!active) return <Poster video={video} />;

  if (directUrl && !err) {
    return (
      <>
        <video ref={vidRef} src={directUrl} poster={video.thumbnail_url} loop playsInline muted={muted}
          preload="auto" onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }} />
        <button onClick={() => setMuted(m => !m)}
          style={{ position: 'absolute', top: 72, right: 14, zIndex: 5, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {muted
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
          }
        </button>
      </>
    );
  }

  if (platform === 'youtube' && !err) {
    const src = buildYTEmbed(rawUrl);
    if (src) return (
      <>
        <iframe key={`yt-${video.id}`} src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }} />
        <MutedBadge />
      </>
    );
  }

  if (platform === 'instagram' && !err) {
    const src = toInstagramEmbed(rawUrl);
    if (src) return (
      <iframe key={`ig-${video.id}`} src={src} allow="encrypted-media" allowFullScreen scrolling="no"
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }} />
    );
  }

  // Fallback
  const pmeta = PMETA[platform];
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {video.thumbnail_url && <img src={video.thumbnail_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />}
      <div style={{ position: 'relative', textAlign: 'center', padding: 24 }}>
        <div style={{ color: T.text, fontSize: 15, fontFamily: "'Outfit',sans-serif", fontWeight: 600, marginBottom: 18 }}>
          Watch on {pmeta?.label || 'original platform'}
        </div>
        {rawUrl && (
          <a href={rawUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 99, background: pmeta?.color || T.accent, color: '#fff', textDecoration: 'none', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14 }}>
            Open Video ↗
          </a>
        )}
      </div>
    </div>
  );
}

function MutedBadge() {
  const [v, setV] = useState(true);
  useEffect(() => { const t = setTimeout(() => setV(false), 3200); return () => clearTimeout(t); }, []);
  if (!v) return null;
  return (
    <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', borderRadius: 99, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 7, color: T.sub, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", pointerEvents: 'none', zIndex: 4, whiteSpace: 'nowrap' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
      Muted · tap video to unmute
    </div>
  );
}

// ─── FIXED TOP BAR ─────────────────────────────────────────────────────────────
// position:fixed — never scrolls with content
function TopBar({ onBack, total, activeIdx, hasMore }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: 'env(safe-area-inset-top, 0px) 16px 0',
      paddingTop: 'max(env(safe-area-inset-top,0px), 44px)',
      paddingBottom: 12,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
      display: 'flex', alignItems: 'center', gap: 12,
      pointerEvents: 'none',
    }}>
      <button onClick={onBack}
        style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>Shorts</span>
      <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: `${T.accent}30`, color: T.accent, border: `1px solid ${T.accent}55`, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em' }}>
        ⚡ CPA
      </span>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono',monospace" }}>
        {activeIdx + 1} / {total}{hasMore ? '+' : ''}
      </span>
    </div>
  );
}

// ─── FIXED RIGHT SIDE RAIL ─────────────────────────────────────────────────────
// position:fixed right side — avatar + like + save + share
// Updates from activeVideo prop (not from inside the scroll container)
function SideRail({ video, onLike, onSave, onShare, navigate }) {
  if (!video) return null;

  const actions = [
    {
      key: 'like',
      icon: (on) => (
        <svg width="27" height="27" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M7 22V11M2 13v7a2 2 0 002 2h13.4a2 2 0 001.96-1.6l1.44-6A2 2 0 0017.84 12H15V6a3 3 0 00-3-3 1 1 0 00-1 1v.5L7.5 11"/>
        </svg>
      ),
      label: fmtN(video.likes_count),
      on: video.viewer_liked,
      color: T.red,
      action: onLike,
    },
    {
      key: 'save',
      icon: (on) => (
        <svg width="27" height="27" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
        </svg>
      ),
      label: video.viewer_saved ? 'Saved' : 'Save',
      on: video.viewer_saved,
      color: T.warn,
      action: onSave,
    },
    {
      key: 'share',
      icon: () => (
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      ),
      label: 'Share',
      on: false,
      color: T.green,
      action: onShare,
    },
  ];

  return (
    <div style={{
      position: 'fixed',
      right: 12,
      bottom: 90,        // above MobileBottomNav
      zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      {/* Avatar */}
      <div
        onClick={() => video.creator_username && navigate(`/u/${video.creator_username}`)}
        style={{
          width: 46, height: 46, borderRadius: '50%',
          border: '2.5px solid #fff',
          overflow: 'hidden', cursor: 'pointer',
          background: T.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19, fontWeight: 700, color: '#fff', flexShrink: 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {video.creator_avatar
          ? <img src={video.creator_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (video.creator_name || '?')[0].toUpperCase()
        }
      </div>

      {actions.map(a => (
        <button key={a.key} onClick={a.action}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: a.on ? a.color : '#fff',
            transition: 'transform 0.15s, color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.18)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {a.icon(a.on)}
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: a.on ? a.color : T.sub }}>
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── FIXED BOTTOM CAPTION ──────────────────────────────────────────────────────
// position:fixed bottom — creator handle, title, desc, tags, timestamp
// Updates from activeVideo — content cross-fades on video change
function BottomCaption({ video, navigate }) {
  const [expanded, setExpanded] = useState(false);
  // Collapse description whenever the video changes
  useEffect(() => { setExpanded(false); }, [video?.id]);

  if (!video) return null;

  const platform = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const pmeta    = PMETA[platform];

  return (
    <div style={{
      position: 'fixed',
      bottom: 56,          // above MobileBottomNav (56px tall)
      left: 0,
      right: 76,           // leave space for side rail
      zIndex: 100,
      padding: '60px 16px 20px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)',
      pointerEvents: 'none',
      // Smooth crossfade when video changes
      transition: 'opacity 0.22s ease',
    }}>
      <div style={{ pointerEvents: 'auto' }}>

        {/* Creator row */}
        <div
          onClick={() => video.creator_username && navigate(`/u/${video.creator_username}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }}
        >
          {/* Inline mini avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.7)',
            overflow: 'hidden', flexShrink: 0,
            background: T.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            {video.creator_avatar
              ? <img src={video.creator_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (video.creator_name || '?')[0].toUpperCase()
            }
          </div>

          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: '#fff' }}>
            @{video.creator_username || video.creator_name || 'creator'}
          </span>

          {/* Verified tick */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill={T.accent}/>
            <path d="M6.5 12.5l3.5 3.5 7.5-7.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Platform badge */}
          {pmeta && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: `${pmeta.color}28`, color: pmeta.color, border: `1px solid ${pmeta.color}55`, fontFamily: "'JetBrains Mono',monospace" }}>
              {pmeta.label.toUpperCase()}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.4, marginBottom: 5 }}>
          {video.title}
        </div>

        {/* Description */}
        {video.description && (
          <div>
            <div style={{
              fontFamily: "'Outfit',sans-serif", fontSize: 13, color: T.sub, lineHeight: 1.5,
              maxHeight: expanded ? '160px' : '2.9em',
              overflow: 'hidden',
              transition: 'max-height 0.25s ease',
            }}>
              {video.description}
            </div>
            {video.description.length > 72 && (
              <button onClick={() => setExpanded(p => !p)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif", padding: '1px 0' }}>
                {expanded ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        {video.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {video.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ fontSize: 12, color: T.accent, fontFamily: "'JetBrains Mono',monospace" }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp + duration */}
        <div style={{ marginTop: 5, fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono',monospace" }}>
          {timeAgo(video.created_at)}
          {video.duration_formatted && ` · ${video.duration_formatted}`}
        </div>
      </div>
    </div>
  );
}

// ─── Progress dots (fixed right edge) ─────────────────────────────────────────
function ProgressDots({ total, active }) {
  if (total > 12 || total <= 1) return null;
  return (
    <div style={{ position: 'fixed', right: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 5, zIndex: 90 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === active ? 4 : 3,
          height: i === active ? 18 : 6,
          borderRadius: 99,
          background: i === active ? T.accent : 'rgba(255,255,255,0.25)',
          transition: 'all 0.2s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Desktop nav arrows ────────────────────────────────────────────────────────
function NavArrows({ onUp, onDown, disabledUp, disabledDown }) {
  const btn = (onClick, disabled, dir) => (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: disabled ? 'rgba(255,255,255,0.2)' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {dir === 'up' ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
      </svg>
    </button>
  );
  return (
    <div style={{ position: 'fixed', right: 72, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 90 }}>
      {btn(onUp, disabledUp, 'up')}
      {btn(onDown, disabledDown, 'down')}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ShortsPage() {
  const { id: initialId } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();

  const [shorts,      setShorts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [cursor,      setCursor]      = useState(null);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [videoState,  setVideoState]  = useState({});   // optimistic like/save

  const containerRef = useRef(null);
  const slideRefs    = useRef([]);
  const activeRef    = useRef(0);        // stable ref for observer callback
  const settleTimer  = useRef(null);
  const lastUrlId    = useRef(null);

  // ── Optimistic state helpers ───────────────────────────────────────────────
  const getVS = useCallback((video) => ({
    liked:       videoState[video.id]?.liked       ?? video.viewer_liked  ?? false,
    saved:       videoState[video.id]?.saved       ?? video.viewer_saved  ?? false,
    likes_count: videoState[video.id]?.likes_count ?? video.likes_count   ?? 0,
  }), [videoState]);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: '12' });
    if (initialId) p.set('startId', initialId);

    api.get(`/videos/shorts?${p}`)
      .then(r => {
        const list = r.data.videos || r.data.shorts || [];
        setShorts(list);
        setCursor(r.data.cursor || null);
        setHasMore(Boolean(r.data.has_more));

        if (initialId && list.length) {
          const idx = list.findIndex(v => String(v.id) === String(initialId));
          const start = idx >= 0 ? idx : 0;
          setActiveIdx(start);
          activeRef.current = start;
          if (start > 0) {
            requestAnimationFrame(() => {
              slideRefs.current[start]?.scrollIntoView({ behavior: 'instant' });
            });
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialId]);

  // ── IntersectionObserver — only the SCROLL COLUMN changes ─────────────────
  // Observer threshold 0.85 + 120ms debounce prevents dual-active state
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      let best = null;
      for (const e of entries) {
        if (e.intersectionRatio >= 0.85) {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
      }
      if (!best) return;

      const idx = slideRefs.current.findIndex(el => el === best.target);
      if (idx < 0 || idx === activeRef.current) return;

      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => {
        setActiveIdx(idx);
        activeRef.current = idx;

        const v = shorts[idx];
        if (v && String(v.id) !== lastUrlId.current) {
          lastUrlId.current = String(v.id);
          window.history.replaceState(null, '', `/shorts/${v.id}`);
        }
      }, 120);
    }, { threshold: [0.85] });

    slideRefs.current.forEach(el => { if (el) obs.observe(el); });
    return () => { obs.disconnect(); clearTimeout(settleTimer.current); };
  }, [shorts.length]);  // only length — not activeIdx

  // ── Load more when 3 from end ──────────────────────────────────────────────
  useEffect(() => {
    if (activeIdx >= shorts.length - 3 && hasMore && !loadingMore && cursor) {
      setLoadingMore(true);
      api.get(`/videos/shorts?limit=10&cursor=${encodeURIComponent(cursor)}`)
        .then(r => {
          const list = r.data.videos || r.data.shorts || [];
          setShorts(prev => [...prev, ...list]);
          setCursor(r.data.cursor || null);
          setHasMore(Boolean(r.data.has_more));
        })
        .catch(console.error)
        .finally(() => setLoadingMore(false));
    }
  }, [activeIdx, shorts.length, hasMore, loadingMore, cursor]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowDown' || e.key === 'j') slideRefs.current[Math.min(activeRef.current + 1, shorts.length - 1)]?.scrollIntoView({ behavior: 'smooth' });
      if (e.key === 'ArrowUp'   || e.key === 'k') slideRefs.current[Math.max(activeRef.current - 1, 0)]?.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [shorts.length]);

  // ── Touch swipe ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let y0 = 0;
    const start = e => { y0 = e.touches[0].clientY; };
    const end   = e => {
      const dy = y0 - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) return;
      const target = dy > 0
        ? Math.min(activeRef.current + 1, shorts.length - 1)
        : Math.max(activeRef.current - 1, 0);
      slideRefs.current[target]?.scrollIntoView({ behavior: 'smooth' });
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchend',   end,   { passive: true });
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchend', end); };
  }, [shorts.length]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async (video) => {
    if (!user) { navigate('/login'); return; }
    const prev = getVS(video);
    const next = !prev.liked;
    setVideoState(s => ({ ...s, [video.id]: { ...prev, liked: next, likes_count: prev.likes_count + (next ? 1 : -1) } }));
    try { await api.post(`/videos/${video.id}/like`); }
    catch { setVideoState(s => ({ ...s, [video.id]: prev })); }
  }, [user, navigate, getVS]);

  const handleSave = useCallback(async (video) => {
    if (!user) { navigate('/login'); return; }
    const prev = getVS(video);
    setVideoState(s => ({ ...s, [video.id]: { ...prev, saved: !prev.saved } }));
    try { await api.post(`/videos/${video.id}/save`); }
    catch { setVideoState(s => ({ ...s, [video.id]: prev })); }
  }, [user, navigate, getVS]);

  const handleShare = useCallback((video) => {
    const url = `${window.location.origin}/shorts/${video.id}`;
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  }, []);

  const scrollTo = useCallback(idx => {
    slideRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Loading / empty ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ height: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: `3px solid ${T.accent}30`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: T.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>Loading shorts…</span>
    </div>
  );

  if (!shorts.length) return (
    <div style={{ height: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <span style={{ fontSize: 48 }}>⚡</span>
      <p style={{ color: T.sub, fontFamily: "'Outfit',sans-serif", margin: 0 }}>No shorts yet — check back soon.</p>
      <button onClick={() => navigate(-1)} style={{ background: T.gradient, color: '#fff', border: 'none', borderRadius: 99, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>← Go Back</button>
    </div>
  );

  // Enrich the active video with optimistic state for the fixed panels
  const raw         = shorts[activeIdx];
  const vs          = raw ? getVS(raw) : {};
  const activeVideo = raw ? { ...raw, viewer_liked: vs.liked, viewer_saved: vs.saved, likes_count: vs.likes_count } : null;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sf::-webkit-scrollbar { display: none; }
      `}</style>

      <Helmet>
        <title>{activeVideo ? `${activeVideo.title} — CPA Shorts` : 'Shorts — CPA'}</title>
      </Helmet>

      {/* ── FIXED UI LAYER — never scrolls ──────────────────────────────── */}

      {/* Top bar */}
      <TopBar onBack={() => navigate(-1)} total={shorts.length} activeIdx={activeIdx} hasMore={hasMore} />

      {/* Right side rail — reads from activeVideo */}
      <SideRail
        video={activeVideo}
        onLike={() => raw && handleLike(raw)}
        onSave={() => raw && handleSave(raw)}
        onShare={() => raw && handleShare(raw)}
        navigate={navigate}
      />

      {/* Bottom caption — reads from activeVideo */}
      <BottomCaption video={activeVideo} navigate={navigate} />

      {/* Progress dots */}
      <ProgressDots total={shorts.length} active={activeIdx} />

      {/* Desktop nav arrows */}
      <NavArrows
        onUp={() => scrollTo(Math.max(activeIdx - 1, 0))}
        onDown={() => scrollTo(Math.min(activeIdx + 1, shorts.length - 1))}
        disabledUp={activeIdx === 0}
        disabledDown={activeIdx === shorts.length - 1 && !hasMore}
      />

      {/* Copy toast */}
      {copied && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.88)', color: T.green, padding: '9px 20px', borderRadius: 99, zIndex: 999, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, border: `1px solid ${T.green}44`, whiteSpace: 'nowrap' }}>
          ✓ Link copied!
        </div>
      )}

      {/* ── SCROLL COLUMN — only videos scroll here ──────────────────────── */}
      <div
        ref={containerRef}
        className="sf"
        style={{
          position: 'fixed',   // ← FIXED so the scroll column itself doesn't
          inset: 0,            //   push the page layout. Only children scroll.
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          background: '#000',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          zIndex: 1,           // below fixed UI panels (z:100)
        }}
      >
        {shorts.map((video, idx) => {
          const isActive = idx === activeIdx;
          const ovs = getVS(video);
          const enriched = { ...video, viewer_liked: ovs.liked, viewer_saved: ovs.saved, likes_count: ovs.likes_count };

          return (
            <div
              key={video.id}
              ref={el => { slideRefs.current[idx] = el; }}
              style={{
                height: '100dvh',
                width: '100%',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                position: 'relative',
                background: '#000',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {/* Only active slide renders live player; others → Poster */}
              <ShortPlayer video={enriched} active={isActive} />
            </div>
          );
        })}

        {/* Load-more spinner slide */}
        {loadingMore && (
          <div style={{ height: '100dvh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'start' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: `3px solid ${T.accent}30`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* End of feed */}
        {!hasMore && shorts.length > 0 && (
          <div style={{ height: '50dvh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, scrollSnapAlign: 'start' }}>
            <span style={{ fontSize: 32 }}>⚡</span>
            <span style={{ color: T.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>You're all caught up</span>
            <button onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 99, padding: '8px 20px', cursor: 'pointer', color: T.sub, fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
              Back to top ↑
            </button>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </>
  );
}
