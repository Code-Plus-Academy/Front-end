import React from 'react';
import { ArticleDetail } from '../../../src/views/StubPages';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

async function getArticle(slug) {
  try {
    const res = await fetch(`${apiUrl}/articles/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.article || data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  if (!article) {
    return { title: 'Article Not Found | Code Plus Academy' };
  }
  return {
    title: article.title,
    description: article.description || `Read ${article.title} on Code Plus Academy`,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      url: `/articles/${params.slug}`,
      images: article.thumbnail_url ? [article.thumbnail_url] : undefined,
    }
  };
}

export default async function Page({ params }) {
  const article = await getArticle(params.slug);
  
  let jsonLd = null;
  if (article) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      image: article.thumbnail_url,
      datePublished: article.created_at,
      dateModified: article.updated_at || article.created_at,
      author: {
        '@type': 'Person',
        name: article.creator_name || article.creator_username || 'Author',
        url: article.creator_username ? `${baseUrl}/u/${article.creator_username}` : undefined,
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
        '@id': `${baseUrl}/articles/${article.slug}`,
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
      <AppLayout noPadding>
        <ArticleDetail />
      </AppLayout>
    </>
  );
}
