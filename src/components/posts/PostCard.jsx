import { useNavigate, useLocation } from 'react-router-dom';
import ContentActionMenu from '../ui/ContentActionMenu';
import { parsePostOverlayParams, buildPostOverlayUrl, clearPostOverlayUrl } from '../../utils/overlayUrl';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Volume2, 
  VolumeX, 
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import {
  clapGraphQLPost,
  unclapGraphQLPost,
  toggleGraphQLVideoLike,
  toggleGraphQLVideoSave,
} from '../../api/graphql';
import { useAuth } from '../../context/AuthContext';
import { useSaveToContainer } from '../../context/SaveToContainerContext';
import CommentSheet from '../ui/CommentSheet';
import ShareSheet from '../ui/ShareSheet';
import CodeSnippetCard, { extractCodeBlock } from './CodeSnippetCard';
import { toYouTubeEmbed } from '../../utils/videoEmbed';
import ClapIcon from '../icons/ClapIcon';

// Safely import toast without crashing if not installed
let toast = { success: () => {} };
try { toast = require('react-hot-toast').default; } catch {}

/* ── Global Feed Audio Coordinator (Instagram style sound persistence) ── */
let globalFeedMuted = true;
const audioSubscribers = new Set();

export function setGlobalFeedMuted(muted) {
  globalFeedMuted = muted;
  audioSubscribers.forEach(cb => {
    try { cb(muted); } catch (_) {}
  });
}

export function getGlobalFeedMuted() {
  return globalFeedMuted;
}

function timeAgo(date) {
  if (!date) return 'recently';
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}w`;
}

/* ── Verified Check Badge ────────────────────────────────────────── */
export const VerifiedBadge = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" fill="#0095f6" />
    <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Type Tag Badge ──────────────────────────────────────────────── */
const TAG_STYLES = {
  article:  { bg: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary, #3b82f6)', border: 'rgba(59, 130, 246, 0.25)' },
  course:   { bg: 'rgba(147, 51, 234, 0.12)', color: 'var(--accent-purple, #9333ea)', border: 'rgba(147, 51, 234, 0.25)' },
  resource: { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--green, #10b981)', border: 'rgba(16, 185, 129, 0.25)' },
  video:    { bg: 'rgba(239, 68, 68, 0.12)',  color: 'var(--red, #ef4444)', border: 'rgba(239, 68, 68, 0.25)' },
  short:    { bg: 'rgba(244, 63, 94, 0.12)',  color: '#f43f5e', border: 'rgba(244, 63, 94, 0.25)' },
  default:  { bg: 'var(--s2, rgba(255,255,255,0.06))', color: 'var(--sub, #94a3b8)', border: 'var(--border, rgba(255,255,255,0.1))' },
};

export function TypeTag({ type }) {
  const normalized = (type || '').toLowerCase();
  const tc = TAG_STYLES[normalized] || TAG_STYLES.default;
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '3px 8px',
        borderRadius: '6px',
        background: tc.bg,
        color: tc.color,
        border: `1px solid ${tc.border}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {type}
    </span>
  );
}

function parseCssAspectRatio(ratio, fallback = '1/1') {
  if (!ratio) return fallback;
  if (typeof ratio === 'number') return `${ratio}`;
  const str = String(ratio).trim().replace(':', '/');
  if (str === '4/5' || str === '3/4' || str === '1/1' || str === '16/9' || str === '9/16') {
    return str;
  }
  if (/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(str)) return str;
  return fallback;
}

function CarouselImageSlide({ src, alt = '', onIntrinsicRatio, isFirstSlide = false }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
      if (imgRef.current.naturalHeight) {
        onIntrinsicRatio?.(imgRef.current.naturalWidth / imgRef.current.naturalHeight);
      }
    }
  }, [src, onIntrinsicRatio]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {!loaded && !error && (
        <div
          className="animate-pulse"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--s2, rgba(255, 255, 255, 0.05))',
          }}
        />
      )}

      {!error && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -14,
            width: 'calc(100% + 28px)',
            height: 'calc(100% + 28px)',
            objectFit: 'cover',
            filter: 'blur(24px) brightness(0.35)',
            transform: 'scale(1.1)',
            pointerEvents: 'none',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      {!error ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          loading={isFirstSlide ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={(e) => {
            setLoaded(true);
            if (e.currentTarget.naturalWidth && e.currentTarget.naturalHeight) {
              onIntrinsicRatio?.(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
            }
          }}
          onError={() => {
            setError(true);
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            zIndex: 1,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.25s ease',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitUserDrag: 'none',
          }}
        />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: 'var(--sub, #94a3b8)',
          fontSize: 12,
          fontFamily: 'var(--font-mono, monospace)',
          zIndex: 1,
        }}>
          <span>[Image unavailable]</span>
        </div>
      )}
    </div>
  );
}

function CarouselVideoSlide({ src, poster, isMuted, onRef, onIntrinsicRatio }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !src) return;

    let hls = null;
    let cancelled = false;

    if (src.includes('.m3u8')) {
      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = src;
      } else {
        import('hls.js').then(({ default: Hls }) => {
          if (cancelled) return;
          if (Hls.isSupported()) {
            hls = new Hls({ maxBufferLength: 20, enableWorker: true });
            hls.loadSource(src);
            hls.attachMedia(videoEl);
            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              }
            });
            hlsRef.current = hls;
          } else {
            videoEl.src = src;
          }
        }).catch(() => {
          if (!cancelled) videoEl.src = src;
        });
      }
    } else {
      videoEl.src = src;
    }

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <video
      ref={(el) => {
        videoRef.current = el;
        onRef?.(el);
      }}
      src={src?.includes('.m3u8') ? undefined : src}
      poster={poster}
      playsInline
      loop
      muted={isMuted}
      preload="metadata"
      onLoadedMetadata={(e) => {
        const el = e.currentTarget;
        if (el.videoWidth && el.videoHeight) {
          onIntrinsicRatio?.(el.videoWidth / el.videoHeight);
        }
      }}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
    />
  );
}

/* ── Modern Media Carousel (Exported for PostDetail & SocialPostLayout) ── */
export function MediaCarousel({ files = [], aspectRatio = '1:1', onDoubleTap }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isMuted, setIsMuted] = useState(globalFeedMuted);
  const [intrinsicRatio, setIntrinsicRatio] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const videoRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    const onAudioChange = (muted) => setIsMuted(muted);
    audioSubscribers.add(onAudioChange);
    return () => audioSubscribers.delete(onAudioChange);
  }, []);

  const validFiles = Array.isArray(files) ? files.filter(f => Boolean(f?.storage_url || f?.media_url || f?.url || (typeof f === 'string' && f))) : [];
  const totalPages = validFiles.length;
  if (totalPages === 0) return null;

  const index = Math.max(0, Math.min(page, totalPages - 1));

  const paginate = (newDirection) => {
    const nextIdx = index + newDirection;
    if (nextIdx >= 0 && nextIdx < totalPages) {
      setPage([nextIdx, newDirection]);
    }
  };

  const setIndex = (targetIdx) => {
    if (targetIdx >= 0 && targetIdx < totalPages) {
      setPage([targetIdx, targetIdx > index ? 1 : -1]);
    }
  };

  const currentItem = validFiles[index];
  const currentSrc = currentItem?.storage_url || currentItem?.media_url || currentItem?.url || (typeof currentItem === 'string' ? currentItem : '');
  const isVideo = currentItem?.media_type === 'video' ||
    currentItem?.file_type?.startsWith('video/') ||
    /\.(mp4|mov|webm|mkv|m3u8)/i.test(currentSrc);

  const cssAspectRatio = intrinsicRatio
    ? `${intrinsicRatio}`
    : parseCssAspectRatio(aspectRatio, '1/1');

  const maxHeight = isVideo
    ? 'min(88dvh, 780px)'
    : (cssAspectRatio === '4/5' || cssAspectRatio === '1/1' || cssAspectRatio === '3/4' ? 'min(85dvh, 740px)' : 'min(78dvh, 660px)');

  // Auto-play/pause current video slide based on viewport visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isVideo) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const activeVideo = videoRefs.current[index];
        if (!activeVideo) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          activeVideo.muted = globalFeedMuted;
          activeVideo.play().then(() => {}).catch(() => {
            activeVideo.muted = true;
            activeVideo.play().then(() => {}).catch(() => {});
          });
        } else {
          activeVideo.pause();
        }
      });
    }, { threshold: [0.1, 0.6, 0.9] });

    observer.observe(el);
    return () => observer.disconnect();
  }, [index, isVideo]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setGlobalFeedMuted(nextMuted);
    const activeVideo = videoRefs.current[index];
    if (activeVideo) activeVideo.muted = nextMuted;
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
      opacity: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0.8,
    }),
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        margin: '0',
        borderRadius: '0',
        overflow: 'hidden',
        background: 'var(--s2, #070c18)',
        borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.stopPropagation(); paginate(-1); }
        if (e.key === 'ArrowRight') { e.stopPropagation(); paginate(1); }
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: cssAspectRatio,
          maxHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-secondary, #0a0f1d)',
          userSelect: 'none',
          cursor: totalPages > 1 ? 'grab' : 'default',
          overflow: 'hidden',
          touchAction: 'pan-y',
        }}
        onDoubleClick={onDoubleTap}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 350, damping: 35 },
              opacity: { duration: 0.2 },
            }}
            drag={totalPages > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            dragMomentum={false}
            whileDrag={{ cursor: 'grabbing' }}
            onDragEnd={(e, { offset, velocity }) => {
              const swipeThreshold = 35;
              const velocityThreshold = 300;
              if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
                paginate(1);
              } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
                paginate(-1);
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'pan-y',
            }}
          >
            {isVideo ? (
              <CarouselVideoSlide
                src={currentSrc}
                isMuted={isMuted}
                onRef={(el) => { videoRefs.current[index] = el; }}
                onIntrinsicRatio={setIntrinsicRatio}
              />
            ) : (
              <CarouselImageSlide
                src={currentSrc}
                isFirstSlide={index === 0}
                onIntrinsicRatio={(ratio) => {
                  if (totalPages === 1) setIntrinsicRatio(ratio);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Glassmorphic Slide Counter Badge */}
        {totalPages > 1 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.04em',
              zIndex: 35,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }}
          >
            {index + 1}/{totalPages}
          </div>
        )}

        {/* Bottom Right Mute Button for Video slides */}
        {isVideo && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            onClick={toggleMute}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 35,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </motion.button>
        )}

        {/* Navigation Chevrons — Always visible and highly clickable */}
        {totalPages > 1 && (
          <>
            {index > 0 && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  paginate(-1);
                }}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 40,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                  pointerEvents: 'auto',
                }}
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </motion.button>
            )}
            {index < totalPages - 1 && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  paginate(1);
                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(10px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 40,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                  pointerEvents: 'auto',
                }}
              >
                <ChevronRight size={24} strokeWidth={2.5} />
              </motion.button>
            )}
          </>
        )}

        {/* Bottom Spring Indicator Dot Track */}
        {totalPages > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 35,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIndex(i);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: i === index ? 18 : 6,
                    height: 6,
                    borderRadius: 4,
                    background: i === index ? 'var(--primary, #3b82f6)' : 'rgba(255, 255, 255, 0.45)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Unified Media Extraction Helper (Supports multi-image, files, JSON, URLs) ── */
export function extractAllPostMedia(post) {
  if (!post) return [];

  const candidates = [];

  const parseIfJson = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try { return JSON.parse(trimmed); } catch { return null; }
      }
    }
    return val;
  };

  const addItem = (item, defaultType = 'image') => {
    if (!item) return;
    let url = '';
    let fileType = '';
    let mediaType = defaultType;
    let aspectRatio = post.aspect_ratio || '1:1';

    if (typeof item === 'string') {
      url = item.trim();
      if (url.includes(',') && !url.startsWith('data:')) {
        url.split(',').map(s => s.trim()).filter(Boolean).forEach(singleUrl => addItem(singleUrl, defaultType));
        return;
      }
    } else if (typeof item === 'object') {
      url = item.storage_url || item.storageUrl || item.media_url || item.mediaUrl || item.url || item.file_url || item.fileUrl || item.path || '';
      fileType = item.file_type || item.fileType || '';
      mediaType = item.media_type || item.mediaType || (fileType?.startsWith('video/') ? 'video' : defaultType);
      aspectRatio = item.aspect_ratio || item.aspectRatio || post.aspect_ratio || '1:1';
    }

    if (!url || typeof url !== 'string') return;
    url = url.trim();
    if (!url) return;

    const isVid = mediaType === 'video' ||
      fileType?.startsWith('video/') ||
      /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(url);

    candidates.push({
      storage_url: url,
      url,
      media_url: url,
      file_type: isVid ? 'video/mp4' : (fileType || 'image/jpeg'),
      media_type: isVid ? 'video' : 'image',
      aspect_ratio: aspectRatio,
    });
  };

  // 1. Process all media arrays and string JSON columns
  const parsedMedia = parseIfJson(post.media) || [];
  const parsedMediaItems = parseIfJson(post.media_items) || [];
  const parsedFiles = parseIfJson(post.files) || [];
  const parsedMediaUrls = parseIfJson(post.media_urls || post.mediaUrls) || [];
  const parsedImages = parseIfJson(post.images) || [];
  const parsedAttachments = parseIfJson(post.attachments) || [];

  if (Array.isArray(parsedMedia)) parsedMedia.forEach(m => addItem(m, 'image'));
  else if (typeof parsedMedia === 'string' || typeof parsedMedia === 'object') addItem(parsedMedia, 'image');

  if (Array.isArray(parsedMediaItems)) parsedMediaItems.forEach(m => addItem(m, 'image'));
  else if (typeof parsedMediaItems === 'string' || typeof parsedMediaItems === 'object') addItem(parsedMediaItems, 'image');

  if (Array.isArray(parsedFiles)) parsedFiles.forEach(f => addItem(f, 'image'));
  else if (typeof parsedFiles === 'string' || typeof parsedFiles === 'object') addItem(parsedFiles, 'image');

  if (Array.isArray(parsedMediaUrls)) parsedMediaUrls.forEach(u => addItem(u, 'image'));
  else if (typeof parsedMediaUrls === 'string') addItem(parsedMediaUrls, 'image');

  if (Array.isArray(parsedImages)) parsedImages.forEach(img => addItem(img, 'image'));
  else if (typeof parsedImages === 'string') addItem(parsedImages, 'image');

  if (Array.isArray(parsedAttachments)) parsedAttachments.forEach(att => addItem(att, 'image'));

  // 2. Extract markdown embedded images if present in caption/description
  const rawText = post.description || post.caption || post.content || '';
  if (typeof rawText === 'string' && rawText.includes('http')) {
    const mdImgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
    let match;
    while ((match = mdImgRegex.exec(rawText)) !== null) {
      if (match[1]) addItem(match[1], 'image');
    }
  }

  // 3. Deduplicate
  const seenUrls = new Set();
  const uniqueMedia = [];
  for (const item of candidates) {
    if (item.storage_url && !seenUrls.has(item.storage_url)) {
      seenUrls.add(item.storage_url);
      uniqueMedia.push(item);
    }
  }

  // 4. Fallback to thumbnail_url if no media items found
  if (uniqueMedia.length === 0 && post.thumbnail_url) {
    addItem(post.thumbnail_url, 'image');
    if (candidates.length > 0 && candidates[candidates.length - 1]?.storage_url) {
      uniqueMedia.push(candidates[candidates.length - 1]);
    }
  }

  return uniqueMedia;
}

/* ── Modern Document Carousel (for PDFs & structured posts) ───────── */
export function DocumentCarousel({ post, onDoubleTap }) {
  const files = extractAllPostMedia(post);

  const isDocument = post.type === 'document' || post.is_document || Boolean(post.document_url);
  const caption = post.description || '';
  const rawTitle = post.title || '';
  const titleMatchesCaption = rawTitle && caption && (
    rawTitle === caption ||
    caption.startsWith(rawTitle) ||
    rawTitle.startsWith(caption.slice(0, 40))
  );
  const docTitle = (!rawTitle || titleMatchesCaption)
    ? (post.creator_name || post.creator_username || 'Document')
    : rawTitle;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ── Instagram Attribution Banner ───────────── */}
      {post.source_platform === 'instagram' && post.original_creator_handle && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'linear-gradient(90deg, rgba(225,48,108,0.12), rgba(245,96,64,0.12))',
          borderBottom: '1px solid rgba(225,48,108,0.18)',
          borderRadius: 0,
          fontSize: '12px',
          color: '#f43f5e',
          fontWeight: 600,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📸</span> Instagram: @{post.original_creator_handle}
          </span>
          {files.length > 1 && (
            <span style={{ color: 'var(--sub, #94a3b8)', fontWeight: 500, fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>
              {files.length} slides
            </span>
          )}
        </div>
      )}

      {/* ── Document Title Bar (for PDFs / documents) ─ */}
      {isDocument && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--s2, #111827)',
          borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderBottom: 'none',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <FileText size={16} color="var(--primary, #3b82f6)" style={{ flexShrink: 0 }} />
            <p style={{
              margin: 0,
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--text, #f8fafc)',
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {docTitle}
            </p>
          </div>
          {files.length > 1 && (
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--sub, #94a3b8)', fontWeight: 600, flexShrink: 0 }}>
              {files.length} pages
            </span>
          )}
        </div>
      )}

      <MediaCarousel files={files} aspectRatio={post.aspect_ratio || '1:1'} onDoubleTap={onDoubleTap} />
    </div>
  );
}

/* ── Instagram-Style Feed Video Player (Autoplay, Tap, Mute Button, Progress) ── */
export function FeedVideoPlayer({ post, onDoubleTap }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(globalFeedMuted);
  const [gestureIcon, setGestureIcon] = useState(null); // 'play' | 'pause' | 'mute' | 'unmute'
  const [progress, setProgress] = useState(0);
  const [intrinsicRatio, setIntrinsicRatio] = useState(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const tapTimerRef = useRef(null);

  const videoUrl = post.video_url ||
    post.media?.find(m => m.media_type === 'video' || m.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(m.media_url || m.storage_url || m.url))?.media_url ||
    post.media?.find(m => m.media_type === 'video' || m.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(m.media_url || m.storage_url || m.url))?.storage_url ||
    post.files?.find(f => f.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(f.url || f.storage_url))?.storage_url ||
    post.files?.find(f => f.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(f.url || f.storage_url))?.url ||
    (post.thumbnail_url && /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(post.thumbnail_url) ? post.thumbnail_url : null);

  const isYouTube = Boolean(videoUrl && /youtu\.be|youtube\.com/i.test(videoUrl));
  const embedUrl = isYouTube ? toYouTubeEmbed(videoUrl, true) : null;
  const isShort = Boolean(post.type === 'short' || post.is_short || post.aspect_ratio === '9:16');

  const cssAspectRatio = intrinsicRatio
    ? `${intrinsicRatio}`
    : (isShort
        ? '9/16'
        : parseCssAspectRatio(post.aspect_ratio, '1/1'));

  const maxHeight = isShort
    ? 'min(90dvh, 840px)'
    : (cssAspectRatio === '4/5' || cssAspectRatio === '1/1' || cssAspectRatio === '3/4' ? 'min(85dvh, 740px)' : 'min(80dvh, 680px)');

  // Sync global audio state
  useEffect(() => {
    const onAudioChange = (muted) => {
      setIsMuted(muted);
      if (videoRef.current) videoRef.current.muted = muted;
    };
    audioSubscribers.add(onAudioChange);
    return () => audioSubscribers.delete(onAudioChange);
  }, []);

  // HLS stream setup
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
            hls = new Hls({ maxBufferLength: 30, enableWorker: true });
            hls.loadSource(videoUrl);
            hls.attachMedia(videoEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15;
                if (inView) {
                  videoEl.muted = globalFeedMuted;
                  videoEl.play().then(() => setIsPlaying(true)).catch(() => {
                    videoEl.muted = true;
                    videoEl.play().then(() => setIsPlaying(true)).catch(() => {});
                  });
                }
              }
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    hls.destroy();
                    break;
                }
              }
            });
            hlsRef.current = hls;
          } else {
            videoEl.src = videoUrl;
          }
        }).catch(() => {
          if (!cancelled) videoEl.src = videoUrl;
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

  // Instagram Auto-Play & Auto-Pause on Scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isYouTube) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          // Autoplay video when >=60% in viewport
          video.muted = globalFeedMuted;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch(() => {
                // Browsers may block unmuted autoplay; fallback to muted
                video.muted = true;
                video.play().then(() => setIsPlaying(true)).catch(() => {});
              });
          }
        } else {
          // Pause when scrolling out of view
          video.pause();
          setIsPlaying(false);
        }
      });
    }, { threshold: [0.15, 0.6, 0.9] });

    observer.observe(el);
    return () => observer.disconnect();
  }, [videoUrl, isYouTube]);

  // Toggle Mute / Sound Button
  const toggleMute = (e) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setGlobalFeedMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
    setGestureIcon(nextMuted ? 'mute' : 'unmute');
    setTimeout(() => setGestureIcon(null), 700);
  };

  // Toggle Play / Pause on Single Tap
  const togglePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => {
          setIsPlaying(true);
          setGestureIcon('play');
          setTimeout(() => setGestureIcon(null), 600);
        })
        .catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
      setGestureIcon('pause');
      setTimeout(() => setGestureIcon(null), 600);
    }
  };

  // Instagram Gesture Disambiguation: Single Tap (Play/Pause) vs Double Tap (Like)
  const handleMediaTap = (e) => {
    e.stopPropagation();
    if (tapTimerRef.current) {
      // Double tap detected
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      onDoubleTap?.();
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        togglePlayPause();
      }, 260);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  const status = (post?.status || post?.job_status || post?.moderation_status || '').toLowerCase();
  const isPending = status === 'pending' || status === 'chunking' || status === 'downloading' || status === 'processing' || status === 'queued' || (!videoUrl && !isYouTube);

  if (isPending) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: cssAspectRatio,
        maxHeight,
        background: 'var(--s2, #0d1117)',
        borderRadius: 0,
        overflow: 'hidden',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
      }}>
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, filter: 'blur(10px)' }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '3px solid rgba(245, 158, 11, 0.2)',
            borderTopColor: '#f59e0b',
            animation: 'spin 1s linear infinite',
          }} />
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#f59e0b',
            padding: '4px 12px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            PROCESSING VIDEO
          </div>
          <p style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--sub, rgba(255,255,255,0.75))',
            fontFamily: 'var(--font-body, sans-serif)',
            maxWidth: 320,
            lineHeight: 1.4,
          }}>
            Video is currently processing in the background pipeline.
          </p>
        </div>
      </div>
    );
  }

  if (isYouTube && isPlaying && embedUrl) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: cssAspectRatio,
        maxHeight,
        background: '#000',
        borderRadius: 0,
        margin: 0,
        overflow: 'hidden',
        borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
      }}>
        <iframe
          src={embedUrl}
          title={post.title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    );
  }

  if (isYouTube) {
    return (
      <div
        onClick={() => setIsPlaying(true)}
        onDoubleClick={onDoubleTap}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: cssAspectRatio,
          maxHeight,
          background: 'var(--surface-secondary, #000)',
          borderRadius: 0,
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
          borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
        }}
      >
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt={post.title || ''}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

        {/* Refined Glassmorphic Play Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Play size={24} fill="#ffffff" strokeWidth={0} style={{ marginLeft: 3 }} />
        </motion.div>

        {/* Duration Pill */}
        {post.duration_formatted && (
          <span style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {post.duration_formatted}
          </span>
        )}

        {/* Short Pill */}
        {isShort && (
          <span style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(244,63,94,0.4)',
          }}>
            Short
          </span>
        )}
      </div>
    );
  }

  // Direct MP4 / WebM / HLS video with Instagram Gestures
  return (
    <div
      ref={containerRef}
      onClick={handleMediaTap}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: cssAspectRatio,
        maxHeight,
        background: '#000',
        borderRadius: 0,
        overflow: 'hidden',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))',
        cursor: 'pointer',
      }}
    >
      {post.thumbnail_url && (
        <img
          src={post.thumbnail_url}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -14,
            width: 'calc(100% + 28px)',
            height: 'calc(100% + 28px)',
            objectFit: 'cover',
            filter: 'blur(24px) brightness(0.3)',
            transform: 'scale(1.1)',
            pointerEvents: 'none',
          }}
        />
      )}
      <video
        ref={videoRef}
        src={videoUrl?.includes('.m3u8') ? undefined : videoUrl}
        poster={post.thumbnail_url}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (el.videoWidth && el.videoHeight) {
            setIntrinsicRatio(el.videoWidth / el.videoHeight);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ position: 'relative', width: '100%', height: '100%', objectFit: isShort ? 'cover' : 'contain', display: 'block', zIndex: 1 }}
      />

      {/* ── Gesture Feedback Overlay Icon (Play / Pause / Sound) ── */}
      <AnimatePresence>
        {gestureIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 14,
              pointerEvents: 'none',
            }}
          >
            {gestureIcon === 'play' && <Play size={26} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />}
            {gestureIcon === 'pause' && <Pause size={24} fill="#fff" strokeWidth={0} />}
            {gestureIcon === 'mute' && <VolumeX size={24} />}
            {gestureIcon === 'unmute' && <Volume2 size={24} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Paused Indicator when video is paused manually */}
      {!isPlaying && !gestureIcon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 11,
            pointerEvents: 'none',
          }}
        >
          <Play size={24} fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
        </motion.div>
      )}

      {/* ── Bottom-Right Instagram Mute / Sound Toggle Button ── */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        type="button"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        onClick={toggleMute}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        }}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </motion.button>

      {/* Short Pill if applicable */}
      {isShort && (
        <span style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 800,
          padding: '3px 9px',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 12px rgba(244,63,94,0.4)',
          zIndex: 10,
        }}>
          Short
        </span>
      )}

      {/* ── Instagram Bottom Playback Progress Bar ── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'rgba(255, 255, 255, 0.15)',
        zIndex: 12,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--primary, #3b82f6)',
          transition: 'width 0.1s linear',
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════╗
   Main PostCard — High-Agency Social & Editorial Feed Card
╚══════════════════════════════════════════════════════════════════ */
export default function PostCard({ post, onSaveToggle, refSource = 'feed', variant = 'editorial' }) {
  const { user } = useAuth();
  const { openSaveToContainer } = useSaveToContainer();
  const navigate = useNavigate();
  const location = useLocation();
  const isOpenedViaClickRef = useRef(false);

  const [clapped,  setClapped]  = useState(post.is_clapped || false);
  const [clapCount,setClapCount]= useState(parseInt(post.clap_count) || 0);
  const [saved,    setSaved]    = useState(post.is_saved || false);
  const [heartAnim,setHeartAnim]= useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastTap = useRef(0);

  const isVideoPost = Boolean(
    post.is_video_item ||
    post.type === 'video' ||
    post.type === 'short' ||
    post.video_url ||
    post.media?.some(m => m.media_type === 'video' || m.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(m.media_url || m.storage_url || m.url)) ||
    post.files?.some(f => f.file_type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|m3u8)(\?|$)/i.test(f.url || f.storage_url))
  );
  const postSlug = post.slug || post.id;

  const overlayState = useMemo(() => parsePostOverlayParams(location), [location.pathname, location.search]);
  const isThisPostOverlay = useMemo(() => {
    if (!overlayState.postSlug) return false;
    const cleanParam = String(overlayState.postSlug).toLowerCase();
    return cleanParam === String(post.slug || '').toLowerCase() || cleanParam === String(post.id || '').toLowerCase();
  }, [overlayState.postSlug, post.slug, post.id]);

  const isCommentOpen = Boolean(commentOpen || (isThisPostOverlay && overlayState.isComment));
  const isShareOpen = Boolean(shareOpen || (isThisPostOverlay && overlayState.isShare));

  // Sync state if URL changes (e.g. browser Back button pressed)
  useEffect(() => {
    if (!overlayState.isComment && !overlayState.isShare) {
      setCommentOpen(false);
      setShareOpen(false);
      isOpenedViaClickRef.current = false;
    }
  }, [overlayState.isComment, overlayState.isShare]);

  const handleClap = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!user) return;
    const isVideoItem = Boolean(post.is_video_item);
    const endpoint = isVideoItem ? `/videos/${post.id}/like` : `/posts/${post.id}/clap`;
    if (clapped) {
      setClapped(false); setClapCount(p => Math.max(0, p - 1));
      try {
        if (!isVideoItem) {
          await unclapGraphQLPost(post.id);
        } else {
          await toggleGraphQLVideoLike(post.id);
        }
      } catch {
        try { await api.delete(endpoint); }
        catch { setClapped(true); setClapCount(p => p + 1); }
      }
    } else {
      setClapped(true); setClapCount(p => p + 1);
      try {
        if (!isVideoItem) {
          await clapGraphQLPost(post.id);
        } else {
          await toggleGraphQLVideoLike(post.id);
        }
      } catch {
        try { await api.post(endpoint); }
        catch { setClapped(false); setClapCount(p => p - 1); }
      }
    }
  };

  const handleDoubleTap = () => {
    if (!clapped) handleClap();
    setHeartAnim(true); 
    setTimeout(() => setHeartAnim(false), 900);
  };

  const handleSave = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!user) return;
    setSaved(true);
    openSaveToContainer({
      id: post.id,
      title: post.title || post.caption || post.description || 'Post',
      type: isVideoPost ? 'video' : (post.type || 'post'),
      item_kind: isVideoPost ? 'video' : (post.type || 'post'),
      thumbnail_url: post.thumbnail_url || (post.files?.[0]?.storage_url || post.files?.[0]?.url) || null,
      creator_name: post.creator_name || post.creator_username,
    });
    if (post.is_video_item) {
      try {
        await toggleGraphQLVideoSave(post.id);
      } catch {
        try { await api.post(`/videos/${post.id}/save`); } catch {}
      }
    }
    onSaveToggle?.(post.id, true);
  };

  const handleOpenComments = (e) => {
    if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
    isOpenedViaClickRef.current = true;
    setCommentOpen(true);
    setShareOpen(false);
    const targetUrl = buildPostOverlayUrl(location.pathname, postSlug, 'comment');
    navigate(targetUrl);
  };

  const handleCloseComments = () => {
    setCommentOpen(false);
    if (isOpenedViaClickRef.current && typeof window !== 'undefined' && window.history.length > 1) {
      isOpenedViaClickRef.current = false;
      navigate(-1);
    } else {
      isOpenedViaClickRef.current = false;
      const cleanUrl = clearPostOverlayUrl(location);
      navigate(cleanUrl, { replace: true });
    }
  };

  const handleOpenShare = (e) => {
    if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
    isOpenedViaClickRef.current = true;
    setShareOpen(true);
    setCommentOpen(false);
    const targetUrl = buildPostOverlayUrl(location.pathname, postSlug, 'share');
    navigate(targetUrl);
  };

  const handleCloseShare = () => {
    setShareOpen(false);
    if (isOpenedViaClickRef.current && typeof window !== 'undefined' && window.history.length > 1) {
      isOpenedViaClickRef.current = false;
      navigate(-1);
    } else {
      isOpenedViaClickRef.current = false;
      const cleanUrl = clearPostOverlayUrl(location);
      navigate(cleanUrl, { replace: true });
    }
  };

  const goProfile = (e) => { e.preventDefault(); e.stopPropagation(); navigate(`/u/${post.creator_username}`); };
  const goPost    = () => {
    navigate(`/posts/${post.id}`);
  };

  /* ══════════════════════════════════════════════════════════════════
     SOCIAL / MEDIA POST — Modern Linear/Threads Style Feed Card
  ══════════════════════════════════════════════════════════════════ */
  if (post.type === 'post' || post.type === 'carousel' || post.type === 'image' || isVideoPost) {
    if (hidden) return null;
    const mediaFiles   = extractAllPostMedia(post);
    const hasMedia     = mediaFiles.length > 0 || Boolean(post.video_url);
    const rawCaption   = post.description || post.caption || post.content || post.title || '';
    const { beforeText, codeSnippet, afterText } = extractCodeBlock(rawCaption);
    const hasExtractedCode = !!codeSnippet;
    const finalCodeSnippet = post.code_snippet ? { code: post.code_snippet, language: post.code_language || 'typescript', title: post.code_title } : codeSnippet;
    const displayCaption = hasExtractedCode ? beforeText : rawCaption;

    return (
      <article
        style={{
          background: 'var(--surface, #1e293b)',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '14px',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.06))',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* ─────────────────────────────────────────────────────────────
            1 · CREATOR HEADER — Clean 2-Tier Hierarchy
        ───────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 8px',
          gap: 12,
        }}>
          <div
            onClick={goProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              flex: 1,
              cursor: 'pointer',
            }}
          >
            {/* Avatar with subtle ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`}
                alt={post.creator_username}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                  background: 'var(--s2, #0f172a)',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                }}
              />
            </div>

            {/* Author Stack */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    color: 'var(--text, #f8fafc)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                >
                  {post.creator_name || post.creator_username}
                </span>
                <VerifiedBadge />
                
                {post.difficulty && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--accent-purple, #9333ea)',
                    background: 'rgba(147, 51, 234, 0.1)',
                    border: '1px solid rgba(147, 51, 234, 0.25)',
                    borderRadius: '6px',
                    padding: '1px 6px',
                    textTransform: 'capitalize',
                    lineHeight: 1.2,
                  }}>
                    {post.difficulty}
                  </span>
                )}
              </div>

              {/* Handle • Time • Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '12px',
                color: 'var(--sub, #94a3b8)',
                fontFamily: 'var(--font-body, sans-serif)',
                marginTop: '1px',
              }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                  @{post.creator_username}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ whiteSpace: 'nowrap' }}>{timeAgo(post.created_at)}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <Globe size={12} style={{ opacity: 0.7 }} />

                {(() => {
                  const s = (post?.status || post?.job_status || post?.moderation_status || '').toLowerCase();
                  if (s === 'pending' || s === 'chunking' || s === 'downloading' || s === 'processing' || s === 'queued' || s === 'under_review') {
                    return (
                      <span style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono, monospace)',
                        marginLeft: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                        PENDING
                      </span>
                    );
                  }
                  if (s === 'removed') return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800, marginLeft: 4 }}>REMOVED</span>;
                  return null;
                })()}
              </div>
            </div>
          </div>

          {/* Action Menu Button */}
          <ContentActionMenu
            contentId={post.id}
            contentType={isVideoPost ? (post.type === 'short' || post.is_short ? 'short' : 'video') : 'post'}
            contentAuthorId={post.creator_id || post.creator_user_id || post.user_id}
            creatorUsername={post.creator_username}
            title={post.title}
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : undefined}
            onSave={handleSave}
            isSaved={saved}
            onShare={handleOpenShare}
            onHide={() => setHidden(true)}
            sourceSurface="community_feed"
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2 · POST CONTENT & CAPTION
        ───────────────────────────────────────────────────────────── */}
        {((post?.moderation_status || post?.status || '').toLowerCase() === 'removed') ? (
          <div style={{ padding: '8px 16px 14px', color: 'var(--red, #ef4444)', fontSize: 13, fontStyle: 'italic' }}>
            [This post was removed for violating community guidelines]
          </div>
        ) : (
          <div style={{ padding: '4px 16px 8px' }}>
            {displayCaption && (
              <div style={{ position: 'relative', marginBottom: finalCodeSnippet ? '8px' : '4px' }}>
                <div style={{
                  fontSize: '14.5px',
                  lineHeight: 1.55,
                  color: 'var(--text, #f8fafc)',
                  fontFamily: 'var(--font-body, sans-serif)',
                  wordBreak: 'break-word',
                  ...(captionExpanded ? {} : {
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  })
                }}>
                  {displayCaption}
                </div>
                {!captionExpanded && displayCaption.length > 140 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCaptionExpanded(true); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary, #3b82f6)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      marginTop: 3,
                      display: 'inline-block',
                    }}
                  >
                    ...more
                  </button>
                )}
              </div>
            )}

            {/* Code Snippet Box */}
            {finalCodeSnippet && (
              <div style={{ margin: '8px 0' }}>
                <CodeSnippetCard
                  code={finalCodeSnippet.code}
                  language={finalCodeSnippet.language}
                  title={finalCodeSnippet.title}
                />
              </div>
            )}

            {/* Trailing caption text if any */}
            {hasExtractedCode && afterText && (
              <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text, #f8fafc)', margin: '6px 0' }}>
                {afterText}
              </div>
            )}

            {/* Tags Pills */}
            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 2px' }}>
                {post.tags.map((t, idx) => (
                  <span key={idx} style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    color: 'var(--sub, #94a3b8)',
                    background: 'var(--s2, rgba(255,255,255,0.04))',
                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                    borderRadius: '6px',
                    padding: '2px 8px',
                  }}>
                    #{t.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3 · MEDIA ATTACHMENTS (Images / Carousel / Video)
        ───────────────────────────────────────────────────────────── */}
        <div style={{ width: '100%', margin: '8px 0 0' }}>
          {isVideoPost ? (
            <FeedVideoPlayer post={post} onDoubleTap={handleDoubleTap} />
          ) : hasMedia ? (
            <DocumentCarousel post={post} onDoubleTap={handleDoubleTap} />
          ) : null}
        </div>

        {/* Double-tap Floating Animation */}
        <AnimatePresence>
          {heartAnim && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 9999,
              }}
            >
              <div style={{
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(16px)',
                padding: '26px',
                borderRadius: '50%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              }}>
                <ClapIcon size={64} filled color="var(--primary, #3B7CFF)" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────────────────────────────────────────────────────────
            4 · ENGAGEMENT STATS SUMMARY BAR
        ───────────────────────────────────────────────────────────── */}
        {(clapCount > 0 || post.comment_count > 0) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px 6px',
            fontSize: '12.5px',
            color: 'var(--sub, #94a3b8)',
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {/* Left: Claps Count */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {clapCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ClapIcon size={18} filled color={clapped ? 'var(--primary, #3B7CFF)' : 'var(--sub, #94a3b8)'} />
                  <span style={{ fontWeight: 600, color: clapped ? 'var(--primary, #3B7CFF)' : 'inherit' }}>
                    {clapCount.toLocaleString()} {clapCount === 1 ? 'clap' : 'claps'}
                  </span>
                </span>
              )}
            </span>

            {/* Right: Comments Count */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {post.comment_count > 0 && (
                <button
                  type="button"
                  onClick={handleOpenComments}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'inherit',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                  className="hover:underline"
                >
                  {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                </button>
              )}
            </span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5 · TACTILE ACTION FOOTER BAR (Enlarged Buttons & Brand Color)
        ───────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          padding: '6px 10px',
          background: 'var(--surface, #1e293b)',
        }}>
          {/* 1. Clap / Like Action */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            aria-label="Clap"
            onClick={handleClap}
            style={{
              background: clapped ? 'rgba(59, 124, 255, 0.14)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '11px 16px',
              minHeight: '44px',
              borderRadius: '10px',
              color: clapped ? 'var(--primary, #3B7CFF)' : 'var(--sub, #94a3b8)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              flex: 1,
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            className="hover:bg-[var(--s2)] hover:text-[var(--primary)]"
          >
            <ClapIcon size={23} filled={clapped} color={clapped ? 'var(--primary, #3B7CFF)' : 'currentColor'} />
            <span style={{ display: 'none' }} className="sm:inline">Clap</span>
          </motion.button>

          {/* 2. Comment Action */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            aria-label="Comment"
            onClick={handleOpenComments}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '11px 16px',
              minHeight: '44px',
              borderRadius: '10px',
              color: 'var(--sub, #94a3b8)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              flex: 1,
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            className="hover:bg-[var(--s2)] hover:text-[var(--text)]"
          >
            <MessageCircle size={22} strokeWidth={1.8} />
            <span style={{ display: 'none' }} className="sm:inline">Comment</span>
          </motion.button>

          {/* 3. Share Action */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            aria-label="Share"
            onClick={handleOpenShare}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '11px 16px',
              minHeight: '44px',
              borderRadius: '10px',
              color: 'var(--sub, #94a3b8)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              flex: 1,
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            className="hover:bg-[var(--s2)] hover:text-[var(--text)]"
          >
            <Share2 size={21} strokeWidth={1.8} />
            <span style={{ display: 'none' }} className="sm:inline">Share</span>
          </motion.button>

          {/* 4. Save / Bookmark Action */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            aria-label="Save"
            onClick={handleSave}
            style={{
              background: saved ? 'rgba(52, 199, 123, 0.12)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '11px 16px',
              minHeight: '44px',
              borderRadius: '10px',
              color: saved ? 'var(--green, #34c77b)' : 'var(--sub, #94a3b8)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              flex: 1,
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
            className="hover:bg-[var(--s2)]"
          >
            <Bookmark size={22} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
            <span style={{ display: 'none' }} className="sm:inline">Save</span>
          </motion.button>
        </div>

        {/* Comment Sheet */}
        <CommentSheet
          isOpen={isCommentOpen}
          onClose={handleCloseComments}
          entityId={post.id}
          entityType="post"
          user={user}
        />

        {/* Instagram-Style Share Sheet */}
        <ShareSheet
          isOpen={isShareOpen}
          onClose={handleCloseShare}
          contentType={post.type || 'post'}
          contentId={post.id}
          contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : undefined}
          contentTitle={post.title || post.caption || post.description || ''}
          contentThumbnail={post.thumbnail_url || (post.files?.[0]?.url) || null}
          contentAuthor={post.creator_name || post.creator_username || ''}
        />
      </article>
    );
  }

  /* ── EDITORIAL-HERO variant (first article in feed) ─────────────── */
  if (variant === 'editorial-hero') {
    return (
      <article
        onClick={goPost}
        style={{
          marginBottom: 16,
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          background: 'var(--surface, #1e293b)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          transition: 'border-color 0.2s ease, transform 0.2s ease',
          boxShadow: 'var(--shadow-card, 0 4px 24px rgba(0,0,0,0.1))',
        }}
        className="hover:border-[var(--primary)]"
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', overflow: 'hidden', background: 'var(--s2, #0f172a)' }}>
          <img
            src={post.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200'}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--surface, #1e293b) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: 14, left: 16 }}>
            <TypeTag type={post.type} />
          </div>
        </div>

        <div style={{ padding: '18px 20px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
            fontWeight: 800,
            fontSize: '18px',
            color: 'var(--text, #f8fafc)',
            lineHeight: 1.35,
            margin: '0 0 8px',
          }}>
            {post.title}
          </h2>
          <p style={{
            fontSize: '13.5px',
            color: 'var(--sub, #94a3b8)',
            lineHeight: 1.6,
            margin: '0 0 16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {post.description}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
            paddingTop: 12,
          }}>
            <div onClick={e => { e.stopPropagation(); goProfile(e); }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <img
                src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 600, fontSize: '13px', color: 'var(--text, #f8fafc)' }}>
                {post.creator_name || post.creator_username}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--sub, #94a3b8)' }}>
              {timeAgo(post.created_at)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  /* ── STANDARD EDITORIAL card (articles / tutorials / resources) ─── */
  return (
    <article
      style={{
        marginBottom: 14,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
        background: 'var(--surface, #1e293b)',
        transition: 'border-color 0.2s ease',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-card, 0 2px 12px rgba(0,0,0,0.05))',
      }}
      className="hover:border-[var(--primary)]"
      onClick={goPost}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 0' }} onClick={e => e.stopPropagation()}>
        <div onClick={goProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}>
          <img
            src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`}
            alt=""
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 700, fontSize: '13.5px', color: 'var(--text, #f8fafc)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {post.creator_name || post.creator_username}
            </p>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px', color: 'var(--sub, #94a3b8)', margin: 0 }}>
              {post.type?.charAt(0).toUpperCase()}{post.type?.slice(1)} • {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <TypeTag type={post.type} />
      </div>

      <div style={{ padding: '12px 16px 8px' }}>
        {post.title && (
          <p style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 700, fontSize: '15.5px', color: 'var(--text, #f8fafc)', margin: '0 0 6px', lineHeight: 1.4 }}>
            {post.title}
          </p>
        )}
        {post.description && (
          <p style={{ fontSize: '13.5px', color: 'var(--sub, #94a3b8)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.description}
          </p>
        )}
      </div>

      {post.thumbnail_url && (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: post.aspect_ratio === '4:5' ? '4/5' : (post.aspect_ratio === '3:4' ? '3/4' : (post.aspect_ratio === '1:1' ? '1/1' : '16/9')),
          maxHeight: 'min(75dvh, 600px)',
          overflow: 'hidden',
          background: 'var(--s2, #070c18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
        }}>
          {/* Ambient blurred backdrop so image never gets cut or letterboxed awkwardly */}
          <img
            src={post.thumbnail_url}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -14,
              width: 'calc(100% + 28px)',
              height: 'calc(100% + 28px)',
              objectFit: 'cover',
              filter: 'blur(24px) brightness(0.35)',
              transform: 'scale(1.1)',
              pointerEvents: 'none',
            }}
          />
          <img
            src={post.thumbnail_url}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block', zIndex: 1 }}
          />
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '12px 18px',
        borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
      }} onClick={e => e.stopPropagation()}>
        <button
          aria-label="Toggle clap"
          onClick={handleClap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: clapped ? 'rgba(59, 124, 255, 0.14)' : 'none',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: clapped ? 'var(--primary, #3B7CFF)' : 'var(--sub, #94a3b8)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            padding: '6px 10px',
            transition: 'all 0.15s ease',
          }}
        >
          <ClapIcon size={22} filled={clapped} color={clapped ? 'var(--primary, #3B7CFF)' : 'currentColor'} />
          <span>{clapCount > 0 ? clapCount : ''}</span>
        </button>

        <button
          aria-label="Comment"
          onClick={handleOpenComments}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--sub, #94a3b8)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            padding: '6px 10px',
          }}
        >
          <MessageCircle size={21} strokeWidth={1.8} />
          <span>{post.comment_count || 0}</span>
        </button>

        <button
          aria-label="Share"
          onClick={handleOpenShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--sub, #94a3b8)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            padding: '6px 10px',
          }}
        >
          <Share2 size={20} strokeWidth={1.8} />
        </button>

        <button
          aria-label="Save post"
          onClick={handleSave}
          style={{
            marginLeft: 'auto',
            background: saved ? 'rgba(52, 199, 123, 0.12)' : 'none',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: saved ? 'var(--green, #34c77b)' : 'var(--sub, #94a3b8)',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Bookmark size={21} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>

      {/* Inline Comment Sheet */}
      <CommentSheet
        isOpen={isCommentOpen}
        onClose={handleCloseComments}
        entityId={post.id}
        entityType="post"
        user={user}
      />

      {/* Instagram-Style Share Sheet */}
      <ShareSheet
        isOpen={isShareOpen}
        onClose={handleCloseShare}
        contentType={post.type || 'post'}
        contentId={post.id}
        contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : undefined}
        contentTitle={post.title || post.caption || post.description || ''}
        contentThumbnail={post.thumbnail_url || (post.files?.[0]?.url) || null}
        contentAuthor={post.creator_name || post.creator_username || ''}
      />
    </article>
  );
}
