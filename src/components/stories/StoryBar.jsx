import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';
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
    setSelectedStories(userGroup.stories.map(s => ({
      ...s,
      username: userGroup.username,
      user_avatar: userGroup.avatar_url
    })));
  };

  return (
    <>
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
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 800, fontSize: 16, color:'var(--accent-purple)' }}>New Story</span>
                <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color:'var(--sub)', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Preview / Drop Zone */}
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

              {/* Caption */}
              <input
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption…"
                maxLength={120}
                style={{ width: '100%', marginTop: 14, background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: '"Geist", sans-serif' }}
              />

              {/* Upload Button */}
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

      {/* Story Bar */}
      <div style={{ display: 'flex', gap: 16, padding: '0px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
        {/* Your Story — Upload Trigger */}
        <motion.div
          tabIndex={0}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowUpload(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 66, height: 66, borderRadius: '14px',
                background: 'linear-gradient(135deg, #7A00FF, #00C1FD)', padding: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0px 0px 6.10152px rgba(122, 0, 255, 0.243)'
              }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '12px', background: 'var(--bg)', padding: '2px', overflow: 'hidden' }}>
                <Avatar size={58} src={user?.avatar_url} name={user?.username || 'You'} style={{ borderRadius: '10px' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#7A00FF', border: '2px solid #101419', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} color="#fff" strokeWidth={3} />
            </div>
          </div>
          <span style={{ fontSize: 10, fontFamily: '"Inter", sans-serif', color: '#cdc2da', fontWeight: 500 }}>You</span>
        </motion.div>

        {/* Other Stories */}
        {stories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={() => handleStoryClick(story)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{ width: 66, height: 66, borderRadius: '14px', background: 'linear-gradient(135deg, #7A00FF 0%, #00C1FD 100%)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '12px', background: '#101419', padding: '2px', overflow: 'hidden' }}>
                <Avatar size={58} src={story.avatar_url} name={story.username} style={{ borderRadius: '10px' }} />
              </div>
            </div>
            <span style={{ fontSize: 10, fontFamily: '"Inter", sans-serif', color: '#cdc2da', fontWeight: 500, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {story.username}
            </span>
          </motion.div>
        ))}

        {/* Loading skeletons */}
        {loading && Array(4).fill(0).map((_, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <div style={{ width: 66, height: 66, borderRadius: '14px', background: '#252a30' }} />
            <div style={{ width: 44, height: 10, borderRadius: 4, background: '#252a30' }} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedStories && (
          <StoryModal userStories={selectedStories} onClose={() => setSelectedStories(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
