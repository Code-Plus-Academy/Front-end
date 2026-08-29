import React from 'react';
import { queryTable, enrichNotesWithSocialUploaders } from '../../../../../src/lib/supabaseContent';
import UniversityPYQClient from './UniversityPYQClient';

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

/** Converts a university name to a URL-safe slug */
function slugify(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Best-effort human-readable name from slug */
function displayFromSlug(slug = '') {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function getUniversityPYQs(uniSlug) {
  try {
    const uniList = await queryTable(
      'universities',
      'id,name,slug',
      { slug: `eq.${uniSlug}` }
    );

    let uniId = null;
    let uniName = displayFromSlug(uniSlug);

    if (uniList && uniList.length > 0) {
      uniId = uniList[0].id;
      uniName = uniList[0].name;
    }

    // Parallel fetch colleges, courses, departments, and direct university notes
    const [matchedColleges, rawCourses, rawDepartments, directNotes] = await Promise.all([
      uniId
        ? queryTable('colleges', 'id,name,slug,university', { university_id: `eq.${uniId}`, order: 'name.asc', limit: '200' }).catch(() => [])
        : queryTable('colleges', 'id,name,slug,university', { order: 'name.asc', limit: '200' }).catch(() => []),
      queryTable('college_courses', 'id,name,slug,department_id,college_id,university_id', { limit: '500' }).catch(() => []),
      queryTable('departments', 'id,name,slug', { limit: '100' }).catch(() => []),
      uniId
        ? queryTable(
            'notes',
            'id,title,slug,description,type,semester,subject_id,course_id,department_id,college_id,file_url,file_type,upvote_count,download_count,created_at,custom_course_name,custom_subject_name,uploader_id,status,moderation_status',
            {
              type: 'eq.question_paper',
              university_id: `eq.${uniId}`,
              status: 'eq.published',
              order: 'semester.asc,created_at.desc',
              limit: '200',
            }
          ).catch(() => [])
        : Promise.resolve([]),
    ]);

    const colleges = (matchedColleges || []).filter(c => !uniId || (c.university_id === uniId || slugify(c.university || '') === uniSlug));
    if (!uniName && colleges.length > 0) {
      uniName = (colleges[0].university || displayFromSlug(uniSlug)).trim();
    }

    // Fast lookup maps
    const collegeMap = {};
    for (const c of colleges) {
      collegeMap[c.id] = c;
    }

    const courseMap = {};
    for (const crs of rawCourses || []) {
      courseMap[crs.id] = crs;
    }

    const deptMap = {};
    for (const dept of rawDepartments || []) {
      deptMap[dept.id] = dept;
    }

    let allNotes = [...(directNotes || [])];

    // If direct university notes are few or empty, check affiliated colleges
    if (allNotes.length === 0 && colleges.length > 0) {
      const collegeNotesList = await Promise.all(
        colleges.slice(0, 10).map(async (college) => {
          try {
            return await queryTable(
              'notes',
              'id,title,slug,description,type,semester,subject_id,course_id,department_id,college_id,file_url,file_type,upvote_count,download_count,created_at,custom_course_name,custom_subject_name,uploader_id,status,moderation_status',
              {
                type: 'eq.question_paper',
                college_id: `eq.${college.id}`,
                status: 'eq.published',
                order: 'semester.asc,created_at.desc',
                limit: '50',
              }
            );
          } catch {
            return [];
          }
        })
      );
      allNotes = collegeNotesList.flat();
    }

    // Deduplicate notes by ID
    const seenIds = new Set();
    const uniqueNotes = [];
    for (const n of allNotes) {
      if (n && n.id && !seenIds.has(n.id)) {
        seenIds.add(n.id);
        uniqueNotes.push(n);
      }
    }

    // Map relationships and friendly course/department names
    const enrichedTaxonomyNotes = uniqueNotes.map((n) => {
      const crs = courseMap[n.course_id];
      const dept = deptMap[n.department_id] || (crs?.department_id ? deptMap[crs.department_id] : null);
      const col = collegeMap[n.college_id];

      return {
        ...n,
        course_name: crs?.name || n.custom_course_name || null,
        course_slug: crs?.slug || null,
        department_name: dept?.name || null,
        department_slug: dept?.slug || null,
        college_name: col?.name || null,
        college_slug: col?.slug || null,
        _collegeName: col?.name || '',
        _collegeSlug: col?.slug || '',
      };
    });

    // Enrich with social contributor profiles (avatars, names, verified badges)
    const fullyEnrichedNotes = await enrichNotesWithSocialUploaders(enrichedTaxonomyNotes).catch(() => enrichedTaxonomyNotes);

    return {
      uniName,
      notes: fullyEnrichedNotes,
      colleges,
      courses: rawCourses || [],
      departments: rawDepartments || [],
    };
  } catch (err) {
    console.error('[university/pyq] fetch failed:', err.message);
    return {
      uniName: displayFromSlug(uniSlug),
      notes: [],
      colleges: [],
      courses: [],
      departments: [],
    };
  }
}

export async function generateMetadata({ params }) {
  const { uniSlug } = await params;
  const { uniName } = await getUniversityPYQs(uniSlug);
  return {
    title: `${uniName} Previous Year Question Papers (PYQ) | Notes Arena`,
    description: `Download course-wise and semester-wise previous year question papers (PYQs) for ${uniName}. Verified model papers and solutions on Notes Arena.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${uniName} PYQs | Notes Arena`,
      description: `Course-wise and semester-wise PYQs for ${uniName} affiliated programs.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function UniversityPYQPage({ params }) {
  const { uniSlug } = await params;
  const { uniName, notes, colleges, courses, departments } = await getUniversityPYQs(uniSlug);

  return (
    <React.Suspense fallback={null}>
      <UniversityPYQClient
        uniName={uniName}
        uniSlug={uniSlug}
        initialNotes={notes}
        colleges={colleges}
        courses={courses}
        departments={departments}
      />
    </React.Suspense>
  );
}
