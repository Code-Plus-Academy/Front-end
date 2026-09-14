import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Image as ImageIcon,
  UploadCloud,
  AlertCircle,
  Loader2,
  Send,
  Info,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';

export default function MediaAttachmentModal({
  isOpen,
  onClose,
  onSend,
  isDark = true,
  themeAccent = '#7C3AED',
}) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreviewUrl(null);
      setIsVideo(false);
      setCaption('');
      setError(null);
      setUploading(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsVideo(file.type?.startsWith('video/'));
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
      setIsVideo(false);
    }
  }, [file]);

  if (!isOpen || !mounted) return null;

  const validateAndSetFile = (selected) => {
    if (!selected) return;

    if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
      setError('Please select an image (JPG, PNG, WebP) or video (MP4, WebM).');
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
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
    validateAndSetFile(droppedFile);
  };

  const handleClearSelected = () => {
    setFile(null);
    setPreviewUrl(null);
    setIsVideo(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setError(null);

    try {
      // Local file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resource_type', isVideo ? 'video' : 'image');

      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const uploadData = await res.json();
      const permanentUrl = uploadData.secure_url || uploadData.url;

      const attachmentPayload = {
        type: 'media',
        media_type: isVideo ? 'video' : 'image',
        url: permanentUrl,
        thumbnail_url: isVideo ? (uploadData.thumbnail_url || null) : permanentUrl,
        width: uploadData.width || 1200,
        height: uploadData.height || 800,
        caption: caption.trim() || null,
      };

      onSend(attachmentPayload, caption.trim() || (isVideo ? 'Shared a video' : 'Shared a photo'));
      onClose();
    } catch (err) {
      console.error('Media upload error:', err);
      setError(err.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const hasSelection = !!file;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-[480px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
          color: isDark ? '#F1F5F9' : '#0F172A',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.45)',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle for Mobile View */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Soft Gradient Image Badge */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-200 via-rose-200 to-indigo-200 dark:from-purple-900/60 dark:to-indigo-900/60 text-slate-800 dark:text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <ImageIcon size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  Send Photos & Videos
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  High-resolution media up to 50MB
                </p>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center flex-shrink-0"
            >
              <X size={17} />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Dropzone or Selected Media Preview */}
          {!hasSelection ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full rounded-2xl border-2 border-dashed p-6 sm:p-7 flex flex-col items-center justify-center cursor-pointer text-center transition-all select-none ${
                isDragging
                  ? 'border-purple-500 bg-purple-100/50 dark:bg-purple-900/30 scale-[0.99]'
                  : 'border-purple-300/80 dark:border-purple-500/40 bg-purple-50/30 dark:bg-purple-950/20 hover:border-purple-400 hover:bg-purple-50/60 dark:hover:bg-purple-950/30'
              }`}
            >
              {/* Cloud Upload Icon Badge */}
              <div className="w-14 h-14 rounded-full bg-purple-100/80 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <UploadCloud size={28} strokeWidth={2.1} />
              </div>

              {/* Title & Browse */}
              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                Drag & drop media here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                or tap to{' '}
                <span className="text-purple-600 dark:text-purple-400 font-semibold underline underline-offset-2 hover:opacity-80">
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

              {/* Format Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs">
                  JPEG
                </span>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs">
                  PNG
                </span>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs">
                  WebP
                </span>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs">
                  MP4
                </span>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-2xs">
                  WebM
                </span>
              </div>

              {/* Max size note */}
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 font-medium">
                <Info size={13} />
                <span>Max size: 50MB</span>
              </div>
            </div>
          ) : (
            /* Selected Media Preview Card */
            <div className="relative w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-purple-200/70 dark:border-purple-900/40 shadow-inner max-h-[220px]">
              {isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="w-full h-full max-h-[220px] object-contain rounded-2xl"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Selected media"
                  className="w-full h-full max-h-[220px] object-contain rounded-2xl"
                />
              )}

              {/* Change / Remove Button */}
              <button
                type="button"
                onClick={handleClearSelected}
                disabled={uploading}
                className="absolute top-3 right-3 py-1.5 px-3 rounded-full bg-black/75 hover:bg-black/95 text-white backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 text-xs font-semibold"
                title="Change media"
              >
                <RotateCcw size={13} />
                <span>Change</span>
              </button>

              {/* Name Tag */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5">
                <span className="truncate max-w-[200px]">
                  {file?.name || 'Selected media'}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-2.5 rounded-xl">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Optional Caption Input */}
          <div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 flex items-center gap-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
              <MessageSquare size={16} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={220}
                placeholder="Add a caption…"
                disabled={uploading}
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-normal"
              />
              <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
                {caption.length}/220
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasSelection || uploading}
              className="flex-1 py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #D946EF 0%, #3B82F6 100%)',
                boxShadow: hasSelection && !uploading ? '0 6px 20px rgba(168, 85, 247, 0.4)' : 'none',
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Media</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
