import React from 'react';
import Link from 'next/link';
import { queryTable } from '../../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

/** Converts a university name to a URL-safe slug */
function slugify(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** Best-effort human-readable name from slug */
function displayFromSlug(slug = '') {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Returns true if the file type is an image */
function isImage(fileType = '') {
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileType.toLowerCase());
}

async function getUniversityPYQs(uniSlug) {
  try {
    const uniList = await queryTable(
      'universities',
      'id,name,slug',
      { slug: `eq.${uniSlug}` }
    );

    let uniId = null;
    let uniName = displayFromSlug(uniSlug);

    if (uniList && uniList.length > 0) {
      uniId = uniList[0].id;
      uniName = uniList[0].name;
    }

    const matchedColleges = uniId
      ? await queryTable('colleges', 'id,name,slug,university', { university_id: `eq.${uniId}`, order: 'name.asc', limit: '200' })
      : (await queryTable('colleges', 'id,name,slug,university', { order: 'name.asc', limit: '200' }) || []).filter(c => slugify(c.university || '') === uniSlug);

    if (!uniName && matchedColleges.length > 0) {
      uniName = (matchedColleges[0].university || displayFromSlug(uniSlug)).trim();
    }

    let uniNotes = [];
    if (uniId) {
      uniNotes = await queryTable(
        'notes',
        'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,created_at',
        {
          type: 'eq.question_paper',
          university_id: `eq.${uniId}`,
          status: 'eq.published',
          order: 'semester.asc,created_at.desc',
          limit: '100',
        }
      ).catch(() => []);
    }

    const collegeMap = {};
    for (const c of matchedColleges || []) {
      collegeMap[c.id] = c;
    }

    let allNotes = (uniNotes || []).map((n) => ({
      ...n,
      _collegeName: collegeMap[n.college_id]?.name || '',
      _collegeSlug: collegeMap[n.college_id]?.slug || '',
    }));

    if (allNotes.length === 0 && matchedColleges.length > 0) {
      const notesByCollege = await Promise.all(
        matchedColleges.map(async (college) => {
          try {
            const notes = await queryTable(
              'notes',
              'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,created_at',
              {
                type: 'eq.question_paper',
                college_id: `eq.${college.id}`,
                status: 'eq.published',
                order: 'semester.asc,created_at.desc',
                limit: '50',
              }
            );
            return (notes || []).map((n) => ({ ...n, _collegeName: college.name, _collegeSlug: college.slug }));
          } catch {
            return [];
          }
        })
      );
      allNotes = notesByCollege.flat();
    }

    return { uniName, notes: allNotes, colleges: matchedColleges };
  } catch (err) {
    console.error('[university/pyq] fetch failed:', err.message);
    return { uniName: displayFromSlug(uniSlug), notes: [], colleges: [] };
  }
}

export async function generateMetadata({ params }) {
  const { uniSlug } = await params;
  const { uniName } = await getUniversityPYQs(uniSlug);
  return {
    title: `${uniName} Previous Year Question Papers | Notes Arena`,
    description: `Download previous year question papers (PYQs) for all ${uniName} affiliated colleges. Find semester-wise question papers on Notes Arena.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${uniName} PYQs | Notes Arena`,
      description: `Semester-wise PYQs for ${uniName} affiliated colleges.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function UniversityPYQPage({ params }) {
  const { uniSlug } = await params;
  const { uniName, notes, colleges } = await getUniversityPYQs(uniSlug);

  // Group notes by semester
  const bySemester = {};
  for (const note of notes) {
    const sem = note.semester != null ? String(note.semester) : 'Other';
    if (!bySemester[sem]) bySemester[sem] = [];
    bySemester[sem].push(note);
  }

  // Sort semester keys: numeric semesters first, then 'Other'
  const semesterKeys = Object.keys(bySemester).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return 0;
  });

  return (
    <>
      <style>{`
        .pyq-breadcrumb {
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
        .pyq-breadcrumb a { color: var(--sub); text-decoration: none; }
        .pyq-breadcrumb a:hover { color: var(--green); }

        .pyq-header {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .pyq-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 3.5vw, 30px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
        }
        .pyq-meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .pyq-meta-chip {
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

        .sem-section {
          margin-bottom: 48px;
        }
        .sem-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--green);
        }
        .sem-section-title {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
          flex: 1;
          margin: 0;
        }
        .sem-count-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(16,185,129,0.1);
          color: var(--green);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 20px;
          padding: 3px 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .pyq-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 16px;
        }
        .pyq-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .pyq-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.08);
        }
        .pyq-card-thumbnail {
          width: 100%;
          height: 140px;
          object-fit: cover;
          display: block;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
        }
        .pyq-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .pyq-card-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }
        .pyq-sem-badge {
          font-size: 10px;
          font-weight: 700;
          background: rgba(16,185,129,0.1);
          color: var(--green);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 20px;
          padding: 2px 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .pyq-type-badge {
          font-size: 10px;
          font-weight: 700;
          background: var(--bg);
          color: var(--sub);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2px 8px;
          text-transform: uppercase;
        }
        .pyq-card-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pyq-card-college {
          font-size: 11px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pyq-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg);
        }
        .pyq-view-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--green);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .pyq-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 5px 10px;
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer;
        }
        .pyq-download-btn:hover {
          border-color: var(--green);
          color: var(--green);
        }

        .pyq-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 80px 24px;
          color: var(--sub);
          gap: 12px;
        }
        .pyq-empty-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
        }

        @media (max-width: 640px) {
          .pyq-grid { grid-template-columns: 1fr; }
          .pyq-title { font-size: 20px; }
        }
      `}</style>

      {/* Breadcrumb */}
      <nav className="pyq-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/university">Universities</Link>
        <span>/</span>
        <Link href={`/notes/university/${uniSlug}`}>{uniName}</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>PYQs</span>
      </nav>

      {/* Header */}
      <header className="pyq-header">
        <h1 className="pyq-title">{uniName} — Previous Year Question Papers</h1>
        <div className="pyq-meta-row">
          {notes.length > 0 && (
            <span className="pyq-meta-chip">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>quiz</span>
              {notes.length} Question {notes.length === 1 ? 'Paper' : 'Papers'}
            </span>
          )}
          {colleges.length > 0 && (
            <span className="pyq-meta-chip">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>school</span>
              {colleges.length} {colleges.length === 1 ? 'College' : 'Colleges'}
            </span>
          )}
          {semesterKeys.length > 0 && (
            <span className="pyq-meta-chip">
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>calendar_today</span>
              {semesterKeys.length} Semesters
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      {notes.length === 0 ? (
        <div className="pyq-empty">
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 56, color: 'var(--border)' }}
          >
            quiz
          </span>
          <p className="pyq-empty-title">No Question Papers Found</p>
          <p style={{ fontSize: 14 }}>
            No published PYQs are indexed for <strong>{uniName}</strong> colleges yet.
          </p>
          <Link
            href={`/notes/university/${uniSlug}`}
            style={{
              marginTop: 8,
              fontSize: 14,
              color: 'var(--green)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Back to {uniName}
          </Link>
        </div>
      ) : (
        semesterKeys.map((sem) => {
          const semNotes = bySemester[sem];
          const semLabel = /^\d+$/.test(sem) ? `Semester ${sem}` : sem;
          return (
            <section key={sem} className="sem-section">
              <div className="sem-section-header">
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 20, color: 'var(--green)' }}
                >
                  calendar_today
                </span>
                <h2 className="sem-section-title">{semLabel}</h2>
                <span className="sem-count-badge">
                  {semNotes.length} {semNotes.length === 1 ? 'Paper' : 'Papers'}
                </span>
              </div>

              <div className="pyq-grid">
                {semNotes.map((note) => (
                  <article key={note.id} className="pyq-card">
                    {/* Thumbnail for image files */}
                    {isImage(note.file_type || '') && note.file_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={note.file_url}
                        alt={note.title}
                        className="pyq-card-thumbnail"
                        loading="lazy"
                      />
                    )}

                    <div className="pyq-card-body">
                      <div className="pyq-card-badges">
                        {note.semester != null && (
                          <span className="pyq-sem-badge">Sem {note.semester}</span>
                        )}
                        <span className="pyq-type-badge">PYQ</span>
                        {note.file_type && (
                          <span className="pyq-type-badge">
                            {note.file_type.toUpperCase()}
                          </span>
                        )}
                        {note.upvote_count > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--sub)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 13 }}>thumb_up</span>
                            {note.upvote_count}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/notes/resource/${note.slug}`}
                        className="pyq-card-title"
                        style={{ textDecoration: 'none' }}
                      >
                        {note.title}
                      </Link>

                      {note._collegeName && (
                        <div className="pyq-card-college">
                          <span className="material-symbols-rounded" style={{ fontSize: 13 }}>school</span>
                          {note._collegeName}
                        </div>
                      )}
                    </div>

                    <div className="pyq-card-footer">
                      <Link
                        href={`/notes/resource/${note.slug}`}
                        className="pyq-view-link"
                      >
                        View Paper
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>chevron_right</span>
                      </Link>
                      {note.file_url && (
                        <a
                          href={note.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pyq-download-btn"
                          download
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>download</span>
                          Download
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
