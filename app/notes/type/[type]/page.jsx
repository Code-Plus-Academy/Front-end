import React from 'react';
import Link from 'next/link';
import { queryTable, enrichNotesWithSocialUploaders } from '../../../../src/lib/supabaseContent';
import ResourceCard from '../../../../src/components/notes/ResourceCard';

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
      'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at,uploader_id',
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
      college_name: collegeMap[n.college_id]?.name || n.college_name,
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

  // Group by semester if present
  const semGroups = {};
  notes.forEach((note) => {
    const semKey = note.semester ? `Sem ${note.semester}` : 'General / All Semesters';
    if (!semGroups[semKey]) semGroups[semKey] = [];
    semGroups[semKey].push(note);
  });

  return (
    <div style={{ width: '100%', maxWidth: 'min(1100px, 95vw)', margin: '0 auto', boxSizing: 'border-box' }}>
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
        .tp-breadcrumb a:hover { color: var(--green, #00b4d8); }

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

        /* Horizontal Type Filter Tabs */
        .filter-tab-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 6px;
          margin-bottom: 28px;
        }
        .filter-tab-row::-webkit-scrollbar {
          display: none;
        }
        .tab-chip {
          display: inline-flex;
          align-items: center;
          padding: 8px 18px;
          border-radius: 24px;
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--sub);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .tab-chip:hover {
          border-color: var(--green, #00b4d8);
          color: var(--green, #00b4d8);
        }
        .tab-chip.active {
          background: var(--green, #00b4d8);
          color: #fff;
          border-color: var(--green, #00b4d8);
          box-shadow: 0 2px 10px rgba(0, 180, 216, 0.3);
        }

        /* Section Header (TASK 2) */
        .notes-section-header {
          font-size: 1.2rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid var(--border-color, var(--border));
          padding-bottom: 0.5rem;
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(0, 180, 216, 0.12);
          color: var(--green, #00b4d8);
          border: 1px solid rgba(0, 180, 216, 0.25);
        }

        .resource-list-col {
          display: flex;
          flex-direction: column;
          margin-bottom: 2rem;
        }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: var(--sub);
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: 16px;
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

      {/* Horizontal Type Switcher Tabs */}
      <div className="filter-tab-row">
        {availableTypes.map((t) => (
          <Link
            key={t.slug}
            href={`/notes/type/${t.slug}`}
            className={`tab-chip ${t.slug === type ? 'active' : ''}`}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 48, marginBottom: 12 }}>category</span>
          <p>No resources found in this category.</p>
          <Link href="/notes/upload" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
            Upload Resource
          </Link>
        </div>
      ) : (
        <div>
          {Object.keys(semGroups).length > 1 ? (
            Object.entries(semGroups).map(([semTitle, items]) => (
              <section key={semTitle} style={{ marginBottom: '2.5rem' }}>
                <h2 className="notes-section-header">
                  <span>{semTitle}</span>
                  <span className="section-badge">{items.length} {items.length === 1 ? 'Resource' : 'Resources'}</span>
                </h2>
                <div className="resource-list-col">
                  {items.map((note) => (
                    <ResourceCard key={note.id || note.slug} resource={note} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="resource-list-col">
              {notes.map((note) => (
                <ResourceCard key={note.id || note.slug} resource={note} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
