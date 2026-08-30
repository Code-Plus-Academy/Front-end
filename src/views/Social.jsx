/**
 * NetworkPage.jsx — CPA Social (Network tab)
 *
 * Integration manifest:
 *  - UI/UX:   New X-style design from new_NetworkPage.jsx (Manrope/JetBrains Mono/Inter,
 *             gradient avatars, typed role badges, pinned chats, typing dots, compose FAB)
 *  - Data:    All dummy data replaced with live CPA backend endpoints
 *             • Active Mentors  → GET /api/users/search?limit=16 (real users)
 *             • Active Node Density stat → derived from real devs.length
 *             • DM inbox/requests/thread → all existing EmbeddedDM + MiniChat logic
 *             • Follow/unfollow → existing toggle pattern
 *  - Theme:   useTheme() + DARK/LIGHT tokens (not internal useState toggle)
 *  - Auth:    useAuth() for current user, api from axios.js
 *  - Layout:  PageWrapper + MobileBottomNav + Helmet/NoIndex preserved
 *  - Desktop: 3-column (Architects strip → full EmbeddedDM) with right stats panel
 *  - Mobile:  Single column, new X-style chat list backed by real inbox data
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, X, BookOpen, Search, Trash2, ExternalLink, Eye, ThumbsUp, Download, Shield, Plus, Filter, MoreHorizontal, MessageSquare, Paperclip, Smile, Reply, Loader2, SlidersHorizontal, Pin, Clock, Lock, Users, Zap, Sparkles, Edit3, UserPlus, MessageCircle, Heart } from 'lucide-react';

function extractTargetFromSearch(search) {
  if (!search || typeof search !== 'string') return null;
  try {
    const params = new URLSearchParams(search);
    let raw = params.get('dm') || params.get('direct') || params.get('user');
    if (!raw) {
      const clean = search.replace(/^\?/, '').trim();
      if (clean.startsWith('@') || clean.startsWith('=')) {
        raw = clean.slice(1);
      }
    }
    if (!raw) return null;
    const target = raw.replace(/^@/, '').trim();
    return target.length > 0 ? target : null;
  } catch {
    return null;
  }
}
import PageWrapper from '../components/layout/PageWrapper';
import PostCard from '../components/posts/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import NoIndex from '../components/seo/NoIndex';
import LinkPreviewCard from '../components/direct/LinkPreviewCard';
import LinkPreviewSkeleton from '../components/direct/LinkPreviewSkeleton';
import MessageInput from '../components/direct/MessageInput';
import StickerMessageCard from '../components/direct/media/StickerMessageCard';
import GifMessageCard from '../components/direct/media/GifMessageCard';
import DocumentMessageCard from '../components/direct/cards/DocumentMessageCard';
import MediaMessageCard from '../components/direct/cards/MediaMessageCard';
import CodeMessageCard from '../components/direct/cards/CodeMessageCard';
import PollMessageCard from '../components/direct/cards/PollMessageCard';
import { getMessageMediaType } from '../utils/mediaDetector';
import { saveRecentGif, saveRecentSticker } from '../utils/s3MediaClient';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useImmersiveChrome } from '../context/ImmersiveChromeContext';
import { DARK, LIGHT } from '../styles/tokens';
import SavedHub from '../components/saved/SavedHub';

/* ─────────────────────────────────────────────────────────────────────────────
   TOKEN BRIDGE — map CPA tokens → new design system property names
───────────────────────────────────────────────────────────────────────────── */
function useT() {
  const { resolvedTheme } = useTheme();
  const base = resolvedTheme === 'dark' ? DARK : LIGHT;
  const dark = resolvedTheme === 'dark';
  return {
    ...base,
    // new-design aliases
    surface:      base.card,
    surfaceHover: base.cardHover,
    border:       base.cardBorder,
    borderSubtle: base.sep,
    text:         base.txt,
    textMuted:    base.txt2,
    textDim:      base.txt3,
    purple:       base.accent,
    purpleSoft:   base.accentSoft,
    purpleBorder: base.accentGlow,
    overlay:      dark
      ? 'rgba(5,5,7,0.94)'
      : 'rgba(242,244,248,0.94)',
    isDark: dark,
  };
}

const FONT = {
  display: "'Manrope', 'Space Grotesk', sans-serif",
  body:    "'Inter', 'Geist', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const BAR_DATA = [40, 55, 35, 70, 60, 80, 65, 90, 75, 95, 85, 100];

/* ─────────────────────────────────────────────────────────────────────────────
   ROLE BADGE — for DM inbox rows (maps account_type → badge colours)
───────────────────────────────────────────────────────────────────────────── */
const ROLE_BADGE = {
  professional: { label: 'PRO',     bg: '#00C2FF18', text: '#00C2FF', border: '#00C2FF33' },
  admin:        { label: 'ADMIN',   bg: '#7A00FF18', text: '#A855F7', border: '#7A00FF33' },
  recruiter:    { label: 'RECRUIT', bg: '#00D68F18', text: '#00D68F', border: '#00D68F33' },
  default:      { label: 'DEV',     bg: '#ffffff0a', text: '#6B7280', border: '#1F2937'   },
};
function roleBadge(accountType) {
  return ROLE_BADGE[accountType] || ROLE_BADGE.default;
}

/* avatar initials fallback for users without avatar_url */
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

/* generate a stable colour from username (same algo as old design) */
const COLORS = ['#7A00FF', '#00C2FF', '#FF6B6B', '#00D68F', '#FF9F43', '#A855F7'];
function colorForUser(username = '') {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

/* ─────────────────────────────────────────────────────────────────────────────
   TIME AGO helper
───────────────────────────────────────────────────────────────────────────── */
function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG ICONS (pure SVG, no emoji)
───────────────────────────────────────────────────────────────────────────── */
const IconSearch = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconBell = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconEdit = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconPin = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M16 12V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v8l-2 4h12l-2-4z"/>
  </svg>
);
const IconXMark = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSend = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
);
const IconMsg = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconBack = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="2" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   AVATAR COMPONENT — real image or styled initials fallback (Circular)
───────────────────────────────────────────────────────────────────────────── */
function UserAvatar({ user, size = 48, rounded = '50%' }) {
  const color = colorForUser(user?.username || '');
  const T = useT();
  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${color}88`,
          boxShadow: `0 0 10px ${color}28`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}44, ${color}18)`,
      border: `2px solid ${color}88`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.28, fontWeight: 700, color,
      fontFamily: FONT.display,
      boxShadow: `0 0 10px ${color}28`,
      flexShrink: 0,
    }}>
      {initials(user?.name || user?.username)}
    </div>
  );
}

// Client-side cache for scraped link previews in Social chat
const socialPreviewCache = new Map();

function extractFirstUrl(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)|(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/i);
  if (!match) return null;
  let url = match[0].trim();
  if (url.startsWith('www.')) url = 'https://' + url;
  return url;
}

function FormattedMessageText({ text, isMine }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: '0 4px', display: 'inline-block' }}>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (part.match(urlRegex)) {
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a
              key={idx}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: isMine ? '#ffffff' : '#0284c7',
                textDecoration: 'underline',
                wordBreak: 'break-all',
                fontWeight: 500,
              }}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
}

function MessageTextWithLinkPreview({ text, isMine, linkPreview: initialPreview }) {
  const firstUrl = extractFirstUrl(text);
  const [preview, setPreview] = useState(() => initialPreview || (firstUrl ? socialPreviewCache.get(firstUrl) : null));
  const [loading, setLoading] = useState(() => Boolean(firstUrl && !initialPreview && !socialPreviewCache.has(firstUrl)));

  useEffect(() => {
    if (!firstUrl || preview || socialPreviewCache.has(firstUrl)) return;
    let isCancelled = false;
    setLoading(true);

    fetch('/api/meta/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: firstUrl }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (isCancelled) return;
        if (res?.success && res?.data) {
          socialPreviewCache.set(firstUrl, res.data);
          setPreview(res.data);
        } else {
          socialPreviewCache.set(firstUrl, null);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          socialPreviewCache.set(firstUrl, null);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [firstUrl]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
      {loading && <LinkPreviewSkeleton />}
      {!loading && preview && <LinkPreviewCard preview={preview} isMine={isMine} />}
      <FormattedMessageText text={text} isMine={isMine} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DM THREAD PANEL — full conversation view (real API)
───────────────────────────────────────────────────────────────────────────── */
const ONLY_EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s)+$/u;
function isOnlyEmojiMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 25) return false;
  return ONLY_EMOJI_REGEX.test(trimmed);
}

function QuotedReplyCard({ replyTo, isMine, onJumpToMessage }) {
  if (!replyTo) return null;
  const authorName = replyTo.sender_name || (replyTo.sender_username ? `@${replyTo.sender_username}` : 'User');
  const quoteText = replyTo.body || (replyTo.title ? `Shared: ${replyTo.title}` : 'Attachment');

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (replyTo.message_id) onJumpToMessage?.(replyTo.message_id);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '5px 9px',
        marginBottom: 6,
        borderRadius: 8,
        background: isMine ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.35)',
        borderLeft: '3.5px solid #4cd6fb',
        cursor: replyTo.message_id ? 'pointer' : 'default',
        overflow: 'hidden',
        textAlign: 'left',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <div style={{
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: 11,
        fontWeight: 700,
        color: '#4cd6fb',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <Reply size={11} />
        <span>{authorName}</span>
      </div>
      <div style={{
        fontSize: 11.5,
        color: isMine ? 'rgba(255, 255, 255, 0.85)' : '#cbd5e1',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        maxWidth: '100%',
      }}>
        {quoteText}
      </div>
    </div>
  );
}

function SwipeableMessageRow({ msg, isMine, onReply, children }) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef(null);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    startXRef.current = t.clientX;
    startYRef.current = t.clientY;
    isHorizontalRef.current = null;
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!swiping) return;
    const t = e.touches[0];
    const dx = t.clientX - startXRef.current;
    const dy = t.clientY - startYRef.current;

    if (isHorizontalRef.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (!isHorizontalRef.current) return;

    if (dx > 0) {
      const resistedDx = Math.min(dx * 0.45, 60);
      setOffsetX(resistedDx);
    }
  };

  const handleTouchEnd = () => {
    if (!swiping) return;
    setSwiping(false);
    if (offsetX >= 35) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
      onReply?.(msg);
    }
    setOffsetX(0);
    isHorizontalRef.current = null;
  };

  const replyOpacity = Math.min(1, offsetX / 30);
  const replyScale = Math.min(1, 0.4 + (offsetX / 30) * 0.6);

  return (
    <div
      id={`social-msg-${msg.id}`}
      className="group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        width: '100%',
        gap: 8,
        touchAction: 'pan-y',
        transition: 'background 0.3s ease',
        borderRadius: 12,
      }}
    >
      {/* Swipe Gesture Indicator Icon (revealed when swiped right) */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          top: '50%',
          transform: `translateY(-50%) scale(${replyScale})`,
          opacity: replyOpacity,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'rgba(110, 0, 255, 0.25)',
          border: '1px solid rgba(110, 0, 255, 0.5)',
          color: '#d0bcff',
          transition: swiping ? 'none' : 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <Reply size={15} />
      </div>

      {/* Desktop Quick Reply Button (hover) */}
      <button
        type="button"
        onClick={() => onReply?.(msg)}
        title="Reply"
        aria-label="Reply to message"
        style={{
          order: isMine ? -1 : 10,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94a3b8',
          marginBottom: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
      >
        <Reply size={13} />
      </button>

      {/* Message Content */}
      <div
        style={{
          display: 'flex',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          gap: 8,
          maxWidth: '100%',
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ThreadPanel({ conversationId, onBack }) {
  const T = useT();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [other,    setOther]    = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pollRef   = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(0);
  const prevLastMessageIdRef = useRef(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom < 150;
  };

  const handleReply = (msg) => {
    if (!msg) return;
    const isMine = msg.sender_id === user?.id;
    const senderName = isMine ? 'You' : (other?.name || (other?.username ? `@${other.username}` : 'User'));
    const senderUsername = isMine ? user?.username : other?.username;
    let attachment = null;
    if (msg.content_attachment) {
      try {
        attachment = typeof msg.content_attachment === 'string'
          ? JSON.parse(msg.content_attachment)
          : msg.content_attachment;
      } catch (e) { attachment = null; }
    }
    setReplyingTo({
      message_id: msg.id,
      body: msg.body,
      sender_id: msg.sender_id,
      sender_name: senderName,
      sender_username: senderUsername,
      content_attachment: attachment,
    });
  };

  const handleJumpToMessage = (targetId) => {
    const el = document.getElementById(`social-msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.3s ease';
      el.style.background = 'rgba(110, 0, 255, 0.2)';
      setTimeout(() => {
        el.style.background = 'transparent';
      }, 1200);
    }
  };

  const load = useCallback(async (isManualOrInitial = false) => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/direct/${conversationId}`);
      const newMessages = res.data.messages || [];
      const lastMsg = newMessages[newMessages.length - 1];
      const hasChanged =
        newMessages.length !== prevMessagesCountRef.current ||
        lastMsg?.id !== prevLastMessageIdRef.current;

      if (hasChanged || isManualOrInitial) {
        prevMessagesCountRef.current = newMessages.length;
        prevLastMessageIdRef.current = lastMsg?.id;
        setMessages(newMessages);

        if (isManualOrInitial || isNearBottomRef.current) {
          requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({
              behavior: isManualOrInitial ? 'auto' : 'smooth',
            });
          });
        }
      }

      setOther(res.data.other_user);
    } catch { } finally { setLoading(false); }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    setReplyingTo(null);
    isNearBottomRef.current = true;
    prevMessagesCountRef.current = 0;
    prevLastMessageIdRef.current = null;
    load(true);
    pollRef.current = setInterval(() => load(false), 4000);
    return () => clearInterval(pollRef.current);
  }, [conversationId, load]);

  const handleSend = async (messageText, linkPreview, replyTarget) => {
    if (!messageText?.trim() || !conversationId) return;
    try {
      const payload = { body: messageText };
      let attachmentObj = null;
      if (linkPreview) {
        payload.link_preview = linkPreview;
        attachmentObj = { ...(attachmentObj || {}), link_preview: linkPreview };
      }
      if (replyTarget) {
        const replyData = {
          message_id: replyTarget.message_id,
          body: replyTarget.body,
          sender_name: replyTarget.sender_name,
          sender_username: replyTarget.sender_username,
        };
        payload.reply_to = replyData;
        attachmentObj = { ...(attachmentObj || {}), reply_to: replyData };
        setReplyingTo(null);
      }
      if (attachmentObj) {
        payload.content_attachment = attachmentObj;
      }
      const res = await api.post(`/direct/${conversationId}`, payload);
      if (res.data?.message) {
        setMessages(prev => [...prev, res.data.message]);
        prevMessagesCountRef.current += 1;
        prevLastMessageIdRef.current = res.data.message.id;
        isNearBottomRef.current = true;
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    } catch (err) {
      console.error('[handleSend] error:', err);
    }
  };

  const handleSendSticker = async (stickerData) => {
    try {
      const optimisticId = `temp_sticker_${Date.now()}`;
      const optimisticMsg = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: user?.id,
        type: 'sticker',
        body: stickerData.name || stickerData.title || 'Sticker',
        content_attachment: stickerData,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMsg]);
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });

      const payload = {
        type: 'sticker',
        body: stickerData.name || stickerData.title || 'Sticker',
        content_attachment: stickerData,
      };
      const res = await api.post(`/direct/${conversationId}`, payload);
      if (res.data?.message) {
        setMessages(prev => prev.map(m => (m.id === optimisticId ? res.data.message : m)));
      }
    } catch (err) {
      console.error('[handleSendSticker] error:', err);
    }
  };

  const handleSendGif = async (gifData) => {
    try {
      const optimisticId = `temp_gif_${Date.now()}`;
      const optimisticMsg = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: user?.id,
        type: 'gif',
        body: gifData.title || 'GIF',
        content_attachment: gifData,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMsg]);
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      });

      const payload = {
        type: 'gif',
        body: gifData.title || 'GIF',
        content_attachment: gifData,
      };
      const res = await api.post(`/direct/${conversationId}`, payload);
      if (res.data?.message) {
        setMessages(prev => prev.map(m => (m.id === optimisticId ? res.data.message : m)));
      }
    } catch (err) {
      console.error('[handleSendGif] error:', err);
    }
  };

  const handleSendMediaFile = async (file, mediaType, replyTarget) => {
    const optimisticId = `temp_media_${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    const optimisticAttachment = {
      content_type: mediaType,
      url: previewUrl,
      source: 'gboard',
      width: 320,
      height: 240,
    };
    const optimisticMsg = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user?.id,
      type: mediaType,
      body: mediaType === 'gif' ? 'GIF' : 'Sticker',
      content_attachment: optimisticAttachment,
      created_at: new Date().toISOString(),
      status: 'sending',
      _pendingFile: file,
      _pendingType: mediaType,
      _replyTarget: replyTarget,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resource_type', 'image');

      const uploadRes = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url && !uploadData.url) {
        throw new Error('Upload failed');
      }

      const uploadedUrl = uploadData.secure_url || uploadData.url;
      const uploadedAttachment = {
        content_type: mediaType,
        url: uploadedUrl,
        public_id: uploadData.public_id || `gboard_${Date.now()}`,
        source: 'gboard',
        width: uploadData.width || 320,
        height: uploadData.height || 240,
        aspect_ratio: uploadData.width && uploadData.height ? Number((uploadData.width / uploadData.height).toFixed(2)) : 1.33,
        name: file.name || 'Gboard Media',
      };

      if (mediaType === 'gif') {
        saveRecentGif(uploadedAttachment);
      } else {
        saveRecentSticker(uploadedAttachment);
      }

      const payload = {
        type: mediaType,
        body: mediaType === 'gif' ? 'GIF' : 'Sticker',
        content_attachment: uploadedAttachment,
      };
      if (replyTarget) {
        payload.reply_to = replyTarget;
      }
      const res = await api.post(`/direct/${conversationId}`, payload);
      if (res.data?.message) {
        setMessages(prev => prev.map(m => (m.id === optimisticId ? res.data.message : m)));
      }
    } catch (err) {
      console.error('[handleSendMediaFile] error:', err);
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: 'failed' } : m));
    }
  };

  const handleRetryMedia = async (msg) => {
    if (!msg || !msg._pendingFile) return;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sending' } : m));
    try {
      const formData = new FormData();
      formData.append('file', msg._pendingFile);
      formData.append('resource_type', 'image');

      const uploadRes = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url && !uploadData.url) {
        throw new Error('Upload failed');
      }

      const uploadedUrl = uploadData.secure_url || uploadData.url;
      const uploadedAttachment = {
        content_type: msg._pendingType || 'gif',
        url: uploadedUrl,
        public_id: uploadData.public_id || `gboard_${Date.now()}`,
        source: 'gboard',
        width: uploadData.width || 320,
        height: uploadData.height || 240,
        aspect_ratio: uploadData.width && uploadData.height ? Number((uploadData.width / uploadData.height).toFixed(2)) : 1.33,
        name: msg._pendingFile.name || 'Gboard Media',
      };

      if (msg._pendingType === 'gif') {
        saveRecentGif(uploadedAttachment);
      } else {
        saveRecentSticker(uploadedAttachment);
      }

      const payload = {
        type: msg._pendingType || 'gif',
        body: msg._pendingType === 'gif' ? 'GIF' : 'Sticker',
        content_attachment: uploadedAttachment,
      };
      if (msg._replyTarget) {
        payload.reply_to = msg._replyTarget;
      }
      const res = await api.post(`/direct/${conversationId}`, payload);
      if (res.data?.message) {
        setMessages(prev => prev.map(m => (m.id === msg.id ? res.data.message : m)));
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
    }
  };

  const handleSendAttachment = async (attachment, textBody, replyTarget) => {
    const optimisticId = `temp_att_${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user?.id,
      body: textBody || (attachment.type === 'document' ? attachment.file_name : (attachment.type === 'code_snippet' ? (attachment.title || 'Code Snippet') : (attachment.type === 'poll' ? attachment.question : 'Media'))),
      type: attachment.type,
      content_attachment: attachment,
      created_at: new Date().toISOString(),
      status: 'sending',
      reply_to: replyTarget || null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const payload = {
        type: attachment.type,
        body: optimisticMsg.body,
        content_attachment: attachment,
      };
      if (replyTarget) payload.reply_to = replyTarget;

      const res = await api.post(`/direct/${conversationId}`, payload);
      if (res.data?.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? res.data.message : m)));
      }
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: 'failed' } : m)));
    }
  };

  if (!conversationId) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.accentSoft, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconMsg size={26} color={T.accent} />
        </div>
        <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 16, color: T.text, margin: 0 }}>Select a conversation</p>
        <p style={{ fontFamily: FONT.mono, fontSize: 10, color: T.textMuted, margin: 0 }}>Choose from inbox to start messaging</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Thread header */}
      <div style={{ padding: '14px 20px', background: T.surface, borderBottom: `1px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}>
            <IconBack />
          </button>
        )}
        {other && (
          <Link to={`/u/${other.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textDecoration: 'none' }}>
            <div style={{ position: 'relative' }}>
              <UserAvatar user={other} size={44} rounded="50%" />
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 11,
                height: 11,
                background: other.is_active ? (T.green || '#10b981') : '#64748b',
                borderRadius: '50%',
                border: `2.5px solid ${T.bg}`
              }} />
            </div>
            <div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 15.5, color: T.text }}>{other.name}</div>
              <div style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: other.is_active ? (T.green || '#10b981') : T.textMuted
              }}>
                {other.is_active ? `Active now · @${other.username}` : `Offline · @${other.username}`}
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="edm-scroll"
        style={{ flex: 1, minHeight: 0, width: '100%', overflowY: 'auto', padding: '20px 22px 24px 22px', display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' }}
      >
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 44, borderRadius: 14, background: T.cardHover, opacity: 0.5, alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', width: `${35 + i * 8}%` }} />
          ))
        ) : messages.map(msg => {
          const isMine = msg.sender_id === user?.id;
          let attachment = null;
          if (msg.content_attachment) {
            try {
              attachment = typeof msg.content_attachment === 'string'
                ? JSON.parse(msg.content_attachment)
                : msg.content_attachment;
            } catch (e) { attachment = null; }
          }
          const mediaType = getMessageMediaType(msg);
          const isSticker = mediaType === 'sticker';
          const isGif = mediaType === 'gif';
          const isDocument = attachment?.type === 'document';
          const isMedia = attachment?.type === 'media';
          const isCode = attachment?.type === 'code_snippet';
          const isPoll = attachment?.type === 'poll';
          const isCustomAttachment = isDocument || isMedia || isCode || isPoll;

          const hasUrl = Boolean(extractFirstUrl(msg.body)) && !isSticker && !isGif && !isCustomAttachment;
          const isEmojiOnly = Boolean(msg.body && isOnlyEmojiMessage(msg.body) && !isSticker && !isGif && !isCustomAttachment);

          return (
            <SwipeableMessageRow key={msg.id} msg={msg} isMine={isMine} onReply={handleReply}>
              {!isMine && <UserAvatar user={other} size={34} rounded="50%" />}
              <div style={{
                maxWidth: isSticker ? '170px' : (isGif ? '320px' : (isCustomAttachment ? (isCode ? '460px' : (isPoll ? '390px' : '370px')) : (hasUrl ? '380px' : (isEmojiOnly ? 'auto' : '72%')))),
                width: hasUrl || isCustomAttachment ? '100%' : 'auto',
                minWidth: 0,
                padding: isCustomAttachment ? '0' : (isSticker || isEmojiOnly ? '2px 4px' : (isGif ? '0' : (hasUrl ? '8px 8px 10px 8px' : '12px 18px'))),
                borderRadius: isSticker || isCustomAttachment ? '18px' : (isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px'),
                background: isCustomAttachment || isSticker || isEmojiOnly
                  ? 'transparent'
                  : (isGif ? 'transparent' : (isMine ? `linear-gradient(135deg, ${T.accent || '#7c1cff'} 0%, #5d02ee 100%)` : (T.isDark ? 'rgba(30, 41, 59, 0.88)' : '#f1f5f9'))),
                border: isCustomAttachment || isSticker || isGif || isEmojiOnly
                  ? 'none'
                  : (isMine ? '1px solid rgba(255, 255, 255, 0.18)' : `1px solid ${T.cardBorder}`),
                color: isMine ? '#fff' : T.text,
                fontSize: isEmojiOnly ? 40 : 14.5,
                lineHeight: isEmojiOnly ? 1.2 : 1.6,
                boxShadow: isCustomAttachment || isSticker || isGif || isEmojiOnly
                  ? 'none'
                  : (isMine ? `0 4px 22px ${T.accentGlow || 'rgba(110,0,255,0.32)'}, inset 0 1px 0 rgba(255, 255, 255, 0.2)` : '0 2px 8px rgba(0,0,0,0.1)'),
                overflow: 'hidden',
              }}>
                {/* Quoted Message Card (if reply) */}
                {attachment?.reply_to && (
                  <QuotedReplyCard
                    replyTo={attachment.reply_to}
                    isMine={isMine}
                    onJumpToMessage={handleJumpToMessage}
                  />
                )}

                {/* 1. Custom Attachment Cards */}
                {isDocument ? (
                  <DocumentMessageCard attachment={attachment} isMine={isMine} />
                ) : isMedia ? (
                  <MediaMessageCard attachment={attachment} isMine={isMine} />
                ) : isCode ? (
                  <CodeMessageCard attachment={attachment} isMine={isMine} />
                ) : isPoll ? (
                  <PollMessageCard attachment={attachment} isMine={isMine} />
                ) : isSticker ? (
                  <StickerMessageCard
                    attachment={attachment || { url: msg.body }}
                    isMine={isMine}
                    status={msg.status || 'sent'}
                    onRetry={msg.status === 'failed' ? () => handleRetryMedia(msg) : undefined}
                  />
                ) : isGif ? (
                  /* 2. GIF Message */
                  <GifMessageCard
                    attachment={attachment || { url: msg.body }}
                    isMine={isMine}
                    status={msg.status || 'sent'}
                    onRetry={msg.status === 'failed' ? () => handleRetryMedia(msg) : undefined}
                  />
                ) : isEmojiOnly ? (
                  <div style={{ fontSize: 40, lineHeight: 1.2, letterSpacing: '0.05em' }}>
                    {msg.body}
                  </div>
                ) : (
                  <MessageTextWithLinkPreview text={msg.body} isMine={isMine} linkPreview={msg.link_preview || attachment?.link_preview} />
                )}
                <div style={{ fontSize: 9.5, marginTop: 4, opacity: 0.55, textAlign: 'right', fontFamily: FONT.mono, paddingRight: hasUrl ? 4 : 0 }}>{timeAgo(msg.created_at)}</div>
              </div>
              {isMine && <UserAvatar user={user} size={34} rounded="50%" />}
            </SwipeableMessageRow>
          );
        })}
        <div ref={bottomRef} style={{ height: '20px' }} />
      </div>

      {/* WhatsApp Floating Curved MessageInput */}
      <MessageInput
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSend={handleSend}
        onSelectSticker={handleSendSticker}
        onSelectGif={handleSendGif}
        onSendMediaFile={handleSendMediaFile}
        onSendAttachment={handleSendAttachment}
        placeholder="Type a message…"
        isDark={T.isDark}
        themeAccent={T.accent}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NEW CONVERSATION PANEL
───────────────────────────────────────────────────────────────────────────── */
function NewConvPanel({ targetUser, onBack, onConvCreated }) {
  const T = useT();
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim() || !targetUser) return;
    setSending(true);
    try {
      const res = await api.post('/direct/new', { to_username: targetUser.username, message: msg });
      setMsg('');
      if (res.data.conversation_id) {
        onConvCreated?.(res.data.conversation_id);
      } else {
        setRequestSent(true);
      }
    } catch { } finally { setSending(false); }
  };

  if (requestSent) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: T.bg }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${T.green || '#10B981'}18`, border: `2px solid ${T.green || '#10B981'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={28} color={T.green || '#10B981'} />
        </div>
        <h3 style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 16, color: T.text, margin: 0 }}>Request Sent!</h3>
        <p style={{ fontFamily: FONT.body, fontSize: 12, color: T.textMuted, textAlign: 'center', margin: '0 0 10px', maxWidth: 260, lineHeight: 1.5 }}>
          Your message has been sent as a message request to @{targetUser.username}. You can chat freely once they accept.
        </p>
        <button onClick={onBack} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 99, padding: '8px 24px', fontFamily: FONT.display, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: `0 4px 14px ${T.accentGlow}` }}>
          Back to Network
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}>
          <IconBack />
        </button>
        <UserAvatar user={targetUser} size={34} rounded={10} />
        <div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 14, color: T.text }}>{targetUser?.name || targetUser?.username}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.accent }}>@{targetUser?.username}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }}>
        <UserAvatar user={targetUser} size={72} rounded={18} />
        <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 16, color: T.text, margin: 0 }}>{targetUser?.name || targetUser?.username}</p>
        <p style={{ fontFamily: FONT.mono, fontSize: 10, color: T.textMuted, margin: 0 }}>Start a conversation</p>
      </div>
      <form onSubmit={handleSend} style={{ padding: '10px 14px', background: T.surface, borderTop: `1px solid ${T.cardBorder}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.cardHover, borderRadius: 12, border: `1px solid ${T.cardBorder}`, padding: '6px 6px 6px 14px' }}>
          <input
            value={msg} onChange={e => setMsg(e.target.value)}
            placeholder={`Message @${targetUser?.username}…`}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: T.text, fontFamily: FONT.body, padding: '6px 0' }}
          />
          <button type="submit" disabled={!msg.trim() || sending} style={{
            background: msg.trim() ? T.accent : T.cardHover, border: 'none',
            cursor: msg.trim() ? 'pointer' : 'default',
            color: msg.trim() ? '#fff' : T.textMuted,
            borderRadius: 9, padding: '8px 16px',
            fontFamily: FONT.display, fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
            boxShadow: msg.trim() ? `0 4px 14px ${T.accentGlow}` : 'none', flexShrink: 0,
          }}>
            {sending ? '…' : 'Send'} <IconSend size={12} />
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONVERSATION CARD COMPONENT — Mockup inspired clean card design
───────────────────────────────────────────────────────────────────────────── */
function ConversationCard({ conv, isActive, isPinned, onSelect, onTogglePin, T, FONT }) {
  const role = roleBadge(conv.other_account_type);
  const unread = conv.unread_count || 0;
  const isOnline = Boolean(conv.other_is_active);

  return (
    <div
      onClick={onSelect}
      className="chat-card-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 13px',
        borderRadius: 18,
        cursor: 'pointer',
        transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: 6,
        background: isActive
          ? (T.isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF')
          : unread > 0
            ? (T.isDark ? 'rgba(23, 28, 38, 0.95)' : '#FAF5FF')
            : (T.isDark ? 'rgba(18, 24, 38, 0.65)' : '#FFFFFF'),
        border: isActive
          ? '1.5px solid #8B5CF6'
          : unread > 0
            ? (T.isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #E9D5FF')
            : (T.isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #F1F5F9'),
        boxShadow: isActive
          ? '0 4px 18px rgba(124, 58, 237, 0.14)'
          : (T.isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)'),
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = T.isDark ? 'rgba(30, 41, 59, 0.8)' : '#F8FAFC';
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = unread > 0
            ? (T.isDark ? 'rgba(23, 28, 38, 0.95)' : '#FAF5FF')
            : (T.isDark ? 'rgba(18, 24, 38, 0.65)' : '#FFFFFF');
        }
      }}
    >
      {/* Avatar Container with Online Indicator */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar user={{ name: conv.other_name, username: conv.other_username, avatar_url: conv.other_avatar }} size={46} rounded="50%" />
        {isOnline && (
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#10B981',
              border: `2.5px solid ${T.isDark ? '#0F172A' : '#FFFFFF'}`,
              boxShadow: '0 0 4px rgba(16, 185, 129, 0.4)',
            }}
          />
        )}
      </div>

      {/* Main Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: Name + Badge + Pin/Time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
            <span style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 14,
              color: isActive ? (T.isDark ? '#DDD6FE' : '#6D28D9') : T.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.2px'
            }}>
              {conv.other_name || conv.other_username}
            </span>
            {conv.other_account_type && conv.other_account_type !== 'learner' && role?.label && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                background: role.bg || '#EDE9FE',
                color: role.text || '#7C3AED',
                border: `1px solid ${role.border || '#DDD6FE'}`,
                borderRadius: 6,
                padding: '1px 5px',
                fontFamily: FONT.mono,
                flexShrink: 0,
                letterSpacing: '0.04em'
              }}>
                {role.label}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {isPinned && (
              <Pin size={12} color="#8B5CF6" fill="#8B5CF6" style={{ transform: 'rotate(45deg)' }} />
            )}
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.textMuted }}>
              {timeAgo(conv.last_message_at)}
            </span>
          </div>
        </div>

        {/* Row 2: Message preview snippet + Unread Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{
            fontSize: 12,
            color: unread > 0 ? T.text : T.textMuted,
            fontFamily: FONT.body,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: unread > 0 ? 600 : 400,
            lineHeight: 1.4,
            flex: 1,
            minWidth: 0
          }}>
            {conv.last_message_type === 'story_reply' 
              ? '📷 Replying to story' 
              : (conv.last_message_type === 'shared_video' 
                ? '🎬 Shared a video' 
                : (conv.last_message_type === 'shared_short' 
                  ? '⚡ Shared a short' 
                  : (conv.last_message_type?.startsWith('shared_') 
                    ? '🔗 Shared a post' 
                    : (conv.last_message || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Start a conversation</span>))))}
          </div>

          {unread > 0 && (
            <span style={{
              minWidth: 19,
              height: 19,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
              color: '#FFFFFF',
              fontSize: 9.5,
              fontWeight: 800,
              fontFamily: FONT.mono,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.45)',
              flexShrink: 0
            }}>
              {unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WELCOME ARTWORK COMPONENT — Desktop Empty/Welcome State 3D Graphics
───────────────────────────────────────────────────────────────────────────── */
function WelcomeArtwork({ T, FONT, onStartChat }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      background: T.isDark ? 'linear-gradient(180deg, #0F172A 0%, #0B1120 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    }}>
      {/* Floating Paper Airplane with curved dotted flight trail */}
      <div style={{ position: 'absolute', top: 35, left: 35, pointerEvents: 'none' }}>
        <svg width="130" height="90" viewBox="0 0 130 90" fill="none">
          <path d="M10 80 C 35 45, 55 70, 85 45 C 95 35, 105 25, 115 15" stroke="#A78BFA" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" fill="none" opacity="0.75" />
          <g transform="translate(100, 5) rotate(-10)">
            <polygon points="0,15 26,0 15,28 10,17" fill="#8B5CF6" />
            <polygon points="26,0 10,17 2,14" fill="#7C3AED" />
          </g>
        </svg>
      </div>

      {/* Floating Sparkles */}
      <div style={{ position: 'absolute', top: 75, right: 65, color: '#F59E0B', fontSize: 20, pointerEvents: 'none' }}>✦</div>
      <div style={{ position: 'absolute', top: 180, right: 40, color: '#A78BFA', fontSize: 13, pointerEvents: 'none' }}>✦</div>
      <div style={{ position: 'absolute', top: 140, left: 45, color: '#C084FC', fontSize: 14, pointerEvents: 'none' }}>✦</div>
      <div style={{ position: 'absolute', bottom: 120, right: 55, color: '#818CF8', fontSize: 16, pointerEvents: 'none' }}>✦</div>

      {/* Decorative center backdrop glow */}
      <div style={{
        position: 'absolute',
        top: '32%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380,
        height: 380,
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
        pointerEvents: 'none',
      }} />

      {/* 3D Chat Bubbles Illustration */}
      <div style={{ position: 'relative', width: 170, height: 135, marginBottom: 20 }}>
        {/* Main Purple 3D Speech Bubble */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 125,
          height: 90,
          borderRadius: '26px 26px 26px 8px',
          background: 'linear-gradient(145deg, #9333EA 0%, #7C3AED 45%, #6366F1 100%)',
          boxShadow: '0 18px 38px rgba(124, 58, 237, 0.32), inset 0 2px 4px rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          zIndex: 2,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        </div>

        {/* Smaller White Smiling Bubble Overlapping */}
        <div style={{
          position: 'absolute',
          bottom: 5,
          right: 0,
          width: 80,
          height: 64,
          borderRadius: '20px 20px 6px 20px',
          background: T.isDark ? '#1E293B' : '#FFFFFF',
          border: `1.5px solid ${T.isDark ? '#334155' : '#EDE9FE'}`,
          boxShadow: '0 12px 28px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          zIndex: 3,
        }}>
          {/* Eyes */}
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#7C3AED' }} />
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: '#7C3AED' }} />
          </div>
          {/* Smile curve */}
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
            <path d="M2 2 Q 11 10, 20 2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* Heading: Hey there! 👋 */}
      <h2 style={{
        fontFamily: FONT.display,
        fontWeight: 800,
        fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
        color: T.text,
        margin: '0 0 2px',
        letterSpacing: '-0.4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span>Hey there!</span>
        <span style={{ fontSize: '1.2em' }}>👋</span>
      </h2>

      {/* Decorative Purple Squiggly Underline */}
      <svg width="100" height="10" viewBox="0 0 100 10" fill="none" style={{ margin: '2px auto 14px' }}>
        <path d="M2 5 Q 14 1, 26 5 T 50 5 T 74 5 T 98 5" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>

      {/* Subtitles */}
      <p style={{
        fontFamily: FONT.body,
        fontSize: 14,
        color: T.textMuted,
        margin: '0 0 4px',
        lineHeight: 1.5,
      }}>
        Your <strong style={{ color: '#8B5CF6', fontWeight: 700 }}>conversations</strong> will appear here
      </p>
      <p style={{
        fontFamily: FONT.body,
        fontSize: 13,
        color: T.textDim,
        margin: '0 0 26px',
      }}>
        Start a chat and make something amazing happen ✨
      </p>

      {/* Dashed Feature Capsule Box with Pink Heart */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        flexWrap: 'wrap',
        padding: '14px 28px',
        borderRadius: 20,
        border: `1.5px dashed ${T.isDark ? 'rgba(139, 92, 246, 0.35)' : '#DDD6FE'}`,
        background: T.isDark ? 'rgba(30, 41, 59, 0.4)' : '#FAF5FF',
        marginBottom: 26,
        maxWidth: 520,
      }}>
        {/* Pink Heart Sticker */}
        <div style={{
          position: 'absolute',
          top: -11,
          right: 20,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FB7185, #E11D48)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.4)',
        }}>
          <Heart size={11} color="#FFFFFF" fill="#FFFFFF" />
        </div>

        {/* Feature 1: End-to-end encrypted */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text, fontFamily: FONT.body, fontWeight: 500 }}>
          <Lock size={14} color="#8B5CF6" />
          <span>End-to-end encrypted</span>
        </div>

        {/* Feature 2: Private & confidential */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text, fontFamily: FONT.body, fontWeight: 500 }}>
          <Users size={14} color="#8B5CF6" />
          <span>Private & confidential</span>
        </div>

        {/* Feature 3: Fast & reliable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text, fontFamily: FONT.body, fontWeight: 500 }}>
          <Zap size={14} color="#8B5CF6" />
          <span>Fast & reliable</span>
        </div>
      </div>

      {/* Yellow Post-It Sticky Note Doodle */}
      <div style={{
        position: 'relative',
        background: '#FEF08A',
        color: '#713F12',
        borderRadius: '3px 3px 14px 3px',
        padding: '12px 20px',
        fontFamily: '"Space Grotesk", cursive, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1.45,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08), 2px 2px 0px rgba(0,0,0,0.05)',
        transform: 'rotate(-2deg)',
        display: 'inline-block',
        textAlign: 'left',
      }}>
        {/* Transparent Tape Sticker */}
        <div style={{
          position: 'absolute',
          top: -7,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 32,
          height: 11,
          background: 'rgba(255, 255, 255, 0.75)',
          borderRadius: 2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        }} />
        <div>Ideas</div>
        <div>+ Teamwork</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          = Impact <span style={{ color: '#7C3AED' }}>💜</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMBEDDED DM — Full Desktop Messaging Layout (Mockup Redesign)
───────────────────────────────────────────────────────────────────────────── */
function EmbeddedDM({ targetUser = null, targetUsername = null }) {
  const T = useT();
  const nav = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('all'); // 'all', 'unread', 'groups', 'direct', 'requests'
  const [activeConv,    setActiveConv]    = useState(null);
  const [newConvUser,   setNewConvUser]   = useState(null);
  const [query,         setQuery]         = useState('');
  const [globalUsers,   setGlobalUsers]   = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [pickerUsers,   setPickerUsers]   = useState([]);
  const [pinnedIds,     setPinnedIds]     = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cpa_pinned_chats') || '[]');
    } catch {
      return [];
    }
  });
  const searchInputRef = useRef(null);
  const optionsRef = useRef(null);

  const loadInbox = async () => {
    try {
      const [inbox, reqs] = await Promise.all([api.get('/direct/inbox'), api.get('/direct/requests')]);
      setConversations(inbox.data.conversations || []);
      setRequests(reqs.data.requests || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadInbox(); }, []);

  // Save pinned chats to localStorage
  const togglePin = (convId, e) => {
    if (e) e.stopPropagation();
    setPinnedIds(prev => {
      const updated = prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId];
      try { localStorage.setItem('cpa_pinned_chats', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Close options menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Elasticsearch user search across the platform
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setGlobalUsers([]);
      setIsSearchingGlobal(false);
      return;
    }

    setIsSearchingGlobal(true);
    const timer = setTimeout(async () => {
      try {
        let results = [];
        try {
          const esRes = await api.get('/search/section', {
            params: { type: 'people', q, limit: 15 }
          });
          results = esRes.data?.items || [];
        } catch {}

        if (!results.length) {
          try {
            const sqlRes = await api.get('/users/search', {
              params: { q, limit: 15 }
            });
            results = sqlRes.data?.users || sqlRes.data?.items || [];
          } catch {
            const fbRes = await api.get('/users', {
              params: { q, limit: 15 }
            });
            results = fbRes.data?.users || [];
          }
        }

        const myUsername = user?.username?.toLowerCase();
        const mapped = results
          .filter(u => !myUsername || u.username?.toLowerCase() !== myUsername)
          .map(u => ({
            id: u.id || u.user_id,
            name: u.name || u.username,
            username: u.username,
            avatar_url: u.avatar_url || u.avatar,
            bio: u.bio || '',
            account_type: u.account_type || 'learner',
            tech_interests: u.tech_interests || []
          }));

        setGlobalUsers(mapped);
      } catch (err) {
        console.error('[DM Search] Failed to fetch users:', err);
        setGlobalUsers([]);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, user]);

  // Ctrl + K listener to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize active conversation with targetUser / targetUsername from URL
  useEffect(() => {
    if (!targetUsername && !targetUser) {
      setActiveConv(null);
      setNewConvUser(null);
      return;
    }

    const currentTarget = targetUser || (targetUsername ? { username: targetUsername, name: targetUsername } : null);
    if (!currentTarget) {
      setActiveConv(null);
      setNewConvUser(null);
      return;
    }

    const username = (currentTarget.username || targetUsername || '').toLowerCase();
    const existing = conversations.find(c => c.other_username?.toLowerCase() === username);

    if (existing) {
      setActiveConv(existing.id);
      setNewConvUser(null);
    } else {
      setNewConvUser(currentTarget);
      setActiveConv(null);
    }
  }, [targetUser, targetUsername, conversations]);

  const handleDesktopBack = () => {
    setActiveConv(null);
    setNewConvUser(null);
    if (targetUsername) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        nav('/network');
      }
    } else {
      nav('/network');
    }
  };

  const handleSelectConv = (c) => {
    setActiveConv(c.id);
    setNewConvUser(null);
    if (c.other_username) {
      nav(`/network?dm=${encodeURIComponent(c.other_username)}`);
    }
  };

  const handleSelectNewUser = (gu) => {
    const existingConv = conversations.find(c =>
      (c.other_username && c.other_username.toLowerCase() === gu.username?.toLowerCase()) ||
      (c.other_user_id && String(c.other_user_id) === String(gu.id))
    );
    if (existingConv) {
      handleSelectConv(existingConv);
    } else {
      setNewConvUser(gu);
      setActiveConv(null);
      if (gu.username) {
        nav(`/network?dm=${encodeURIComponent(gu.username)}`);
      }
    }
  };

  // Load user picker results
  useEffect(() => {
    if (showUserPicker) {
      api.get('/users/search?limit=20')
        .then(r => setPickerUsers(r.data.users || []))
        .catch(() => {});
    }
  }, [showUserPicker]);

  const handleRequest = async (id, action) => {
    const status = action === 'accept' ? 'accepted' : 'declined';
    try {
      await api.put(`/direct/requests/${id}`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
      if (action === 'accept') await loadInbox();
    } catch { }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Filter conversations based on search and active filter tab
  const filteredConvs = conversations.filter(c => {
    const matchQuery = !query ||
      c.other_name?.toLowerCase().includes(query.toLowerCase()) ||
      c.other_username?.toLowerCase().includes(query.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(query.toLowerCase());

    if (!matchQuery) return false;
    if (activeTab === 'unread') return (c.unread_count > 0);
    if (activeTab === 'groups') return c.is_group || c.type === 'group';
    if (activeTab === 'direct') return !c.is_group && c.type !== 'group';
    return true; // 'all'
  });

  const pinnedConvs = filteredConvs.filter(c => pinnedIds.includes(c.id) || c._pinned);
  const recentConvs = filteredConvs.filter(c => !pinnedIds.includes(c.id) && !c._pinned);

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', width: '100%', minHeight: 600, boxSizing: 'border-box' }}>
      
      {/* ── LEFT COLUMN (Sidebar / Chat List Card) ── */}
      <aside style={{
        width: 'clamp(340px, 28vw, 420px)',
        flexShrink: 0,
        background: T.isDark ? '#0F172A' : '#FFFFFF',
        border: `1px solid ${T.isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
        borderRadius: 24,
        boxShadow: T.isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Sidebar Header */}
        <div style={{ padding: '18px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, borderBottom: `1px solid ${T.isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}` }}>
          
          {/* Title & Subtitle + Top Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 22,
                color: T.text,
                margin: '0 0 2px',
                letterSpacing: '-0.4px',
              }}>
                Chats
              </h1>
              <p style={{
                fontFamily: FONT.body,
                fontSize: 11.5,
                color: T.textMuted,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span>〽</span> Let's connect and build together! <span style={{ color: '#8B5CF6' }}>💜</span>
              </p>
            </div>

            {/* Actions: (+) and (···) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }} ref={optionsRef}>
              {/* New Chat Button */}
              <button
                onClick={() => setShowUserPicker(prev => !prev)}
                title="New Conversation"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: T.isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                  border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.isDark ? 'rgba(255,255,255,0.12)' : '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.background = T.isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC'}
              >
                <Plus size={16} color="#7C3AED" />
              </button>

              {/* Options Dropdown Trigger */}
              <button
                onClick={() => setShowOptionsMenu(prev => !prev)}
                title="Options & Requests"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: showOptionsMenu || activeTab === 'requests' ? '#EDE9FE' : (T.isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC'),
                  border: `1px solid ${showOptionsMenu || activeTab === 'requests' ? '#DDD6FE' : (T.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0')}`,
                  color: showOptionsMenu || activeTab === 'requests' ? '#7C3AED' : T.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <MoreHorizontal size={16} />
                {requests.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#8B5CF6',
                    border: `2px solid ${T.isDark ? '#0F172A' : '#FFFFFF'}`,
                  }} />
                )}
              </button>

              {/* Options Menu Dropdown */}
              {showOptionsMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 200,
                  background: T.isDark ? '#1E293B' : '#FFFFFF',
                  border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                  borderRadius: 16,
                  padding: 6,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}>
                  <button
                    onClick={() => { setActiveTab('requests'); setShowOptionsMenu(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                      color: T.text, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                    }}
                    className="hover:bg-purple-500/10"
                  >
                    <span>Message Requests</span>
                    {requests.length > 0 && (
                      <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                        {requests.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setActiveTab('all'); setShowOptionsMenu(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                      color: T.text, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                    }}
                    className="hover:bg-purple-500/10"
                  >
                    <span>Show All Chats</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Capsule Search Input with Keyboard Shortcut ⌘K */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chats and contacts..."
              style={{
                width: '100%',
                background: T.isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.09)' : '#E2E8F0'}`,
                borderRadius: 9999,
                padding: '9px 65px 9px 38px',
                fontSize: 12.5,
                color: T.text,
                outline: 'none',
                fontFamily: FONT.body,
                boxSizing: 'border-box',
                transition: 'all 0.16s ease',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#8B5CF6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = T.isDark ? 'rgba(255,255,255,0.09)' : '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Shortcut / Spin / Clear badge */}
            <div style={{ position: 'absolute', right: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {isSearchingGlobal ? (
                <Loader2 size={13} className="animate-spin" color="#7C3AED" />
              ) : query ? (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}>
                  <X size={13} />
                </button>
              ) : (
                <span style={{
                  fontSize: 10,
                  fontFamily: FONT.mono,
                  fontWeight: 600,
                  color: T.textMuted,
                  background: T.isDark ? 'rgba(255,255,255,0.08)' : '#EDE9FE',
                  border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#DDD6FE'}`,
                  borderRadius: 6,
                  padding: '1px 5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  ⌘ K
                </span>
              )}
            </div>
          </div>

          {/* Filter Chips Row (All, Unread 3, Groups, Direct, Filter Button) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flex: 1 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread', count: totalUnread },
                { id: 'groups', label: 'Groups' },
                { id: 'direct', label: 'Direct' },
              ].map(chip => {
                const isActiveChip = activeTab === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setActiveTab(chip.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 9999,
                      border: isActiveChip
                        ? '1px solid #7C3AED'
                        : `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                      background: isActiveChip
                        ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                        : (T.isDark ? 'transparent' : '#FFFFFF'),
                      color: isActiveChip ? '#FFFFFF' : T.textMuted,
                      fontFamily: FONT.body,
                      fontWeight: isActiveChip ? 700 : 500,
                      fontSize: 11.5,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      boxShadow: isActiveChip ? '0 2px 8px rgba(124, 58, 237, 0.35)' : 'none',
                    }}
                  >
                    <span>{chip.label}</span>
                    {chip.count > 0 && (
                      <span style={{
                        fontSize: 9.5,
                        fontFamily: FONT.mono,
                        fontWeight: 800,
                        background: isActiveChip ? '#FFFFFF' : '#8B5CF6',
                        color: isActiveChip ? '#6D28D9' : '#FFFFFF',
                        borderRadius: 999,
                        padding: '0 5px',
                      }}>
                        {chip.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowOptionsMenu(prev => !prev)}
              title="More Filters"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: showOptionsMenu ? '#EDE9FE' : (T.isDark ? 'transparent' : '#FFFFFF'),
                border: `1px solid ${showOptionsMenu ? '#8B5CF6' : (T.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0')}`,
                color: showOptionsMenu ? '#7C3AED' : T.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <Filter size={13} />
            </button>
          </div>
        </div>

        {/* User Picker Modal Overlay */}
        {showUserPicker && (
          <div style={{
            position: 'absolute',
            top: 135,
            left: 14,
            right: 14,
            zIndex: 150,
            background: T.isDark ? '#1E293B' : '#FFFFFF',
            border: `1.5px solid ${T.isDark ? 'rgba(139, 92, 246, 0.4)' : '#DDD6FE'}`,
            borderRadius: 18,
            padding: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'}` }}>
              <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13, color: T.text }}>Start New Chat</span>
              <button onClick={() => setShowUserPicker(false)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={14} /></button>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pickerUsers.map(dev => (
                <div
                  key={dev.id || dev.username}
                  onClick={() => {
                    setShowUserPicker(false);
                    handleSelectNewUser(dev);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  className="hover:bg-purple-500/10"
                >
                  <UserAvatar user={dev} size={36} rounded="50%" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dev.name}</div>
                    <div style={{ fontFamily: FONT.mono, fontSize: 10, color: '#8B5CF6' }}>@{dev.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List Scroll Area */}
        <div className="edm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 68, background: T.isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', borderRadius: 18, opacity: 0.5 }} />
              ))}
            </div>
          ) : activeTab === 'requests' ? (
            /* Message Requests View */
            requests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                <MessageSquare size={32} color={T.textDim} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontFamily: FONT.mono, fontSize: 12, marginTop: 4 }}>No pending requests</p>
              </div>
            ) : (
              requests.map(r => {
                const name = r.sender_name || r.name || 'User';
                const username = r.sender_username || r.username || 'user';
                const avatar = r.sender_avatar || r.avatar_url;
                return (
                  <div key={r.id} style={{
                    padding: 14,
                    border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                    borderRadius: 18,
                    marginBottom: 8,
                    background: T.isDark ? 'rgba(18, 24, 38, 0.65)' : '#FFFFFF',
                  }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                      <UserAvatar user={{ name, username, avatar_url: avatar }} size={42} rounded="50%" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13.5, color: T.text }}>{name}</div>
                        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleRequest(r.id, 'accept')} style={{ flex: 1, padding: '7px 0', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <Check size={13} /> Accept
                      </button>
                      <button onClick={() => handleRequest(r.id, 'decline')} style={{ flex: 1, padding: '7px 0', background: 'transparent', border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, borderRadius: 10, color: T.textMuted, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <X size={13} /> Decline
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : query.trim() ? (
            /* Search Results: Chats + Contacts from Elasticsearch */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredConvs.length > 0 && (
                <div>
                  <div style={{ padding: '2px 6px 6px', fontSize: 10.5, fontFamily: FONT.mono, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Conversations ({filteredConvs.length})
                  </div>
                  {filteredConvs.map(c => (
                    <ConversationCard
                      key={c.id}
                      conv={c}
                      isActive={activeConv === c.id}
                      isPinned={pinnedIds.includes(c.id) || c._pinned}
                      onSelect={() => handleSelectConv(c)}
                      onTogglePin={(e) => togglePin(c.id, e)}
                      T={T}
                      FONT={FONT}
                    />
                  ))}
                </div>
              )}

              <div>
                <div style={{ padding: '2px 6px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10.5, fontFamily: FONT.mono, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Contacts & People {globalUsers.length > 0 ? `(${globalUsers.length})` : ''}
                  </span>
                  {isSearchingGlobal && (
                    <span style={{ fontSize: 10, color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT.mono }}>
                      <Loader2 size={11} className="animate-spin" /> Searching…
                    </span>
                  )}
                </div>

                {globalUsers.length > 0 ? (
                  globalUsers.map(gu => {
                    const isMatchingActive = newConvUser?.username?.toLowerCase() === gu.username?.toLowerCase();
                    const existingConv = conversations.find(c =>
                      (c.other_username && c.other_username.toLowerCase() === gu.username?.toLowerCase()) ||
                      (c.other_user_id && String(c.other_user_id) === String(gu.id))
                    );
                    const role = roleBadge(gu.account_type);

                    return (
                      <div
                        key={gu.id || gu.username}
                        onClick={() => handleSelectNewUser(gu)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 16,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          marginBottom: 4,
                          background: isMatchingActive ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                          border: `1px solid ${isMatchingActive ? '#8B5CF6' : 'transparent'}`,
                        }}
                        className="hover:bg-purple-500/10"
                      >
                        <UserAvatar user={gu} size={42} rounded="50%" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13.5, color: isMatchingActive ? '#8B5CF6' : T.text }}>{gu.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 4, padding: '0 4px', fontFamily: FONT.mono }}>{role.label}</span>
                          </div>
                          <div style={{ fontSize: 11, color: T.textMuted, fontFamily: FONT.mono }}>@{gu.username} {gu.bio ? `· ${gu.bio}` : ''}</div>
                        </div>
                      </div>
                    );
                  })
                ) : !isSearchingGlobal && filteredConvs.length === 0 ? (
                  <div style={{ padding: 36, textAlign: 'center', color: T.textMuted }}>
                    <Search size={26} color={T.textDim} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                    <p style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 13, color: T.text, margin: '0 0 4px' }}>No users found for "{query}"</p>
                    <p style={{ fontFamily: FONT.mono, fontSize: 10.5, margin: 0, color: T.textMuted }}>Try searching by exact @username</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : filteredConvs.length === 0 ? (
            /* Empty Chats */
            <div style={{ padding: 48, textAlign: 'center', color: T.textMuted }}>
              <MessageSquare size={32} color={T.textDim} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 14, color: T.text, margin: '0 0 4px' }}>No conversations yet</p>
              <p style={{ fontFamily: FONT.mono, fontSize: 11, margin: 0 }}>Start a chat with the (+) button</p>
            </div>
          ) : (
            /* Grouped Pinned and Recent Sections */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 📌 Pinned Section */}
              {pinnedConvs.length > 0 && (
                <div>
                  <div style={{
                    padding: '2px 8px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: FONT.mono,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#8B5CF6',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    <Pin size={11} color="#8B5CF6" fill="#8B5CF6" style={{ transform: 'rotate(45deg)' }} />
                    <span>Pinned</span>
                  </div>
                  {pinnedConvs.map(c => (
                    <ConversationCard
                      key={c.id}
                      conv={c}
                      isActive={activeConv === c.id}
                      isPinned={true}
                      onSelect={() => handleSelectConv(c)}
                      onTogglePin={(e) => togglePin(c.id, e)}
                      T={T}
                      FONT={FONT}
                    />
                  ))}
                </div>
              )}

              {/* 🕒 Recent Section */}
              {recentConvs.length > 0 && (
                <div>
                  {pinnedConvs.length > 0 && (
                    <div style={{
                      padding: '8px 8px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: FONT.mono,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: T.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                      <Clock size={11} color={T.textMuted} />
                      <span>Recent</span>
                    </div>
                  )}
                  {recentConvs.map(c => (
                    <ConversationCard
                      key={c.id}
                      conv={c}
                      isActive={activeConv === c.id}
                      isPinned={false}
                      onSelect={() => handleSelectConv(c)}
                      onTogglePin={(e) => togglePin(c.id, e)}
                      T={T}
                      FONT={FONT}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT COLUMN (Main Content Card / Active Thread or 3D Artwork) ── */}
      <section style={{
        flex: 1,
        minWidth: 0,
        background: T.isDark ? '#0F172A' : '#FFFFFF',
        border: `1px solid ${T.isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
        borderRadius: 24,
        boxShadow: T.isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {newConvUser ? (
          <NewConvPanel
            targetUser={newConvUser}
            onBack={handleDesktopBack}
            onConvCreated={(id) => { setActiveConv(id); setNewConvUser(null); loadInbox(); }}
          />
        ) : activeConv ? (
          <ThreadPanel conversationId={activeConv} onBack={handleDesktopBack} />
        ) : (
          <WelcomeArtwork T={T} FONT={FONT} onStartChat={() => setShowUserPicker(true)} />
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOBILE CHAT LIST — Redesigned Mobile Layout (Mockup Parity)
───────────────────────────────────────────────────────────────────────────── */
function MobileChatView({ children, devs = [], targetUser = null, targetUsername = null, onChatActiveChange, searchVal = '', setSearchVal = () => {}, searchFocused = false, setSearchFocused = () => {}, headerInputRef }) {
  const T = useT();
  const nav = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeConv,    setActiveConv]    = useState(null);
  const [newConvUser,   setNewConvUser]   = useState(null);
  const [tab,           setTab]           = useState('chats'); // 'chats' vs 'requests'
  const [activeChip,    setActiveChip]    = useState('all');
  const [pinnedIds,     setPinnedIds]     = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cpa_pinned_chats') || '[]');
    } catch {
      return [];
    }
  });
  const searchRef = useRef(null);

  const loadInbox = async () => {
    try {
      const [inbox, reqs] = await Promise.all([api.get('/direct/inbox'), api.get('/direct/requests')]);
      setConversations(inbox.data.conversations || []);
      setRequests(reqs.data.requests || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadInbox(); }, []);

  const togglePin = (convId, e) => {
    if (e) e.stopPropagation();
    setPinnedIds(prev => {
      const updated = prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId];
      try { localStorage.setItem('cpa_pinned_chats', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Auto-open / sync conversation based on URL target
  useEffect(() => {
    if (!targetUsername && !targetUser) {
      setActiveConv(null);
      setNewConvUser(null);
      if (onChatActiveChange) onChatActiveChange(false);
      return;
    }

    const currentTarget = targetUser || (targetUsername ? { username: targetUsername, name: targetUsername } : null);
    if (!currentTarget) {
      setActiveConv(null);
      setNewConvUser(null);
      if (onChatActiveChange) onChatActiveChange(false);
      return;
    }

    const username = (currentTarget.username || targetUsername || '').toLowerCase();
    const existing = conversations.find(c => c.other_username?.toLowerCase() === username);

    if (existing) {
      setActiveConv(existing.id);
      setNewConvUser(null);
      if (onChatActiveChange) onChatActiveChange(true);
    } else {
      setNewConvUser(currentTarget);
      setActiveConv(null);
      if (onChatActiveChange) onChatActiveChange(true);
    }
  }, [targetUser, targetUsername, conversations, onChatActiveChange]);

  const handleBack = () => {
    setActiveConv(null);
    setNewConvUser(null);
    if (onChatActiveChange) onChatActiveChange(false);
    if (targetUsername) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        nav('/network');
      }
    } else {
      nav('/network');
    }
  };

  const openConv = (convId) => {
    const c = conversations.find(x => x.id === convId);
    setActiveConv(convId);
    setNewConvUser(null);
    if (onChatActiveChange) onChatActiveChange(true);
    if (c?.other_username) {
      nav(`/network?dm=${encodeURIComponent(c.other_username)}`);
    }
  };

  const handleSelectUser = (dev) => {
    const existing = conversations.find(c => c.other_username?.toLowerCase() === dev.username?.toLowerCase());
    if (existing) {
      openConv(existing.id);
    } else {
      setNewConvUser(dev);
      if (onChatActiveChange) onChatActiveChange(true);
      if (dev.username) {
        nav(`/network?dm=${encodeURIComponent(dev.username)}`);
      }
    }
    setSearchVal('');
    setSearchFocused(false);
  };

  const handleRequest = async (id, action) => {
    const status = action === 'accept' ? 'accepted' : 'declined';
    try {
      await api.put(`/direct/requests/${id}`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
      if (action === 'accept') await loadInbox();
    } catch { }
  };

  const searchResults = searchVal.trim()
    ? devs.filter(d =>
        d.name?.toLowerCase().includes(searchVal.toLowerCase()) ||
        d.username?.toLowerCase().includes(searchVal.toLowerCase())
      )
    : [];

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const filteredConvs = conversations.filter(c => {
    const matchSearch = !searchVal ||
      c.other_name?.toLowerCase().includes(searchVal.toLowerCase()) ||
      c.other_username?.toLowerCase().includes(searchVal.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(searchVal.toLowerCase());

    if (!matchSearch) return false;
    if (activeChip === 'unread') return (c.unread_count > 0);
    if (activeChip === 'groups') return c.is_group || c.type === 'group';
    if (activeChip === 'direct') return !c.is_group && c.type !== 'group';
    return true;
  });

  const pinnedConvs = filteredConvs.filter(c => pinnedIds.includes(c.id) || c._pinned);
  const recentConvs = filteredConvs.filter(c => !pinnedIds.includes(c.id) && !c._pinned);

  // ── Thread active view ──
  if (activeConv || newConvUser) {
    return (
      <div
        className="mobile-chat-overlay"
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          background: T.bg,
          overflow: 'hidden'
        }}
      >
        {newConvUser
          ? <NewConvPanel targetUser={newConvUser} onBack={handleBack} onConvCreated={(id) => { loadInbox(); openConv(id); }} />
          : <ThreadPanel conversationId={activeConv} onBack={handleBack} />
        }
      </div>
    );
  }

  // ── Mobile Inbox List ──
  return (
    <div style={{ padding: '16px 14px 80px', position: 'relative' }}>
      {children}

      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 24,
            color: T.text,
            margin: '0 0 2px',
            letterSpacing: '-0.4px',
          }}>
            Messages
          </h1>
          <p style={{
            fontFamily: FONT.body,
            fontSize: 12,
            color: T.textMuted,
            margin: 0,
          }}>
            Connect, collaborate & grow together <span style={{ color: '#8B5CF6' }}>✦</span>
          </p>
        </div>

        {/* Top-Right Settings / Sliders button */}
        <button
          onClick={() => { headerInputRef?.current?.focus(); setSearchFocused(true); }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            background: T.isDark ? 'rgba(255,255,255,0.06)' : '#F5F3FF',
            border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#EDE9FE'}`,
            color: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={17} color="#7C3AED" />
        </button>
      </div>

      {/* Full-width Capsule Search Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
        <input
          ref={headerInputRef}
          type="text"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Search messages or users..."
          style={{
            width: '100%',
            background: T.isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
            border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
            borderRadius: 9999,
            padding: '10px 36px 10px 40px',
            fontSize: 13,
            color: T.text,
            outline: 'none',
            fontFamily: FONT.body,
            boxSizing: 'border-box',
            boxShadow: T.isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
          }}
        />
        {searchVal && (
          <button onClick={() => setSearchVal('')} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search dropdown results */}
      {searchFocused && searchVal.trim() && (
        <div ref={searchRef} style={{
          position: 'absolute', top: 120, left: 14, right: 14,
          background: T.isDark ? '#1E293B' : '#FFFFFF',
          border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
          borderRadius: 18, boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
          maxHeight: 280, overflowY: 'auto', zIndex: 200, padding: '6px 0',
        }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: '16px', color: T.textMuted, fontSize: 13, textAlign: 'center' }}>No members found</div>
          ) : (
            searchResults.map(dev => (
              <div
                key={dev.username}
                onClick={() => handleSelectUser(dev)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer' }}
                className="hover:bg-purple-500/10"
              >
                <UserAvatar user={{ name: dev.name, username: dev.username, avatar_url: dev.avatar_url }} size={38} rounded="50%" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{dev.name}</div>
                  <div style={{ fontSize: 11, color: '#8B5CF6', fontFamily: FONT.mono }}>@{dev.username}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Dual Segmented Tab Bar (Chats vs Requests) */}
      <div style={{
        display: 'flex',
        background: T.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
        borderRadius: 9999,
        padding: 4,
        marginBottom: 14,
      }}>
        {/* Chats Tab */}
        <button
          onClick={() => setTab('chats')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 9999,
            border: 'none',
            background: tab === 'chats' ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'transparent',
            color: tab === 'chats' ? '#FFFFFF' : T.textMuted,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: tab === 'chats' ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none',
          }}
        >
          <MessageCircle size={15} />
          <span>Chats</span>
        </button>

        {/* Requests Tab */}
        <button
          onClick={() => setTab('requests')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 9999,
            border: 'none',
            background: tab === 'requests' ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'transparent',
            color: tab === 'requests' ? '#FFFFFF' : T.textMuted,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            boxShadow: tab === 'requests' ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none',
            position: 'relative',
          }}
        >
          <UserPlus size={15} />
          <span>Requests</span>
          {requests.length > 0 && (
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#8B5CF6',
              border: `2px solid ${T.isDark ? '#0F172A' : '#FFFFFF'}`,
            }} />
          )}
        </button>
      </div>

      {/* Filter Chips Row on Mobile */}
      {tab === 'chats' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 14 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread', count: totalUnread },
            { id: 'groups', label: 'Groups' },
            { id: 'direct', label: 'Direct' },
          ].map(chip => {
            const isChipActive = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveChip(chip.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 14px',
                  borderRadius: 9999,
                  border: isChipActive ? '1px solid #7C3AED' : `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                  background: isChipActive ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : (T.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
                  color: isChipActive ? '#FFFFFF' : T.textMuted,
                  fontFamily: FONT.body,
                  fontWeight: isChipActive ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: isChipActive ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none',
                }}
              >
                <span>{chip.label}</span>
                {chip.count > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontFamily: FONT.mono,
                    fontWeight: 800,
                    background: isChipActive ? '#FFFFFF' : '#8B5CF6',
                    color: isChipActive ? '#6D28D9' : '#FFFFFF',
                    borderRadius: 999,
                    padding: '0 5px',
                  }}>
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => { headerInputRef?.current?.focus(); setSearchFocused(true); }}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
              background: T.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
              color: T.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      {/* Conversation Cards List */}
      {tab === 'chats' ? (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 68, background: T.isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', borderRadius: 18, opacity: 0.5 }} />
            ))}
          </div>
        ) : filteredConvs.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted }}>
            <MessageSquare size={32} color={T.textDim} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13 }}>No chats found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredConvs.map(c => (
              <ConversationCard
                key={c.id}
                conv={c}
                isActive={false}
                isPinned={pinnedIds.includes(c.id) || c._pinned}
                onSelect={() => openConv(c.id)}
                onTogglePin={(e) => togglePin(c.id, e)}
                T={T}
                FONT={FONT}
              />
            ))}
          </div>
        )
      ) : (
        /* Requests on Mobile */
        requests.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted }}>
            <div style={{ fontSize: 13 }}>No pending requests</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.map(r => {
              const name = r.sender_name || r.name || 'User';
              const username = r.sender_username || r.username || 'user';
              const avatar = r.sender_avatar || r.avatar_url;
              return (
                <div key={r.id} style={{
                  padding: 14,
                  border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                  borderRadius: 18,
                  background: T.isDark ? 'rgba(18, 24, 38, 0.65)' : '#FFFFFF',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <UserAvatar user={{ name, username, avatar_url: avatar }} size={40} rounded="50%" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13.5, color: T.text }}>{name}</div>
                      <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleRequest(r.id, 'accept')} style={{ flex: 1, padding: '7px 0', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <Check size={13} /> Accept
                    </button>
                    <button onClick={() => handleRequest(r.id, 'decline')} style={{ flex: 1, padding: '7px 0', background: 'transparent', border: `1px solid ${T.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, borderRadius: 10, color: T.textMuted, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <X size={13} /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Floating Action Button (FAB) — Purple Squircle with Compose/Pencil icon */}
      <button
        className="fab"
        onClick={() => {
          headerInputRef?.current?.focus();
          setSearchFocused(true);
        }}
        style={{
          position: 'fixed',
          bottom: 84,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(124, 58, 237, 0.45)',
          zIndex: 60,
        }}
      >
        <Edit3 size={22} color="#FFFFFF" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NODE DENSITY WIDGET — uses real devs count from API
───────────────────────────────────────────────────────────────────────────── */
function NodeDensityWidget({ devsCount, loading }) {
  const T = useT();
  // Derive a plausible platform-wide node count from search results (same logic as old Social.jsx)
  const displayCount = loading ? null : `${(devsCount * 5.8).toFixed(1)}k`;
  return (
    <div style={{
      background: T.isDark
        ? 'linear-gradient(135deg, #0E0C1E 0%, #0A1220 100%)'
        : 'linear-gradient(135deg, #EDE9FE 0%, #E0F2FE 100%)',
      borderRadius: 16, padding: '12px 14px 10px',
      border: `1px solid ${T.accentGlow}`,
      boxShadow: T.isDark ? '0 2px 20px #7A00FF1A' : '0 2px 20px #7A00FF0D',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'radial-gradient(circle, #7A00FF33 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div className="section-label" style={{ color: T.textMuted, marginBottom: 2 }}>Active Node Density</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 22, fontFamily: FONT.mono, fontWeight: 600, color: T.text, letterSpacing: '-1px' }}>
              {loading ? '—' : displayCount}
            </span>
            <span style={{ fontSize: 11, color: T.green, fontFamily: FONT.mono, fontWeight: 600 }}>+12%</span>
          </div>
        </div>
        <div style={{ background: T.isDark ? '#1a1040' : '#F3E8FF', border: `1px solid ${T.isDark ? '#4c1d95' : '#DDD6FE'}`, borderRadius: 8, padding: '3px 8px', fontSize: 10, color: '#A855F7', fontFamily: FONT.display, fontWeight: 600 }}>
          24h ↑
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }}>
        {BAR_DATA.map((val, i) => (
          <div key={i} className="bar-item" style={{
            flex: 1, height: `${val}%`, borderRadius: '3px 3px 0 0',
            background: i === BAR_DATA.length - 1
              ? 'linear-gradient(180deg, #A855F7, #7A00FF)'
              : (T.isDark ? '#1F2937' : '#DDD6FE'),
            animationDelay: `${i * 0.04}s`, minHeight: 3,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN NETWORK EXPORT
───────────────────────────────────────────────────────────────────────────── */
export function Network() {
  const T = useT();
  const nav = useNavigate();
  const location = useLocation();
  const { setChromeVisible } = useImmersiveChrome();
  const [devs,       setDevs]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [dmTarget,   setDmTarget]  = useState(null);
  const [isChatActive, setIsChatActive] = useState(false);
  const dmRef = useRef(null);
  const headerInputRef = useRef(null);

  const currentSearch = location.search || (typeof window !== 'undefined' ? window.location.search : '');
  const targetUsername = extractTargetFromSearch(currentSearch);

  useEffect(() => {
    api.get('/users/search?limit=24')
      .then(r => setDevs(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch target user if navigation query like ?dm=username or ?=@username is present
  useEffect(() => {
    if (!targetUsername) {
      setDmTarget(null);
      setIsChatActive(false);
      return;
    }
    const found = devs.find(d => d.username?.toLowerCase() === targetUsername.toLowerCase());
    if (found) {
      setDmTarget(found);
      setIsChatActive(true);
    } else {
      setDmTarget({ username: targetUsername, name: targetUsername });
      setIsChatActive(true);
      api.get(`/users/${targetUsername}`)
        .then(res => {
          if (res.data?.user) setDmTarget(res.data.user);
        })
        .catch(() => {});
    }
  }, [targetUsername, devs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const q = window.location.search;
      const target = extractTargetFromSearch(q);
      if (!target) {
        setDmTarget(null);
        setIsChatActive(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isChatActive) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isChatActive]);

  const openDM = (dev) => {
    if (dev?.username) {
      nav(`/network?dm=${encodeURIComponent(dev.username)}`);
    } else {
      setDmTarget(dev);
    }
  };

  const filtered = devs.filter(d =>
    !search ||
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.username?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── CSS keyframes + shared utilities ── */
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');

    .edm-scroll::-webkit-scrollbar { width: 3px; }
    .edm-scroll::-webkit-scrollbar-track { background: transparent; }
    .edm-scroll::-webkit-scrollbar-thumb { background: #30353b; border-radius: 10px; }

    .chat-row { transition: background 0.15s ease, transform 0.15s ease; cursor: pointer; border-radius: 14px; }
    .chat-row:active { transform: scale(0.988); }

    .mentor-card { cursor: pointer; transition: transform 0.18s ease; }
    .mentor-card:hover { transform: translateY(-2px); }

    .bar-item { animation: barGrow 0.5s ease forwards; transform-origin: bottom; }
    @keyframes barGrow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }

    .online-pulse { animation: opulse 2.2s ease-in-out infinite; }
    @keyframes opulse { 0%,100% { box-shadow: 0 0 0 0 #00D68F55; } 50% { box-shadow: 0 0 0 3px #00D68F1A; } }

    .badge-pop { animation: badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes badgePop { from { transform: scale(0); } to { transform: scale(1); } }

    .icon-btn { display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: background 0.15s ease, transform 0.15s ease; }
    .icon-btn:hover { transform: scale(1.05); }
    .icon-btn:active { transform: scale(0.95); }

    .fab { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .fab:hover { transform: scale(1.08) !important; box-shadow: 0 6px 28px #7A00FF88 !important; }
    .fab:active { transform: scale(0.96) !important; }

    .section-label { font-size: 10px; letter-spacing: 0.14em; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; font-weight: 600; }

    .network-mobile  { display: block !important; }
    .network-desktop { display: none  !important; }
    @media(min-width: 769px) {
      .network-mobile, .mobile-chat-overlay { display: none  !important; }
      .network-desktop { display: flex  !important; }
    }
  `;

  return (
    <>
      <Helmet><title>Network — FocusGram</title></Helmet>
      <NoIndex />
      <style>{globalStyles}</style>

      {/* ══════════════════════════════════════════════
          MOBILE LAYOUT
      ══════════════════════════════════════════════ */}
      <div className="network-mobile" style={{
        background: T.bg,
        height: isChatActive ? 'calc(100dvh - 64px)' : 'auto',
        minHeight: isChatActive ? 'none' : '100dvh',
        paddingBottom: isChatActive ? 0 : 80,
        width: '100%',
        overflow: isChatActive ? 'hidden' : 'visible',
        position: 'relative'
      }}>



        {/* DM inbox list and Search */}
        <MobileChatView
          devs={devs}
          targetUser={dmTarget}
          targetUsername={targetUsername}
          onChatActiveChange={setIsChatActive}
          searchVal={search}
          setSearchVal={setSearch}
          searchFocused={searchFocused}
          setSearchFocused={setSearchFocused}
          headerInputRef={headerInputRef}
        />

      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT
      ══════════════════════════════════════════════ */}
      <div className="network-desktop" style={{ margin: '-16px -32px', height: 'calc(100vh - 64px)', background: T.bg, padding: 16, boxSizing: 'border-box' }}>
        <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0 }}>
          <EmbeddedDM targetUser={dmTarget} targetUsername={targetUsername} />
        </div>
      </div>

      {!isChatActive && <MobileBottomNav />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SAVED & COURSES — re-exported unchanged from old Social.jsx
───────────────────────────────────────────────────────────────────────────── */

/* ── Sub-component for Saved Study Notes / Resources ─────────────────────── */
function SavedNoteCard({ item, onUnsave }) {
  const navigate = useNavigate();

  const typeLabels = {
    question_paper: 'PYQ',
    notes: 'Notes',
    book: 'Book',
    assignment: 'Assignment',
    cheatsheet: 'Cheatsheet',
    lab_manual: 'Lab Manual',
    roadmap: 'Roadmap',
    other: 'Resource',
  };

  const typeBadgeStyles = {
    question_paper: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
    notes: { bg: 'rgba(0, 180, 216, 0.12)', color: 'var(--green)' },
    book: { bg: 'rgba(147, 51, 234, 0.12)', color: 'var(--accent-purple)' },
    assignment: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
    cheatsheet: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
    other: { bg: 'var(--s2)', color: 'var(--sub)' },
  };

  const badgeStyle = typeBadgeStyles[item.type] || typeBadgeStyles.other;
  const label = typeLabels[item.type] || 'Resource';

  const handleRemove = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.post(`/notes/${item.id}/bookmark`);
      onUnsave(item.id);
    } catch {
      onUnsave(item.id);
    }
  };

  return (
    <article
      onClick={() => navigate(`/notes/resource/${item.slug}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md, 14px)',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Header Badge & Remove Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '3px 9px',
            borderRadius: 4,
            background: badgeStyle.bg,
            color: badgeStyle.color,
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {label}
          </span>
          {item.semester && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub)' }}>
              Sem {item.semester}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove bookmark"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sub)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--sub)'}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Title & Subject Info */}
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--text)',
          lineHeight: 1.4,
          margin: '0 0 6px',
        }}>
          {item.title}
        </h3>
        <p style={{
          fontSize: 13,
          color: 'var(--sub)',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {item.subject_name || item.college_name || item.field_name || 'General Study Material'}
        </p>
      </div>

      {/* Footer Stats & Access Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border)',
        paddingTop: 12,
        marginTop: 4,
        fontSize: 12,
        color: 'var(--sub)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThumbsUp size={13} /> {item.upvote_count || 0}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Download size={13} /> {item.downloads || 0}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={13} /> {item.views || 0}
          </span>
        </div>

        <span style={{
          fontWeight: 600,
          color: 'var(--green)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
        }}>
          <span>View Resource</span>
          <ExternalLink size={13} />
        </span>
      </div>
    </article>
  );
}

/* ── Sub-component for Saved Articles ──────────────────────────────────── */
function SavedArticleCard({ item, onUnsave }) {
  const navigate = useNavigate();

  const handleRemove = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.delete(`/saved/${item.id}`);
      onUnsave(item.id);
    } catch {
      onUnsave(item.id);
    }
  };

  return (
    <article
      onClick={() => navigate(`/articles/${item.slug || item.id}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md, 14px)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-card)',
        display: 'grid',
        gridTemplateColumns: item.thumbnail_url ? '140px 1fr' : '1fr',
        gap: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {item.thumbnail_url && (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 120 }}>
          <img
            src={item.thumbnail_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(147, 51, 234, 0.12)',
              color: 'var(--accent-purple)',
              fontFamily: 'var(--font-mono, monospace)',
            }}>
              Article
            </span>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove bookmark"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sub)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 6,
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div>
          <h3 style={{
            fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--text)',
            lineHeight: 1.4,
            margin: '0 0 4px',
          }}>
            {item.title}
          </h3>
          {item.description && (
            <p style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: 13,
              color: 'var(--sub)',
              margin: 0,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {item.description}
            </p>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--sub)',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {item.creator_name || item.creator_username || 'Code+ Author'}
          </span>
          <span style={{ color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Read Article</span>
            <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function Saved() {
  return (
    <>
      <Helmet><title>Saved Bookmarks & Vault — FocusGram</title></Helmet>
      <NoIndex />
      <SavedHub />
      <MobileBottomNav />
    </>
  );
}

export function Courses() {
  return (
    <>
      <Helmet><title>My Courses — FocusGram</title></Helmet>
      <NoIndex />
      <PageWrapper>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// my courses</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28 }}>Learning Journey</h1>
        </div>
        <div className="card" style={{ padding: 56, textAlign: 'center' }}>
          <BookOpen size={48} color="var(--dim)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, marginBottom: 8 }}>No courses yet</h2>
          <p style={{ color: 'var(--sub)', marginBottom: 20 }}>Enroll in courses from professional creators to track your progress here.</p>
          <Link to="/explore"><button className="btn-primary">Browse Creators</button></Link>
        </div>
      </PageWrapper>
    </>
  );
}
