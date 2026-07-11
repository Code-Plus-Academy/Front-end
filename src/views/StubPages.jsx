'use client';
/**
 * StubPages â€” V4.0 V2
 *
 * ArticleDetail, ResourceDetail, CourseDetail:
 *   â†’ Now fetch from /api/articles/:slug (new cpa-content DB)
 *   â†’ Renders via ArticlePage (block-based renderer)
 *
 * ActivityResolver, DevProfile, Followers, Following:
 *   â†’ Unchanged from V1
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import api from '../api/axios';
import PostDetail from './PostDetail';
import ArticlePage from './public/ArticlePage';

// â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// Resources + Courses â†’ still use old posts API for now
export const ResourceDetail      = () => <SlugContentPage />;
export const CourseDetail        = () => <SlugContentPage />;
export const ResourceUserDetail  = () => <SlugContentPage useUsername />;
export const CourseUserDetail    = () => <SlugContentPage useUsername />;

// â”€â”€ Remaining stubs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function DevProfile() {
  const { username } = useParams();
  return <Navigate to={username ? `/u/${username}` : '/feed'} replace />;
}
export const Followers  = () => <div>Followers</div>;
export const Following  = () => <div>Following</div>;
