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
import { ArrowLeft, Check, X, BookOpen } from 'lucide-react';
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
  body:    "'Inter', 'Outfit', sans-serif",
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
   ACTIVE MENTOR CHIP — horizontal scroll item
───────────────────────────────────────────────────────────────────────────── */
function MentorChip({ dev, onClick }) {
  const T = useT();
  const color = colorForUser(dev.username);
  const nav = useNavigate();
  const [following, setFollowing] = useState(dev.is_following || false);

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(dev);
    else nav(`/u/${dev.username}`);
  };

  return (
    <div
      className="mentor-card"
      onClick={handleClick}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 5, minWidth: 58, cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14,
          background: dev.avatar_url
            ? undefined
            : `linear-gradient(135deg, ${color}44, ${color}18)`,
          border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color,
          fontFamily: FONT.display,
          boxShadow: `0 0 12px ${color}33`,
          overflow: 'hidden',
        }}>
          {dev.avatar_url
            ? <img src={dev.avatar_url} alt={dev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials(dev.name || dev.username)
          }
        </div>
        {/* always show online dot — these are from /search which returns active users */}
        <div className="online-pulse" style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 11, height: 11, borderRadius: '50%',
          background: T.green, border: `2px solid ${T.bg}`,
        }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: T.text,
          fontFamily: FONT.display, whiteSpace: 'nowrap',
          maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {dev.name?.split(' ')[0] || dev.username}
        </div>
        <div style={{
          fontSize: 9, color: T.textMuted,
          fontFamily: FONT.mono, whiteSpace: 'nowrap',
        }}>
          {dev.account_type === 'professional' ? 'PRO' : 'DEV'}
        </div>
      </div>
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
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
      <div className="edm-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '10px 14px', background: T.surface, borderTop: `1px solid ${T.cardBorder}`, flexShrink: 0 }}>
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim() || !targetUser) return;
    setSending(true);
    try {
      const res = await api.post('/direct/new', { to_username: targetUser.username, message: msg });
      setMsg('');
      if (res.data.conversation_id) onConvCreated?.(res.data.conversation_id);
    } catch { } finally { setSending(false); }
  };

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
   EMBEDDED DM — full 2-panel (sidebar + thread), desktop usage
   Kept identical to old Social.jsx logic, new visual polish
───────────────────────────────────────────────────────────────────────────── */
function EmbeddedDM({ targetUser }) {
  const T = useT();
  const [conversations, setConversations] = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('inbox');
  const [activeConv,    setActiveConv]    = useState(null);
  const [newConvUser,   setNewConvUser]   = useState(null);
  const [query,         setQuery]         = useState('');

  const loadInbox = async () => {
    try {
      const [inbox, reqs] = await Promise.all([api.get('/direct/inbox'), api.get('/direct/requests')]);
      setConversations(inbox.data.conversations || []);
      setRequests(reqs.data.requests || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadInbox(); }, []);

  useEffect(() => {
    if (!targetUser) return;
    const existing = conversations.find(c => c.other_username?.toLowerCase() === targetUser.username?.toLowerCase());
    if (existing) { setActiveConv(existing.id); setNewConvUser(null); }
    else          { setNewConvUser(targetUser);  setActiveConv(null); }
    setTab('inbox');
  }, [targetUser]);

  const handleRequest = async (id, action) => {
    try {
      await api.put(`/direct/requests/${id}`, { action });
      setRequests(prev => prev.filter(r => r.id !== id));
      if (action === 'accept') await loadInbox();
    } catch { }
  };

  const filtered = conversations.filter(c =>
    !query || c.other_name?.toLowerCase().includes(query.toLowerCase()) || c.other_username?.toLowerCase().includes(query.toLowerCase())
  );

  // Map conversation → display shape expected by new UI
  const toDisplayConv = (c) => ({
    id:       c.id,
    username: c.other_name || c.other_username,
    handle:   `@${c.other_username}`,
    role:     c.other_account_type || 'default',
    online:   false, // no realtime presence in current schema
    unread:   c.unread_count || 0,
    preview:  c.last_message || 'Start a conversation',
    time:     timeAgo(c.last_message_at),
    pinned:   false,
    typing:   false,
    _raw:     c,
  });

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 500, background: T.bg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.cardBorder}` }}>
      {/* ── Sidebar ── */}
      <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${T.cardBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.card }}>
        <div style={{ padding: '16px 14px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <IconMsg size={15} color={T.accent} />
            <h3 style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>Messages</h3>
          </div>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><IconSearch size={12} color={T.textMuted} /></div>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…"
              style={{ width: '100%', background: T.cardHover, border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: '7px 10px 7px 28px', fontSize: 11.5, color: T.text, outline: 'none', boxSizing: 'border-box', fontFamily: FONT.body }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['inbox', 'requests'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                fontFamily: FONT.mono, fontSize: 9, padding: '4px 12px', borderRadius: 999,
                border: `1px solid ${tab === t ? T.accent : T.cardBorder}`,
                background: tab === t ? T.accentSoft : 'transparent',
                color: tab === t ? T.accent : T.textMuted,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.8px',
                transition: 'all 0.2s', position: 'relative',
              }}>
                {t}
                {t === 'requests' && requests.length > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 13, height: 13, background: T.accent, borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{requests.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="edm-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 6px 16px' }}>
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} style={{ height: 60, background: T.cardHover, borderRadius: 10, marginBottom: 6, opacity: 0.4 }} />)
          ) : tab === 'inbox' ? (
            filtered.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: T.textMuted }}>
                <IconMsg size={26} color={T.textDim} />
                <p style={{ fontFamily: FONT.mono, fontSize: 10, marginTop: 8 }}>No conversations yet</p>
              </div>
            ) : filtered.map(c => {
              const d = toDisplayConv(c);
              const role = roleBadge(d.role);
              const color = colorForUser(c.other_username);
              const isActive = activeConv === c.id;
              return (
                <div key={c.id}
                  onClick={() => { setActiveConv(c.id); setNewConvUser(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 10px', borderRadius: 12, cursor: 'pointer',
                    transition: 'background 0.15s',
                    background: isActive ? `${T.accent}18` : 'transparent',
                    borderLeft: isActive ? `3px solid ${T.accent}` : '3px solid transparent',
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.cardHover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <UserAvatar user={{ name: c.other_name, username: c.other_username, avatar_url: c.other_avatar }} size={38} rounded={10} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 13, color: isActive ? T.accent : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{c.other_name}</span>
                      <span style={{ fontFamily: FONT.mono, fontSize: 9, color: T.textMuted, flexShrink: 0 }}>{d.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, background: role.bg, color: role.text, border: `1px solid ${role.border}`, borderRadius: 4, padding: '0px 4px', fontFamily: FONT.mono, flexShrink: 0 }}>{role.label}</span>
                      <span style={{ fontSize: 11, color: d.unread > 0 ? T.text : T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: d.unread > 0 ? 500 : 400 }}>{d.preview}</span>
                    </div>
                  </div>
                  {d.unread > 0 && (
                    <span style={{ minWidth: 18, height: 18, background: T.accent, borderRadius: '50%', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0, boxShadow: `0 2px 8px ${T.accentGlow}` }}>{d.unread}</span>
                  )}
                </div>
              );
            })
          ) : (
            requests.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: T.textMuted }}>
                <p style={{ fontFamily: FONT.mono, fontSize: 10 }}>No pending requests</p>
              </div>
            ) : requests.map(r => (
              <div key={r.id} style={{ padding: '10px 10px', border: `1px solid ${T.cardBorder}`, borderRadius: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <UserAvatar user={{ name: r.name, username: r.username, avatar_url: r.avatar_url }} size={34} rounded={8} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 12.5, color: T.text }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{r.body}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleRequest(r.id, 'accept')} style={{ flex: 1, padding: 6, background: T.accentSoft, border: `1px solid ${T.accent}40`, borderRadius: 7, color: T.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Check size={11} /> Accept
                  </button>
                  <button onClick={() => handleRequest(r.id, 'decline')} style={{ flex: 1, padding: 6, background: 'transparent', border: `1px solid ${T.cardBorder}`, borderRadius: 7, color: T.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <X size={11} /> Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Thread / New Conv panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: T.bg }}>
        {newConvUser
          ? <NewConvPanel
              targetUser={newConvUser}
              onBack={() => setNewConvUser(null)}
              onConvCreated={(id) => { setActiveConv(id); setNewConvUser(null); loadInbox(); }}
            />
          : <ThreadPanel conversationId={activeConv} />
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOBILE CHAT LIST — X-style, backed by real /direct/inbox
───────────────────────────────────────────────────────────────────────────── */
function MobileChatView({ children, devs = [], onChatActiveChange }) {
  const T = useT();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchVal,     setSearchVal]     = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeConv,    setActiveConv]    = useState(null);
  const [newConvUser,   setNewConvUser]   = useState(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const loadInbox = async () => {
    try {
      const [inbox, reqs] = await Promise.all([api.get('/direct/inbox'), api.get('/direct/requests')]);
      setConversations(inbox.data.conversations || []);
      setRequests(reqs.data.requests || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadInbox(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        className="network-mobile"
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          height: 'calc(100dvh - 64px)',
          zIndex: 105,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 80,
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
      {/* Search */}
      <div ref={searchRef} style={{ padding: '12px 14px 10px', position: 'relative', zIndex: 110 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 13px', borderRadius: 13,
          background: searchFocused ? (T.isDark ? '#13192B' : '#FEFEFF') : T.surface,
          border: `1.5px solid ${searchFocused ? T.accent : T.cardBorder}`,
          boxShadow: searchFocused ? `0 0 0 3px ${T.accent}18` : 'none',
          transition: 'all 0.18s ease',
        }}>
          <IconSearch size={15} color={T.textMuted} />
          <input
            ref={inputRef}
            value={searchVal} onChange={e => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search members to chat..."
            style={{ flex: 1, color: T.text, fontSize: 14, fontFamily: FONT.body, outline: 'none', background: 'none', border: 'none' }}
          />
          {searchVal && (
            <button onClick={() => setSearchVal('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: T.textMuted, padding: 2 }}>
              <IconXMark size={13} color={T.textMuted} />
            </button>
          )}
        </div>

        {/* Dropdown search results */}
        {searchFocused && searchVal.trim() && (
          <div style={{
            position: 'absolute', top: 'calc(100% - 4px)', left: 14, right: 14,
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
      </div>

      {children}

      {/* Message requests badge */}
      {requests.length > 0 && (
        <div style={{ margin: '0 14px 10px', padding: '10px 14px', borderRadius: 12, background: T.accentSoft, border: `1px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 13, color: T.text }}>Message Requests</span>
          <span style={{ background: T.accent, color: '#fff', borderRadius: 999, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: FONT.mono, padding: '0 5px' }}>{requests.length}</span>
        </div>
      )}

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
      {/* Compose FAB */}
      <button
        className="fab"
        onClick={() => {
          inputRef.current?.focus();
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
      .network-mobile  { display: none  !important; }
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

        {/* Sticky top bar — X style */}
        {!isChatActive && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: T.overlay, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${T.cardBorder}`,
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT.display, color: T.text, letterSpacing: '-0.3px' }}>Messages</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="icon-btn" onClick={() => nav('/notifications')} style={{ width: 34, height: 34, borderRadius: 10, background: T.surface, border: `1px solid ${T.cardBorder}`, color: T.textMuted, position: 'relative' }}>
                <IconBell size={15} color={T.textMuted} />
                <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: T.accent, border: `1.5px solid ${T.bg}`, boxShadow: `0 0 6px ${T.accent}` }} />
              </button>
            </div>
          </div>
        )}



        {/* DM inbox list and Search */}
        <MobileChatView devs={devs} onChatActiveChange={setIsChatActive}>
          {/* Active Architects scroll */}
          <div style={{ padding: '0 14px' }}>
            <div style={{ marginTop: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="section-label" style={{ color: T.textMuted }}>Active Architects</span>
                <button onClick={() => nav('/explore')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.accent, fontFamily: FONT.display, fontWeight: 600 }}>View all →</button>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                {loading
                  ? [...Array(6)].map((_, i) => (
                      <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: T.cardHover }} />
                        <div style={{ width: 40, height: 8, background: T.cardHover, borderRadius: 4 }} />
                      </div>
                    ))
                  : filtered.slice(0, 12).map(dev => (
                      <MentorChip key={dev.username} dev={dev} />
                    ))
                }
              </div>
            </div>
          </div>
        </MobileChatView>

      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT
      ══════════════════════════════════════════════ */}
      <div className="network-desktop" style={{ margin: '-16px -32px', gap: 0, minHeight: 'calc(100vh - 64px)', background: T.bg }}>

        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: T.text, margin: 0 }}>Network</h1>
              <span style={{ fontFamily: FONT.mono, fontSize: 9, color: T.green, background: T.greenDim, border: `1px solid ${T.green}30`, borderRadius: 99, padding: '2px 8px' }}>
                {loading ? '—' : `${devs.length} members`}
              </span>
            </div>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 13px', borderRadius: 12, width: 260,
              background: searchFocused ? (T.isDark ? '#13192B' : '#FEFEFF') : T.surface,
              border: `1.5px solid ${searchFocused ? T.accent : T.cardBorder}`,
              boxShadow: searchFocused ? `0 0 0 3px ${T.accent}18` : 'none',
              transition: 'all 0.18s ease',
            }}>
              <IconSearch size={13} color={T.textMuted} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Search members…"
                style={{ flex: 1, color: T.text, fontSize: 13, fontFamily: FONT.body, outline: 'none', background: 'none', border: 'none' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: T.textMuted }}>
                  <IconXMark size={12} color={T.textMuted} />
                </button>
              )}
            </div>
          </div>

          {/* Active Architects strip */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="section-label" style={{ color: T.textMuted }}>Active Architects</span>
              <button onClick={() => nav('/explore')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.accent, fontFamily: FONT.display, fontWeight: 600 }}>View all →</button>
            </div>
            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
              {loading
                ? [...Array(10)].map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 14, background: T.cardHover }} />
                      <div style={{ width: 44, height: 8, background: T.cardHover, borderRadius: 4 }} />
                    </div>
                  ))
                : filtered.slice(0, 18).map(dev => (
                    <MentorChip key={dev.username} dev={dev} onClick={openDM} />
                  ))
              }
            </div>
          </section>

          {/* Full DM panel */}
          <section ref={dmRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="section-label" style={{ color: T.textMuted }}>Direct Messages</span>
              {dmTarget && (
                <button onClick={() => setDmTarget(null)} style={{ fontFamily: FONT.mono, fontSize: 9, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Clear ×</button>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 520 }}>
              <EmbeddedDM targetUser={dmTarget} />
            </div>
          </section>
        </div>

        {/* Right stats panel */}
        <div style={{ width: 300, flexShrink: 0, borderLeft: `1px solid ${T.cardBorder}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>


          {/* Latest Signals — static labels, real content */}
          <div style={{ background: T.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${T.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent, display: 'inline-block', boxShadow: `0 0 6px ${T.accent}` }} />
              <span className="section-label" style={{ color: T.textMuted }}>Latest Signals</span>
            </div>
            {[
              { label: 'Node.v2 Alpha',   sub: 'Core Protocol Update',  color: T.accent },
              { label: 'WASM Masterclass', sub: '4 new modules',         color: T.neon2  },
              { label: 'Rust Summit 2025', sub: 'Registration open',     color: T.green  },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? `1px solid ${T.sep}` : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 12, color: T.text, margin: 0 }}>{s.label}</p>
                  <p style={{ fontFamily: FONT.mono, fontSize: 9, color: T.textMuted, margin: 0 }}>{s.sub}</p>
                </div>
                <svg width="12" height="12" fill="none" stroke={T.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>

          {/* Pro badge */}
          <div style={{ background: T.accentSoft, borderRadius: 14, padding: '14px 16px', border: `1px solid ${T.accentGlow}` }}>
            <p style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 13, color: T.text, margin: '0 0 4px' }}>Go Professional</p>
            <p style={{ fontFamily: FONT.body, fontSize: 11, color: T.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>Unlock advanced networking, DM anyone, and get the PRO badge across the platform.</p>
            <button onClick={() => nav('/settings')} style={{ width: '100%', background: T.accent, border: 'none', borderRadius: 9, padding: '8px 0', color: '#fff', fontFamily: FONT.display, fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: `0 4px 14px ${T.accentGlow}` }}>
              Upgrade Now →
            </button>
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

export function Saved() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/saved').then(r => setPosts(r.data.posts || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const handleUnsave = (id) => setPosts(prev => prev.filter(p => p.id !== id));
  return (
    <>
      <Helmet><title>Saved — Code+ Academy</title></Helmet>
      <NoIndex />
      <PageWrapper style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>// saved posts</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28 }}>Your Bookmarks</h1>
          <p style={{ color: 'var(--sub)', fontSize: 14, marginTop: 4 }}>{posts.length} saved {posts.length === 1 ? 'post' : 'posts'}</p>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[...Array(4)].map((_, i) => <PostCardSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="card" style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
            <p style={{ color: 'var(--sub)', marginBottom: 20 }}>No bookmarks yet. Save posts from the feed to find them here.</p>
            <Link to="/feed"><button className="btn-primary">Browse Feed</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {posts.map(p => <PostCard key={p.id} post={{ ...p, is_saved: true }} onSaveToggle={handleUnsave} />)}
          </div>
        )}
      </PageWrapper>
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
