import React from 'react';
import Link from 'next/link';
import { queryTable } from '../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

/** Converts a university name to a URL-safe slug */
function slugify(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Reverse-slugify for display: best-effort human-readable name from slug */
function displayFromSlug(slug = '') {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function getUniversityColleges(uniSlug) {
  try {
    const colleges = await queryTable(
      'colleges',
      'id,name,slug,university,location,verified',
      { order: 'name.asc', limit: '200' }
    );

    const matched = (colleges || []).filter(
      (c) => slugify(c.university || '') === uniSlug
    );

    const uniName =
      matched.length > 0
        ? (matched[0].university || displayFromSlug(uniSlug)).trim()
        : displayFromSlug(uniSlug);

    return { uniName, colleges: matched };
  } catch (err) {
    console.error('[university/[uniSlug]] fetch failed:', err.message);
    return { uniName: displayFromSlug(uniSlug), colleges: [] };
  }
}

export async function generateMetadata({ params }) {
  const { uniSlug } = await params;
  const { uniName } = await getUniversityColleges(uniSlug);
  return {
    title: `${uniName} Notes, PYQs & Study Material | Notes Arena`,
    description: `Browse college notes, previous year question papers, and study resources for ${uniName} affiliated colleges on Notes Arena.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${uniName} Notes, PYQs & Study Material | Notes Arena`,
      description: `Browse college notes, PYQs, and study material for ${uniName}.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-arena-og.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function UniversityDetailPage({ params }) {
  const { uniSlug } = await params;
  const { uniName, colleges } = await getUniversityColleges(uniSlug);

  return (
    <>
      <style>{`
        .udp-breadcrumb {
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
        .udp-breadcrumb a { color: var(--sub); text-decoration: none; }
        .udp-breadcrumb a:hover { color: var(--green); }

        .udp-header {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .udp-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .udp-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 4vw, 34px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px;
        }
        .udp-subtitle {
          font-size: 14px;
          color: var(--sub);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .udp-pyq-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--green);
          color: #000;
          font-size: 14px;
          font-weight: 700;
          padding: 10px 20px;
          border-radius: var(--r-md);
          text-decoration: none;
          transition: opacity 0.18s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .udp-pyq-btn:hover { opacity: 0.88; }
        .udp-pyq-btn .material-symbols-rounded { font-size: 18px; }

        .udp-college-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .udp-college-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .udp-college-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.08);
        }
        .udp-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .udp-card-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          flex: 1;
        }
        .udp-card-verified {
          font-size: 15px;
          color: var(--green);
          flex-shrink: 0;
        }
        .udp-card-location {
          font-size: 12px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .udp-card-links {
          display: flex;
          gap: 10px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .udp-card-link-notes {
          font-size: 12px;
          font-weight: 600;
          color: var(--green);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .udp-card-link-pyq {
          font-size: 12px;
          font-weight: 600;
          color: var(--sub);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 3px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2px 8px;
          transition: all 0.15s;
        }
        .udp-card-link-pyq:hover {
          border-color: var(--green);
          color: var(--green);
        }

        .udp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 80px 24px;
          color: var(--sub);
          gap: 12px;
        }
        .udp-empty-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
        }

        @media (max-width: 640px) {
          .udp-college-grid { grid-template-columns: 1fr; }
          .udp-header-row { flex-direction: column; }
        }
      `}</style>

      {/* Breadcrumb */}
      <nav className="udp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/university">Universities</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{uniName}</span>
      </nav>

      {/* Header */}
      <header className="udp-header">
        <div className="udp-header-row">
          <div>
            <h1 className="udp-title">{uniName}</h1>
            <p className="udp-subtitle">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--green)' }}>school</span>
              {colleges.length} {colleges.length === 1 ? 'college' : 'colleges'} indexed
            </p>
          </div>
          {colleges.length > 0 && (
            <Link href={`/notes/university/${uniSlug}/pyq`} className="udp-pyq-btn">
              <span className="material-symbols-rounded">quiz</span>
              Browse All PYQs for {uniName.split(' ').slice(0, 3).join(' ')}
            </Link>
          )}
        </div>
      </header>

      {/* College Grid */}
      {colleges.length === 0 ? (
        <div className="udp-empty">
          <span className="material-symbols-rounded" style={{ fontSize: 52, color: 'var(--border)' }}>account_balance</span>
          <p className="udp-empty-title">No Colleges Found</p>
          <p style={{ fontSize: 14 }}>
            No colleges are indexed under &quot;{uniName}&quot; yet.
          </p>
          <Link
            href="/notes/university"
            style={{
              marginTop: 8,
              fontSize: 14,
              color: 'var(--green)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Back to Universities
          </Link>
        </div>
      ) : (
        <div className="udp-college-grid">
          {colleges.map((college) => (
            <Link
              key={college.id}
              href={`/notes/colleges/${college.slug}`}
              className="udp-college-card"
            >
              <div className="udp-card-header">
                <div className="udp-card-name">{college.name}</div>
                {college.verified && (
                  <span
                    className="material-symbols-rounded udp-card-verified"
                    title="Verified College"
                  >
                    verified
                  </span>
                )}
              </div>
              {college.location && (
                <div className="udp-card-location">
                  <span className="material-symbols-rounded" style={{ fontSize: 13 }}>location_on</span>
                  {college.location}
                </div>
              )}
              <div className="udp-card-links">
                <span className="udp-card-link-notes">
                  Browse Notes
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>chevron_right</span>
                </span>
                <Link
                  href={`/notes/university/${uniSlug}/pyq`}
                  className="udp-card-link-pyq"
                  onClick={(e) => e.stopPropagation()}
                >
                  View PYQs
                </Link>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
