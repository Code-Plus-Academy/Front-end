import React, { Suspense } from 'react';
import ShortsPage from '../../../src/views/ShortsPage';
import { getEmbedUrl, detectPlatform } from '../../../src/utils/videoEmbed';

let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.codeplusacademy.in/api' : 'http://localhost:3001/api');
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/+$/, '') + '/api';
}
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';

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
        totalSeconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
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

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

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
  const { id } = await params;
  const short = await getShort(id);

  if (!short) {
    return {
      title: 'Short Not Found',
      description: 'The requested short could not be found on FocusGram.',
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
// Generates VideoObject structured data for Google Rich Results.
// Each short at /shorts/:id is a dedicated watch page per Google guidelines.
// ---------------------------------------------------------------------------

export default async function Page({ params }) {
  const { id } = await params;
  const short = await getShort(id);

  let jsonLd = null;
  if (short) {
    const rawTitle = short.title || 'Short';
    const rawDesc = short.description || rawTitle;
    const canonicalUrl = `${baseUrl}/shorts/${short.id}`;
    const isoDuration = durationToISO8601(short.duration_seconds ?? short.duration_formatted);

    const platform = short.source_platform || detectPlatform(short.video_url || short.source_url);
    let contentUrl = undefined;
    let embedUrl = short.embed_url || undefined;

    if (platform === 'direct') {
      contentUrl = short.video_url || undefined;
    } else {
      embedUrl = embedUrl || getEmbedUrl(short) || undefined;
    }

    if (!contentUrl && !embedUrl) {
      embedUrl = canonicalUrl;
    }

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': ['VideoObject', 'LearningResource'],
      name: rawTitle,
      description: rawDesc.length > 5000 ? rawDesc.slice(0, 5000) + '…' : rawDesc,
      thumbnailUrl: [short.thumbnail_url || `${baseUrl}/default-article-og.jpg`],
      uploadDate: short.created_at
        ? new Date(short.created_at).toISOString()
        : new Date().toISOString(),
      ...(isoDuration ? { duration: isoDuration } : {}),
      ...(contentUrl ? { contentUrl } : {}),
      ...(embedUrl ? { embedUrl } : {}),
      url: canonicalUrl,
      learningResourceType: 'Video',
      publisher: {
        '@type': 'Organization',
        name: 'Code Plus Academy',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
        url: baseUrl,
      },
      ...(short.original_creator_name ? {
        author: {
          '@type': 'Person',
          name: short.original_creator_name,
          ...(short.original_creator_url ? { url: short.original_creator_url } : {}),
        },
      } : short.creator_name ? {
        author: {
          '@type': 'Person',
          name: short.creator_name,
          ...(short.creator_username
            ? { url: `${baseUrl}/u/${short.creator_username}` }
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
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#000' }} />}>
        <ShortsPage />
      </Suspense>
    </>
  );
}
