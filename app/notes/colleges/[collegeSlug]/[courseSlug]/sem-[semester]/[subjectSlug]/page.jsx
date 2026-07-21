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
  const college = collegeCourse?.college || {
    id: '174b07af-e6c8-45a1-874b-df7a7cdfeb91',
    name: "MVP's Karmaveer Ganpat Data More Art's Commerce And Science College Niphad 422303",
    slug: collegeSlug,
    university: 'Savitribai Phule Pune University',
  };
  const course = collegeCourse?.course || {
    id: 'c703b532-e9c4-4728-8711-0ad6f84f63a8',
    name: 'Bachelor Of Computer Science (NEP)',
    slug: courseSlug,
  };

  // 2. Find subject in DB by slug
  let subjects = [];
  try {
    subjects = await getCourseSubjects(course.id, semNum) || [];
  } catch (err) {
    console.error('[subjectSlug] getCourseSubjects failed:', err.message);
  }

  const decodedSubjectSlug = decodeURIComponent(subjectSlug).trim().toLowerCase();
  let subject = subjects.find(
    s => s.slug?.toLowerCase() === decodedSubjectSlug ||
         s.subject_code?.toLowerCase() === decodedSubjectSlug ||
         decodedSubjectSlug.includes(s.slug?.toLowerCase() || '') ||
         (s.slug && decodedSubjectSlug.includes(s.slug.toLowerCase()))
  );

  if (!subject) {
    const formattedName = decodedSubjectSlug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    subject = {
      id: subjectSlug,
      name: formattedName,
      slug: subjectSlug,
      semester: semNum,
      subject_type: 'Theory'
    };
  }

  // 3. Fetch uploaded notes for this subject with multi-tier matching
  let notes = [];
  try {
    let allNotes = [];

    // Query 1: By subject_id if valid UUID
    if (subject.id && subject.id !== subjectSlug) {
      allNotes = await queryTable(
        'notes',
        '*',
        { subject_id: `eq.${subject.id}`, status: 'eq.published', order: 'created_at.desc', limit: '50' }
      ).catch(() => []);
    }

    // Query 2: By subject name keyword for this semester
    if (!allNotes || allNotes.length === 0) {
      const keyword = subject.name ? subject.name.split(' ')[0] : '';
      if (keyword && keyword.length > 2) {
        allNotes = await queryTable(
          'notes',
          '*',
          { semester: `eq.${semNum}`, title: `ilike.%${keyword}%`, status: 'eq.published', order: 'created_at.desc', limit: '50' }
        ).catch(() => []);
      }
    }

    // Query 3: Fallback by college_id + semester
    if (!allNotes || allNotes.length === 0) {
      allNotes = await queryTable(
        'notes',
        '*',
        { college_id: `eq.${college.id}`, semester: `eq.${semNum}`, status: 'eq.published', order: 'created_at.desc', limit: '50' }
      ).catch(() => []);
    }

    // Query 4: General fallback for this semester across all notes
    if (!allNotes || allNotes.length === 0) {
      allNotes = await queryTable(
        'notes',
        '*',
        { semester: `eq.${semNum}`, status: 'eq.published', order: 'created_at.desc', limit: '50' }
      ).catch(() => []);
    }

    notes = allNotes || [];
  } catch (err) {
    console.error('[subjectSlug] notes fetch failed:', err.message);
  }

  return { college, course, subject, notes };
}

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug, semester, subjectSlug } = await params;
  const semNum = parseSemesterNumber(semester) || 1;

  const data = await getSubjectData(collegeSlug, courseSlug, semNum, subjectSlug);
  const collegeName = data?.college?.university || data?.college?.name || 'College';
  const subjectName = data?.subject?.name || 'Subject';

  const title = `${collegeName} Sem ${semNum} ${subjectName} Notes & PYQs | Notes Arena`;
  const description = `Download syllabus notes, previous year question papers, lab manuals, and assignments for ${subjectName} in Semester ${semNum}.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/colleges/${collegeSlug}/${courseSlug}/sem-${semNum}/${subjectSlug}`,
    },
  };
}

export default async function SubjectNotesPage({ params }) {
  const { collegeSlug, courseSlug, semester, subjectSlug } = await params;
  const semNum = parseSemesterNumber(semester) || 1;

  const data = await getSubjectData(collegeSlug, courseSlug, semNum, subjectSlug);
  const college = data?.college || { name: 'College', slug: collegeSlug };
  const course = data?.course || { name: 'Course', slug: courseSlug };
  const subject = data?.subject || { name: 'Subject', slug: subjectSlug };
  const notes = data?.notes || [];

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
