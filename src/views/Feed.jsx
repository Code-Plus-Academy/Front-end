import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Filter, Loader2 } from 'lucide-react';
import NoIndex from '../components/seo/NoIndex';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import StoryBar from '../components/stories/StoryBar';
import PostCard from '../components/posts/PostCard';
import PostFilter from '../components/posts/PostFilter';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function BuilderCard({ builder, currentUser, followPending, onToggleFollow }) {
  const canFollow = currentUser && currentUser.username !== builder.username;

  return (
    <div
      style={{
        background: '#171c21',
        border: '1px solid rgba(74,68,87,0.2)',
        borderRadius: 14,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src={builder.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${builder.username}`}
          alt={builder.username}
          width={42}
          height={42}
          style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              color: '#dee3ea',
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {builder.name}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              color: '#958da3',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
            }}
          >
            @{builder.username}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#958da3', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
          {(builder.followers_count || 0).toLocaleString()} followers
        </span>
        {canFollow ? (
          <button
            onClick={() => onToggleFollow(builder)}
            disabled={followPending}
            style={{
              border: `1px solid ${builder.is_following ? '#4a4457' : '#6e00ff'}`,
              background: builder.is_following ? 'transparent' : 'rgba(110,0,255,0.14)',
              color: builder.is_following ? '#ccc3da' : '#d0bcff',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: followPending ? 'not-allowed' : 'pointer',
              opacity: followPending ? 0.6 : 1,
            }}
          >
            {followPending ? '...' : builder.is_following ? 'Following' : 'Follow'}
          </button>
        ) : (
          <span style={{ color: '#4cd6fb', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            Profile
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
  const [showFilter, setShowFilter] = useState(false);
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
      const res = await api.get('/users/search', { params: { limit: 8 } });
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

  return (
    <>
      <Helmet><title>Feed — Code Plus Academy</title></Helmet>
      <NoIndex />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .feed-shell { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 20px; align-items: start; }
        .builders-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (max-width: 980px) {
          .feed-shell { grid-template-columns: minmax(0,1fr); }
          .feed-sidebar { position: static !important; }
          .builders-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 640px) {
          .feed-page { padding: 12px 12px 90px !important; }
          .builders-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="feed-page" style={{ padding: '16px 16px 90px', maxWidth: 1240, margin: '0 auto' }}>
        <section
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: '1px solid rgba(74,68,87,0.2)',
            background: 'var(--surface)',
            padding: 12,
          }}
        >
          <StoryBar />
        </section>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button
            onClick={() => setShowFilter(v => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(74,68,87,0.35)',
              background: showFilter ? 'rgba(110,0,255,0.14)' : '#171c21',
              color: showFilter ? 'var(--sub)' : '#ccc3da',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            <Filter size={14} />
            {showFilter ? 'Hide Filter' : 'Show Filter'}
          </button>
        </div>

        {showFilter && (
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(74,68,87,0.25)',
              background: '#171c21',
              padding: '8px 14px',
              marginBottom: 16,
            }}
          >
            <PostFilter filters={filters} onChange={setFilters} />
          </div>
        )}

        <div className="feed-shell">
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
                  border: '1px dashed rgba(74,68,87,0.45)',
                  color: '#958da3',
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
              <p style={{ textAlign: 'center', color: '#6b7280', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                // end of feed
              </p>
            )}
          </section>

          <aside className="feed-sidebar" style={{ position: 'sticky', top: 84 }}>
            <div
              style={{
                borderRadius: 14,
                border: '1px solid rgba(74,68,87,0.2)',
                background: '#11161b',
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, color: '#dee3ea', fontSize: 14, fontWeight: 800 }}>Rising Builders</h2>
                <span style={{ color: '#4cd6fb', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Live</span>
              </div>

              {buildersLoading ? (
                <div className="builders-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ height: 94, borderRadius: 12, background: '#171c21', opacity: 0.6 }} />
                  ))}
                </div>
              ) : builderCards.length > 0 ? (
                <div className="builders-grid">
                  {builderCards.map(builder => (
                    <BuilderCard
                      key={builder.username}
                      builder={builder}
                      currentUser={user}
                      followPending={Boolean(followPending[builder.username])}
                      onToggleFollow={toggleFollow}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ color: '#958da3', margin: 0, fontSize: 12 }}>No builders available right now.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
