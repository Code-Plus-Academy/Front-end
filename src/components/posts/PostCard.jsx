import { useNavigate } from 'react-router-dom';
import { HandHeart, MessageCircle, Bookmark, Send, MoreHorizontal, FileText, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

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

/* ── Instagram-style Dot Carousel ──────────────────────────────── */
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
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 9px', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#fff', fontWeight: 600, zIndex: 10 }}>
            {index + 1} / {files.length}
          </div>

          {/* Dot indicators */}
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 10 }}>
            {files.map((_, i) => (
              <div key={i} onClick={() => setIndex(i)}
                style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, background: i === index ? '#4cd6fb' : 'rgba(255,255,255,0.5)', transition: 'all 0.25s', cursor: 'pointer' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Tag badge for articles ──────────────────────────────────────── */
const TAG_COLOR = {
  article:  { bg: 'rgba(76,214,251,0.12)',  color: '#4cd6fb',  border: 'rgba(76,214,251,0.25)' },
  course:   { bg: 'rgba(208,188,255,0.12)', color: '#d0bcff',  border: 'rgba(208,188,255,0.25)' },
  resource: { bg: 'rgba(52,211,153,0.12)',  color: '#34d399',  border: 'rgba(52,211,153,0.25)' },
  default:  { bg: 'rgba(74,68,87,0.2)',     color: '#958da3',  border: 'rgba(74,68,87,0.3)' },
};
function TypeTag({ type }) {
  const tc = TAG_COLOR[type] || TAG_COLOR.default;
  return (
    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '3px 8px', borderRadius: 4, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
      {type}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════╗
   Main PostCard
╚══════════════════════════════════════════════════════════════════ */
export default function PostCard({ post, onSaveToggle, refSource = 'feed', variant = 'editorial' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clapped,  setClapped]  = useState(post.is_clapped || false);
  const [clapCount,setClapCount]= useState(parseInt(post.clap_count) || 0);
  const [saved,    setSaved]    = useState(post.is_saved || false);
  const [heartAnim,setHeartAnim]= useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
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

  /* ── SOCIAL / MEDIA POST (Instagram clone) ──────────────────────── */
  if (post.type === 'post') {
    const hasMedia = post.files?.length > 0 || post.thumbnail_url;
    const caption  = post.description || '';
    const SHORT    = 125;
    const isTrunc  = caption.length > SHORT;
    const displayed = captionExpanded || !isTrunc ? caption : caption.slice(0, SHORT);

    return (
      <article style={{ background: 'var(--surface)', borderRadius: 18, overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border)'}}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
          <img onClick={goProfile}
            src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`}
            alt="" style={{ width: 33, height: 33, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1.5px solid rgba(110,0,255,0.5)', flexShrink: 0 }} />
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={goProfile}>
            <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1 }}>{post.creator_username}</p>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--sub)', margin: '2px 0 0', lineHeight: 1 }}>{timeAgo(post.created_at)}</p>
          </div>
          <button aria-label="More options" style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Media */}
        {hasMedia && (
          <div style={{ position: 'relative', overflow: 'hidden' }} onClick={handleDoubleTap}>
            {post.files?.length > 0 ? (
              <MediaCarousel files={post.files} />
            ) : (
              <img src={post.thumbnail_url} alt=""
                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
            )}
            {/* Double-tap heart animation */}
            <AnimatePresence>
              {heartAnim && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
                >
                  <HandHeart size={80} color="var(--text)" fill="#ff3b5c" strokeWidth={0} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 4px', gap: 14 }}>
          <button aria-label="Toggle clap" onClick={handleClap} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, transition: 'transform 0.1s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <HandHeart size={24} color={clapped ? '#ff3b5c' : '#dee3ea'} fill={clapped ? '#ff3b5c' : 'none'} strokeWidth={1.8} />
          </button>
          <button aria-label="Comment" onClick={goPost} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#dee3ea' }}>
            <MessageCircle size={23} strokeWidth={1.8} />
          </button>
          <button aria-label="Share post" onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#dee3ea' }}>
            <Send size={21} strokeWidth={1.8} />
          </button>
          {/* Bookmark pushed to far right */}
          <button aria-label="Save post" onClick={handleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, marginLeft: 'auto', color: saved ? '#d0bcff' : '#dee3ea' }}>
            <Bookmark size={23} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
          </button>
        </div>

        {/* Clap count */}
        {clapCount > 0 && (
          <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', margin: 0, padding: '0 12px 6px' }}>
            {clapCount.toLocaleString()} {clapCount === 1 ? 'clap' : 'claps'}
          </p>
        )}

        {/* Caption */}
        {caption && (
          <div style={{ padding: '0 12px 10px', fontSize: 14, lineHeight: 1.45, color: '#dee3ea' }}>
            <span onClick={goProfile}
              style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: '#fff', cursor: 'pointer', marginRight: 6, flexShrink: 0 }}>
              {post.creator_username}
            </span>
            <span style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{displayed}</span>
            {isTrunc && !captionExpanded && (
              <span onClick={() => setCaptionExpanded(true)}
                style={{ color: '#6b7280', cursor: 'pointer', marginLeft: 4, fontWeight: 600, fontSize: 13 }}>more</span>
            )}
          </div>
        )}

        {/* Comment count link */}
        {post.comment_count > 0 && (
          <p onClick={goPost}
            style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 13, color: '#6b7280', margin: 0, padding: '0 12px 12px', cursor: 'pointer' }}>
            View all {post.comment_count} comment{post.comment_count === 1 ? '' : 's'}
          </p>
        )}

        {!post.comment_count && <div style={{ height: 12 }} />}
      </article>
    );
  }

  /* ── EDITORIAL-HERO variant (first article in feed) ─────────────── */
  if (variant === 'editorial-hero') {
    return (
      <article onClick={goPost}
        style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: '#171c21', border: '1px solid rgba(74,68,87,0.15)', transition: 'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(110,0,255,0.3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(74,68,87,0.15)'}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', overflow: 'hidden', background: '#1b2025' }}>
          <img src={post.thumbnail_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200'} alt="" loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(23,28,33,1) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', top: 16, left: 20 }}><TypeTag type={post.type} /></div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1.3, margin: '0 0 8px' }}>{post.title}</h2>
          <p style={{ fontSize: 13, color: '#958da3', lineHeight: 1.6, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(74,68,87,0.2)', paddingTop: 14 }}>
            <div onClick={e => { e.stopPropagation(); goProfile(e); }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <img src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`} alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, fontSize: 13, color: '#dee3ea' }}>{post.creator_name || post.creator_username}</span>
            </div>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#6b7280' }}>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </article>
    );
  }

  /* ── STANDARD EDITORIAL card (articles / tutorials / resources) ─── */
  return (
    <article
      style={{ marginBottom: 14, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(74,68,87,0.12)', background: '#171c21', transition: 'border-color 0.2s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(74,68,87,0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(74,68,87,0.12)'}
      onClick={goPost}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 0' }} onClick={e => e.stopPropagation()}>
        <div onClick={goProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
          <img src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`} alt=""
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 13, color: '#dee3ea', margin: 0 }}>{post.creator_name || post.creator_username}</p>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#6b7280', margin: 0 }}>{post.type?.charAt(0).toUpperCase()}{post.type?.slice(1)} · {timeAgo(post.created_at)}</p>
          </div>
        </div>
        <TypeTag type={post.type} />
      </div>

      <div style={{ padding: '12px 16px' }}>
        {post.title && <p style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 15, color: '#dee3ea', margin: '0 0 5px', lineHeight: 1.4 }}>{post.title}</p>}
        {post.description && <p style={{ fontSize: 13, color: '#ccc3da', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.description}</p>}
      </div>

      {post.thumbnail_url && (
        <img src={post.thumbnail_url} alt="" loading="lazy"
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
        <button aria-label="Toggle clap" onClick={handleClap} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: clapped ? '#ff3b5c' : '#6b7280', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', padding: 0 }}>
          <HandHeart size={14} fill={clapped ? 'currentColor' : 'none'} strokeWidth={1.5} /> {clapCount > 0 && clapCount}
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>
          <MessageCircle size={13} strokeWidth={1.5} /> {post.comment_count || 0}
        </span>
        <button aria-label="Save post" onClick={handleSave} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: saved ? '#d0bcff' : '#6b7280', padding: 0, display: 'flex' }}>
          <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}
