import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeCourse, getCourseSubjects } from '../../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug } = await params;
  const data = await getCollegeCourse(collegeSlug, courseSlug);

  if (!data) {
    return {
      title: 'Course Not Found | Notes Arena',
      description: 'The requested course could not be found.',
    };
  }

  const title = `${data.college.name} ${data.course.name} Notes & PYQs | Notes Arena`;
  const description = `Download study materials, lecture notes, syllabus, and previous year papers for ${data.course.name} at ${data.college.name}.`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/colleges/${data.college.slug}/${data.course.slug}`,
    },
  };
}

export default async function CourseOverviewPage({ params }) {
  const { collegeSlug, courseSlug } = await params;
  const data = await getCollegeCourse(collegeSlug, courseSlug);

  if (!data) {
    notFound();
  }

  const { course, college } = data;
  const totalSemesters = (course.duration_years || 3) * 2;

  return (
    <>
      <style>{`
        .course-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        .course-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .semesters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
          margin-top: 16px;
        }
        .sem-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px 16px;
          text-align: center;
          transition: all 0.2s;
          text-decoration: none;
          display: block;
        }
        .sem-card:hover {
          border-color: var(--green);
          background: var(--s2);
          transform: translateY(-2px);
          box-shadow: var(--shadow-card);
        }
        .sem-card-num {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--green);
          margin-bottom: 4px;
        }
        .sem-card-lbl {
          font-size: 12px;
          color: var(--sub);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>

      <header className="course-header">
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, flexWrap: 'wrap' }}>
          <Link href="/notes">Notes</Link>
          <span>/</span>
          <Link href="/notes/colleges">Colleges</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}`}>{college.name}</Link>
        </div>
        <h1 className="course-title">{course.name}</h1>
        <p style={{ color: 'var(--sub)' }}>
          Select a semester to browse subjects, download notes, PYQs, and lab manuals for {course.name} at {college.name}.
        </p>
        {course.description && (
          <p style={{ color: 'var(--sub)', fontSize: 13, marginTop: 6 }}>{course.description}</p>
        )}
      </header>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          {totalSemesters} Semesters &middot; {course.duration_years || 3}-Year Programme
        </h2>
        <div className="semesters-grid">
          {Array.from({ length: totalSemesters }, (_, i) => i + 1).map(sem => (
            <Link key={sem} href={`/notes/colleges/${college.slug}/${course.slug}/sem-${sem}`} className="sem-card">
              <div className="sem-card-num">{sem}</div>
              <div className="sem-card-lbl">Semester {sem}</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
