'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Camera,
  Code2,
  BarChart2,
  ChevronRight,
  Play,
} from 'lucide-react';

export default function AttachmentPickerModal({
  isOpen,
  onClose,
  onSelectOption,
  isDark = true,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const ATTACHMENT_OPTIONS = [
    {
      id: 'document',
      title: 'Document',
      description: 'PDF, Word, Excel, ZIP',
      badge: 'Up to 25MB',
      icon: FileText,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100/80 dark:bg-purple-950/50',
      cardBg: isDark
        ? 'bg-purple-950/10 hover:bg-purple-950/25 border-purple-900/30 hover:border-purple-800/50'
        : 'bg-purple-50/20 hover:bg-purple-50/60 border-purple-100/80 hover:border-purple-200',
      badgeStyle: isDark
        ? 'bg-purple-950/40 text-purple-300 border-purple-800/40'
        : 'bg-purple-50 text-purple-600 border-purple-200/70',
    },
    {
      id: 'media',
      title: 'Photos & Videos',
      description: 'JPG, PNG, WebP, MP4',
      badge: 'Up to 50MB',
      icon: ImageIcon,
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100/80 dark:bg-sky-950/50',
      cardBg: isDark
        ? 'bg-sky-950/10 hover:bg-sky-950/25 border-sky-900/30 hover:border-sky-800/50'
        : 'bg-sky-50/20 hover:bg-sky-50/60 border-sky-100/80 hover:border-sky-200',
      badgeStyle: isDark
        ? 'bg-sky-950/40 text-sky-300 border-sky-800/40'
        : 'bg-sky-50 text-sky-600 border-sky-200/70',
    },
    {
      id: 'camera',
      title: 'Camera',
      description: 'Take a photo or record a video',
      badge: null,
      icon: Camera,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100/80 dark:bg-rose-950/50',
      cardBg: isDark
        ? 'bg-rose-950/10 hover:bg-rose-950/25 border-rose-900/30 hover:border-rose-800/50'
        : 'bg-rose-50/20 hover:bg-rose-50/60 border-rose-100/80 hover:border-rose-200',
      badgeStyle: null,
    },
    {
      id: 'code',
      title: 'Code Snippet',
      description: 'Share syntax-highlighted code',
      badge: null,
      icon: Code2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100/80 dark:bg-emerald-950/50',
      cardBg: isDark
        ? 'bg-emerald-950/10 hover:bg-emerald-950/25 border-emerald-900/30 hover:border-emerald-800/50'
        : 'bg-emerald-50/20 hover:bg-emerald-50/60 border-emerald-100/80 hover:border-emerald-200',
      badgeStyle: null,
    },
    {
      id: 'poll',
      title: 'Poll / Quiz',
      description: 'Create an interactive poll or quiz',
      badge: null,
      icon: BarChart2,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100/80 dark:bg-amber-950/50',
      cardBg: isDark
        ? 'bg-amber-950/10 hover:bg-amber-950/25 border-amber-900/30 hover:border-amber-800/50'
        : 'bg-amber-50/20 hover:bg-amber-50/60 border-amber-100/80 hover:border-amber-200',
      badgeStyle: null,
    },
  ];

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
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full sm:max-w-[440px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto"
          style={{
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
            color: isDark ? '#F1F5F9' : '#0F172A',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.45)',
            paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle for Mobile View */}
          <div className="pt-3 pb-1 flex justify-center sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Glowing Paperclip Circle Badge */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                  <Paperclip size={22} strokeWidth={2.3} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight leading-tight">
                    Attach Attachment
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    Choose what you want to attach ✨
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center flex-shrink-0"
              >
                <X size={17} />
              </button>
            </div>

            {/* List of 5 Attachment Cards */}
            <div className="flex flex-col gap-2.5 pt-1">
              {ATTACHMENT_OPTIONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      onSelectOption(item.id);
                    }}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer ${item.cardBg}`}
                  >
                    {/* Left Icon + Text */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Colored Square Icon Badge */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${item.iconBg} ${item.iconColor}`}
                      >
                        <IconComponent size={22} strokeWidth={2.1} />
                      </div>

                      {/* Title + Subtitle & Badge */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {item.title}
                        </h4>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {item.description}
                          </span>

                          {item.badge && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 dark:text-slate-600 text-xs leading-none">
                                •
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.badgeStyle}`}
                              >
                                {item.badge}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Chevron */}
                    <div className="text-slate-400 dark:text-slate-500 flex-shrink-0 pl-1">
                      <ChevronRight size={18} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
