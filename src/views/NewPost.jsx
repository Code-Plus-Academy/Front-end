import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Upload, X, FileImage, Send, Film, Plus,
  Globe, Lock, Users, Tag, ChevronDown,
  AlertCircle, CheckCircle2, Loader2, UploadCloud,
  Link as LinkIcon, Clock, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILES = 5;
const MAX_CAPTION_LENGTH = 2200;

const CATEGORIES = [
  'AI & ML', 'Web Dev', 'Blockchain', 'Cybersecurity',
  'System Design', 'GATE CS', 'AI Agents', 'Flutter',
  'DevOps', 'Data Science', 'Mobile Dev', 'Open Source',
];

const VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Public',    icon: Globe, desc: 'Anyone can watch' },
  { value: 'private',   label: 'Private',   icon: Lock,  desc: 'Only you' },
  { value: 'followers', label: 'Followers', icon: Users, desc: 'Your followers only' },
];

// ─── YouTube URL helpers ──────────────────────────────────────────────────────
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseIsoDuration(iso) {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function parseDuration(str) {
  if (!str) return 0;
  if (/^\d+$/.test(str.trim())) return parseInt(str.trim(), 10);
  const parts = str.trim().split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function detectPlatformFromUrl(url) {
  if (!url) return '';
  if (/youtu\.be|youtube\.com/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) return 'direct';
  return '';
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         '#0a0e13',
  surface:    '#101419',
  card:       '#1c2025',
  elevated:   '#262a30',
  border:     '#31353b',
  borderDim:  '#1f242b',
  accent:     '#7a00ff',
  accentSoft: 'rgba(122,0,255,0.12)',
  accentGlow: 'rgba(122,0,255,0.3)',
  cyan:       '#00dbe9',
  cyanSoft:   'rgba(0,219,233,0.1)',
  cyanGlow:   'rgba(0,219,233,0.3)',
  green:      '#34d399',
  danger:     '#ef4444',
  text:       '#e0e2ea',
  textSub:    '#cdc2da',
  textMuted:  '#968da3',
  textDim:    '#4b4357',
  fontHead:   '"Space Grotesk", sans-serif',
  fontBody:   '"Inter", sans-serif',
  fontMono:   '"JetBrains Mono", monospace',
};

// ─── Shared Inline Styles ─────────────────────────────────────────────────────
const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  background: T.bg,
  border: `1px solid ${T.borderDim}`,
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 14,
  color: T.text,
  outline: 'none',
  fontFamily: T.fontBody,
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle = {
  display: 'block',
  fontFamily: T.fontMono,
  fontSize: 11,
  fontWeight: 700,
  color: T.textMuted,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 8,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('social'); // 'social' | 'video'

  // ── Social Post State ──
  const [socialFiles, setSocialFiles] = useState([]);
  const [caption, setCaption] = useState('');

  // ── Video Upload State ──
  const [videoTab, setVideoTab] = useState('upload'); // 'upload' | 'url'
  const [videoForm, setVideoForm] = useState({
    title: '', description: '', video_url: '', thumbnail_url: '',
    duration_raw: '', tags: [], category: '', content_type: 'long',
    visibility: 'public', source_platform: '', source_url: '',
  });
  const [videoTagInput, setVideoTagInput] = useState('');
  const [uploadStep, setUploadStep] = useState('idle'); // idle | uploading | encoding | thumbnail | ready
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Helpers ──
  const setV = (k, v) => setVideoForm(f => ({ ...f, [k]: v }));

  const addVideoTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && videoTagInput.trim()) {
      e.preventDefault();
      const tag = videoTagInput.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (tag && !videoForm.tags.includes(tag) && videoForm.tags.length < 12) {
        setV('tags', [...videoForm.tags, tag]);
      }
      setVideoTagInput('');
    }
  };

  // ── Social File Handlers ──
  const handleSocialFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (socialFiles.length + newFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} photos/videos allowed.`);
      return;
    }
    const withPreviews = newFiles.map(f => Object.assign(f, { preview: URL.createObjectURL(f) }));
    setSocialFiles(prev => [...prev, ...withPreviews]);
  };
  const removeSocialFile = (index) => {
    setSocialFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Video Upload Handler ──
  const startFileUpload = async (file) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }
    setUploadStep('uploading');
    setUploadProgress(5);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'video-uploads');
      const { data } = await api.post('/upload/media', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          const pct = Math.round((ev.loaded * 90) / ev.total);
          setUploadProgress(5 + pct);
        },
      });
      setUploadProgress(95);
      setUploadStep('encoding');
      await new Promise(r => setTimeout(r, 1200));
      setUploadProgress(98);
      setUploadStep('thumbnail');
      await new Promise(r => setTimeout(r, 1200));
      setUploadProgress(100);
      setUploadStep('ready');
      setVideoForm(prev => ({
        ...prev,
        video_url: data.url,
        thumbnail_url: data.url.replace(/\.[^/.]+$/, '.jpg'),
        source_platform: 'direct',
      }));
      toast.success('Video uploaded successfully!');
    } catch (err) {
      setUploadStep('idle');
      setUploadProgress(0);
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── YouTube Meta Fetch ──
  const fetchYouTubeMeta = async () => {
    const ytId = extractYouTubeId(urlInput);
    if (!ytId) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }
    setFetchingMeta(true);
    try {
      const apiKey = typeof window !== 'undefined' && window.__ENV__?.VITE_YOUTUBE_API_KEY;
      // Fallback: just set URL directly
      setVideoForm(prev => ({
        ...prev,
        video_url: urlInput,
        source_url: urlInput,
        source_platform: 'youtube',
        thumbnail_url: `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
      }));
      toast.success('YouTube video linked!');
    } catch {
      toast.error('Failed to fetch video metadata');
    } finally {
      setFetchingMeta(false);
    }
  };

  // ── Instagram Meta Fetch ──
  const fetchInstagramMeta = async () => {
    if (!urlInput.includes('instagram.com')) {
      toast.error('Please enter a valid Instagram URL');
      return;
    }
    setFetchingMeta(true);
    try {
      const { data } = await api.get('/meta/instagram', { params: { url: urlInput } });
      setVideoForm(prev => ({
        ...prev,
        video_url: data.video_url || urlInput,
        thumbnail_url: data.thumbnail_url || '',
        title: data.title || prev.title,
        source_url: urlInput,
        source_platform: 'instagram',
      }));
      toast.success('Instagram reel linked!');
    } catch {
      // Fallback
      setVideoForm(prev => ({
        ...prev,
        video_url: urlInput,
        source_url: urlInput,
        source_platform: 'instagram',
      }));
      toast.success('URL set (metadata unavailable)');
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleImportUrl = () => {
    if (!urlInput.trim()) return;
    const platform = detectPlatformFromUrl(urlInput);
    if (platform === 'youtube') fetchYouTubeMeta();
    else if (platform === 'instagram') fetchInstagramMeta();
    else {
      setVideoForm(prev => ({
        ...prev,
        video_url: urlInput,
        source_url: urlInput,
        source_platform: platform || 'direct',
      }));
      toast.success('Video URL set!');
    }
  };

  // ── Drag & Drop ──
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragIn = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragOut = (e) => { e.preventDefault(); setDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files?.length > 0) {
      startFileUpload(files[0]);
    }
  };

  // ── Submit Handlers ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tab === 'social') {
      if (socialFiles.length === 0) { toast.error('Add at least one photo or video.'); return; }
      if (caption.trim().length < 20) { toast.error('Caption must be at least 20 characters.'); return; }

      setLoading(true);
      try {
        const fd = new FormData();
        fd.append('type', 'post');
        fd.append('description', caption);
        socialFiles.forEach(f => fd.append('files', f));

        const res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Post published!');
        navigate(`/posts/${res.data.post.id}?ref=new`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to create post');
      } finally {
        setLoading(false);
      }
    } else {
      // Video submit
      if (!videoForm.title.trim()) { toast.error('Title is required'); return; }
      if (!videoForm.video_url.trim()) { toast.error('Upload or import a video first'); return; }
      if (!videoForm.category) { toast.error('Please select a category'); return; }

      setLoading(true);
      try {
        const payload = {
          title: videoForm.title.trim(),
          description: videoForm.description.trim(),
          video_url: videoForm.video_url,
          thumbnail_url: videoForm.thumbnail_url,
          duration: parseDuration(videoForm.duration_raw),
          tags: videoForm.tags,
          category: videoForm.category,
          content_type: videoForm.content_type,
          visibility: videoForm.visibility,
          source_url: videoForm.source_url || undefined,
          source_platform: videoForm.source_platform || undefined,
        };
        const res = await api.post('/videos', payload);
        const videoId = res.data.video.id;

        // If instagram, trigger HLS pipeline
        if (videoForm.source_platform === 'instagram' && videoForm.source_url) {
          try {
            await api.post('/videos/studio/publish', {
              source_url: videoForm.source_url,
              video_id: videoId,
            });
          } catch { /* ignore pipeline errors */ }
        }

        toast.success('Video published!');
        const targetUrl = videoForm.content_type === 'short'
          ? `/shorts/${videoId}`
          : `/videos/${videoId}`;
        navigate(targetUrl);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to publish video');
      } finally {
        setLoading(false);
      }
    }
  };

  // ── Upload step labels ──
  const stepLabels = {
    idle: '',
    uploading: 'Uploading video…',
    encoding: 'Processing video…',
    thumbnail: 'Generating thumbnail…',
    ready: 'Upload complete!',
  };

  return (
    <>
      <Helmet><title>Create — Code+ Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 800 }}>

        {/* ── Page Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{
            fontFamily: T.fontHead, fontSize: 28, fontWeight: 700,
            color: T.text, margin: '0 0 8px',
            background: 'linear-gradient(135deg, #d4bbff, #00dbe9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Create New
          </h1>
          <p style={{
            fontFamily: T.fontBody, fontSize: 14, color: T.textMuted, margin: 0,
          }}>
            Share your content with the community
          </p>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'flex', background: T.surface, border: `1px solid ${T.borderDim}`,
            borderRadius: 30, padding: 4, position: 'relative',
          }}>
            {[
              { key: 'social', icon: FileImage, label: 'Media Post' },
              { key: 'video',  icon: Film,      label: 'Video Upload' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  position: 'relative', zIndex: 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 28px', borderRadius: 26,
                  border: 'none', cursor: 'pointer',
                  fontFamily: T.fontHead, fontSize: 14, fontWeight: 700,
                  background: 'transparent',
                  color: tab === t.key ? '#fff' : T.textMuted,
                  transition: 'color 0.3s',
                }}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}

            <motion.div
              layoutId="new-post-pill"
              initial={false}
              animate={{
                left: tab === 'social' ? 4 : '50%',
                width: 'calc(50% - 4px)',
              }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              style={{
                position: 'absolute', top: 4, bottom: 4,
                background: tab === 'social'
                  ? 'linear-gradient(135deg, rgba(0,219,233,0.2), rgba(122,0,255,0.2))'
                  : 'linear-gradient(135deg, rgba(122,0,255,0.2), rgba(0,219,233,0.2))',
                borderRadius: 26, zIndex: 0,
                border: `1px solid ${tab === 'social' ? 'rgba(0,219,233,0.3)' : 'rgba(122,0,255,0.3)'}`,
              }}
            />
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">

            {tab === 'social' ? (
              /* ═══════════════ MEDIA POST ═══════════════ */
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: T.card, borderRadius: 20,
                  border: `1px solid ${T.borderDim}`, padding: 32,
                  display: 'flex', flexDirection: 'column', gap: 24,
                }}
              >
                {/* Dropzone */}
                <div>
                  <span style={labelStyle}>// media</span>
                  <label
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 12, height: socialFiles.length > 0 ? 120 : 280,
                      border: `2px dashed ${T.border}`, borderRadius: 16,
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      background: `radial-gradient(circle at center, ${T.card} 0%, ${T.bg} 100%)`,
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                  >
                    <input type="file" multiple accept="image/*,video/*" onChange={handleSocialFileChange} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: T.cyanSoft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <UploadCloud size={24} color={T.cyan} />
                      </div>
                      <span style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 600, color: T.text }}>
                        Drop photos or videos here
                      </span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
                        Up to {MAX_FILES} high-res files • Click to browse
                      </span>
                    </div>
                  </label>

                  {/* Preview Carousel */}
                  {socialFiles.length > 0 && (
                    <div style={{
                      display: 'flex', gap: 12, overflowX: 'auto', padding: '16px 0',
                      scrollSnapType: 'x mandatory',
                    }}>
                      <AnimatePresence>
                        {socialFiles.map((file, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            style={{
                              position: 'relative', width: 140, height: 180, flexShrink: 0,
                              borderRadius: 12, overflow: 'hidden',
                              border: `1px solid ${T.border}`, scrollSnapAlign: 'start',
                            }}
                          >
                            {file.type.startsWith('video/') ? (
                              <video src={file.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                            ) : (
                              <img src={file.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <button
                              type="button"
                              onClick={() => removeSocialFile(i)}
                              style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 26, height: 26, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.65)', border: 'none',
                                color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              <X size={14} />
                            </button>
                            {file.type.startsWith('video/') && (
                              <div style={{
                                position: 'absolute', bottom: 6, left: 6,
                                background: 'rgba(122,0,255,0.7)', padding: '2px 8px',
                                borderRadius: 6, fontFamily: T.fontMono,
                                fontSize: 9, color: '#fff', letterSpacing: '0.05em',
                              }}>VIDEO</div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div>
                  <span style={labelStyle}>// caption</span>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={caption}
                      onChange={e => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                      placeholder="Write a caption... (Markdown supported) ✨"
                      rows={6}
                      style={{
                        ...inputStyle,
                        resize: 'none', lineHeight: 1.6, paddingBottom: 32,
                      }}
                      onFocus={e => { e.target.style.borderColor = T.cyan; e.target.style.boxShadow = `0 0 0 3px ${T.cyanGlow}`; }}
                      onBlur={e => { e.target.style.borderColor = T.borderDim; e.target.style.boxShadow = 'none'; }}
                    />
                    <div style={{
                      position: 'absolute', bottom: 12, right: 14,
                      display: 'flex', alignItems: 'center', gap: 12,
                      fontFamily: T.fontMono, fontSize: 10,
                    }}>
                      {caption.length < 20 && (
                        <span style={{ color: T.danger }}>min 20 chars</span>
                      )}
                      <span style={{ color: caption.length >= MAX_CAPTION_LENGTH ? T.danger : T.textMuted }}>
                        {caption.length} / {MAX_CAPTION_LENGTH}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 32px', borderRadius: 30,
                      background: `linear-gradient(135deg, ${T.cyan}, ${T.accent})`,
                      color: '#fff', fontSize: 15, fontWeight: 700,
                      fontFamily: T.fontHead, border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: `0 4px 20px ${T.accentGlow}`,
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 24px ${T.accentGlow}`; }}}
                    onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px ${T.accentGlow}`; }}}
                  >
                    {loading ? <><Loader2 size={16} className="spin" /> Publishing…</> : <>Share <Send size={16} /></>}
                  </button>
                </div>
              </motion.div>

            ) : (

              /* ═══════════════ VIDEO UPLOAD ═══════════════ */
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: T.card, borderRadius: 20,
                  border: `1px solid ${T.borderDim}`, padding: 32,
                  display: 'flex', flexDirection: 'column', gap: 24,
                }}
              >
                {/* Video Source Tabs */}
                <div>
                  <span style={labelStyle}>// video source</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { key: 'upload', icon: UploadCloud, label: 'Upload File' },
                      { key: 'url',    icon: LinkIcon,    label: 'Import URL' },
                    ].map(vt => (
                      <button
                        key={vt.key}
                        type="button"
                        onClick={() => setVideoTab(vt.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 20px', borderRadius: 12,
                          border: `1px solid ${videoTab === vt.key ? T.accent : T.borderDim}`,
                          background: videoTab === vt.key ? T.accentSoft : 'transparent',
                          color: videoTab === vt.key ? '#d4bbff' : T.textMuted,
                          cursor: 'pointer', fontFamily: T.fontBody, fontSize: 13,
                          fontWeight: 600, transition: 'all 0.2s',
                        }}
                      >
                        <vt.icon size={16} />
                        {vt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Zone OR URL Input */}
                {videoTab === 'upload' ? (
                  <div
                    onDragEnter={handleDragIn}
                    onDragLeave={handleDragOut}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {uploadStep === 'idle' ? (
                      <label
                        style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 14,
                          height: 240, borderRadius: 16, cursor: 'pointer',
                          border: `2px dashed ${dragActive ? T.accent : T.border}`,
                          background: dragActive
                            ? T.accentSoft
                            : `radial-gradient(circle at center, ${T.card} 0%, ${T.bg} 100%)`,
                          transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; }}
                        onMouseLeave={e => { if (!dragActive) e.currentTarget.style.borderColor = T.border; }}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={e => e.target.files[0] && startFileUpload(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%',
                          background: T.accentSoft,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Upload size={26} color="#d4bbff" />
                        </div>
                        <span style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 600, color: T.text }}>
                          Drag & drop your video file
                        </span>
                        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
                          MP4, WebM, MOV — Click to browse
                        </span>
                      </label>
                    ) : (
                      /* Progress State */
                      <div style={{
                        padding: 32, borderRadius: 16,
                        border: `1px solid ${T.borderDim}`,
                        background: T.bg,
                        display: 'flex', flexDirection: 'column', gap: 16,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {uploadStep === 'ready'
                            ? <CheckCircle2 size={22} color={T.green} />
                            : <Loader2 size={22} color="#d4bbff" style={{ animation: 'spin 1s linear infinite' }} />
                          }
                          <span style={{
                            fontFamily: T.fontBody, fontSize: 14, fontWeight: 600,
                            color: uploadStep === 'ready' ? T.green : T.text,
                          }}>
                            {stepLabels[uploadStep]}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div style={{
                          height: 6, borderRadius: 3,
                          background: T.borderDim, overflow: 'hidden',
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.4 }}
                            style={{
                              height: '100%', borderRadius: 3,
                              background: uploadStep === 'ready'
                                ? `linear-gradient(90deg, ${T.green}, ${T.cyan})`
                                : `linear-gradient(90deg, ${T.accent}, #d4bbff)`,
                            }}
                          />
                        </div>
                        <span style={{
                          fontFamily: T.fontMono, fontSize: 11, color: T.textMuted, textAlign: 'right',
                        }}>
                          {uploadProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* URL Import */
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="Paste YouTube or Instagram URL…"
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`; }}
                      onBlur={e => { e.target.style.borderColor = T.borderDim; e.target.style.boxShadow = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={handleImportUrl}
                      disabled={fetchingMeta || !urlInput.trim()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '12px 20px', borderRadius: 12,
                        background: T.accent, color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
                        opacity: fetchingMeta || !urlInput.trim() ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fetchingMeta ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LinkIcon size={16} />}
                      Import
                    </button>
                  </div>
                )}

                {/* Video URL Confirmation */}
                {videoForm.video_url && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(52,211,153,0.08)',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}>
                    <CheckCircle2 size={16} color={T.green} />
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.green, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {videoForm.video_url}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: T.borderDim }} />

                {/* Content Type Toggle */}
                <div>
                  <span style={labelStyle}>// content type</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { value: 'long',  label: '📺 Long Video' },
                      { value: 'short', label: '⚡ Short' },
                    ].map(ct => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => setV('content_type', ct.value)}
                        style={{
                          flex: 1, padding: '14px 20px', borderRadius: 12,
                          border: `1px solid ${videoForm.content_type === ct.value ? T.accent : T.borderDim}`,
                          background: videoForm.content_type === ct.value ? T.accentSoft : 'transparent',
                          color: videoForm.content_type === ct.value ? '#d4bbff' : T.textMuted,
                          cursor: 'pointer', fontFamily: T.fontHead, fontSize: 14,
                          fontWeight: 600, transition: 'all 0.2s',
                        }}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <span style={labelStyle}>// title *</span>
                  <input
                    value={videoForm.title}
                    onChange={e => setV('title', e.target.value.slice(0, 200))}
                    placeholder="Enter your video title…"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`; }}
                    onBlur={e => { e.target.style.borderColor = T.borderDim; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Description */}
                <div>
                  <span style={labelStyle}>// description</span>
                  <textarea
                    value={videoForm.description}
                    onChange={e => setV('description', e.target.value)}
                    placeholder="Describe your video content…"
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`; }}
                    onBlur={e => { e.target.style.borderColor = T.borderDim; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Category & Duration Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={labelStyle}>// category *</span>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={videoForm.category}
                        onChange={e => setV('category', e.target.value)}
                        style={{
                          ...inputStyle,
                          appearance: 'none', paddingRight: 36,
                          color: videoForm.category ? T.text : T.textMuted,
                        }}
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} color={T.textMuted} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <span style={labelStyle}>// duration</span>
                    <input
                      value={videoForm.duration_raw}
                      onChange={e => setV('duration_raw', e.target.value)}
                      placeholder="e.g. 12:34 or 90"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = T.accent; }}
                      onBlur={e => { e.target.style.borderColor = T.borderDim; }}
                    />
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <span style={labelStyle}>// thumbnail url</span>
                  <input
                    value={videoForm.thumbnail_url}
                    onChange={e => setV('thumbnail_url', e.target.value)}
                    placeholder="https://…/thumbnail.jpg"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = T.accent; }}
                    onBlur={e => { e.target.style.borderColor = T.borderDim; }}
                  />
                  {videoForm.thumbnail_url && (
                    <div style={{ marginTop: 10, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.borderDim}`, maxHeight: 180 }}>
                      <img src={videoForm.thumbnail_url} alt="thumbnail" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <span style={labelStyle}>// tags ({videoForm.tags.length}/12)</span>
                  <div style={{
                    display: 'flex', gap: 8, flexWrap: 'wrap',
                    padding: '10px 12px', background: T.bg,
                    border: `1px solid ${T.borderDim}`, borderRadius: 12,
                    minHeight: 44,
                  }}>
                    {videoForm.tags.map(tag => (
                      <span key={tag} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontFamily: T.fontMono, fontSize: 11,
                        background: T.accentSoft, color: '#d4bbff',
                        border: `1px solid ${T.accentGlow}`, borderRadius: 20,
                        padding: '4px 10px',
                      }}>
                        #{tag}
                        <button type="button" onClick={() => setV('tags', videoForm.tags.filter(t => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4bbff', display: 'flex', padding: 0, marginLeft: 2 }}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={videoTagInput}
                      onChange={e => setVideoTagInput(e.target.value)}
                      onKeyDown={addVideoTag}
                      placeholder="Add tag, press Enter…"
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        padding: 0, fontSize: 12, minWidth: 120,
                        color: T.text, fontFamily: T.fontMono,
                      }}
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <span style={labelStyle}>// visibility</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {VISIBILITY_OPTIONS.map(v => (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => setV('visibility', v.value)}
                        style={{
                          flex: 1, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 6,
                          padding: '14px 12px', borderRadius: 12,
                          border: `1px solid ${videoForm.visibility === v.value ? T.accent : T.borderDim}`,
                          background: videoForm.visibility === v.value ? T.accentSoft : 'transparent',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <v.icon size={18} color={videoForm.visibility === v.value ? '#d4bbff' : T.textMuted} />
                        <span style={{
                          fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
                          color: videoForm.visibility === v.value ? '#d4bbff' : T.textMuted,
                        }}>
                          {v.label}
                        </span>
                        <span style={{
                          fontFamily: T.fontMono, fontSize: 9,
                          color: videoForm.visibility === v.value ? T.textSub : T.textDim,
                        }}>
                          {v.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div style={{
                  display: 'flex', gap: 12, paddingTop: 16,
                  justifyContent: 'flex-end',
                  borderTop: `1px solid ${T.borderDim}`, marginTop: 4,
                }}>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{
                      padding: '12px 24px', borderRadius: 30,
                      background: 'transparent', border: `1px solid ${T.border}`,
                      color: T.text, cursor: 'pointer', fontWeight: 600,
                      fontFamily: T.fontBody, fontSize: 14,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 32px', borderRadius: 30,
                      background: `linear-gradient(135deg, ${T.accent}, #d4bbff)`,
                      color: '#fff', border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontSize: 15, fontFamily: T.fontHead,
                      opacity: loading ? 0.7 : 1,
                      boxShadow: `0 4px 20px ${T.accentGlow}`,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; }}}
                    onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; }}}
                  >
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publishing…</> : <>Publish Video <Send size={16} /></>}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </form>

        {/* Spin animation keyframes */}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

      </PageWrapper>
    </>
  );
}
