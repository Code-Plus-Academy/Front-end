import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Upload, AlertCircle, Loader2 } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'csv'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function DocumentAttachmentModal({
  isOpen,
  onClose,
  onSend,
  isDark = true,
  themeAccent = '#7C3AED',
}) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File type .${ext} is not supported. Please choose a PDF, Word, Excel, PPT, TXT, or ZIP.`);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds 25MB limit (${formatBytes(selected.size)}).`);
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
      formData.append('resource_type', 'raw');

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
      const ext = file.name.split('.').pop()?.toLowerCase() || 'file';

      const attachmentPayload = {
        type: 'document',
        file_name: file.name,
        file_size: file.size,
        file_extension: ext,
        url: permanentUrl,
        caption: caption.trim() || null,
      };

      onSend(attachmentPayload, caption.trim() || `Shared document: ${file.name}`);
      onClose();
    } catch (err) {
      console.error('Document upload error:', err);
      setError(err.message || 'Failed to upload document');
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
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88dvh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150"
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
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-indigo-500/20 text-indigo-400 flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Attach Document</h3>
              <p className="text-xs opacity-60">PDF, Word, Excel, ZIP (up to 25MB)</p>
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

        {/* File Drop / Select Area */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl p-7 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-indigo-500 hover:bg-indigo-500/5 mb-4"
            style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }}
          >
            <Upload size={32} className="text-indigo-400 mb-2.5" />
            <p className="text-sm font-semibold mb-1">Click to select document</p>
            <p className="text-xs opacity-50">PDF, DOCX, XLSX, TXT, ZIP</p>
          </div>
        ) : (
          <div
            className="rounded-2xl p-4 flex items-center justify-between mb-4"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {file.name.split('.').pop()?.slice(0, 4) || 'DOC'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{file.name}</p>
                <p className="text-xs opacity-60">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={uploading}
              className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400 transition-colors ml-2"
              title="Remove file"
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

        {/* Optional Caption */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5 opacity-75">Add a caption (optional)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Here are the lecture notes"
            disabled={uploading}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              color: isDark ? '#F1F5F9' : '#0F172A',
            }}
          />
        </div>

        {/* Action Buttons */}
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
              <span>Send Document</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
