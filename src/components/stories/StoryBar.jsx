import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, CheckCircle } from 'lucide-react';
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

  const displayStories = stories;

  return (
    <div
      style={{
        borderRadius: 'clamp(14px, 1.8vw, 20px)',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(11, 15, 25, 0.92) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        padding: 'clamp(12px, 1.5vw, 18px) clamp(14px, 2vw, 22px)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
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
          background: 'radial-gradient(circle, rgba(122, 0, 255, 0.12) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ background: 'var(--surface)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, border: '1px solid rgba(110,0,255,0.25)', boxShadow: '0 0 40px rgba(110,0,255,0.15)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: 16, color:'var(--accent-purple)' }}>New Story</span>
                <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color:'var(--sub)', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>

              <motion.div
                whileHover={{ borderColor: '#6e00ff' }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', aspectRatio: '9/16', maxHeight: 280, borderRadius: 14,
                  border: '2px dashed var(--border-bright)', cursor: 'pointer',
                  overflow: 'hidden', position: 'relative',
                  background: 'var(--s2)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s',
                }}
              >
                {preview ? (
                  <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} style={{ textAlign: 'center', color: 'var(--border-bright)' }}>
                    <Upload size={36} style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>Click to select image</p>
                    <p style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>Max 50MB • JPG, PNG, WebP</p>
                  </motion.div>
                )}
              </motion.div>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileSelect} />

              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption…"
                maxLength={120}
                style={{ width: '100%', marginTop: 14, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: '"Geist", sans-serif' }}
              />

              <motion.button
                onClick={handleUpload}
                disabled={!file || uploading}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', marginTop: 14, padding: '12px', borderRadius: 12,
                  background: uploadDone ? '#34d399' : (file ? '#6e00ff' : '#252a30'),
                  border: 'none', color: '#fff', fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700, fontSize: 14, cursor: file && !uploading ? 'pointer' : 'default',
                  transition: 'background 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: file ? '0 4px 20px rgba(110,0,255,0.35)' : 'none',
                }}
              >
                {uploadDone ? <><CheckCircle size={16} /> Posted!</> : uploading ? 'Uploading…' : 'Share Story'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Bar Row */}
      <div
        style={{
          display: 'flex',
          gap: 'clamp(14px, 1.8vw, 22px)',
          padding: '2px 0',
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
            gap: 'clamp(5px, 0.8vw, 8px)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 'clamp(56px, 5.5vw, 68px)',
                height: 'clamp(56px, 5.5vw, 68px)',
                borderRadius: '50%',
                border: '2px dashed #00F2FE',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.25)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#0B0F19',
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
                      background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                  }}
                >
                  <Plus size={22} color="#00F2FE" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)',
              fontFamily: "'Inter', sans-serif",
              color: '#94A3B8',
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
              gap: 'clamp(5px, 0.8vw, 8px)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 'clamp(56px, 5.5vw, 68px)',
                  height: 'clamp(56px, 5.5vw, 68px)',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8A2BFF 0%, #FF007F 50%, #00F2FE 100%)',
                  padding: '2.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  boxShadow: '0 4px 18px rgba(138, 43, 255, 0.35)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#0B0F19',
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
                fontFamily: "'Inter', sans-serif",
                color: '#E2E8F0',
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
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(5px, 0.8vw, 8px)', flexShrink: 0 }}
          >
            <div style={{ width: 'clamp(56px, 5.5vw, 68px)', height: 'clamp(56px, 5.5vw, 68px)', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ width: 44, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedStories && (
          <StoryModal userStories={selectedStories} onClose={() => setSelectedStories(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
