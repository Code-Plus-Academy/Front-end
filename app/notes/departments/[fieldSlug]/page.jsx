import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '../../../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { fieldSlug } = await params;
  const data = await getFieldData(fieldSlug);

  if (!data || !data.field) {
    return {
      title: 'Department Not Found | Notes Arena',
    };
  }

  const title = `${data.field.name} Study Materials & Notes | Notes Arena`;
  const description = `Browse free lecture notes, assignments, roadmaps, cheatsheets, and question papers for ${data.field.name} department on Notes Arena.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/departments/${data.field.slug}`,
    },
  };
}

// Mock fallbacks
const MOCK_FIELDS_DATA = {
  'computer-science': {
    field: { id: '1', name: 'Computer Science', slug: 'computer-science' },
    topics: [
      { id: 't1', name: 'Database Management Systems', slug: 'dbms', notes_count: 42 },
      { id: 't2', name: 'Data Structures & Algorithms', slug: 'dsa', notes_count: 89 },
      { id: 't3', name: 'Computer Networks', slug: 'computer-networks', notes_count: 24 },
      { id: 't4', name: 'Operating Systems', slug: 'operating-systems', notes_count: 31 },
      { id: 't5', name: 'Machine Learning', slug: 'machine-learning', notes_count: 18 },
    ]
  }
};

async function getFieldData(slug) {
  try {
    const res = await fetchApi(`/notes/fields/${slug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading field ${slug}:`, err);
  }
  return MOCK_FIELDS_DATA[slug] || null;
}

export default async function FieldPage({ params }) {
  const { fieldSlug } = await params;
  const data = await getFieldData(fieldSlug);

  if (!data || !data.field) {
    notFound();
  }

  const { field, topics = [] } = data;

  return (
    <>
      <style>{`
        .field-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        .field-title {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .topics-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .topic-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 120px;
          transition: all 0.2s;
        }
        .topic-item:hover {
          border-color: var(--green);
          background: var(--s2);
          transform: translateY(-2px);
        }
        .topic-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }
      `}</style>

      <header className="field-header">
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          <Link href="/notes">Notes</Link>
          <span>/</span>
          <Link href="/notes/departments">Departments</Link>
        </div>
        <h1 className="field-title">{field.name} Department</h1>
        <p style={{ color: 'var(--sub)' }}>
          Browse resources by topic to download curriculum-mapped lecture notes, cheatsheets, and question papers.
        </p>
      </header>

      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Select Topic</h2>
        {topics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--sub)' }}>
            <p>No topics have been indexed under {field.name} yet.</p>
          </div>
        ) : (
          <div className="topics-list">
            {topics.map((topic) => (
              <Link key={topic.id} href={`/notes/departments/${field.slug}/${topic.slug}`} style={{ textDecoration: 'none' }}>
                <div className="topic-item">
                  <h3 className="topic-name">{topic.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{topic.notes_count || 0} Resources</span>
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--green)' }}>arrow_right_alt</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
