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
   Main PostCard (Theme-Responsive & LinkedIn Layout Compatible)
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

  /* ── SOCIAL / MEDIA POST (LinkedIn Layout Style) ────────────────── */
  if (post.type === 'post') {
    const hasMedia = post.files?.length > 0 || post.thumbnail_url;
    const caption  = post.description || '';
    const SHORT    = 140;
    const isTrunc  = caption.length > SHORT;
    const displayed = captionExpanded || !isTrunc ? caption : caption.slice(0, SHORT);

    return (
      <article style={{ background: 'var(--surface)', borderRadius: 'var(--r-md, 16px)', overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

        {/* 1. Header (Publisher Info) */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10 }}>
          <img onClick={goProfile}
            src={post.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.creator_username}`}
            alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1.5px solid var(--green)', flexShrink: 0 }} />
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={goProfile}>
            <p style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
              {post.creator_name || post.creator_username}
            </p>
            <p style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', fontSize: 11, color: 'var(--sub)', margin: '3px 0 0', lineHeight: 1 }}>
              @{post.creator_username} · {timeAgo(post.created_at)}
            </p>
          </div>
          <button aria-label="More options" style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* 2. Caption Text (LinkedIn Style: Immediately after publisher header) */}
        {caption && (
          <div style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
            <span style={{ fontFamily: 'var(--font-body, sans-serif)', color: 'var(--text)' }}>{displayed}</span>
            {isTrunc && !captionExpanded && (
              <button 
                type="button"
                onClick={() => setCaptionExpanded(true)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--sub)', cursor: 'pointer', marginLeft: 6, fontWeight: 600, fontSize: 13 }}
              >
                ...more
              </button>
            )}
          </div>
        )}

        {/* 3. Media / Images Carousel */}
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

        {/* 4. Engagement Counts Bar (Claps & Comments Stats) */}
        {(clapCount > 0 || post.comment_count > 0) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 6px', fontSize: 12, color: 'var(--sub)', borderBottom: '1px solid var(--border)' }}>
            <span>
              {clapCount > 0 && (
                <strong style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {clapCount.toLocaleString()} {clapCount === 1 ? 'clap' : 'claps'}
                </strong>
              )}
            </span>
            {post.comment_count > 0 && (
              <span 
                onClick={(e) => { e.stopPropagation(); setCommentOpen(true); }}
                style={{ cursor: 'pointer', color: 'var(--sub)' }}
              >
                {post.comment_count} comment{post.comment_count === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}

        {/* 5. Action Buttons Bar (Theme Responsive: Claps, Comment, Share, Save) */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 20 }}>
          <button 
            aria-label="Toggle clap" 
            onClick={handleClap} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              padding: 0, 
              transition: 'transform 0.1s, color 0.2s',
              color: clapped ? '#ff3b5c' : 'var(--sub)'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <HandHeart size={22} color={clapped ? '#ff3b5c' : 'var(--sub)'} fill={clapped ? '#ff3b5c' : 'none'} strokeWidth={1.8} />
          </button>

          <button 
            aria-label="Comment" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCommentOpen(true); }} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, color: 'var(--sub)' }}
          >
            <MessageCircle size={21} color="var(--sub)" strokeWidth={1.8} />
          </button>

          <button 
            aria-label="Share post" 
            onClick={handleShare} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, color: 'var(--sub)' }}
          >
            <Send size={20} color="var(--sub)" strokeWidth={1.8} />
          </button>

          {/* Bookmark pushed to far right */}
          <button 
            aria-label="Save post" 
            onClick={handleSave} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              padding: 0, 
              marginLeft: 'auto', 
              color: saved ? 'var(--green)' : 'var(--sub)' 
            }}
          >
            <Bookmark size={21} color={saved ? 'var(--green)' : 'var(--sub)'} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
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
