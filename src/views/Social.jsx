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
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, BookOpen, Search, Trash2, ExternalLink, Eye, ThumbsUp, Download, Shield, Plus, Filter, MoreHorizontal, MessageSquare, Paperclip, Smile } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import PostCard from '../components/posts/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import NoIndex from '../components/seo/NoIndex';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useImmersiveChrome } from '../context/ImmersiveChromeContext';
import { DARK, LIGHT } from '../styles/tokens';

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
   AVATAR COMPONENT — real image or styled initials fallback
───────────────────────────────────────────────────────────────────────────── */
function UserAvatar({ user, size = 48, rounded = 13 }) {
  const color = colorForUser(user?.username || '');
  const T = useT();
  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        style={{
          width: size, height: size, borderRadius: rounded,
          objectFit: 'cover',
          border: `2px solid ${color}88`,
          boxShadow: `0 0 10px ${color}28`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: rounded,
      background: `linear-gradient(135deg, ${color}44, ${color}18)`,
      border: `2px solid ${color}88`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.27, fontWeight: 700, color,
      fontFamily: FONT.display,
      boxShadow: `0 0 10px ${color}28`,
      flexShrink: 0,
    }}>
      {initials(user?.name || user?.username)}
    </div>
  );
}



/* ─────────────────────────────────────────────────────────────────────────────
   DM THREAD PANEL — full conversation view (real API)
───────────────────────────────────────────────────────────────────────────── */
function ThreadPanel({ conversationId, onBack }) {
  const T = useT();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [other,    setOther]    = useState(null);
  const [input,    setInput]    = useState('');
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/direct/${conversationId}`);
      setMessages(res.data.messages || []);
      setOther(res.data.other_user);
    } catch { } finally { setLoading(false); }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true); load();
    pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [conversationId, load]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const body = input; setInput('');
    try {
      const res = await api.post(`/direct/${conversationId}`, { body });
      setMessages(prev => [...prev, res.data.message]);
    } catch { setInput(body); }
  };

  if (!conversationId) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: T.accentSoft, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ padding: '12px 16px', background: T.surface, borderBottom: `1px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}>
            <IconBack />
          </button>
        )}
        {other && (
          <Link to={`/u/${other.username}`} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, textDecoration: 'none' }}>
            <div style={{ position: 'relative' }}>
              <UserAvatar user={other} size={36} rounded={10} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, background: T.green, borderRadius: '50%', border: `2px solid ${T.bg}` }} />
            </div>
            <div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 14, color: T.text }}>{other.name}</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.accent }}>Active now · @{other.username}</div>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="edm-scroll" style={{ width: '100%', height: 'calc(100% - 130px)', overflowY: 'auto', padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ height: 38, borderRadius: 12, background: T.cardHover, opacity: 0.5, alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', width: `${35 + i * 8}%` }} />
          ))
        ) : messages.map(msg => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
              {!isMine && <UserAvatar user={other} size={26} rounded={7} />}
              <div style={{
                maxWidth: '68%', padding: '10px 14px',
                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMine ? T.accent : T.cardHover,
                border: isMine ? 'none' : `1px solid ${T.cardBorder}`,
                color: isMine ? '#fff' : T.text,
                fontSize: 13, lineHeight: 1.55,
                boxShadow: isMine ? `0 4px 16px ${T.accentGlow}` : 'none',
              }}>
                {msg.body}
                <div style={{ fontSize: 9, marginTop: 4, opacity: 0.55, textAlign: 'right', fontFamily: FONT.mono }}>{timeAgo(msg.created_at)}</div>
              </div>
              {isMine && <UserAvatar user={user} size={26} rounded={7} />}
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: '20px' }} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '10px 14px', background: T.surface, borderTop: `1px solid ${T.cardBorder}`, zIndex: 10, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.cardHover, borderRadius: 12, border: `1px solid ${T.cardBorder}`, padding: '6px 6px 6px 14px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            placeholder="Send a message…"
            rows={1}
            style={{ flex: 1, resize: 'none', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: T.text, fontFamily: FONT.body, padding: '6px 0', lineHeight: 1.5 }}
          />
          <button type="submit" disabled={!input.trim()} style={{
            background: input.trim() ? T.accent : T.cardHover, border: 'none',
            cursor: input.trim() ? 'pointer' : 'default',
            color: input.trim() ? '#fff' : T.textMuted,
            borderRadius: 9, padding: '8px 16px',
            fontFamily: FONT.display, fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
            boxShadow: input.trim() ? `0 4px 14px ${T.accentGlow}` : 'none', flexShrink: 0,
          }}>
            Send <IconSend size={12} />
          </button>
        </div>
      </form>
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
   EMBEDDED DM — Full Arattai-inspired Desktop Messaging Layout
───────────────────────────────────────────────────────────────────────────── */
function EmbeddedDM({ targetUser }) {
  const T = useT();
  const [conversations, setConversations] = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('chats'); // 'chats', 'direct', 'groups', 'requests'
  const [activeConv,    setActiveConv]    = useState(null);
  const [newConvUser,   setNewConvUser]   = useState(null);
  const [query,         setQuery]         = useState('');
  const [unreadOnly,    setUnreadOnly]    = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [pickerUsers,   setPickerUsers]   = useState([]);
  const searchInputRef = useRef(null);

  const loadInbox = async () => {
    try {
      const [inbox, reqs] = await Promise.all([api.get('/direct/inbox'), api.get('/direct/requests')]);
      setConversations(inbox.data.conversations || []);
      setRequests(reqs.data.requests || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadInbox(); }, []);

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

  useEffect(() => {
    if (!targetUser) return;
    const existing = conversations.find(c => c.other_username?.toLowerCase() === targetUser.username?.toLowerCase());
    if (existing) { setActiveConv(existing.id); setNewConvUser(null); }
    else          { setNewConvUser(targetUser);  setActiveConv(null); }
    setActiveTab('chats');
  }, [targetUser, conversations]);

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

  // Filter conversations
  const filteredConvs = conversations.filter(c => {
    const matchQuery = !query || c.other_name?.toLowerCase().includes(query.toLowerCase()) || c.other_username?.toLowerCase().includes(query.toLowerCase());
    const matchUnread = !unreadOnly || (c.unread_count > 0);
    const matchTab = activeTab === 'chats' || activeTab === 'direct'; // Direct & Chats both show DMs
    return matchQuery && matchUnread && matchTab;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div id="officechat" style={{ display: 'flex', height: '100%', minHeight: 560, background: T.bg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.cardBorder}`, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
      <div id="outercontainer" style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
        
        {/* ── LEFT PANEL (LHS) ── */}
        <aside id="leftpannel" style={{ width: 340, flexShrink: 0, borderRight: `1px solid ${T.cardBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.card, position: 'relative' }}>
          
          {/* LHS Header */}
          <div id="lhs_activechats" style={{ padding: '14px 16px 10px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, borderBottom: `1px solid ${T.sep}` }}>
            <div id="lhs-header-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 18, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Chats</span>
                {totalUnread > 0 && (
                  <span style={{ fontSize: 10, fontFamily: FONT.mono, fontWeight: 700, background: T.accent, color: '#fff', borderRadius: 99, padding: '1px 7px' }}>
                    {totalUnread}
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* New Chat (+) Button */}
                <button
                  onClick={() => setShowUserPicker(prev => !prev)}
                  title="New Conversation"
                  style={{ width: 30, height: 30, borderRadius: 8, background: T.surface, border: `1px solid ${T.cardBorder}`, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = T.surface}
                >
                  <Plus size={15} color={T.accent} />
                </button>
                {/* Options Menu Button */}
                <button
                  onClick={() => setActiveTab(prev => prev === 'requests' ? 'chats' : 'requests')}
                  title="Requests & Options"
                  style={{ width: 30, height: 30, borderRadius: 8, background: activeTab === 'requests' ? T.accentSoft : T.surface, border: `1px solid ${activeTab === 'requests' ? T.accent : T.cardBorder}`, color: activeTab === 'requests' ? T.accent : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
                >
                  <MoreHorizontal size={15} />
                  {requests.length > 0 && (
                    <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: T.accent, border: `2px solid ${T.card}` }} />
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color={T.textMuted} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search chats and contacts (ctrl + k)"
                style={{
                  width: '100%', background: T.surface, border: `1px solid ${T.cardBorder}`,
                  borderRadius: 10, padding: '8px 30px 8px 34px', fontSize: 12,
                  color: T.text, outline: 'none', fontFamily: FONT.body,
                  boxSizing: 'border-box', transition: 'all 0.15s ease'
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e => e.currentTarget.style.borderColor = T.cardBorder}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick User Picker Dropdown Overlay */}
            {showUserPicker && (
              <div style={{ position: 'absolute', top: 96, left: 12, right: 12, zIndex: 100, background: T.surface, border: `1px solid ${T.accentGlow}`, borderRadius: 12, padding: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.sep}` }}>
                  <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 12, color: T.text }}>Start New Chat</span>
                  <button onClick={() => setShowUserPicker(false)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}><X size={13} /></button>
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pickerUsers.map(dev => (
                    <div
                      key={dev.id}
                      onClick={() => {
                        setNewConvUser(dev);
                        setActiveConv(null);
                        setShowUserPicker(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <UserAvatar user={dev} size={28} rounded={8} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dev.name}</div>
                        <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.accent }}>@{dev.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horizontal Filter Tabs (Chats | Channels | Direct | Groups | Requests) */}
            <div id="art-chats" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 2 }}>
              <div id="lhs_chat_folders_list" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
                {[
                  { id: 'chats', label: 'Chats', count: conversations.length },
                  { id: 'direct', label: 'Direct' },
                  { id: 'groups', label: 'Groups' },
                  { id: 'requests', label: 'Requests', count: requests.length },
                ].map(tabItem => (
                  <button
                    key={tabItem.id}
                    onClick={() => setActiveTab(tabItem.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                      borderRadius: 999, border: `1px solid ${activeTab === tabItem.id ? T.accent : T.cardBorder}`,
                      background: activeTab === tabItem.id ? T.accentSoft : 'transparent',
                      color: activeTab === tabItem.id ? T.accent : T.textMuted,
                      fontFamily: FONT.body, fontWeight: 600, fontSize: 11,
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{tabItem.label}</span>
                    {tabItem.count > 0 && (
                      <span style={{ fontSize: 9, fontFamily: FONT.mono, background: activeTab === tabItem.id ? T.accent : T.cardBorder, color: activeTab === tabItem.id ? '#fff' : T.textMuted, borderRadius: 99, padding: '0 5px' }}>
                        {tabItem.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Unread Filter Toggle */}
              <button
                onClick={() => setUnreadOnly(prev => !prev)}
                title={unreadOnly ? "Show all chats" : "Filter unread chats"}
                style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: unreadOnly ? T.accentSoft : 'transparent',
                  border: `1px solid ${unreadOnly ? T.accent : T.cardBorder}`,
                  color: unreadOnly ? T.accent : T.textMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s'
                }}
              >
                <Filter size={12} />
              </button>
            </div>
          </div>

          {/* LHS Chat List Items */}
          <div id="lhs_chatlist" className="edm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 62, background: T.cardHover, borderRadius: 12, marginBottom: 6, opacity: 0.3 }} />
              ))
            ) : activeTab === 'requests' ? (
              requests.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                  <IconMsg size={28} color={T.textDim} />
                  <p style={{ fontFamily: FONT.mono, fontSize: 11, marginTop: 8 }}>No pending requests</p>
                </div>
              ) : (
                requests.map(r => {
                  const name = r.sender_name || r.name || 'User';
                  const username = r.sender_username || r.username || 'user';
                  const avatar = r.sender_avatar || r.avatar_url;
                  return (
                    <div key={r.id} style={{ padding: 12, border: `1px solid ${T.cardBorder}`, borderRadius: 12, marginBottom: 8, background: T.surface }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <UserAvatar user={{ name, username, avatar_url: avatar }} size={36} rounded={10} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13, color: T.text }}>{name}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleRequest(r.id, 'accept')} style={{ flex: 1, padding: 6, background: T.accentSoft, border: `1px solid ${T.accent}40`, borderRadius: 8, color: T.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Check size={12} /> Accept
                        </button>
                        <button onClick={() => handleRequest(r.id, 'decline')} style={{ flex: 1, padding: 6, background: 'transparent', border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <X size={12} /> Decline
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>
                <IconSearch size={28} color={T.textDim} />
                <p style={{ fontFamily: FONT.mono, fontSize: 11, marginTop: 8 }}>No matching chats</p>
              </div>
            ) : (
              filteredConvs.map(c => {
                const isActive = activeConv === c.id;
                const unread = c.unread_count || 0;
                const role = roleBadge(c.other_account_type);
                return (
                  <div
                    key={c.id}
                    className="art-chat-item"
                    onClick={() => { setActiveConv(c.id); setNewConvUser(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 12px', borderRadius: 12, cursor: 'pointer',
                      transition: 'all 0.15s ease', marginBottom: 2,
                      background: isActive ? `${T.accent}18` : unread > 0 ? (T.isDark ? '#0F1220' : '#F5F3FF') : 'transparent',
                      borderLeft: isActive ? `3.5px solid ${T.accent}` : '3.5px solid transparent',
                      boxShadow: isActive ? `0 2px 12px ${T.accent}15` : 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.cardHover; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = unread > 0 ? (T.isDark ? '#0F1220' : '#F5F3FF') : 'transparent'; }}
                  >
                    {/* User Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <UserAvatar user={{ name: c.other_name, username: c.other_username, avatar_url: c.other_avatar }} size={42} rounded={12} />
                    </div>

                    {/* Chat details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                          <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13.5, color: isActive ? T.accent : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.other_name || c.other_username}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 700, background: role.bg, color: role.text, border: `1px solid ${role.border}`, borderRadius: 4, padding: '0 4px', fontFamily: FONT.mono, flexShrink: 0 }}>
                            {role.label}
                          </span>
                        </div>
                        <span style={{ fontFamily: FONT.mono, fontSize: 9.5, color: T.textMuted, flexShrink: 0 }}>
                          {timeAgo(c.last_message_at)}
                        </span>
                      </div>

                      {/* Last message preview */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ fontSize: 11.5, color: unread > 0 ? T.text : T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread > 0 ? 600 : 400, fontFamily: FONT.body }}>
                          {c.last_message ? (
                            <span>{c.last_message}</span>
                          ) : (
                            <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Start a conversation</span>
                          )}
                        </div>
                        {unread > 0 && (
                          <span style={{ minWidth: 18, height: 18, background: T.accent, borderRadius: '50%', fontSize: 9.5, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0, boxShadow: `0 2px 8px ${T.accentGlow}` }}>
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT MAIN PANEL (#midcontainer / #chatsection) ── */}
        <section id="midcontainer" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: T.bg, position: 'relative' }}>
          {newConvUser ? (
            <NewConvPanel
              targetUser={newConvUser}
              onBack={() => setNewConvUser(null)}
              onConvCreated={(id) => { setActiveConv(id); setNewConvUser(null); loadInbox(); }}
            />
          ) : activeConv ? (
            <ThreadPanel conversationId={activeConv} />
          ) : (
            /* DEFAULT EMPTY HOME STATE (#art-home) */
            <div id="art-home" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              
              {/* Background Accent Glow */}
              <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, height: 300, background: `radial-gradient(circle, ${T.accent}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

              {/* Logo / Messaging Icon */}
              <div style={{ width: 84, height: 84, borderRadius: '50%', background: `linear-gradient(135deg, ${T.accent}22, ${T.purple || '#9333EA'}22)`, border: `2px solid ${T.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: `0 12px 36px ${T.accentGlow}` }}>
                <IconMsg size={40} color={T.accent} />
              </div>

              {/* Title & Subtitle */}
              <h2 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 24, color: T.text, margin: '0 0 10px', letterSpacing: '-0.4px' }}>
                Simple and secure messaging
              </h2>
              <p style={{ fontFamily: FONT.body, fontSize: 14, color: T.textMuted, maxWidth: 380, margin: '0 0 28px', lineHeight: 1.6 }}>
                Start a conversation and get together with people who matter the most
              </p>

              {/* End-to-end encryption shield label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 999, background: T.surface, border: `1px solid ${T.cardBorder}`, fontSize: 12, color: T.textMuted, fontFamily: FONT.mono }}>
                <Shield size={15} color={T.green} />
                <span>Your direct chats and calls are end-to-end encrypted</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOBILE CHAT LIST — X-style, backed by real /direct/inbox
───────────────────────────────────────────────────────────────────────────── */
function MobileChatView({ children, devs = [], onChatActiveChange, searchVal = '', setSearchVal = () => {}, searchFocused = false, setSearchFocused = () => {}, headerInputRef }) {
  const T = useT();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeConv,    setActiveConv]    = useState(null);
  const [newConvUser,   setNewConvUser]   = useState(null);
  const [tab,           setTab]           = useState('inbox');
  const searchRef = useRef(null);

  const loadInbox = async () => {
    try {
      const [inbox, reqs] = await Promise.all([api.get('/direct/inbox'), api.get('/direct/requests')]);
      setConversations(inbox.data.conversations || []);
      setRequests(reqs.data.requests || []);
    } catch { } finally { setLoading(false); }
  };

  const handleRequest = async (id, action) => {
    const status = action === 'accept' ? 'accepted' : 'declined';
    try {
      await api.put(`/direct/requests/${id}`, { status });
      setRequests(prev => prev.filter(r => r.id !== id));
      if (action === 'accept') await loadInbox();
    } catch { }
  };

  useEffect(() => { loadInbox(); }, []);

  useEffect(() => {
    const handler = (e) => {
      const clickedSearch = searchRef.current && searchRef.current.contains(e.target);
      const clickedHeaderInput = headerInputRef?.current && headerInputRef.current.contains(e.target);
      if (!clickedSearch && !clickedHeaderInput) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [headerInputRef, setSearchFocused]);

  // Mark read on open
  const openConv = (convId) => {
    setActiveConv(convId);
    setNewConvUser(null);
    if (onChatActiveChange) onChatActiveChange(true);
  };

  const handleSelectUser = (dev) => {
    const existing = conversations.find(c => c.other_username === dev.username);
    if (existing) {
      openConv(existing.id);
    } else {
      setNewConvUser(dev);
      if (onChatActiveChange) onChatActiveChange(true);
    }
    setSearchVal('');
    setSearchFocused(false);
  };

  const searchResults = searchVal.trim()
    ? devs.filter(d =>
        d.name?.toLowerCase().includes(searchVal.toLowerCase()) ||
        d.username?.toLowerCase().includes(searchVal.toLowerCase())
      )
    : [];

  const filteredConvs = conversations.filter(c =>
    !searchVal ||
    c.other_name?.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.other_username?.toLowerCase().includes(searchVal.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(searchVal.toLowerCase())
  );

  // ── If viewing a thread, show full thread view ──
  if (activeConv || newConvUser) {
    return (
      <div
        className="mobile-chat-overlay"
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          bottom: 76,
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          background: T.bg,
          overflow: 'hidden'
        }}
      >
        {newConvUser
          ? <NewConvPanel targetUser={newConvUser} onBack={() => { setNewConvUser(null); if (onChatActiveChange) onChatActiveChange(false); }} onConvCreated={(id) => { loadInbox(); openConv(id); }} />
          : <ThreadPanel conversationId={activeConv} onBack={() => { setActiveConv(null); if (onChatActiveChange) onChatActiveChange(false); }} />
        }
      </div>
    );
  }

  // ── Inbox list ──
  return (
    <div style={{ padding: '0 0 16px' }}>
      {children}

      {!activeConv && !newConvUser && searchFocused && searchVal.trim() && (
        <div ref={searchRef} style={{
          position: 'fixed', top: 120, left: 14, right: 14,
          background: T.surface, border: `1px solid ${T.cardBorder}`,
          borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          maxHeight: 280, overflowY: 'auto', zIndex: 200, padding: '6px 0',
        }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '16px', color: T.textMuted, fontSize: 13, fontFamily: FONT.display, textAlign: 'center' }}>
                No members found
              </div>
            ) : (
              searchResults.map(dev => {
                const role = roleBadge(dev.account_type);
                return (
                  <div
                    key={dev.username}
                    onClick={() => handleSelectUser(dev)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <UserAvatar user={{ name: dev.name, username: dev.username, avatar_url: dev.avatar_url }} size={36} rounded={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dev.name}
                        </span>
                        <span style={{ fontSize: 8, fontWeight: 600, background: role.bg, color: role.text, border: `1px solid ${role.border}`, borderRadius: 4, padding: '0px 4px', fontFamily: FONT.mono }}>
                          {role.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, fontFamily: FONT.mono }}>
                        @{dev.username}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
      )}

      {/* Tabs Switcher on Mobile */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px', marginBottom: 12 }}>
        {['inbox', 'requests'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: FONT.mono, fontSize: 10, padding: '6px 14px', borderRadius: 999,
              border: `1px solid ${tab === t ? T.accent : T.cardBorder}`,
              background: tab === t ? T.accentSoft : 'transparent',
              color: tab === t ? T.accent : T.textMuted,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.8px',
              transition: 'all 0.2s', position: 'relative',
            }}
          >
            {t === 'inbox' ? 'Chats' : 'Requests'}
            {t === 'requests' && requests.length > 0 && (
              <span className="badge-pop" style={{
                position: 'absolute', top: -4, right: -4, width: 14, height: 14,
                background: T.accent, borderRadius: '50%', fontSize: 8,
                fontWeight: 700, color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Message requests banner/prompt (tap to switch to requests tab) */}
      {tab === 'inbox' && requests.length > 0 && (
        <div
          onClick={() => setTab('requests')}
          style={{ margin: '0 14px 10px', padding: '10px 14px', borderRadius: 12, background: T.accentSoft, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 13, color: T.text }}>Message Requests</span>
          <span style={{ background: T.accent, color: '#fff', borderRadius: 999, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: FONT.mono, padding: '0 5px' }}>{requests.length}</span>
        </div>
      )}

      {tab === 'inbox' ? (
        <>
          {/* Pinned section label */}
          {filteredConvs.some(c => c._pinned) && (
            <div style={{ padding: '4px 14px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconPin size={10} color={T.textMuted} />
              <span style={{ fontSize: 10, letterSpacing: '0.14em', fontFamily: FONT.mono, textTransform: 'uppercase', fontWeight: 600, color: T.textMuted }}>Pinned</span>
            </div>
          )}

          {/* Conversation rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '0 8px' }}>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', opacity: 0.4 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: T.cardHover, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 11, background: T.cardHover, borderRadius: 4, marginBottom: 6, width: '55%' }} />
                    <div style={{ height: 9, background: T.cardHover, borderRadius: 4, width: '80%' }} />
                  </div>
                </div>
              ))
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted, fontFamily: FONT.display }}>
                <IconSearch size={32} color={T.textDim} />
                <div style={{ marginTop: 10, fontSize: 13 }}>No chats found</div>
              </div>
            ) : filteredConvs.map(c => {
              const role = roleBadge(c.other_account_type);
              const color = colorForUser(c.other_username);
              const unread = c.unread_count || 0;
              return (
                <div
                  key={c.id}
                  className="chat-row"
                  onClick={() => openConv(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '11px 12px', borderRadius: 14,
                    background: unread > 0 ? (T.isDark ? '#0F122080' : '#F5F3FF80') : 'transparent',
                    border: unread > 0 ? `1px solid ${T.isDark ? '#2D1B6918' : '#DDD6FE44'}` : '1px solid transparent',
                    cursor: 'pointer', transition: 'background 0.15s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = unread > 0 ? (T.isDark ? '#0F122080' : '#F5F3FF80') : 'transparent'}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <UserAvatar user={{ name: c.other_name, username: c.other_username, avatar_url: c.other_avatar }} size={48} rounded={13} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: FONT.display, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                        {c.other_name}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 600, background: role.bg, color: role.text, border: `1px solid ${role.border}`, borderRadius: 5, padding: '1px 5px', fontFamily: FONT.mono, flexShrink: 0 }}>
                        {role.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: unread > 0 ? T.text : T.textMuted, fontFamily: FONT.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread > 0 ? 500 : 400 }}>
                      {c.last_message || 'Start a conversation'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: T.textMuted, fontFamily: FONT.mono }}>{timeAgo(c.last_message_at)}</span>
                    {unread > 0 && (
                      <div className="badge-pop" style={{ background: T.accent, color: '#fff', borderRadius: 99, minWidth: 19, height: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: FONT.mono, padding: '0 5px', boxShadow: `0 2px 8px ${T.accentGlow}` }}>
                        {unread}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 14px' }}>
          {requests.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted, fontFamily: FONT.display }}>
              <div style={{ fontSize: 13 }}>No pending requests</div>
            </div>
          ) : (
            requests.map(r => {
              const name = r.sender_name || r.name || 'User';
              const username = r.sender_username || r.username || 'user';
              const avatar = r.sender_avatar || r.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
              return (
                <div key={r.id} style={{ padding: '12px', border: `1px solid ${T.cardBorder}`, borderRadius: 14, background: T.surface }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <UserAvatar user={{ name, username, avatar_url: avatar }} size={36} rounded={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleRequest(r.id, 'accept')} style={{ flex: 1, padding: '7px 0', background: T.accentSoft, border: `1px solid ${T.accent}40`, borderRadius: 8, color: T.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Check size={12} /> Accept
                    </button>
                    <button onClick={() => handleRequest(r.id, 'decline')} style={{ flex: 1, padding: '7px 0', background: 'transparent', border: `1px solid ${T.cardBorder}`, borderRadius: 8, color: T.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <X size={12} /> Decline
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Compose FAB */}
      <button
        className="fab"
        onClick={() => {
          headerInputRef.current?.focus();
          setSearchFocused(true);
        }}
        style={{
          position: 'fixed', bottom: 80, right: 20, width: 50, height: 50,
          borderRadius: 15, background: `linear-gradient(135deg, #9B33FF, ${T.accent})`,
          border: 'none', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer',
          boxShadow: `0 4px 20px ${T.accentGlow}`, zIndex: 50
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
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
  const { setChromeVisible } = useImmersiveChrome();
  const [devs,       setDevs]      = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [dmTarget,   setDmTarget]  = useState(null);
  const [isChatActive, setIsChatActive] = useState(false);
  const dmRef = useRef(null);
  const headerInputRef = useRef(null);

  useEffect(() => {
    api.get('/users/search?limit=24')
      .then(r => setDevs(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
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
    setDmTarget(dev);
    setTimeout(() => dmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
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
      <Helmet><title>Network — Code+ Academy</title></Helmet>
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

        {/* Sticky top bar — X style with Integrated Inline Search */}
        {!isChatActive && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: T.overlay, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${T.cardBorder}`,
            padding: '8px 14px', /* Slightly tighter padding for header alignment */
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
          }}>
            
            {/* Left side: Title + New Integrated Oval Search Capsule */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT.display, color: T.text, letterSpacing: '-0.3px', flexShrink: 0 }}>
                Messages
              </span>
              
              {/* INLINE OVAL SEARCH CAPSULE: Migrated directly into the header row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', /* Tighter internal dimensions for header sizing */
                borderRadius: 999, 
                background: T.surface,
                border: `1px solid ${T.cardBorder}`,
                flex: 1,
                minWidth: 0,
                transition: 'all 0.18s ease',
              }}>
                <IconSearch size={12} color={T.textMuted} style={{ flexShrink: 0 }} />
                <input
                  ref={headerInputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search..."
                  style={{ 
                    width: '100%', color: T.text, fontSize: 12, 
                    fontFamily: FONT.body, outline: 'none', 
                    background: 'none', border: 'none' 
                  }}
                />
              </div>
            </div>
          </div>
        )}



        {/* DM inbox list and Search */}
        <MobileChatView devs={devs} onChatActiveChange={setIsChatActive} searchVal={search} setSearchVal={setSearch} searchFocused={searchFocused} setSearchFocused={setSearchFocused} headerInputRef={headerInputRef}>
        </MobileChatView>

      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT
      ══════════════════════════════════════════════ */}
      <div className="network-desktop" style={{ margin: '-16px -32px', height: 'calc(100vh - 64px)', background: T.bg, padding: 16, boxSizing: 'border-box' }}>
        <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0 }}>
          <EmbeddedDM targetUser={dmTarget} />
        </div>
      </div>


      </div>

      <MobileBottomNav />
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    api.get('/saved')
      .then(r => setItems(r.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Counts by category
  const notesCount = items.filter(i => i.item_kind === 'note').length;
  const articlesCount = items.filter(i => i.item_kind === 'article' || i.type === 'article').length;
  const postsCount = items.filter(i => i.item_kind === 'post' || (!i.item_kind && i.type !== 'article')).length;

  // Filter items based on activeTab and searchQuery
  const filteredItems = items.filter(item => {
    if (activeTab === 'notes' && item.item_kind !== 'note') return false;
    if (activeTab === 'articles' && item.item_kind !== 'article' && item.type !== 'article') return false;
    if (activeTab === 'posts' && item.item_kind !== 'post' && (item.item_kind || item.type === 'article')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const authorMatch = (item.creator_name || item.creator_username)?.toLowerCase().includes(q);
      const subjectMatch = item.subject_name?.toLowerCase().includes(q);
      return titleMatch || descMatch || authorMatch || subjectMatch;
    }
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    if (sortBy === 'popular') {
      const popA = (a.upvote_count || a.clap_count || 0) + (a.views || 0);
      const popB = (b.upvote_count || b.clap_count || 0) + (b.views || 0);
      return popB - popA;
    }
    return new Date(b.saved_at || b.created_at) - new Date(a.saved_at || a.created_at);
  });

  return (
    <>
      <Helmet><title>Saved Bookmarks — Code+ Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 760 }}>
        {/* Page Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>
            // bookmarks library
          </div>
          <h1 style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)', fontWeight: 800, fontSize: 28, color: 'var(--text)', margin: 0 }}>
            Saved Items
          </h1>
          <p style={{ color: 'var(--sub)', fontSize: 14, marginTop: 4 }}>
            Access all your saved study notes, articles, and community posts in one place.
          </p>
        </div>

        {/* Search & Sort Controls Bar */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}>
          {/* Search Input */}
          <div style={{
            flex: 1,
            minWidth: 240,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={16} style={{ position: 'absolute', left: 14, color: 'var(--sub)' }} />
            <input
              type="text"
              placeholder="Search saved titles, subjects, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 'var(--r-md, 10px)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: 'var(--sub)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--r-md, 10px)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="recent">Recently Saved</option>
            <option value="popular">Most Popular</option>
            <option value="title">Title (A - Z)</option>
          </select>
        </div>

        {/* Content Type Filter Pills */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          {[
            { id: 'all', label: 'All Items', count: items.length },
            { id: 'notes', label: 'Notes & PYQs', count: notesCount },
            { id: 'articles', label: 'Articles', count: articlesCount },
            { id: 'posts', label: 'Community Posts', count: postsCount },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: activeTab === tab.id ? 'var(--green-dim, rgba(0,180,216,0.15))' : 'var(--surface)',
                borderColor: activeTab === tab.id ? 'var(--green)' : 'var(--border)',
                color: activeTab === tab.id ? 'var(--green)' : 'var(--sub)',
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 10,
                background: activeTab === tab.id ? 'var(--green)' : 'var(--s2)',
                color: activeTab === tab.id ? '#000' : 'var(--sub)',
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bookmarks List Render */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(4)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md, 16px)' }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🔖</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: '0 0 6px' }}>
              {searchQuery ? 'No matching bookmarks found' : 'No saved items in this category'}
            </h3>
            <p style={{ color: 'var(--sub)', fontSize: 14, maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.5 }}>
              {searchQuery 
                ? `No bookmarks matched "${searchQuery}". Try a different keyword.` 
                : 'Bookmark study resources, lecture notes, articles, or feed posts to organize your learning library.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/notes"><button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>Browse Notes</button></Link>
              <Link to="/feed"><button className="btn-secondary" style={{ padding: '8px 18px', fontSize: 13 }}>Browse Feed</button></Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedItems.map(item => {
              if (item.item_kind === 'note') {
                return <SavedNoteCard key={`note-${item.id}`} item={item} onUnsave={handleUnsave} />;
              }
              if (item.item_kind === 'article' || item.type === 'article') {
                return <SavedArticleCard key={`art-${item.id}`} item={item} onUnsave={handleUnsave} />;
              }
              return (
                <PostCard
                  key={`post-${item.id}`}
                  post={{ ...item, is_saved: true }}
                  onSaveToggle={handleUnsave}
                />
              );
            })}
          </div>
        )}
      </PageWrapper>
      <MobileBottomNav />
    </>
  );
}

export function Courses() {
  return (
    <>
      <Helmet><title>My Courses — Code+ Academy</title></Helmet>
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
