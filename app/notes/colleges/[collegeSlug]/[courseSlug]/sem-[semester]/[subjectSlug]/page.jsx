import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NoteCard from '../../../../../../../src/components/notes/NoteCard';
import { getCollegeCourse, getCourseSubjects, queryTable } from '../../../../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

const parseSemesterNumber = (val) => {
  if (!val) return null;
  const str = String(val).replace(/[^0-9]/g, '');
  const num = parseInt(str, 10);
  return isNaN(num) || num <= 0 ? null : num;
};

async function getSubjectData(collegeSlug, courseSlug, semNum, subjectSlug) {
  // 1. Resolve college + course from Supabase
  const collegeCourse = await getCollegeCourse(collegeSlug, courseSlug);
  if (!collegeCourse) return null;

  const { college, course } = collegeCourse;

  // 2. Validate semester range
  const maxSem = (course.duration_years || 3) * 2;
  if (semNum > maxSem) return null;

  // 3. Find subject in DB by slug
  let subjects = [];
  try {
    subjects = await getCourseSubjects(course.id, semNum) || [];
  } catch (err) {
    console.error('[subjectSlug] getCourseSubjects failed:', err.message);
  }

  const subject = subjects.find(s => s.slug === subjectSlug);
  if (!subject) return null;

  // 4. Fetch uploaded notes for this subject from Supabase notes table
  let notes = [];
  try {
    const allNotes = await queryTable(
      'notes',
      'id,title,slug,type,description,file_url,file_type,semester,created_at,uploader_id',
      { subject_id: `eq.${subject.id}`, status: 'eq.published', order: 'created_at.desc', limit: '50' }
    );
    notes = allNotes || [];
  } catch (err) {
    console.error('[subjectSlug] notes fetch failed:', err.message);
  }

  return { college, course, subject, notes };
}

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug, semester, subjectSlug } = await params;
  const semNum = parseSemesterNumber(semester);
  if (!semNum) return { title: 'Subject Not Found | Notes Arena' };

  const data = await getSubjectData(collegeSlug, courseSlug, semNum, subjectSlug);
  if (!data) return { title: 'Subject Not Found | Notes Arena' };

  const title = `${data.college.university || data.college.name} ${data.course.slug.toUpperCase()} Sem ${semNum} ${data.subject.name} Notes & PYQs | Notes Arena`;
  const description = `Download syllabus notes, previous year question papers, lab manuals, and assignments for ${data.subject.name} in Semester ${semNum} of ${data.course.name} at ${data.college.name}.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/colleges/${data.college.slug}/${data.course.slug}/sem-${semNum}/${data.subject.slug}`,
    },
  };
}

export default async function SubjectNotesPage({ params }) {
  const { collegeSlug, courseSlug, semester, subjectSlug } = await params;
  const semNum = parseSemesterNumber(semester);

  if (!semNum) notFound();

  const data = await getSubjectData(collegeSlug, courseSlug, semNum, subjectSlug);
  if (!data) notFound();

  const { college, course, subject, notes = [] } = data;

  return (
    <>
      <style>{`
        .sub-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        .sub-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
      `}</style>

      <header className="sub-header">
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, flexWrap: 'wrap' }}>
          <Link href="/notes">Notes</Link>
          <span>/</span>
          <Link href="/notes/colleges">Colleges</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}`}>{college.university || college.name}</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}/${course.slug}`}>{course.slug.toUpperCase()}</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}/${course.slug}/sem-${semNum}`}>Sem {semNum}</Link>
        </div>
        <h1 className="sub-title">{subject.name}</h1>
        <p style={{ color: 'var(--sub)' }}>
          Browse all lecture notes, PYQs, cheat sheets, and other resources uploaded for {subject.name}.
        </p>
      </header>

      <section>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--sub)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 32, marginBottom: 8 }}>library_books</span>
            <p>No study resources have been uploaded for {subject.name} yet.</p>
            <Link href="/notes/upload" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              Upload Note/PYQ
            </Link>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
