import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import StoryModal from './StoryModal';
import { useAuth } from '../../context/AuthContext';

export default function StoryBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStories, setSelectedStories] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const fetchStories = async () => {
    try {
      const { data } = await api.get('/stories');
      setStories(data.stories || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStories(); }, []);

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
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayStories = stories;

  return (
    <>
      {/* Upload Modal (Portaled to document.body so it floats over entire viewport) */}
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
                justify: 'center',
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
                      justify: 'center',
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
                    justify: 'center',
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
                    justify: 'center',
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

      {/* Main StoryBar Container */}
      <div
        style={{
          borderRadius: 'clamp(14px, 1.8vw, 20px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.05))',
          padding: 'clamp(10px, 1.3vw, 16px) clamp(12px, 1.8vw, 20px)',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Background Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            left: '20%',
            width: 'clamp(120px, 15vw, 180px)',
            height: 'clamp(120px, 15vw, 180px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 124, 255, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            right: '15%',
            width: 'clamp(110px, 14vw, 160px)',
            height: 'clamp(110px, 14vw, 160px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Desktop Navigation Scroll Buttons */}
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: 'var(--text)',
            cursor: 'pointer',
            opacity: 0.85,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
          title="Scroll Left"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: 'var(--text)',
            cursor: 'pointer',
            opacity: 0.85,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
          title="Scroll Right"
        >
          <ChevronRight size={16} />
        </button>

        {/* Story Bar Row */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 'clamp(14px, 1.8vw, 22px)',
            padding: '2px 24px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Your Story — Upload Trigger */}
          <motion.div
            tabIndex={0}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(4px, 0.7vw, 7px)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 'clamp(54px, 5vw, 64px)',
                  height: 'clamp(54px, 5vw, 64px)',
                  borderRadius: '50%',
                  border: '2px dashed var(--primary, #3B7CFF)',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  boxShadow: '0 0 14px rgba(59, 124, 255, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username || 'You'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--s2)',
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                    }}
                  >
                    <Plus size={22} color="var(--primary, #3B7CFF)" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)',
                fontFamily: 'var(--font-body, sans-serif)',
                color: 'var(--text-secondary, var(--sub))',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Add Story
            </span>
          </motion.div>

          {/* Creator Stories */}
          {displayStories.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={() => handleStoryClick(story)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(4px, 0.7vw, 7px)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 'clamp(54px, 5vw, 64px)',
                    height: 'clamp(54px, 5vw, 64px)',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B7CFF 0%, #9333EA 50%, #34C77B 100%)',
                    padding: '2.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    boxShadow: '0 4px 18px rgba(59, 124, 255, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      padding: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={story.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + story.username}
                      alt={story.username}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)',
                  fontFamily: 'var(--font-body, sans-serif)',
                  color: 'var(--text-primary, var(--text))',
                  fontWeight: 600,
                  maxWidth: 'clamp(64px, 7vw, 80px)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}
              >
                {story.username}
              </span>
            </motion.div>
          ))}

          {/* Loading Skeletons */}
          {loading && Array(3).fill(0).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(4px, 0.7vw, 7px)', flexShrink: 0 }}
            >
              <div style={{ width: 'clamp(54px, 5vw, 64px)', height: 'clamp(54px, 5vw, 64px)', borderRadius: '50%', background: 'var(--border)' }} />
              <div style={{ width: 44, height: 10, borderRadius: 4, background: 'var(--border)' }} />
            </motion.div>
          ))}
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
