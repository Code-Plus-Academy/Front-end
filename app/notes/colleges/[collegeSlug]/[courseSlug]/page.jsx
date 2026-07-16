import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '../../../../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug } = await params;
  const data = await getCourseData(collegeSlug, courseSlug);

  if (!data || !data.course) {
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
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/colleges/${data.college.slug}/${data.course.slug}`,
    },
  };
}

// Mock fallbacks
const MOCK_COURSES_DATA = {
  'sppu': {
    'bsc-cs': {
      course: { id: 'c1', name: 'Bachelor of Science (Computer Science)', slug: 'bsc-cs', duration_years: 3 },
      college: { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu' }
    },
    'be-comp': {
      course: { id: 'c2', name: 'Bachelor of Engineering (Computer Engineering)', slug: 'be-comp', duration_years: 4 },
      college: { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu' }
    }
  }
};

async function getCourseData(collegeSlug, courseSlug) {
  try {
    const res = await fetchApi(`/notes/colleges/${collegeSlug}/courses/${courseSlug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading course ${courseSlug}:`, err);
  }
  return MOCK_COURSES_DATA[collegeSlug]?.[courseSlug] || null;
}

export default async function CourseOverviewPage({ params }) {
  const { collegeSlug, courseSlug } = await params;
  const data = await getCourseData(collegeSlug, courseSlug);

  if (!data || !data.course) {
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
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }
        .semester-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 150px;
          transition: all 0.25s ease;
        }
        .semester-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 180, 216, 0.08);
        }
        .semester-num {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          color: var(--green);
          line-height: 1;
        }
      `}</style>

      <header className="course-header">
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          <Link href="/notes">Notes</Link>
          <span>/</span>
          <Link href="/notes/colleges">Colleges</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}`}>{college.name}</Link>
        </div>
        <h1 className="course-title">{course.name}</h1>
        <p style={{ color: 'var(--sub)' }}>
          Select a semester to browse curriculum subjects and download lecture notes, projects, cheat sheets, or previous year papers.
        </p>
      </header>

      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Select Semester</h2>
        <div className="semesters-grid">
          {[...Array(totalSemesters)].map((_, i) => {
            const sem = i + 1;
            return (
              <Link key={sem} href={`/notes/colleges/${college.slug}/${course.slug}/sem-${sem}`} style={{ textDecoration: 'none' }}>
                <div className="semester-card">
                  <div>
                    <div className="semester-num">0{sem}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 12, color: 'var(--text)' }}>
                      Semester {sem}
                    </h3>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Browse Subjects</span>
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--green)' }}>arrow_right_alt</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
