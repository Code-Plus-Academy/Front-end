/**
 * frontend/src/pages/Notifications.jsx
 *
 * REAL API INTEGRATION — replaces all hardcoded NOTIFICATIONS_DATA.
 *
 * Endpoints used:
 *   GET    /api/notifications          → fetch paginated list
 *   POST   /api/notifications/read-all → mark all read
 *   POST   /api/notifications/:id/read → mark single read
 *   DELETE /api/notifications/:id      → dismiss / delete
 *   GET    /api/stats/creator          → side-panel summary (best-effort, only for pro accounts)
 *
 * API response shape per backend/routes/notifications.js:
 *   { id, type, is_read, unread, created_at, from_username, from_name,
 *     avatar_url, reference_id, message }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import NoIndex from '../components/seo/NoIndex';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = ['All', 'Mentions', 'Likes', 'Comments', 'Follows', 'Messages', 'Articles', 'Courses', 'System'];

// ─── Type → display mappings ──────────────────────────────────────────────────
const TYPE_TAB = {
  like: 'Likes', clap: 'Likes', save: 'Likes',
  comment: 'Comments', reply: 'Comments',
  follow: 'Follows', follow_suggestion: 'Follows',
  mention: 'Mentions', tag: 'Mentions',
  message: 'Messages', dm: 'Messages',
  article: 'Articles', article_published: 'Articles',
  video_published: 'System',
  course: 'Courses', course_update: 'Courses', certification: 'Courses',
  system: 'System', weekly: 'System', login: 'System',
  security: 'System', mentor: 'System',
};

const TYPE_ICON = {
  like: '❤️', clap: '👏', save: '🔖',
  comment: '💬', reply: '↩️',
  follow: '👤', follow_suggestion: '👤',
  mention: '🔔', tag: '🏷️',
  message: '💬', dm: '💬',
  article: '📰', article_published: '📰',
  video_published: '🎥',
  course: '📘', course_update: '📘', certification: '🏆',
  system: '🛡️', weekly: '📊', login: '🛡️', security: '🛡️', mentor: '🎓',
};

const TYPE_ACTION = {
  like: 'View Post', clap: 'View Post', save: 'View Resource',
  comment: 'Reply', reply: 'Reply',
  follow: 'Follow Back', follow_suggestion: 'Follow',
  mention: 'View Thread', tag: 'View Thread',
  message: 'Open Chat', dm: 'Open Chat',
  article: 'Read Article', article_published: 'Read Article',
  video_published: 'Watch',
  course: 'Open Course', course_update: 'Open Course', certification: 'Download',
  system: 'Review', weekly: 'View Report', login: 'Review', security: 'Review', mentor: 'View Reply',
};

const TYPE_COLOR = {
  like: '#EC4899', clap: '#F59E0B', save: '#F97316',
  comment: '#EC4899', reply: '#EC4899',
  follow: '#0EA5E9', follow_suggestion: '#0EA5E9',
  mention: '#F59E0B', tag: '#F59E0B',
  message: '#8B5CF6', dm: '#8B5CF6',
  article: '#10B981', article_published: '#10B981',
  video_published: '#00D1FF',
  course: '#6366F1', course_update: '#6366F1', certification: '#F59E0B',
  system: '#6B7280', weekly: '#7C3AED', login: '#6B7280', security: '#EF4444', mentor: '#0EA5E9',
};

// "System-like" types — no real user avatar, use icon tile instead
const SYSTEM_TYPES = new Set([
  'system', 'weekly', 'certification', 'course', 'course_update',
  'login', 'security', 'article_published', 'video_published',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 1)    return 'just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Normalise a raw API notification row into the shape NotifCard expects.
 * The API returns: id, type, is_read, unread, created_at,
 *                  from_username, from_name, avatar_url, reference_id, message, is_following
 */
function normalizeNotif(raw) {
  const type    = (raw.type || 'system').toLowerCase();
  const isSys   = SYSTEM_TYPES.has(type) || !raw.from_name;

  const initials = raw.from_name
    ? raw.from_name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null;

  return {
    id:           raw.id,
    type,
    unread:       raw.unread ?? !raw.is_read,
    is_read:      raw.is_read,
    created_at:   raw.created_at,
    time:         timeAgo(raw.created_at),
    // Text
    message:      raw.message || '',
    sub:          null,               // backend doesn't return a subtitle field yet
    // Avatar
    avatarUrl:    raw.avatar_url || null,
    avatar:       !isSys && initials ? initials : null,
    avatarIcon:   isSys ? (TYPE_ICON[type] || '🔔') : null,
    avatarColor:  TYPE_COLOR[type] || '#7C3AED',
    // UI meta
    icon:         TYPE_ICON[type]   || '🔔',
    tab:          TYPE_TAB[type]    || 'System',
    action:       TYPE_ACTION[type] || null,
    thumb:        ['article', 'article_published', 'course', 'save', 'video_published'].includes(type),
    // Raw passthrough for navigation
    reference_id: raw.reference_id,
    from_username: raw.from_username,
    is_following: raw.is_following,
  };
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// ─── Loading skeleton card ────────────────────────────────────────────────────
function SkeletonCard({ dm }) {
  return (
    <div style={{
      display: 'flex', gap: 11, padding: 13,
      borderRadius: 15, border: `1px solid ${dm ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.065)'}`,
      background: dm ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.92)',
    }}>
      <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton" style={{ height: 12, width: '65%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 11, width: '25%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── NotifCard ────────────────────────────────────────────────────────────────
function NotifCard({ n, i, swipedId, setSwipedId, markRead, dismiss, dm, onFollow }) {
  const isSwiped = swipedId === n.id;
  return (
    <div style={{ position: 'relative', animationDelay: `${i * 0.045}s` }} onMouseLeave={() => setSwipedId(null)}>
      <div
        className={`notif-card ${n.unread ? 'unread' : 'read'}`}
        style={{ transform: isSwiped ? 'translateX(-116px)' : 'translateX(0)', transition: 'transform 0.22s ease' }}
        onClick={() => markRead(n.id)}
        onTouchStart={e => {
          const startX = e.touches[0].clientX;
          const move = e2 => {
            const dx = startX - e2.touches[0].clientX;
            if (dx > 38) setSwipedId(n.id);
            if (dx < -38) { setSwipedId(null); markRead(n.id); }
          };
          document.addEventListener('touchmove', move, { once: true });
        }}
      >
        <div className="avatar-wrap">
          {/* Real user photo */}
          {n.avatarUrl ? (
            <img
              src={n.avatarUrl}
              alt={n.from_username || ''}
              style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : n.avatar ? (
            <div className="avatar" style={{ background: n.avatarColor }}>{n.avatar}</div>
          ) : (
            <div className="avatar-icon" style={{ background: `${n.avatarColor}22` }}>{n.avatarIcon}</div>
          )}
          {n.unread && <div className="unread-dot" />}
        </div>

        <div className="notif-content">
          <div className="notif-message">{n.message}</div>
          {n.sub && <div className="notif-sub">{n.sub}</div>}
          <div className="notif-bottom">
            <span className="notif-time">{n.time}</span>
            {n.action && (
              ['follow', 'follow_suggestion'].includes(n.type) ? (
                n.is_following ? (
                  <span className="action-label" style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, paddingLeft: '5px' }}>
                    Following
                  </span>
                ) : (
                  <button
                    className="action-btn primary"
                    onClick={e => {
                      e.stopPropagation();
                      onFollow(n.from_username, n.id);
                    }}
                  >
                    {n.type === 'follow' ? 'Follow Back' : 'Follow'}
                  </button>
                )
              ) : (
                <button
                  className="action-btn primary"
                  onClick={e => { e.stopPropagation(); markRead(n.id); }}
                >
                  {n.action}
                </button>
              )
            )}
          </div>
        </div>

        {n.thumb && <div className="notif-thumb">{n.icon}</div>}
      </div>

      {isSwiped && (
        <div className="swipe-actions">
          <div className="swipe-btn check" onClick={() => { markRead(n.id); setSwipedId(null); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Read
          </div>
          <div className="swipe-btn delete" onClick={() => { dismiss(n.id); setSwipedId(null); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Delete
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Notifications() {
  const { resolvedTheme, toggleTheme } = useTheme();          // ✅ fixed: was setDarkMode
  const { user } = useAuth();
  const dm = resolvedTheme === 'dark';

  const [activeTab,      setActiveTab]      = useState('All');
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [stats,          setStats]          = useState(null);   // side-panel summary
  const [filterOpen,     setFilterOpen]     = useState(false);
  const [toastMsg,       setToastMsg]       = useState(null);
  const [toastVisible,   setToastVisible]   = useState(false);
  const [swipedId,       setSwipedId]       = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const feedRef = useRef(null);

  // ── Modal Filters state ─────────────────────────────────────────────────────
  const [filterStatus,    setFilterStatus]    = useState('All');
  const [filterTimeRange, setFilterTimeRange] = useState('All time');
  const [filterCategory,  setFilterCategory]  = useState('All');

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // ── Fetch notifications ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.get('/notifications', { params: { limit: 50 } });
      const raw = res.data.notifications || [];
      setNotifications(raw.map(normalizeNotif));
    } catch (err) {
      if (!silent) setError('Could not load notifications. Try refreshing.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Fetch side-panel stats (best-effort — ignore 403 for non-pro) ───────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/stats/creator');
      setStats(res.data);
    } catch {
      // Not a pro account or endpoint unavailable — silently ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => n.unread).length;

  const matchesStatus = (unread, status) => {
    if (status === 'All') return true;
    if (status === 'Unread only') return unread === true;
    return true;
  };

  const matchesTimeRange = (createdAt, range) => {
    if (range === 'All time') return true;
    const diffMs = Date.now() - new Date(createdAt);
    if (range === 'Last 24h') return diffMs < 24 * 60 * 60 * 1000;
    if (range === 'This week') return diffMs < 7 * 24 * 60 * 60 * 1000;
    if (range === 'This month') return diffMs < 30 * 24 * 60 * 60 * 1000;
    return true;
  };

  const matchesCategory = (notifTab, category) => {
    if (category === 'All') return true;
    if (category === 'Social') return ['Likes', 'Comments', 'Follows'].includes(notifTab);
    if (category === 'Learning') return ['Articles', 'Courses'].includes(notifTab);
    if (category === 'Messages') return ['Messages', 'Mentions'].includes(notifTab);
    if (category === 'System') return notifTab === 'System';
    return true;
  };

  const filtered = notifications.filter(n => {
    if (activeTab !== 'All' && n.tab !== activeTab) return false;
    if (!matchesStatus(n.unread, filterStatus)) return false;
    if (!matchesTimeRange(n.created_at, filterTimeRange)) return false;
    if (!matchesCategory(n.tab, filterCategory)) return false;
    return true;
  });

  // ── Mark all read ───────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, unread: false, is_read: true })));
    try {
      await api.post('/notifications/read-all');
    } catch {
      // Revert on failure
      await fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // ── Mark single read ────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false, is_read: true } : n)
    );
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      await fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // ── Dismiss / delete ────────────────────────────────────────────────────────
  const dismiss = useCallback(async (id) => {
    // Optimistic removal
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      await fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // ── Refresh ─────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(true);
    setRefreshing(false);
    showToast('Notifications refreshed');
  }, [fetchNotifications, showToast]);

  // ── Follow action ───────────────────────────────────────────────────────────
  const handleFollow = useCallback(async (username, notifId) => {
    if (!username) return;
    await markRead(notifId);

    setNotifications(prev => prev.map(item => {
      if (item.from_username === username) {
        return { ...item, is_following: true };
      }
      return item;
    }));

    try {
      await api.post(`/users/${username}/follow`);
      showToast(`Followed @${username}`);
    } catch (err) {
      setNotifications(prev => prev.map(item => {
        if (item.from_username === username) {
          return { ...item, is_following: false };
        }
        return item;
      }));
      showToast('Failed to follow user');
    }
  }, [markRead, showToast]);

  // ── CSS ─────────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
    .cpa-wrap {
      font-family: 'DM Sans', sans-serif;
      color: ${dm ? '#E2E8F4' : '#111827'};
      transition: background 0.3s, color 0.3s;
    }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #7C3AED55; border-radius: 4px; }

    .cpa-wrap { min-height: 100vh; background: ${dm ? '#07090E' : '#F1F3F7'}; transition: background 0.3s; }

    .refresh-bar {
      height: 2px;
      background: linear-gradient(90deg,#7C3AED,#0EA5E9,#7C3AED);
      background-size: 200% 100%;
      animation: shimmer 1s linear infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .toast {
      position: fixed; top: 16px; left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: ${dm ? 'rgba(12,16,26,0.96)' : 'rgba(255,255,255,0.97)'};
      border: 1px solid rgba(124,58,237,0.45);
      border-radius: 14px; padding: 11px 18px;
      display: flex; align-items: center; gap: 9px;
      font-size: 13px; font-weight: 500;
      color: ${dm ? '#E2E8F0' : '#1E293B'};
      box-shadow: 0 8px 32px rgba(124,58,237,0.22);
      z-index: 999; opacity: 0; pointer-events: none;
      backdrop-filter: blur(20px); white-space: nowrap;
      transition: opacity 0.3s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }
    .toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    .toast-dot { width: 7px; height: 7px; border-radius: 50%; background: #7C3AED; flex-shrink: 0; animation: pdot 1.6s infinite; }
    @keyframes pdot { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)} 50%{box-shadow:0 0 0 4px rgba(124,58,237,0)} }

    .desktop-layout { display: flex; max-width: 1080px; margin: 0 auto; }
    .main-feed-col { flex: 1; min-width: 0; }
    @media(min-width:768px) {
      .main-feed-col { border-right: 1px solid ${dm ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}; }
      .side-panel { display: flex !important; flex-direction: column; width: 268px; padding: 22px 18px; }
    }
    @media(max-width:767px) { .side-panel { display: none !important; } }

    .page-header { padding: 22px 20px 0; }
    .page-label { font-size: 11.5px; font-weight: 500; color: #7C3AED; letter-spacing: 1.2px; text-transform: uppercase; }
    .title-row { display: flex; align-items: center; justify-content: space-between; margin-top: 3px; }
    .page-title { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; color: ${dm ? '#F1F5F9' : '#0F172A'}; letter-spacing: -1px; line-height: 1; }

    .right-cluster { display: flex; align-items: center; gap: 7px; }

    .theme-toggle {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.25s; flex-shrink: 0; background: none;
    }
    .theme-toggle.dark {
      background: rgba(124,58,237,0.1);
      border: 1.5px solid rgba(124,58,237,0.55);
      color: #C4B5FD;
      box-shadow: 0 0 10px rgba(124,58,237,0.28), inset 0 0 8px rgba(124,58,237,0.08);
    }
    .theme-toggle.dark:hover { background: rgba(124,58,237,0.2); box-shadow: 0 0 18px rgba(124,58,237,0.45); }
    .theme-toggle.light {
      background: white; border: 1.5px solid rgba(124,58,237,0.4);
      color: #7C3AED; box-shadow: 0 2px 10px rgba(124,58,237,0.12);
    }
    .theme-toggle.light:hover { box-shadow: 0 3px 18px rgba(124,58,237,0.24); border-color: rgba(124,58,237,0.7); }
    .toggle-icon { display: flex; align-items: center; justify-content: center; transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1); }

    .header-btn {
      height: 30px; padding: 0 11px; border-radius: 8px;
      border: 1px solid ${dm ? 'rgba(124,58,237,0.22)' : 'rgba(124,58,237,0.18)'};
      background: ${dm ? 'rgba(124,58,237,0.07)' : 'white'};
      color: ${dm ? '#94A3B8' : '#64748B'};
      font-size: 11.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
      cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;
    }
    .header-btn:hover { border-color: #7C3AED; color: #A855F7; background: rgba(124,58,237,0.12); }
    .header-btn.icon-only { width: 30px; padding: 0; justify-content: center; }

    .unread-summary { margin-top: 9px; font-size: 12px; color: ${dm ? '#475569' : '#94A3B8'}; display: flex; align-items: center; gap: 6px; }
    .unread-dot-inline { width: 6px; height: 6px; border-radius: 50%; background: #7C3AED; display: inline-block; flex-shrink: 0; }

    .tabs-container {
      margin-top: 14px; padding: 0 20px 2px;
      display: flex; gap: 7px;
      overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
    }
    .tabs-container::-webkit-scrollbar { display: none; }
    .tab-pill {
      flex-shrink: 0; height: 32px; padding: 0 15px; border-radius: 100px;
      border: 1px solid ${dm ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'};
      background: ${dm ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
      color: ${dm ? '#64748B' : '#9CA3AF'};
      font-size: 12.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.22s; white-space: nowrap;
    }
    .tab-pill:hover { border-color: rgba(124,58,237,0.35); color: ${dm ? '#C4B5FD' : '#7C3AED'}; }
    .tab-pill.active {
      background: rgba(124,58,237,0.14);
      border-color: rgba(124,58,237,0.7);
      color: ${dm ? '#ffffff' : '#6D28D9'};
      box-shadow: 0 0 12px rgba(124,58,237,0.28), inset 0 0 6px rgba(124,58,237,0.07);
      font-weight: 600;
    }

    .section-divider {
      margin: 14px 20px 0; height: 1px;
      background: ${dm
        ? 'linear-gradient(90deg,rgba(124,58,237,0.25),rgba(14,165,233,0.1),transparent)'
        : 'linear-gradient(90deg,rgba(124,58,237,0.15),transparent)'};
    }

    .feed { padding: 10px 14px 32px; display: flex; flex-direction: column; gap: 7px; }
    .section-label {
      font-size: 10.5px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase;
      color: ${dm ? '#334155' : '#CBD5E1'}; padding: 6px 4px 2px; font-family: 'DM Sans', sans-serif;
    }

    .notif-card {
      position: relative; border-radius: 15px; padding: 13px;
      display: flex; gap: 11px; align-items: flex-start;
      cursor: pointer; border: 1px solid transparent;
      animation: fsi 0.32s ease both; overflow: hidden;
      transition: border-color 0.2s, background 0.2s, transform 0.25s;
    }
    @keyframes fsi { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
    .notif-card.unread {
      background: ${dm ? 'rgba(124,58,237,0.065)' : 'rgba(124,58,237,0.04)'};
      border-color: ${dm ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.14)'};
    }
    .notif-card.read {
      background: ${dm ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.92)'};
      border-color: ${dm ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.065)'};
    }
    .notif-card:hover { border-color: rgba(124,58,237,0.35) !important; background: ${dm ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)'} !important; transform: translateY(-1px) !important; }
    .notif-card.unread::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#7C3AED,#0EA5E9); border-radius:4px 0 0 4px; }

    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar { width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white;font-family:'Syne',sans-serif; }
    .avatar-icon { width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:19px; }
    .unread-dot { position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#7C3AED;border:2px solid ${dm ? '#07090E' : '#F1F3F7'};animation:pdot 2s infinite; }

    .notif-content { flex:1;min-width:0; }
    .notif-message { font-size:13.5px;font-weight:500;color:${dm ? '#E2E8F0' : '#1E293B'};line-height:1.4; }
    .notif-sub { font-size:12px;color:${dm ? '#64748B' : '#9CA3AF'};margin-top:2px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .notif-bottom { display:flex;align-items:center;gap:7px;margin-top:7px;flex-wrap:wrap; }
    .notif-time { font-size:11px;color:${dm ? '#3D4F63' : '#CBD5E1'};font-weight:400; }

    .action-btn { height:25px;padding:0 11px;border-radius:7px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;transition:all 0.18s; }
    .action-btn.primary { background:rgba(124,58,237,0.13);border:1px solid rgba(124,58,237,0.32);color:#A855F7; }
    .action-btn.primary:hover { background:rgba(124,58,237,0.28);color:white; }

    .notif-thumb { width:44px;height:44px;border-radius:11px;background:${dm ? 'linear-gradient(135deg,rgba(124,58,237,0.28),rgba(14,165,233,0.25))' : 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(14,165,233,0.1))'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid rgba(124,58,237,0.17); }

    .swipe-actions { position:absolute;right:0;top:0;bottom:0;display:flex;align-items:center;border-radius:0 15px 15px 0;overflow:hidden; }
    .swipe-btn { height:100%;width:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;cursor:pointer;gap:3px;transition:all 0.15s; }
    .swipe-btn.check { background:rgba(16,185,129,0.85);color:white; }
    .swipe-btn.delete { background:rgba(239,68,68,0.85);color:white; }

    .empty-state { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px;text-align:center;gap:14px; }
    .empty-bell { font-size:48px;animation:bring 3s ease-in-out infinite; }
    @keyframes bring { 0%,100%{transform:rotate(0)} 10%,30%{transform:rotate(-10deg)} 20%{transform:rotate(10deg)} 40%{transform:rotate(0)} }
    .empty-title { font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:${dm ? '#E2E8F0' : '#1E293B'}; }
    .empty-sub { font-size:13.5px;color:${dm ? '#64748B' : '#9CA3AF'};max-width:240px;line-height:1.55; }
    .empty-actions { display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:6px; }
    .empty-cta { height:34px;padding:0 16px;border-radius:10px;border:1px solid rgba(124,58,237,0.32);background:rgba(124,58,237,0.09);color:#A855F7;font-size:12.5px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.2s; }
    .empty-cta:hover { background:rgba(124,58,237,0.2); }

    .side-panel { display:none; }
    .side-section-title { font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:${dm ? '#94A3B8' : '#374151'};letter-spacing:0.4px;margin-bottom:10px; }
    .insight-card { background:${dm ? 'rgba(124,58,237,0.07)' : 'white'};border:1px solid ${dm ? 'rgba(124,58,237,0.14)' : 'rgba(0,0,0,0.07)'};border-radius:14px;padding:13px;margin-bottom:14px; }
    .insight-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:12.5px;border-bottom:1px solid ${dm ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}; }
    .insight-row:last-child { border-bottom:none; }
    .insight-label { color:${dm ? '#64748B' : '#9CA3AF'}; }
    .insight-value { font-weight:700;color:${dm ? '#A855F7' : '#7C3AED'}; }

    .error-bar { padding: 10px 20px; background: rgba(239,68,68,0.1); border-bottom: 1px solid rgba(239,68,68,0.2); font-size: 12.5px; color: #EF4444; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .error-retry { background: none; border: 1px solid #EF4444; color: #EF4444; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }

    .filter-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.48);z-index:200;backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center; }
    .filter-modal { background:${dm ? '#0D1420' : 'white'};border-radius:20px 20px 0 0;padding:18px 18px 28px;width:100%;max-width:480px;border-top:1px solid rgba(124,58,237,0.22); }
    .filter-handle { width:38px;height:4px;border-radius:4px;background:${dm ? '#374151' : '#E5E7EB'};margin:0 auto 14px; }
    .filter-title { font-family:'Syne',sans-serif;font-size:17px;font-weight:700;margin-bottom:14px;color:${dm ? '#F1F5F9' : '#0F172A'}; }
    .filter-group { margin-bottom:13px; }
    .filter-group-label { font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${dm ? '#475569' : '#9CA3AF'};margin-bottom:7px; }
    .filter-options { display:flex;flex-wrap:wrap;gap:7px; }
    .filter-option { height:30px;padding:0 13px;border-radius:100px;border:1px solid ${dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'};background:transparent;color:${dm ? '#94A3B8' : '#64748B'};font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all 0.18s; }
    .filter-option.selected { background:rgba(124,58,237,0.14);border-color:rgba(124,58,237,0.5);color:#A855F7; }
    .apply-filter-btn { width:100%;height:42px;border-radius:12px;background:linear-gradient(135deg,#7C3AED,#0EA5E9);border:none;color:white;font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:14px;transition:opacity 0.2s; }
    .apply-filter-btn:hover { opacity:0.9; }

    /* skeleton shimmer override for dark bg */
    .skeleton { background: ${dm ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}; border-radius: 6px; }
  `;

  // ── Side panel stats rows (real data if available, else unread count only) ──
  const statsRows = stats
    ? [
        ['Unread',        unreadCount],
        ['Profile Views', stats.views?.toLocaleString()  || '—'],
        ['Followers',     stats.followers?.toLocaleString() || '—'],
        ['Total Likes',   stats.claps?.toLocaleString()  || '—'],
      ]
    : [
        ['Unread',  unreadCount],
        ['Today',   filtered.filter(n => {
          const m = Math.floor((Date.now() - new Date(n.created_at)) / 60000);
          return m < 1440;
        }).length],
      ];

  return (
    <>
      <Helmet><title>Notifications — CPA</title></Helmet>
      <NoIndex />

      <style>{css}</style>

      {/* Toast */}
      <div className={`toast ${toastVisible ? 'visible' : ''}`}>
        <div className="toast-dot" />
        {toastMsg}
      </div>

      <div className="cpa-wrap">
        {refreshing && <div className="refresh-bar" />}

        <div className="desktop-layout">
          {/* ── MAIN FEED COL ──────────────────────────────────────────── */}
          <div className="main-feed-col">

            {/* Error bar */}
            {error && !loading && (
              <div className="error-bar">
                <span>{error}</span>
                <button className="error-retry" onClick={() => fetchNotifications()}>Retry</button>
              </div>
            )}

            {/* PAGE HEADER */}
            <div className="page-header">
              <div className="page-label">// notifications</div>
              <div className="title-row">
                <div className="page-title">Activity</div>
                <div className="right-cluster">
                  <button
                    className="header-btn"
                    onClick={markAllRead}
                    disabled={loading || unreadCount === 0}
                    title="Mark all as read"
                    style={{ opacity: unreadCount === 0 ? 0.45 : 1 }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mark all
                  </button>
                  <button className="header-btn icon-only" onClick={() => setFilterOpen(true)} title="Filter">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                      <line x1="11" y1="18" x2="13" y2="18" />
                    </svg>
                  </button>
                  <button
                    className="header-btn icon-only"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Refresh"
                  >
                    <svg
                      width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                      style={{ animation: refreshing ? 'shimmer 0.8s linear infinite' : 'none' }}
                    >
                      <path d="M1 4v6h6M23 20v-6h-6" />
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                  </button>
                  {/* ✅ Fixed: was calling setDarkMode which doesn't exist */}
                  <button
                    className={`theme-toggle ${dm ? 'dark' : 'light'}`}
                    onClick={toggleTheme}
                    title={dm ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    <span className="toggle-icon">{dm ? <MoonIcon /> : <SunIcon />}</span>
                  </button>
                </div>
              </div>

              {!loading && unreadCount > 0 && (
                <div className="unread-summary">
                  <span className="unread-dot-inline" />
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* TABS */}
            <div className="tabs-container">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="section-divider" />

            {/* FEED */}
            <div className="feed" ref={feedRef}>

              {/* Loading skeleton */}
              {loading && (
                <>
                  <div className="section-label">New</div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} dm={dm} />
                  ))}
                  <div className="section-label" style={{ marginTop: 8 }}>Earlier</div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i + 4} dm={dm} />
                  ))}
                </>
              )}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <div className="empty-state">
                  <div className="empty-bell">🔔</div>
                  <div className="empty-title">
                    {activeTab === 'All' ? 'All quiet here' : `No ${activeTab.toLowerCase()} yet`}
                  </div>
                  <div className="empty-sub">
                    Follow creators and engage with posts to see activity here.
                  </div>
                  <div className="empty-actions">
                    <button className="empty-cta">Explore Creators</button>
                    <button className="empty-cta">Read Articles</button>
                    <button className="empty-cta">Find Courses</button>
                  </div>
                </div>
              )}

              {/* Real notifications */}
              {!loading && filtered.length > 0 && (
                <>
                  {filtered.some(n => n.unread) && (
                    <>
                      <div className="section-label">New</div>
                      {filtered.filter(n => n.unread).map((n, i) => (
                        <NotifCard
                          key={n.id} n={n} i={i}
                          swipedId={swipedId} setSwipedId={setSwipedId}
                          markRead={markRead} dismiss={dismiss} dm={dm}
                          onFollow={handleFollow}
                        />
                      ))}
                    </>
                  )}
                  {filtered.some(n => !n.unread) && (
                    <>
                      <div className="section-label" style={{ marginTop: 8 }}>Earlier</div>
                      {filtered.filter(n => !n.unread).map((n, i) => (
                        <NotifCard
                          key={n.id} n={n} i={i}
                          swipedId={swipedId} setSwipedId={setSwipedId}
                          markRead={markRead} dismiss={dismiss} dm={dm}
                          onFollow={handleFollow}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── SIDE PANEL ──────────────────────────────────────────────── */}
          <div className="side-panel">
            <div className="side-section-title">Today's Summary</div>
            <div className="insight-card">
              {statsRows.map(([label, value]) => (
                <div key={label} className="insight-row">
                  <span className="insight-label">{label}</span>
                  <span className="insight-value">{value}</span>
                </div>
              ))}
            </div>

            {/* Notification breakdown by type */}
            {!loading && notifications.length > 0 && (
              <>
                <div className="side-section-title" style={{ marginTop: 4 }}>By Category</div>
                <div className="insight-card">
                  {TABS.slice(1).map(tab => {
                    const count = notifications.filter(n => n.tab === tab).length;
                    if (count === 0) return null;
                    return (
                      <div
                        key={tab}
                        className="insight-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveTab(tab)}
                      >
                        <span className="insight-label">{tab}</span>
                        <span className="insight-value">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* FILTER MODAL */}
        {filterOpen && (
          <div className="filter-overlay" onClick={() => setFilterOpen(false)}>
            <div className="filter-modal" onClick={e => e.stopPropagation()}>
              <div className="filter-handle" />
              <div className="filter-title">Filter Notifications</div>
              <div className="filter-group">
                <div className="filter-group-label">Status</div>
                <div className="filter-options">
                  {['Unread only', 'All'].map(o => (
                    <button
                      key={o}
                      className={`filter-option ${o === filterStatus ? 'selected' : ''}`}
                      onClick={() => setFilterStatus(o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-group-label">Time Range</div>
                <div className="filter-options">
                  {['Last 24h', 'This week', 'This month', 'All time'].map(o => (
                    <button
                      key={o}
                      className={`filter-option ${o === filterTimeRange ? 'selected' : ''}`}
                      onClick={() => setFilterTimeRange(o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-group-label">Category</div>
                <div className="filter-options">
                  {['Social', 'Learning', 'Messages', 'System'].map(o => (
                    <button
                      key={o}
                      className={`filter-option ${o === filterCategory ? 'selected' : ''}`}
                      onClick={() => setFilterCategory(prev => prev === o ? 'All' : o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <button className="apply-filter-btn" onClick={() => setFilterOpen(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </>
  );
}
