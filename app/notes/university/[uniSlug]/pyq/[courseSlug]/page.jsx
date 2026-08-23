import React from 'react';
import { notFound } from 'next/navigation';
import { queryTable, enrichNotesWithSocialUploaders } from '../../../../../../src/lib/supabaseContent';
import CoursePYQClient from './CoursePYQClient';

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

async function getCoursePYQData(uniSlug, courseSlug) {
  try {
    const uniList = await queryTable('universities', 'id,name,slug', { slug: `eq.${uniSlug}` });
    let uniId = null;
    let uniName = displayFromSlug(uniSlug);

    if (uniList && uniList.length > 0) {
      uniId = uniList[0].id;
      uniName = uniList[0].name;
    }

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
              limit: '300',
            }
          ).catch(() => [])
        : Promise.resolve([]),
    ]);

    const colleges = (matchedColleges || []).filter(c => !uniId || (c.university_id === uniId || slugify(c.university || '') === uniSlug));
    if (!uniName && colleges.length > 0) {
      uniName = (colleges[0].university || displayFromSlug(uniSlug)).trim();
    }

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

    // If direct notes are empty, fetch from affiliated colleges
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

    // Resolve course object
    let targetCourse = (rawCourses || []).find((c) => c.slug === courseSlug || slugify(c.name || '') === courseSlug || c.id === courseSlug) || null;

    // Filter notes specifically for this course
    const courseNotes = uniqueNotes.filter((n) => {
      const noteCourseSlug = n.course_slug || (courseMap[n.course_id]?.slug) || slugify(n.custom_course_name || courseMap[n.course_id]?.name || '');
      const noteCourseId = n.course_id;

      if (targetCourse && (noteCourseId === targetCourse.id || noteCourseSlug === targetCourse.slug)) {
        return true;
      }
      if (noteCourseSlug === courseSlug || slugify(n.custom_course_name || '') === courseSlug) {
        if (!targetCourse) {
          targetCourse = {
            id: n.course_id || 'custom',
            name: n.custom_course_name || courseMap[n.course_id]?.name || displayFromSlug(courseSlug),
            slug: courseSlug,
            department_id: n.department_id || null,
          };
        }
        return true;
      }
      return false;
    });

    if (!targetCourse && courseNotes.length > 0) {
      const sample = courseNotes[0];
      targetCourse = {
        id: sample.course_id || 'custom',
        name: sample.custom_course_name || courseMap[sample.course_id]?.name || displayFromSlug(courseSlug),
        slug: courseSlug,
        department_id: sample.department_id || null,
      };
    }

    if (!targetCourse) {
      targetCourse = {
        id: courseSlug,
        name: displayFromSlug(courseSlug),
        slug: courseSlug,
        department_id: null,
      };
    }

    const dept = deptMap[targetCourse.department_id];
    targetCourse.department_name = dept?.name || null;

    // Map relationships to course notes
    const mappedNotes = courseNotes.map((n) => {
      const col = collegeMap[n.college_id];
      return {
        ...n,
        course_name: targetCourse.name,
        course_slug: targetCourse.slug,
        department_name: targetCourse.department_name,
        college_name: col?.name || null,
        college_slug: col?.slug || null,
        _collegeName: col?.name || '',
        _collegeSlug: col?.slug || '',
      };
    });

    const enrichedNotes = await enrichNotesWithSocialUploaders(mappedNotes).catch(() => mappedNotes);

    return {
      uniName,
      uniSlug,
      course: targetCourse,
      notes: enrichedNotes,
    };
  } catch (err) {
    console.error('[course/pyq] fetch failed:', err.message);
    return {
      uniName: displayFromSlug(uniSlug),
      uniSlug,
      course: { name: displayFromSlug(courseSlug), slug: courseSlug },
      notes: [],
    };
  }
}

export async function generateMetadata({ params }) {
  const { uniSlug, courseSlug } = await params;
  const { uniName, course, notes } = await getCoursePYQData(uniSlug, courseSlug);
  const courseTitle = course?.name || displayFromSlug(courseSlug);

  return {
    title: `${courseTitle} Previous Year Question Papers (PYQ) | ${uniName} - Notes Arena`,
    description: `Download semester-wise Previous Year Question Papers (PYQs) for ${courseTitle} affiliated under ${uniName}. ${notes.length} question papers available.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${courseTitle} PYQs | ${uniName} - Notes Arena`,
      description: `Download semester-wise question papers and model solutions for ${courseTitle} at ${uniName}.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function CoursePYQPage({ params }) {
  const { uniSlug, courseSlug } = await params;
  const { uniName, course, notes } = await getCoursePYQData(uniSlug, courseSlug);

  return (
    <CoursePYQClient
      uniName={uniName}
      uniSlug={uniSlug}
      course={course}
      notes={notes}
    />
  );
}
