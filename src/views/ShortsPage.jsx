'use client';
// frontend/src/pages/ShortsPage.jsx
// Updated ShortPlayer with HLS.js for CDN chunks + YouTube embed

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ClapIcon from '../components/icons/ClapIcon';
import { useParams, useNavigate, useLocation }                   from 'react-router-dom';
import { Helmet }                                   from 'react-helmet-async';
import { useAuth }                                  from '../context/AuthContext';
import { useSaveToContainer }                         from '../context/SaveToContainerContext';
import CommentSheet                                 from '../components/ui/CommentSheet';
import ReportModal                                  from '../components/ui/ReportModal';
import ShareSheet                                   from '../components/ui/ShareSheet';
import MobileBottomNav                              from '../components/layout/MobileBottomNav';
import { detectPlatform, getEmbedUrl, isDirectVideo, isHLS } from '../utils/videoEmbed';
import { MoreVertical, Edit3, EyeOff, Flag }       from 'lucide-react';
import toast                                        from 'react-hot-toast';
import { DotLottieReact }                            from '@lottiefiles/dotlottie-react';
import useAnalytics                                 from '../hooks/useAnalytics';

// ─── Design tokens ────────────────────────────────────────────
const T = {
  bg: '#000', text: '#fff', sub: 'rgba(255,255,255,0.72)',
  muted: 'rgba(255,255,255,0.42)', border: 'rgba(255,255,255,0.12)',
  accent: '#00B4D8', purple: '#9333EA',
  gradient: 'linear-gradient(135deg,#00B4D8,#9333EA)',
  red: '#ff4757', green: '#22c55e', warn: '#f59e0b',
};

// ─── Shorts Skeleton Loading Placeholder ───────────────────────
function ShortsSkeleton() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', background: '#0b0f14', overflow: 'hidden' }}>
      <style>{`
        @keyframes shimmer { 0% { opacity: 0.3; } 50% { opacity: 0.7; } 100% { opacity: 0.3; } }
        .skeleton-shimmer { animation: shimmer 1.5s ease-in-out infinite; background: rgba(255,255,255,0.08); }
      `}</style>
      
      {/* Top Bar Skeleton */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div className="skeleton-shimmer" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        <div className="skeleton-shimmer" style={{ width: 90, height: 20, borderRadius: 10 }} />
      </div>

      {/* Side Rail Skeleton */}
      <div style={{ position: 'absolute', right: 14, bottom: 120, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', zIndex: 10 }}>
        <div className="skeleton-shimmer" style={{ width: 44, height: 44, borderRadius: '50%' }} />
        <div className="skeleton-shimmer" style={{ width: 44, height: 44, borderRadius: '50%' }} />
        <div className="skeleton-shimmer" style={{ width: 44, height: 44, borderRadius: '50%' }} />
        <div className="skeleton-shimmer" style={{ width: 44, height: 44, borderRadius: '50%' }} />
      </div>

      {/* Bottom Caption Skeleton */}
      <div style={{ position: 'absolute', left: 16, bottom: 40, right: 80, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="skeleton-shimmer" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div className="skeleton-shimmer" style={{ width: 120, height: 16, borderRadius: 8 }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: '85%', height: 14, borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '60%', height: 14, borderRadius: 6 }} />
      </div>

      {/* Center Spinner Icon */}
      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', border: `3px solid ${T.accent}30`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: T.sub, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 1 }}>LOADING SHORTS</span>
      </div>
    </div>
  );
}

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
  youtube:   { 
    label: 'YouTube',   
    color: '#FF0000', 
    icon: () => (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}>
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.503a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.503 9.388.503 9.388.503s7.518 0 9.388-.503a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  instagram: { 
    label: 'Instagram', 
    color: '#E1306C', 
    icon: () => (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    )
  },
  tiktok:    { 
    label: 'TikTok',    
    color: '#00F2FE', 
    icon: () => (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}>
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97V18.5a6.5 6.5 0 0 1-5.87 6.47c-2.45.2-4.94-.93-6.22-3.05a6.52 6.52 0 0 1 1.11-8.23c1.33-1.04 3.1-1.49 4.76-1.18v4.3a2.5 2.5 0 0 0-2.3 2.1c-.26 1.4.6 2.85 1.96 3.19 1.34.34 2.8-.47 3.24-1.8.09-.29.12-.59.12-.89V.02z"/>
      </svg>
    )
  },
  direct:    { 
    label: 'Direct',    
    color: '#22C55E', 
    icon: () => (
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}>
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>
    )
  },
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
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&autoplay=1&mute=0`;
}

// ─── Poster (non-active slide) ────────────────────────────────
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

// ─── Mute button ──────────────────────────────────────────────
function MuteBtn({ muted, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ position: 'absolute', top: 72, right: 14, zIndex: 5, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {muted
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
      }
    </button>
  );
}

function MutedBadge() {
  const [v, setV] = useState(true);
  useEffect(() => { const t = setTimeout(() => setV(false), 3200); return () => clearTimeout(t); }, []);
  if (!v) return null;
  return (
    <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', borderRadius: 99, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 7, color: T.sub, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", pointerEvents: 'none', zIndex: 4, whiteSpace: 'nowrap' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
      Muted · tap to unmute
    </div>
  );
}

// ─── HLS Player ───────────────────────────────────────────────
function HLSPlayer({ src, active, poster, paused }) {
  const vidRef    = useRef(null);
  const hlsRef    = useRef(null);
  const activeRef = useRef(active);
  const [muted, setMuted] = useState(false);
  const [err,   setErr]   = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Keep activeRef in sync so the MANIFEST_PARSED callback can read latest value
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const video = vidRef.current;
    if (!video || !src) return;

    // Always start muted=false (respect current state)
    video.muted = muted;

    let hls = null;
    let cancelled = false;

    const tryPlay = () => {
      if (!activeRef.current || cancelled) return;
      // Unmute before playing so React-muted-prop bug doesn't silence it
      video.muted = activeRef.current ? muted : true;
      video.play().catch(() => {
        // Autoplay blocked — try muted as a fallback so at least video plays
        video.muted = true;
        video.play().catch(() => {});
      });
    };

    const setup = async () => {
      try {
        const Hls = (await import('hls.js')).default;

        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            startLevel: -1,          // auto quality
            autoStartLoad: true,
          });
          hls.loadSource(src);
          hls.attachMedia(video);

          // ── KEY FIX: play only after the manifest is parsed and HLS
          //    has buffered enough to actually start. Calling play() before
          //    this causes a silent failure (video loads but never plays).
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) tryPlay();
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) setErr(true);
          });
          hlsRef.current = hls;

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS — attach src and use canplay event
          video.src = src;
          video.addEventListener('canplay', tryPlay, { once: true });
        } else {
          setErr(true);
        }
      } catch {
        setErr(true);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const video = vidRef.current;
    if (!video) return;
    // Always sync muted via DOM — React's `muted` prop doesn't update after mount
    video.muted = muted;
    if (paused) {
      video.pause();
    } else if (active) {
      // Only call play() if readyState >= HAVE_FUTURE_DATA (HLS has buffered)
      if (video.readyState >= 3) {
        video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
      }
      // If not ready yet, MANIFEST_PARSED handler above will call tryPlay()
    } else {
      video.pause();
      video.currentTime = 0;
      setLoaded(false);
    }
  }, [active, muted, paused]);

  if (err) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      {poster && (
        <img
          src={poster}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.55)',
            transition: 'opacity 0.35s ease',
            opacity: loaded ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}
      {/* Note: `muted` attribute intentionally omitted from JSX — React does not
          update the `muted` DOM property after initial render (known React bug).
          We control it exclusively via `video.muted = ...` in useEffect above. */}
      <video
        ref={vidRef}
        loop
        playsInline
        preload="auto"
        onPlaying={() => setLoaded(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
          zIndex: 2,
        }}
      />
      <MuteBtn muted={muted} onToggle={() => setMuted(m => !m)} />
      {muted && <MutedBadge />}
    </div>
  );
}

// ─── Direct video player (mp4/webm) ──────────────────────────
function DirectPlayer({ src, active, poster, paused }) {
  const vidRef    = useRef(null);
  const activeRef = useRef(active);
  const [muted, setMuted] = useState(false);
  const [err,   setErr]   = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { activeRef.current = active; }, [active]);

  // Set src and listen for canplay so we play as soon as data is ready,
  // not before (which causes the silent-load-no-play bug on direct mp4s too)
  useEffect(() => {
    const el = vidRef.current;
    if (!el || !src) return;
    el.muted = muted;

    const tryPlay = () => {
      if (!activeRef.current) return;
      el.muted = muted;
      el.play().catch(() => { el.muted = true; el.play().catch(() => {}); });
    };

    el.src = src;
    el.load();
    el.addEventListener('canplay', tryPlay, { once: true });

    return () => {
      el.removeEventListener('canplay', tryPlay);
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const el = vidRef.current;
    if (!el) return;
    el.muted = muted;
    if (paused) {
      el.pause();
    } else if (active) {
      if (el.readyState >= 3) {
        el.play().catch(() => { el.muted = true; el.play().catch(() => {}); });
      }
      // If not ready, canplay listener above fires when data arrives
    } else {
      el.pause();
      el.currentTime = 0;
      setLoaded(false);
    }
  }, [active, muted, paused]);

  if (err) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      {poster && (
        <img
          src={poster}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.55)',
            transition: 'opacity 0.35s ease',
            opacity: loaded ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}
      {/* muted controlled via DOM ref only — not JSX prop (React muted-prop bug) */}
      <video
        ref={vidRef}
        loop
        playsInline
        preload="auto"
        onError={() => setErr(true)}
        onPlaying={() => setLoaded(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
          zIndex: 2,
        }}
      />
      <MuteBtn muted={muted} onToggle={() => setMuted(m => !m)} />
      {muted && <MutedBadge />}
    </div>
  );
}

// ─── Removed Short Slide ──────────────────────────────────────
function RemovedShortSlide({ active, onNext }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) return;

    // Plays Tumbleweed.lottie for ~2 loop cycles (approx 3.6s) then auto-advances
    const timer = setTimeout(() => {
      if (onNext) onNext();
    }, 3600);

    return () => clearTimeout(timer);
  }, [active, onNext]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        textAlign: 'center',
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 'min(85vw, 280px)',
          height: 'min(60vw, 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {mounted ? (
          <DotLottieReact
            src="/Tumbleweed.lottie"
            loop
            autoplay={active}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} />
        )}
      </div>

      <h2
        style={{
          fontFamily: "'Space Grotesk', 'Clash Display', sans-serif",
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#fff',
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}
      >
        Short Removed
      </h2>

      <p
        style={{
          fontFamily: "'Geist', sans-serif",
          fontSize: '0.88rem',
          color: 'rgba(255,255,255,0.65)',
          maxWidth: 300,
          lineHeight: 1.5,
          margin: '0 0 20px',
        }}
      >
        This short was taken down or removed for violating community guidelines.
      </p>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 99,
          background: 'rgba(0,180,216,0.12)',
          border: '1px solid rgba(0,180,216,0.3)',
          color: '#00B4D8',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00B4D8',
            animation: 'pulse 1s infinite alternate',
          }}
        />
        Skipping to next video...
      </div>
    </div>
  );
}

// ─── ShortPlayer — picks correct player based on video_url ──
function ShortPlayer({ video, active, paused, onNext }) {
  const [err, setErr] = useState(false);

  const isRemoved = ['removed', 'temporarily_removed', 'taken_down', 'suspended'].includes((video?.moderation_status || '').toLowerCase()) || video?.status === 'archived';

  if (isRemoved) {
    return <RemovedShortSlide active={active} onNext={onNext} />;
  }

  const videoUrl = video.video_url;

  if (!active) return <Poster video={video} />;

  // ── 1. YouTube — always embed, regardless of source_platform
  if (videoUrl && /youtu\.be|youtube\.com/i.test(videoUrl) && !err) {
    const src = buildYTEmbed(videoUrl);
    if (src) return (
      <iframe
        key={`yt-${video.id}`}
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={() => setErr(true)}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#000' }}
      />
    );
  }

  // ── 2. HLS manifest (CDN chunks — this is where converted
  //      Instagram-sourced videos land after transcoding)
  if (videoUrl && isHLS(videoUrl) && !err) {
    return (
      <HLSPlayer
        src={videoUrl}
        active={active}
        poster={video.thumbnail_url}
        paused={paused}
      />
    );
  }

  // ── 3. Direct mp4/webm video_url
  if (videoUrl && isDirectVideo(videoUrl) && !err) {
    return (
      <DirectPlayer
        src={videoUrl}
        active={active}
        poster={video.thumbnail_url}
        paused={paused}
      />
    );
  }

  // ── 4. Fallback — no playable video_url yet (e.g. still processing)
  const platform = video.source_platform || detectPlatform(videoUrl);
  const pmeta = PMETA[platform];
  const rawUrl = videoUrl || video.source_url;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {video.thumbnail_url && <img src={video.thumbnail_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />}
      <div style={{ position: 'relative', textAlign: 'center', padding: 24 }}>
        <div style={{ color: T.text, fontSize: 15, fontFamily: "'Geist',sans-serif", fontWeight: 600, marginBottom: 18 }}>
          Watch on {pmeta?.label || 'original platform'}
        </div>
        {rawUrl && (
          <a href={rawUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 99, background: pmeta?.color || T.accent, color: '#fff', textDecoration: 'none', fontFamily: "'Geist',sans-serif", fontWeight: 700, fontSize: 14 }}>
            Open Video ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────
function TopBar({ onBack, total, activeIdx, hasMore }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, padding: 'max(24px, env(safe-area-inset-top, 24px)) 16px 12px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)', display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'none' }}>
      <button onClick={onBack} style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', width: 34, height: 34, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 800, fontSize: 17, color: '#fff' }}>Shorts</span>
    </div>
  );
}

// ─── Side Rail ────────────────────────────────────────────────
function SideRail({ video, onLike, onSave, onShare, onComment, onMore, navigate }) {
  if (!video) return null;
  const actions = [
    { key: 'like', icon: (on) => (<ClapIcon size={38} color={on ? T.red : 'currentColor'} filled={on} />), label: fmtN(video.likes_count), on: video.viewer_liked, color: T.red, action: onLike },
    { key: 'comment', icon: () => (<svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>), label: video.comments_count > 0 ? fmtN(video.comments_count) : 'Comment', on: false, color: T.accent, action: onComment },
    { key: 'save', icon: (on) => (<svg width="27" height="27" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>), label: video.viewer_saved ? 'Saved' : 'Save', on: video.viewer_saved, color: T.warn, action: onSave },
    { key: 'share', icon: () => (<svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>), label: 'Share', on: false, color: T.green, action: onShare },
    { key: 'more', icon: () => (<MoreVertical size={27} color="#fff" />), label: 'More', on: false, color: '#fff', action: onMore },
  ];
  return (
    <div className="side-rail" style={{ position: 'absolute', right: 12, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transition: 'top 0.22s ease' }}>
      <div onClick={() => video.creator_username && navigate(`/u/${video.creator_username}`)} style={{ width: 46, height: 46, borderRadius: '50%', border: '2.5px solid #fff', overflow: 'hidden', cursor: 'pointer', background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
        {video.creator_avatar ? <img src={video.creator_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (video.creator_name || '?')[0].toUpperCase()}
      </div>
      {actions.map(a => (
        <button key={a.key} onClick={a.action} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: a.on ? a.color : '#fff', transition: 'transform 0.15s, color 0.15s' }}>
          {a.icon(a.on)}
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: a.on ? a.color : T.sub }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function ShortOptionsSheet({ isOpen, onClose, video, user, onNotInterested, onOpenReport, onDeleteShort, navigate }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !video) return null;

  const currentUserId = user?.id || user?.user_id;
  const currentUsername = user?.username;
  const isAdmin = user?.role === 'admin';

  const authorIdStr = video.user_id || video.creator_id ? String(video.user_id || video.creator_id).trim() : '';
  const currentUserIdStr = currentUserId ? String(currentUserId).trim() : '';
  const authorUsernameStr = video.creator_username ? String(video.creator_username).trim().toLowerCase() : '';
  const currentUsernameStr = currentUsername ? String(currentUsername).trim().toLowerCase() : '';

  const isOwner = Boolean(
    user && (
      (authorIdStr && currentUserIdStr && currentUserIdStr === authorIdStr) ||
      (authorUsernameStr && currentUsernameStr && currentUsernameStr === authorUsernameStr) ||
      isAdmin
    )
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteShort) {
        await onDeleteShort(video.id);
      } else {
        await api.delete(`/videos/${video.id}`);
        toast.success('Short deleted successfully');
      }
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('[ShortOptionsSheet.handleDelete]', err);
      toast.error('Failed to delete short: Unauthorized');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.15s ease',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 450,
            background: '#161B22',
            borderRadius: '20px 20px 0 0',
            padding: '20px 18px 30px',
            border: '1px solid rgba(255,255,255,0.12)',
            borderBottom: 'none',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Owner ONLY: Edit & Delete. NEVER Report. */}
            {isOwner ? (
              <>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/creator/dashboard?edit=${video.id}`);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    color: '#00B4D8', fontSize: 14, fontWeight: 600,
                    fontFamily: "'Geist', sans-serif", cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,180,216,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Edit3 size={18} color="#00B4D8" />
                  <span>Edit Short</span>
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    color: '#ef4444', fontSize: 14, fontWeight: 600,
                    fontFamily: "'Geist', sans-serif", cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Flag size={18} color="#ef4444" style={{ display: 'none' }} />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  <span>Delete Short</span>
                </button>
              </>
            ) : (
              /* Non-Owner ONLY: Not Interested & Report. NEVER Edit or Delete. */
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNotInterested(video.id);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    fontFamily: "'Geist', sans-serif", cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <EyeOff size={18} color="#f59e0b" />
                  <span>Not Interested</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenReport();
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    color: '#ff4757', fontSize: 14, fontWeight: 600,
                    fontFamily: "'Geist', sans-serif", cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Flag size={18} color="#ff4757" />
                  <span>Report Short</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && isOwner && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 400,
              background: '#161B22', borderRadius: 16,
              padding: 24, border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700 }}>Delete Short?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this short? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: '9px 18px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '9px 20px', borderRadius: 10,
                  background: '#ef4444', border: 'none',
                  color: '#fff', fontWeight: 600, fontSize: 14,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Bottom Caption ───────────────────────────────────────────
function BottomCaption({ video, navigate }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { setExpanded(false); }, [video?.id]);
  if (!video) return null;
  const platform = video.source_platform || detectPlatform(video.source_url || video.video_url);
  const pmeta    = PMETA[platform];
  return (
    <div className="bottom-caption" style={{ position: 'absolute', left: 0, right: 0, zIndex: 95, padding: '24px 16px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)', pointerEvents: 'none', transition: 'bottom 0.22s ease' }}>
      <div style={{ pointerEvents: 'auto', paddingRight: 64 }}>
        <div onClick={() => video.creator_username && navigate(`/u/${video.creator_username}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.7)', overflow: 'hidden', flexShrink: 0, background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {video.creator_avatar ? <img src={video.creator_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (video.creator_name || '?')[0].toUpperCase()}
          </div>
          <span style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 14, color: '#fff' }}>@{video.creator_username || video.creator_name || 'creator'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill={T.accent}/><path d="M6.5 12.5l3.5 3.5 7.5-7.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {pmeta && (
            <a
              href={video.source_url || video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 99,
                background: `${pmeta.color}28`,
                color: pmeta.color,
                border: `1px solid ${pmeta.color}55`,
                fontFamily: "'JetBrains Mono',monospace",
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${pmeta.color}44`;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${pmeta.color}28`;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {pmeta.icon()}
              <span>{pmeta.label.toUpperCase()}</span>
            </a>
          )}
        </div>
        <div style={{ fontFamily: "'Geist',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.4, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</div>
        
        <div style={{ minHeight: expanded ? 0 : 38, transition: 'min-height 0.25s ease' }}>
          {video.description && (
            <div>
              <div style={{ fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif", fontSize: 13, color: T.sub, lineHeight: 1.5, maxHeight: expanded ? '160px' : '2.25em', overflow: 'hidden', transition: 'max-height 0.25s ease', overflowY: expanded ? 'auto' : 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>{video.description}</div>
              {video.description.length > 72 && (<button onClick={() => setExpanded(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif", padding: '1px 0', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{expanded ? 'less' : 'more'}</button>)}
            </div>
          )}
          {!expanded && video.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', height: 18, overflow: 'hidden' }}>
              {video.tags.slice(0, 3).map(tag => (<span key={tag} style={{ fontSize: 11, color: T.accent, fontFamily: "'JetBrains Mono',monospace" }}>#{tag}</span>))}
            </div>
          )}
        </div>
        
        <div style={{ marginTop: 5, fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono',monospace" }}>
          {timeAgo(video.created_at)}{video.duration_formatted && ` · ${video.duration_formatted}`}
        </div>
      </div>
    </div>
  );
}



function NavArrows({ onUp, onDown, disabledUp, disabledDown }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const h = () => setVisible(window.innerWidth >= 1024);
    h();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  if (!visible) return null;

  const btn = (onClick, disabled, dir) => (
    <button onClick={onClick} disabled={disabled} style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(25,25,30,0.9)', color: disabled ? 'rgba(255,255,255,0.15)' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = `${T.accent}60`; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4), 0 0 12px ${T.accent}30`; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)'; }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{dir === 'up' ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}</svg>
    </button>
  );
  return (
    <div style={{ position: 'fixed', right: 'max(calc(50% - 280px), 24px)', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 95 }}>
      {btn(onUp, disabledUp, 'up')}
      {btn(onDown, disabledDown, 'down')}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function ShortsPage() {
  const { id: initialId } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const { trackVideoEvent, GA_EVENTS } = useAnalytics();
  const { openSaveToContainer } = useSaveToContainer();

  const [shorts,      setShorts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [cursor,      setCursor]      = useState(null);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [videoState,  setVideoState]  = useState({});
  const [cmtOpen,     setCmtOpen]     = useState(false);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [clappingAnims, setClappingAnims] = useState([]);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const containerRef = useRef(null);
  const slideRefs    = useRef([]);
  const activeRef    = useRef(0);
  const settleTimer  = useRef(null);
  const lastUrlId    = useRef(null);
  const lastTapRef   = useRef({ time: 0, videoId: null });
  const longPressTimer = useRef(null);

  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const getVS = useCallback((video) => ({
    liked:       videoState[video.id]?.liked       ?? video.viewer_liked  ?? false,
    saved:       videoState[video.id]?.saved       ?? video.viewer_saved  ?? false,
    likes_count: videoState[video.id]?.likes_count ?? video.likes_count   ?? 0,
  }), [videoState]);

  useEffect(() => {
    if (location.state?.shorts && location.state.shorts.length > 0) {
      const list = location.state.shorts;
      const start = location.state.startIndex || 0;
      setShorts(list);
      setActiveIdx(start);
      activeRef.current = start;
      setSearchQuery(location.state.query || '');
      setHasMore(location.state.hasMore !== undefined ? location.state.hasMore : true);
      setLoading(false);

      if (start > 0) {
        requestAnimationFrame(() => {
          slideRefs.current[start]?.scrollIntoView({ behavior: 'instant' });
        });
      }
      return;
    }

    setLoading(true);
    const p = new URLSearchParams({ limit: '12' });
    if (initialId) p.set('startId', initialId);

    const fetchTargetVideoIfNeeded = async (list) => {
      if (!initialId) return list;
      const found = list.some(v => String(v.id) === String(initialId));
      if (found) return list;

      try {
        const res = await api.get(`/videos/${initialId}`);
        const singleVideo = res.data.video || res.data;
        if (singleVideo && singleVideo.id) {
          return [singleVideo, ...list.filter(v => String(v.id) !== String(initialId))];
        }
      } catch (e) {
        console.warn('Could not fetch target short by ID, using removed placeholder:', e);
        const removedPlaceholder = {
          id: initialId,
          title: 'Short Removed',
          moderation_status: 'removed',
          status: 'archived',
        };
        return [removedPlaceholder, ...list.filter(v => String(v.id) !== String(initialId))];
      }
      return list;
    };

    api.get(`/videos/shorts?${p}`)
      .then(async r => {
        let list = r.data.videos || r.data.shorts || [];
        list = await fetchTargetVideoIfNeeded(list);

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
  }, [initialId, location.state]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      let best = null;
      for (const e of entries) {
        if (e.intersectionRatio >= 0.5) {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
      }
      if (!best) return;
      const idx = slideRefs.current.findIndex(el => el === best.target);
      if (idx < 0 || idx === activeRef.current) return;
      setActiveIdx(idx);
      activeRef.current = idx;
      const v = shorts[idx];
      if (v) {
        trackVideoEvent(GA_EVENTS.SHORT_VIEW, {
          id: v.id,
          title: v.title,
          creatorId: v.creator_id,
          isShort: true,
          extra: { index: idx }
        });
      }
      if (v && String(v.id) !== lastUrlId.current) {
        lastUrlId.current = String(v.id);
        window.history.replaceState(null, '', `/shorts/${v.id}`);
      }
    }, { threshold: [0.5] });
    slideRefs.current.forEach(el => { if (el) obs.observe(el); });
    return () => { obs.disconnect(); };
  }, [shorts.length]);

  useEffect(() => {
    if (activeIdx >= shorts.length - 3 && hasMore && !loadingMore) {
      setLoadingMore(true);
      if (searchQuery) {
        api.get('/search/section', {
          params: { q: searchQuery, type: 'shorts', offset: shorts.length, limit: 10 }
        })
          .then(r => {
            const list = r.data.items || [];
            setShorts(prev => [...prev, ...list]);
            setHasMore(r.data.hasMore || false);
          })
          .catch(console.error)
          .finally(() => setLoadingMore(false));
      } else if (cursor) {
        api.get(`/videos/shorts?limit=10&cursor=${encodeURIComponent(cursor)}`)
          .then(r => {
            const list = r.data.videos || r.data.shorts || [];
            setShorts(prev => [...prev, ...list]);
            setCursor(r.data.cursor || null);
            setHasMore(Boolean(r.data.has_more));
          })
          .catch(console.error)
          .finally(() => setLoadingMore(false));
      } else {
        setLoadingMore(false);
      }
    }
  }, [activeIdx, shorts.length, hasMore, loadingMore, cursor, searchQuery]);

  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowDown' || e.key === 'j') slideRefs.current[Math.min(activeRef.current + 1, shorts.length - 1)]?.scrollIntoView({ behavior: 'smooth' });
      if (e.key === 'ArrowUp'   || e.key === 'k') slideRefs.current[Math.max(activeRef.current - 1, 0)]?.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [shorts.length]);

  // Wheel handler removed — native CSS scroll-snap handles snap scrolling.
  // The previous JS wheel interceptor (debouncing with 600ms cooldown)
  // was the root cause of the 'short, distinct scroll motions' UX bug.
  const handleLike = useCallback(async (video) => {
    if (!user) { navigate('/login'); return; }
    const prev = getVS(video);
    const next = !prev.liked;
    setVideoState(s => ({ ...s, [video.id]: { ...prev, liked: next, likes_count: prev.likes_count + (next ? 1 : -1) } }));
    trackVideoEvent(GA_EVENTS.SHORT_CLAP, {
      id: video.id,
      title: video.title,
      creatorId: video.creator_id,
      isShort: true,
      extra: { action: next ? 'like' : 'unlike' }
    });
    try { await api.post(`/videos/${video.id}/like`); }
    catch { setVideoState(s => ({ ...s, [video.id]: prev })); }
  }, [user, navigate, getVS, trackVideoEvent, GA_EVENTS]);

  const startLongPress = useCallback(() => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
    }, 260);
  }, []);

  const stopLongPress = useCallback(() => {
    clearTimeout(longPressTimer.current);
    setIsLongPressing(false);
  }, []);

  const handleDoubleTap = useCallback((e, video) => {
    stopLongPress();
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? (e.clientX - rect.left) : (rect.width / 2);
    const y = e.clientY ? (e.clientY - rect.top) : (rect.height / 2);

    if (lastTapRef.current.videoId === video.id && (now - lastTapRef.current.time) < 320) {
      const vs = getVS(video);
      if (!vs.liked) {
        handleLike(video);
      }
      const animId = Date.now() + Math.random();
      setClappingAnims(prev => [...prev, { id: animId, videoId: video.id, x, y }]);
      setTimeout(() => {
        setClappingAnims(prev => prev.filter(a => a.id !== animId));
      }, 750);
      lastTapRef.current = { time: 0, videoId: null };
    } else {
      lastTapRef.current = { time: now, videoId: video.id };
    }
  }, [handleLike, getVS, stopLongPress]);

  const handleSave = useCallback((video) => {
    if (!user) { navigate('/login'); return; }
    const prev = getVS(video);
    setVideoState(s => ({ ...s, [video.id]: { ...prev, saved: true } }));
    openSaveToContainer({
      id: video.id,
      title: video.title || 'Short',
      type: 'short',
      item_kind: 'short',
      thumbnail_url: video.thumbnail_url || null,
      creator_name: video.channel_title || video.creator_name || 'Creator',
    });
  }, [user, navigate, getVS, openSaveToContainer]);

  const handleShare = useCallback((video) => {
    if (video) {
      trackVideoEvent(GA_EVENTS.SHORT_SHARE, {
        id: video.id,
        title: video.title,
        creatorId: video.creator_id,
        isShort: true,
      });
    }
    setShareOpen(true);
  }, [trackVideoEvent, GA_EVENTS]);

  const handleNotInterested = useCallback((videoId) => {
    toast.success("Got it. We'll show fewer shorts like this.");
    setShorts(prev => prev.filter(s => s.id !== videoId));
  }, []);

  const scrollTo = useCallback(idx => { slideRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' }); }, []);

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0f14', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ width: 'min(100vw, 450px)', height: '100dvh', background: '#000' }}>
        <ShortsSkeleton />
      </div>
    </div>
  );

  if (!shorts.length) return (
    <div style={{ height: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <span style={{ fontSize: 48 }}>⚡</span>
      <p style={{ color: T.sub, fontFamily: "'Geist',sans-serif", margin: 0 }}>No shorts yet — check back soon.</p>
      <button onClick={() => navigate(-1)} style={{ background: T.gradient, color: '#fff', border: 'none', borderRadius: 99, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontFamily: "'Geist',sans-serif" }}>← Go Back</button>
    </div>
  );

  const raw         = shorts[activeIdx];
  const vs          = raw ? getVS(raw) : {};
  const activeVideo = raw ? { ...raw, viewer_liked: vs.liked, viewer_saved: vs.saved, likes_count: vs.likes_count } : null;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes doubleTapPop {
          0% { transform: translate(-50%, -50%) scale(0.3) rotate(-15deg); opacity: 0; }
          40% { transform: translate(-50%, -60%) scale(1.3) rotate(0deg); opacity: 1; }
          70% { transform: translate(-50%, -70%) scale(1.1) rotate(5deg); opacity: 0.9; }
          100% { transform: translate(-50%, -90%) scale(1.4) rotate(0deg); opacity: 0; }
        }
        .sf::-webkit-scrollbar{display:none}
        .bottom-caption { bottom: calc(64px + env(safe-area-inset-bottom, 0px)); z-index: 95; }
        .side-rail { bottom: calc(118px + env(safe-area-inset-bottom, 0px)); z-index: 100; }
        @media (min-width: 901px) {
          .bottom-caption { bottom: 12px; z-index: 95; }
          .side-rail { bottom: 64px; z-index: 100; }
        }
      `}</style>
      <Helmet><title>{activeVideo ? `${activeVideo.title} — CPA Shorts` : 'Shorts — CPA'}</title></Helmet>

      {/* Desktop Navigation Arrows (floating outside the player) */}
      <NavArrows onUp={() => scrollTo(Math.max(activeIdx - 1, 0))} onDown={() => scrollTo(Math.min(activeIdx + 1, shorts.length - 1))} disabledUp={activeIdx === 0} disabledDown={activeIdx === shorts.length - 1 && !hasMore} />

      {copied && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.88)', color: T.green, padding: '9px 20px', borderRadius: 99, zIndex: 999, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, border: `1px solid ${T.green}44`, whiteSpace: 'nowrap' }}>
          ✓ Link copied!
        </div>
      )}

      {/* Main viewport alignment wrapper for desktop centering */}
      <div style={{ position: 'fixed', inset: 0, background: '#0b0f14', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', zIndex: 1 }}>
        
        {/* Aspect-ratio locked player container */}
        <div style={{ position: 'relative', width: 'min(100vw, 450px)', maxWidth: '450px', height: '100dvh', background: '#000', overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.7)', borderRadius: 'clamp(0px, (100vw - 451px) * 999, 12px)' }}>
          
          <div style={{ opacity: isLongPressing ? 0 : 1, transition: 'opacity 0.22s ease', pointerEvents: isLongPressing ? 'none' : 'auto' }}>
            <TopBar onBack={() => navigate(-1)} total={shorts.length} activeIdx={activeIdx} hasMore={hasMore} />
            <SideRail video={activeVideo} onLike={() => raw && handleLike(raw)} onSave={() => raw && handleSave(raw)} onShare={() => raw && handleShare(raw)} onComment={() => setCmtOpen(true)} onMore={() => setMoreSheetOpen(true)} navigate={navigate} />
            <BottomCaption video={activeVideo} navigate={navigate} />
          </div>

          <CommentSheet
            isOpen={cmtOpen}
            onClose={() => setCmtOpen(false)}
            entityId={activeVideo?.id}
            entityType="video"
            user={user}
          />

          <ShortOptionsSheet
            isOpen={moreSheetOpen}
            onClose={() => setMoreSheetOpen(false)}
            video={activeVideo}
            user={user}
            onNotInterested={handleNotInterested}
            onOpenReport={() => setReportModalOpen(true)}
            navigate={navigate}
          />

          <ReportModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            contentId={activeVideo?.id}
            contentType="short"
          />

          <ShareSheet
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            contentType="short"
            contentId={activeVideo?.id}
            contentTitle={activeVideo?.title || activeVideo?.description || ''}
            contentThumbnail={activeVideo?.thumbnail_url || null}
            contentAuthor={activeVideo?.author_name || activeVideo?.author_username || ''}
          />

          <div ref={containerRef} className="sf" style={{ position: 'absolute', inset: 0, overflowY: 'scroll', scrollSnapType: 'y mandatory', background: '#000', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', zIndex: 1 }}>
            {shorts.map((video, idx) => {
              const isActive = idx === activeIdx;
              const ovs = getVS(video);
              const enriched = { ...video, viewer_liked: ovs.liked, viewer_saved: ovs.saved, likes_count: ovs.likes_count };
              return (
                <div
                  key={video.id}
                  ref={el => { slideRefs.current[idx] = el; }}
                  onClick={(e) => handleDoubleTap(e, video)}
                  onMouseDown={startLongPress}
                  onMouseUp={stopLongPress}
                  onMouseLeave={stopLongPress}
                  onTouchStart={startLongPress}
                  onTouchEnd={stopLongPress}
                  onTouchCancel={stopLongPress}
                  style={{ height: '100dvh', width: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', background: '#000', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}
                >
                  <ShortPlayer video={enriched} active={isActive} paused={isActive && isLongPressing} onNext={() => scrollTo(idx + 1)} />
                  {clappingAnims.filter(a => a.videoId === video.id).map(anim => (
                    <div
                      key={anim.id}
                      style={{
                        position: 'absolute',
                        left: anim.x,
                        top: anim.y,
                        pointerEvents: 'none',
                        zIndex: 9999,
                        animation: 'doubleTapPop 0.75s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        filter: 'drop-shadow(0 4px 16px rgba(255, 71, 87, 0.75))',
                      }}
                    >
                      <ClapIcon size={84} color="#FF4757" filled />
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Continuous Loading Skeleton Item at bottom when scrolling */}
            {hasMore && (
              <div style={{ height: '100dvh', width: '100%', scrollSnapAlign: 'start', position: 'relative', background: '#000' }}>
                <ShortsSkeleton />
              </div>
            )}

            {!hasMore && shorts.length > 0 && (
              <div style={{ height: '50dvh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, scrollSnapAlign: 'start' }}>
                <span style={{ fontSize: 32 }}>⚡</span>
                <span style={{ color: T.muted, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>You're all caught up</span>
                <button onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 99, padding: '8px 20px', cursor: 'pointer', color: T.sub, fontFamily: "'Geist',sans-serif", fontSize: 13 }}>Back to top ↑</button>
              </div>
            )}
          </div>

          <MobileBottomNav />
        </div>
      </div>
    </>
  );
}
