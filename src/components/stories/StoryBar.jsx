import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import StoryModal from './StoryModal';
import { useAuth } from '../../context/AuthContext';

/* ─── Inline keyframes (injected once) ─── */
const STYLE_ID = 'story-bar-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const sheet = document.createElement('style');
  sheet.id = STYLE_ID;
  sheet.textContent = `
    @keyframes storyRingSpin {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes storyShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .story-scroll::-webkit-scrollbar { display: none; }
    .story-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(sheet);
}

export default function StoryBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedStories, setSelectedStories] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const fetchStories = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data } = await api.get('/stories');
      setStories(data.stories || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
      setFetchError(true);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  /* ── Scroll shadow detection ── */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [stories, loading]);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await api.post('/upload/story', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { url } = uploadRes.data;
      await api.post('/stories', { content_url: url, type: 'image', caption: caption.trim() || undefined });
      setUploadDone(true);
      setTimeout(() => {
        setShowUpload(false);
        setFile(null);
        setPreview(null);
        setCaption('');
        setUploadDone(false);
        fetchStories();
      }, 1200);
    } catch (err) {
      console.error('Story upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleStoryClick = (userGroup) => {
    const storyList = userGroup.stories ? userGroup.stories.map(s => ({
      ...s,
      username: userGroup.username,
      user_avatar: userGroup.avatar_url || userGroup.user_avatar
    })) : [{
      id: userGroup.id,
      content_url: userGroup.content_url || userGroup.url,
      caption: userGroup.caption,
      username: userGroup.username,
      user_avatar: userGroup.avatar_url
    }];

    setSelectedStories(storyList);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayStories = stories;

  /* ─── Shared sizes ─── */
  const AVATAR_SIZE = 68;
  const RING_SIZE = AVATAR_SIZE + 8; // ring wrapper includes padding

  return (
    <>
      {/* Upload Modal (Portaled to document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
              }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 20,
                  padding: 'clamp(20px, 3vw, 28px)',
                  width: '100%',
                  maxWidth: 420,
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-modal, 0 20px 60px rgba(0,0,0,0.5))',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <span style={{ fontFamily: 'var(--font-display, sans-serif)', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>Create New Story</span>
                  <button
                    onClick={() => setShowUpload(false)}
                    style={{
                      background: 'var(--s2)',
                      border: '1px solid var(--border)',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--sub)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <motion.div
                  whileHover={{ borderColor: 'var(--primary, #3B7CFF)' }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    aspectRatio: '9/14',
                    maxHeight: 260,
                    borderRadius: 14,
                    border: '2px dashed var(--border-bright)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'var(--s2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {preview ? (
                    <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} style={{ textAlign: 'center', color: 'var(--dim)', padding: 16 }}>
                      <Upload size={36} style={{ margin: '0 auto 10px', color: 'var(--primary, #3B7CFF)' }} />
                      <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>Click to select media</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Supports JPG, PNG, WebP, MP4</p>
                    </motion.div>
                  )}
                </motion.div>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileSelect} />

                <input
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a story caption…"
                  maxLength={120}
                  style={{
                    width: '100%',
                    marginTop: 14,
                    background: 'var(--s3)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--text)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-body, sans-serif)',
                  }}
                />

                <motion.button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%',
                    marginTop: 16,
                    padding: '12px',
                    borderRadius: 12,
                    background: uploadDone ? 'var(--green, #10B981)' : (file ? 'var(--primary, #3B7CFF)' : 'var(--s3)'),
                    border: 'none',
                    color: '#fff',
                    fontFamily: 'var(--font-display, sans-serif)',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: file && !uploading ? 'pointer' : 'default',
                    transition: 'background 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: file ? 'var(--glow-premium, 0 4px 20px rgba(59,124,255,0.35))' : 'none',
                  }}
                >
                  {uploadDone ? <><CheckCircle size={16} /> Story Shared!</> : uploading ? 'Uploading…' : 'Share Story'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ───────── Main StoryBar Container ───────── */}
      <div
        style={{
          borderRadius: 'clamp(14px, 1.8vw, 20px)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-card)',
          padding: 'clamp(14px, 1.6vw, 20px)',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Ambient glow effects */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '15%',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 124, 255, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            right: '10%',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Story Avatars Row ── */}
        <div
          ref={scrollRef}
          className="story-scroll"
          style={{
            display: 'flex',
            gap: 'clamp(16px, 2vw, 24px)',
            padding: '4px 4px 2px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* ── Add Story Button ── */}
          <motion.div
            tabIndex={0}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: RING_SIZE,
            }}
          >
            <div
              style={{
                width: RING_SIZE,
                height: RING_SIZE,
                borderRadius: '50%',
                border: '2px dashed var(--primary, #3B7CFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(59, 124, 255, 0.15)',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: '50%',
                  background: 'var(--s2, #1E293B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username || 'You'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'brightness(0.7)' }}
                  />
                ) : null}
                {/* Plus overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: user?.avatar_url ? 'rgba(0,0,0,0.35)' : 'transparent',
                  }}
                >
                  <Plus size={24} color="var(--primary, #3B7CFF)" strokeWidth={2.5} />
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 'clamp(0.65rem, 0.85vw, 0.75rem)',
                fontFamily: 'var(--font-body, sans-serif)',
                color: 'var(--text-secondary, var(--sub))',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Add Story
            </span>
          </motion.div>

          {/* ── Creator Stories ── */}
          {displayStories.map((story, i) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.06, y: -3 }}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                damping: 22,
                stiffness: 260,
                delay: i * 0.05,
              }}
              onClick={() => handleStoryClick(story)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                flexShrink: 0,
                minWidth: RING_SIZE,
              }}
            >
              {/* Animated gradient ring */}
              <div
                style={{
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: '50%',
                  padding: 3,
                  position: 'relative',
                }}
              >
                {/* Spinning conic gradient ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #3B7CFF, #9333EA, #34C77B, #3B7CFF)',
                    animation: 'storyRingSpin 4s linear infinite',
                  }}
                />
                {/* Inner cutout (creates the ring effect) */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 3,
                    borderRadius: '50%',
                    background: 'var(--surface)',
                  }}
                />
                {/* Avatar */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 5,
                    borderRadius: '50%',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={story.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${story.username}`}
                    alt={story.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: 'clamp(0.65rem, 0.85vw, 0.75rem)',
                  fontFamily: 'var(--font-body, sans-serif)',
                  color: 'var(--text-primary, var(--text))',
                  fontWeight: 600,
                  maxWidth: 80,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                  textAlign: 'center',
                }}
              >
                {story.username}
              </span>
            </motion.div>
          ))}

          {/* ── Loading Skeletons ── */}
          {loading && Array(4).fill(0).map((_, i) => (
            <div
              key={`skel-${i}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                minWidth: RING_SIZE,
              }}
            >
              <div
                style={{
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: '50%',
                  background: 'linear-gradient(90deg, var(--border) 25%, var(--border-bright) 50%, var(--border) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'storyShimmer 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.12}s`,
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 10,
                  borderRadius: 5,
                  background: 'linear-gradient(90deg, var(--border) 25%, var(--border-bright) 50%, var(--border) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'storyShimmer 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.12 + 0.1}s`,
                }}
              />
            </div>
          ))}

          {/* ── Empty / Error State ── */}
          {!loading && displayStories.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '4px 8px',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(0.72rem, 0.9vw, 0.82rem)',
                  color: 'var(--dim)',
                  fontFamily: 'var(--font-body, sans-serif)',
                  whiteSpace: 'nowrap',
                }}
              >
                {fetchError ? 'Could not load stories' : 'No stories yet — be the first!'}
              </span>
              {fetchError && (
                <button
                  onClick={fetchStories}
                  style={{
                    background: 'var(--s3)',
                    border: '1px solid var(--border-bright)',
                    borderRadius: 8,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body, sans-serif)',
                    transition: 'background 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedStories && (
          <StoryModal userStories={selectedStories} onClose={() => setSelectedStories(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
