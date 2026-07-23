import React from 'react';
import { queryTable } from '../../../../src/lib/supabaseContent';
import UniversityHubClient from './UniversityHubClient';

export const dynamic = 'force-dynamic';

function slugify(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function displayFromSlug(slug = '') {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function getUniversityData(uniSlug) {
  try {
    let university = null;
    const uniList = await queryTable('universities', '*', { slug: `eq.${uniSlug}` });
    
    if (uniList && uniList.length > 0) {
      university = uniList[0];
    } else {
      university = {
        name: displayFromSlug(uniSlug),
        slug: uniSlug,
        short_name: uniSlug.toUpperCase(),
      };
    }

    const uniId = university.id;

    const [colleges, courses, notes] = await Promise.all([
      uniId
        ? queryTable('colleges', 'id,name,slug,location,verified', { university_id: `eq.${uniId}`, order: 'name.asc', limit: '200' })
        : queryTable('colleges', 'id,name,slug,location,verified', { order: 'name.asc', limit: '200' }).then((cols) => (cols || []).filter((c) => slugify(c.university || '') === uniSlug)),
      uniId
        ? queryTable('college_courses', 'id,name,slug,duration_years,description', { university_id: `eq.${uniId}`, order: 'name.asc', limit: '100' }).catch(() => [])
        : Promise.resolve([]),
      uniId
        ? queryTable('notes', 'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at', { university_id: `eq.${uniId}`, status: 'eq.published', order: 'created_at.desc', limit: '200' }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const collegeMap = {};
    for (const c of colleges || []) {
      collegeMap[c.id] = c;
    }
    const enrichedNotes = (notes || []).map((n) => ({
      ...n,
      _collegeName: collegeMap[n.college_id]?.name || '',
      _collegeSlug: collegeMap[n.college_id]?.slug || '',
    }));

    return {
      university,
      colleges: colleges || [],
      courses: courses || [],
      notes: enrichedNotes || [],
    };
  } catch (err) {
    console.error('[university/[uniSlug]] fetch failed:', err.message);
    return {
      university: { name: displayFromSlug(uniSlug), slug: uniSlug },
      colleges: [],
      courses: [],
      notes: [],
    };
  }
}

export async function generateMetadata({ params }) {
  const { uniSlug } = await params;
  const { university } = await getUniversityData(uniSlug);
  return {
    title: `${university.name} — Colleges, Notes, PYQs & Courses | Notes Arena`,
    description: `Official University Portal for ${university.name}. Find affiliated colleges, question papers (PYQs), class notes, reference books, and official syllabus.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${university.name} Portal | Notes Arena`,
      description: `Browse colleges, PYQs, and study resources for ${university.name}.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-arena-og.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function UniversityDetailPage({ params, searchParams }) {
  const { uniSlug } = await params;
  const sParams = await searchParams;
  const initialTab = sParams?.tab || (sParams?.type === 'pyq' ? 'notes' : 'colleges');

  const { university, colleges, courses, notes } = await getUniversityData(uniSlug);

  return (
    <UniversityHubClient
      university={university}
      colleges={colleges}
      courses={courses}
      notes={notes}
      initialTab={initialTab}
    />
  );
}
