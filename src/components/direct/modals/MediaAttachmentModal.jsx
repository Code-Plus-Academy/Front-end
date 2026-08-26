import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, Upload, AlertCircle, Loader2, Play } from 'lucide-react';

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
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
      setError('Please select an image or video file.');
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setError(null);

    try {
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
        width: uploadData.width || 640,
        height: uploadData.height || 480,
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

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 flex flex-col max-h-[88dvh] overflow-y-auto"
        style={{
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
          color: isDark ? '#F1F5F9' : '#0F172A',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-sky-500/20 text-sky-400 flex-shrink-0">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Send Photos & Videos</h3>
              <p className="text-xs opacity-60">High-resolution media up to 50MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} />
          </button>
        </div>

        {/* Picker / Preview Container */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-sky-500 hover:bg-sky-500/5 mb-4 flex-1 min-h-[200px]"
            style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }}
          >
            <Upload size={36} className="text-sky-400 mb-3" />
            <p className="text-sm font-semibold mb-1">Choose Photo or Video</p>
            <p className="text-xs opacity-50">JPEG, PNG, WebP, MP4, WebM</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden mb-4 flex items-center justify-center bg-black/40 border border-white/10 max-h-[300px]">
            {isVideo ? (
              <video
                src={previewUrl}
                controls
                playsInline
                className="max-h-[300px] w-auto max-w-full rounded-2xl object-contain"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-[300px] w-auto max-w-full rounded-2xl object-contain"
              />
            )}
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={uploading}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors shadow-md"
              title="Remove media"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Caption */}
        <div className="mb-4">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption…"
            disabled={uploading}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDark ? '#F1F5F9' : '#0F172A',
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${themeAccent}, #6D28D9)`,
              boxShadow: file && !uploading ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none',
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading…</span>
              </>
            ) : (
              <span>Send Media</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
