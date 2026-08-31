'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  MessageCircle,
  X,
  Maximize2,
  ArrowLeft,
  Send,
  Smile,
  MoreHorizontal,
  PenSquare,
  Loader2,
} from 'lucide-react';
import api from '../../api/axios';
import {
  getGraphQLDirectInbox,
  getGraphQLDirectConversation,
  sendGraphQLDirectMessage,
} from '../../api/graphql';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import SharedContentCard from './SharedContentCard';
import StickerMessageCard from './media/StickerMessageCard';
import GifMessageCard from './media/GifMessageCard';
import WhatsAppEmojiPicker from './WhatsAppEmojiPicker';
import { getMessageMediaType } from '../../utils/mediaDetector';
import { saveRecentSticker, saveRecentGif } from '../../utils/s3MediaClient';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function FloatingMessageDock() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname() || '';
  const { unreadMessages } = useNotifications();

  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = useState(false);

  // Modal open / closed & active conversation state
  const [isOpen, setIsOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Active chat state
  const [activeConvData, setActiveConvData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pollRef = useRef(null);
  const pickerContainerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickerContainerRef.current &&
        !pickerContainerRef.current.contains(e.target) &&
        !e.target.closest('[data-action="toggle-dock-picker"]')
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide floating dock if user is directly on /direct or /network (where full chat is active)
  const isDirectRoute = pathname.startsWith('/direct') || pathname.startsWith('/network');

  // Load inbox conversations
  const loadInbox = useCallback(async () => {
    if (!user || (typeof document !== 'undefined' && document.visibilityState !== 'visible')) return;
    try {
      setLoadingInbox(true);
      const res = await getGraphQLDirectInbox();
      setConversations(res.conversations || []);
    } catch (err) {
      console.warn('[FloatingMessageDock GraphQL] Falling back to REST for inbox:', err?.message);
      try {
        const res = await api.get('/direct/inbox');
        setConversations(res.data?.conversations || []);
      } catch {}
    } finally {
      setLoadingInbox(false);
    }
  }, [user]);

  // Load active chat messages
  const loadChat = useCallback(async (convId, isInitial = false) => {
    if (!convId || (typeof document !== 'undefined' && document.visibilityState !== 'visible')) return;
    try {
      if (isInitial) setLoadingChat(true);
      let data = null;
      try {
        data = await getGraphQLDirectConversation(convId);
      } catch (err) {
        console.warn('[FloatingMessageDock GraphQL] Falling back to REST for chat:', err?.message);
        const res = await api.get(`/direct/${convId}`);
        data = res.data;
      }
      if (data) {
        setMessages(data.messages || []);
        setActiveConvData(data.other_user || null);
        if (isInitial) {
          requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
          });
        }
      }
    } catch {
      // ignore
    } finally {
      if (isInitial) setLoadingChat(false);
    }
  }, []);

  // Poll inbox periodically when mounted & user exists
  useEffect(() => {
    if (!mounted || !user || isDirectRoute) return;
    loadInbox();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadInbox();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadInbox();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, user, isDirectRoute, loadInbox]);

  // Handle active conversation opening & polling
  useEffect(() => {
    if (!isOpen || !activeConvId) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    loadChat(activeConvId, true);
    pollRef.current = setInterval(() => loadChat(activeConvId, false), 4000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, activeConvId, loadChat]);

  // Send message handler
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeConvId || sending) return;

    setSending(true);
    setInputText('');
    setShowPicker(false);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user?.id,
      body: text,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    try {
      let confirmedMsg = null;
      try {
        confirmedMsg = await sendGraphQLDirectMessage(activeConvId, { body: text });
      } catch (err) {
        console.warn('[FloatingMessageDock GraphQL] Send message falling back to REST:', err?.message);
        const res = await api.post(`/direct/${activeConvId}`, { body: text });
        confirmedMsg = res.data?.message;
      }
      if (confirmedMsg) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmedMsg : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Send Sticker handler
  const handleSendSticker = async (stickerData) => {
    if (!activeConvId) return;
    setShowPicker(false);
    const tempId = `temp_sticker_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user?.id,
      type: 'sticker',
      body: stickerData.alt || 'Sticker',
      content_attachment: stickerData,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    try {
      let confirmedMsg = null;
      try {
        confirmedMsg = await sendGraphQLDirectMessage(activeConvId, {
          type: 'sticker',
          body: stickerData.alt || 'Sticker',
          contentAttachment: stickerData,
        });
      } catch (err) {
        console.warn('[FloatingMessageDock GraphQL] Send sticker falling back to REST:', err?.message);
        const res = await api.post(`/direct/${activeConvId}`, {
          type: 'sticker',
          body: stickerData.alt || 'Sticker',
          content_attachment: stickerData,
        });
        confirmedMsg = res.data?.message;
      }
      if (confirmedMsg) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmedMsg : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Send GIF handler
  const handleSendGif = async (gifData) => {
    if (!activeConvId) return;
    setShowPicker(false);
    const tempId = `temp_gif_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user?.id,
      type: 'gif',
      body: gifData.title || 'GIF',
      content_attachment: gifData,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    try {
      let confirmedMsg = null;
      try {
        confirmedMsg = await sendGraphQLDirectMessage(activeConvId, {
          type: 'gif',
          body: gifData.title || 'GIF',
          contentAttachment: gifData,
        });
      } catch (err) {
        console.warn('[FloatingMessageDock GraphQL] Send GIF falling back to REST:', err?.message);
        const res = await api.post(`/direct/${activeConvId}`, {
          type: 'gif',
          body: gifData.title || 'GIF',
          content_attachment: gifData,
        });
        confirmedMsg = res.data?.message;
      }
      if (confirmedMsg) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? confirmedMsg : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };


  // Paste handler for Gboard / clipboard GIFs & stickers
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items || !activeConvId) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const isGif = file.type === 'image/gif' || file.name?.toLowerCase().endsWith('.gif');
        const blobUrl = URL.createObjectURL(file);

        if (isGif) {
          handleSendGif({
            content_type: 'gif',
            url: blobUrl,
            title: file.name || 'Pasted GIF',
            width: 400,
            height: 300,
            aspect_ratio: 1.33,
          });
        } else {
          handleSendSticker({
            content_type: 'sticker',
            url: blobUrl,
            alt: file.name || 'Pasted Sticker',
            width: 256,
            height: 256,
          });
        }

        // Upload to S3/Cloudinary in background and save to user library
        const formData = new FormData();
        formData.append('file', file);
        formData.append('resource_type', 'image');
        fetch('/api/upload/media', { method: 'POST', body: formData })
          .then((res) => res.json())
          .then((uploadData) => {
            const permanentUrl = uploadData.secure_url || uploadData.url;
            if (permanentUrl) {
              if (isGif) {
                saveRecentGif({
                  content_type: 'gif',
                  gif_id: uploadData.public_id || `gboard_${Date.now()}`,
                  url: permanentUrl,
                  preview_url: permanentUrl,
                  title: file.name || 'Gboard GIF',
                  source: 'gboard',
                  width: 320,
                  height: 240,
                  aspect_ratio: 1.33,
                });
              } else {
                saveRecentSticker({
                  content_type: 'sticker',
                  sticker_id: uploadData.public_id || `gboard_${Date.now()}`,
                  url: permanentUrl,
                  alt: file.name || 'Gboard Sticker',
                  source: 'gboard',
                  width: 256,
                  height: 256,
                });
              }
            }
          })
          .catch(() => {});

        return;
      }
    }
  };

  if (!mounted || !user || isDirectRoute) return null;

  // Recent 3 avatars for the pill
  const recentAvatars = conversations.slice(0, 3).map((c) => ({
    username: c.other_username,
    avatar: c.other_avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.other_name || c.other_username || 'user')}&backgroundColor=6e00ff,00dbe9`,
  }));

  const totalUnread = unreadMessages || conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <>
      <style>{`
        .floating-chat-dock-container {
          position: fixed;
          bottom: 24px;
          right: 28px;
          z-index: 999999;
          font-family: var(--font-body, system-ui, -apple-system, sans-serif);
        }
        @media (max-width: 640px) {
          .floating-chat-dock-container {
            display: none !important;
          }
        }
        .floating-msg-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 48px;
          padding: 0 16px;
          border-radius: 28px;
          background: ${isDark ? 'rgba(18, 24, 34, 0.95)' : 'rgba(255, 255, 255, 0.96)'};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${isDark ? 'rgba(110, 0, 255, 0.35)' : 'rgba(110, 0, 255, 0.25)'};
          box-shadow: 0 10px 32px rgba(0, 0, 0, ${isDark ? '0.45' : '0.14'}), 0 0 20px rgba(110, 0, 255, 0.12);
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .floating-msg-pill:hover {
          transform: translateY(-3px) scale(1.02);
          border-color: rgba(110, 0, 255, 0.6);
          box-shadow: 0 14px 40px rgba(0, 0, 0, ${isDark ? '0.55' : '0.18'}), 0 0 24px rgba(110, 0, 255, 0.3);
        }
        .floating-chat-window {
          width: 360px;
          height: 520px;
          max-height: calc(100vh - 100px);
          border-radius: 18px;
          background: ${isDark ? '#121822' : '#ffffff'};
          border: 1px solid ${isDark ? 'rgba(110, 0, 255, 0.3)' : 'rgba(110, 0, 255, 0.2)'};
          box-shadow: 0 16px 48px rgba(0, 0, 0, ${isDark ? '0.65' : '0.22'}), 0 0 32px rgba(110, 0, 255, 0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: floatSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
        }
        @keyframes floatSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dock-chat-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .dock-chat-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
          border-radius: 4px;
        }
      `}</style>

      <div className="floating-chat-dock-container">
        {!isOpen ? (
          /* ─── 1. Collapsed Floating Messages Pill ─── */
          <div
            className="floating-msg-pill"
            onClick={() => {
              setIsOpen(true);
              loadInbox();
            }}
          >
            {/* Left: Brand Icon + Unread Badge */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#4cd6fb' : '#6e00ff'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              {totalUnread > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -8,
                    minWidth: 17,
                    height: 17,
                    padding: '0 4px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(225, 29, 72, 0.5)',
                  }}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>

            {/* Middle: Text "Messages" */}
            <span
              style={{
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: 14.5,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              Messages
            </span>

            {/* Right: Stack of recent circular avatars + ... */}
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}>
              {recentAvatars.map((rec, i) => (
                <img
                  key={rec.username || i}
                  src={rec.avatar}
                  alt=""
                  width={24}
                  height={24}
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${isDark ? '#18202b' : '#ffffff'}`,
                    marginLeft: i === 0 ? 0 : -8,
                    background: '#1e293b',
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=user`;
                  }}
                />
              ))}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isDark ? 'rgba(110, 0, 255, 0.2)' : 'rgba(110, 0, 255, 0.08)',
                  border: `2px solid ${isDark ? '#18202b' : '#ffffff'}`,
                  marginLeft: recentAvatars.length > 0 ? -8 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#4cd6fb' : '#6e00ff',
                }}
              >
                <MoreHorizontal size={12} />
              </div>
            </div>
          </div>
        ) : (
          /* ─── 2. Expanded Floating Window ─── */
          <div className="floating-chat-window">
            {/* CPA Brand Top Gradient Bar */}
            <div
              style={{
                height: 3,
                width: '100%',
                background: 'linear-gradient(90deg, #6e00ff 0%, #4cd6fb 50%, #6e00ff 100%)',
                flexShrink: 0,
              }}
            />

            {activeConvId ? (
              /* ── View A: Active Conversation Thread ── */
              <>
                {/* Header */}
                <div
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    background: isDark ? '#151c27' : '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => setActiveConvId(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#cbd5e1' : '#475569',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Back to inbox"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    {activeConvData && (
                      <Link
                        href={`/u/${activeConvData.username}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          textDecoration: 'none',
                          minWidth: 0,
                        }}
                      >
                        <div style={{ position: 'relative' }}>
                          <img
                            src={activeConvData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeConvData.username)}`}
                            alt=""
                            width={30}
                            height={30}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                          {activeConvData.is_active && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#10b981',
                                border: `1.5px solid ${isDark ? '#151c27' : '#f8fafc'}`,
                              }}
                            />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: isDark ? '#ffffff' : '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 160,
                            }}
                          >
                            {activeConvData.name || activeConvData.username}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/direct/${activeConvId}`)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Open full page"
                      className="hover:text-cyan-400 transition-colors"
                    >
                      <Maximize2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Close"
                      className="hover:text-red-400 transition-colors"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div
                  ref={scrollContainerRef}
                  className="dock-chat-scroll"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {/* Big Centered Profile Summary Card */}
                  {activeConvData && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '16px 8px 14px',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        marginBottom: 6,
                      }}
                    >
                      <img
                        src={activeConvData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeConvData.username)}`}
                        alt=""
                        width={66}
                        height={66}
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2.5px solid #6e00ff',
                          boxShadow: '0 0 16px rgba(110, 0, 255, 0.35)',
                          marginBottom: 8,
                        }}
                      />
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>
                        {activeConvData.name || activeConvData.username}
                      </h3>
                      <p style={{ margin: '2px 0 10px', fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                        @{activeConvData.username} · Code+ Academy
                      </p>
                      <Link
                        href={`/u/${activeConvData.username}`}
                        style={{
                          padding: '5px 14px',
                          borderRadius: 8,
                          background: isDark ? 'rgba(110, 0, 255, 0.15)' : 'rgba(110, 0, 255, 0.08)',
                          border: '1px solid rgba(110, 0, 255, 0.3)',
                          color: isDark ? '#d0bcff' : '#6e00ff',
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        View profile
                      </Link>
                    </div>
                  )}

                  {loadingChat ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                      <Loader2 size={20} className="animate-spin" color="#6e00ff" />
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      let attachment = null;
                      if (msg.content_attachment) {
                        try {
                          attachment = typeof msg.content_attachment === 'string' ? JSON.parse(msg.content_attachment) : msg.content_attachment;
                        } catch {}
                      }

                      const mediaType = getMessageMediaType(msg);
                      const isSticker = mediaType === 'sticker';
                      const isGif = mediaType === 'gif';

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: isSticker ? 'fit-content' : (isGif ? '260px' : '78%'),
                              width: isSticker ? 'fit-content' : 'auto',
                              padding: isSticker ? '0' : (isGif ? '0' : '8px 12px'),
                              borderRadius: isSticker ? '0' : (isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px'),
                              background: isSticker || isGif ? 'transparent' : (isMine ? 'linear-gradient(135deg, #6e00ff 0%, #5200c7 100%)' : (isDark ? 'rgba(30, 41, 59, 0.88)' : '#f1f5f9')),
                              border: isSticker || isGif ? 'none' : (isMine ? '1px solid rgba(255, 255, 255, 0.18)' : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`),
                              color: isMine ? '#ffffff' : (isDark ? '#f8fafc' : '#0f172a'),
                              fontSize: 13,
                              lineHeight: 1.45,
                              boxShadow: isSticker || isGif ? 'none' : (isMine ? '0 4px 18px rgba(110, 0, 255, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none'),
                              overflow: isSticker ? 'visible' : 'hidden',
                              wordBreak: 'break-word',
                            }}
                          >
                            {isSticker ? (
                              <StickerMessageCard attachment={attachment || { url: msg.body }} isMine={isMine} />
                            ) : isGif ? (
                              <GifMessageCard attachment={attachment || { url: msg.body }} isMine={isMine} />
                            ) : (
                              <>
                                {attachment && <SharedContentCard attachment={attachment} />}
                                {msg.body && <div>{msg.body}</div>}
                              </>
                            )}
                            <div
                              style={{
                                fontSize: 9,
                                marginTop: 3,
                                opacity: 0.6,
                                textAlign: 'right',
                              }}
                            >
                              {timeAgo(msg.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} style={{ height: 6 }} />
                </div>

                {/* Emoji / Sticker Picker Popup */}
                {showPicker && (
                  <div
                    ref={pickerContainerRef}
                    style={{
                      position: 'absolute',
                      bottom: 58,
                      right: 12,
                      zIndex: 100,
                    }}
                  >
                    <WhatsAppEmojiPicker
                      onSelectEmoji={(emoji) => {
                        setInputText((prev) => prev + emoji);
                      }}
                      onSelectSticker={handleSendSticker}
                      onSelectGif={handleSendGif}
                      isDark={isDark}
                      themeAccent="#6e00ff"
                    />
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={handleSend}
                  style={{
                    padding: '8px 10px 10px',
                    borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    background: isDark ? '#151c27' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                      borderRadius: 22,
                      padding: '0 10px',
                      height: 38,
                    }}
                  >
                    <button
                      type="button"
                      data-action="toggle-dock-picker"
                      onClick={() => setShowPicker((prev) => !prev)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: showPicker ? '#6e00ff' : (isDark ? '#94a3b8' : '#64748b'),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 4,
                        marginRight: 4,
                      }}
                      title="Insert Emoji, GIF or Sticker"
                    >
                      <Smile size={18} />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="Message…"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: 13,
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: inputText.trim() ? 'linear-gradient(135deg, #6e00ff, #8a2be2)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                      border: 'none',
                      color: '#ffffff',
                      cursor: inputText.trim() ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      boxShadow: inputText.trim() ? '0 4px 14px rgba(110, 0, 255, 0.4)' : 'none',
                    }}
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </form>
              </>
            ) : (
              /* ── View B: Inbox List View ── */
              <>
                {/* Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    background: isDark ? '#151c27' : '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Messages
                    </span>
                    {totalUnread > 0 && (
                      <span
                        style={{
                          minWidth: 18,
                          height: 18,
                          padding: '0 5px',
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #ff3366, #e11d48)',
                          color: '#ffffff',
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.4)',
                        }}
                      >
                        {totalUnread}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => router.push('/network')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Open full page"
                      className="hover:text-cyan-400 transition-colors"
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Close"
                      className="hover:text-red-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Inbox Rows List */}
                <div
                  className="dock-chat-scroll"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '6px 8px',
                    position: 'relative',
                  }}
                >
                  {loadingInbox ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: 60,
                          borderRadius: 12,
                          background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                          margin: '6px 4px',
                        }}
                      />
                    ))
                  ) : conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      <MessageCircle size={32} style={{ opacity: 0.4, margin: '0 auto 8px', color: '#6e00ff' }} />
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No conversations yet</p>
                      <p style={{ margin: '4px 0 0', fontSize: 11 }}>Start chatting with mentors and creators</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const hasUnread = Boolean(conv.unread_count > 0);

                      return (
                        <div
                          key={conv.id}
                          onClick={() => setActiveConvId(conv.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 10px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            background: 'transparent',
                          }}
                          className="hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                              src={conv.other_avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conv.other_name || conv.other_username || 'user')}&backgroundColor=6e00ff,00dbe9`}
                              alt=""
                              width={44}
                              height={44}
                              style={{
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                              }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=user`;
                              }}
                            />
                            {conv.other_is_active && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: 1,
                                  right: 1,
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: '#10b981',
                                  border: `2px solid ${isDark ? '#121822' : '#ffffff'}`,
                                }}
                              />
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: hasUnread ? 800 : 600,
                                  color: isDark ? '#ffffff' : '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {conv.other_name || conv.other_username}
                              </span>
                            </div>

                            <div
                              style={{
                                margin: '2px 0 0',
                                fontSize: 11.5,
                                color: hasUnread ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                                fontWeight: hasUnread ? 700 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {conv.last_message || 'Started a conversation'}
                              </span>
                              <span>·</span>
                              <span style={{ flexShrink: 0 }}>{timeAgo(conv.last_message_time || conv.updated_at)}</span>
                            </div>
                          </div>

                          {hasUnread && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#4cd6fb',
                                boxShadow: '0 0 8px rgba(76, 214, 251, 0.7)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      );
                    })
                  )}

                  {/* Floating Compose Button (Pencil Icon) in bottom right with Brand Gradient */}
                  <button
                    type="button"
                    onClick={() => router.push('/network')}
                    style={{
                      position: 'absolute',
                      bottom: 14,
                      right: 14,
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6e00ff 0%, #8a2be2 100%)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 6px 22px rgba(110, 0, 255, 0.45)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease',
                    }}
                    title="New Message"
                    className="hover:scale-105 active:scale-95"
                  >
                    <PenSquare size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
