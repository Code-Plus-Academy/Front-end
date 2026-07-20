import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '../../../../../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug, semester } = await params;
  const semNum = parseInt(semester, 10);
  const data = await getSemesterData(collegeSlug, courseSlug, semNum);

  if (!data || !data.course) {
    return {
      title: 'Semester Not Found | Notes Arena',
    };
  }

  const title = `${data.college.university || data.college.name} ${data.course.slug.toUpperCase()} Semester ${semNum} Subjects | Notes Arena`;
  const description = `Browse subjects and study materials for Semester ${semNum} of ${data.course.name} at ${data.college.name}.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/colleges/${data.college.slug}/${data.course.slug}/sem-${semNum}`,
    },
  };
}

// Mock fallbacks
const MOCK_SEMESTER_DATA = {
  'sppu': {
    'bsc-cs': {
      college: { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu', university: 'SPPU' },
      course: { id: 'c1', name: 'Bachelor of Science (Computer Science)', slug: 'bsc-cs' },
      subjects: {
        1: [
          { id: 's1', name: 'Programming in C', slug: 'programming-c', semester: 1 },
          { id: 's2', name: 'Mathematical Foundations of Computer Science', slug: 'math-foundations', semester: 1 },
        ],
        2: [
          { id: 's3', name: 'Database Management Systems', slug: 'dbms', semester: 2 },
          { id: 's4', name: 'Data Structures and Algorithms', slug: 'dsa', semester: 2 },
          { id: 's5', name: 'Computer Networks', slug: 'computer-networks', semester: 2 },
        ]
      }
    }
  }
};

async function getSemesterData(collegeSlug, courseSlug, semester) {
  try {
    const res = await fetchApi(`/notes/colleges/${collegeSlug}/courses/${courseSlug}/semesters/${semester}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading semester ${semester}:`, err);
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

        // Fetch notes for this college + semester
        let subjects = [];
        try {
          const notesRes = await fetchApi(`/notes/search?collegeId=${college.id}&semester=${semester}`);
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            subjects = notesData.subjects || [];
          }
        } catch (e) {}

        return {
          college,
          course: foundCourse,
          subjects: subjects,
        };
      }
    }
  } catch (err) {
    console.error(`Error loading college fallback for semester ${semester}:`, err);
  }

  const base = MOCK_SEMESTER_DATA[collegeSlug]?.[courseSlug];
  if (base) {
    return {
      college: base.college,
      course: base.course,
      subjects: base.subjects[semester] || [],
    };
  }
  return null;
}

export default async function SemesterSubjectsPage({ params }) {
  const { collegeSlug, courseSlug, semester } = await params;
  const semNum = parseInt(semester, 10);

  if (isNaN(semNum) || semNum <= 0) {
    notFound();
  }

  const data = await getSemesterData(collegeSlug, courseSlug, semNum);

  if (!data || !data.course) {
    notFound();
  }

  const { college, course, subjects = [] } = data;

  return (
    <>
      <style>{`
        .sem-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        .sem-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .subjects-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        .subjects-table th, .subjects-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .subjects-table th {
          font-weight: 700;
          color: var(--sub);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .subjects-table tr:hover td {
          background: var(--s2);
        }
        .subject-link {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          transition: color 0.2s;
        }
        .subject-link:hover {
          color: var(--green);
        }
      `}</style>

      <header className="sem-header">
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          <Link href="/notes">Notes</Link>
          <span>/</span>
          <Link href="/notes/colleges">Colleges</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}`}>{college.university || college.name}</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}/${course.slug}`}>{course.slug.toUpperCase()}</Link>
        </div>
        <h1 className="sem-title">Semester {semNum} Subjects</h1>
        <p style={{ color: 'var(--sub)' }}>
          {course.name} curriculum subjects. Select a subject to view lecture notes, question papers, and study material.
        </p>
      </header>

      <section>
        {subjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--sub)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 32, marginBottom: 8 }}>book</span>
            <p>No subjects have been indexed for Semester {semNum} yet.</p>
            <Link href="/notes/upload" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              Upload Notes
            </Link>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <table className="subjects-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <Link href={`/notes/colleges/${college.slug}/${course.slug}/sem-${semNum}/${sub.slug}`} className="subject-link">
                        {sub.name}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/notes/colleges/${college.slug}/${course.slug}/sem-${semNum}/${sub.slug}`} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>View Notes</span>
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
