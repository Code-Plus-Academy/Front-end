import React, { Suspense } from 'react';
import PublicProfile from '../../../src/views/PublicProfile';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

async function getUserProfile(username) {
  try {
    const res = await fetch(`${apiUrl}/users/${username}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const user = await getUserProfile(params.username);
  if (!user) {
    return { title: 'User Not Found | Code Plus Academy' };
  }
  
  const displayName = user.name || user.username;
  const description = user.bio || `View ${displayName}'s profile on Code Plus Academy.`;

  return {
    title: `${displayName} (@${user.username})`,
    description,
    openGraph: {
      title: `${displayName} (@${user.username}) | Code Plus Academy`,
      description,
      type: 'profile',
      url: `/u/${params.username}`,
      images: user.avatar_url ? [user.avatar_url] : undefined,
    }
  };
}

export default async function Page({ params }) {
  const user = await getUserProfile(params.username);
  
  let jsonLd = null;
  if (user) {
    const displayName = user.name || user.username;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: displayName,
        alternateName: user.username,
        description: user.bio,
        image: user.avatar_url,
        url: `${baseUrl}/u/${user.username}`,
        jobTitle: user.title || undefined,
      }
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
