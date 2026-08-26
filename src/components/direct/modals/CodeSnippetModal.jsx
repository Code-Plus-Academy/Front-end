import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Code2, Check, AlertCircle } from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML / CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'json', label: 'JSON' },
  { id: 'bash', label: 'Bash / Shell' },
];

export default function CodeSnippetModal({
  isOpen,
  onClose,
  onSend,
  isDark = true,
  themeAccent = '#7C3AED',
}) {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleKeyDown = (e) => {
    // Enable Tab indentation inside code textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      setCode(value.substring(0, start) + '  ' + value.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please paste or write your code snippet.');
      return;
    }

    const payload = {
      type: 'code_snippet',
      language,
      title: title.trim() || null,
      code: code.trim(),
    };

    onSend(payload, title.trim() ? `Shared code: ${title.trim()}` : `Shared a ${language} snippet`);
    onClose();
  };

  const lineCount = code ? code.split('\n').length : 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 flex flex-col max-h-[88dvh] overflow-y-auto"
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
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <Code2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Share Code Snippet</h3>
              <p className="text-xs opacity-60">Syntax-highlighted code with 1-click copy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Language Picker */}
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-75">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium outline-none transition-all cursor-pointer"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDark ? '#F1F5F9' : '#0F172A',
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id} style={{ background: isDark ? '#0F172A' : '#FFFFFF' }}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Title */}
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-75">Filename or Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. authMiddleware.js"
                className="w-full px-3 py-2 rounded-xl text-xs outline-none transition-all"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDark ? '#F1F5F9' : '#0F172A',
                }}
              />
            </div>
          </div>

          {/* Code Textarea with Line Counter Header */}
          <div className="mt-1">
            <div className="flex items-center justify-between px-1 mb-1">
              <label className="text-xs font-semibold opacity-75">Code</label>
              <span className="text-[11px] font-mono opacity-50">{lineCount} line{lineCount !== 1 ? 's' : ''} (Tab = 2 spaces)</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              placeholder={`// Paste your ${language} code here…`}
              className="w-full p-3.5 rounded-2xl text-xs font-mono outline-none resize-none transition-all leading-relaxed"
              style={{
                backgroundColor: isDark ? '#080E1A' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
                color: isDark ? '#38BDF8' : '#0369A1',
                tabSize: 2,
                maxHeight: '220px',
              }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 mt-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${themeAccent}, #6D28D9)`,
                boxShadow: code.trim() ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none',
              }}
            >
              <Check size={14} />
              <span>Send Snippet</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
