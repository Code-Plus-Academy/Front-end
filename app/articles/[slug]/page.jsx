import React from 'react';
import { ArticleDetail } from '../../../src/views/StubPages';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

// Mirror the env-var lookup in src/api/axios.js so server-side fetches
// use the same backend URL as the client-side axios instance.
// NEXT_PUBLIC_API_BASE_URL is the var set in production (Cloudflare / hosting).
// NEXT_PUBLIC_API_URL is accepted as a fallback for any env that uses that name.
let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';
// Ensure it ends with /api (same normalisation as axios.js line 22-24)
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/api';
}
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';



/**
 * Fetches article data from the backend REST API.
 * Revalidates every 60 s so SSR metadata stays fresh without full rebuilds.
 * Returns null on any error / 404.
 */
async function getArticle(slug) {
  try {
    const res = await fetch(`${apiUrl}/articles/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.article || data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// generateMetadata — per-article Open Graph / Twitter / canonical
// ---------------------------------------------------------------------------
// Field mapping (confirmed against DB schema + Explore.jsx usage):
//   article.title           → primary article title
//   article.meta.title      → optional SEO override title
//   article.meta.description → description (written by extractArticleMetadata
//                              at save/publish time, or by backfill script)
//   article.og_image_url    → OG image (written at publish time)
//   article.slug            → used to build canonical URL
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found on Code Plus Academy.',
    };
  }

  // Title: prefer explicit SEO title override, fall back to article title
  const rawTitle = article.meta?.title || article.title || 'Article';
  // The root layout applies the template: '%s | Code Plus Academy'
  // so we return just the article-level title portion here.
  const title = rawTitle;

  // Description: written at publish/save time by extractArticleMetadata.
  // Falls back to the raw title so the tag is always non-empty.
  const description = article.meta?.description || rawTitle;

  // OG image: stored in the top-level og_image_url column.
  // If not set, use our custom default article OG image so it renders nicely on WhatsApp.
  const ogImage = article.og_image_url || `${baseUrl}/default-article-og.jpg`;

  // Canonical URL: always www. — matching the production hostname
  const canonicalUrl = `https://www.codeplusacademy.in/articles/${article.slug || params.slug}`;

  return {
    title,
    description,
    // Canonical URL — prevents www vs non-www duplicate content issues
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: [{ url: ogImage, alt: rawTitle }],
      // Article-specific OG fields
      ...(article.published_at ? { publishedTime: article.published_at } : {}),
      ...(article.updated_at   ? { modifiedTime:  article.updated_at   } : {}),
      ...(article.creator_username ? { authors: [`${baseUrl}/u/${article.creator_username}`] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// XSS-safe JSON serialiser — replaces '<' to prevent script injection.
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function Page({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  // Build JSON-LD structured data for Article schema.
  // Googlebot and rich-result validators read this for enhanced search previews.
  let jsonLd = null;
  if (article) {
    const rawTitle = article.meta?.title || article.title || '';
    const description = article.meta?.description || rawTitle;
    const canonicalUrl = `https://www.codeplusacademy.in/articles/${article.slug || params.slug}`;

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: rawTitle,
      description,
      image: [article.og_image_url || `${baseUrl}/default-article-og.jpg`],
      datePublished: article.published_at || article.created_at || new Date().toISOString(),
      dateModified: article.updated_at || article.published_at || article.created_at || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: article.creator_name || article.creator_username || 'Code Plus Academy Author',
        ...(article.creator_username
          ? { url: `${baseUrl}/u/${article.creator_username}` }
          : {}),
      },
      publisher: {
        '@type': 'Organization',
        name: 'Code Plus Academy',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
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
      <AppLayout noPadding>
        <ArticleDetail />
      </AppLayout>
    </>
  );
}

