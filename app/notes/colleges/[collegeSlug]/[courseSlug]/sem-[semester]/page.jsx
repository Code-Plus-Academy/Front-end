import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '../../../../../../src/utils/notesApi';
import { SPPU_BSC_CS_NEP_SUBJECTS } from '../../../../../../src/data/sppuSyllabus';

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

  const title = `${data.college.university || data.college.name} ${data.course.slug ? data.course.slug.toUpperCase() : 'B.Sc. CS'} Semester ${semNum} Subjects | Notes Arena`;
  const description = `Download syllabus notes, previous year question papers, and lab manuals for Semester ${semNum} of ${data.course.name} at ${data.college.name}.`;

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

async function getSemesterData(collegeSlug, courseSlug, rawSemester) {
  const semNum = parseSemesterNumber(rawSemester);

  // 1. Try fetching live DB semester & subjects data
  try {
    const res = await fetchApi(`/notes/colleges/${collegeSlug}/courses/${courseSlug}/semesters/${semNum}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.subjects && data.subjects.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error(`Error loading DB semester ${semNum}:`, err);
  }

  // 2. Fetch parent college & search DB notes/subjects for this college + semester
  try {
    const collegeRes = await fetchApi(`/notes/colleges/${collegeSlug}`);
    if (collegeRes.ok) {
      const college = await collegeRes.json();
      if (college) {
        const foundCourse = (college.courses || []).find(
          c => c.slug === courseSlug || c.id === courseSlug
        ) || {
          id: courseSlug,
          name: courseSlug.includes('bsc') || courseSlug.includes('computer-science')
            ? 'B.Sc. (Computer Science) - NEP Major'
            : courseSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          slug: courseSlug,
        };

        // Query real indexed DB subjects/notes for this college & semester
        let dbSubjects = [];
        try {
          const notesRes = await fetchApi(`/notes/search?collegeId=${college.id}&semester=${semNum}`);
          if (notesRes.ok) {
            const notesData = await notesRes.json();
            if (notesData.subjects && notesData.subjects.length > 0) {
              dbSubjects = notesData.subjects;
            } else if (notesData.notes && notesData.notes.length > 0) {
              // Extract unique subjects from actual uploaded DB notes
              const map = new Map();
              notesData.notes.forEach(note => {
                const subName = note.subject_name || note.subject?.name;
                const subSlug = note.subject_slug || note.subject?.slug || (subName ? subName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null);
                if (subName && subSlug && !map.has(subSlug)) {
                  map.set(subSlug, {
                    id: subSlug,
                    name: subName,
                    slug: subSlug,
                    type: note.type || 'Indexed Subject',
                    credits: 2,
                    semester: semNum,
                  });
                }
              });
              if (map.size > 0) {
                dbSubjects = Array.from(map.values());
              }
            }
          }
        } catch (e) {}

        const finalSubjects = (dbSubjects && dbSubjects.length > 0)
          ? dbSubjects
          : (SPPU_BSC_CS_NEP_SUBJECTS[semNum] || SPPU_BSC_CS_NEP_SUBJECTS[1]);

        return {
          college,
          course: foundCourse,
          subjects: finalSubjects,
        };
      }
    }
  } catch (err) {
    console.error(`Error loading college fallback for semester ${semNum}:`, err);
  }

  // 3. Official SPPU NEP fallback
  const formattedCollegeName = collegeSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formattedCourseName = courseSlug.includes('bsc') || courseSlug.includes('computer-science')
    ? 'Four-Year Degree Program in B.Sc. (Computer Science) - NEP Major'
    : courseSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    college: {
      id: collegeSlug,
      name: formattedCollegeName,
      slug: collegeSlug,
      university: 'Savitribai Phule Pune University (SPPU)',
    },
    course: {
      id: courseSlug,
      name: formattedCourseName,
      slug: courseSlug,
    },
    subjects: SPPU_BSC_CS_NEP_SUBJECTS[semNum] || SPPU_BSC_CS_NEP_SUBJECTS[1],
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
          <Link href={`/notes/colleges/${college.slug}/${course.slug}`}>{course.slug ? course.slug.toUpperCase() : 'B.Sc. CS'}</Link>
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
                  <th>Course Code & Subject Name</th>
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
                        {sub.name}
                      </Link>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--s2)', border: '1px solid var(--border)', color: 'var(--sub)', fontWeight: 600 }}>
                        {sub.type || 'Subject'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                      {sub.credits || 2}
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
