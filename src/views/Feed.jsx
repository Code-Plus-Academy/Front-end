import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
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

// ─── Verified Badge (Instagram/Twitter style blue check badge) ────────────────
const VerifiedBadge = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginLeft: 4 }}
  >
    <circle cx="12" cy="12" r="10" fill="#0095f6" />
    <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Suggested User Row Component (Exact Match to Reference Design) ───────────
function SuggestedUserRow({ builder, currentUser, followPending, onToggleFollow }) {
  const canFollow = currentUser && currentUser.username !== builder.username;
  const isFollowing = Boolean(builder.is_following);
  const isPending = Boolean(followPending);
  const mutual = builder.mutual_follower;
  const isVerified = Boolean(
    builder.is_verified ||
    builder.account_type === 'mentor' ||
    builder.account_type === 'creator' ||
    builder.account_type === 'admin'
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 0',
        gap: 12,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Link
        to={`/u/${builder.username}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
          flex: 1,
          textDecoration: 'none',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={builder.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(builder.name || builder.username)}&backgroundColor=6e00ff,00dbe9,3b82f6`}
            alt={builder.username}
            width={44}
            height={44}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
              background: 'var(--s3, #1e293b)',
              display: 'block',
            }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(builder.name || builder.username)}&backgroundColor=6e00ff,00dbe9,3b82f6`;
            }}
          />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                color: 'var(--text, #f8fafc)',
                fontWeight: 600,
                fontSize: 13.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3,
              }}
            >
              {builder.name || builder.username}
            </span>
            {isVerified && <VerifiedBadge />}
          </div>

          <div
            style={{
              margin: '2px 0 0',
              color: 'var(--dim, #8e8e8e)',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {mutual ? (
              <>
                <img
                  src={mutual.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(mutual.username || 'user')}&backgroundColor=6e00ff,00dbe9`}
                  alt=""
                  width={14}
                  height={14}
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid var(--border, rgba(255,255,255,0.15))',
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Followed by {mutual.username}
                </span>
              </>
            ) : (
              <span>Suggested for you</span>
            )}
          </div>
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
              border: isFollowing ? '1px solid var(--border, rgba(255, 255, 255, 0.2))' : 'none',
              background: isFollowing ? 'var(--s2, rgba(255, 255, 255, 0.06))' : 'transparent',
              color: isFollowing ? 'var(--text, #dee3ea)' : '#3B82F6',
              borderRadius: isFollowing ? 8 : 0,
              padding: isFollowing ? '5px 12px' : '4px 6px',
              fontSize: isFollowing ? 12 : 12.5,
              fontWeight: 700,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isFollowing ? (
              'Following'
            ) : (
              'Follow'
            )}
          </button>
        ) : (
          <span style={{ color: 'var(--dim)', fontSize: 11 }}>You</span>
        )}
      </div>
    </div>
  );
}

// ─── Mobile Horizontal Rising Builders Card & Rail (Preserved Mobile UX) ─────
function MobileHorizontalBuilderCard({ builder, currentUser, followPending, onToggleFollow }) {
  const canFollow = currentUser && currentUser.username !== builder.username;
  const isFollowing = Boolean(builder.is_following);
  const isPending = Boolean(followPending);
  const isVerified = Boolean(
    builder.is_verified ||
    builder.account_type === 'mentor' ||
    builder.account_type === 'creator' ||
    builder.account_type === 'admin'
  );

  return (
    <div
      style={{
        minWidth: 156,
        width: 156,
        minHeight: 196,
        background: 'var(--surface, #151c24)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
        borderRadius: 16,
        padding: '16px 12px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        boxShadow: 'var(--shadow-card, 0 4px 16px rgba(0, 0, 0, 0.08))',
      }}
    >
      <Link
        to={`/u/${builder.username}`}
        style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <img
            src={builder.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(builder.name || builder.username)}&backgroundColor=6e00ff,00dbe9,3b82f6`}
            alt={builder.username}
            width={56}
            height={56}
            style={{
              borderRadius: 16,
              objectFit: 'cover',
              border: '2px solid var(--border, rgba(255, 255, 255, 0.1))',
              background: 'var(--s3, #1e293b)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(builder.name || builder.username)}&backgroundColor=6e00ff,00dbe9,3b82f6`;
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' }}>
          <p
            style={{
              margin: 0,
              color: 'var(--text, #f8fafc)',
              fontWeight: 700,
              fontSize: 13,
              maxWidth: 110,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {builder.name || builder.username}
          </p>
          {isVerified && <VerifiedBadge />}
        </div>

        <p
          style={{
            margin: '2px 0 10px',
            color: 'var(--dim, #8e8e8e)',
            fontSize: 11,
            fontFamily: 'var(--font-mono, monospace)',
            maxWidth: '100%',
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFollow(builder);
            }}
            disabled={isPending}
            style={{
              width: '100%',
              padding: '6px 0',
              borderRadius: 8,
              border: isFollowing ? '1px solid var(--border, rgba(255, 255, 255, 0.2))' : 'none',
              background: isFollowing ? 'var(--s2, rgba(255, 255, 255, 0.06))' : 'var(--primary, #3B7CFF)',
              color: isFollowing ? 'var(--text, #dee3ea)' : '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isFollowing ? (
              <>
                <Check size={13} />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus size={13} />
                <span>Follow</span>
              </>
            )}
          </button>
        ) : (
          <span style={{ color: 'var(--dim)', fontSize: 11 }}>You</span>
        )}
      </div>
    </div>
  );
}

function HorizontalRisingBuildersRail({ builders, loading, currentUser, followPending, onToggleFollow }) {
  if (!loading && (!builders || builders.length === 0)) return null;

  return (
    <div style={{
      background: 'transparent',
      border: 'none',
      borderRadius: 0,
      padding: '8px 0 16px',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} style={{ color: 'var(--color-brand-teal, var(--primary, #3B7CFF))' }} />
          <h2 style={{ margin: 0, color: 'var(--text, #f8fafc)', fontSize: 13.5, fontWeight: 800 }}>
            Rising Builders
          </h2>
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: 'var(--primary, #3B7CFF)',
            background: 'var(--blue-dim, rgba(59, 124, 255, 0.1))', border: '1px solid var(--border, rgba(255,255,255,0.1))',
            padding: '1px 5px', borderRadius: 4, fontWeight: 700,
          }}>
            SUGGESTED
          </span>
        </div>

        <Link
          to="/network"
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            color: 'var(--sub, #94a3b8)', fontSize: 11, fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span>See all</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Horizontal Snap Scroll Track */}
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                minWidth: 156,
                width: 156,
                height: 196,
                borderRadius: 16,
                background: 'var(--s2, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                opacity: 0.6,
                flexShrink: 0,
              }}
            />
          ))
        ) : builders.length > 0 ? (
          builders.map(builder => (
            <MobileHorizontalBuilderCard
              key={builder.username}
              builder={builder}
              currentUser={currentUser}
              followPending={Boolean(followPending[builder.username])}
              onToggleFollow={onToggleFollow}
            />
          ))
        ) : null}
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
  const builderCards = useMemo(() => builders.slice(0, 8), [builders]);

  // Insert suggestions in between post cards (after 2nd post or after 1st post if only 1)
  const suggestionInsertIndex = posts.length > 1 ? 1 : 0;

  return (
    <>
      <Helmet><title>Feed — Code Plus Academy</title></Helmet>
      <NoIndex />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .feed-shell { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 24px; align-items: start; }
        .feed-sidebar-desktop { display: block; }
        .feed-builders-infeed { display: none; }
        
        @media (max-width: 980px) {
          .feed-shell { grid-template-columns: minmax(0, 1fr); }
          .feed-sidebar-desktop { display: none !important; }
          .feed-builders-infeed { display: block !important; }
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
                <Fragment key={post.id}>
                  <PostCard
                    post={post}
                    variant={index === 0 ? 'editorial-hero' : 'editorial'}
                  />

                  {/* Interleave Rising Builders in-between posts on mobile */}
                  {index === suggestionInsertIndex && (
                    <div className="feed-builders-infeed" style={{ margin: '14px 0 18px' }}>
                      <HorizontalRisingBuildersRail
                        builders={builderCards}
                        loading={buildersLoading}
                        currentUser={user}
                        followPending={followPending}
                        onToggleFollow={toggleFollow}
                      />
                    </div>
                  )}
                </Fragment>
              ))
            )}

            {/* If feed has no posts, still display suggestions */}
            {noPosts && !loading && (
              <div className="feed-builders-infeed" style={{ margin: '14px 0 18px' }}>
                <HorizontalRisingBuildersRail
                  builders={builderCards}
                  loading={buildersLoading}
                  currentUser={user}
                  followPending={followPending}
                  onToggleFollow={toggleFollow}
                />
              </div>
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
                  marginTop: 12,
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

          {/* ── Desktop Right-Side Vertical Rectangle Sidebar (Exact Reference Match) ── */}
          <aside className="feed-sidebar-desktop" style={{ position: 'sticky', top: 84 }}>
            <div
              style={{
                borderRadius: 16,
                border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                background: 'var(--surface, #151c24)',
                padding: '16px 18px',
                boxShadow: 'var(--shadow-card, 0 8px 32px rgba(0, 0, 0, 0.08))',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ margin: 0, color: 'var(--text, #f8fafc)', fontSize: 14.5, fontWeight: 700 }}>
                  Suggested for you
                </h2>

                <Link
                  to="/network"
                  style={{
                    color: 'var(--sub, #94a3b8)',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  See all
                </Link>
              </div>

              {/* Vertical List of Suggested User Rows */}
              {buildersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ height: 48, borderRadius: 10, background: 'var(--s2, rgba(255, 255, 255, 0.04))', opacity: 0.6, margin: '4px 0' }} />
                  ))}
                </div>
              ) : builderCards.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {builderCards.map(builder => (
                    <SuggestedUserRow
                      key={builder.username}
                      builder={builder}
                      currentUser={user}
                      followPending={Boolean(followPending[builder.username])}
                      onToggleFollow={toggleFollow}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--dim)', margin: 0, fontSize: 12 }}>No suggestions available right now.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
