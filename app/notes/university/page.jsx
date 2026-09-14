import React from 'react';
import Link from 'next/link';
import { queryTable } from '../../../src/lib/supabaseContent';

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

export const metadata = {
  title: 'Browse by University | Notes Arena',
  description:
    'Browse colleges and study resources grouped by university. Find notes, PYQs, and study material for SPPU, Delhi University, Mumbai University and more.',
  openGraph: {
    title: 'Browse by University | Notes Arena',
    description:
      'Browse notes and PYQs for all affiliated colleges across top Indian universities.',
    images: [
      {
        url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
  robots: { index: true, follow: true },
};

/** Converts a university name to a URL-safe slug */
function slugify(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function getUniversitiesWithColleges() {
  try {
    const universities = await queryTable(
      'universities',
      'id,name,slug,colleges(id,name,slug,location,verified)',
      { order: 'name.asc', limit: '100' }
    );

    if (universities && universities.length > 0) {
      return universities.map((u) => ({
        ...u,
        colleges: u.colleges || [],
      })).sort((a, b) => (b.colleges?.length || 0) - (a.colleges?.length || 0));
    }

    const colleges = await queryTable(
      'colleges',
      'id,name,slug,university,location,verified',
      { order: 'university.asc', limit: '200' }
    );

    const uniMap = {};
    for (const college of colleges || []) {
      const uni = (college.university || 'Other').trim();
      if (!uniMap[uni]) {
        uniMap[uni] = { name: uni, slug: slugify(uni), colleges: [] };
      }
      uniMap[uni].colleges.push(college);
    }

    return Object.values(uniMap).sort(
      (a, b) => b.colleges.length - a.colleges.length
    );
  } catch (err) {
    console.error('[university/page] fetch failed:', err.message);
    return [];
  }
}

export default async function UniversityPage() {
  const universities = await getUniversitiesWithColleges();

  return (
    <>
      <style>{`
        .ulist-breadcrumb {
          display: flex;
          gap: 6px;
          font-size: 12px;
          color: var(--sub);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }
        .ulist-breadcrumb a { color: var(--sub); text-decoration: none; }
        .ulist-breadcrumb a:hover { color: var(--green); }

        .ulist-header {
          margin-bottom: 36px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .ulist-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 4vw, 34px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
        }
        .ulist-subtitle {
          font-size: 15px;
          color: var(--sub);
          margin: 0;
        }
        .ulist-stats {
          margin-top: 14px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ulist-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--green);
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 20px;
          padding: 4px 12px;
        }

        .uni-section {
          margin-bottom: 48px;
        }
        .uni-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--green);
        }
        .uni-section-icon {
          font-size: 20px;
          color: var(--green);
          flex-shrink: 0;
        }
        .uni-section-name {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          flex: 1;
          min-width: 0;
          margin: 0;
        }
        .uni-section-name a {
          color: inherit;
          text-decoration: none;
        }
        .uni-section-name a:hover {
          color: var(--green);
        }
        .uni-count-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(16,185,129,0.1);
          color: var(--green);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 20px;
          padding: 3px 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .uni-pyq-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--sub);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 3px 10px;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.18s;
        }
        .uni-pyq-link:hover {
          border-color: var(--green);
          color: var(--green);
        }

        .college-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }
        .college-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 18px 20px;
          transition: all 0.2s ease;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .college-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.08);
        }
        .college-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .college-card-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          flex: 1;
        }
        .college-verified-icon {
          font-size: 15px;
          color: var(--green);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .college-card-location {
          font-size: 11px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .college-card-action {
          font-size: 12px;
          color: var(--green);
          font-weight: 600;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 80px 24px;
          color: var(--sub);
          gap: 12px;
        }
        .empty-state-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
        }
        .empty-state-sub { font-size: 14px; }

        @media (max-width: 640px) {
          .college-grid { grid-template-columns: 1fr; }
          .uni-section-name { font-size: 15px; }
          .uni-pyq-link { display: none; }
        }
      `}</style>

      {/* Breadcrumb */}
      <nav className="ulist-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>Universities</span>
      </nav>

      {/* Page Header */}
      <header className="ulist-header">
        <h1 className="ulist-title">Browse by University</h1>
        <p className="ulist-subtitle">
          Find colleges, notes, and PYQs grouped by their affiliated university.
        </p>
        {universities.length > 0 && (
          <div className="ulist-stats">
            <span className="ulist-stat-chip">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>account_balance</span>
              {universities.length} {universities.length === 1 ? 'University' : 'Universities'}
            </span>
            <span className="ulist-stat-chip">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>school</span>
              {universities.reduce((sum, u) => sum + u.colleges.length, 0)} Colleges
            </span>
          </div>
        )}
      </header>

      {/* Content */}
      {universities.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 52, color: 'var(--border)' }}>account_balance</span>
          <p className="empty-state-title">No Universities Found</p>
          <p className="empty-state-sub">No university data has been indexed yet. Check back soon.</p>
        </div>
      ) : (
        universities.map((uni) => (
          <section key={uni.name} className="uni-section">
            <div className="uni-section-header">
              <span className="material-symbols-rounded uni-section-icon">account_balance</span>
              <h2 className="uni-section-name">
                <Link href={`/notes/university/${uni.slug}`}>{uni.name}</Link>
              </h2>
              <span className="uni-count-badge">
                {uni.colleges.length} {uni.colleges.length === 1 ? 'College' : 'Colleges'}
              </span>
              <Link href={`/notes/university/${uni.slug}/pyq`} className="uni-pyq-link">
                View PYQs →
              </Link>
            </div>

            <div className="college-grid">
              {uni.colleges.map((college) => (
                <Link
                  key={college.id}
                  href={`/notes/colleges/${college.slug}`}
                  className="college-card"
                >
                  <div className="college-card-top">
                    <div className="college-card-name">{college.name}</div>
                    {college.verified && (
                      <span
                        className="material-symbols-rounded college-verified-icon"
                        title="Verified College"
                      >
                        verified
                      </span>
                    )}
                  </div>
                  {college.location && (
                    <div className="college-card-location">
                      <span className="material-symbols-rounded" style={{ fontSize: 13 }}>location_on</span>
                      {college.location}
                    </div>
                  )}
                  <div className="college-card-action">
                    Browse Notes
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
