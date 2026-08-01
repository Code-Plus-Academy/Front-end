import React from 'react';
import Link from 'next/link';
import { queryTable, enrichNotesWithSocialUploaders } from '../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Previous Year Question Papers (PYQs) | Notes Arena',
  description: 'Download previous year question papers (PYQs) for university exams, college internal exams, CBCS, and NEP pattern courses.',
  openGraph: {
    title: 'Previous Year Question Papers (PYQs) | Notes Arena',
    description: 'Download previous year question papers (PYQs) for university exams across colleges and semesters.',
    images: [{ url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg', width: 1200, height: 630 }],
  },
};

async function getPyqs() {
  try {
    const notes = await queryTable(
      'notes',
      'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,created_at',
      { type: 'eq.question_paper', status: 'eq.published', order: 'created_at.desc', limit: '100' }
    );
    const colleges = await queryTable('colleges', 'id,name,slug,university', { limit: '200' });
    const collegeMap = {};
    (colleges || []).forEach((c) => {
      collegeMap[c.id] = c;
    });

    const enriched = (notes || []).map((n) => ({
      ...n,
      college: collegeMap[n.college_id] || null,
    }));
    return await enrichNotesWithSocialUploaders(enriched);
  } catch (err) {
    console.error('[pyq/page] Fetch error:', err.message);
    return [];
  }
}

export default async function PyqPage() {
  const pyqs = await getPyqs();
  const semesters = [1, 2, 3, 4, 5, 6];

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
          align-items: center;
        }
        .pyq-breadcrumb a { color: var(--sub); text-decoration: none; }
        .pyq-breadcrumb a:hover { color: var(--green); }

        .pyq-header {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .pyq-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 4vw, 34px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
        }
        .pyq-subtitle {
          font-size: 15px;
          color: var(--sub);
          margin: 0;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--sub);
          transition: all 0.2s ease;
        }
        .chip:hover {
          border-color: var(--green);
          color: var(--green);
        }
        .chip.active {
          background: var(--green);
          color: #fff;
          border-color: var(--green);
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
        .note-title:hover {
          color: var(--green);
        }
        .note-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 12px;
          color: var(--sub);
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .sem-badge {
          background: rgba(16,185,129,0.1);
          color: var(--green);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 11px;
        }
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
        .btn-dl:hover {
          opacity: 0.9;
        }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: var(--sub);
        }
      `}</style>

      <nav className="pyq-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>PYQs</span>
      </nav>

      <header className="pyq-header">
        <h1 className="pyq-title">Previous Year Question Papers (PYQs)</h1>
        <p className="pyq-subtitle">
          Download question papers for university internal exams, mid-sem, and end-sem tests.
        </p>
      </header>

      {/* Semester Filter Chips */}
      <div className="filter-chips">
        <Link href="/notes/pyq" className="chip active">
          All Semesters
        </Link>
        {semesters.map((s) => (
          <Link key={s} href={`/notes/pyq/sem-${s}`} className="chip">
            Sem {s}
          </Link>
        ))}
      </div>

      {pyqs.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 48, marginBottom: 12 }}>description</span>
          <p>No PYQs found.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {pyqs.map((note) => {
            const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes((note.file_type || '').toLowerCase());
            return (
              <div key={note.id} className="note-card">
                <div>
                  {isImage && note.file_url && (
                    <div className="thumb-box">
                      <img src={note.file_url} alt={note.title} className="thumb-img" />
                    </div>
                  )}
                  <div className="note-meta">
                    {note.semester && <span className="sem-badge">Sem {note.semester}</span>}
                    {note.college?.name && <span>{note.college.name}</span>}
                  </div>
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
      )}
    </>
  );
}
