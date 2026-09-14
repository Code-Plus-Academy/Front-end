'use client';

import React, { useState } from 'react';
import {
  X,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';

/**
 * TopNavigation Component
 * Top action bar for Story Editor providing Close, Undo, Redo, Clear Canvas, Download, and Continue/Export.
 * 
 * @param {Object} props
 * @param {() => void} props.onClose
 * @param {() => void} props.onUndo
 * @param {() => void} props.onRedo
 * @param {boolean} [props.canUndo=false]
 * @param {boolean} [props.canRedo=false]
 * @param {() => void} props.onClearCanvas
 * @param {() => void} [props.onDownload]
 * @param {() => void} props.onExport
 * @param {boolean} [props.isExporting=false]
 * @param {string} [props.exportButtonText='Continue']
 * @param {string} [props.className='']
 */
export default function TopNavigation({
  onClose,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClearCanvas,
  onDownload,
  onExport,
  isExporting = false,
  exportButtonText = 'Continue',
  className = '',
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClear = () => {
    if (showClearConfirm) {
      onClearCanvas?.();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 4000);
    }
  };

  return (
    <header
      className={`relative z-40 w-full flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-gray-950/80 dark:bg-black/80 backdrop-blur-xl border-b border-white/10 text-white ${className}`}
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 8px) + 4px)',
      }}
    >
      {/* Left: Close Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isExporting}
          className="p-2 sm:p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-40"
          title="Exit Story Studio"
          aria-label="Exit Story Studio"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-300 tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Story Studio</span>
        </div>
      </div>

      {/* Center: Undo, Redo, Clear Controls */}
      <div className="flex items-center gap-1 sm:gap-2 bg-white/5 rounded-2xl p-1 sm:p-1.5 border border-white/10 shadow-inner">
        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || isExporting}
          className={`p-2 rounded-xl transition-all ${
            canUndo
              ? 'hover:bg-white/10 text-gray-200 hover:text-white active:scale-95'
              : 'text-gray-600 opacity-40 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
          aria-label="Undo action"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo || isExporting}
          className={`p-2 rounded-xl transition-all ${
            canRedo
              ? 'hover:bg-white/10 text-gray-200 hover:text-white active:scale-95'
              : 'text-gray-600 opacity-40 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
          aria-label="Redo action"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/15 mx-0.5" />

        {/* Clear Canvas */}
        <button
          type="button"
          onClick={handleClear}
          disabled={isExporting}
          className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            showClearConfirm
              ? 'bg-red-600 text-white font-bold animate-pulse shadow-md shadow-red-900/40'
              : 'hover:bg-red-500/15 text-gray-400 hover:text-red-400'
          }`}
          title={showClearConfirm ? 'Click again to confirm reset' : 'Clear Canvas'}
          aria-label="Clear Canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {showClearConfirm ? 'Confirm Clear?' : 'Clear'}
          </span>
        </button>
      </div>

      {/* Right: Download & Export / Publish Buttons */}
      <div className="flex items-center gap-2">
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            disabled={isExporting}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-40"
            title="Download crisp 1080x1920 PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        )}

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
            boxShadow: '0 8px 24px -4px rgba(168, 85, 247, 0.45)',
          }}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Exporting…</span>
            </>
          ) : (
            <>
              <span>{exportButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </header>
  );
}
