import React, { Suspense } from 'react';
import ShortsPage from '../../../src/views/ShortsPage';

let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/api';
}
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';


/**
 * Fetches a single short's metadata from the backend REST API.
 *
 * Shorts share the feed_videos table, so the same /videos/:id endpoint works.
 * The ShortsPage client component handles loading the full feed independently
 * (starting from this id) — this function is only for SSR metadata.
 *
 * Returns null on 404 / network failure.
 */
async function getShort(id) {
  try {
    const res = await fetch(`${apiUrl}/videos/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.video || data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// generateMetadata — per-short Open Graph / Twitter / canonical
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const short = await getShort(params.id);

  if (!short) {
    return {
      title: 'Short Not Found',
      description: 'The requested short could not be found on Code Plus Academy.',
    };
  }

  const isLive = short.content_type === 'live';

  // Title: live shorts get a 🔴 prefix.
  const rawTitle = short.title || 'Short';
  const title = isLive ? `🔴 Live: ${rawTitle}` : rawTitle;

  // Description: truncate to 155 chars at word boundary.
  const rawDesc   = short.description || rawTitle;
  const descTrunc = rawDesc.length > 155
    ? rawDesc.slice(0, rawDesc.lastIndexOf(' ', 155)) + '…'
    : rawDesc;

  // Thumbnail — may be null for some rows, degrade gracefully.
  const thumbnail = short.thumbnail_url || undefined;

  // Canonical URL always points to the shorts route.
  const canonicalUrl = `${baseUrl}/shorts/${short.id}`;

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
      // video.other is appropriate for short-form clips and live content alike
      // (avoids requiring series metadata that we don't have).
      type: 'video.other',
      ...(thumbnail ? { images: [{ url: thumbnail, alt: rawTitle }] } : {}),
    },
    twitter: {
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
// No 'use client' — this is intentionally a Server Component so that
// generateMetadata() above can run. ShortsPage is the Client Component
// that manages the TikTok-style scroll feed.
// ---------------------------------------------------------------------------

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
      <ShortsPage />
    </Suspense>
  );
}
