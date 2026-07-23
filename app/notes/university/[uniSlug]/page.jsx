import React from 'react';
import { queryTable } from '../../../../src/lib/supabaseContent';
import UniversityHubClient from './UniversityHubClient';

export const dynamic = 'force-dynamic';

function displayFromSlug(slug = '') {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function getUniversityData(uniSlug) {
  try {
    const normSlug = (uniSlug || '').toLowerCase().trim();
    
    // 1. Try exact slug match
    let uniList = await queryTable('universities', '*', { slug: `eq.${normSlug}` }).catch(() => []);
    
    // 2. Try short_name match (e.g. 'sppu', 'du')
    if (!uniList || uniList.length === 0) {
      uniList = await queryTable('universities', '*', { short_name: `ilike.${normSlug}` }).catch(() => []);
    }

    // 3. Try fuzzy name match across all universities
    if (!uniList || uniList.length === 0) {
      const allUnis = await queryTable('universities', '*').catch(() => []);
      if (allUnis && allUnis.length > 0) {
        const tokens = normSlug.split('-').filter((t) => t.length > 2);
        uniList = allUnis.filter((u) => {
          const uName = (u.name + ' ' + (u.short_name || '') + ' ' + u.slug).toLowerCase();
          const matchCount = tokens.filter((t) => uName.includes(t)).length;
          return matchCount >= Math.min(tokens.length, 2);
        });
      }
    }

    let university = uniList && uniList.length > 0 ? uniList[0] : null;

    if (!university) {
      university = {
        name: displayFromSlug(uniSlug),
        slug: uniSlug,
        short_name: uniSlug.toUpperCase(),
      };
    }

    const uniId = university.id;

    // Fetch colleges linked by university_id
    let colleges = [];
    if (uniId) {
      colleges = await queryTable('colleges', 'id,name,slug,location,verified,university,university_id', {
        university_id: `eq.${uniId}`,
        order: 'name.asc',
        limit: '200',
      }).catch(() => []);
    }

    // Fallback: If no colleges found by uniId, query all colleges and match by university text/tokens
    if (!colleges || colleges.length === 0) {
      const allCols = await queryTable('colleges', 'id,name,slug,location,verified,university,university_id', {
        order: 'name.asc',
        limit: '200',
      }).catch(() => []);

      const tokens = normSlug.split('-').filter((t) => t.length > 2);
      colleges = (allCols || []).filter((c) => {
        if (uniId && c.university_id === uniId) return true;
        const cUni = (c.university || '').toLowerCase();
        const matchCount = tokens.filter((t) => cUni.includes(t)).length;
        return matchCount >= Math.min(tokens.length, 2);
      });
    }

    const collegeIds = colleges.map((c) => c.id).filter(Boolean);
    
    // Fetch notes for this university
    let notes = [];
    if (uniId) {
      notes = await queryTable('notes', 'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at', {
        university_id: `eq.${uniId}`,
        status: 'eq.published',
        order: 'created_at.desc',
        limit: '200',
      }).catch(() => []);
    }

    if ((!notes || notes.length === 0) && collegeIds.length > 0) {
      const inQuery = `in.(${collegeIds.join(',')})`;
      notes = await queryTable('notes', 'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at', {
        college_id: inQuery,
        status: 'eq.published',
        order: 'created_at.desc',
        limit: '200',
      }).catch(() => []);
    }

    // Fetch courses
    let courses = [];
    if (uniId) {
      courses = await queryTable('college_courses', 'id,name,slug,duration_years,description', {
        university_id: `eq.${uniId}`,
        order: 'name.asc',
        limit: '100',
      }).catch(() => []);
    }

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
