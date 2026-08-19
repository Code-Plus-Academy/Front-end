import React from 'react';
import Link from 'next/link';
import NoteCard from '../../../src/components/notes/NoteCard';
import { fetchApi } from '../../../src/utils/notesApi';
import { queryTable } from '../../../src/lib/supabaseContent';

export const dynamic = 'force-dynamic';

// ─── type mapping ────────────────────────────────────────────────────────────
const TYPE_MAP = {
  pyq:            'question_paper',
  notes:          'notes',
  book:           'book',
  'lab-manual':   'lab_manual',
  cheatsheet:     'cheatsheet',
};

const TYPE_LABELS = {
  pyq:            'PYQs',
  notes:          'Notes',
  book:           'Books',
  'lab-manual':   'Lab Manuals',
  cheatsheet:     'Cheatsheets',
};

const SEMESTERS = [1, 2, 3, 4, 5, 6];

// ─── metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata({ searchParams }) {
  const params    = await searchParams;
  const q         = params.q    || '';
  const typeLabel = params.type ? (TYPE_LABELS[params.type] || params.type) : '';
  const semLabel  = params.sem  ? `Semester ${params.sem}` : '';
  const context   = [typeLabel, semLabel].filter(Boolean).join(', ');
  return {
    title: q
      ? `Search Results for "${q}"${context ? ` in ${context}` : ''} | Notes Arena`
      : 'Search study materials | Notes Arena',
    description: `Find syllabus notes, cheatsheets, lab manuals, and previous year papers for "${q}" on Notes Arena.`,
    robots: { index: true, follow: true },
  };
}

// ─── data fetch ──────────────────────────────────────────────────────────────
async function searchNotes({ q, type, sem, university, college }) {
  let notes = [];

  try {
    const qs = new URLSearchParams();
    if (q)          qs.set('q',          q);
    if (type)       qs.set('type',       TYPE_MAP[type] || type);
    if (sem)        qs.set('semester',   sem);
    if (university) qs.set('university', university);
    if (college)    qs.set('college',    college);

    const res = await fetchApi(`/notes/search?${qs.toString()}`);
    if (res.ok) {
      const data = await res.json();
      notes = data.notes || [];
    }
  } catch (err) {
    console.error('Error searching notes via API:', err);
  }

  // Direct Supabase fallback if API returns empty
  if (!notes || notes.length === 0) {
    try {
      const filters = {
        status: 'eq.published',
        order: 'created_at.desc',
        limit: '50',
      };
      if (q) {
        filters.or = `(title.ilike.*${q}*,description.ilike.*${q}*)`;
      }
      if (type) {
        const dbType = TYPE_MAP[type] || type;
        filters.type = `eq.${dbType}`;
      }
      if (sem) {
        filters.semester = `eq.${sem}`;
      }
      const supaNotes = await queryTable('notes', '*', filters).catch(() => []);
      if (supaNotes && supaNotes.length > 0) {
        notes = supaNotes;
      }
    } catch (e) {
      console.error('Error searching notes via Supabase:', e);
    }
  }

  // STRICT IN-MEMORY GUARD: Never allow notes matching another semester or type to be displayed
  if (type) {
    const targetType = TYPE_MAP[type] || type;
    notes = notes.filter(n => n.type === targetType);
  }
  if (sem) {
    const targetSem = parseInt(sem, 10);
    notes = notes.filter(n => parseInt(n.semester, 10) === targetSem);
  }

  return notes;
}

// ─── helper: build chip URL preserving all other params ──────────────────────
function filterUrl(current, key, value) {
  const p = new URLSearchParams();
  if (current.q)          p.set('q',          current.q);
  if (current.type)       p.set('type',       current.type);
  if (current.sem)        p.set('sem',        current.sem);
  if (current.university) p.set('university', current.university);
  if (current.college)    p.set('college',    current.college);

  if (value === null || p.get(key) === value) {
    p.delete(key);   // clicking the active chip clears that filter
  } else {
    p.set(key, value);
  }
  return `/notes/search?${p.toString()}`;
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default async function NotesSearchPage({ searchParams }) {
  const params     = await searchParams;
  const q          = params.q          || '';
  const activeType = params.type       || '';
  const activeSem  = params.sem        || '';
  const university = params.university || '';
  const college    = params.college    || '';

  const notes = await searchNotes({ q, type: activeType, sem: activeSem, university, college });

  const activeFilterCount = [activeType, activeSem, university, college].filter(Boolean).length;

  const typeLabel    = activeType ? (TYPE_LABELS[activeType] || activeType) : '';
  const semLabel     = activeSem  ? `Sem ${activeSem}` : '';
  const contextParts = [typeLabel, semLabel].filter(Boolean);
  const contextStr   = contextParts.length ? ` in ${contextParts.join(', ')}` : '';

  const current = { q, type: activeType, sem: activeSem, university, college };

  return (
    <>
      <style>{`
        /* ── header ── */
        .search-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .search-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
        }
        .search-summary {
          color: var(--sub);
          margin-top: 4px;
          font-size: 14px;
        }

        /* ── filter bar ── */
        .filter-bar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
        }
        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--sub);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          min-width: 60px;
          flex-shrink: 0;
        }
        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          text-decoration: none;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .chip:hover {
          border-color: var(--green);
          color: var(--green);
        }
        .chip.active {
          background: var(--green);
          border-color: var(--green);
          color: #fff;
        }

        /* ── mobile active-filter badge ── */
        .filter-badge {
          display: none;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--sub);
          margin-bottom: 12px;
        }
        .badge-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--green);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
        }
        @media (max-width: 640px) {
          .filter-badge  { display: flex; }
          .filter-label  { display: none; }
        }

        /* ── results grid ── */
        .notes-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }
      `}</style>

      {/* ── page header ── */}
      <header className="search-header">
        <h1 className="search-title">
          {q ? `Search Results for "${q}"` : 'Search Study Materials'}
        </h1>
        <p className="search-summary">
          {notes.length} result{notes.length !== 1 ? 's' : ''}
          {q ? ` for "${q}"` : ''}
          {contextStr}
        </p>
      </header>

      {/* ── mobile: active filter badge ── */}
      {activeFilterCount > 0 && (
        <div className="filter-badge">
          <span className="badge-count">{activeFilterCount}</span>
          active filter{activeFilterCount !== 1 ? 's' : ''} applied
          <Link
            href={`/notes/search${q ? `?q=${encodeURIComponent(q)}` : ''}`}
            style={{ marginLeft: 4, color: 'var(--green)', fontSize: 12 }}
          >
            Clear all
          </Link>
        </div>
      )}

      {/* ── filter bar ── */}
      <div className="filter-bar">
        {/* Type chips */}
        <div className="filter-row">
          <span className="filter-label">Type</span>
          <div className="filter-chips">
            <Link
              href={filterUrl(current, 'type', null)}
              className={`chip${!activeType ? ' active' : ''}`}
            >
              All
            </Link>
            {Object.entries(TYPE_LABELS).map(([slug, label]) => (
              <Link
                key={slug}
                href={filterUrl(current, 'type', slug)}
                className={`chip${activeType === slug ? ' active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Semester chips */}
        <div className="filter-row">
          <span className="filter-label">Semester</span>
          <div className="filter-chips">
            <Link
              href={filterUrl(current, 'sem', null)}
              className={`chip${!activeSem ? ' active' : ''}`}
            >
              All
            </Link>
            {SEMESTERS.map((s) => (
              <Link
                key={s}
                href={filterUrl(current, 'sem', String(s))}
                className={`chip${activeSem === String(s) ? ' active' : ''}`}
              >
                Sem {s}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── results ── */}
      <section>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--sub)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 32, marginBottom: 8, display: 'block' }}>
              search_off
            </span>
            <p>We couldn't find any resources matching your query.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Try checking spelling, broadening your terms, or request a new upload.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <Link href="/notes/upload" className="btn-primary" style={{ padding: '8px 20px' }}>
                Upload Study Material
              </Link>
              <Link href="/notes" className="btn-secondary" style={{ padding: '8px 20px' }}>
                Back to Arena
              </Link>
            </div>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
