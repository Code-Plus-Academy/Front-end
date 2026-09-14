import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  UploadCloud,
  AlertCircle,
  Loader2,
  Send,
  MoreVertical,
  Info,
  RotateCcw,
  MessageSquare,
  File,
  Check,
} from 'lucide-react';

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

// Sample recent documents matching the design
const RECENT_DOCS = [
  {
    id: 'recent-1',
    name: 'Lecture Notes.pdf',
    size: 2.4 * 1024 * 1024,
    type: 'pdf',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
    typeLabel: 'PDF',
  },
  {
    id: 'recent-2',
    name: 'Assignment.docx',
    size: 1.2 * 1024 * 1024,
    type: 'docx',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    typeLabel: 'DOCX',
  },
  {
    id: 'recent-3',
    name: 'Project Report.xlsx',
    size: 3.1 * 1024 * 1024,
    type: 'xlsx',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
    typeLabel: 'XLSX',
  },
];

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
  const [isDragging, setIsDragging] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const validateAndSetFile = (selected) => {
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

  const handleSelectRecent = (recentDoc) => {
    // Construct a lightweight File object from recent document metadata
    const blob = new Blob([`Sample document content for ${recentDoc.name}`], {
      type: recentDoc.type === 'pdf' ? 'application/pdf' : 'application/octet-stream',
    });
    const fakeFile = new File([blob], recentDoc.name, {
      type: recentDoc.type === 'pdf' ? 'application/pdf' : 'application/octet-stream',
      lastModified: Date.now(),
    });
    Object.defineProperty(fakeFile, 'size', { value: recentDoc.size });
    setFile(fakeFile);
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-[460px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150"
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
              {/* Document Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-purple-100/80 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 shadow-xs">
                <FileText size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  Attach Document
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  PDF, Word, Excel, ZIP (up to 25MB)
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
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Dropzone or Selected File Card */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full rounded-2xl border-2 border-dashed p-6 sm:p-7 flex flex-col items-center justify-center cursor-pointer text-center transition-all select-none ${
                isDragging
                  ? 'border-purple-500 bg-purple-100/50 dark:bg-purple-900/30 scale-[0.99]'
                  : 'border-purple-300/80 dark:border-purple-500/40 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-400 hover:bg-purple-50/70 dark:hover:bg-purple-950/30'
              }`}
            >
              {/* Cloud Upload Icon Badge */}
              <div className="w-14 h-14 rounded-full bg-purple-100/80 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <UploadCloud size={28} strokeWidth={2.1} />
              </div>

              {/* Title & Browse */}
              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                Drag & drop your file here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                or{' '}
                <span className="text-purple-600 dark:text-purple-400 font-semibold underline underline-offset-2 hover:opacity-80">
                  browse files
                </span>
              </p>

              {/* Divider with Supports */}
              <div className="relative w-full max-w-[220px] my-3.5 flex items-center justify-center">
                <div className="w-full border-t border-purple-200/80 dark:border-purple-800/40 absolute" />
                <span className="bg-purple-50 dark:bg-[#131926] px-2 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider relative z-10">
                  Supports
                </span>
              </div>

              {/* Format Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {/* PDF */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[11px] font-bold shadow-2xs">
                  <span className="w-4 h-4 rounded flex items-center justify-center bg-rose-500 text-white text-[9px] font-black">
                    P
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">PDF</span>
                </div>

                {/* DOCX */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[11px] font-bold shadow-2xs">
                  <span className="w-4 h-4 rounded flex items-center justify-center bg-blue-600 text-white text-[9px] font-black">
                    W
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">DOCX</span>
                </div>

                {/* XLSX */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[11px] font-bold shadow-2xs">
                  <span className="w-4 h-4 rounded flex items-center justify-center bg-emerald-600 text-white text-[9px] font-black">
                    X
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">XLSX</span>
                </div>

                {/* TXT */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[11px] font-bold shadow-2xs">
                  <span className="w-4 h-4 rounded flex items-center justify-center bg-amber-500 text-white text-[9px] font-black">
                    T
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">TXT</span>
                </div>

                {/* ZIP */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[11px] font-bold shadow-2xs">
                  <span className="w-4 h-4 rounded flex items-center justify-center bg-purple-600 text-white text-[9px] font-black">
                    Z
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">ZIP</span>
                </div>
              </div>

              {/* Max file size note */}
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 font-medium">
                <Info size={13} />
                <span>Max file size: 25MB</span>
              </div>
            </div>
          ) : (
            /* Selected File Display */
            <div
              className="rounded-2xl p-4 flex items-center justify-between border transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow-xs">
                  {file.name.split('.').pop()?.slice(0, 4) || 'DOC'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(file.size)} • {file.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={uploading}
                className="p-1.5 rounded-full hover:bg-rose-500/20 text-rose-500 transition-colors ml-2 flex-shrink-0"
                title="Remove file"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Recent Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Recent Documents
              </span>
              <button
                type="button"
                onClick={() => setShowAllRecent(!showAllRecent)}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                {showAllRecent ? 'Show less' : 'See all'}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
              {RECENT_DOCS.slice(0, showAllRecent ? RECENT_DOCS.length : 3).map((doc) => {
                const isSelected = file?.name === doc.name;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectRecent(doc)}
                    className={`p-3 sm:p-3.5 flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/80 dark:bg-purple-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Document Icon Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${doc.badgeBg}`}
                      >
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatBytes(doc.size)} • {doc.typeLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pl-2">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check size={13} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRecent(doc);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-2.5 rounded-xl">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Optional Caption Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Add a caption (optional)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {caption.length}/200
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] px-3.5 py-2.5 flex items-center gap-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
              <MessageSquare size={16} className="text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                placeholder="e.g. Here are the lecture notes"
                disabled={uploading}
                className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-normal"
              />
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
              disabled={!file || uploading}
              className="flex-1 py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                boxShadow: file && !uploading ? '0 6px 20px rgba(99, 102, 241, 0.4)' : 'none',
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading…</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Document</span>
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
