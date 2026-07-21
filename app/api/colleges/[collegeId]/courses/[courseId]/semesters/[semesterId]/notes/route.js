import { NextResponse } from 'next/server';
import { getCollegeCourse, queryTable } from '../../../../../../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

/**
 * GET /api/colleges/:collegeId/courses/:courseId/semesters/:semesterId/notes
 * Validates college, course, and semester parameters, ensuring foreign key context is preserved
 * across all navigation hops and deep links without state loss or 404 errors.
 */
export async function GET(request, { params }) {
  const { collegeId, courseId, semesterId } = await params;

  try {
    const semNum = parseInt(String(semesterId).replace(/[^0-9]/g, ''), 10);
    if (isNaN(semNum) || semNum <= 0) {
      return NextResponse.json({ error: 'Invalid semester parameter' }, { status: 400 });
    }

    // Resolve college + course context using slug or UUID matching
    const collegeCourse = await getCollegeCourse(collegeId, courseId);
    if (!collegeCourse || !collegeCourse.college) {
      return NextResponse.json({ error: 'College or Course context not found' }, { status: 404 });
    }

    const { college, course } = collegeCourse;

    // Query notes with strict foreign key scope matching
    const notes = await queryTable(
      'notes',
      'id,title,slug,type,description,file_url,file_type,semester,college_id,course_id,subject_id,created_at,uploader_id,upvote_count,download_count',
      {
        college_id: `eq.${college.id}`,
        course_id: `eq.${course.id}`,
        semester: `eq.${semNum}`,
        status: 'eq.published',
        order: 'created_at.desc',
        limit: '50'
      }
    ).catch(() => []);

    return NextResponse.json({
      success: true,
      college: { id: college.id, name: college.name, slug: college.slug, university: college.university },
      course: { id: course.id, name: course.name, slug: course.slug },
      semester: semNum,
      notes: notes || []
    });
  } catch (err) {
    console.error('[API /notes] Failed to fetch notes:', err);
    return NextResponse.json({ error: 'Failed to retrieve notes for specified scope' }, { status: 500 });
  }
}
