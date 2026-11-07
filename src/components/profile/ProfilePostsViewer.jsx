'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, RefreshCw, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import PostCard from '../posts/PostCard';
import { PostCardSkeleton } from '../ui/Skeleton';
import Avatar from '../ui/Avatar';
import { getGraphQLUserPosts, getGraphQLPostBySlugOrId, logGraphQLFallback } from '../../api/graphql';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

/**
 * ProfilePostsViewer
 *
 * Dedicated vertically-scrolling posts viewer matching FocusGram's mobile
 * ProfilePostsViewerScreen architecture:
 * - Displays posts in publication order (created_at DESC, id DESC).
 * - Initially positions view at the selected post (clamped index).
 * - Displays newer posts above and older posts below.
 * - Supports continuous vertical scrolling with forward compound cursor pagination.
 * - Prevents duplicate requests and duplicate post IDs.
 * - Synchronizes active post in view with browser URL (?post=:id) without full-page reload.
 * - Back-button restores previous profile view and scroll position.
 */
export default function ProfilePostsViewer({ customUsername, initialPostId } = {}) {
  const { username: routeUsername } = useParams();
  const username = customUsername || routeUsername;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const targetPostId = initialPostId || searchParams.get('post');

  // State from router navigation if passed from profile grid
  const routerState = location.state || {};
  const hasInitialPosts = Array.isArray(routerState.posts) && routerState.posts.length > 0;

  const [posts, setPosts] = useState(() => (hasInitialPosts ? routerState.posts : []));
  const [loading, setLoading] = useState(!hasInitialPosts);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState(() => routerState.pageInfo || {
    hasNextPage: true,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [creatorUser, setCreatorUser] = useState(() => routerState.user || null);

  const postIdsRef = useRef(new Set((hasInitialPosts ? routerState.posts : []).map(p => String(p.id))));
  const isFetchingMoreRef = useRef(false);
  const pageInfoRef = useRef(pageInfo);
  pageInfoRef.current = pageInfo;

  const postElementsRef = useRef(new Map());
  const sentinelRef = useRef(null);
  const hasScrolledInitialRef = useRef(false);

  // Helper to scroll to target post
  const scrollToTargetPost = useCallback((targetId, postsList) => {
    if (!targetId || !postsList || postsList.length === 0) return;
    const targetIdx = postsList.findIndex(p => String(p.id) === String(targetId) || String(p.slug) === String(targetId));
    const effectiveIdx = targetIdx >= 0 ? targetIdx : (typeof routerState.initialIndex === 'number' ? Math.max(0, Math.min(routerState.initialIndex, postsList.length - 1)) : 0);
    const targetPost = postsList[effectiveIdx];
    if (targetPost) {
      const el = postElementsRef.current.get(String(targetPost.id));
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        hasScrolledInitialRef.current = true;
      }
    }
  }, [routerState.initialIndex]);

  // Initial load when opened directly via URL or refresh
  useEffect(() => {
    if (hasInitialPosts && posts.length > 0) {
      if (!hasScrolledInitialRef.current) {
        setTimeout(() => {
          scrollToTargetPost(targetPostId, posts);
        }, 60);
      }
      return;
    }

    if (!username) return;

    let mounted = true;
    const loadInitialPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetchedPosts = [];
        let fetchedPageInfo = { hasNextPage: false, endCursor: null };

        try {
          const res = await getGraphQLUserPosts({ username, first: 12 });
          fetchedPosts = res.posts || [];
          fetchedPageInfo = res.pageInfo || { hasNextPage: false, endCursor: null };
        } catch (gqlErr) {
          logGraphQLFallback({ feature: 'Profile', operation: 'userPosts', error: gqlErr, fallbackEndpoint: `/users/${username}/posts` });
          const restRes = await api.get(`/users/${username}/posts`);
          fetchedPosts = restRes.data.posts || [];
          fetchedPageInfo = { hasNextPage: false, endCursor: null };
        }

        if (!mounted) return;

        // If target post is requested but not in the first page, fetch it directly
        if (targetPostId && !fetchedPosts.some(p => String(p.id) === String(targetPostId) || String(p.slug) === String(targetPostId))) {
          try {
            const single = await getGraphQLPostBySlugOrId(targetPostId);
            if (single && mounted) {
              fetchedPosts = [single, ...fetchedPosts.filter(p => String(p.id) !== String(single.id))];
            }
          } catch (_) {}
        }

        fetchedPosts.forEach(p => postIdsRef.current.add(String(p.id)));
        setPosts(fetchedPosts);
        setPageInfo(fetchedPageInfo);

        if (fetchedPosts.length > 0 && fetchedPosts[0].creator) {
          setCreatorUser(fetchedPosts[0].creator);
        }

        setTimeout(() => {
          if (mounted) {
            scrollToTargetPost(targetPostId, fetchedPosts);
          }
        }, 80);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load posts');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInitialPosts();
    return () => { mounted = false; };
  }, [username, targetPostId, hasInitialPosts, scrollToTargetPost]);

  // Fetch older posts pagination
  const fetchOlderPosts = useCallback(async () => {
    if (isFetchingMoreRef.current || !pageInfoRef.current.hasNextPage || !pageInfoRef.current.endCursor) {
      return;
    }

    isFetchingMoreRef.current = true;
    setIsFetchingMore(true);

    try {
      const res = await getGraphQLUserPosts({
        username,
        first: 12,
        after: pageInfoRef.current.endCursor,
      });

      const newPosts = (res.posts || []).filter(p => !postIdsRef.current.has(String(p.id)));
      newPosts.forEach(p => postIdsRef.current.add(String(p.id)));

      setPosts(prev => [...prev, ...newPosts]);
      setPageInfo(res.pageInfo || { hasNextPage: false, endCursor: null });
    } catch (err) {
      console.warn('[ProfilePostsViewer] Older posts pagination error:', err);
    } finally {
      isFetchingMoreRef.current = false;
      setIsFetchingMore(false);
    }
  }, [username]);

  // Sentinel IntersectionObserver for infinite scrolling to older posts
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchOlderPosts();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchOlderPosts]);

  // Synchronize visible post with browser URL without reloading
  useEffect(() => {
    if (typeof window === 'undefined' || posts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const id = entry.target.getAttribute('data-post-id');
            if (id) {
              const url = new URL(window.location.href);
              if (url.searchParams.get('post') !== id) {
                url.searchParams.set('post', id);
                window.history.replaceState(null, '', url.pathname + url.search);
              }
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    postElementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [posts]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/u/${username}`);
    }
  };

  const displayName = creatorUser?.name || username;
  const avatarUrl = creatorUser?.avatar_url || creatorUser?.avatarUrl || null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #070a0e)',
      color: 'var(--text, #f0f2f8)',
      paddingBottom: 90,
      width: '100%',
    }}>
      <Helmet>
        <title>{`${displayName} (@${username}) Posts | FocusGram`}</title>
      </Helmet>

      {/* Sticky Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(7, 10, 14, 0.85)',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleBack}
            aria-label="Back to profile"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text, #f0f2f8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              borderRadius: 8,
              transition: 'background-color 0.15s ease',
            }}
            className="hover:bg-[var(--s2,rgba(255,255,255,0.06))]"
          >
            <ArrowLeft size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar src={avatarUrl} name={displayName} size={32} />
            <div>
              <div style={{
                fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                fontWeight: 700,
                color: 'var(--text, #f0f2f8)',
                lineHeight: 1.2,
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)',
                color: 'var(--dim, #64748b)',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                @{username} â€¢ Posts
              </div>
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 12,
          fontFamily: '"JetBrains Mono", monospace',
          color: 'var(--sub, #94a3b8)',
        }}>
          {posts.length > 0 ? `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}` : ''}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        maxWidth: 680,
        width: '100%',
        margin: '0 auto',
        padding: '16px 12px',
        boxSizing: 'border-box',
      }}>
        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{
            background: 'var(--surface, #0d121a)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: '32px 20px',
            textAlign: 'center',
            margin: '40px auto',
            maxWidth: 420,
          }}>
            <AlertCircle size={36} color="var(--accent-purple, #a855f7)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Unable to load posts</div>
            <div style={{ fontSize: 13, color: 'var(--sub, #94a3b8)', marginBottom: 20 }}>{error}</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--primary, #00dbe9)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div style={{
            background: 'var(--surface, #0d121a)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
            margin: '40px auto',
            maxWidth: 420,
          }}>
            <Sparkles size={36} color="var(--primary, #00dbe9)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Posts Yet</div>
            <div style={{ fontSize: 13, color: 'var(--sub, #94a3b8)', lineHeight: 1.5, marginBottom: 20 }}>
              @{username} hasn't shared any posts yet.
            </div>
            <button
              onClick={handleBack}
              style={{
                background: 'transparent',
                border: '1px solid var(--border, rgba(255,255,255,0.15))',
                color: 'var(--text, #f0f2f8)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Return to Profile
            </button>
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && posts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {posts.map((p, index) => (
              <div
                key={p.id || index}
                ref={(el) => {
                  if (el) postElementsRef.current.set(String(p.id), el);
                  else postElementsRef.current.delete(String(p.id));
                }}
                data-post-id={p.id}
                style={{ width: '100%', scrollMarginTop: 68 }}
              >
                <PostCard
                  post={p}
                  variant="social"
                  position={index}
                  refSource="profile_posts_viewer"
                />
              </div>
            ))}

            {/* Bottom Sentinel for pagination */}
            <div ref={sentinelRef} style={{ height: 20, width: '100%' }} />

            {/* Pagination Loading Spinner */}
            {isFetchingMore && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 0',
                gap: 8,
                color: 'var(--primary, #00dbe9)',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
              }}>
                <Loader2 className="animate-spin" size={16} />
                <span>Loading older posts...</span>
              </div>
            )}

            {/* End of list banner */}
            {!pageInfo.hasNextPage && posts.length > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '28px 0 16px',
                color: 'var(--dim, #64748b)',
                fontSize: 12,
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                âœ“ You're all caught up with @{username}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
