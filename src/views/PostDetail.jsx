'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  MessageCircle,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Send,
  Github,
  Star,
  GitFork,
  ExternalLink,
  Download,
  Terminal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClapIcon from '../components/icons/ClapIcon';
import Avatar from '../components/ui/Avatar';
import { PostCardSkeleton, Skeleton } from '../components/ui/Skeleton';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSaveToContainer } from '../context/SaveToContainerContext';
import toast from 'react-hot-toast';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import useMediaQuery from '../hooks/useMediaQuery';
import CommentSheet from '../components/ui/CommentSheet';
import ShareSheet from '../components/ui/ShareSheet';
import RemovedContentPage from '../components/ui/RemovedContentPage';
import CodeSnippetCard, { extractCodeBlock } from '../components/posts/CodeSnippetCard';
import { MediaCarousel } from '../components/posts/PostCard';

/* ─── Design Tokens (CSS Variables - Theme Agnostic) ─── */
const F = {
  headline: 'var(--font-head, "Space Grotesk", sans-serif)',
  body: 'var(--font-body, "Geist", -apple-system, sans-serif)',
  label: 'var(--font-mono, "JetBrains Mono", monospace)',
};

const T = {
  bg: 'var(--bg, #0f172a)',
  surface: 'var(--surface, #1e293b)',
  card: 'var(--card, #1e293b)',
  border: 'var(--border, rgba(255, 255, 255, 0.08))',
  text: 'var(--text, #f8fafc)',
  textMuted: 'var(--text-muted, #94a3b8)',
  primary: 'var(--primary, #6366f1)',
  accent: 'var(--accent, #3b82f6)',
  warning: 'var(--warning, #f59e0b)',
  success: 'var(--success, #22c55e)',
};

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}w ago`;
}

function formatVideoTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* ══════════════════════════════════════════════
   CUSTOM VIDEO PLAYER FOR POST DETAIL
══════════════════════════════════════════════ */
function PostDetailVideoPlayer({ videoUrl, posterUrl, aspectRatio = '4:5', onDoubleTap }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Compute CSS aspect ratio
  const cssRatio = aspectRatio === '4:5' ? '4/5'
    : aspectRatio === '3:4' ? '3/4'
    : aspectRatio === '1:1' ? '1/1'
    : aspectRatio === '9:16' ? '9/16'
    : '16/9';

  // HLS Stream Attachment
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoUrl) return;

    let hls = null;
    let cancelled = false;

    if (videoUrl.includes('.m3u8')) {
      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = videoUrl;
      } else {
        import('hls.js').then(({ default: Hls }) => {
          if (cancelled) return;
          if (Hls.isSupported()) {
            hls = new Hls({ maxBufferLength: 30 });
            hls.loadSource(videoUrl);
            hls.attachMedia(videoEl);
            hlsRef.current = hls;
          }
        });
      }
    } else {
      videoEl.src = videoUrl;
    }

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  // Autoplay on mount (muted)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = isMuted;
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isMuted]);

  const togglePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoEl.paused) {
      videoEl.play();
      setIsPlaying(true);
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    if (!isSeeking && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
        aspectRatio: cssRatio,
        maxHeight: 'min(82dvh, 760px)',
        background: '#000000',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        poster={posterUrl}
        playsInline
        loop
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        onDoubleClick={onDoubleTap}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          cursor: 'pointer',
        }}
      />

      {/* Center Play Button Overlay (when paused) */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlay}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.35)',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              <Play size={28} color="#ffffff" fill="#ffffff" style={{ marginLeft: 3 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Custom Bottom Controls Bar (Matches Reference UI) ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 20,
        opacity: showControls || !isPlaying ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}>
        {/* Play / Pause Toggle */}
        <button
          type="button"
          onClick={togglePlay}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} fill="#ffffff" /> : <Play size={18} fill="#ffffff" />}
        </button>

        {/* Time Display: 0:03 / 0:15 */}
        <div style={{
          fontFamily: F.label,
          fontSize: 12,
          fontWeight: 600,
          color: '#f8fafc',
          whiteSpace: 'nowrap',
          letterSpacing: 0.5,
          userSelect: 'none',
        }}>
          {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
        </div>

        {/* Purple Scrub Bar */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onTouchStart={() => setIsSeeking(true)}
            onTouchEnd={() => setIsSeeking(false)}
            style={{
              width: '100%',
              height: 5,
              borderRadius: 3,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #a855f7 ${progressPercent}%, rgba(255, 255, 255, 0.25) ${progressPercent}%)`,
              outline: 'none',
              cursor: 'pointer',
              margin: 0,
            }}
          />
        </div>

        {/* Mute Button */}
        <button
          type="button"
          onClick={toggleMute}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #c084fc;
          border: 2px solid #ffffff;
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.8);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #c084fc;
          border: 2px solid #ffffff;
          box-shadow: 0 0 8px rgba(168, 85, 247, 0.8);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   GITHUB REPO CARD
══════════════════════════════════════════════ */
function GitHubRepoCard({ url }) {
  const [data, setData] = useState(null);
  const match = url?.match(/github\.com\/([^/]+\/[^/]+)/);
  const repo = match?.[1];

  useEffect(() => {
    if (!repo) return;
    fetch(`https://api.github.com/repos/${repo}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [repo]);

  if (!repo) return null;

  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none', marginTop: 16 }}>
      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Github size={15} color={T.textMuted} />
          <span style={{ fontFamily: F.label, fontSize: 12, fontWeight: 600, color: T.accent }}>{repo}</span>
          <ExternalLink size={12} color={T.textMuted} style={{ marginLeft: 'auto' }} />
        </div>
        {data ? (
          <>
            {data.description && (
              <p style={{ fontFamily: F.body, fontSize: 13, color: T.textMuted, lineHeight: 1.5, margin: '0 0 10px' }}>
                {data.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: 16, fontFamily: F.label, fontSize: 11, color: T.textMuted }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} color="#f59e0b" />
                {data.stargazers_count}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <GitFork size={12} color={T.primary} />
                {data.forks_count}
              </span>
              {data.language && <span>{data.language}</span>}
            </div>
          </>
        ) : (
          <Skeleton height={12} width="60%" />
        )}
      </div>
    </a>
  );
}

/* ══════════════════════════════════════════════
   VERTICAL ENGAGEMENT STACK (Matches Reference)
══════════════════════════════════════════════ */
function VerticalEngagementStack({
  clapCount,
  clapped,
  onClap,
  commentCount,
  onCommentClick,
  onShareClick,
  saved,
  onSave,
  isMobile,
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? 16 : 20,
      padding: isMobile ? '12px 6px' : '16px 8px',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 32,
      boxShadow: isMobile
        ? '0 8px 32px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0,0,0,0.3)'
        : '0 4px 20px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s ease',
      userSelect: 'none',
    }}>
      {/* ── Clap Action ── */}
      <button
        type="button"
        onClick={onClap}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="Clap"
      >
        <div style={{
          width: isMobile ? 42 : 46,
          height: isMobile ? 42 : 46,
          borderRadius: '50%',
          background: clapped ? 'rgba(59, 124, 255, 0.18)' : 'var(--card, #1e293b)',
          border: `1.5px solid ${clapped ? 'rgba(59, 124, 255, 0.5)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, background 0.2s ease, border-color 0.2s ease',
          boxShadow: clapped ? '0 0 16px rgba(59, 124, 255, 0.35)' : 'none',
        }}>
          <ClapIcon size={isMobile ? 26 : 28} filled={clapped} color={clapped ? 'var(--primary, #3B7CFF)' : 'var(--text, #f8fafc)'} />
        </div>
        <span style={{
          fontFamily: F.headline,
          fontSize: 12,
          fontWeight: 700,
          color: clapped ? 'var(--primary, #3B7CFF)' : 'var(--text, #f8fafc)',
        }}>
          {clapCount.toLocaleString()}
        </span>
        <span style={{
          fontFamily: F.body,
          fontSize: 10,
          fontWeight: 600,
          color: clapped ? 'var(--primary, #3B7CFF)' : 'var(--text-muted, #94a3b8)',
          marginTop: -3,
        }}>
          Claps
        </span>
      </button>

      {/* ── Comments Action ── */}
      <button
        type="button"
        onClick={onCommentClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="View Comments"
      >
        <div style={{
          width: isMobile ? 42 : 46,
          height: isMobile ? 42 : 46,
          borderRadius: '50%',
          background: 'var(--card, #1e293b)',
          border: '1.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, background 0.2s ease',
        }}>
          <MessageCircle size={isMobile ? 20 : 22} color="var(--text, #f8fafc)" />
        </div>
        <span style={{
          fontFamily: F.headline,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text, #f8fafc)',
        }}>
          {commentCount.toLocaleString()}
        </span>
        <span style={{
          fontFamily: F.body,
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted, #94a3b8)',
          marginTop: -3,
        }}>
          Comments
        </span>
      </button>

      {/* ── Share Action ── */}
      <button
        type="button"
        onClick={onShareClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="Share Post"
      >
        <div style={{
          width: isMobile ? 42 : 46,
          height: isMobile ? 42 : 46,
          borderRadius: '50%',
          background: 'var(--card, #1e293b)',
          border: '1.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, background 0.2s ease',
        }}>
          <Send size={isMobile ? 18 : 20} color="var(--text, #f8fafc)" style={{ transform: 'rotate(-20deg)', marginLeft: -2 }} />
        </div>
        <span style={{
          fontFamily: F.body,
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted, #94a3b8)',
        }}>
          Share
        </span>
      </button>

      {/* ── Save Action ── */}
      <button
        type="button"
        onClick={onSave}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title={saved ? 'Remove from Saved' : 'Save Post'}
      >
        <div style={{
          width: isMobile ? 42 : 46,
          height: isMobile ? 42 : 46,
          borderRadius: '50%',
          background: saved ? 'rgba(52, 199, 123, 0.18)' : 'var(--card, #1e293b)',
          border: `1.5px solid ${saved ? 'rgba(52, 199, 123, 0.5)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, background 0.2s ease, border-color 0.2s ease',
          boxShadow: saved ? '0 0 16px rgba(52, 199, 123, 0.35)' : 'none',
        }}>
          <Bookmark size={isMobile ? 18 : 20} color={saved ? 'var(--green, #34c77b)' : 'var(--text, #f8fafc)'} fill={saved ? 'var(--green, #34c77b)' : 'none'} />
        </div>
        <span style={{
          fontFamily: F.body,
          fontSize: 10,
          fontWeight: 600,
          color: saved ? 'var(--green, #34c77b)' : 'var(--text-muted, #94a3b8)',
        }}>
          {saved ? 'Saved' : 'Save'}
        </span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT: PostDetail
══════════════════════════════════════════════ */
export default function PostDetail({ overrideId } = {}) {
  const params = useParams();
  const id = overrideId || params.id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openSaveToContainer } = useSaveToContainer();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clapped, setClapped] = useState(false);
  const [clapCount, setClapCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 899px)');

  useEffect(() => {
    if (id === 'publish') {
      navigate(`/posts/publish${window.location.search}`, { replace: true });
      return;
    }
    if (id === 'new') {
      navigate('/posts/new', { replace: true });
      return;
    }

    setLoading(true);
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    const endpoint = isUuid ? `/posts/${id}` : `/posts/slug/${id}`;

    api.get(endpoint)
      .then((r) => {
        const p = r.data.post;
        setPost(p);
        setClapped(p.is_clapped || false);
        setClapCount(parseInt(p.clap_count) || 0);
        setSaved(p.is_saved || false);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    api.get(`/posts/${id}/comments`)
      .then((r) => setComments(r.data.comments || []))
      .catch(() => {});
  }, [id]);

  const handleClap = async () => {
    if (!user) {
      toast.error('Please sign in to clap!');
      return;
    }
    if (!post) return;
    const was = clapped;
    setClapped(!was);
    setClapCount(was ? clapCount - 1 : clapCount + 1);

    try {
      if (was) await api.delete(`/posts/${post.id}/clap`);
      else await api.post(`/posts/${post.id}/clap`);
    } catch {
      setClapped(was);
      setClapCount(clapCount);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save posts!');
      return;
    }
    if (!post) return;
    setSaved(!saved);

    try {
      if (saved) {
        await api.delete(`/saved/${post.id}`);
        toast.success('Post removed from saved');
      } else {
        await api.post(`/saved/${post.id}`);
        toast.success('Post saved!');
      }
    } catch {
      setSaved(saved);
    }
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  /* ─── LOADING STATE ─── */
  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', padding: '72px 16px 120px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    );
  }

  /* ─── REMOVED OR NOT FOUND ─── */
  if (
    !post ||
    ['removed', 'temporarily_removed', 'taken_down', 'suspended'].includes((post.moderation_status || '').toLowerCase()) ||
    post.status === 'archived'
  ) {
    return (
      <RemovedContentPage
        title="Post Removed"
        message="This post was removed or taken down for violating community guidelines."
        backUrl="/feed"
      />
    );
  }

  // Extract and normalize all media items (handles post.media, post.files, post.thumbnail_url)
  const rawMedia = (post.media && post.media.length > 0)
    ? post.media
    : (post.files && post.files.length > 0)
      ? post.files
      : (post.thumbnail_url ? [{ storage_url: post.thumbnail_url, file_type: 'image/jpeg' }] : []);

  const normalizedFiles = rawMedia.map((m) => {
    const src = m.media_url || m.storage_url || m.url || (typeof m === 'string' ? m : '');
    const isVid = m.media_type === 'video' ||
      m.file_type?.startsWith('video/') ||
      /\.(mp4|mov|webm|mkv|m3u8)/i.test(src);
    return {
      storage_url: src,
      url: src,
      media_url: src,
      file_type: isVid ? 'video/mp4' : (m.media_type || m.file_type || 'image/jpeg'),
      media_type: isVid ? 'video' : 'image',
      aspect_ratio: m.aspect_ratio || post.aspect_ratio || '1:1',
    };
  }).filter((f) => Boolean(f.storage_url));

  // Detect video content
  const videoMediaItem = normalizedFiles.find((m) => m.media_type === 'video');
  const hasDirectVideoThumb = post.thumbnail_url && (post.thumbnail_url.includes('.mp4') || post.thumbnail_url.includes('.m3u8'));
  const isVideoPost = Boolean(
    post.type === 'video' ||
    post.type === 'short' ||
    Boolean(post.video_url) ||
    Boolean(videoMediaItem) ||
    Boolean(hasDirectVideoThumb)
  );

  const videoStreamUrl = post.video_url ||
    videoMediaItem?.storage_url ||
    (hasDirectVideoThumb ? post.thumbnail_url : null) ||
    null;

  const imageFiles = normalizedFiles.filter((m) => m.media_type !== 'video');
  const singleImageSrc = !isVideoPost
    ? (imageFiles[0]?.storage_url || post.thumbnail_url || null)
    : null;
  const isCarousel = !isVideoPost && imageFiles.length > 1;

  // Extract code snippet if present in description
  const { code: extractedCode, language: extractedLang, cleanedText } = extractCodeBlock(post.description || '');
  const displayCaption = extractedCode ? cleanedText : post.description;

  const typeLabel = post.type
    ? post.type.charAt(0).toUpperCase() + post.type.slice(1)
    : (isVideoPost ? 'Video' : 'Post');

  return (
    <>
      <Helmet>
        <title>{post.title || 'Post'} — FocusGram</title>
        <meta name="description" content={post.description || 'Community post on FocusGram'} />
        <meta property="og:title" content={post.title || 'Post'} />
      </Helmet>

      {/* ═══════════════════════════════════════
          1. TOP NAVIGATION HEADER (Matches Reference)
      ═══════════════════════════════════════ */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--bg, #0f172a)',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Left: Back Arrow + Category Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--surface, #1e293b)',
              border: `1px solid ${T.border}`,
              color: T.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{
            fontFamily: F.headline,
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            fontWeight: 700,
            color: T.text,
          }}>
            {typeLabel}
          </span>
        </div>

        {/* Right: Share & Save Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 20,
              background: 'var(--surface, #1e293b)',
              border: `1px solid ${T.border}`,
              color: T.text,
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Send size={14} style={{ transform: 'rotate(-20deg)' }} /> Share
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 20,
              background: saved ? 'rgba(52, 199, 123, 0.15)' : 'var(--surface, #1e293b)',
              border: `1px solid ${saved ? 'rgba(52, 199, 123, 0.4)' : T.border}`,
              color: saved ? 'var(--green, #34c77b)' : T.text,
              fontFamily: F.body,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Bookmark size={14} fill={saved ? 'var(--green, #34c77b)' : 'none'} color={saved ? 'var(--green, #34c77b)' : 'currentColor'} /> {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          2. MAIN CONTENT LAYOUT (With Right Engagement Column)
      ═══════════════════════════════════════ */}
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: isMobile ? '12px 14px 120px' : '16px 16px 100px',
        display: 'flex',
        gap: isMobile ? 0 : 28,
        alignItems: 'flex-start',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        {/* Left / Center Column: Media & Full Post Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Media Section: Video / Carousel / Image */}
          {isVideoPost && videoStreamUrl ? (
            <PostDetailVideoPlayer
              videoUrl={videoStreamUrl}
              posterUrl={post.thumbnail_url}
              aspectRatio={post.aspect_ratio || '4:5'}
              onDoubleTap={handleClap}
            />
          ) : isCarousel ? (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <MediaCarousel files={imageFiles} aspectRatio={post.aspect_ratio || '1:1'} />
            </div>
          ) : singleImageSrc ? (
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: 760,
              margin: '0 auto',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'var(--s2, #070c18)',
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Ambient blurred backdrop so image fits perfectly without clipping or letterboxing */}
              <img
                src={singleImageSrc}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: -20,
                  width: 'calc(100% + 40px)',
                  height: 'calc(100% + 40px)',
                  objectFit: 'cover',
                  filter: 'blur(28px) brightness(0.35)',
                  transform: 'scale(1.15)',
                  pointerEvents: 'none',
                }}
              />
              <img
                src={singleImageSrc}
                alt={post.title || ''}
                loading="eager"
                decoding="async"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'auto',
                  maxHeight: 'min(82dvh, 760px)',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                  zIndex: 1,
                }}
              />
            </div>
          ) : null}

          {/* Tags Row: Type, Difficulty, Hashtags (Matches Reference) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {post.type && (
              <span style={{
                padding: '4px 12px',
                borderRadius: 16,
                fontFamily: F.label,
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#818cf8',
                textTransform: 'capitalize',
              }}>
                {post.type}
              </span>
            )}
            {post.difficulty && (
              <span style={{
                padding: '4px 12px',
                borderRadius: 16,
                fontFamily: F.label,
                fontSize: 11,
                fontWeight: 700,
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ade80',
                textTransform: 'capitalize',
              }}>
                {post.difficulty}
              </span>
            )}
            {post.tags && Array.isArray(post.tags) && post.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontFamily: F.label,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'var(--card, #1e293b)',
                  border: `1px solid ${T.border}`,
                  color: 'var(--accent, #38bdf8)',
                }}
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
          </div>

          {/* Post Title */}
          <h1 style={{
            fontFamily: F.headline,
            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
            fontWeight: 800,
            color: T.text,
            margin: '2px 0 0',
            lineHeight: 1.35,
          }}>
            {post.title}
          </h1>

          {/* Author Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to={`/u/${post.creator_username}`} style={{ textDecoration: 'none' }}>
              <Avatar
                src={post.creator_avatar}
                name={post.creator_name || post.creator_username}
                size={42}
                style={{ border: '2px solid rgba(99, 102, 241, 0.35)' }}
              />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link
                to={`/u/${post.creator_username}`}
                style={{
                  fontFamily: F.headline,
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.text,
                  textDecoration: 'none',
                }}
              >
                {post.creator_name || `@${post.creator_username}`}
              </Link>
              <span style={{
                fontFamily: F.body,
                fontSize: 12,
                color: T.textMuted,
                marginTop: 1,
              }}>
                @{post.creator_username} • {timeAgo(post.created_at)}
              </span>
            </div>
          </div>

          {/* Description Text with Preserved Line Breaks */}
          {displayCaption && (
            <div style={{
              fontFamily: F.body,
              fontSize: 14,
              lineHeight: 1.65,
              color: 'var(--text, #f8fafc)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: 'var(--card, #1e293b)',
              padding: '16px 18px',
              borderRadius: 14,
              border: `1px solid ${T.border}`,
            }}>
              {displayCaption}
            </div>
          )}

          {/* Extracted Code Snippet (if present in post) */}
          {extractedCode && (
            <div style={{ marginTop: 4 }}>
              <CodeSnippetCard
                code={extractedCode}
                language={extractedLang || post.language || 'javascript'}
                title={post.title}
              />
            </div>
          )}

          {/* GitHub Repo Card */}
          {post.github_repo_url && <GitHubRepoCard url={post.github_repo_url} />}

          {/* Downloadable File Attachments */}
          {post.files && post.files.length > 0 && (
            <div style={{
              background: 'var(--card, #1e293b)',
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              overflow: 'hidden',
              marginTop: 6,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{ fontFamily: F.label, fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Attachments ({post.files.length})
                </span>
                <Terminal size={14} color={T.accent} />
              </div>
              {post.files.map((file, i) => (
                <div
                  key={file.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < post.files.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                    <Download size={14} color={T.textMuted} />
                    <span style={{ fontFamily: F.label, fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.file_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const r = await api.get(`/posts/${post.id}/files/${file.id}/download`);
                        if (r.data.downloadUrl) window.open(r.data.downloadUrl, '_blank');
                      } catch {
                        toast.error('Failed to download file');
                      }
                    }}
                    style={{
                      fontFamily: F.label,
                      fontSize: 10,
                      fontWeight: 700,
                      color: T.accent,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Comment Drawer Trigger Bar (Matches Reference) */}
          <div
            onClick={() => setIsCommentsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'var(--card, #1e293b)',
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              cursor: 'pointer',
              marginTop: 8,
              transition: 'border-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 13, color: T.text, fontWeight: 600 }}>
              <MessageCircle size={16} color={T.accent} />
              <span>Intel Stream • {comments.length}</span>
            </div>
            <span style={{ fontFamily: F.label, fontSize: 11, fontWeight: 700, color: T.primary, letterSpacing: 0.5 }}>
              View Comments →
            </span>
          </div>

        </div>

        {/* Right Column: Vertical Engagement Stack (Steady like Shorts page) */}
        <div style={{
          width: isMobile ? 'auto' : 70,
          flexShrink: 0,
          position: isMobile ? 'fixed' : 'sticky',
          right: isMobile ? 12 : 'auto',
          bottom: isMobile ? 'calc(var(--mobile-nav-height, 65px) + 20px)' : 'auto',
          top: isMobile ? 'auto' : 84,
          zIndex: isMobile ? 85 : 30,
          height: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          <VerticalEngagementStack
            clapCount={clapCount}
            clapped={clapped}
            onClap={handleClap}
            commentCount={comments.length}
            onCommentClick={() => setIsCommentsOpen(true)}
            onShareClick={handleShare}
            saved={saved}
            onSave={handleSave}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          3. COMMENTS & SHARE SHEETS
      ═══════════════════════════════════════ */}
      <CommentSheet
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        entityId={post.id}
        entityType="post"
        user={user}
      />

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        contentType="post"
        contentId={post.id}
        contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : undefined}
        contentTitle={post.title || post.description || ''}
        contentThumbnail={post.thumbnail_url || null}
        contentAuthor={post.creator_name || post.creator_username || ''}
      />

      {isMobile && <MobileBottomNav />}
    </>
  );
}
