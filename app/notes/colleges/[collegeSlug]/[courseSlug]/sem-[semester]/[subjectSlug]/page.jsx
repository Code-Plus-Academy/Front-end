import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NoteCard from '../../../../../../../src/components/notes/NoteCard';
import { fetchApi } from '../../../../../../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug, semester, subjectSlug } = await params;
  const semNum = parseInt(semester, 10);
  const data = await getSubjectData(collegeSlug, courseSlug, semNum, subjectSlug);

  if (!data || !data.subject) {
    return {
      title: 'Subject Not Found | Notes Arena',
    };
  }

  const title = `${data.college.university || data.college.name} ${data.course.slug.toUpperCase()} Sem ${semNum} ${data.subject.name} Notes & PYQs | Notes Arena`;
  const description = `Download syllabus notes, previous year question papers, lab manuals, and assignments for ${data.subject.name} in Semester ${semNum} of ${data.course.name} at ${data.college.name}.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/colleges/${data.college.slug}/${data.course.slug}/sem-${semNum}/${data.subject.slug}`,
    },
  };
}

// Mock fallbacks
const MOCK_SUBJECT_DATA = {
  'sppu': {
    'bsc-cs': {
      'dbms': {
        college: { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu', university: 'SPPU' },
        course: { id: 'c1', name: 'Bachelor of Science (Computer Science)', slug: 'bsc-cs' },
        subject: { id: 's3', name: 'Database Management Systems', slug: 'dbms', semester: 2 },
        notes: [
          {
            id: 'n1',
            title: 'Database Management Systems Semester 4 Question Paper 2025',
            slug: 'sppu-comp-sem-4-dbms-pyq-2025',
            type: 'question_paper',
            subject_name: 'Database Management Systems',
            college_name: 'Savitribai Phule Pune University',
            semester: 2,
            uploader_name: 'Atharva Kapse',
            uploader_username: 'atharva',
            upvote_count: 34,
            downloads: 120,
            created_at: new Date().toISOString(),
          },
          {
            id: 'n5',
            title: 'DBMS Complete SQL Queries & Relational Algebra Cheat Sheet',
            slug: 'dbms-sql-cheat-sheet',
            type: 'cheatsheet',
            subject_name: 'Database Management Systems',
            college_name: 'Savitribai Phule Pune University',
            semester: 2,
            uploader_name: 'Atharva Kapse',
            uploader_username: 'atharva',
            upvote_count: 55,
            downloads: 218,
            created_at: new Date().toISOString(),
          }
        ]
      }
    }
  }
};

async function getSubjectData(collegeSlug, courseSlug, semester, subjectSlug) {
  try {
    const res = await fetchApi(`/notes/colleges/${collegeSlug}/courses/${courseSlug}/semesters/${semester}/subjects/${subjectSlug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading subject ${subjectSlug}:`, err);
  }

  // Resilient Fallback: Try fetching the parent college data
  try {
    const collegeRes = await fetchApi(`/notes/colleges/${collegeSlug}`);
    if (collegeRes.ok) {
      const college = await collegeRes.json();
      if (college) {
        const foundCourse = (college.courses || []).find(
          c => c.slug === courseSlug || c.id === courseSlug
        ) || {
          id: courseSlug,
          name: courseSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          slug: courseSlug,
        };

        const formattedSubjectName = subjectSlug
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        // Fetch notes for this subject
        let notes = [];
        try {
          const notesRes = await fetchApi(`/notes/search?q=${encodeURIComponent(formattedSubjectName)}`);
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            notes = notesData.notes || [];
          }
        } catch (e) {}

        return {
          college,
          course: foundCourse,
          subject: {
            id: subjectSlug,
            name: formattedSubjectName,
            slug: subjectSlug,
            semester: parseInt(semester, 10),
          },
          notes,
        };
      }
    }
  } catch (err) {
    console.error(`Error loading college fallback for subject ${subjectSlug}:`, err);
  }

  const base = MOCK_SUBJECT_DATA[collegeSlug]?.[courseSlug]?.[subjectSlug];
  if (base) {
    return base;
  }
  return null;
}

export default async function SubjectNotesPage({ params }) {
  const { collegeSlug, courseSlug, semester, subjectSlug } = await params;
  const semNum = parseInt(semester, 10);

  if (isNaN(semNum) || semNum <= 0) {
    notFound();
  }

  const data = await getSubjectData(collegeSlug, courseSlug, semNum, subjectSlug);

  if (!data || !data.subject) {
    notFound();
  }

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
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
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
