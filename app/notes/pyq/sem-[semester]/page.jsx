import React from 'react';
import Link from 'next/link';
import { queryTable, enrichNotesWithSocialUploaders } from '../../../../src/lib/supabaseContent';
import ResourceCard from '../../../../src/components/notes/ResourceCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { semester } = await params;
  const semNum = parseInt(String(semester).replace(/[^0-9]/g, ''), 10) || 1;
  return {
    title: `Semester ${semNum} PYQ Question Papers | Notes Arena`,
    description: `Download Semester ${semNum} previous year question papers (PYQs) for college exams and degree courses.`,
    openGraph: {
      title: `Semester ${semNum} PYQ Question Papers | Notes Arena`,
      description: `Download Semester ${semNum} question papers across top colleges.`,
      images: [{ url: 'https://www.codeplusacademy.in/notes-thumbnail.jpg', width: 1200, height: 630 }],
    },
  };
}

async function getPyqsBySemester(semNum) {
  try {
    const notes = await queryTable(
      'notes',
      'id,title,slug,type,semester,subject_id,college_id,file_url,file_type,upvote_count,download_count,created_at,uploader_id',
      { type: 'eq.question_paper', semester: `eq.${semNum}`, status: 'eq.published', order: 'created_at.desc', limit: '100' }
    );
    const colleges = await queryTable('colleges', 'id,name,slug,university', { limit: '200' });
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
    console.error('[pyq/sem] Fetch error:', err.message);
    return [];
  }
}

export default async function SemesterPyqPage({ params }) {
  const { semester } = await params;
  const semNum = parseInt(String(semester).replace(/[^0-9]/g, ''), 10) || 1;
  const pyqs = await getPyqsBySemester(semNum);
  const semesters = [1, 2, 3, 4, 5, 6];

  return (
    <div style={{ width: '100%', maxWidth: 'min(1100px, 95vw)', margin: '0 auto', boxSizing: 'border-box' }}>
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
        .pyq-breadcrumb a:hover { color: var(--green, #00b4d8); }

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

        /* Horizontal Semester Tab Row */
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
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 2rem;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 1680px) {
          .resource-list-col {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 16px;
          }
        }
        @media (max-width: 1360px) {
          .resource-list-col {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 1024px) {
          .resource-list-col {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 768px) {
          .resource-list-col {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
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

      <nav className="pyq-breadcrumb" aria-label="Breadcrumb">
        <Link href="/notes">Notes</Link>
        <span>/</span>
        <Link href="/notes/pyq">PYQs</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>Sem {semNum}</span>
      </nav>

      <header className="pyq-header">
        <h1 className="pyq-title">Semester {semNum} PYQ Question Papers</h1>
        <p className="pyq-subtitle">
          Showing previous year question papers for Semester {semNum}.
        </p>
      </header>

      {/* Horizontal Filter Tabs */}
      <div className="filter-tab-row">
        <Link href="/notes/pyq" className="tab-chip">
          All Semesters
        </Link>
        {semesters.map((s) => (
          <Link
            key={s}
            href={`/notes/pyq/sem-${s}`}
            className={`tab-chip ${s === semNum ? 'active' : ''}`}
          >
            Sem {s}
          </Link>
        ))}
      </div>

      <h2 className="notes-section-header">
        <span>Semester {semNum} Papers</span>
        <span className="section-badge">{pyqs.length} {pyqs.length === 1 ? 'Paper' : 'Papers'}</span>
      </h2>

      {pyqs.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-rounded" style={{ fontSize: 48, marginBottom: 12 }}>description</span>
          <p>No PYQs found for Semester {semNum}.</p>
          <Link href="/notes/upload" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
            Upload First Paper
          </Link>
        </div>
      ) : (
        <div className="resource-list-col">
          {pyqs.map((note) => (
            <ResourceCard key={note.id || note.slug} resource={note} />
          ))}
        </div>
      )}
    </div>
  );
}