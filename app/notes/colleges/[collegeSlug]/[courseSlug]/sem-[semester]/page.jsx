import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '../../../../../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

const parseSemesterNumber = (val) => {
  if (!val) return 1;
  const str = String(val).replace(/[^0-9]/g, '');
  const num = parseInt(str, 10);
  return isNaN(num) || num <= 0 ? 1 : num;
};

export async function generateMetadata({ params }) {
  const { collegeSlug, courseSlug, semester } = await params;
  const semNum = parseSemesterNumber(semester);
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

const DEFAULT_SEMESTER_SUBJECTS = {
  1: [
    { id: 'sub-1-1', name: 'Programming Principles & Algorithms', slug: 'programming-principles-algorithms', semester: 1 },
    { id: 'sub-1-2', name: 'Computer Fundamentals & Operating Systems', slug: 'computer-fundamentals-os', semester: 1 },
    { id: 'sub-1-3', name: 'Discrete Mathematics & Logic', slug: 'discrete-mathematics-logic', semester: 1 },
    { id: 'sub-1-4', name: 'Digital Electronics & Computer Architecture', slug: 'digital-electronics-co', semester: 1 },
    { id: 'sub-1-5', name: 'Problem Solving & C Programming Lab', slug: 'c-programming-lab', semester: 1 },
  ],
  2: [
    { id: 'sub-2-1', name: 'Data Structures & Algorithms', slug: 'dsa', semester: 2 },
    { id: 'sub-2-2', name: 'Database Management Systems', slug: 'dbms', semester: 2 },
    { id: 'sub-2-3', name: 'Object Oriented Programming with C++', slug: 'oop-cpp', semester: 2 },
    { id: 'sub-2-4', name: 'Web Technology & HTML/CSS/JS', slug: 'web-technology', semester: 2 },
    { id: 'sub-2-5', name: 'Data Structures & DBMS Laboratory', slug: 'dsa-dbms-lab', semester: 2 },
  ],
  3: [
    { id: 'sub-3-1', name: 'Java Programming & OOP Concepts', slug: 'java-programming', semester: 3 },
    { id: 'sub-3-2', name: 'Software Engineering & SDLC', slug: 'software-engineering', semester: 3 },
    { id: 'sub-3-3', name: 'Computer Networks & Protocols', slug: 'computer-networks', semester: 3 },
    { id: 'sub-3-4', name: 'Python Programming for Data Science', slug: 'python-programming', semester: 3 },
    { id: 'sub-3-5', name: 'Java & Web Development Laboratory', slug: 'java-web-lab', semester: 3 },
  ],
  4: [
    { id: 'sub-4-1', name: 'Advanced Java & Enterprise Frameworks', slug: 'advanced-java', semester: 4 },
    { id: 'sub-4-2', name: 'Operating Systems & System Programming', slug: 'operating-systems', semester: 4 },
    { id: 'sub-4-3', name: 'Theory of Computation & Automata', slug: 'theory-of-computation', semester: 4 },
    { id: 'sub-4-4', name: 'PHP & MySQL Backend Web Development', slug: 'php-mysql-web', semester: 4 },
    { id: 'sub-4-5', name: 'Operating Systems & Enterprise Lab', slug: 'os-web-lab', semester: 4 },
  ],
  5: [
    { id: 'sub-5-1', name: 'Artificial Intelligence & Machine Learning', slug: 'ai-ml', semester: 5 },
    { id: 'sub-5-2', name: 'Information & Cyber Security', slug: 'cyber-security', semester: 5 },
    { id: 'sub-5-3', name: 'Cloud Computing & DevOps Architecture', slug: 'cloud-computing-devops', semester: 5 },
    { id: 'sub-5-4', name: 'Software Project Management', slug: 'software-project-management', semester: 5 },
    { id: 'sub-5-5', name: 'AI/ML & Cloud Computing Laboratory', slug: 'ai-ml-cloud-lab', semester: 5 },
  ],
  6: [
    { id: 'sub-6-1', name: 'Full Stack Web Development (Node.js & React)', slug: 'fullstack-react-node', semester: 6 },
    { id: 'sub-6-2', name: 'Mobile Application Development (Android/Flutter)', slug: 'mobile-app-dev', semester: 6 },
    { id: 'sub-6-3', name: 'Big Data Analytics & Data Warehousing', slug: 'big-data-analytics', semester: 6 },
    { id: 'sub-6-4', name: 'Major Industry Capstone Project', slug: 'major-capstone-project', semester: 6 },
  ]
};

// Mock fallbacks
const MOCK_SEMESTER_DATA = {
  'sppu': {
    'bsc-cs': {
      college: { id: '1', name: 'Savitribai Phule Pune University', slug: 'sppu', university: 'SPPU' },
      course: { id: 'c1', name: 'Bachelor of Science (Computer Science)', slug: 'bsc-cs' },
      subjects: DEFAULT_SEMESTER_SUBJECTS
    }
  }
};

async function getSemesterData(collegeSlug, courseSlug, rawSemester) {
  const semNum = parseSemesterNumber(rawSemester);

  try {
    const res = await fetchApi(`/notes/colleges/${collegeSlug}/courses/${courseSlug}/semesters/${semNum}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading semester ${semNum}:`, err);
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

        // Fetch notes for this college + semester if available
        let subjects = [];
        try {
          const notesRes = await fetchApi(`/notes/search?collegeId=${college.id}&semester=${semNum}`);
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            subjects = notesData.subjects || [];
          }
        } catch (e) {}

        if (!subjects || subjects.length === 0) {
          subjects = DEFAULT_SEMESTER_SUBJECTS[semNum] || DEFAULT_SEMESTER_SUBJECTS[1];
        }

        return {
          college,
          course: foundCourse,
          subjects,
        };
      }
    }
  } catch (err) {
    console.error(`Error loading college fallback for semester ${semNum}:`, err);
  }

  const base = MOCK_SEMESTER_DATA[collegeSlug]?.[courseSlug];
  if (base) {
    return {
      college: base.college,
      course: base.course,
      subjects: base.subjects[semNum] || DEFAULT_SEMESTER_SUBJECTS[semNum] || DEFAULT_SEMESTER_SUBJECTS[1],
    };
  }

  // Ultimate fallback: generate dynamic college & course view so no valid URL 404s
  const formattedCollegeName = collegeSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedCourseName = courseSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    college: {
      id: collegeSlug,
      name: formattedCollegeName,
      slug: collegeSlug,
    },
    course: {
      id: courseSlug,
      name: formattedCourseName,
      slug: courseSlug,
    },
    subjects: DEFAULT_SEMESTER_SUBJECTS[semNum] || DEFAULT_SEMESTER_SUBJECTS[1],
  };
}

export default async function SemesterSubjectsPage({ params }) {
  const { collegeSlug, courseSlug, semester } = await params;
  const semNum = parseSemesterNumber(semester);

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
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, flexWrap: 'wrap' }}>
          <Link href="/notes">Notes</Link>
          <span>/</span>
          <Link href="/notes/colleges">Colleges</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}`}>{college.university || college.name}</Link>
          <span>/</span>
          <Link href={`/notes/colleges/${college.slug}/${course.slug}`}>{course.slug ? course.slug.toUpperCase() : 'COURSE'}</Link>
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
                  <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
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
