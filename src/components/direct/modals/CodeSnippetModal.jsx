import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Code2,
  Check,
  AlertCircle,
  FileText,
  ChevronDown,
  Copy,
  CheckCheck,
  Info,
  Lightbulb,
  Send,
} from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', badge: 'JS', badgeBg: 'bg-amber-400 text-black font-extrabold' },
  { id: 'typescript', label: 'TypeScript', badge: 'TS', badgeBg: 'bg-blue-600 text-white font-bold' },
  { id: 'python', label: 'Python', badge: 'PY', badgeBg: 'bg-sky-600 text-amber-300 font-bold' },
  { id: 'html', label: 'HTML / CSS', badge: 'HTML', badgeBg: 'bg-orange-500 text-white font-bold' },
  { id: 'sql', label: 'SQL', badge: 'SQL', badgeBg: 'bg-cyan-600 text-white font-bold' },
  { id: 'java', label: 'Java', badge: 'JAVA', badgeBg: 'bg-red-500 text-white font-bold' },
  { id: 'cpp', label: 'C++', badge: 'C++', badgeBg: 'bg-blue-700 text-white font-bold' },
  { id: 'csharp', label: 'C#', badge: 'C#', badgeBg: 'bg-purple-600 text-white font-bold' },
  { id: 'go', label: 'Go', badge: 'GO', badgeBg: 'bg-sky-500 text-white font-bold' },
  { id: 'rust', label: 'Rust', badge: 'RS', badgeBg: 'bg-orange-800 text-white font-bold' },
  { id: 'json', label: 'JSON', badge: '{ }', badgeBg: 'bg-emerald-600 text-white font-bold' },
  { id: 'bash', label: 'Bash / Shell', badge: '$_', badgeBg: 'bg-slate-700 text-white font-bold' },
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
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const langMenuRef = useRef(null);
  const textareaRef = useRef(null);
  const lineGutterRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setCode('');
      setError(null);
      setShowLangMenu(false);
      setCopied(false);
    }
  }, [isOpen]);

  // Click outside to close language popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLangMenu]);

  // Sync line numbers scroll with textarea
  const handleScroll = (e) => {
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  if (!isOpen || !mounted) return null;

  const currentLang = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];
  const lines = code ? code.split('\n') : [''];
  const lineCount = lines.length;

  const handleKeyDown = (e) => {
    // Enable Tab indentation inside code textarea (2 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newCode = value.substring(0, start) + '  ' + value.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    onSend(payload, title.trim() ? `Shared code: ${title.trim()}` : `Shared a ${currentLang.label} snippet`);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150 flex flex-col max-h-[92dvh] overflow-y-auto"
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
              <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-200/70 dark:border-emerald-900/40 shadow-xs">
                <Code2 size={22} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  Share Code Snippet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  Syntax-highlighted code with 1-click copy ✨
                </p>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Language Field */}
            <div className="relative" ref={langMenuRef}>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Language
              </label>
              <button
                type="button"
                onClick={() => setShowLangMenu((prev) => !prev)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-600/40 bg-white dark:bg-slate-900/60 flex items-center justify-between transition-all hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center shadow-2xs ${currentLang.badgeBg}`}
                  >
                    {currentLang.badge}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {currentLang.label}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-purple-600 dark:text-purple-400 transition-transform ${
                    showLangMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Language Dropdown Menu */}
              {showLangMenu && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 animate-in fade-in zoom-in-95 duration-100">
                  {LANGUAGES.map((l) => {
                    const isSelected = l.id === language;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setLanguage(l.id);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center shadow-2xs ${l.badgeBg}`}
                          >
                            {l.badge}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isSelected
                                ? 'text-purple-600 dark:text-purple-300'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {l.label}
                          </span>
                        </div>
                        {isSelected && <Check size={14} className="text-purple-600 dark:text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filename or Title (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Filename or Title (optional)
              </label>
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-3.5 py-3 flex items-center gap-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <FileText size={17} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. authMiddleware.js"
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 font-normal"
                />
              </div>
            </div>

            {/* Code Editor Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Code
                </label>
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <span>
                    {lineCount} line{lineCount !== 1 ? 's' : ''} (Tab = 2 spaces)
                  </span>
                  <Info size={13} className="opacity-75" />
                </div>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#0c1222] overflow-hidden flex min-h-[190px] focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                {/* Line Numbers Gutter */}
                <div
                  ref={lineGutterRef}
                  className="w-10 py-3.5 text-center text-xs font-mono text-slate-400/80 border-r border-slate-200/70 dark:border-white/10 select-none bg-slate-100/50 dark:bg-white/[0.02] flex flex-col overflow-hidden leading-relaxed"
                >
                  {lines.map((_, i) => (
                    <div key={i} className="leading-relaxed">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Editor Textarea */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  rows={7}
                  placeholder={`// Paste your ${currentLang.label.toLowerCase()} code here..`}
                  className="p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 bg-transparent outline-none resize-none leading-relaxed flex-1 w-full"
                  style={{
                    tabSize: 2,
                    maxHeight: '260px',
                  }}
                />

                {/* Floating Copy Button */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  disabled={!code.trim()}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-purple-200/80 dark:border-purple-700/50 text-purple-600 dark:text-purple-300 shadow-2xs flex items-center gap-1.5 text-xs font-semibold hover:bg-purple-50 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed z-10"
                >
                  {copied ? (
                    <>
                      <CheckCheck size={13} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-2.5 rounded-xl">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Tip Card (Matches Reference Image) */}
            <div className="rounded-2xl p-3.5 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100/70 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-200/60 dark:border-purple-800/40 shadow-2xs">
                <Lightbulb size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 leading-tight">Tip</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-normal">
                  Your code will be formatted and highlighted for better readability.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!code.trim()}
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                  boxShadow: code.trim() ? '0 6px 20px rgba(124, 58, 237, 0.35)' : 'none',
                }}
              >
                <Send size={15} />
                <span>Send Snippet</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
