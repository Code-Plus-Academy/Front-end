'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Sparkles,
  Music,
  BarChart2,
  MapPin,
  Hash,
  Smile,
  Star,
  Clock,
  Bookmark,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Film,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const StoryEditor = dynamic(() => import('../story-editor/StoryEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
});

const DURATION_OPTIONS = ['12 hours', '24 hours', '48 hours'];

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated }) {
  const [mounted, setMounted] = useState(false);
  const [isStudioMode, setIsStudioMode] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState(null);

  // Settings states
  const [closeFriends, setCloseFriends] = useState(false);
  const [allowReplies, setAllowReplies] = useState(true);
  const [durationIndex, setDurationIndex] = useState(1); // '24 hours' default

  // Feature pill helper states
  const [activePill, setActivePill] = useState(null);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Restore draft if available on open
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem('cpa_story_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.caption && !caption) setCaption(parsed.caption);
          if (parsed.closeFriends !== undefined) setCloseFriends(parsed.closeFriends);
          if (parsed.allowReplies !== undefined) setAllowReplies(parsed.allowReplies);
          if (parsed.durationIndex !== undefined) setDurationIndex(parsed.durationIndex);
        } catch (e) {}
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    if (uploading) return;
    setError(null);
    onClose();
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    // Validate type
    const validImage = selectedFile.type.startsWith('image/');
    const validVideo = selectedFile.type.startsWith('video/');
    if (!validImage && !validVideo) {
      setError('Please select a valid image (JPG, PNG, WebP) or video (MP4, WebM).');
      return;
    }

    // Validate size (50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB.');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setIsVideo(validVideo);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    processFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    processFile(droppedFile);
  };

  const handleRemoveMedia = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setIsVideo(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Feature pill actions
  const handlePillClick = (type) => {
    setActivePill(type);
    switch (type) {
      case 'text':
        textareaRef.current?.focus();
        break;
      case 'music':
        setCaption((prev) => {
          const tag = '🎵 Lo-fi Chill Beats ';
          return prev.includes('🎵') ? prev : (prev ? `${prev} ${tag}` : tag);
        });
        toast('Added Music Tag 🎵', { icon: '🎶' });
        break;
      case 'poll':
        setCaption((prev) => {
          const tag = '📊 Poll: What do you think? ';
          return prev.includes('📊') ? prev : (prev ? `${prev} ${tag}` : tag);
        });
        toast('Added Poll Question 📊', { icon: '📊' });
        break;
      case 'location':
        setCaption((prev) => {
          const tag = '📍 Campus Central ';
          return prev.includes('📍') ? prev : (prev ? `${prev} ${tag}` : tag);
        });
        toast('Added Location Tag 📍', { icon: '📍' });
        break;
      case 'hashtag':
        setCaption((prev) => (prev ? `${prev} #CodePlus ` : '#CodePlus '));
        toast('Added Hashtag #CodePlus', { icon: '#' });
        break;
      case 'sticker':
        setCaption((prev) => (prev ? `${prev} ✨ ` : '✨ '));
        toast('Added Sticker Emoji ✨', { icon: '✨' });
        break;
      default:
        break;
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        'cpa_story_draft',
        JSON.stringify({
          caption,
          closeFriends,
          allowReplies,
          durationIndex,
          savedAt: new Date().toISOString(),
        })
      );
      toast.success('Story draft saved!');
    } catch (e) {
      toast.error('Failed to save draft');
    }
  };

  const handleCycleDuration = () => {
    setDurationIndex((prev) => (prev + 1) % DURATION_OPTIONS.length);
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const uploadRes = await api.post('/upload/story', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url } = uploadRes.data;

      await api.post('/stories', {
        content_url: url,
        type: isVideo ? 'video' : 'image',
        caption: caption.trim() || undefined,
        close_friends_only: closeFriends,
        allow_replies: allowReplies,
      });

      setUploadDone(true);
      toast.success('Story shared with your audience! ✨');

      // Clear draft on successful publish
      localStorage.removeItem('cpa_story_draft');

      setTimeout(() => {
        setUploadDone(false);
        setFile(null);
        setPreview(null);
        setCaption('');
        onClose();
        if (onStoryCreated) onStoryCreated();
      }, 1100);
    } catch (err) {
      console.error('Story upload failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to share story. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleStudioExport = async ({ pngBlob, editableJson, interactiveMetadata }) => {
    if (uploading) return;
    setUploading(true);
    setError(null);

    try {
      const storyFile = new File([pngBlob], `story_${Date.now()}.png`, { type: 'image/png' });
      const form = new FormData();
      form.append('file', storyFile);

      const uploadRes = await api.post('/upload/story', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url } = uploadRes.data;

      await api.post('/stories', {
        content_url: url,
        type: 'image',
        caption: caption.trim() || undefined,
        close_friends_only: closeFriends,
        allow_replies: allowReplies,
        editable_json: editableJson,
        interactive_metadata: interactiveMetadata,
      });

      toast.success('Story shared with your audience! ✨');
      localStorage.removeItem('cpa_story_draft');
      setIsStudioMode(false);
      onClose();
      if (onStoryCreated) onStoryCreated();
    } catch (err) {
      console.error('Story Studio publish failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to share story.');
      setError(err?.response?.data?.message || err?.message || 'Failed to share story.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  if (isStudioMode) {
    return createPortal(
      <StoryEditor
        initialImage={file || preview}
        onClose={() => setIsStudioMode(false)}
        onExport={handleStudioExport}
        isSubmitting={uploading}
        exportButtonText="Share Story"
      />,
      document.body
    );
  }

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full sm:max-w-[460px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto"
          style={{
            backgroundColor: 'var(--surface, #FFFFFF)',
            border: '1px solid var(--border, rgba(0,0,0,0.08))',
            color: 'var(--text, #0F172A)',
            boxShadow: 'var(--shadow-modal, 0 25px 60px -12px rgba(0, 0, 0, 0.35))',
            paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Pill / Drag Handle for Mobile */}
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-11 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
          </div>

          <div className="px-5 sm:px-7 pt-2 pb-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Create New Story
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  Share a moment with your audience ✨
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center flex-shrink-0"
              >
                <X size={17} />
              </button>
            </div>

            {/* Launch Canvas Studio Banner */}
            <button
              type="button"
              onClick={() => setIsStudioMode(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 hover:from-indigo-600/20 hover:to-pink-600/20 text-left transition-all active:scale-[0.99] shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-md group-hover:scale-105 transition-transform">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Story Canvas Studio</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 uppercase">
                      New
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Draw, add styled text, stickers & interactive badges
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Media Dropzone / Preview Area */}
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full rounded-2xl border-2 border-dashed transition-all p-6 sm:p-7 flex flex-col items-center justify-center cursor-pointer text-center select-none ${
                  isDragging
                    ? 'border-purple-500 bg-purple-100/50 dark:bg-purple-900/30 scale-[0.99]'
                    : 'border-purple-300/80 dark:border-purple-500/40 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
              >
                {/* Upload Icon Badge */}
                <div className="w-13 h-13 rounded-2xl bg-purple-100/80 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3 shadow-xs">
                  <Upload size={26} strokeWidth={2.3} />
                </div>

                {/* Primary & Secondary text */}
                <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  Drag & drop media here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  or tap to{' '}
                  <span className="text-purple-600 dark:text-purple-400 font-semibold underline underline-offset-2">
                    browse
                  </span>
                </p>

                {/* Divider with Supports */}
                <div className="relative w-full max-w-[240px] my-3.5 flex items-center justify-center">
                  <div className="w-full border-t border-purple-200/80 dark:border-purple-800/40 absolute" />
                  <span className="bg-purple-50 dark:bg-[#131926] px-2.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider relative z-10">
                    Supports
                  </span>
                </div>

                {/* Format Chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-purple-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-xs">
                    JPG
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-purple-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-xs">
                    PNG
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-purple-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-xs">
                    WebP
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-purple-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-xs">
                    MP4
                  </span>
                  <span className="px-2 py-1 text-[11px] font-medium rounded-full bg-white dark:bg-white/5 border border-purple-200/70 dark:border-white/10 text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                    More ▾
                  </span>
                </div>
              </div>
            ) : (
              /* Media Selected Preview Card */
              <div className="relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-purple-200/70 dark:border-purple-900/40 shadow-inner max-h-[260px]">
                {isVideo ? (
                  <video
                    src={preview}
                    controls
                    playsInline
                    className="w-full h-full max-h-[260px] object-contain rounded-2xl"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Story preview"
                    className="w-full h-full max-h-[260px] object-contain rounded-2xl"
                  />
                )}

                {/* Remove / Change Overlay Button */}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  disabled={uploading}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all shadow-md flex items-center gap-1 text-xs px-2.5"
                  title="Change Media"
                >
                  <RotateCcw size={13} />
                  <span>Change</span>
                </button>

                {/* Bottom Media Badge */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5">
                  {isVideo ? <Film size={13} /> : <ImageIcon size={13} />}
                  <span className="truncate max-w-[180px]">{file?.name}</span>
                </div>
              </div>
            )}

            {/* Interactive Feature Pills Toolbar */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {/* Text */}
              <button
                type="button"
                onClick={() => handlePillClick('text')}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                  activePill === 'text'
                    ? 'border-pink-400 bg-pink-50/80 dark:bg-pink-950/40'
                    : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-pink-100/70 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xs font-black">
                  Aa
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Text
                </span>
              </button>

              {/* Music */}
              <button
                type="button"
                onClick={() => handlePillClick('music')}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                  activePill === 'music'
                    ? 'border-purple-400 bg-purple-50/80 dark:bg-purple-950/40'
                    : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100/70 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Music size={15} />
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Music
                </span>
              </button>

              {/* Poll */}
              <button
                type="button"
                onClick={() => handlePillClick('poll')}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                  activePill === 'poll'
                    ? 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                    : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BarChart2 size={15} />
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Poll
                </span>
              </button>

              {/* Location */}
              <button
                type="button"
                onClick={() => handlePillClick('location')}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                  activePill === 'location'
                    ? 'border-orange-400 bg-orange-50/80 dark:bg-orange-950/40'
                    : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-100/70 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <MapPin size={15} />
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Location
                </span>
              </button>

              {/* Hashtag */}
              <button
                type="button"
                onClick={() => handlePillClick('hashtag')}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                  activePill === 'hashtag'
                    ? 'border-sky-400 bg-sky-50/80 dark:bg-sky-950/40'
                    : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100/70 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Hash size={15} />
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Hashtag
                </span>
              </button>

              {/* Sticker */}
              <button
                type="button"
                onClick={() => handlePillClick('sticker')}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                  activePill === 'sticker'
                    ? 'border-violet-400 bg-violet-50/80 dark:bg-violet-950/40'
                    : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-violet-100/70 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Smile size={15} />
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Sticker
                </span>
              </button>
            </div>

            {/* Caption Textarea with Character Counter */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] p-3 transition-all focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
              <textarea
                ref={textareaRef}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={150}
                rows={2}
                placeholder="Add a story caption…"
                disabled={uploading}
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none font-normal leading-relaxed"
              />
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-white/5">
                <span className="text-[11px] text-slate-400">
                  {caption.length === 0 ? 'Optional caption' : ''}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {caption.length}/150
                </span>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Settings Toggles */}
            <div className="flex flex-col gap-3 pt-1">
              {/* Close Friends Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Star size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      Close Friends
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Only people on your list can see this
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={closeFriends}
                  onClick={() => setCloseFriends(!closeFriends)}
                  disabled={uploading}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                    closeFriends
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: closeFriends ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              {/* Allow Replies Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      Allow Replies
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Let people reply to your story
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowReplies}
                  onClick={() => setAllowReplies(!allowReplies)}
                  disabled={uploading}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                    allowReplies
                      ? 'bg-purple-600'
                      : 'bg-slate-200 dark:bg-white/20'
                  }`}
                >
                  <motion.div
                    animate={{ x: allowReplies ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              {/* Story Duration Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-100/80 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Clock size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      Story Duration
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Set how long your story stays visible
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCycleDuration}
                  disabled={uploading}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  <span>{DURATION_OPTIONS[durationIndex]}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              {/* Save Draft Button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={uploading}
                className="px-4 sm:px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-xs cursor-pointer"
              >
                <Bookmark size={16} />
                <span>Save Draft</span>
              </button>

              {/* Share Story Button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: uploadDone
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : 'linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%)',
                  boxShadow:
                    file && !uploading
                      ? '0 6px 22px rgba(217, 70, 239, 0.4)'
                      : 'none',
                }}
              >
                {uploadDone ? (
                  <>
                    <CheckCircle size={17} />
                    <span>Story Shared!</span>
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Sharing Story…</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs">
                      +
                    </div>
                    <span>Share Story</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
