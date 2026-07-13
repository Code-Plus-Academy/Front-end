import React, { Suspense } from 'react';
import VideoDetailPage from '../../../src/views/VideoDetailPage';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

// Mirror the env-var lookup in src/api/axios.js so server-side fetches
// use the same backend URL as the client-side axios instance.
// NEXT_PUBLIC_API_BASE_URL is the var set in production (Cloudflare / hosting).
// NEXT_PUBLIC_API_URL is accepted as a fallback for any env that uses that name.
let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/api';
}
// NEXT_PUBLIC_APP_URL must match the actual deployment hostname
// e.g. https://beta.codeplusacademy.in or https://www.codeplusacademy.in
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';


/**
 * Fetches a single video row from the backend REST API.
 * Called at request time (server-side) to power generateMetadata().
 *
 * API response shape (feed_videos):
 *   { video: { id, title, description, thumbnail_url, content_type, ... } }
 *
 * Returns null on 404 / network failure — generateMetadata handles gracefully.
 */
async function getVideo(id) {
  try {
    const res = await fetch(`${apiUrl}/videos/${id}`, {
      next: { revalidate: 60 }, // revalidate SSR metadata every 60 s
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.video || data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// generateMetadata — per-video Open Graph / Twitter / canonical
// ---------------------------------------------------------------------------
// Field mapping (feed_videos table, confirmed correct per task brief):
//   video.title          → page title
//   video.description    → meta description
//   video.thumbnail_url  → OG image (may be null for some rows — handled below)
//   video.content_type   → 'short' | 'long' | 'live'
//   video.id             → used to build canonical URLs
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const video = await getVideo(params.id);

  if (!video) {
    return {
      title: 'Video Not Found',
      description: 'The requested video could not be found on Code Plus Academy.',
    };
  }

  const isLive  = video.content_type === 'live';
  const isShort = video.content_type === 'short';

  // Title: live streams get a 🔴 prefix so the tab/preview communicates state.
  // Short-form videos get a "— CPA Shorts" suffix to match the Helmet in ShortsPage.
  // Long-form videos get "— CPA Videos".
  const rawTitle = video.title || 'Video';
  const title = isLive
    ? `🔴 Live: ${rawTitle}`
    : rawTitle;

  // Subtitle suffix is applied via the root layout template: '%s | Code Plus Academy'
  // We return only the left portion here so the full tag reads:
  //   "🔴 Live: React Conf 2025 | Code Plus Academy"
  //   "React Vite vs Next.js | Code Plus Academy"

  // Description: always present in feed_videos per task brief.
  // Truncate at 155 chars to match other metadata in this codebase.
  const rawDesc   = video.description || rawTitle;
  const descTrunc = rawDesc.length > 155
    ? rawDesc.slice(0, rawDesc.lastIndexOf(' ', 155)) + '…'
    : rawDesc;

  // OG image: present for most rows. If null, degrade to summary card (no image).
  const thumbnail = video.thumbnail_url || undefined;

  // Canonical URL
  const canonicalUrl = isShort
    ? `${baseUrl}/shorts/${video.id}`
    : `${baseUrl}/videos/${video.id}`;

  return {
    title,
    description: descTrunc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: descTrunc,
      url: canonicalUrl,
      // Live streams: use video.other (no stable file URL).
      // Short/long videos: use video.other as well — video.episode requires
      // a series ID which we don't have; video.other is valid for standalone clips.
      type: 'video.other',
      // Only include images when we have a real thumbnail — avoids inheriting
      // the root layout's generic branded OG image for individual videos.
      ...(thumbnail ? { images: [{ url: thumbnail, alt: rawTitle }] } : {}),
    },
    twitter: {
      // summary_large_image when we have a thumbnail (shows a big preview).
      // summary when no thumbnail — avoids a broken/empty image slot.
      card: thumbnail ? 'summary_large_image' : 'summary',
      title,
      description: descTrunc,
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Page (Server Component shell)
// ---------------------------------------------------------------------------
// The default export is a Server Component — no 'use client' directive.
// VideoDetailPage (the actual UI) is a Client Component that handles its own
// data fetching via useParams() + axios — this shell just provides the
// AppLayout wrapper and Suspense boundary.
// ---------------------------------------------------------------------------

export default function Page() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <VideoDetailPage />
      </Suspense>
    </AppLayout>
  );
}
