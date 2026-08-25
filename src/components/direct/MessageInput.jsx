'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  FileText,
  Image as ImageIcon,
  Camera,
  Code2,
  BarChart2,
  X,
  Reply,
} from 'lucide-react';
import WhatsAppEmojiPicker from './WhatsAppEmojiPicker';

function extractFirstUrl(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)|(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/i);
  if (!match) return null;
  let url = match[0].trim();
  if (url.startsWith('www.')) url = 'https://' + url;
  return url;
}

const inputUrlCache = new Map();

export default function MessageInput({
  onSend,
  onSelectSticker,
  onSelectGif,
  onSendMediaFile,
  disabled = false,
  placeholder = 'Type a message',
  isDark = true,
  themeAccent = '#6e00ff',
  replyingTo = null,
  onCancelReply = () => {},
}) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [livePreview, setLivePreview] = useState(null);
  const [dismissedUrl, setDismissedUrl] = useState(null);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Process image files from Gboard, iOS, or clipboard
  const processImageFile = useCallback((file) => {
    if (!file) return;
    const isGif = file.type === 'image/gif' || file.name?.toLowerCase().endsWith('.gif');
    const isSticker = file.type === 'image/webp' || file.type === 'image/png';

    if (onSendMediaFile) {
      onSendMediaFile(file, isGif ? 'gif' : 'sticker', replyingTo);
    } else if (isGif && onSelectGif) {
      const blobUrl = URL.createObjectURL(file);
      onSelectGif({
        content_type: 'gif',
        url: blobUrl,
        title: file.name || 'Gboard GIF',
        width: 400,
        height: 300,
        aspect_ratio: 1.33,
      });
    } else if (onSelectSticker) {
      const blobUrl = URL.createObjectURL(file);
      onSelectSticker({
        content_type: 'sticker',
        url: blobUrl,
        alt: file.name || 'Gboard Sticker',
        width: 256,
        height: 256,
      });
    }
  }, [onSendMediaFile, onSelectGif, onSelectSticker, replyingTo]);

  // Intercept Gboard DOM <img> injections in contenteditable container
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'IMG') {
            const src = node.getAttribute('src') || node.src;
            node.remove(); // Clean from text field

            if (src) {
              if (src.startsWith('data:') || src.startsWith('blob:')) {
                fetch(src)
                  .then((r) => r.blob())
                  .then((blob) => {
                    const isGif = blob.type === 'image/gif' || src.includes('image/gif');
                    const file = new File([blob], isGif ? 'gboard.gif' : 'gboard.webp', { type: blob.type || 'image/webp' });
                    processImageFile(file);
                  })
                  .catch(() => {});
              } else if (src.startsWith('http')) {
                const isGif = src.includes('.gif') || src.includes('giphy') || src.includes('tenor');
                if (isGif && onSelectGif) {
                  onSelectGif({
                    content_type: 'gif',
                    url: src,
                    title: 'Gboard GIF',
                    width: 400,
                    height: 300,
                    aspect_ratio: 1.33,
                  });
                } else if (onSelectSticker) {
                  onSelectSticker({
                    content_type: 'sticker',
                    url: src,
                    alt: 'Gboard Sticker',
                    width: 256,
                    height: 256,
                  });
                }
              }
            }
          }
        }
      }
    });

    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [processImageFile, onSelectGif, onSelectSticker]);

  // Handle native keyboard (Gboard, iOS) sticker / GIF file paste
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) processImageFile(file);
        return;
      }
    }
  };

  // Handle beforeinput for Android Gboard rich content insertion
  const handleBeforeInput = (e) => {
    if (e.dataTransfer?.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) processImageFile(file);
          return;
        }
      }
    }
  };

  const handleInput = (e) => {
    const content = e.currentTarget.innerText || '';
    const normalized = content.replace(/\r\n/g, '\n').replace(/\n$/, '');
    setText(normalized);
  };

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Live URL preview watcher (WhatsApp style)
  useEffect(() => {
    const detectedUrl = extractFirstUrl(text);
    if (!detectedUrl || detectedUrl === dismissedUrl) {
      setLivePreview(null);
      return;
    }

    if (inputUrlCache.has(detectedUrl)) {
      setLivePreview(inputUrlCache.get(detectedUrl));
      return;
    }

    const timer = setTimeout(() => {
      fetch('/api/meta/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: detectedUrl }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.success && res?.data) {
            inputUrlCache.set(detectedUrl, res.data);
            setLivePreview(res.data);
          } else {
            inputUrlCache.set(detectedUrl, null);
          }
        })
        .catch(() => {
          inputUrlCache.set(detectedUrl, null);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [text, dismissedUrl]);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest('[data-action="toggle-emoji"]')
      ) {
        setShowEmojiPicker(false);
      }
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target) &&
        !e.target.closest('[data-action="toggle-attach"]')
      ) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;

    const messageToSend = text.trim();
    setText('');
    if (inputRef.current) {
      inputRef.current.innerText = '';
    }
    setLivePreview(null);
    setDismissedUrl(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    if (onSend) {
      onSend(messageToSend, livePreview, replyingTo);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    if (!el) {
      setText((prev) => prev + emoji);
      return;
    }
    el.focus();
    if (typeof document !== 'undefined' && document.queryCommandSupported?.('insertText')) {
      document.execCommand('insertText', false, emoji);
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        el.innerText += emoji;
      }
    }
    const normalized = (el.innerText || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
    setText(normalized);
  };

  const handleAttachOption = (type) => {
    setShowAttachMenu(false);
    if (type === 'code') {
      const codeSnippet = '```javascript\n\n```';
      if (inputRef.current) {
        inputRef.current.innerText = inputRef.current.innerText ? `${inputRef.current.innerText}\n${codeSnippet}` : codeSnippet;
      }
      setText((prev) => (prev ? `${prev}\n${codeSnippet}` : codeSnippet));
    }
  };

  const [viewportBottomOffset, setViewportBottomOffset] = useState(0);

  // Mobile virtual keyboard visualViewport auto-docking
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      setViewportBottomOffset(keyboardHeight > 60 ? keyboardHeight : 0);
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  const isTextEmpty = !text.trim();

  return (
    <div
      ref={containerRef}
      className="message-input-container w-full sticky bottom-0 z-20 flex flex-col box-border px-3 sm:px-4 pt-2 pb-[calc(max(env(safe-area-inset-bottom,0px),16px)+10px)] sm:pb-3.5"
      style={{
        bottom: viewportBottomOffset > 0 ? `${viewportBottomOffset}px` : '0px',
        transition: 'bottom 0.12s ease-out',
        background: isDark
          ? 'linear-gradient(180deg, rgba(15, 20, 25, 0) 0%, rgba(15, 20, 25, 0.88) 30%, rgba(15, 20, 25, 0.98) 100%)'
          : 'linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, rgba(248, 250, 252, 0.88) 30%, rgba(248, 250, 252, 0.98) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <style>{`
        .cpa-rich-input:empty:before {
          content: attr(data-placeholder);
          color: ${isDark ? '#94a3b8' : '#94a3b8'};
          pointer-events: none;
          display: block;
        }
        .cpa-rich-input:focus {
          outline: none;
        }
      `}</style>

      {/* ── 1. Floating WhatsApp-Style Replying To Preview Card ─────────────── */}
      {replyingTo && (
        <div
          className="whatsapp-reply-preview-bar flex items-center justify-between gap-3 mb-1.5 px-3.5 py-2 rounded-2xl mx-1 animate-in slide-in-from-bottom-2 duration-150"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(241, 245, 249, 0.98)',
            borderLeft: `4px solid ${themeAccent}`,
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Reply size={15} style={{ color: themeAccent, flexShrink: 0 }} />
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="font-bold text-[11.5px] truncate leading-tight"
                style={{ color: themeAccent }}
              >
                Replying to {replyingTo.sender_name || (replyingTo.sender_username ? `@${replyingTo.sender_username}` : 'User')}
              </span>
              <span
                className="text-xs truncate leading-tight mt-0.5 opacity-80"
                style={{ color: isDark ? '#cbd5e1' : '#475569' }}
              >
                {replyingTo.body || (replyingTo.content_attachment?.title ? `Shared: ${replyingTo.content_attachment.title}` : 'Attachment')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 2. Floating WhatsApp-Style URL Live Preview Card ────────────────── */}
      {livePreview && (
        <div
          className="whatsapp-input-preview-bar flex items-center justify-between gap-3 mb-1.5 px-3 py-2 rounded-2xl mx-1"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(241, 245, 249, 0.98)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <span
              className="font-bold text-xs truncate"
              style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
            >
              {livePreview.title || livePreview.domain}
            </span>
            <span
              className="text-[11px] truncate opacity-70"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              {livePreview.description || livePreview.url}
            </span>
            <span
              className="text-[10px] font-mono opacity-80 truncate"
              style={{ color: '#38bdf8' }}
            >
              {livePreview.domain}
            </span>
          </div>

          {livePreview.image && (
            <img
              src={livePreview.image}
              alt=""
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              style={{ border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)' }}
            />
          )}

          <button
            type="button"
            onClick={() => {
              const detected = extractFirstUrl(text);
              setDismissedUrl(detected);
              setLivePreview(null);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Dismiss preview"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── 2. Floating Attachment Menu ────────────────────────────────────── */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="whatsapp-attach-menu absolute bottom-16 left-3 z-30 flex flex-col gap-1 p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
            minWidth: '210px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          }}
        >
          <button
            type="button"
            onClick={() => handleAttachOption('document')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors text-left"
            style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
              <FileText size={16} />
            </div>
            <span>Document</span>
          </button>

          <button
            type="button"
            onClick={() => handleAttachOption('media')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors text-left"
            style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sky-500/20 text-sky-400">
              <ImageIcon size={16} />
            </div>
            <span>Photos & Videos</span>
          </button>

          <button
            type="button"
            onClick={() => handleAttachOption('camera')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors text-left"
            style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400">
              <Camera size={16} />
            </div>
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => handleAttachOption('code')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors text-left"
            style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400">
              <Code2 size={16} />
            </div>
            <span>Code Snippet</span>
          </button>

          <button
            type="button"
            onClick={() => handleAttachOption('poll')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors text-left"
            style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400">
              <BarChart2 size={16} />
            </div>
            <span>Poll / Quiz</span>
          </button>
        </div>
      )}

      {/* ── 3. WhatsApp Complete Emoji Picker Modal ──────────────────────── */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="whatsapp-emoji-picker-container absolute bottom-16 left-2 sm:left-4 z-40"
        >
          <WhatsAppEmojiPicker
            onSelectEmoji={insertEmoji}
            onSelectSticker={(sticker) => {
              setShowEmojiPicker(false);
              if (onSelectSticker) onSelectSticker(sticker);
            }}
            onSelectGif={(gif) => {
              setShowEmojiPicker(false);
              if (onSelectGif) onSelectGif(gif);
            }}
            isDark={isDark}
            themeAccent={themeAccent}
          />
        </div>
      )}

      {/* ── 4. Main Floating Curved WhatsApp Input Bar ─────────────────────── */}
      <form
        onSubmit={handleSend}
        className="whatsapp-floating-bar flex items-end gap-2 w-full"
      >
        {/* Left Curved Pill Capsule */}
        <div
          className="flex-1 flex items-end rounded-[26px] px-2 py-1.5 transition-all shadow-lg"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.95)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Emoji / Sticker Button (Inside Pill) */}
          <button
            type="button"
            data-action="toggle-emoji"
            aria-label="Emojis, GIFs, Stickers"
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowAttachMenu(false);
            }}
            disabled={disabled}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-gray-200 self-end mb-0.5"
            title="Insert emoji, GIF or sticker"
          >
            <svg viewBox="0 0 24 24" height="22" width="22" preserveAspectRatio="xMidYMid meet" fill="currentColor">
              <path fill="currentColor" d="M8.5 10.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8.5-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              <path fill="currentColor" fillRule="evenodd" d="M16.82 19.98A6.97 6.97 0 0 1 12 22H9.27A7.27 7.27 0 0 1 2 14.73V9.27A7.27 7.27 0 0 1 9.27 2h5.46A7.27 7.27 0 0 1 22 9.27v2.54c0 1.94-.77 3.8-2.15 5.17l-3.03 3ZM14.72 4H9.28A5.27 5.27 0 0 0 4 9.27v5.46A5.27 5.27 0 0 0 9.27 20h2.06a.9.9 0 0 0 .68-.88l-.02-2.26v-.11a5.5 5.5 0 0 1-4.65-2.6.6.6 0 0 1 .03-.6c.12-.2.3-.3.53-.3h5.7a4.8 4.8 0 0 1 3.22-1.23l2.26.01c.5 0 .9-.4.9-.9V9.07H20A5.27 5.27 0 0 0 14.73 4Zm-.71 15.11c0 .15-.01.3-.04.44a4.96 4.96 0 0 0 1.44-.99l3.03-3c.46-.46.83-.99 1.09-1.56-.15.02-.3.03-.46.03h-2.26A2.8 2.8 0 0 0 14 16.84l.02 2.26Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Rich ContentEditable Input for Native Android Gboard GIF/Sticker Insertion */}
          <div
            ref={inputRef}
            contentEditable={!disabled}
            role="textbox"
            aria-multiline="true"
            data-placeholder={disabled ? 'Cannot send messages' : placeholder}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBeforeInput={handleBeforeInput}
            className="cpa-rich-input flex-1 bg-transparent outline-none border-none text-[14px] leading-snug overflow-y-auto px-2 py-1 select-text"
            style={{
              color: isDark ? '#f8fafc' : '#0f172a',
              maxHeight: '128px',
              minHeight: '26px',
              fontFamily: 'inherit',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          />

          {/* Plus / Attach Button (Inside Pill) */}
          <button
            type="button"
            data-action="toggle-attach"
            aria-label="Attach"
            onClick={() => {
              setShowAttachMenu((prev) => !prev);
              setShowEmojiPicker(false);
            }}
            disabled={disabled}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-gray-200 self-end mb-0.5"
            title="Attach file, photo or code"
          >
            <svg viewBox="0 0 24 24" height="22" width="22" preserveAspectRatio="xMidYMid meet" fill="none">
              <path fill="currentColor" d="M11 13H5.5a1 1 0 1 1 0-2H11V5.5a1 1 0 1 1 2 0V11h5.5a1 1 0 1 1 0 2H13v5.5a1 1 0 1 1-2 0V13Z" />
            </svg>
          </button>
        </div>

        {/* Right Standalone Circular Floating Action Button (Mic / Send) */}
        <button
          type="submit"
          disabled={isTextEmpty || disabled}
          aria-label={isTextEmpty ? 'Voice message' : 'Send message'}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0 shadow-lg"
          style={{
            backgroundColor: isTextEmpty
              ? (isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.95)')
              : (themeAccent || '#6e00ff'),
            color: isTextEmpty
              ? (isDark ? '#94a3b8' : '#64748b')
              : '#ffffff',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: isTextEmpty
              ? '0 2px 10px rgba(0,0,0,0.15)'
              : `0 4px 16px ${themeAccent ? `${themeAccent}66` : 'rgba(110, 0, 255, 0.45)'}`,
            cursor: isTextEmpty || disabled ? 'default' : 'pointer',
          }}
        >
          {isTextEmpty ? (
            <svg viewBox="0 0 24 24" height="22" width="22" preserveAspectRatio="xMidYMid meet" fill="currentColor">
              <path fill="currentColor" d="M12 14a2.9 2.9 0 0 1-2.13-.88A2.9 2.9 0 0 1 9 11V5c0-.83.3-1.54.88-2.13A2.9 2.9 0 0 1 12 2c.83 0 1.54.3 2.13.88.58.58.87 1.29.87 2.12v6c0 .83-.3 1.54-.88 2.13A2.9 2.9 0 0 1 12 14Zm0 7a1 1 0 0 1-1-1v-2.07a6.66 6.66 0 0 1-4.3-2.33A6.79 6.79 0 0 1 5.06 12c-.07-.55.39-1 .94-1 .55 0 .99.45 1.09 1a4.8 4.8 0 0 0 1.37 2.54A4.82 4.82 0 0 0 12 16c1.38 0 2.56-.49 3.54-1.46a4.8 4.8 0 0 0 1.37-2.55c.1-.54.54-.99 1.09-.99s1 .45.94 1a6.8 6.8 0 0 1-1.64 3.6 6.66 6.66 0 0 1-4.3 2.33V20a1 1 0 0 1-1 1Zm0-9c.28 0 .52-.1.71-.29.2-.19.29-.43.29-.71V5c0-.28-.1-.52-.29-.71A.97.97 0 0 0 12 4c-.28 0-.52.1-.71.29A.94.94 0 0 0 11 5v6c0 .28.1.52.29.71.19.2.43.29.71.29Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" height="20" width="20" preserveAspectRatio="xMidYMid meet" fill="currentColor" style={{ transform: 'translateX(1px)' }}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
