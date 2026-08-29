import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchApi } from '../../../../src/utils/notesApi';
import { queryTable } from '../../../../src/lib/supabaseContent';

// Incremental Static Regeneration (1-hour edge cache with on-demand revalidation)
export const revalidate = 3600;

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

const KNOWN_FIELDS = [
  { id: 'computer-science', name: 'Computer Science', slug: 'computer-science' },
  { id: 'engineering', name: 'Engineering', slug: 'engineering' },
  { id: 'medical-health', name: 'Medical & Health', slug: 'medical-health' },
  { id: 'commerce-finance', name: 'Commerce & Finance', slug: 'commerce-finance' },
  { id: 'sciences', name: 'Sciences', slug: 'sciences' },
  { id: 'arts-humanities', name: 'Arts & Humanities', slug: 'arts-humanities' },
];

async function getFieldData(slug) {
  if (!slug) return null;
  const decoded = decodeURIComponent(slug).trim();

  // 1. Query Supabase directly
  try {
    const fields = await queryTable('notes_fields', '*', {
      slug: `ilike.${decoded}`,
      limit: '1',
    }).catch(() => []);

    let field = fields && fields.length > 0 ? fields[0] : null;
    if (!field) {
      const fieldsById = await queryTable('notes_fields', '*', {
        id: `eq.${decoded}`,
        limit: '1',
      }).catch(() => []);
      field = fieldsById && fieldsById.length > 0 ? fieldsById[0] : null;
    }

    if (field) {
      const topics = await queryTable('field_topics', '*', {
        field_id: `eq.${field.id}`,
        order: 'name.asc',
      }).catch(() => []);

      const notes = await queryTable('notes', 'id,topic_id,custom_topic_name,title', {
        field_id: `eq.${field.id}`,
      }).catch(() => []);

      const topicsWithNotesCount = (topics || []).map(t => {
        const tName = (t.name || '').toLowerCase();
        const searchWords = tName.split(/[\s,&/]+/).filter(w => w.length >= 4);
        const count = notes.filter(n => {
          if (n.topic_id === t.id) return true;
          if (n.custom_topic_name && n.custom_topic_name.toLowerCase().includes(tName)) return true;
          const noteTitle = (n.title || '').toLowerCase();
          if (searchWords.some(w => noteTitle.includes(w))) return true;
          return false;
        }).length;

        return {
          ...t,
          notes_count: count,
        };
      });

      return {
        field,
        topics: topicsWithNotesCount,
      };
    }
  } catch (err) {
    console.error('Supabase getFieldData failed:', err);
  }

  // 2. Fallback to REST API
  try {
    const res = await fetchApi(`/notes/fields/${decoded}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading field ${slug}:`, err);
  }

  // 3. Fallback to known taxonomy definition if field exists in standard list
  const matched = KNOWN_FIELDS.find(
    f => f.slug.toLowerCase() === decoded.toLowerCase() || f.name.toLowerCase() === decoded.toLowerCase()
  );
  if (matched) {
    return {
      field: {
        id: matched.id,
        name: matched.name,
        slug: matched.slug,
        description: `Browse lecture notes, question papers, and study resources for ${matched.name} on Notes Arena.`,
      },
      topics: [],
    };
  }

  // Generic fallback formatting for any valid URL slug (prevents 404/noindex on department index pages)
  if (decoded && !decoded.includes('.')) {
    const formattedName = decoded
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      field: {
        id: decoded,
        name: formattedName,
        slug: decoded,
        description: `Browse lecture notes and study resources for ${formattedName} department on Notes Arena.`,
      },
      topics: [],
    };
  }

  return null;
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
