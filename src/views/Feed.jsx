import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles, UserPlus, Check, ArrowRight, Users } from 'lucide-react';
import NoIndex from '../components/seo/NoIndex';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import StoryBar from '../components/stories/StoryBar';
import PostCard from '../components/posts/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ─── Desktop Vertical Sidebar Row ──────────────────────────────────────────
function DesktopBuilderRow({ builder, currentUser, followPending, onToggleFollow }) {
  const canFollow = currentUser && currentUser.username !== builder.username;
  const isFollowing = Boolean(builder.is_following);
  const isPending = Boolean(followPending);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 10px',
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        transition: 'all 0.2s ease',
      }}
      className="hover:bg-white/[0.05] hover:border-cyan-500/30 group"
    >
      <Link
        to={`/u/${builder.username}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          flex: 1,
          textDecoration: 'none',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={builder.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${builder.username}`}
            alt={builder.username}
            width={38}
            height={38}
            style={{
              borderRadius: 10,
              objectFit: 'cover',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#070a0e',
            }}
          />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              color: 'var(--text, #f0f2f8)',
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            className="group-hover:text-cyan-400 transition-colors"
          >
            {builder.name || builder.username}
          </p>
          <p
            style={{
              margin: '1px 0 0',
              color: 'var(--dim, #64748b)',
              fontSize: 11,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            @{builder.username}
          </p>
        </div>
      </Link>

      <div style={{ marginLeft: 8, flexShrink: 0 }}>
        {canFollow ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFollow(builder);
            }}
            disabled={isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: isFollowing ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,219,233,0.4)',
              background: isFollowing ? 'rgba(255,255,255,0.05)' : 'rgba(0, 219, 233, 0.12)',
              color: isFollowing ? '#94a3b8' : '#00dbe9',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
            className={!isFollowing ? 'hover:bg-cyan-500 hover:text-slate-950' : 'hover:border-red-500/40 hover:text-red-400'}
          >
            {isPending ? (
              <Loader2 size={11} className="animate-spin" />
            ) : isFollowing ? (
              <>
                <Check size={11} />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus size={11} />
                <span>Follow</span>
              </>
            )}
          </button>
        ) : (
          <span style={{ color: 'var(--primary, #00dbe9)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            You
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Mobile Horizontal Snap Card ───────────────────────────────────────────
function MobileHorizontalBuilderCard({ builder, currentUser, followPending, onToggleFollow }) {
  const canFollow = currentUser && currentUser.username !== builder.username;
  const isFollowing = Boolean(builder.is_following);
  const isPending = Boolean(followPending);

  return (
    <div
      style={{
        minWidth: 140,
        width: 140,
        background: 'var(--s2, #0a0e14)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        flexShrink: 0,
        scrollSnapAlign: 'start',
      }}
    >
      <Link to={`/u/${builder.username}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <img
          src={builder.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${builder.username}`}
          alt={builder.username}
          width={44}
          height={44}
          style={{
            borderRadius: 12,
            objectFit: 'cover',
            border: '1px solid rgba(0, 219, 233, 0.3)',
            background: '#070a0e',
            marginBottom: 8,
          }}
        />
        <p
          style={{
            margin: 0,
            color: 'var(--text, #f0f2f8)',
            fontWeight: 700,
            fontSize: 12,
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {builder.name || builder.username}
        </p>
        <p
          style={{
            margin: '1px 0 6px',
            color: 'var(--dim, #64748b)',
            fontSize: 10,
            fontFamily: 'var(--font-mono, monospace)',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          @{builder.username}
        </p>
      </Link>

      <div style={{ marginTop: 'auto', width: '100%' }}>
        {canFollow ? (
          <button
            type="button"
            onClick={() => onToggleFollow(builder)}
            disabled={isPending}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              border: isFollowing ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,219,233,0.4)',
              background: isFollowing ? 'rgba(255,255,255,0.05)' : 'rgba(0, 219, 233, 0.12)',
              color: isFollowing ? '#94a3b8' : '#00dbe9',
              borderRadius: 16,
              padding: '4px 8px',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? <Loader2 size={10} className="animate-spin" /> : isFollowing ? 'Following' : '+ Follow'}
          </button>
        ) : (
          <span style={{ color: 'var(--primary, #00dbe9)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            You
          </span>
        )}
      </div>
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', difficulty: 'all', language: 'all' });
  const [feedError, setFeedError] = useState('');

  const [builders, setBuilders] = useState([]);
  const [buildersLoading, setBuildersLoading] = useState(true);
  const [followPending, setFollowPending] = useState({});

  const nextCursorRef = useRef(null);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const fetchPosts = useCallback(async (activeFilters = filters, reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setFeedError('');
    if (!reset) setLoadingMore(true);

    try {
      const params = { limit: 12 };
      if (!reset && nextCursorRef.current) params.cursor = nextCursorRef.current;
      if (activeFilters.type !== 'all') params.type = activeFilters.type;
      if (activeFilters.difficulty !== 'all') params.difficulty = activeFilters.difficulty;
      if (activeFilters.language !== 'all') params.language = activeFilters.language;

      const res = await api.get('/posts', { params });
      const newPosts = res.data?.posts || [];
      nextCursorRef.current = res.data?.next_cursor || null;
      setPosts(prev => (reset ? newPosts : [...prev, ...newPosts]));
      setHasMore(Boolean(res.data?.next_cursor));
    } catch (err) {
      if (reset) setPosts([]);
      setFeedError(err?.response?.data?.message || 'Unable to load feed right now.');
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  const fetchBuilders = useCallback(async () => {
    setBuildersLoading(true);
    try {
      const res = await api.get('/users/search', { params: { limit: 10 } });
      setBuilders(res.data?.users || []);
    } catch {
      setBuilders([]);
    } finally {
      setBuildersLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setHasMore(true);
    nextCursorRef.current = null;
    fetchPosts(filters, true);
  }, [filters, fetchPosts]);

  useEffect(() => {
    fetchBuilders();
  }, [fetchBuilders]);

  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          fetchPosts(filters, false);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filters, hasMore, fetchPosts]);

  const toggleFollow = useCallback(async (builder) => {
    const username = builder.username;
    if (!username) return;
    setFollowPending(prev => ({ ...prev, [username]: true }));

    const previous = builder.is_following;
    setBuilders(prev => prev.map(item => (
      item.username === username ? { ...item, is_following: !previous } : item
    )));

    try {
      if (previous) await api.delete(`/users/${username}/follow`);
      else await api.post(`/users/${username}/follow`);
    } catch {
      setBuilders(prev => prev.map(item => (
        item.username === username ? { ...item, is_following: previous } : item
      )));
    } finally {
      setFollowPending(prev => ({ ...prev, [username]: false }));
    }
  }, []);

  const noPosts = !loading && posts.length === 0;
  const builderCards = useMemo(() => builders.slice(0, 7), [builders]);

  return (
    <>
      <Helmet><title>Feed — Code Plus Academy</title></Helmet>
      <NoIndex />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .feed-shell { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 24px; align-items: start; }
        .feed-sidebar-desktop { display: block; }
        .feed-builders-mobile { display: none; }
        
        @media (max-width: 980px) {
          .feed-shell { grid-template-columns: minmax(0, 1fr); }
          .feed-sidebar-desktop { display: none !important; }
          .feed-builders-mobile { display: block !important; }
        }
        @media (max-width: 640px) {
          .feed-page { padding: 8px 8px 90px !important; }
        }
      `}</style>

      <div className="feed-page" style={{ padding: '16px 16px 90px', maxWidth: 1240, margin: '0 auto' }}>
        {/* Top Stories */}
        <section style={{ marginBottom: 14 }}>
          <StoryBar />
        </section>

        {/* ── Mobile In-Feed Horizontal Rising Builders ── */}
        <section className="feed-builders-mobile" style={{ marginBottom: 16 }}>
          <div style={{
            background: 'var(--s1, #080d1a)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#00dbe9" />
                <h2 style={{ margin: 0, color: 'var(--text, #fff)', fontSize: 13, fontWeight: 800 }}>
                  Rising Builders
                </h2>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)', color: '#00dbe9',
                  background: 'rgba(0, 219, 233, 0.1)', border: '1px solid rgba(0, 219, 233, 0.3)',
                  padding: '1px 5px', borderRadius: 4, fontWeight: 700,
                }}>
                  SUGGESTED
                </span>
              </div>

              <Link
                to="/network"
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  color: 'var(--dim, #94a3b8)', fontSize: 11, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>See all</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Horizontal Scroll Track */}
            <div style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingBottom: 4,
              scrollbarWidth: 'none',
            }}>
              {buildersLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      minWidth: 140,
                      width: 140,
                      height: 130,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      opacity: 0.5,
                      flexShrink: 0,
                    }}
                  />
                ))
              ) : builderCards.length > 0 ? (
                builderCards.map(builder => (
                  <MobileHorizontalBuilderCard
                    key={builder.username}
                    builder={builder}
                    currentUser={user}
                    followPending={Boolean(followPending[builder.username])}
                    onToggleFollow={toggleFollow}
                  />
                ))
              ) : null}
            </div>
          </div>
        </section>

        {/* ── Main Feed Layout ── */}
        <div className="feed-shell">
          {/* Main Feed Column */}
          <section>
            {loading && posts.length === 0 ? (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            ) : (
              posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  variant={index === 0 ? 'editorial-hero' : 'editorial'}
                />
              ))
            )}

            {feedError && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.35)',
                  background: 'rgba(127,29,29,0.2)',
                  color: '#fca5a5',
                  fontSize: 12,
                }}
              >
                {feedError}
              </div>
            )}

            {noPosts && !feedError && (
              <div
                style={{
                  padding: 28,
                  borderRadius: 14,
                  border: '1px dashed var(--border)',
                  color: 'var(--dim)',
                  textAlign: 'center',
                  fontSize: 13,
                }}
              >
                No posts found for this filter yet.
              </div>
            )}

            <div ref={sentinelRef} style={{ height: 24 }} />
            {loadingMore && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
                <Loader2 size={18} color="var(--sub)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                // end of feed
              </p>
            )}
          </section>

          {/* ── Desktop Right-Side Vertical Rectangle Sidebar ── */}
          <aside className="feed-sidebar-desktop" style={{ position: 'sticky', top: 84 }}>
            <div
              style={{
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#080d1a',
                padding: 16,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Sparkles size={15} color="#00dbe9" />
                  <h2 style={{ margin: 0, color: '#f0f2f8', fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-head, sans-serif)' }}>
                    Rising Builders
                  </h2>
                </div>
                <span style={{
                  color: '#00dbe9',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono, monospace)',
                  background: 'rgba(0, 219, 233, 0.1)',
                  border: '1px solid rgba(0, 219, 233, 0.3)',
                  padding: '2px 7px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}>
                  • LIVE
                </span>
              </div>

              <p style={{ margin: '0 0 14px', fontSize: 11, color: '#64748b' }}>
                Active engineers & campus contributors
              </p>

              {/* Vertical List of Builder Rows */}
              {buildersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.03)', opacity: 0.6 }} />
                  ))}
                </div>
              ) : builderCards.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {builderCards.map(builder => (
                    <DesktopBuilderRow
                      key={builder.username}
                      builder={builder}
                      currentUser={user}
                      followPending={Boolean(followPending[builder.username])}
                      onToggleFollow={toggleFollow}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--dim)', margin: 0, fontSize: 12 }}>No builders available right now.</p>
              )}

              {/* Footer Link */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <Link
                  to="/network"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#94a3b8',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '4px 6px',
                    borderRadius: 8,
                    transition: 'color 0.15s ease',
                  }}
                  className="hover:text-cyan-400"
                >
                  <span>Explore full network</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
