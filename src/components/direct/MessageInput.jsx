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
  Paperclip,
  Mic,
  Send,
  Smile,
} from 'lucide-react';
import WhatsAppEmojiPicker from './WhatsAppEmojiPicker';
import DocumentAttachmentModal from './modals/DocumentAttachmentModal';
import MediaAttachmentModal from './modals/MediaAttachmentModal';
import CameraCaptureModal from './modals/CameraCaptureModal';
import CodeSnippetModal from './modals/CodeSnippetModal';
import PollQuizModal from './modals/PollQuizModal';
import AttachmentPickerModal from './AttachmentPickerModal';

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
  onSendAttachment,
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
  const [activeModal, setActiveModal] = useState(null); // 'document' | 'media' | 'camera' | 'code' | 'poll'
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
    setActiveModal(type);
  };

  const handleModalSend = (attachmentPayload, textBody) => {
    setActiveModal(null);
    if (onSendAttachment) {
      onSendAttachment(attachmentPayload, textBody, replyingTo);
    } else if (onSend) {
      onSend(textBody, null, replyingTo, attachmentPayload);
    }
    if (replyingTo && onCancelReply) {
      onCancelReply();
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

      {/* ── 2. Redesigned Attachment Picker Modal ──────────────────────── */}
      <AttachmentPickerModal
        isOpen={showAttachMenu}
        onClose={() => setShowAttachMenu(false)}
        onSelectOption={(option) => {
          setShowAttachMenu(false);
          setActiveModal(option);
        }}
        isDark={isDark}
      />

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
          className="flex-1 flex items-center rounded-full px-3.5 py-1.5 transition-all gap-1.5"
          style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.88)' : '#FFFFFF',
            border: isDark ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: isDark
              ? '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {/* Purple Emoji / Sticker Toggle Button (Inside Pill) */}
          <button
            type="button"
            data-action="toggle-emoji"
            aria-label="Emojis, GIFs, Stickers"
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowAttachMenu(false);
            }}
            disabled={disabled}
            className="p-1 rounded-full hover:bg-purple-500/10 active:scale-95 transition-all text-purple-500 hover:text-purple-400 flex-shrink-0"
            title="Insert emoji, GIF or sticker"
          >
            <Smile size={23} />
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
            className="cpa-rich-input flex-1 bg-transparent outline-none border-none text-[15px] leading-snug overflow-y-auto px-1 py-1.5 select-text"
            style={{
              color: isDark ? '#f8fafc' : '#0f172a',
              maxHeight: '128px',
              minHeight: '26px',
              fontFamily: 'inherit',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          />

          {/* Paperclip / Attachments Menu Button */}
          <button
            type="button"
            data-action="toggle-attach"
            aria-label="Attach"
            onClick={() => {
              setShowAttachMenu((prev) => !prev);
              setShowEmojiPicker(false);
            }}
            disabled={disabled}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-400 hover:text-purple-400 flex-shrink-0"
            title="Attach file, photo or code"
          >
            <Paperclip size={20} />
          </button>

          {/* Direct Camera Capture Button */}
          <button
            type="button"
            aria-label="Open Camera"
            onClick={() => {
              setActiveModal('camera');
              setShowAttachMenu(false);
              setShowEmojiPicker(false);
            }}
            disabled={disabled}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-slate-400 hover:text-purple-400 flex-shrink-0"
            title="Take a photo"
          >
            <Camera size={20} />
          </button>
        </div>

        {/* Right Standalone Circular Floating Action Button (Mic / Send) */}
        <button
          type="submit"
          disabled={disabled}
          aria-label={isTextEmpty ? 'Voice message' : 'Send message'}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 18px rgba(139, 92, 246, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {isTextEmpty ? (
            <Mic size={22} className="text-white" />
          ) : (
            <Send size={20} className="text-white translate-x-[1px]" />
          )}
        </button>
      </form>

      {/* ── 5. Attachment Creation Modals ─────────────────────────────────── */}
      <DocumentAttachmentModal
        isOpen={activeModal === 'document'}
        onClose={() => setActiveModal(null)}
        onSend={handleModalSend}
        isDark={isDark}
        themeAccent={themeAccent}
      />
      <MediaAttachmentModal
        isOpen={activeModal === 'media'}
        onClose={() => setActiveModal(null)}
        onSend={handleModalSend}
        isDark={isDark}
        themeAccent={themeAccent}
      />
      <CameraCaptureModal
        isOpen={activeModal === 'camera'}
        onClose={() => setActiveModal(null)}
        onSend={handleModalSend}
        isDark={isDark}
        themeAccent={themeAccent}
      />
      <CodeSnippetModal
        isOpen={activeModal === 'code'}
        onClose={() => setActiveModal(null)}
        onSend={handleModalSend}
        isDark={isDark}
        themeAccent={themeAccent}
      />
      <PollQuizModal
        isOpen={activeModal === 'poll'}
        onClose={() => setActiveModal(null)}
        onSend={handleModalSend}
        isDark={isDark}
        themeAccent={themeAccent}
      />
    </div>
  );
}
