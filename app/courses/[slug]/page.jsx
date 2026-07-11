import React from 'react';
import { CourseDetail } from '../../../src/views/StubPages';
import { AppLayout } from '../../../src/components/layout/RouteWrappers';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beta.codeplusacademy.in';

async function getCourse(slug) {
  try {
    const res = await fetch(`${apiUrl}/courses/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.course || data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const course = await getCourse(params.slug);
  if (!course) {
    return { title: 'Course Not Found | Code Plus Academy' };
  }
  return {
    title: course.title,
    description: course.description || `Take the ${course.title} course on Code Plus Academy`,
    openGraph: {
      title: course.title,
      description: course.description,
      type: 'website', // Courses can use website or a custom type
      url: `/courses/${params.slug}`,
      images: course.thumbnail_url ? [course.thumbnail_url] : undefined,
    }
  };
}

export default async function Page({ params }) {
  const course = await getCourse(params.slug);
  
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
        name: 'Code Plus Academy',
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
        <script
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
