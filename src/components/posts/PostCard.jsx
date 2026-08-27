import { useNavigate } from 'react-router-dom';
import ContentActionMenu from '../ui/ContentActionMenu';
import { HandHeart, MessageCircle, Bookmark, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSaveToContainer } from '../../context/SaveToContainerContext';
import CommentSheet from '../ui/CommentSheet';
import ShareSheet from '../ui/ShareSheet';
import CodeSnippetCard, { extractCodeBlock } from './CodeSnippetCard';
import { toYouTubeEmbed } from '../../utils/videoEmbed';

// Safely import toast without crashing if not installed
let toast = { success: () => {} };
try { toast = require('react-hot-toast').default; } catch {}

function timeAgo(date) {
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

/* ── Inline SVG Icons ────────────────────────────────────────────── */

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', opacity: 0.7 }}>
    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8c0-.5.06-1 .17-1.47h2.69A17 17 0 0 0 4.24 8c0 .5.04 1 .12 1.47H1.67A6.5 6.5 0 0 1 1.5 8zm1.12 2.97h2.24c.2.9.5 1.72.88 2.4A6.53 6.53 0 0 1 2.62 10.97zm0-5.94A6.53 6.53 0 0 1 5.74 2.63c-.38.68-.68 1.5-.88 2.4H2.62zM7.25 14.4C6.36 13.6 5.67 12.4 5.28 10.97h1.97V14.4zm0-4.93H5.87A15.4 15.4 0 0 1 5.74 8c0-.5.05-1 .13-1.47h1.38V9.47zm0-4.44H5.28c.39-1.43 1.08-2.63 1.97-3.43V5.03zm6.13 0h-2.24c-.2-.9-.5-1.72-.88-2.4a6.53 6.53 0 0 1 3.12 2.4zm-5.63-3.43c.89.8 1.58 2 1.97 3.43H8.75V1.6zm0 4.93v2.94H10.13c.08-.47.13-.97.13-1.47s-.05-1-.13-1.47H8.75zm0 4.44v3.43c.89-.8 1.58-2 1.97-3.43H8.75zm1.51 3.4c.38-.68.68-1.5.88-2.4h2.24a6.53 6.53 0 0 1-3.12 2.4zm1.1-3.9h2.97A6.5 6.5 0 0 0 14.5 8c0-.5-.06-1-.17-1.47h-2.69c.08.47.12.97.12 1.47s-.04 1-.12 1.47z"/>
  </svg>
);

import ClapIcon from '../icons/ClapIcon';

const LikeIcon = ({ filled }) => (
  <ClapIcon size={34} filled={filled} color={filled ? '#0a66c2' : '#666'} />
);

const CommentBubbleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const RepostIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

const SendPlaneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? '#0a66c2' : 'none'} stroke={filled ? '#0a66c2' : '#666'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);

/* ── Overlapping Reaction Badges ─────────────────────────────────── */
function ReactionBadges() {
  const s = 20;
  const badgeBase = {
    width: s, height: s,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--surface, #fff)',
    position: 'relative',
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ ...badgeBase, background: 'linear-gradient(135deg, #378fe9, #0a66c2)', zIndex: 3 }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="#fff"><path d="M13.7 5.3H9.5l.6-2.4c.2-.7 0-1.4-.5-1.9L8.4 0 4.1 5.1c-.3.3-.4.7-.4 1.1v7.4c0 .8.6 1.4 1.4 1.4h6c.6 0 1.1-.3 1.3-.8l2-4.6c.1-.2.1-.4.1-.6V6.7c0-.8-.6-1.4-1.4-1.4h-.4zM1 15h1.5V6H1v9z"/></svg>
      </span>
      <span style={{ ...badgeBase, background: 'linear-gradient(135deg, #f5564e, #df3e35)', zIndex: 2, marginLeft: -6 }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="#fff"><path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2.5 6 2.5c1 0 1.8.5 2 1 .2-.5 1-1 2-1 1.5 0 3.5 1.5 3.5 4S8 14 8 14z"/></svg>
      </span>
      <span style={{ ...badgeBase, background: 'linear-gradient(135deg, #44b37f, #2d8c5f)', zIndex: 1, marginLeft: -6 }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="#fff"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9.5 4.5 11.5l.5-3.5L2.5 5.5 6 5z"/></svg>
      </span>
    </span>
  );
}

/* ── Instagram/LinkedIn-style Dot Carousel (legacy export) ───────── */
export function MediaCarousel({ files, aspectRatio = '1:1' }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);

  if (!files || files.length === 0) return null;

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50 && index < files.length - 1) setIndex(i => i + 1);
    if (diff < -50 && index > 0) setIndex(i => i - 1);
    touchStart.current = null;
  };

  const f = files[index];
  const isVideo = f.file_type?.startsWith('video/') || f.type?.startsWith('video/');

  const activeRatio = f.aspect_ratio || aspectRatio || '1:1';
  let cssRatio = '1 / 1';
  let maxH = 'min(65dvh, 540px)';
  if (activeRatio === '4:5') {
    cssRatio = '4 / 5';
    maxH = 'min(72dvh, 600px)';
  } else if (activeRatio === '3:4') {
    cssRatio = '3 / 4';
    maxH = 'min(74dvh, 620px)';
  }

  return (
    <div style={{ position: 'relative', width: '100%', background: '#000', userSelect: 'none', overflow: 'hidden' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ width: '100%', aspectRatio: cssRatio, maxHeight: maxH, overflow: 'hidden' }}
        >
          {isVideo ? (
            <video src={f.storage_url || f.url} controls playsInline preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <img src={f.storage_url || f.url} alt="" draggable={false} loading="lazy" decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
        </motion.div>
      </AnimatePresence>

      {files.length > 1 && (
        <>
          {index > 0 && (
            <div onClick={() => setIndex(i => i - 1)}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 5 }} />
          )}
          {index < files.length - 1 && (
            <div onClick={() => setIndex(i => i + 1)}
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 5 }} />
          )}
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 9px', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#fff', fontWeight: 600, zIndex: 10 }}>
            {index + 1} / {files.length}
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 10 }}>
            {files.map((_, i) => (
              <div key={i} onClick={() => setIndex(i)}
                style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, background: i === index ? 'var(--green, #00B4D8)' : 'rgba(255,255,255,0.5)', transition: 'all 0.25s', cursor: 'pointer' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── LinkedIn-style Document Carousel Inner Card ─────────────────── */
function DocumentCarousel({ post, onDoubleTap }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);

  // Normalize media items: prioritize post.media (from post_media), fallback to post.files, then thumbnail_url
  const files = (post.media && post.media.length > 0)
    ? post.media.map(m => ({
        storage_url: m.media_url,
        file_type: 'image/jpeg',
        aspect_ratio: m.aspect_ratio || post.aspect_ratio || '1:1',
      }))
    : (post.files || []);
  const singleImg = post.thumbnail_url;
  const hasFiles = files.length > 0;
  const totalPages = hasFiles ? files.length : (singleImg ? 1 : 0);
  if (totalPages === 0) return null;

  /* Smart title: use post.title if it differs from description, otherwise use creator name */
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

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50 && index < totalPages - 1) setIndex(i => i + 1);
    if (diff < -50 && index > 0) setIndex(i => i - 1);
    touchStart.current = null;
  };

  const currentItem = hasFiles ? files[index] : null;
  const currentSrc = hasFiles ? currentItem?.storage_url : singleImg;
  const isVideo = hasFiles && currentItem?.file_type?.startsWith('video/');

  // Compute adaptive aspect ratio for Instagram carousels (4:5, 3:4, or 1:1)
  const currentRatio = currentItem?.aspect_ratio || post.aspect_ratio || '1:1';
  let cssAspectRatio = '1/1';
  let maxHeight = 'min(65dvh, 540px)';
  if (currentRatio === '4:5') {
    cssAspectRatio = '4/5';
    maxHeight = 'min(72dvh, 600px)';
  } else if (currentRatio === '3:4') {
    cssAspectRatio = '3/4';
    maxHeight = 'min(74dvh, 620px)';
  }

  const isDocument = post.type === 'document' || post.is_document || Boolean(post.document_url);

  return (
    <div style={{
      margin: isDocument ? '0 16px 14px' : '0 0 10px',
      borderRadius: isDocument ? 10 : 0,
      overflow: 'hidden',
      background: 'var(--s2, #f8fafd)',
      width: '100%',
    }}>
      {/* ── Instagram Attribution Banner ───────────── */}
      {post.source_platform === 'instagram' && post.original_creator_handle && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'linear-gradient(90deg, rgba(225,48,108,0.08), rgba(245,96,64,0.08))',
          borderBottom: '1px solid rgba(225,48,108,0.15)',
          fontSize: 12,
          color: '#e1306c',
          fontWeight: 600,
        }}>
          <span>📸 Instagram: @{post.original_creator_handle}</span>
          {totalPages > 1 && (
            <span style={{ color: 'var(--sub, #666)', fontWeight: 500, fontSize: 11 }}>
              Slide {index + 1} of {totalPages}
            </span>
          )}
        </div>
      )}
      {/* ── Title Bar (documents only) ──────────────── */}
      {isDocument && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--s2, #f8fafd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text, #191919)',
            fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
            lineHeight: 1.35,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {docTitle}
            {totalPages > 1 && (
              <span style={{ fontWeight: 400, color: 'var(--sub, #666)', fontSize: 13 }}>
                {' '}· {totalPages} pages
              </span>
            )}
          </p>
        </div>
      )}

      {/* ── Document / Image Scroll Viewer ────────────────────────── */}
      <div
        style={{
          position: 'relative',
          background: 'var(--s2, #eef1f5)',
          userSelect: 'none',
          cursor: totalPages > 1 ? 'grab' : 'default',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={onDoubleTap}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isDocument && totalPages > 1 ? 16 : 0,
              minHeight: 220,
            }}
          >
            {isVideo ? (
              <video
                src={currentSrc}
                controls
                playsInline
                preload="metadata"
                style={{
                  width: '100%',
                  maxHeight: 420,
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: isDocument && totalPages > 1 ? 6 : 0,
                  boxShadow: isDocument && totalPages > 1 ? '0 4px 20px rgba(0,0,0,0.12)' : 'none',
                }}
              />
            ) : (
              <img
                src={currentSrc}
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  aspectRatio: cssAspectRatio,
                  maxHeight: maxHeight,
                  objectFit: isDocument && totalPages > 1 ? 'contain' : 'cover',
                  display: 'block',
                  borderRadius: isDocument && totalPages > 1 ? 6 : 0,
                  boxShadow: isDocument && totalPages > 1 ? '0 4px 20px rgba(0,0,0,0.12)' : 'none',
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Page Badge pill */}
        {totalPages > 1 && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            borderRadius: 14,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            zIndex: 10,
            letterSpacing: '0.3px',
          }}>
            {index + 1}/{totalPages}
          </div>
        )}

        {/* Overlaid dot indicators for image posts */}
        {!isDocument && totalPages > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 5,
            zIndex: 10,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            padding: '4px 8px',
            borderRadius: 12,
          }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                style={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === index ? 'var(--green, #00B4D8)' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.25s',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}

        {/* Invisible click zones for navigation */}
        {totalPages > 1 && (
          <>
            {index > 0 && (
              <div
                onClick={(e) => { e.stopPropagation(); setIndex(i => i - 1); }}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', cursor: 'w-resize', zIndex: 5 }}
              />
            )}
            {index < totalPages - 1 && (
              <div
                onClick={(e) => { e.stopPropagation(); setIndex(i => i + 1); }}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', cursor: 'e-resize', zIndex: 5 }}
              />
            )}
          </>
        )}
      </div>

      {/* ── Bottom dot nav (multi-page documents only) ───────── */}
      {isDocument && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 5,
          padding: '10px 0',
          background: 'var(--s2, #f8fafd)',
          borderTop: '1px solid var(--border, #e8e8e8)',
        }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === index ? 'var(--green, #0a66c2)' : 'var(--dim, rgba(0,0,0,0.15))',
                transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Rich Video Player for Feed (YouTube iframe embed + HTML5 video) ── */
function FeedVideoPlayer({ post, onDoubleTap }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const videoUrl = post.video_url || post.files?.[0]?.storage_url || post.files?.[0]?.url;
  const isYouTube = Boolean(videoUrl && /youtu\.be|youtube\.com/i.test(videoUrl));
  const embedUrl = isYouTube ? toYouTubeEmbed(videoUrl, true) : null;
  const isShort = Boolean(post.type === 'short' || post.is_short || post.aspect_ratio === '9:16');
  const cssAspectRatio = isShort ? '9/16' : (post.aspect_ratio === '4:5' ? '4/5' : (post.aspect_ratio === '3:4' ? '3/4' : '16/9'));
  const maxHeight = isShort ? 'min(75dvh, 620px)' : 'min(65dvh, 520px)';

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoUrl || !videoUrl.includes('.m3u8')) return;
    let hls = null;
    let cancelled = false;

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

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  const status = (post?.status || post?.job_status || post?.moderation_status || '').toLowerCase();
  const isPending = status === 'pending' || status === 'chunking' || status === 'downloading' || status === 'processing' || status === 'queued' || (!videoUrl && !isYouTube);

  if (isPending) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: cssAspectRatio,
        maxHeight,
        background: '#0d1117',
        overflow: 'hidden',
        margin: '0 0 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
      }}>
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, filter: 'blur(8px)' }}
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
            color: 'rgba(255,255,255,0.75)',
            fontFamily: 'var(--font-body, -apple-system, sans-serif)',
            maxWidth: 320,
            lineHeight: 1.4,
          }}>
            Video is currently processing in the background pipeline. It will be playable as soon as confirmation completes.
          </p>
        </div>
      </div>
    );
  }

  if (isYouTube && isPlaying && embedUrl) {
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: cssAspectRatio, maxHeight, background: '#000', margin: '0 0 10px', overflow: 'hidden' }}>
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
          background: '#000',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 0 10px',
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

        {/* Play Button */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.92)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(239,68,68,0.45)',
          transition: 'transform 0.2s ease',
        }}>
          <span style={{ color: '#fff', fontSize: 22, marginLeft: 4 }}>▶</span>
        </div>

        {/* Duration pill */}
        {post.duration_formatted && (
          <span style={{
            position: 'absolute',
            bottom: 10,
            right: 12,
            background: 'rgba(0,0,0,0.82)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {post.duration_formatted}
          </span>
        )}

        {/* Short badge */}
        {isShort && (
          <span style={{
            position: 'absolute',
            top: 10,
            left: 12,
            background: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Short
          </span>
        )}
      </div>
    );
  }

  // Direct MP4 / WebM / HLS video
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: cssAspectRatio, maxHeight, background: '#000', overflow: 'hidden', margin: '0 0 10px' }}>
      <video
        ref={videoRef}
        src={videoUrl?.includes('.m3u8') ? undefined : videoUrl}
        poster={post.thumbnail_url}
        controls
        playsInline
        preload="metadata"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

/* ── Tag badge for articles ──────────────────────────────────────── */
const TAG_COLOR = {
  article:  { bg: 'rgba(0,180,216,0.12)',  color: 'var(--green)',  border: 'rgba(0,180,216,0.25)' },
  course:   { bg: 'rgba(147,51,234,0.12)', color: 'var(--accent-purple)',  border: 'rgba(147,51,234,0.25)' },
  resource: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981',  border: 'rgba(16,185,129,0.25)' },
  default:  { bg: 'var(--s2)',             color: 'var(--sub)',  border: 'var(--border)' },
};
function TypeTag({ type }) {
  const tc = TAG_COLOR[type] || TAG_COLOR.default;
  return (
    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '3px 8px', borderRadius: 4, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
      {type}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════╗
   Main PostCard — LinkedIn Document Carousel Layout
╚══════════════════════════════════════════════════════════════════ */
export default function PostCard({ post, onSaveToggle, refSource = 'feed', variant = 'editorial' }) {
  const { user } = useAuth();
  const { openSaveToContainer } = useSaveToContainer();
  const navigate = useNavigate();
  const [clapped,  setClapped]  = useState(post.is_clapped || false);
  const [clapCount,setClapCount]= useState(parseInt(post.clap_count) || 0);
  const [saved,    setSaved]    = useState(post.is_saved || false);
  const [heartAnim,setHeartAnim]= useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastTap = useRef(0);

  const isVideoPost = Boolean(post.is_video_item || post.type === 'video' || post.type === 'short' || post.video_url);

  const handleClap = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!user) return;
    const endpoint = isVideoPost ? `/videos/${post.id}/like` : `/posts/${post.id}/clap`;
    if (clapped) {
      setClapped(false); setClapCount(p => Math.max(0, p - 1));
      try { await api.delete(endpoint); }
      catch { setClapped(true); setClapCount(p => p + 1); }
    } else {
      setClapped(true); setClapCount(p => p + 1);
      try { await api.post(endpoint); }
      catch { setClapped(false); setClapCount(p => p - 1); }
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!clapped) handleClap();
      setHeartAnim(true); setTimeout(() => setHeartAnim(false), 900);
    }
    lastTap.current = now;
  };

  const handleSave = (e) => {
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
    if (isVideoPost) {
      try { api.post(`/videos/${post.id}/save`); } catch {}
    }
    onSaveToggle?.(post.id, true);
  };

  const handleShare = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setShareOpen(true);
  };

  const goProfile = (e) => { e.preventDefault(); e.stopPropagation(); navigate(`/u/${post.creator_username}`); };
  const goPost    = () => {
    if (isVideoPost) {
      if (post.type === 'short' || post.content_type === 'short' || post.is_short) {
        navigate(`/shorts/${post.id}`);
      } else {
        navigate(`/videos/${post.id}`);
      }
    } else {
      navigate(`/posts/${post.id}`);
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     SOCIAL / MEDIA POST — LinkedIn Document Carousel Layout
  ══════════════════════════════════════════════════════════════════ */
  if (post.type === 'post' || post.type === 'carousel' || post.type === 'image' || isVideoPost) {
    if (hidden) return null;
    const hasMedia  = (post.media && post.media.length > 0) || post.files?.length > 0 || post.thumbnail_url || post.video_url;
    const rawCaption   = post.description || post.caption || post.content || post.title || '';
    const { beforeText, codeSnippet, afterText } = extractCodeBlock(rawCaption);
    const hasExtractedCode = !!codeSnippet;
    const finalCodeSnippet = post.code_snippet ? { code: post.code_snippet, language: post.code_language || 'typescript', title: post.code_title } : codeSnippet;
    const displayCaption = hasExtractedCode ? beforeText : rawCaption;
    const followerCount = post.creator_follower_count || post.follower_count || null;

    return (
      <article style={{
        background: 'var(--surface, #fff)',
        borderRadius: 'var(--r-md, 10px)',
        overflow: 'hidden',
        marginBottom: 10,
        border: '1px solid var(--border, #e0e0e0)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>

        {/* ─────────────────────────────────────────────────────────────
            1 · HEADER — 3-Line Metadata Stack
        ───────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '14px 16px 8px',
          gap: 10,
        }}>
          {/* Avatar */}
          <img
            onClick={goProfile}
            src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`}
            alt=""
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              cursor: 'pointer',
              flexShrink: 0,
              background: 'var(--s2, #eee)',
            }}
          />

          {/* 3-line text stack */}
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={goProfile}>
            {/* Line 1 — Name + optional role */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1.3,
                color: 'var(--text, #191919)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {post.creator_name || post.creator_username}
              </p>
              {post.difficulty && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#9333ea',
                  background: 'rgba(147, 51, 234, 0.08)',
                  border: '1px solid rgba(147, 51, 234, 0.2)',
                  borderRadius: 6,
                  padding: '1px 7px',
                  textTransform: 'capitalize',
                }}>
                  {post.difficulty}
                </span>
              )}
            </div>

            {/* Line 2 — Followers or handle */}
            <p style={{
              margin: '1px 0 0',
              fontSize: 12,
              lineHeight: 1.3,
              color: 'var(--sub, #666)',
              fontFamily: 'var(--font-body, -apple-system, sans-serif)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {followerCount
                ? `${Number(followerCount).toLocaleString()} followers`
                : `@${post.creator_username}`
              }
            </p>

            {/* Line 3 — Time + globe */}
            <p style={{
              margin: '1px 0 0',
              fontSize: 12,
              lineHeight: 1.3,
              color: 'var(--sub, #666)',
              fontFamily: 'var(--font-body, -apple-system, sans-serif)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}>
              {timeAgo(post.created_at)}
              <span style={{ opacity: 0.5, fontSize: 8, lineHeight: 1 }}>•</span>
              <GlobeIcon />
              {(() => {
                const s = (post?.status || post?.job_status || post?.moderation_status || '').toLowerCase();
                if (s === 'pending' || s === 'chunking' || s === 'downloading' || s === 'processing' || s === 'queued' || s === 'under_review') {
                  return (
                    <span style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      marginLeft: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                      PENDING
                    </span>
                  );
                }
                if (s === 'removed') return <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginLeft: 6 }}>REMOVED</span>;
                return null;
              })()}
            </p>
          </div>

          {/* Three-dot action menu */}
          <ContentActionMenu
            contentId={post.id}
            contentType={isVideoPost ? (post.type === 'short' || post.is_short ? 'short' : 'video') : 'post'}
            contentAuthorId={post.creator_id || post.creator_user_id || post.user_id}
            creatorUsername={post.creator_username}
            title={post.title}
            contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/${isVideoPost ? 'videos' : 'posts'}/${post.id}` : undefined}
            onSave={handleSave}
            isSaved={saved}
            onShare={() => setShareOpen(true)}
            onHide={() => setHidden(true)}
            sourceSurface="community_feed"
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2 · CAPTION & CODE SNIPPET
        ───────────────────────────────────────────────────────────── */}
        {((post?.moderation_status || post?.status || '').toLowerCase() === 'removed') ? (
          <div style={{ padding: '8px 16px 14px', color: '#ef4444', fontSize: 13, fontStyle: 'italic' }}>
            [This post was removed for violating community guidelines]
          </div>
        ) : (
          <>
            {displayCaption && (
              <div style={{ padding: '4px 16px 10px', position: 'relative' }}>
                <div style={{
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: 'var(--text, #191919)',
                  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
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
                {!captionExpanded && displayCaption.length > 120 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCaptionExpanded(true); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--sub, #666666)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      marginTop: 2,
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
              <div style={{ padding: '0 16px 10px' }}>
                <CodeSnippetCard
                  code={finalCodeSnippet.code}
                  language={finalCodeSnippet.language}
                  title={finalCodeSnippet.title}
                />
              </div>
            )}

            {/* Trailing caption text if any */}
            {hasExtractedCode && afterText && (
              <div style={{ padding: '0 16px 10px', fontSize: 14, lineHeight: 1.45, color: 'var(--text, #191919)' }}>
                {afterText}
              </div>
            )}

            {/* Tags Pills */}
            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '2px 16px 10px' }}>
                {post.tags.map((t, idx) => (
                  <span key={idx} style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    color: 'var(--sub)',
                    background: 'var(--card, rgba(0,0,0,0.04))',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '2px 8px',
                  }}>
                    #{t.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3 · DOCUMENT CAROUSEL / VIDEO CARD
        ───────────────────────────────────────────────────────────── */}
        {isVideoPost && (post.video_url || post.files?.[0]?.storage_url || post.files?.[0]?.file_type?.startsWith('video/')) ? (
          <FeedVideoPlayer post={post} onDoubleTap={handleDoubleTap} />
        ) : hasMedia ? (
          <DocumentCarousel post={post} onDoubleTap={handleDoubleTap} />
        ) : null}

        {/* Double-tap heart overlay */}
        <AnimatePresence>
          {heartAnim && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
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
              <HandHeart size={80} color="var(--text)" fill="#ff3b5c" strokeWidth={0} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────────────────────────────────────────────────────────
            4 · ENGAGEMENT STATS BAR
        ───────────────────────────────────────────────────────────── */}
        {(clapCount > 0 || post.comment_count > 0) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            fontSize: 13,
            color: 'var(--sub, #666)',
            fontFamily: 'var(--font-body, -apple-system, sans-serif)',
          }}>
            {/* Left — Reaction badges + count */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {clapCount > 0 && (
                <>
                  <ReactionBadges />
                  <span style={{ fontSize: 13 }}>{clapCount.toLocaleString()}</span>
                </>
              )}
            </span>

            {/* Right — Comments + reposts */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              {post.comment_count > 0 && (
                <span
                  onClick={(e) => { e.stopPropagation(); setCommentOpen(true); }}
                  style={{ cursor: 'pointer', transition: 'text-decoration 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {post.comment_count} comment{post.comment_count === 1 ? '' : 's'}
                </span>
              )}
              {post.comment_count > 0 && post.repost_count > 0 && (
                <span style={{ margin: '0 2px', opacity: 0.5 }}>·</span>
              )}
              {post.repost_count > 0 && (
                <span>{post.repost_count} repost{post.repost_count === 1 ? '' : 's'}</span>
              )}
            </span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5 · ICON-ONLY ACTION FOOTER
        ───────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          borderTop: '1px solid var(--border, #e9e9e9)',
          padding: '2px 0',
        }}>
          {[
            { label: 'Like',    icon: <LikeIcon filled={clapped} />, action: handleClap },
            { label: 'Comment', icon: <CommentBubbleIcon />,         action: (e) => { e?.preventDefault(); e?.stopPropagation(); setCommentOpen(true); } },
            { label: 'Save',    icon: <BookmarkIcon filled={saved} />, action: handleSave },
            { label: 'Send',    icon: <SendPlaneIcon />,             action: handleShare },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              aria-label={label}
              onClick={action}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 20px',
                borderRadius: 8,
                transition: 'background 0.15s',
                flex: 1,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--s2, #f0f0f0)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
              onMouseDown={e => e.currentTarget.style.background = 'var(--border, #e0e0e0)'}
              onMouseUp={e => e.currentTarget.style.background = 'var(--s2, #f0f0f0)'}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Comment Sheet */}
        <CommentSheet
          isOpen={commentOpen}
          onClose={() => setCommentOpen(false)}
          entityId={post.id}
          entityType="post"
          user={user}
        />

        {/* Instagram-Style Share Sheet */}
        <ShareSheet
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          contentType={post.type || 'post'}
          contentId={post.id}
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
      <article onClick={goPost}
        style={{ marginBottom: 16, borderRadius: 'var(--r-md, 16px)', overflow: 'hidden', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', transition: 'border-color 0.2s', boxShadow: 'var(--shadow-card)' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', overflow: 'hidden', background: 'var(--s2)' }}>
          <img src={post.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200'} alt="" loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--surface) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', top: 16, left: 20 }}><TypeTag type={post.type} /></div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 800, fontSize: 20, color: 'var(--text)', lineHeight: 1.3, margin: '0 0 8px' }}>{post.title}</h2>
          <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div onClick={e => { e.stopPropagation(); goProfile(e); }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <img src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`} alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{post.creator_name || post.creator_username}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: 10, color: 'var(--sub)' }}>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </article>
    );
  }

  /* ── STANDARD EDITORIAL card (articles / tutorials / resources) ─── */
  return (
    <article
      style={{ marginBottom: 14, borderRadius: 'var(--r-md, 14px)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', transition: 'border-color 0.2s', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      onClick={goPost}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 0' }} onClick={e => e.stopPropagation()}>
        <div onClick={goProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
          <img src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`} alt=""
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 }}>{post.creator_name || post.creator_username}</p>
            <p style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: 9, color: 'var(--sub)', margin: 0 }}>{post.type?.charAt(0).toUpperCase()}{post.type?.slice(1)} · {timeAgo(post.created_at)}</p>
          </div>
        </div>
        <TypeTag type={post.type} />
      </div>

      <div style={{ padding: '12px 16px' }}>
        {post.title && <p style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 5px', lineHeight: 1.4 }}>{post.title}</p>}
        {post.description && <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.description}</p>}
      </div>

      {post.thumbnail_url && (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: post.aspect_ratio === '4:5' ? '4/5' : (post.aspect_ratio === '3:4' ? '3/4' : (post.aspect_ratio === '1:1' ? '1/1' : '16/9')),
          maxHeight: 'min(65dvh, 520px)',
          overflow: 'hidden',
          background: 'var(--s2, #000)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={post.thumbnail_url}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <button aria-label="Toggle clap" onClick={handleClap} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: clapped ? '#ff3b5c' : 'var(--sub)', fontSize: 12, fontFamily: 'var(--font-mono, monospace)', padding: 0 }}>
          <HandHeart size={16} fill={clapped ? 'currentColor' : 'none'} strokeWidth={1.5} /> {clapCount > 0 && clapCount}
        </button>
        <button
          aria-label="Comment"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCommentOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontSize: 12, fontFamily: 'var(--font-mono, monospace)', padding: 0 }}
        >
          <MessageCircle size={15} strokeWidth={1.5} /> {post.comment_count || 0}
        </button>
        <button
          aria-label="Share"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontSize: 12, fontFamily: 'var(--font-mono, monospace)', padding: 0 }}
        >
          <Send size={15} strokeWidth={1.5} />
        </button>
        <button aria-label="Save post" onClick={handleSave} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: saved ? 'var(--green)' : 'var(--sub)', padding: 0, display: 'flex' }}>
          <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      </div>

      {/* Inline Comment Sheet for editorial cards */}
      <CommentSheet
        isOpen={commentOpen}
        onClose={() => setCommentOpen(false)}
        entityId={post.id}
        entityType="post"
        user={user}
      />

      {/* Instagram-Style Share Sheet */}
      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        contentType={post.type || 'post'}
        contentId={post.id}
        contentTitle={post.title || post.caption || post.description || ''}
        contentThumbnail={post.thumbnail_url || (post.files?.[0]?.url) || null}
        contentAuthor={post.creator_name || post.creator_username || ''}
      />
    </article>
  );
}
