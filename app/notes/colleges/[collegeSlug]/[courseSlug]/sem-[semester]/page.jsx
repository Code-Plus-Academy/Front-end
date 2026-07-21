import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeCourse, getCourseSubjects } from '../../../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

const parseSemesterNumber = (val) => {
  if (!val) return null;
  const str = String(val).replace(/[^0-9]/g, '');
  const num = parseInt(str, 10);
  return isNaN(num) || num <= 0 ? null : num;
};

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug, semester } = await params;
  const semNum = parseSemesterNumber(semester);
  if (!semNum) return { title: 'Semester Not Found | Notes Arena' };

  const data = await getCollegeCourse(collegeSlug, courseSlug);
  if (!data) return { title: 'Semester Not Found | Notes Arena' };

  const title = `${data.college.university || data.college.name} ${data.course.name} Semester ${semNum} Subjects | Notes Arena`;
  const description = `Download syllabus notes, previous year question papers, and lab manuals for Semester ${semNum} of ${data.course.name} at ${data.college.name}.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/colleges/${data.college.slug}/${data.course.slug}/sem-${semNum}`,
    },
  };
}

export default async function SemesterSubjectsPage({ params }) {
  const { collegeSlug, courseSlug, semester } = await params;
  const semNum = parseSemesterNumber(semester);

  if (!semNum) notFound();

  // Fetch college+course from Supabase
  const data = await getCollegeCourse(collegeSlug, courseSlug);
  if (!data) notFound();

  const { college, course } = data;

  // Fetch subjects for this semester from Supabase
  let subjects = [];
  try {
    subjects = await getCourseSubjects(course.id, semNum) || [];
  } catch (err) {
    console.error(`[sem-${semNum}] Failed to fetch subjects from Supabase:`, err.message);
    // subjects stays [], honest empty state shown below
  }

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
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .subjects-table th {
          font-weight: 700;
          color: var(--sub);
          font-size: 12px;
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
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, flexWrap: 'wrap' }}>
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
          Curriculum subjects for {course.name} at {college.name}. Select any subject below to download study materials, PYQs, and lab manuals.
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
                  <th>Course Code &amp; Subject Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Credits</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <Link href={`/notes/colleges/${college.slug}/${course.slug}/sem-${semNum}/${sub.slug}`} className="subject-link">
                        {sub.subject_code ? <span style={{ fontSize: 11, color: 'var(--sub)', marginRight: 6 }}>{sub.subject_code}</span> : null}
                        {sub.name}
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--sub)', fontWeight: 600 }}>
                        {sub.subject_type || 'Theory'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                      {sub.credits || 4}
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
