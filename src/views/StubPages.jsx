'use client';
/**
 * StubPages â€” V4.0 V2
 *
 * ArticleDetail, ResourceDetail, CourseDetail:
 *   â†’ Now fetch from /api/articles/:slug (new cpa-content DB)
 *   → Now fetch from /api/articles/:slug (new cpa-content DB)
 *   → Renders via ArticlePage (block-based renderer)
 *
 * ActivityResolver, DevProfile, Followers, Following:
 *   → Unchanged from V1
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import api from '../api/axios';
import PostDetail from './PostDetail';
import ArticlePage from './public/ArticlePage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Shared helpers ────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="var(--green)" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function RequiresAuthScreen({ nextUrl }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <Lock size={40} color="var(--dim)" />
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>This content requires an account</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14 }}>Sign in to continue reading</p>
      <Link to={nextUrl || '/login'}>
        <button className="btn-primary" style={{ padding: '10px 28px' }}>Sign in to continue</button>
      </Link>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, color: 'var(--dim)', fontWeight: 700 }}>404</div>
      <p style={{ color: 'var(--sub)', fontSize: 14 }}>This page doesn't exist.</p>
      <Link to="/feed"><button className="btn-secondary">Go to Feed</button></Link>
    </div>
  );
}

// â”€â”€ ActivityResolver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Unchanged â€” still resolves social posts via /api/posts/slug/:slug

export function ActivityResolver() {
  const location = useLocation();
  const ref = new URLSearchParams(location.search).get('ref');
  const [postId, setPostId] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const slug = location.pathname.replace(/^\/activity:/, '').split('/')[0];

  useEffect(() => {
    if (!slug) { setNotFound(true); return; }
    const refParam = ref ? `?ref=${ref}` : '';
    api.get(`/posts/slug/${slug}${refParam}`)
      .then(res => {
        const data = res.data;
        if (data.requires_auth) { setRequiresAuth(data.next); return; }
        if (data.post?.id) setPostId(data.post.id);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [slug, ref]);

  if (requiresAuth) return <RequiresAuthScreen nextUrl={requiresAuth} />;
  if (notFound) return <NotFoundScreen />;
  if (!postId) return <LoadingScreen />;
  return <PostDetail overrideId={postId} />;
}

// â”€â”€ New Article Resolver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Fetches from /api/articles/:slug â†’ renders via ArticlePage (block renderer)

function ArticleSlugPage({ useUsername = false }) {
  const { slug, username } = useParams();
  const location = useLocation();
  const [article, setArticle] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const ref = new URLSearchParams(location.search).get('ref');

  useEffect(() => {
    const refParam = ref ? `?ref=${ref}` : '';

    // New articles API (cpa-content DB)
    const url = useUsername && username
      ? `/articles/by-user/${username}/${slug}${refParam}`
      : `/articles/${slug}${refParam}`;

    api.get(url)
      .then(res => {
        const data = res.data;

        // Visibility gate â€” redirect to login if needed
        if (data.requires_auth) {
          setRequiresAuth(data.next);
          return;
        }

        if (data.article) {
          setArticle(data.article);
        } else {
          setNotFound(true);
        }
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else setNotFound(true);
      });
  }, [slug, username]);

  if (requiresAuth) return <RequiresAuthScreen nextUrl={requiresAuth} />;
  if (notFound)     return <NotFoundScreen />;
  if (!article)     return <LoadingScreen />;

  // Render block-based article page
  return <ArticlePage article={article} />;
}

// â”€â”€ Old social post pages (unchanged) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ResourceDetail and CourseDetail still use old posts API
// until those content types are migrated to new article architecture

function SlugContentPage({ useUsername = false }) {
  const { slug, username } = useParams();
  const location = useLocation();
  const [postId, setPostId] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const ref = new URLSearchParams(location.search).get('ref');

  useEffect(() => {
    const refParam = ref ? `?ref=${ref}` : '';
    const url = useUsername && username
      ? `/posts/u/${username}/${slug}${refParam}`
      : `/posts/slug/${slug}${refParam}`;

    api.get(url)
      .then(res => {
        const data = res.data;
        if (data.requires_auth) { setRequiresAuth(data.next); return; }
        if (data.post?.id) setPostId(data.post.id);
        else setNotFound(true);
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else setNotFound(true);
      });
  }, [slug, username]);

  if (requiresAuth) return <RequiresAuthScreen nextUrl={requiresAuth} />;
  if (notFound) return <NotFoundScreen />;
  if (!postId) return <LoadingScreen />;
  return <PostDetail overrideId={postId} />;
}

// â”€â”€ Exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Articles â†’ new block-based renderer
export const ArticleDetail       = () => <ArticleSlugPage />;
export const ArticleUserDetail   = () => <ArticleSlugPage useUsername />;

// Resources + Courses → still use old posts API for now
export const ResourceDetail      = () => <SlugContentPage />;
export const CourseDetail        = () => <SlugContentPage />;
export const ResourceUserDetail  = () => <SlugContentPage useUsername />;
export const CourseUserDetail    = () => <SlugContentPage useUsername />;

// ── Remaining stubs ────────────────────────────────────────────────────────
export function DevProfile() {
  const { username } = useParams();
  return <Navigate to={username ? `/u/${username}` : '/feed'} replace />;
}

function ConnectionsPage({ initialTab }) {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab); // 'followers' or 'following'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch target user profile so we can display their name in the header
  useEffect(() => {
    if (!username) return;
    api.get(`/users/${username}`)
      .then(res => setProfileUser(res.data.user))
      .catch(console.error);
  }, [username]);

  // Fetch connections based on active tab
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    api.get(`/users/${username}/${tab}`)
      .then(res => {
        setUsers(res.data.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username, tab]);

  const handleFollowToggle = async (targetUser, idx) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const isFollowing = targetUser.is_following;
    const updatedUsers = [...users];
    updatedUsers[idx] = { ...targetUser, is_following: !isFollowing };
    setUsers(updatedUsers);

    try {
      if (isFollowing) {
        await api.delete(`/users/${targetUser.username}/follow`);
      } else {
        await api.post(`/users/${targetUser.username}/follow`);
      }
    } catch (err) {
      // Revert on error
      updatedUsers[idx] = targetUser;
      setUsers(updatedUsers);
    }
  };

  const isDark = resolvedTheme === 'dark';
  const themeStyles = {
    bg: isDark ? '#0b0f14' : '#f8fafc',
    card: isDark ? '#111827' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#f3f4f6' : '#1f2937',
    sub: isDark ? '#9ca3af' : '#6b7280',
    purple: '#8A2BFF',
    purpleDim: isDark ? 'rgba(138,43,255,0.15)' : 'rgba(138,43,255,0.08)',
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: themeStyles.bg,
      color: themeStyles.text,
      fontFamily: "'Inter', sans-serif",
      padding: '24px 16px 80px',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <style>{`
        .connections-container {
          width: 100%;
          max-width: 600px;
          background: ${themeStyles.card};
          border: 1px solid ${themeStyles.border};
          border-radius: 16px;
          box-shadow: ${isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.04)'};
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .conn-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid ${themeStyles.border};
        }
        .conn-back-btn {
          background: none;
          border: none;
          color: ${themeStyles.text};
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .conn-back-btn:hover {
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        }
        .conn-title {
          font-family: 'Clash Display', sans-serif;
          font-size: 18px;
          font-weight: 700;
        }
        .conn-subtitle {
          font-size: 12px;
          color: ${themeStyles.sub};
          margin-top: 2px;
        }
        .conn-tabs {
          display: flex;
          border-bottom: 1px solid ${themeStyles.border};
        }
        .conn-tab-btn {
          flex: 1;
          background: none;
          border: none;
          cursor: pointer;
          padding: 14px;
          font-size: 14px;
          font-weight: 600;
          color: ${themeStyles.sub};
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          font-family: 'Geist', sans-serif;
        }
        .conn-tab-btn.active {
          color: ${themeStyles.purple};
          border-bottom-color: ${themeStyles.purple};
        }
        .conn-search {
          padding: 12px 16px;
          border-bottom: 1px solid ${themeStyles.border};
        }
        .conn-search-input {
          width: 100%;
          background: ${isDark ? '#1f2937' : '#f1f5f9'};
          border: 1px solid ${themeStyles.border};
          border-radius: 9px;
          padding: 8px 12px;
          color: ${themeStyles.text};
          outline: none;
          font-size: 13px;
        }
        .conn-search-input:focus {
          border-color: ${themeStyles.purple};
        }
        .conn-list {
          overflow-y: auto;
          max-height: 60vh;
        }
        .conn-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid ${themeStyles.border};
        }
        .conn-item:last-child {
          border-bottom: none;
        }
        .conn-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          min-width: 0;
          flex: 1;
        }
        .conn-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          object-fit: cover;
          border: 1.5px solid ${themeStyles.purple}44;
        }
        .conn-avatar-fallback {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: ${themeStyles.purpleDim};
          border: 1.5px solid ${themeStyles.purple}44;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Clash Display', sans-serif;
          font-weight: 700;
          color: ${themeStyles.purple};
        }
        .conn-user-names {
          min-width: 0;
        }
        .conn-user-name {
          font-weight: 600;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .conn-user-handle {
          font-size: 12px;
          color: ${themeStyles.sub};
          font-family: 'JetBrains Mono', monospace;
        }
        .conn-user-bio {
          font-size: 11px;
          color: ${themeStyles.sub};
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .conn-btn-follow {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid ${themeStyles.purple};
          font-family: 'Geist', sans-serif;
        }
        .conn-btn-follow.following {
          background: transparent;
          color: ${themeStyles.sub};
          border-color: ${themeStyles.border};
        }
        .conn-btn-follow.follow {
          background: ${themeStyles.purple};
          color: #fff;
          box-shadow: 0 4px 12px rgba(138,43,255,0.2);
        }
        .conn-btn-follow:active {
          transform: scale(0.95);
        }
        @media(max-width: 768px) {
          .connections-container {
            border: none;
            border-radius: 0;
            box-shadow: none;
            max-width: 100%;
          }
          .conn-list {
            max-height: none;
          }
        }
      `}</style>
      <div className="connections-container">
        <div className="conn-header">
          <button className="conn-back-btn" onClick={() => navigate(`/u/${username}`)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div>
            <div className="conn-title">{profileUser?.name || `@${username}`}</div>
            <div className="conn-subtitle">
              {profileUser?.followers_count || 0} followers · {profileUser?.following_count || 0} following
            </div>
          </div>
        </div>

        <div className="conn-tabs">
          <button className={`conn-tab-btn ${tab === 'followers' ? 'active' : ''}`} onClick={() => setTab('followers')}>
            Followers
          </button>
          <button className={`conn-tab-btn ${tab === 'following' ? 'active' : ''}`} onClick={() => setTab('following')}>
            Following
          </button>
        </div>

        <div className="conn-search">
          <input
            className="conn-search-input"
            type="text"
            placeholder={`Search ${tab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="conn-list">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Loader2 size={24} color={themeStyles.purple} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: themeStyles.sub }}>
              {searchQuery ? 'No results match search query' : `No ${tab} yet`}
            </div>
          ) : (
            filteredUsers.map((u, idx) => {
              const isSelf = currentUser && currentUser.id === u.id;
              return (
                <div key={u.id} className="conn-item">
                  <div className="conn-user-info" onClick={() => navigate(`/u/${u.username}`)}>
                    {u.avatar_url ? (
                      <img className="conn-avatar" src={u.avatar_url} alt={u.name} />
                    ) : (
                      <div className="conn-avatar-fallback">
                        {(u.name || u.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="conn-user-names">
                      <div className="conn-user-name">{u.name || u.username}</div>
                      <div className="conn-user-handle">@{u.username}</div>
                      {u.bio && <div className="conn-user-bio">{u.bio}</div>}
                    </div>
                  </div>
                  {!isSelf && (
                    <button
                      className={`conn-btn-follow ${u.is_following ? 'following' : 'follow'}`}
                      onClick={() => handleFollowToggle(u, idx)}
                    >
                      {u.is_following ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export const Followers = () => <ConnectionsPage initialTab="followers" />;
export const Following = () => <ConnectionsPage initialTab="following" />;
