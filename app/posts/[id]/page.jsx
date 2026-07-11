import React, { Suspense } from 'react';
import PostDetail from '../../../src/views/PostDetail';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

async function getPost(id) {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  const endpoint = isUuid ? `/posts/${id}` : `/posts/slug/${id}`;
  try {
    const res = await fetch(`${apiUrl}${endpoint}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.id);
  if (!post) {
    return { title: 'Post Not Found | Code Plus Academy' };
  }
  return {
    title: post.title,
    description: post.description || `Read ${post.title} on Code Plus Academy`,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `/posts/${params.id}`,
      images: post.thumbnail_url ? [post.thumbnail_url] : undefined,
    }
  };
}

export default async function Page({ params }) {
  const post = await getPost(params.id);
  
  let jsonLd = null;
  if (post) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': post.type === 'tutorial' || post.type === 'article' ? 'Article' : 'SocialMediaPosting',
      headline: post.title,
      description: post.description,
      image: post.thumbnail_url,
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      author: {
        '@type': 'Person',
        name: post.creator_name || post.creator_username,
        url: `${baseUrl}/u/${post.creator_username}`,
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
        '@id': `${baseUrl}/posts/${post.id || post.slug}`,
      },
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
          <PostDetail />
        </Suspense>
      </AppLayout>
    </>
  );
}
