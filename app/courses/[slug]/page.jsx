import React from 'react';
import { CourseDetail } from '../../../src/views/StubPages';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';
import Script from 'next/script';

let apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001/api';
if (apiUrl && !apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/api';
}
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.codeplusacademy.in';

async function getCourse(slug) {
  try {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slug);
    const endpoint = isUuid ? `/posts/${slug}` : `/posts/slug/${slug}`;
    const res = await fetch(`${apiUrl}${endpoint}`, { next: { revalidate: 60 } });
    if (!res.ok) {
      const fallbackRes = await fetch(`${apiUrl}/courses/${slug}`, { next: { revalidate: 60 } });
      if (!fallbackRes.ok) return null;
      const fbData = await fallbackRes.json();
      return fbData.course || fbData.post || fbData;
    }
    const data = await res.json();
    return data.post || data.course || data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) {
    return { title: 'Course Not Found' };
  }
  return {
    title: course.title,
    description: course.description || `Take the ${course.title} course on FocusGram`,
    openGraph: {
      title: course.title,
      description: course.description,
      type: 'website',
      url: `${baseUrl}/courses/${slug}`,
      images: course.thumbnail_url ? [course.thumbnail_url] : undefined,
    }
  };
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const course = await getCourse(slug);

  let jsonLd = null;
  if (course) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.description,
      image: course.thumbnail_url,
      provider: {
        '@type': 'Organization',
        name: 'FocusGram',
        sameAs: baseUrl,
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        instructor: {
          '@type': 'Person',
          name: course.creator_name || course.creator_username || 'Instructor',
        }
      }
    };
  }

  return (
    <>
      {jsonLd && (
        <Script
          id="course-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <AppLayout noPadding>
        <CourseDetail />
      </AppLayout>
    </>
  );
}