import React from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../src/utils/notesApi';
import { queryTable } from '../../../src/lib/supabaseContent';

export const metadata = {
  title: 'Departments & Fields Directory | Notes Arena',
  description: 'Explore academic resources, lecture notes, syllabus materials and codes structured by fields like Computer Science, Engineering, and Science.',
  robots: {
    index: true,
    follow: true,
  },
};

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

async function getFields() {
  try {
    const fields = await queryTable('notes_fields', '*', { order: 'name.asc' }).catch(() => []);
    if (fields && fields.length > 0) {
      const allTopics = await queryTable('field_topics', 'id,field_id').catch(() => []);
      const allNotes = await queryTable('notes', 'id,field_id').catch(() => []);

      return fields.map(f => {
        const topicsCount = allTopics.filter(t => t.field_id === f.id).length;
        const notesCount = allNotes.filter(n => n.field_id === f.id).length;
        return {
          ...f,
          stats: {
            topics: topicsCount,
            notes: notesCount,
          }
        };
      });
    }
  } catch (err) {
    console.error('Supabase getFields failed:', err);
  }

  try {
    const res = await fetchApi('/notes/fields');
    if (res.ok) {
      const data = await res.json();
      return data.fields || [];
    }
  } catch (err) {
    console.error('Failed fetching fields:', err);
  }
  return [];
}

export default async function DepartmentsPage() {
  const fields = await getFields();

  return (
    <>
      <style>{`
        .depts-header {
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 24px;
        }
        .depts-title {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
        }
        .depts-subtitle {
          color: var(--sub);
          font-size: 15px;
        }
        .depts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .depts-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 24px;
          height: 160px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .depts-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 180, 216, 0.08);
        }
        .card-dept-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }
      `}</style>

      <header className="depts-header">
        <h1 className="depts-title">Departments Directory</h1>
        <p className="depts-subtitle">Browse academic study resources, notes, and previous year papers categorized by field and department.</p>
      </header>

      <div className="depts-grid">
        {fields.map((f) => {
          const stats = f.stats || { topics: 0, notes: 0 };
          return (
            <Link key={f.id} href={`/notes/departments/${f.slug}`} style={{ textDecoration: 'none' }}>
              <div className="depts-card">
                <div>
                  <h3 className="card-dept-name">{f.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 6, fontWeight: 500 }}>
                    {stats.topics} Core Topics • {stats.notes} Active Notes
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--green)' }}>Explore Topics</span>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--green)' }}>arrow_right_alt</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
