import React from 'react';
import Link from 'next/link';
import { queryTable, enrichNotesWithSocialUploaders } from '../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { subjectSlug } = await params;
  const decodedSlug = decodeURIComponent(subjectSlug).trim();
  const subjectName = decodedSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `${subjectName} Notes, PYQs & Study Material | Notes Arena`,
    description: `Download notes, previous year question papers (PYQs), lab manuals, and study guides for ${subjectName}.`,
    openGraph: {
      title: `${subjectName} Notes & Study Material | Notes Arena`,
      description: `Comprehensive collection of study resources for ${subjectName}.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getSubjectAndNotes(subjectSlug) {
  try {
    const decodedSlug = decodeURIComponent(subjectSlug).trim();
    let subjects = await queryTable('course_subjects', 'id,name,slug,subject_code,semester', {
      slug: `ilike.${decodedSlug}`,
      limit: '1',
    });

    if (!subjects || subjects.length === 0) {
      subjects = await queryTable('course_subjects', 'id,name,slug,subject_code,semester', {
        subject_code: `ilike.${decodedSlug}`,
        limit: '1',
      });
    }

    const subject = subjects && subjects.length > 0 ? subjects[0] : null;

    let notes = [];
    if (subject) {
      notes = await queryTable(
        'notes',
        'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,created_at,description',
        { subject_id: `eq.${subject.id}`, status: 'eq.published', order: 'created_at.desc', limit: '100' }
      );
    }

    const colleges = await queryTable('colleges', 'id,name,slug', { limit: '200' });
    const collegeMap = {};
    (colleges || []).forEach((c) => {
      collegeMap[c.id] = c;
    });

    const formatted = (notes || []).map((n) => ({
      ...n,
      college: collegeMap[n.college_id] || null,
    }));
    const enrichedNotes = await enrichNotesWithSocialUploaders(formatted);

    return { subject, notes: enrichedNotes, rawSlug: decodedSlug };
  } catch (err) {
    console.error('[subject/page] Fetch error:', err.message);
    return { subject: null, notes: [], rawSlug: subjectSlug };
  }
}

export default async function SubjectPage({ params }) {
  const { subjectSlug } = await params;
  const { subject, notes, rawSlug } = await getSubjectAndNotes(subjectSlug);
  const displayName = subject?.name || rawSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <>
      <style>{`
        .sbj-breadcrumb {
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
        .sbj-breadcrumb a { color: var(--sub); text-decoration: none; }
        .sbj-breadcrumb a:hover { color: var(--green); }

        .sbj-header {
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .sbj-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 4vw, 34px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
        }
        .sbj-meta-pills {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .sbj-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          color: var(--green);
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
        .type-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--green-dim);
          color: var(--green);
          margin-bottom: 6px;
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
        .btn-dl:hover { opacity: 0.9; }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: var(--sub);
        }
      `}</style>

      <nav className="sbj-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{displayName}</span>
      </nav>

      <header className="sbj-header">
        <h1 className="sbj-title">{displayName}</h1>
        <div className="sbj-meta-pills">
          {subject?.subject_code && <span className="sbj-pill">Code: {subject.subject_code}</span>}
          {subject?.semester && <span className="sbj-pill">Semester {subject.semester}</span>}
          <span className="sbj-pill">{notes.length} Resource(s)</span>
        </div>
      </header>

      {notes.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 48, marginBottom: 12 }}>menu_book</span>
          <p>No resources uploaded yet for this subject.</p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => {
            const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes((note.file_type || '').toLowerCase());
            return (
              <div key={note.id} className="note-card">
                <div>
                  <span className="type-badge">{(note.type || 'resource').replace('_', ' ')}</span>
                  {isImage && note.file_url && (
                    <div className="thumb-box">
                      <img src={note.file_url} alt={note.title} className="thumb-img" />
                    </div>
                  )}
                  <Link href={`/notes/resource/${note.slug}`} className="note-title">
                    {note.title}
                  </Link>
                  {note.college?.name && (
                    <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 4 }}>
                      {note.college.name}
                    </div>
                  )}
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