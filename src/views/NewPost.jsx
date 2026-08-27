import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Upload, X, FileImage, Send, Film, Plus,
  Globe, Lock, Users, Tag, ChevronDown,
  AlertCircle, CheckCircle2, Loader2, UploadCloud,
  Link as LinkIcon, Clock, Layers, Sparkles,
  ExternalLink, Eye, RefreshCw, Terminal, Check,
  Play, Radio, Code, Code2, ArrowRight, Edit3, Trash2, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/layout/PageWrapper';
import NoIndex from '../components/seo/NoIndex';
import CodeSnippetCard, { detectLanguage } from '../components/posts/CodeSnippetCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Custom Responsive Hook ───────────────────────────────────────────────────
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FILES = 5;
const MAX_CAPTION_LENGTH = 2200;

const CATEGORIES = [
  'AI & ML', 'Web Dev', 'Blockchain', 'Cybersecurity',
  'System Design', 'GATE CS', 'AI Agents', 'Flutter',
  'DevOps', 'Data Science', 'Mobile Dev', 'Open Source',
  'Other',
];

const CODE_LANGUAGES = [
  { value: 'auto', label: '✨ Auto Detect' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go (Golang)' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'sql', label: 'SQL / PostgreSQL' },
  { value: 'html', label: 'HTML / CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'solidity', label: 'Solidity' },
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const LANGUAGES = [
  'English', 'Hindi', 'Marathi', 'Tamil',
  'Telugu', 'Bengali', 'Kannada', 'Malayalam',
];

const VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Public',    icon: Globe, desc: 'Anyone can watch' },
  { value: 'private',   label: 'Private',   icon: Lock,  desc: 'Only you' },
  { value: 'followers', label: 'Followers', icon: Users, desc: 'Your followers only' },
];

const STAGES = [
  { key: 'PENDING',    label: 'Job Queued',       desc: 'Processing pipeline initialized' },
  { key: 'PROCESSING', label: 'Downloading Reel', desc: 'Fetching video from Instagram' },
  { key: 'DOWNLOADED', label: 'Media Downloaded', desc: 'Video saved, initiating HLS transcode' },
  { key: 'CHUNKING',   label: 'HLS Transcoding',  desc: 'Generating adaptive streaming chunks' },
  { key: 'READY',      label: 'Published & Live', desc: 'Video is active on CPA' },
];

function stageIndex(status) {
  return STAGES.findIndex(s => s.key === status);
}

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

function formatDurationDisplay(secs) {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function detectPlatformFromUrl(url) {
  if (!url) return '';
  if (/youtu\.be|youtube\.com/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) return 'direct';
  return '';
}

/**
 * Fetch full YouTube video metadata via YouTube Data API v3
 */
async function fetchYouTubeMeta(videoId) {
  const apiKey = (import.meta.env && import.meta.env.VITE_YOUTUBE_API_KEY) ||
                 (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) || '';

  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('YouTube API request failed');

  const data = await res.json();
  if (!data.items || data.items.length === 0) throw new Error('Video not found on YouTube');

  const item = data.items[0];
  const snippet = item.snippet;
  const details = item.contentDetails;

  const thumbs = snippet.thumbnails;
  const thumbnail_url =
    thumbs?.maxres?.url ||
    thumbs?.standard?.url ||
    thumbs?.high?.url ||
    thumbs?.medium?.url ||
    thumbs?.default?.url ||
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const duration_raw = parseIsoDuration(details?.duration || '');

  const tags = (snippet.tags || [])
    .slice(0, 12)
    .map(t => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    .filter(Boolean);

  return {
    title: snippet.title || '',
    description: snippet.description || '',
    thumbnail_url,
    duration_raw,
    tags,
    channelTitle: snippet.channelTitle || '',
    channelId: snippet.channelId || '',
    channelHandle: snippet.customUrl || '',
  };
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         '#070a0e',
  surface:    '#0e1218',
  card:       '#151921',
  elevated:   '#1e2430',
  border:     'rgba(255, 255, 255, 0.1)',
  borderDim:  'rgba(255, 255, 255, 0.05)',
  accent:     '#7a00ff',
  accentLight: '#d4bbff',
  accentSoft: 'rgba(122,0,255,0.14)',
  accentGlow: 'rgba(122,0,255,0.35)',
  cyan:       '#00dbe9',
  cyanSoft:   'rgba(0,219,233,0.12)',
  cyanGlow:   'rgba(0,219,233,0.35)',
  green:      '#34d399',
  danger:     '#ef4444',
  warning:    '#f59e0b',
  text:       '#f0f2f8',
  textSub:    '#d4cce3',
  textMuted:  '#9a92a7',
  textDim:    '#5c546b',
  fontHead:   '"Space Grotesk", sans-serif',
  fontBody:   '"Inter", sans-serif',
  fontMono:   '"JetBrains Mono", monospace',
};

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  background: '#070a0e',
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 14,
  color: '#f0f2f8',
  outline: 'none',
  fontFamily: T.fontBody,
  transition: 'all 0.2s ease',
};

const labelStyle = {
  display: 'block',
  fontFamily: T.fontMono,
  fontSize: 11,
  fontWeight: 700,
  color: T.accentLight,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 8,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 900px)');

  const isPersonal = !user || user.account_type !== 'professional';

  const [tab, setTab] = useState('social'); // 'social' | 'video'

  useEffect(() => {
    if (isPersonal && tab !== 'social') {
      setTab('social');
    }
  }, [isPersonal, tab]);

  // ── Social Post State ──
  const [socialFiles, setSocialFiles] = useState([]);
  const [aspectRatio, setAspectRatio] = useState('4:5'); // '4:5' | '1:1' | '3:4'
  const [caption, setCaption] = useState('');
  const [includeCode, setIncludeCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [codeTitle, setCodeTitle] = useState('');
  const [socialTags, setSocialTags] = useState([]);
  const [socialTagInput, setSocialTagInput] = useState('');

  // ── Instagram Feed Import State ──
  const [instaFeedUrl, setInstaFeedUrl] = useState('');
  const [fetchingInstaFeed, setFetchingInstaFeed] = useState(false);
  const [instagramImport, setInstagramImport] = useState(null);

  // ── Video Upload State ──
  const [videoTab, setVideoTab] = useState('upload'); // 'upload' | 'url'
  const [videoForm, setVideoForm] = useState({
    title: '', description: '', video_url: '', thumbnail_url: '',
    duration_raw: '', tags: [], category: '', content_type: 'long',
    difficulty: 'beginner', language: 'English',
    visibility: 'public', source_platform: '', source_url: '',
    original_creator_name: '', original_creator_handle: '', original_creator_url: '',
  });
  const [customCategory, setCustomCategory] = useState('');
  const [videoTagInput, setVideoTagInput] = useState('');
  const [uploadStep, setUploadStep] = useState('idle'); // idle | uploading | encoding | thumbnail | ready
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // ── Instagram Job Status Tracking State ──
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [publishingJobId, setPublishingJobId] = useState(null);
  const [publishingVideoId, setPublishingVideoId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [jobLogs, setJobLogs] = useState([]);

  // ── Common State ──
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  const setV = (key, value) => setVideoForm(prev => ({ ...prev, [key]: value }));

  // ── File Helpers for Social ──
  const handleSocialFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (socialFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed.`);
      return;
    }

    // Auto-detect aspect ratio from the first image if aspectRatio is untouched
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (w && h) {
          const ratio = h / w;
          if (ratio >= 1.28) {
            setAspectRatio('3:4');
          } else if (ratio >= 1.1) {
            setAspectRatio('4:5');
          } else {
            setAspectRatio('1:1');
          }
        }
      };
      img.src = URL.createObjectURL(files[0]);
    }

    const newFiles = files.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setSocialFiles(prev => [...prev, ...newFiles]);
  };

  const removeSocialFile = (index) => {
    setSocialFiles(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      socialFiles.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, []);

  // ── Video Upload Handler ──
  const startFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video file size exceeds 500 MB limit');
      return;
    }

    setUploadStep('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.round((evt.loaded * 100) / evt.total);
            setUploadProgress(Math.min(pct, 90));
          }
        },
      });

      setUploadProgress(95);
      setUploadStep('encoding');
      const data = res.data;

      const mediaUrl = data.url;
      const thumbUrl = data.thumbnail_url || data.poster_url || '';
      const dur = data.duration ? String(Math.round(data.duration)) : '';

      setTimeout(() => {
        setUploadStep('thumbnail');
        setTimeout(() => {
          setV('video_url', mediaUrl);
          if (thumbUrl) setV('thumbnail_url', thumbUrl);
          if (dur) setV('duration_raw', dur);
          setV('source_platform', 'upload');
          setV('source_url', mediaUrl);

          if (data.duration && data.duration <= 60) {
            setV('content_type', 'short');
          }

          setUploadProgress(100);
          setUploadStep('ready');
          toast.success('Video processed successfully!');
        }, 500);
      }, 500);
    } catch (err) {
      setUploadStep('idle');
      setUploadProgress(0);
      toast.error(err.response?.data?.message || 'Video upload failed');
    }
  };

  // ── Instagram Feed Import Handler ──
  const handleFetchInstagramFeed = async (overrideUrl) => {
    const rawUrl = (overrideUrl || instaFeedUrl).trim();
    const match = rawUrl.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?/i);
    const targetUrl = match ? match[0] : rawUrl;

    if (!targetUrl || !/instagram\.com\/(p|reel|reels)\//i.test(targetUrl)) {
      toast.error('Please enter a valid Instagram URL');
      return;
    }

    setInstaFeedUrl(targetUrl);
    if (fetchingInstaFeed) return;
    setFetchingInstaFeed(true);
    try {
      let res;
      try {
        res = await api.get('/media-fetch/post-info', { params: { url: targetUrl } });
      } catch (_) {
        res = await api.get('/meta/instagram', { params: { url: targetUrl } });
      }
      const { meta } = res.data;
      if (!meta) throw new Error('Could not fetch post details');

      const items = (meta.media_items && meta.media_items.length > 0)
        ? meta.media_items
        : (meta.thumbnail_url ? [{ url: meta.thumbnail_url, index: 0, type: 'image' }] : []);

      setInstagramImport({
        url: targetUrl,
        media_items: items,
        aspect_ratio: meta.aspect_ratio || '1:1',
        original_creator_handle: meta.original_creator_handle || '',
        original_creator_name: meta.original_creator_name || '',
        title: meta.title || '',
        is_carousel: meta.is_carousel || items.length > 1,
      });

      const resolvedCaption = meta.description || meta.caption || '';
      if (resolvedCaption) {
        setCaption(resolvedCaption);
        const extractedTags = (resolvedCaption.match(/#([a-zA-Z0-9_]+)/g) || [])
          .map(t => t.slice(1).toLowerCase())
          .filter(Boolean);
        if (extractedTags.length > 0) {
          setSocialTags(prev => Array.from(new Set([...prev, ...extractedTags])));
        }
      }
      setTab('social');
      toast.success(
        items.length > 1
          ? `Imported ${items.length}-slide carousel (${meta.aspect_ratio || '4:5'})!`
          : 'Instagram image post imported!'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to import Instagram post');
    } finally {
      setFetchingInstaFeed(false);
    }
  };

  // ── Import URL Handler with Full Meta Fetching ──
  const handleImportUrl = async (overrideUrl) => {
    const targetUrl = (overrideUrl || urlInput).trim();
    if (!targetUrl) return;
    const platform = detectPlatformFromUrl(targetUrl);

    if (!platform) {
      toast.error('Unsupported URL format. Enter a valid YouTube, Instagram, or direct MP4 link.');
      return;
    }

    setFetchingMeta(true);
    setV('source_url', targetUrl);
    setV('source_platform', platform);

    try {
      if (platform === 'youtube') {
        const ytId = extractYouTubeId(targetUrl);
        if (!ytId) throw new Error('Could not parse YouTube video ID');

        const embedUrl = `https://www.youtube.com/embed/${ytId}`;
        setV('video_url', embedUrl);

        if (targetUrl.includes('/shorts/')) {
          setV('content_type', 'short');
        }

        try {
          const meta = await fetchYouTubeMeta(ytId);
          setV('title', meta.title);
          setV('description', meta.description);
          setV('thumbnail_url', meta.thumbnail_url);
          setV('duration_raw', meta.duration_raw);
          if (meta.tags.length > 0) setV('tags', meta.tags);
          setV('original_creator_name', meta.channelTitle);
          setV('original_creator_handle', meta.channelHandle);
          if (meta.channelId) {
            setV('original_creator_url', `https://www.youtube.com/channel/${meta.channelId}`);
          }

          toast.success('YouTube metadata & thumbnail imported!');
        } catch (apiErr) {
          const thumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          setV('thumbnail_url', thumbUrl);
          toast.success('YouTube URL imported! Add details manually if needed.');
        }

      } else if (platform === 'instagram') {
        try {
          let res;
          try {
            res = await api.get('/media-fetch/post-info', { params: { url: targetUrl } });
          } catch (_) {
            res = await api.get('/meta/instagram', { params: { url: targetUrl } });
          }
          const { meta } = res.data;
          if (meta) {
            // If it's a carousel or static image (not a video), route to Community Post automatically without refetching!
            if (meta.content_category === 'carousel' || meta.content_category === 'single_image' || !meta.is_video) {
              const items = (meta.media_items && meta.media_items.length > 0)
                ? meta.media_items
                : (meta.thumbnail_url ? [{ url: meta.thumbnail_url, index: 0, type: 'image' }] : []);

              setInstagramImport({
                url: targetUrl,
                media_items: items,
                aspect_ratio: meta.aspect_ratio || '1:1',
                original_creator_handle: meta.original_creator_handle || '',
                original_creator_name: meta.original_creator_name || '',
                title: meta.title || '',
                is_carousel: meta.is_carousel || items.length > 1,
              });

              const resolvedCaption = meta.description || meta.caption || '';
              if (resolvedCaption) {
                setCaption(resolvedCaption);
                const extractedTags = (resolvedCaption.match(/#([a-zA-Z0-9_]+)/g) || [])
                  .map(t => t.slice(1).toLowerCase())
                  .filter(Boolean);
                if (extractedTags.length > 0) {
                  setSocialTags(prev => Array.from(new Set([...prev, ...extractedTags])));
                }
              }
              setTab('social');
              toast.success(
                items.length > 1
                  ? `Imported ${items.length}-slide carousel (${meta.aspect_ratio || '4:5'})!`
                  : 'Instagram image post imported!'
              );
              return;
            }

            setV('video_url', url);
            setV('content_type', 'short');
            if (meta.title) setV('title', meta.title);
            if (meta.description) setV('description', meta.description);
            if (meta.thumbnail_url) setV('thumbnail_url', meta.thumbnail_url);
            if (meta.duration_raw) setV('duration_raw', meta.duration_raw);
            if (meta.original_creator_name) setV('original_creator_name', meta.original_creator_name);
            if (meta.original_creator_handle) setV('original_creator_handle', meta.original_creator_handle);
            if (meta.original_creator_url) setV('original_creator_url', meta.original_creator_url);
            toast.success('Instagram reel metadata fetched!');
          } else {
            setV('video_url', url);
            setV('content_type', 'short');
            toast.success('Instagram URL linked! Will be transcoded on publish.');
          }
        } catch (err) {
          setV('video_url', url);
          setV('content_type', 'short');
          toast.success('Instagram URL linked! Video will be transcoded on publish.');
        }

      } else if (platform === 'direct') {
        setV('video_url', url);
        toast.success('Direct video link imported!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to import video URL');
    } finally {
      setFetchingMeta(false);
    }
  };

  // ── Video Tag Handlers ──
  const addVideoTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = videoTagInput.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-');
      if (val && !videoForm.tags.includes(val) && videoForm.tags.length < 12) {
        setV('tags', [...videoForm.tags, val]);
        setVideoTagInput('');
      }
    }
  };

  // ── Drag & Drop ──
  const handleDrag = (e) => { e.preventDefault(); setDragActive(true); };
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

    if (isPersonal && tab !== 'social') {
      toast.error('Video and Short creation is reserved for professional accounts.');
      setTab('social');
      return;
    }

    if (tab === 'social') {
      // ── If importing an Instagram image / carousel ──
      if (instagramImport) {
        setLoading(true);
        try {
          const res = await api.post('/posts/import-instagram', {
            url: instagramImport.url,
            title: instagramImport.title || caption.slice(0, 100) || 'Instagram Post',
            description: caption.trim(),
            tags: socialTags,
            media_items: instagramImport.media_items,
            aspect_ratio: instagramImport.aspect_ratio,
            original_creator_handle: instagramImport.original_creator_handle,
            original_creator_name: instagramImport.original_creator_name,
          });
          toast.success('Instagram post published to Community Feed!');
          navigate(`/posts/${res.data.post.id}?ref=new`);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to publish Instagram post');
        } finally {
          setLoading(false);
        }
        return;
      }

      const hasCode = includeCode && codeSnippet.trim().length > 0;
      if (socialFiles.length === 0 && !hasCode) {
        toast.error('Please add at least one photo/video, code snippet, or Instagram link.');
        return;
      }
      if (caption.trim().length < 10 && !hasCode) {
        toast.error('Caption must be at least 10 characters.');
        return;
      }

      setLoading(true);
      try {
        const fd = new FormData();
        fd.append('type', 'post');

        let finalDescription = caption.trim();
        if (hasCode) {
          const finalLang = (codeLanguage === 'auto' || !codeLanguage)
            ? detectLanguage(codeSnippet)
            : codeLanguage;

          finalDescription = finalDescription
            ? `${finalDescription}\n\n\`\`\`${finalLang}\n${codeSnippet.trim()}\n\`\`\``
            : `\`\`\`${finalLang}\n${codeSnippet.trim()}\n\`\`\``;
        }

        fd.append('description', finalDescription);
        
        if (socialTags.length > 0) {
          socialTags.forEach(tag => fd.append('tags', tag));
        }

        socialFiles.forEach(f => fd.append('files', f));
        fd.append('aspect_ratio', aspectRatio);

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
      const finalCategory = videoForm.category === 'Other'
        ? (customCategory.trim() || 'Other')
        : videoForm.category;

      if (!videoForm.title.trim()) { toast.error('Title is required'); return; }
      if (!videoForm.video_url.trim()) { toast.error('Upload or import a video first'); return; }
      if (!finalCategory) { toast.error('Please select or specify a category'); return; }

      setLoading(true);
      try {
        const payload = {
          title: videoForm.title.trim(),
          description: videoForm.description.trim(),
          video_url: videoForm.video_url,
          thumbnail_url: videoForm.thumbnail_url,
          duration: parseDuration(videoForm.duration_raw),
          tags: videoForm.tags,
          category: finalCategory,
          difficulty: videoForm.difficulty,
          language: videoForm.language,
          content_type: videoForm.content_type,
          visibility: videoForm.visibility,
          source_url: videoForm.source_url || undefined,
          source_platform: videoForm.source_platform || undefined,
          original_creator_name: videoForm.original_creator_name || undefined,
          original_creator_handle: videoForm.original_creator_handle || undefined,
          original_creator_url: videoForm.original_creator_url || undefined,
        };

        const res = await api.post('/videos', payload);
        const videoId = res.data.video.id;

        if (videoForm.source_platform === 'instagram' && videoForm.source_url) {
          try {
            const jobRes = await api.post('/videos/studio/publish', {
              source_url: videoForm.source_url,
              video_id: videoId,
            });
            const jobId = jobRes.data.jobId;
            setPublishingJobId(jobId);
            setPublishingVideoId(videoId);
            setShowStatusModal(true);
            toast.success('Instagram Reel processing pipeline initiated!');
            return;
          } catch (jobErr) {
            toast.error('Failed to initialize Instagram processing pipeline');
          }
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

  // ── Polling Effect for Instagram Pipeline Status ──
  useEffect(() => {
    if (!publishingJobId || !showStatusModal) return;

    const fetchJobStatus = async () => {
      try {
        const res = await api.get(`/videos/studio/jobs/${publishingJobId}`);
        setJobData(res.data.job);
        setJobLogs(res.data.logs || []);
      } catch (err) {
        console.warn('Polling job status error:', err.message);
      }
    };

    fetchJobStatus();
    const timer = setInterval(fetchJobStatus, 3000);
    return () => clearInterval(timer);
  }, [publishingJobId, showStatusModal]);

  const stepLabels = {
    idle: '',
    uploading: 'Uploading video…',
    encoding: 'Processing video…',
    thumbnail: 'Generating thumbnail…',
    ready: 'Upload complete!',
  };

  const displayCategory = videoForm.category === 'Other'
    ? (customCategory.trim() || 'Other')
    : videoForm.category;

  return (
    <>
      <Helmet><title>Create — Code+ Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 1160, paddingLeft: isMobile ? 12 : 24, paddingRight: isMobile ? 12 : 24 }}>

        {/* ── Page Header ── */}
        <div className="np-header" style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 99, background: T.accentSoft, border: `1px solid ${T.accentGlow}`, marginBottom: 10 }}>
            <Sparkles size={14} color={T.accentLight} />
            <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.accentLight, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isPersonal ? 'Community Post Desk' : 'Studio Creator Desk'}
            </span>
          </div>
          <h1 className="np-title" style={{ fontFamily: T.fontHead, fontSize: isMobile ? 24 : 32, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, #ffffff 0%, #d4bbff 50%, #00dbe9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isPersonal ? 'Create Post' : 'Create & Publish'}
          </h1>
          <p style={{ fontFamily: T.fontBody, fontSize: isMobile ? 12 : 14, color: T.textMuted, margin: 0 }}>
            {isPersonal
              ? 'Share high-impact code snippets, photos, and technical discussions.'
              : 'Share high-impact code snippets, video tutorials, and technical shorts.'}
          </p>
        </div>

        {/* ── Tab Switcher (Only for Professional Creators) ── */}
        {!isPersonal && (
          <div className="np-tabs-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? 20 : 28 }}>
            <div className="np-tabs-container" style={{ display: 'flex', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 30, padding: 4, position: 'relative', width: '100%', maxWidth: 420 }}>
              {[
                { key: 'social', icon: FileImage, label: 'Media Post' },
                { key: 'video',  icon: Film,      label: 'Video / Short' },
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className="np-tab-btn"
                  style={{
                    position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, padding: isMobile ? '8px 12px' : '10px 24px', borderRadius: 26, border: 'none', cursor: 'pointer', fontFamily: T.fontHead, fontSize: isMobile ? 13 : 14, fontWeight: 700, background: 'transparent', color: tab === t.key ? '#fff' : T.textMuted, transition: 'color 0.3s',
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
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                style={{
                  position: 'absolute', top: 4, bottom: 4,
                  background: tab === 'social'
                    ? 'linear-gradient(135deg, rgba(0,219,233,0.25), rgba(122,0,255,0.25))'
                    : 'linear-gradient(135deg, rgba(122,0,255,0.25), rgba(0,219,233,0.25))',
                  borderRadius: 26, zIndex: 0,
                  border: `1px solid ${tab === 'social' ? 'rgba(0,219,233,0.4)' : 'rgba(122,0,255,0.4)'}`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Form & Preview Layout ── */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <AnimatePresence mode="wait">

            {tab === 'social' ? (
              /* ═══════════════ MEDIA POST ═══════════════ */
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, padding: isMobile ? 16 : 32, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto', boxSizing: 'border-box' }}
              >
                {/* Instagram Ingestion Bar */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(225,48,108,0.06), rgba(245,96,64,0.06))',
                  border: '1px solid rgba(225,48,108,0.25)',
                  borderRadius: 16,
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>📸</span>
                      <span style={{ fontFamily: T.fontHead, fontSize: 13, fontWeight: 700, color: '#f43f5e' }}>
                        Import Instagram Post / Carousel
                      </span>
                    </div>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
                      Supports 4:5, 1:1, 3:4 slides
                    </span>
                  </div>

                  {!instagramImport ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="url"
                        placeholder="Paste Instagram URL to auto-import (e.g. https://www.instagram.com/p/...)"
                        value={instaFeedUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          const match = val.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?/i);
                          if (match) {
                            setInstaFeedUrl(match[0]);
                            handleFetchInstagramFeed(match[0]);
                          } else {
                            setInstaFeedUrl(val);
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData?.getData('text')?.trim() || '';
                          const match = pasted.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?/i);
                          const cleanUrl = match ? match[0] : pasted;
                          if (cleanUrl) {
                            setInstaFeedUrl(cleanUrl);
                            if (/instagram\.com\/(p|reel|reels)\//i.test(cleanUrl)) {
                              handleFetchInstagramFeed(cleanUrl);
                            }
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetchInstagramFeed(); } }}
                        style={{ ...inputStyle, padding: '9px 12px', fontSize: 13, flex: 1 }}
                      />
                      <button
                        type="button"
                        disabled={fetchingInstaFeed || !instaFeedUrl.trim()}
                        onClick={() => handleFetchInstagramFeed()}
                        style={{
                          background: 'linear-gradient(135deg, #e1306c, #f56040)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          padding: '0 16px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: fetchingInstaFeed || !instaFeedUrl.trim() ? 'not-allowed' : 'pointer',
                          opacity: fetchingInstaFeed || !instaFeedUrl.trim() ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {fetchingInstaFeed ? <Loader2 size={15} className="animate-spin" /> : <LinkIcon size={15} />}
                        {fetchingInstaFeed ? 'Fetching...' : 'Import'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{
                            background: 'rgba(225,48,108,0.2)',
                            color: '#e1306c',
                            borderRadius: 8,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: T.fontMono,
                          }}>
                            {instagramImport.media_items?.length || 1} slides ({instagramImport.aspect_ratio})
                          </span>
                          <span style={{
                            fontSize: 13,
                            color: '#fff',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            @{instagramImport.original_creator_handle || 'Instagram'} • {instagramImport.title || 'Post'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setInstagramImport(null); setInstaFeedUrl(''); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: T.danger,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <X size={14} /> Remove
                        </button>
                      </div>

                      {/* Carousel Slides Preview */}
                      {instagramImport.media_items?.length > 0 && (
                        <div style={{
                          display: 'flex', gap: 12, overflowX: 'auto', padding: '12px 0 4px',
                          scrollSnapType: 'x mandatory',
                        }}>
                          {instagramImport.media_items.map((item, idx) => (
                            <div key={idx} style={{
                              position: 'relative',
                              width: instagramImport.aspect_ratio === '4:5' ? 120 : 140,
                              height: 150,
                              flexShrink: 0,
                              borderRadius: 12,
                              overflow: 'hidden',
                              border: `1px solid rgba(225,48,108,0.4)`,
                              scrollSnapAlign: 'start',
                            }}>
                              <img src={item.url} alt={`slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{
                                position: 'absolute', top: 6, left: 6,
                                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                borderRadius: 10, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: '#fff',
                              }}>
                                {idx + 1}/{instagramImport.media_items.length}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropzone */}
                <div>
                  <span style={labelStyle}>// media attachments</span>
                  <label
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 12, height: socialFiles.length > 0 ? 120 : (isMobile ? 160 : 220),
                      border: `2px dashed ${T.border}`, borderRadius: 16,
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      background: `radial-gradient(circle at center, ${T.elevated} 0%, ${T.bg} 100%)`,
                      transition: 'all 0.3s',
                      padding: '16px', boxSizing: 'border-box',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                  >
                    <input type="file" multiple accept="image/*,video/*" onChange={handleSocialFileChange} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: T.cyanSoft, border: `1px solid ${T.cyanGlow}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <UploadCloud size={22} color={T.cyan} />
                      </div>
                      <span style={{ fontFamily: T.fontHead, fontSize: 14, fontWeight: 600, color: T.text }}>
                        Drop photos or videos here
                      </span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
                        Up to {MAX_FILES} high-res files • Tap to browse
                      </span>
                    </div>
                  </label>

                  {/* Aspect Ratio Selector Pills */}
                  {socialFiles.length > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 10, marginTop: 14, marginBottom: 4,
                      padding: '10px 14px', borderRadius: 14,
                      background: T.elevated, border: `1px solid ${T.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Feed Ratio:
                        </span>
                        <span style={{ fontFamily: T.fontHead, fontSize: 12, fontWeight: 700, color: T.accentLight }}>
                          {aspectRatio === '4:5' ? '4:5 Portrait (1080×1350)' : (aspectRatio === '3:4' ? '3:4 Tall (1080×1440)' : '1:1 Square (1080×1080)')}
                        </span>
                      </div>
                      <div style={{ display: 'inline-flex', gap: 6, background: T.bg, padding: 3, borderRadius: 10, border: `1px solid ${T.border}` }}>
                        {[
                          { key: '4:5', label: '4:5 Portrait' },
                          { key: '1:1', label: '1:1 Square' },
                          { key: '3:4', label: '3:4 Tall' },
                        ].map(r => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => setAspectRatio(r.key)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: T.fontHead,
                              fontSize: 11,
                              fontWeight: 700,
                              background: aspectRatio === r.key ? T.accentSoft : 'transparent',
                              color: aspectRatio === r.key ? T.accentLight : T.textMuted,
                              boxShadow: aspectRatio === r.key ? `0 0 0 1px ${T.accentGlow}` : 'none',
                              transition: 'all 0.2s',
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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
                              position: 'relative',
                              width: aspectRatio === '1:1' ? 140 : 124,
                              aspectRatio: aspectRatio === '4:5' ? '4/5' : (aspectRatio === '3:4' ? '3/4' : '1/1'),
                              flexShrink: 0,
                              borderRadius: 12,
                              overflow: 'hidden',
                              border: `1px solid ${T.border}`,
                              scrollSnapAlign: 'start',
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
                      rows={4}
                      style={{
                        ...inputStyle,
                        resize: 'none', lineHeight: 1.6, paddingBottom: 32,
                      }}
                      onFocus={e => { e.target.style.borderColor = T.cyan; e.target.style.boxShadow = `0 0 0 3px ${T.cyanGlow}`; }}
                      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
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

                {/* ── Code Snippet Option ── */}
                <div style={{
                  background: includeCode ? 'rgba(0, 219, 233, 0.03)' : '#070a0e',
                  border: `1px solid ${includeCode ? 'rgba(0, 219, 233, 0.35)' : T.border}`,
                  borderRadius: 14,
                  padding: 16,
                  transition: 'all 0.25s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: includeCode ? 'rgba(0, 219, 233, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${includeCode ? 'rgba(0, 219, 233, 0.4)' : T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: includeCode ? T.cyan : T.textMuted,
                      }}>
                        <Code2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f2f8', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Attach Code Snippet</span>
                          {includeCode && (
                            <span style={{
                              fontSize: 10, fontFamily: T.fontMono, color: T.cyan,
                              background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)',
                              padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                            }}>
                              IDE ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                          Add syntax-highlighted code directly inside your post card
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIncludeCode(!includeCode)}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        background: includeCode ? 'rgba(0, 219, 233, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${includeCode ? T.cyan : T.border}`,
                        color: includeCode ? T.cyan : T.text,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {includeCode ? 'Remove Code' : '+ Add Code'}
                    </button>
                  </div>

                  {/* Code Editor Panel */}
                  <AnimatePresence>
                    {includeCode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 16, overflow: 'hidden' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                          {/* Language select */}
                          <div>
                            <span style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>// Language</span>
                            <select
                              value={codeLanguage}
                              onChange={e => setCodeLanguage(e.target.value)}
                              style={{ ...inputStyle, padding: '9px 12px', fontSize: 13 }}
                            >
                              {CODE_LANGUAGES.map(l => (
                                <option key={l.value} value={l.value} style={{ background: '#0a0e14', color: '#fff' }}>
                                  {l.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Title / Filename */}
                          <div>
                            <span style={{ ...labelStyle, fontSize: 10, marginBottom: 4 }}>// File / Snippet Title (Optional)</span>
                            <input
                              value={codeTitle}
                              onChange={e => setCodeTitle(e.target.value)}
                              placeholder="e.g. RealtimeSyncManager.ts"
                              style={{ ...inputStyle, padding: '9px 12px', fontSize: 13 }}
                            />
                          </div>
                        </div>

                        {/* Code input */}
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#0b1324', border: '1px solid #1e293b', borderBottom: 'none',
                            borderTopLeftRadius: 10, borderTopRightRadius: 10,
                            padding: '8px 14px', fontSize: 11, fontFamily: T.fontMono, color: '#94a3b8',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: T.cyan, fontWeight: 800 }}>&gt;_</span>
                              <span>{codeLanguage} editor</span>
                            </div>
                            <span>{codeSnippet.split('\n').length} lines</span>
                          </div>

                          <textarea
                            value={codeSnippet}
                            onChange={e => setCodeSnippet(e.target.value)}
                            placeholder={`// Paste your ${codeLanguage} code here...\nexport class Example {\n  private state: boolean = true;\n}`}
                            rows={8}
                            spellCheck={false}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: '#070c18', border: '1px solid #1e293b',
                              borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
                              padding: '14px 16px', fontSize: 13, color: '#e2e8f0',
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              lineHeight: 1.5, outline: 'none', resize: 'vertical',
                              tabSize: 2,
                            }}
                          />
                        </div>

                        {/* Live Snippet Preview */}
                        {codeSnippet.trim() && (
                          <div style={{ marginTop: 14 }}>
                            <span style={{ ...labelStyle, fontSize: 10, marginBottom: 4, color: T.cyan }}>
                              // Live Post Card Preview
                            </span>
                            <CodeSnippetCard
                              code={codeSnippet}
                              language={codeLanguage}
                              title={codeTitle}
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Post Tags / Topics ── */}
                <div>
                  <span style={labelStyle}>// tags / topics (press enter to add)</span>
                  <div style={{
                    ...inputStyle,
                    display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                    padding: '8px 12px', minHeight: 44,
                  }}>
                    {socialTags.map((tag, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(0, 219, 233, 0.12)', border: '1px solid rgba(0, 219, 233, 0.3)',
                        color: T.cyan, fontSize: 11, fontFamily: T.fontMono, fontWeight: 700,
                      }}>
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setSocialTags(socialTags.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}

                    <input
                      value={socialTagInput}
                      onChange={e => setSocialTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const val = socialTagInput.trim().replace(/^#/, '').replace(/\s+/g, '-');
                          if (val && !socialTags.includes(val) && socialTags.length < 8) {
                            setSocialTags([...socialTags, val]);
                            setSocialTagInput('');
                          }
                        }
                      }}
                      placeholder={socialTags.length === 0 ? "e.g. TypeScript, WebSockets, Go" : "Add tag..."}
                      style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        color: '#f0f2f8', fontSize: 13, flex: 1, minWidth: 120,
                        fontFamily: T.fontBody,
                      }}
                    />
                  </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', gap: 12, paddingTop: 16, justifyContent: 'flex-end', borderTop: `1px solid ${T.border}` }}>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{
                      padding: '10px 20px', borderRadius: 30,
                      background: 'transparent', border: `1px solid ${T.border}`,
                      color: T.text, cursor: 'pointer', fontWeight: 600,
                      fontFamily: T.fontBody, fontSize: 13,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 28px', borderRadius: 30,
                      background: `linear-gradient(135deg, ${T.cyan}, ${T.accent})`,
                      color: '#fff', fontSize: 14, fontWeight: 700,
                      fontFamily: T.fontHead, border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      boxShadow: `0 4px 20px ${T.accentGlow}`,
                    }}
                  >
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publishing…</> : <>Share <Send size={16} /></>}
                  </button>
                </div>
              </motion.div>

            ) : (

              /* ═══════════════ VIDEO UPLOAD & LIVE PREVIEW ═══════════════ */
              <motion.div
                key="video"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 24, alignItems: 'flex-start', width: '100%',
                }}
              >

                {/* Left Form Box */}
                <div style={{ flex: 1, width: '100%', background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, padding: isMobile ? 16 : 28, display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box' }}>
                  
                  {/* Video Source Selector */}
                  <div>
                    <span style={labelStyle}>// video source</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { key: 'upload', icon: UploadCloud, label: 'Upload File' },
                        { key: 'url',    icon: LinkIcon,    label: 'Import URL' },
                      ].map(vt => (
                        <button
                          key={vt.key}
                          type="button"
                          onClick={() => setVideoTab(vt.key)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '10px 14px', borderRadius: 12,
                            border: `1px solid ${videoTab === vt.key ? T.accent : T.border}`,
                            background: videoTab === vt.key ? T.accentSoft : 'transparent',
                            color: videoTab === vt.key ? T.accentLight : T.textMuted,
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
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                            height: isMobile ? 160 : 190, border: `2px dashed ${dragActive ? T.accent : T.border}`, borderRadius: 16,
                            background: dragActive ? T.accentSoft : `radial-gradient(circle at center, ${T.elevated} 0%, ${T.bg} 100%)`,
                            padding: '16px', cursor: 'pointer', transition: 'all 0.3s', boxSizing: 'border-box',
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
                            width: 44, height: 44, borderRadius: '50%',
                            background: T.accentSoft, border: `1px solid ${T.accentGlow}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Upload size={22} color={T.accentLight} />
                          </div>
                          <span style={{ fontFamily: T.fontHead, fontSize: 14, fontWeight: 600, color: T.text, textAlign: 'center' }}>
                            Drag & drop your video file
                          </span>
                          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted, textAlign: 'center' }}>
                            MP4, WebM, MOV — Up to 500MB • Tap to browse
                          </span>
                        </label>
                      ) : (
                        /* Progress State */
                        <div style={{
                          padding: 16, borderRadius: 16,
                          border: `1px solid ${T.border}`,
                          background: T.bg,
                          display: 'flex', flexDirection: 'column', gap: 12,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {uploadStep === 'ready'
                              ? <CheckCircle2 size={20} color={T.green} />
                              : <Loader2 size={20} color={T.accentLight} style={{ animation: 'spin 1s linear infinite' }} />
                            }
                            <span style={{
                              fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
                              color: uploadStep === 'ready' ? T.green : T.text,
                            }}>
                              {stepLabels[uploadStep]}
                            </span>
                          </div>
                          <div style={{
                            height: 6, borderRadius: 3,
                            background: T.elevated, overflow: 'hidden',
                          }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.4 }}
                              style={{
                                height: '100%', borderRadius: 3,
                                background: uploadStep === 'ready'
                                  ? `linear-gradient(90deg, ${T.green}, ${T.cyan})`
                                  : `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`,
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
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
                      <input
                        value={urlInput}
                        onChange={e => {
                          const val = e.target.value;
                          const igMatch = val.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?/i);
                          const ytMatch = val.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+/i);
                          const clean = igMatch ? igMatch[0] : (ytMatch ? ytMatch[0] : val);
                          setUrlInput(clean);
                          if (detectPlatformFromUrl(clean)) {
                            handleImportUrl(clean);
                          }
                        }}
                        onPaste={e => {
                          e.preventDefault();
                          const pasted = e.clipboardData?.getData('text')?.trim() || '';
                          const igMatch = pasted.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?/i);
                          const ytMatch = pasted.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+/i);
                          const clean = igMatch ? igMatch[0] : (ytMatch ? ytMatch[0] : pasted);
                          if (clean) {
                            setUrlInput(clean);
                            if (detectPlatformFromUrl(clean)) {
                              handleImportUrl(clean);
                            }
                          }
                        }}
                        placeholder="Paste YouTube or Instagram Reel URL to auto-import…"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`; }}
                        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={handleImportUrl}
                        disabled={fetchingMeta || !urlInput.trim()}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '12px 18px', borderRadius: 12,
                          background: T.accent, color: '#fff',
                          border: 'none', cursor: 'pointer',
                          fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
                          opacity: fetchingMeta || !urlInput.trim() ? 0.5 : 1,
                          transition: 'opacity 0.2s',
                          whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto',
                        }}
                      >
                        {fetchingMeta ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LinkIcon size={16} />}
                        Import Meta
                      </button>
                    </div>
                  )}

                  {/* Platform Indicator */}
                  {videoForm.source_platform && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(122,0,255,0.08)',
                      border: `1px solid ${T.accentGlow}`,
                    }}>
                      {videoForm.source_platform === 'instagram' ? <Radio size={14} color="#E1306C" /> : videoForm.source_platform === 'youtube' ? <Play size={14} color="#FF0000" /> : <Film size={14} color={T.cyan} />}
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.accentLight, fontWeight: 600, textTransform: 'uppercase' }}>
                        Source Platform: {videoForm.source_platform}
                      </span>
                    </div>
                  )}

                  {/* Content Type Toggle */}
                  <div>
                    <span style={labelStyle}>// content type</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { value: 'long',  label: '📺 Long Video' },
                        { value: 'short', label: '⚡ Short / Reel' },
                      ].map(ct => (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => setV('content_type', ct.value)}
                          style={{
                            flex: 1, padding: '12px 14px', borderRadius: 12,
                            border: `1px solid ${videoForm.content_type === ct.value ? T.accent : T.border}`,
                            background: videoForm.content_type === ct.value ? T.accentSoft : 'transparent',
                            color: videoForm.content_type === ct.value ? T.accentLight : T.textMuted,
                            cursor: 'pointer', fontFamily: T.fontHead, fontSize: 13,
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
                      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <span style={labelStyle}>// description</span>
                    <textarea
                      value={videoForm.description}
                      onChange={e => setV('description', e.target.value)}
                      placeholder="Describe your video content…"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                      onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`; }}
                      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Category & Duration Row */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <span style={labelStyle}>// category *</span>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={videoForm.category}
                          onChange={e => setV('category', e.target.value)}
                          style={{
                            ...inputStyle,
                            appearance: 'none', paddingRight: 36,
                            color: videoForm.category ? '#f0f2f8' : T.textMuted,
                          }}
                        >
                          <option value="" style={{ background: '#151921', color: '#8a8297' }}>Select category</option>
                          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#151921', color: '#f0f2f8' }}>{c}</option>)}
                        </select>
                        <ChevronDown size={16} color={T.textMuted} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>

                      {/* Custom Category Input if 'Other' Selected */}
                      {videoForm.category === 'Other' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: 10 }}
                        >
                          <span style={{ ...labelStyle, fontSize: 10, color: T.cyan }}>// specify custom category *</span>
                          <div style={{ position: 'relative' }}>
                            <input
                              value={customCategory}
                              onChange={e => setCustomCategory(e.target.value)}
                              placeholder="e.g. Web3, Game Dev, Competitive Programming…"
                              style={{ ...inputStyle, borderColor: T.cyanGlow, background: '#0a0e14' }}
                              onFocus={e => { e.target.style.borderColor = T.cyan; e.target.style.boxShadow = `0 0 0 3px ${T.cyanGlow}`; }}
                              onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
                            />
                            <Edit3 size={14} color={T.cyan} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <span style={labelStyle}>// duration</span>
                      <input
                        value={videoForm.duration_raw}
                        onChange={e => setV('duration_raw', e.target.value)}
                        placeholder="e.g. 12:34 or 90"
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = T.accent; }}
                        onBlur={e => { e.target.style.borderColor = T.border; }}
                      />
                    </div>
                  </div>

                  {/* Difficulty & Language */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <span style={labelStyle}>// difficulty</span>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={videoForm.difficulty}
                          onChange={e => setV('difficulty', e.target.value)}
                          style={{ ...inputStyle, appearance: 'none', paddingRight: 36 }}
                        >
                          {DIFFICULTIES.map(d => <option key={d} value={d} style={{ background: '#151921', color: '#f0f2f8' }}>{d.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={16} color={T.textMuted} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={labelStyle}>// language</span>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={videoForm.language}
                          onChange={e => setV('language', e.target.value)}
                          style={{ ...inputStyle, appearance: 'none', paddingRight: 36 }}
                        >
                          {LANGUAGES.map(l => <option key={l} value={l} style={{ background: '#151921', color: '#f0f2f8' }}>{l}</option>)}
                        </select>
                        <ChevronDown size={16} color={T.textMuted} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail URL */}
                  <div>
                    <span style={labelStyle}>// thumbnail url</span>
                    <input
                      value={videoForm.thumbnail_url}
                      onChange={e => setV('thumbnail_url', e.target.value)}
                      placeholder="https://…/thumbnail.jpg"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = T.accent; }}
                      onBlur={e => { e.target.style.borderColor = T.border; }}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <span style={labelStyle}>// tags ({videoForm.tags.length}/12)</span>
                    <div style={{
                      display: 'flex', gap: 8, flexWrap: 'wrap',
                      padding: '10px 12px', background: T.bg,
                      border: `1px solid ${T.border}`, borderRadius: 12,
                      minHeight: 44,
                    }}>
                      {videoForm.tags.map(tag => (
                        <span key={tag} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontFamily: T.fontMono, fontSize: 11,
                          background: T.accentSoft, color: T.accentLight,
                          border: `1px solid ${T.accentGlow}`, borderRadius: 20,
                          padding: '4px 10px',
                        }}>
                          #{tag}
                          <button type="button" onClick={() => setV('tags', videoForm.tags.filter(t => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accentLight, display: 'flex', padding: 0, marginLeft: 2 }}>
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
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
                      {VISIBILITY_OPTIONS.map(v => (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() => setV('visibility', v.value)}
                          style={{
                            flex: 1, display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', gap: 8,
                            padding: '12px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                            border: `1px solid ${videoForm.visibility === v.value ? T.accent : T.border}`,
                            background: videoForm.visibility === v.value ? T.accentSoft : 'transparent',
                          }}
                        >
                          <v.icon size={18} color={videoForm.visibility === v.value ? T.accentLight : T.textMuted} />
                          <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: videoForm.visibility === v.value ? T.accentLight : T.textMuted }}>
                            {v.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Original Creator Attribution (If set) */}
                  {videoForm.original_creator_name && (
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: T.elevated, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.accentLight, fontWeight: 700, textTransform: 'uppercase' }}>Original Creator Attribution</span>
                      <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.text, fontWeight: 600 }}>{videoForm.original_creator_name} {videoForm.original_creator_handle && `@${videoForm.original_creator_handle}`}</span>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div style={{ display: 'flex', gap: 12, paddingTop: 16, justifyContent: 'flex-end', borderTop: `1px solid ${T.border}` }}>
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
                        background: `linear-gradient(135deg, ${T.accent}, ${T.cyan})`,
                        color: '#fff', border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: 15, fontFamily: T.fontHead,
                        opacity: loading ? 0.7 : 1,
                        boxShadow: `0 4px 20px ${T.accentGlow}`,
                      }}
                    >
                      {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publishing…</> : <>Publish Video <Send size={16} /></>}
                    </button>
                  </div>

                </div>

                {/* Right Sticky / Responsive Preview Card */}
                <div style={{
                  width: isMobile ? '100%' : 360,
                  position: isMobile ? 'relative' : 'sticky', top: 24,
                  background: T.card, borderRadius: 20, border: `1px solid ${T.border}`,
                  overflow: 'hidden', boxSizing: 'border-box',
                }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Eye size={15} color={T.accentLight} />
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.accentLight, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Card Preview</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: videoForm.content_type === 'short' ? `${T.cyan}22` : `${T.accent}22`, color: videoForm.content_type === 'short' ? T.cyan : T.accentLight, border: `1px solid ${videoForm.content_type === 'short' ? T.cyan : T.accent}44`, fontFamily: T.fontMono }}>
                      {videoForm.content_type === 'short' ? '⚡ SHORT' : '🎬 LONG VIDEO'}
                    </span>
                  </div>

                  {/* Thumbnail / Video Container */}
                  <div style={{ aspectRatio: videoForm.content_type === 'short' ? '9/16' : '16/9', maxHeight: videoForm.content_type === 'short' ? 280 : undefined, background: T.elevated, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {videoForm.thumbnail_url ? (
                      <img src={videoForm.thumbnail_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: T.textMuted }}>
                        <Film size={32} color={T.textDim} />
                        <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>No thumbnail URL</span>
                      </div>
                    )}

                    {videoForm.duration_raw && (
                      <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: T.fontMono }}>
                        {formatDurationDisplay(parseDuration(videoForm.duration_raw))}
                      </div>
                    )}

                    {videoForm.difficulty && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: videoForm.difficulty === 'beginner' ? T.green : videoForm.difficulty === 'intermediate' ? T.warning : T.danger, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, fontFamily: T.fontMono, textTransform: 'uppercase' }}>
                        {videoForm.difficulty}
                      </div>
                    )}
                  </div>

                  {/* Card Details */}
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <h4 style={{ fontFamily: T.fontHead, fontSize: 15, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.4 }}>
                      {videoForm.title || <span style={{ color: T.textDim, fontStyle: 'italic' }}>Untitled Video...</span>}
                    </h4>

                    {videoForm.description && (
                      <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textMuted, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                        {videoForm.description}
                      </p>
                    )}

                    {videoForm.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {videoForm.tags.slice(0, 4).map(t => (
                          <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: T.accentSoft, color: T.accentLight, fontFamily: T.fontMono }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 8, borderTop: `1px solid ${T.border}`, fontSize: 11, fontFamily: T.fontMono, color: T.textMuted }}>
                      <span>Category: {displayCategory || '—'}</span>
                      <span style={{ color: videoForm.video_url ? T.green : T.textDim }}>
                        {videoForm.video_url ? '✓ Media Linked' : 'No Media'}
                      </span>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </form>

        {/* ── Instagram Transcoding Pipeline Live Status Tracker Modal ── */}
        <AnimatePresence>
          {showStatusModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 999,
                background: 'rgba(4, 6, 10, 0.85)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{
                  width: '100%', maxWidth: 520, background: T.card,
                  border: `1px solid ${T.accentGlow}`, borderRadius: 24,
                  padding: 28, boxShadow: `0 16px 48px rgba(0,0,0,0.6)`,
                  display: 'flex', flexDirection: 'column', gap: 20,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(225,48,108,0.15)', border: '1px solid rgba(225,48,108,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Radio size={20} color="#E1306C" />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>
                        Instagram Transcoding Pipeline
                      </h3>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>Job ID: {publishingJobId}</span>
                    </div>
                  </div>
                  {jobData?.status === 'READY' && (
                    <button onClick={() => setShowStatusModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Live Stage Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: T.elevated, padding: 18, borderRadius: 16, border: `1px solid ${T.border}` }}>
                  {STAGES.map((s, idx) => {
                    const currentIdx = stageIndex(jobData?.status);
                    const isDone = currentIdx > idx || jobData?.status === 'READY';
                    const isActive = currentIdx === idx && jobData?.status !== 'READY' && jobData?.status !== 'FAILED';
                    const isFailed = jobData?.status === 'FAILED' && currentIdx === idx;

                    return (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, opacity: currentIdx < idx && jobData?.status !== 'READY' ? 0.4 : 1 }}>
                        <div style={{ marginTop: 2 }}>
                          {isDone ? (
                            <CheckCircle2 size={18} color={T.green} />
                          ) : isActive ? (
                            <Loader2 size={18} color={T.cyan} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : isFailed ? (
                            <AlertCircle size={18} color={T.danger} />
                          ) : (
                            <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.border}` }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 700, color: isDone ? T.green : isActive ? T.cyan : isFailed ? T.danger : T.textSub }}>
                            {s.label}
                          </div>
                          <div style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMuted }}>
                            {s.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Message Footer */}
                {jobData?.status === 'READY' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: T.green, fontFamily: T.fontBody, fontSize: 13, fontWeight: 600 }}>
                      🎉 Reel successfully transcoded & published to CPA Shorts!
                    </div>
                    <button
                      onClick={() => navigate(`/shorts/${publishingVideoId}`)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '13px 24px', borderRadius: 30,
                        background: `linear-gradient(135deg, ${T.cyan}, ${T.accent})`,
                        color: '#fff', border: 'none', cursor: 'pointer',
                        fontFamily: T.fontHead, fontSize: 15, fontWeight: 700,
                        boxShadow: `0 4px 20px ${T.cyanGlow}`,
                      }}
                    >
                      View Live Short <ArrowRight size={16} />
                    </button>
                  </div>
                ) : jobData?.status === 'FAILED' ? (
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: T.danger, fontFamily: T.fontBody, fontSize: 12 }}>
                    Processing Error: {jobData.error || 'Failed to transcode Instagram reel'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: T.textMuted, fontFamily: T.fontMono, fontSize: 12, textAlign: 'center' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Transcoding in background... You can stay or navigate away safely.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </PageWrapper>
    </>
  );
}
