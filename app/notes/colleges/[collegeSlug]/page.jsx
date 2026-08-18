import React from 'react';
import { notFound } from 'next/navigation';
import { getCollegeBySlug, queryTable, enrichNotesWithSocialUploaders } from '../../../../src/lib/supabaseContent';
import CollegeHubClient from './CollegeHubClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collegeSlug } = await params;
  const college = await getCollegeBySlug(collegeSlug);

  if (!college) {
    return {
      title: 'College Not Found | Notes Arena',
      description: 'The requested college could not be found on Notes Arena.',
    };
  }

  const title = `${college.name} Notes, PYQs & Study Material | Notes Arena`;
  const description = `Download ${college.name} previous year question papers, lecture notes, assignments, laboratory manuals, and syllabus files on Notes Arena.`;
  const canonicalUrl = `https://www.codeplusacademy.in/notes/colleges/${college.slug}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      images: [college.logo_url ?? '/og-default-notes.png'],
      type: 'website',
      url: canonicalUrl,
    },
  };
}

export default async function CollegeProfilePage({ params, searchParams }) {
  const { collegeSlug } = await params;
  const sParams = await searchParams;
  const initialTab = sParams?.tab || (sParams?.type === 'pyq' ? 'pyqs' : 'notes');

  const college = await getCollegeBySlug(collegeSlug);

  if (!college) {
    notFound();
  }

  // Fetch parent university info, notes, and courses in parallel
  let university = null;
  let notes = [];
  let courses = college.courses || [];

  try {
    const [uniRes, notesRes, coursesRes] = await Promise.all([
      college.university_id
        ? queryTable('universities', '*', { id: `eq.${college.university_id}` }).catch(() => [])
        : Promise.resolve([]),
      queryTable('notes', 'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at,uploader_id,description,custom_course_name,course_id', {
        college_id: `eq.${college.id}`,
        status: 'eq.published',
        order: 'created_at.desc',
        limit: '200',
      }).catch(() => []),
      courses.length === 0
        ? queryTable('college_courses', '*', { college_id: `eq.${college.id}` }).catch(() => [])
        : Promise.resolve(courses),
    ]);

    if (uniRes && uniRes.length > 0) {
      university = uniRes[0];
    } else if (college.university) {
      university = {
        name: college.university,
        slug: college.university.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        short_name: college.university,
      };
    }

    const rawNotes = notesRes || [];
    notes = await enrichNotesWithSocialUploaders(rawNotes);
    courses = coursesRes && coursesRes.length > 0 ? coursesRes : courses;
  } catch (err) {
    console.error('[CollegeProfilePage] data load error:', err.message);
  }

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: college.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: college.location || 'India',
    },
    url: `https://www.codeplusacademy.in/notes/colleges/${college.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }}
      />
      <CollegeHubClient
        college={college}
        university={university}
        courses={courses}
        notes={notes}
        initialTab={initialTab}
      />
    </>
  );
}
