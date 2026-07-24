import { useNavigate } from 'react-router-dom';
import { HandHeart, MessageCircle, Bookmark, Send, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CommentSheet from '../ui/CommentSheet';

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

/* ── Inline SVG Icons (LinkedIn-style) ───────────────────────────── */
const GlobeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM3.17 4.5h2.06A12.3 12.3 0 0 1 5.9 2.1 5.97 5.97 0 0 0 3.17 4.5zm-.93 2A6 6 0 0 0 2 8c0 .52.07 1.03.19 1.5H4.5A18 18 0 0 1 4.35 8c0-.52.04-1.02.1-1.5H2.24zm.93 5h2.06c-.27-.74-.47-1.54-.57-2.4H3.17A5.97 5.97 0 0 0 3.17 11.5zm3.08 2.4A12.3 12.3 0 0 1 5.59 11.5H3.53a5.97 5.97 0 0 0 2.72 2.4zm.75.08c.72-.72 1.3-1.66 1.68-2.48H6.32c.39.82.96 1.76 1.68 2.48zM6.32 4.5h3.36A10.3 10.3 0 0 0 8 2.02 10.3 10.3 0 0 0 6.32 4.5zM5.5 8c0 .52.04 1.02.12 1.5h4.76c.08-.48.12-.98.12-1.5s-.04-1.02-.12-1.5H5.62A11.5 11.5 0 0 0 5.5 8zm4.91 3.5H7.26c.39.82.96 1.76 1.68 2.48.72-.72 1.3-1.66 1.47-2.48zm.42-7h2.06A5.97 5.97 0 0 0 10.1 2.1c.27.74.47 1.54.57 2.4h2.16zm2.93 2h-2.4c.06.48.1.98.1 1.5s-.04 1.02-.1 1.5h2.4c.12-.47.19-.98.19-1.5s-.07-1.03-.19-1.5zm-.93 5h-2.06c.27-.74.47-1.54.57-2.4h2.16a5.97 5.97 0 0 1-2.67 2.4z"/>
  </svg>
);

const LikeIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#0a66c2' : 'none'} stroke={filled ? '#0a66c2' : '#666666'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 22V11l5-9 1.5 1c.6.4.8 1.1.6 1.8L13 9h7a2 2 0 0 1 2 2.2l-1.4 8A2 2 0 0 1 18.6 21H7z"/>
    <path d="M3 11h2v11H3a1 1 0 0 1-1-1V12a1 1 0 0 1 1-1z"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const RepostIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

const SendIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

/* Overlapping Reaction Badges ─────────────────────────────────── */
function ReactionBadges() {
  const size = 18;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 4 }}>
      {/* Blue Thumbs Up */}
      <span style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #378fe9 0%, #0a66c2 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', zIndex: 3, position: 'relative' }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="#fff"><path d="M13.7 5.3H9.5l.6-2.4c.2-.7 0-1.4-.5-1.9L8.4 0 4.1 5.1c-.3.3-.4.7-.4 1.1v7.4c0 .8.6 1.4 1.4 1.4h6c.6 0 1.1-.3 1.3-.8l2-4.6c.1-.2.1-.4.1-.6V6.7c0-.8-.6-1.4-1.4-1.4h-.4zM1 15h1.5V6H1v9z"/></svg>
      </span>
      {/* Red Heart */}
      <span style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #f5564e 0%, #df3e35 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', zIndex: 2, position: 'relative', marginLeft: -5 }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="#fff"><path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2.5 6 2.5c1 0 1.8.5 2 1 .2-.5 1-1 2-1 1.5 0 3.5 1.5 3.5 4S8 14 8 14z"/></svg>
      </span>
      {/* Green Celebrate */}
      <span style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #44b37f 0%, #2d8c5f 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', zIndex: 1, position: 'relative', marginLeft: -5 }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="#fff"><path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9.5 4.5 11.5l.5-3.5L2.5 5.5 6 5z"/></svg>
      </span>
    </span>
  );
}

/* ── Instagram/LinkedIn-style Dot Carousel ──────────────────────── */
export function MediaCarousel({ files }) {
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
  const isVideo = f.file_type?.startsWith('video/');

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
          style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}
        >
          {isVideo ? (
            <video src={f.storage_url} controls playsInline preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <img src={f.storage_url} alt="" draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Left / Right click zones (desktop) */}
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

          {/* Position indicator badge (top-right) */}
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 9px', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#fff', fontWeight: 600, zIndex: 10 }}>
            {index + 1} / {files.length}
          </div>

          {/* Dot indicators */}
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

/* ── LinkedIn Document Carousel (inner card) ─────────────────────── */
function DocumentCarousel({ post }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);

  const files = post.files || [];
  const singleImg = post.thumbnail_url;
  const hasFiles = files.length > 0;
  const totalPages = hasFiles ? files.length : (singleImg ? 1 : 0);
  if (totalPages === 0) return null;

  const docTitle = post.title || post.creator_name || 'Document';

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50 && index < totalPages - 1) setIndex(i => i + 1);
    if (diff < -50 && index > 0) setIndex(i => i - 1);
    touchStart.current = null;
  };

  const currentSrc = hasFiles ? files[index]?.storage_url : singleImg;
  const isVideo = hasFiles && files[index]?.file_type?.startsWith('video/');

  return (
    <div style={{
      margin: '0 16px 12px',
      border: '1px solid var(--border, #d0d7de)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--surface, #fff)',
    }}>
      {/* Title Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--s2, #f8fafd)',
        borderBottom: '1px solid var(--border, #e9e9e9)',
      }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text, #191919)',
          fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
          lineHeight: 1.3,
        }}>
          {docTitle}{totalPages > 1 ? ` · ${totalPages} pages` : ''}
        </p>
      </div>

      {/* Document Viewer Area */}
      <div
        style={{
          position: 'relative',
          background: 'var(--s2, #f0f4f8)',
          userSelect: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: hasFiles && files.length > 1 ? '20px 20px' : 0,
              minHeight: 200,
            }}
          >
            {isVideo ? (
              <video src={currentSrc} controls playsInline preload="metadata"
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block', borderRadius: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }} />
            ) : (
              <img src={currentSrc} alt="" draggable={false}
                style={{
                  width: '100%',
                  maxHeight: 420,
                  objectFit: hasFiles && files.length > 1 ? 'contain' : 'cover',
                  display: 'block',
                  borderRadius: hasFiles && files.length > 1 ? 4 : 0,
                  boxShadow: hasFiles && files.length > 1 ? '0 2px 12px rgba(0,0,0,0.12)' : 'none',
                }} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Page Badge (top-right pill) */}
        {totalPages > 1 && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            borderRadius: 14,
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            zIndex: 10,
            lineHeight: 1.4,
          }}>
            {index + 1}/{totalPages}
          </div>
        )}

        {/* Click zones for desktop navigation */}
        {totalPages > 1 && (
          <>
            {index > 0 && (
              <div onClick={() => setIndex(i => i - 1)}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '35%', cursor: 'pointer', zIndex: 5 }} />
            )}
            {index < totalPages - 1 && (
              <div onClick={() => setIndex(i => i + 1)}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%', cursor: 'pointer', zIndex: 5 }} />
            )}
          </>
        )}
      </div>

      {/* Dot indicators for multi-page */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 5,
          padding: '10px 0',
          background: 'var(--s2, #f8fafd)',
          borderTop: '1px solid var(--border, #e9e9e9)',
        }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div key={i} onClick={() => setIndex(i)}
              style={{
                width: i === index ? 14 : 6,
                height: 6,
                borderRadius: 3,
                background: i === index ? 'var(--green, #0a66c2)' : 'var(--border, rgba(0,0,0,0.2)',
                transition: 'all 0.25s',
                cursor: 'pointer',
              }} />
          ))}
        </div>
      )}
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
   Main PostCard (LinkedIn Document Carousel Layout)
╚══════════════════════════════════════════════════════════════════ */
export default function PostCard({ post, onSaveToggle, refSource = 'feed', variant = 'editorial' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clapped,  setClapped]  = useState(post.is_clapped || false);
  const [clapCount,setClapCount]= useState(parseInt(post.clap_count) || 0);
  const [saved,    setSaved]    = useState(post.is_saved || false);
  const [heartAnim,setHeartAnim]= useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const lastTap = useRef(0);

  const handleClap = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!user) return;
    if (clapped) {
      setClapped(false); setClapCount(p => p - 1);
      try { await api.delete(`/posts/${post.id}/clap`); }
      catch { setClapped(true); setClapCount(p => p + 1); }
    } else {
      setClapped(true); setClapCount(p => p + 1);
      try { await api.post(`/posts/${post.id}/clap`); }
      catch { setClapped(false); setClapCount(p => p - 1); }
    }
  };

  const handleDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!clapped) handleClap();
      setHeartAnim(true); setTimeout(() => setHeartAnim(false), 900);
    }
    lastTap.current = now;
  };

  const handleSave = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    const was = saved; setSaved(!was);
    try {
      if (was) await api.delete(`/saved/${post.id}`);
      else await api.post(`/saved/${post.id}`);
      onSaveToggle?.(post.id, !was);
    } catch { setSaved(was); }
  };

  const handleShare = (e) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard?.writeText(`${window.location.origin}/posts/${post.id}`);
    toast.success('Link copied!');
  };

  const goProfile = (e) => { e.preventDefault(); e.stopPropagation(); navigate(`/u/${post.creator_username}`); };
  const goPost    = () => navigate(`/posts/${post.id}`);

  /* ── SOCIAL / MEDIA POST (LinkedIn Document Carousel Layout) ───── */
  if (post.type === 'post') {
    const hasMedia = post.files?.length > 0 || post.thumbnail_url;
    const caption  = post.description || '';
    const SHORT    = 150;
    const isTrunc  = caption.length > SHORT;
    const displayed = captionExpanded || !isTrunc ? caption : caption.slice(0, SHORT);
    const followerCount = post.creator_follower_count || post.follower_count || null;

    /* Action button style */
    const actionBtnStyle = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 16px',
      borderRadius: 6,
      transition: 'background 0.15s',
      flex: 1,
    };

    return (
      <article style={{
        background: 'var(--surface, #fff)',
        borderRadius: 'var(--r-md, 12px)',
        overflow: 'hidden',
        marginBottom: 16,
        border: '1px solid var(--border, #e0e0e0)',
        boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
      }}>

        {/* ─── 1. HEADER: 3-Line Stack ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 16px 10px', gap: 10 }}>

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
              border: '1.5px solid var(--border, #e0e0e0)',
              flexShrink: 0,
            }}
          />

          {/* 3-Line Stack */}
          <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={goProfile}>
            {/* Line 1: Name */}
            <p style={{
              fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text, #191919)',
              margin: 0,
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {post.creator_name || post.creator_username}
            </p>

            {/* Line 2: Follower count */}
            <p style={{
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 12,
              color: 'var(--sub, #666666)',
              margin: '2px 0 0',
              lineHeight: 1.2,
            }}>
              {followerCount
                ? `${Number(followerCount).toLocaleString()} followers`
                : `@${post.creator_username}`
              }
            </p>

            {/* Line 3: Time + globe */}
            <p style={{
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 12,
              color: 'var(--sub, #666666)',
              margin: '2px 0 0',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <span>{timeAgo(post.created_at)}</span>
              <span style={{ fontSize: 10 }}>·</span>
              <GlobeIcon />
            </p>
          </div>

          {/* 3-dot menu */}
          <button aria-label="More options" style={{
            background: 'none',
            border: 'none',
            color: 'var(--sub, #666)',
            cursor: 'pointer',
            display: 'flex',
            padding: 6,
            borderRadius: '50%',
            transition: 'background 0.15s',
            flexShrink: 0,
            marginTop: 2,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--s2, #f0f0f0)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* ─── 2. CAPTION with ...more ──────────────────────────────── */}
        {caption && (
          <div style={{
            padding: '0 16px 12px',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--text, #191919)',
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            <span>{displayed}</span>
            {isTrunc && !captionExpanded && (
              <button
                type="button"
                onClick={() => setCaptionExpanded(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--sub, #666666)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  marginLeft: 2,
                }}
              >
                ...more
              </button>
            )}
          </div>
        )}

        {/* ─── 3. DOCUMENT CAROUSEL CARD ────────────────────────────── */}
        {hasMedia && (
          <DocumentCarousel post={post} />
        )}

        {/* Double-tap heart animation overlay */}
        <AnimatePresence>
          {heartAnim && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
              style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 999 }}
            >
              <HandHeart size={80} color="var(--text)" fill="#ff3b5c" strokeWidth={0} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── 4. ENGAGEMENT STATS BAR ──────────────────────────────── */}
        {(clapCount > 0 || post.comment_count > 0 || post.repost_count > 0) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            fontSize: 12,
            color: 'var(--sub, #666666)',
            borderBottom: '1px solid var(--border, #e9e9e9)',
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {/* Left: Reaction badges + count */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {clapCount > 0 && (
                <>
                  <ReactionBadges />
                  <span>{clapCount.toLocaleString()}</span>
                </>
              )}
            </span>

            {/* Right: Comments & reposts */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {post.comment_count > 0 && (
                <span
                  onClick={(e) => { e.stopPropagation(); setCommentOpen(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  {post.comment_count} comment{post.comment_count === 1 ? '' : 's'}
                </span>
              )}
              {post.comment_count > 0 && post.repost_count > 0 && (
                <span style={{ margin: '0 2px' }}>·</span>
              )}
              {post.repost_count > 0 && (
                <span>{post.repost_count} repost{post.repost_count === 1 ? '' : 's'}</span>
              )}
            </span>
          </div>
        )}

        {/* ─── 5. ICON-ONLY ACTION FOOTER ──────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '2px 4px',
          borderTop: (clapCount > 0 || post.comment_count > 0) ? 'none' : '1px solid var(--border, #e9e9e9)',
        }}>
          {/* Like */}
          <button
            aria-label="Like"
            onClick={handleClap}
            style={actionBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--s2, #f0f0f0)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <LikeIcon filled={clapped} />
          </button>

          {/* Comment */}
          <button
            aria-label="Comment"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCommentOpen(true); }}
            style={actionBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--s2, #f0f0f0)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <CommentIcon />
          </button>

          {/* Repost / Share */}
          <button
            aria-label="Repost"
            onClick={handleShare}
            style={actionBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--s2, #f0f0f0)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <RepostIcon />
          </button>

          {/* Send */}
          <button
            aria-label="Send"
            onClick={handleShare}
            style={actionBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--s2, #f0f0f0)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <SendIcon />
          </button>
        </div>

        {/* Inline Comment Sheet */}
        <CommentSheet
          isOpen={commentOpen}
          onClose={() => setCommentOpen(false)}
          entityId={post.id}
          entityType="post"
          user={user}
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
        <img src={post.thumbnail_url} alt="" loading="lazy"
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
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
    </article>
  );
}
