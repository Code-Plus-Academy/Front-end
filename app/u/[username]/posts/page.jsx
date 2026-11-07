import React, { Suspense } from 'react';
import ProfilePostsViewer from '../../../../src/views/ProfilePostsViewer';
import { AppLayout } from '../../../../src/components/layout/RouteWrappers';

let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/api';
}
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';

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

  if (!user) {
    return { title: 'Posts | FocusGram' };
  }

  const displayName = user.name || user.username;
  return {
    title: `${displayName} (@${username}) Posts`,
    description: `Browse ${displayName}'s posts and project showcases on FocusGram.`,
    openGraph: {
      title: `${displayName} (@${username}) Posts | FocusGram`,
      description: `Browse ${displayName}'s posts and project showcases on FocusGram.`,
      url: `${baseUrl}/u/${username}/posts`,
      images: user.avatar_url ? [user.avatar_url] : undefined,
    },
  };
}

export default async function Page({ params }) {
  const { username } = await params;
  return (
    <AppLayout profileLayout noPadding>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg, #070a0e)' }} />}>
        <ProfilePostsViewer customUsername={username} />
      </Suspense>
    </AppLayout>
  );
}
