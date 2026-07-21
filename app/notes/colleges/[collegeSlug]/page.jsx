import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeBySlug } from '../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collegeSlug } = await params;
  const college = await getCollegeBySlug(collegeSlug);

  if (!college) {
    return {
      title: 'College Not Found | Notes Arena',
      description: 'The requested college could not be found on Notes Arena.',
    };
  }

  const title = `${college.name} Notes, PYQs & Study Material | Notes Arena`;
  const description = `Download ${college.name} previous year question papers, lecture notes, assignments, laboratory manuals, and syllabus files on Notes Arena.`;
  const canonicalUrl = `https://www.codeplusacademy.in/notes/colleges/${college.slug}`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      images: [college.logo_url ?? '/og-default-notes.png'],
      type: 'website',
      url: canonicalUrl,
    },
  };
}

export default async function CollegeProfilePage({ params }) {
  const { collegeSlug } = await params;

  const college = await getCollegeBySlug(collegeSlug);

  if (!college) {
    notFound();
  }

  const stats = college.stats || { courses: 0, notes: 0, contributors: 0, upvotes: 0 };
  const courses = college.courses || [];
  const logoUrl = college.logo_url || null;

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: college.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: college.location || 'India',
    },
    url: `https://www.codeplusacademy.in/notes/colleges/${college.slug}`,
  };

  return (
    <>
      {/* Dynamic JSON-LD structured data in header */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }}
      />

      <style>{`
        .college-hero {
          background: var(--surface);
          border: 1px solid var(--border-bright);
          border-radius: var(--r-lg);
          padding: 32px;
          margin-bottom: 32px;
          display: flex;
          gap: 24px;
          align-items: center;
          box-shadow: var(--shadow-card);
        }
        .college-avatar {
          width: 96px;
          height: 96px;
          border-radius: var(--r-md);
          object-fit: cover;
          border: 2px solid var(--green);
        }
        .college-title-block {
          flex: 1;
        }
        .college-h1 {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .college-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          color: var(--sub);
          font-size: 13px;
        }
        .college-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }
        .stats-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 14px;
          text-align: center;
        }
        .stats-item-val {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--green);
        }
        .stats-item-lbl {
          font-size: 10px;
          color: var(--sub);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .courses-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .course-list-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 16px 20px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }
        .course-list-item:hover {
          border-color: var(--green);
          background: var(--s2);
          transform: translateX(4px);
        }
        .course-item-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }
        .course-item-meta {
          font-size: 12px;
          color: var(--sub);
          margin-top: 2px;
        }

        @media (max-width: 768px) {
          .college-hero {
            flex-direction: column;
            text-align: center;
            padding: 24px;
          }
          .college-avatar {
            width: 80px;
            height: 80px;
          }
          .college-h1 {
            justify-content: center;
            font-size: 22px;
          }
          .college-meta {
            justify-content: center;
            flex-wrap: wrap;
          }
          .stats-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      {/* College Profile Hero */}
      <header className="college-hero">
        <img src={logoUrl} alt={college.name} className="college-avatar" />
        <div className="college-title-block">
          <h1 className="college-h1">
            <span>{college.name}</span>
            {college.verified && (
              <span className="material-symbols-rounded" style={{ color: 'var(--green)', fontSize: 22 }}>
                verified
              </span>
            )}
          </h1>
          <div className="college-meta">
            <span className="college-meta-item">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>location_on</span>
              <span>{college.location || 'India'}</span>
            </span>
            <span className="college-meta-item">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>school</span>
              <span>{college.university || 'Affiliated'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="stats-strip">
        <div className="stats-item">
          <div className="stats-item-val">{stats.courses}</div>
          <div className="stats-item-lbl">Courses Offered</div>
        </div>
        <div className="stats-item">
          <div className="stats-item-val">{stats.notes}</div>
          <div className="stats-item-lbl">Notes Uploaded</div>
        </div>
        <div className="stats-item">
          <div className="stats-item-val">{stats.contributors}</div>
          <div className="stats-item-lbl">Contributors</div>
        </div>
        <div className="stats-item">
          <div className="stats-item-val">{stats.upvotes}</div>
          <div className="stats-item-lbl">Total Upvotes</div>
        </div>
      </section>

      {/* Course Curriculum list */}
      <section>
        <h2 className="courses-title">Available Courses</h2>
        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--sub)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 32, marginBottom: 8 }}>auto_stories</span>
            <p>No courses have been indexed yet. Be the first to upload for this college!</p>
            <Link href="/notes/upload" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              Upload Notes
            </Link>
          </div>
        ) : (
          <div>
            {courses.map((course) => (
              <Link key={course.id} href={`/notes/colleges/${college.slug}/${course.slug}`} style={{ textDecoration: 'none' }}>
                <div className="course-list-item">
                  <div>
                    <h3 className="course-item-name">{course.name}</h3>
                    <div className="course-item-meta">
                      Duration: {course.duration_years || 3} Years • {course.duration_years * 2 || 6} Semesters
                    </div>
                  </div>
                  <span className="material-symbols-rounded" style={{ color: 'var(--sub)' }}>chevron_right</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
