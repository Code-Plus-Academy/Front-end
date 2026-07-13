import React from 'react';
import { ResourceDetail } from '../../../src/views/StubPages';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

async function getResource(slug) {
  try {
    const res = await fetch(`${apiUrl}/resources/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.resource || data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) {
    return { title: 'Resource Not Found | Code Plus Academy' };
  }
  return {
    title: resource.title,
    description: resource.description || `Download ${resource.title} on Code Plus Academy`,
    openGraph: {
      title: resource.title,
      description: resource.description,
      type: 'website',
      url: `/resources/${slug}`,
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
