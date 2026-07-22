import React from 'react';
import Link from 'next/link';
import { getCollegeBySlug, queryTable } from '../../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collegeSlug } = await params;
  const college = await getCollegeBySlug(collegeSlug);
  const title = college ? `${college.name} PYQs | Notes Arena` : 'College PYQs | Notes Arena';
  return {
    title,
    description: `Download previous year question papers (PYQs) for ${college?.name || 'college exams'}.`,
    openGraph: {
      title,
      description: `Download question papers for ${college?.name || 'college exams'}.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-arena-og.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getCollegePyqs(collegeId) {
  if (!collegeId) return [];
  try {
    const notes = await queryTable(
      'notes',
      'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,created_at',
      { type: 'eq.question_paper', college_id: `eq.${collegeId}`, status: 'eq.published', order: 'semester.asc,created_at.desc', limit: '100' }
    );
    return notes || [];
  } catch (err) {
    console.error('[college/pyq] Fetch error:', err.message);
    return [];
  }
}

export default async function CollegePyqPage({ params }) {
  const { collegeSlug } = await params;
  const college = await getCollegeBySlug(collegeSlug);
  const pyqs = college ? await getCollegePyqs(college.id) : [];

  // Group PYQs by semester
  const semesterMap = {};
  pyqs.forEach((note) => {
    const sem = note.semester ? `Semester ${note.semester}` : 'Other Semesters';
    if (!semesterMap[sem]) semesterMap[sem] = [];
    semesterMap[sem].push(note);
  });

  return (
    <>
      <style>{`
        .cpyq-breadcrumb {
          display: flex;
          gap: 6px;
          font-size: 12px;
          color: var(--sub);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
        }
        .cpyq-breadcrumb a { color: var(--sub); text-decoration: none; }
        .cpyq-breadcrumb a:hover { color: var(--green); }

        .cpyq-header {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .cpyq-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 4vw, 32px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
        }
        .cpyq-subtitle {
          font-size: 15px;
          color: var(--sub);
          margin: 0;
        }

        .sem-group {
          margin-bottom: 36px;
        }
        .sem-group-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--green);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .note-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .note-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.08);
        }
        .note-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          margin-bottom: 8px;
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .note-title:hover { color: var(--green); }

        .thumb-box {
          width: 100%;
          height: 140px;
          border-radius: 6px;
          overflow: hidden;
          background: #000;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .card-actions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }
        .btn-action {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 12px;
          border-radius: var(--r-md);
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-view {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .btn-view:hover {
          border-color: var(--green);
          color: var(--green);
        }
        .btn-dl {
          background: var(--green);
          color: #fff;
          border: 1px solid var(--green);
        }
        .btn-dl:hover { opacity: 0.9; }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: var(--sub);
        }
      `}</style>

      <nav className="cpyq-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/colleges">Colleges</Link>
        <span>/</span>
        {college && <Link href={`/notes/colleges/${college.slug}`}>{college.name}</Link>}
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>PYQs</span>
      </nav>

      <header className="cpyq-header">
        <h1 className="cpyq-title">{college?.name || 'College'} — PYQs</h1>
        <p className="cpyq-subtitle">
          Previous Year Question Papers for {college?.name || 'this college'}.
        </p>
      </header>

      {pyqs.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 48, marginBottom: 12 }}>description</span>
          <p>No PYQs uploaded yet for this college.</p>
        </div>
      ) : (
        Object.entries(semesterMap).map(([semTitle, notes]) => (
          <div key={semTitle} className="sem-group">
            <h2 className="sem-group-title">
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--green)' }}>school</span>
              {semTitle}
            </h2>
            <div className="notes-grid">
              {notes.map((note) => {
                const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes((note.file_type || '').toLowerCase());
                return (
                  <div key={note.id} className="note-card">
                    <div>
                      {isImage && note.file_url && (
                        <div className="thumb-box">
                          <img src={note.file_url} alt={note.title} className="thumb-img" />
                        </div>
                      )}
                      <Link href={`/notes/resource/${note.slug}`} className="note-title">
                        {note.title}
                      </Link>
                    </div>
                    <div className="card-actions">
                      <Link href={`/notes/resource/${note.slug}`} className="btn-action btn-view">
                        View
                      </Link>
                      {note.file_url && (
                        <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="btn-action btn-dl">
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>download</span>
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </>
  );
}