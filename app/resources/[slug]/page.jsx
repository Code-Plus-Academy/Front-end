import React from 'react';
import { ResourceDetail } from '../../../src/views/StubPages';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/api';
}
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';

async function getResource(slug) {
  try {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slug);
    const endpoint = isUuid ? `/posts/${slug}` : `/posts/slug/${slug}`;
    const res = await fetch(`${apiUrl}${endpoint}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      const fallbackRes = await fetch(`${apiUrl}/resources/${slug}`, { next: { revalidate: 60 } });
      if (!fallbackRes.ok) return null;
      const fbData = await fallbackRes.json();
      return fbData.resource || fbData.post || fbData;
    }
    const data = await res.json();
    return data.post || data.resource || data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) {
    return { title: 'Resource Not Found' };
  }
  return {
    title: resource.title,
    description: resource.description || `Download ${resource.title} on FocusGram`,
    openGraph: {
      title: resource.title,
      description: resource.description,
      type: 'website',
      url: `${baseUrl}/resources/${slug}`,
      images: resource.thumbnail_url ? [resource.thumbnail_url] : undefined,
    }
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  
  let jsonLd = null;
  if (resource) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: resource.title,
      description: resource.description,
      image: resource.thumbnail_url,
      learningResourceType: resource.resource_type || 'Guide',
      creator: {
        '@type': 'Person',
        name: resource.creator_name || resource.creator_username || 'Creator',
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
      <AppLayout noPadding>
        <ResourceDetail />
      </AppLayout>
    </>
  );
}
