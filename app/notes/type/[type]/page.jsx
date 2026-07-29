import React from 'react';
import Link from 'next/link';
import { queryTable, enrichNotesWithSocialUploaders } from '../../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

const TYPE_MAP = {
  'question-paper': 'question_paper',
  'notes': 'notes',
  'book': 'book',
  'lab-manual': 'lab_manual',
  'cheatsheet': 'cheatsheet',
  'handwritten': 'handwritten',
  'assignment': 'assignment',
  'project-report': 'project_report',
  'roadmap': 'roadmap',
  'video-link': 'video_link',
};

const TYPE_LABELS = {
  'question_paper': 'Previous Year Question Papers',
  'notes': 'Study Notes',
  'book': 'Books & References',
  'lab_manual': 'Lab Manuals',
  'cheatsheet': 'Cheat Sheets',
  'handwritten': 'Handwritten Notes',
  'assignment': 'Assignments',
  'project_report': 'Project Reports',
  'roadmap': 'Roadmaps',
  'video_link': 'Video Resources',
};

export async function generateMetadata({ params }) {
  const { type } = await params;
  const dbType = TYPE_MAP[type] || 'notes';
  const label = TYPE_LABELS[dbType] || 'Resources';
  return {
    title: `${label} | Notes Arena`,
    description: `Download ${label.toLowerCase()} for university exams and degree courses.`,
    openGraph: {
      title: `${label} | Notes Arena`,
      description: `Browse ${label.toLowerCase()} across colleges and departments.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getNotesByType(typeSlug) {
  const dbType = TYPE_MAP[typeSlug];
  if (!dbType) return [];
  try {
    const notes = await queryTable(
      'notes',
      'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,created_at',
      { type: `eq.${dbType}`, status: 'eq.published', order: 'created_at.desc', limit: '100' }
    );
    const colleges = await queryTable('colleges', 'id,name,slug', { limit: '200' });
    const collegeMap = {};
    (colleges || []).forEach((c) => {
      collegeMap[c.id] = c;
    });

    const formatted = (notes || []).map((n) => ({
      ...n,
      college: collegeMap[n.college_id] || null,
    }));
    return await enrichNotesWithSocialUploaders(formatted);
  } catch (err) {
    console.error('[type/page] Fetch error:', err.message);
    return [];
  }
}

export default async function TypePage({ params }) {
  const { type } = await params;
  const dbType = TYPE_MAP[type];
  const label = TYPE_LABELS[dbType] || 'Resources';
  const notes = await getNotesByType(type);

  const availableTypes = [
    { slug: 'question-paper', name: 'PYQs' },
    { slug: 'notes', name: 'Notes' },
    { slug: 'book', name: 'Books' },
    { slug: 'lab-manual', name: 'Lab Manuals' },
    { slug: 'cheatsheet', name: 'Cheatsheets' },
    { slug: 'handwritten', name: 'Handwritten' },
  ];

  return (
    <>
      <style>{`
        .tp-breadcrumb {
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
        .tp-breadcrumb a { color: var(--sub); text-decoration: none; }
        .tp-breadcrumb a:hover { color: var(--green); }

        .tp-header {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .tp-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 4vw, 34px);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
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

      <nav className="tp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{label}</span>
      </nav>

      <header className="tp-header">
        <h1 className="tp-title">{label}</h1>
      </header>

      {/* Type Switcher Chips */}
      <div className="filter-chips">
        {availableTypes.map((t) => (
          <Link
            key={t.slug}
            href={`/notes/type/${t.slug}`}
            className={`chip ${t.slug === type ? 'active' : ''}`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 48, marginBottom: 12 }}>category</span>
          <p>No resources found in this category.</p>
        </div>
      ) : (
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
