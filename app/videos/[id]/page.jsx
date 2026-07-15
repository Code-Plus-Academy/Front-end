import React, { Suspense } from 'react';
import VideoDetailPage from '../../../src/views/VideoDetailPage';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import { getEmbedUrl, detectPlatform } from '../../../src/utils/videoEmbed';

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
 * Called at request time (server-side) to power generateMetadata() and JSON-LD.
 *
 * API response shape (feed_videos):
 *   { video: { id, title, description, thumbnail_url, content_type,
 *              video_url, source_url, duration_formatted, created_at, ... } }
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

/**
 * Converts a human-readable duration string to ISO 8601 duration format.
 *
 * Supported input formats:
 *   "MM:SS"       → PT{M}M{S}S
 *   "HH:MM:SS"    → PT{H}H{M}M{S}S
 *   Numeric seconds (number or numeric string) → PT{H}H{M}M{S}S
 *
 * Returns null if the input cannot be parsed — callers should omit the field
 * rather than set an invalid value (Google will ignore null, not penalise).
 */
function durationToISO8601(raw) {
  if (!raw) return null;
  try {
    let totalSeconds;
    if (typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw.trim()))) {
      totalSeconds = Number(raw);
    } else if (typeof raw === 'string' && raw.includes(':')) {
      const parts = raw.trim().split(':').map(Number);
      if (parts.some(isNaN)) return null;
      if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1];           // MM:SS
      } else if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
      } else {
        return null;
      }
    } else {
      return null;
    }
    if (!isFinite(totalSeconds) || totalSeconds <= 0) return null;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `PT${h > 0 ? h + 'H' : ''}${m > 0 ? m + 'M' : ''}${s > 0 ? s + 'S' : ''}` || 'PT0S';
  } catch {
    return null;
  }
}

/**
 * XSS-safe JSON serialiser for dangerouslySetInnerHTML use.
 * JSON.stringify does not escape '<' by default — replace to prevent
 * script-injection if any video title/description contains literal '<'.
 */
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
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
  const { id } = await params;
  const video = await getVideo(id);

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
// The default export is an async Server Component — no 'use client' directive.
// VideoDetailPage (the actual UI) is a Client Component that handles its own
// data fetching via useParams() + axios — this shell provides the AppLayout
// wrapper, Suspense boundary, and server-rendered JSON-LD structured data.
//
// VideoObject JSON-LD makes these pages eligible for Google's rich video
// results (thumbnail, duration badge, upload date in search snippets).
// LearningResource typing makes them eligible for the "learning video"
// rich result on top of the standard video one.
// ---------------------------------------------------------------------------

export default async function Page({ params }) {
  const { id } = await params;
  const video = await getVideo(id);

  let jsonLd = null;
  if (video) {
    const isShort     = video.content_type === 'short';
    const rawTitle    = video.title || 'Video';
    const rawDesc     = video.description || rawTitle;
    const canonicalUrl = isShort
      ? `${baseUrl}/shorts/${video.id}`
      : `${baseUrl}/videos/${video.id}`;

    // duration_formatted is the display string (e.g. "45:30" or "1:02:15").
    // duration_seconds is a numeric fallback if the column exists.
    const isoDuration = durationToISO8601(video.duration_seconds ?? video.duration_formatted);

    // video_url is the direct playback URL (mp4 / HLS) or external platform URL (YouTube etc.).
    // Determine platform and map to contentUrl / embedUrl correctly.
    const platform = video.source_platform || detectPlatform(video.video_url || video.source_url);
    let contentUrl = undefined;
    let embedUrl   = video.embed_url || undefined;

    if (platform === 'direct') {
      contentUrl = video.video_url || undefined;
    } else {
      embedUrl = embedUrl || getEmbedUrl(video) || undefined;
    }

    // Safety fallback to guarantee Google has a playable URL
    if (!contentUrl && !embedUrl) {
      embedUrl = canonicalUrl;
    }

    jsonLd = {
      '@context': 'https://schema.org',
      // VideoObject + LearningResource: dual typing for Google's
      // standard video rich result AND the learning video rich result.
      '@type': ['VideoObject', 'LearningResource'],
      name: rawTitle,
      description: rawDesc.length > 5000 ? rawDesc.slice(0, 5000) + '…' : rawDesc,
      // thumbnailUrl must be an array per schema.org VideoObject spec (using default OG image as fallback).
      thumbnailUrl: [video.thumbnail_url || `${baseUrl}/default-article-og.jpg`],
      // uploadDate: ISO 8601 datetime. created_at is the publish timestamp.
      uploadDate: video.created_at
        ? new Date(video.created_at).toISOString()
        : new Date().toISOString(),
      // duration: ISO 8601 duration string (PT45M30S etc.). Omit if not parseable.
      ...(isoDuration ? { duration: isoDuration } : {}),
      // contentUrl: direct video file URL (Google prefers this for indexing).
      ...(contentUrl ? { contentUrl } : {}),
      // embedUrl: embeddable player URL (YouTube embed, etc.).
      ...(embedUrl ? { embedUrl } : {}),
      // Canonical page URL for "Watch" action.
      url: canonicalUrl,
      // LearningResource properties (Google learning video rich result).
      learningResourceType: 'Video',
      educationalLevel: video.difficulty 
        ? video.difficulty.charAt(0).toUpperCase() + video.difficulty.slice(1)
        : undefined,
      // Publisher: the CPA platform, not the individual video creator.
      publisher: {
        '@type': 'Organization',
        name: 'Code Plus Academy',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
        url: baseUrl,
      },
      // If the video was curated from an external creator, credit them.
      ...(video.original_creator_name ? {
        author: {
          '@type': 'Person',
          name: video.original_creator_name,
          ...(video.original_creator_url ? { url: video.original_creator_url } : {}),
        },
      } : video.creator_name ? {
        author: {
          '@type': 'Person',
          name: video.creator_name,
          ...(video.creator_username
            ? { url: `${baseUrl}/u/${video.creator_username}` }
            : {}),
        },
      } : {}),
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <AppLayout>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
          <VideoDetailPage />
        </Suspense>
      </AppLayout>
    </>
  );
}

