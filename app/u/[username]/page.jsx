import React, { Suspense } from 'react';
import PublicProfile from '../../../src/views/PublicProfile';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

// Use the same dual env-var lookup as src/api/axios.js.
// NEXT_PUBLIC_API_BASE_URL is the primary production variable;
// NEXT_PUBLIC_API_URL is accepted as a fallback.
let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/api';
}
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';

/**
 * XSS-safe JSON serialiser for dangerouslySetInnerHTML use.
 * JSON.stringify does not escape '<' by default — replace to prevent
 * script-injection if any bio / name field contains literal '<'.
 */
function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

async function getUserProfile(username) {
  try {
    const res = await fetch(`${apiUrl}/users/${username}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const user = await getUserProfile(username);

  // Return only the bare title — the root layout template ('%s | Code Plus Academy')
  // will append the brand suffix automatically. Do NOT include the brand name here
  // or the result will be doubled: "Not Found | Code Plus Academy | Code Plus Academy".
  if (!user) {
    return { title: 'User Not Found' };
  }

  const displayName = user.name || user.username;
  const description = user.bio || `View ${displayName}'s profile on Code Plus Academy.`;

  return {
    title: `${displayName} (@${user.username})`,
    description,
    alternates: {
      canonical: `/u/${username}`,
    },
    openGraph: {
      // OG title can include the brand suffix since it's not processed by the template.
      title: `${displayName} (@${user.username}) | Code Plus Academy`,
      description,
      type: 'profile',
      // Absolute URL — required by OG spec; relative paths can confuse scrapers.
      url: `${baseUrl}/u/${username}`,
      images: user.avatar_url ? [{ url: user.avatar_url, alt: displayName }] : undefined,
    },
    twitter: {
      card: user.avatar_url ? 'summary' : 'summary',
      title: `${displayName} (@${user.username})`,
      description,
      ...(user.avatar_url ? { images: [user.avatar_url] } : {}),
    },
  };
}

function safeIsoDate(val) {
  if (!val) return undefined;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch {
    return undefined;
  }
}

export default async function Page({ params }) {
  const { username } = await params;
  const user = await getUserProfile(username);

  let jsonLd = null;
  if (user) {
    const displayName = user.name || user.username;

    // Build interactionStatistic array.
    // Only include a stat if the field exists on the API response and is non-negative.
    const interactionStatistics = [];
    if (typeof user.followers_count === 'number' && user.followers_count >= 0) {
      interactionStatistics.push({
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/FollowAction',
        userInteractionCount: user.followers_count,
      });
    }
    if (typeof user.following_count === 'number' && user.following_count >= 0) {
      interactionStatistics.push({
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/BefriendAction',
        userInteractionCount: user.following_count,
      });
    }

    // Collect verified external social links (sameAs).
    const sameAs = [];
    if (user.github_url)    sameAs.push(user.github_url);
    if (user.linkedin_url)  sameAs.push(user.linkedin_url);
    if (user.twitter_url)   sameAs.push(user.twitter_url);
    if (user.website_url)   sameAs.push(user.website_url);
    if (user.portfolio_url) sameAs.push(user.portfolio_url);

    const createdDate = safeIsoDate(user.created_at);
    const modifiedDate = safeIsoDate(user.updated_at);

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      // dateCreated / dateModified help Google understand freshness.
      ...(createdDate ? { dateCreated: createdDate } : {}),
      ...(modifiedDate ? { dateModified: modifiedDate } : {}),
      url: `${baseUrl}/u/${user.username}`,
      mainEntity: {
        '@type': 'Person',
        name: displayName,
        // alternateName = @handle as displayed in the title.
        alternateName: `@${user.username}`,
        description: user.bio || undefined,
        image: user.avatar_url || `${baseUrl}/logo.png`,
        url: `${baseUrl}/u/${user.username}`,
        // jobTitle maps to the "title" column (e.g. "Full Stack Developer").
        jobTitle: user.title || undefined,
        ...(sameAs.length > 0 ? { sameAs } : {}),
        // interactionStatistic: real follower count pulled from server-fetched data.
        // Google uses this for the "N+ followers" line in profile rich results.
        ...(interactionStatistics.length > 0
          ? { interactionStatistic: interactionStatistics }
          : {}),
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
      <AppLayout>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
          <PublicProfile />
        </Suspense>
      </AppLayout>
    </>
  );
}
