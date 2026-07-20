import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NoteCard from '../../../../../src/components/notes/NoteCard';
import { fetchApi } from '../../../../../src/utils/notesApi';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { fieldSlug, topicSlug } = await params;
  const data = await getTopicData(fieldSlug, topicSlug);

  if (!data || !data.topic) {
    return {
      title: 'Topic Not Found | Notes Arena',
    };
  }

  const title = `${data.topic.name} Notes & Resources | ${data.field.name} | Notes Arena`;
  const description = `Download lecture notes, reference material, cheatsheets, and question papers for ${data.topic.name} under ${data.field.name} department on Notes Arena.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://www.codeplusacademy.in/notes/departments/${data.field.slug}/${data.topic.slug}`,
    },
  };
}

// Mock fallbacks
const MOCK_TOPIC_DATA = {
  'computer-science': {
    'dbms': {
      field: { id: '1', name: 'Computer Science', slug: 'computer-science' },
      topic: { id: 't1', name: 'Database Management Systems', slug: 'dbms' },
      notes: [
        {
          id: 'n1',
          title: 'Database Management Systems Semester 4 Question Paper 2025',
          slug: 'sppu-comp-sem-4-dbms-pyq-2025',
          type: 'question_paper',
          subject_name: 'Database Management Systems',
          college_name: 'Savitribai Phule Pune University',
          semester: 4,
          uploader_name: 'Atharva Kapse',
          uploader_username: 'atharva',
          upvote_count: 34,
          downloads: 120,
          created_at: new Date().toISOString(),
        },
        {
          id: 'n5',
          title: 'DBMS Complete SQL Queries & Relational Algebra Cheat Sheet',
          slug: 'dbms-sql-cheat-sheet',
          type: 'cheatsheet',
          subject_name: 'Database Management Systems',
          college_name: 'Savitribai Phule Pune University',
          semester: 4,
          uploader_name: 'Atharva Kapse',
          uploader_username: 'atharva',
          upvote_count: 55,
          downloads: 218,
          created_at: new Date().toISOString(),
        }
      ]
    }
  }
};

async function getTopicData(fieldSlug, topicSlug) {
  try {
    const res = await fetchApi(`/notes/fields/${fieldSlug}/topics/${topicSlug}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading topic ${topicSlug}:`, err);
  }

  const base = MOCK_TOPIC_DATA[fieldSlug]?.[topicSlug];
  if (base) {
    return {
      field: base.field,
      topic: base.topic,
      notes: base.notes,
    };
  }
  return null;
}

export default async function TopicPage({ params }) {
  const { fieldSlug, topicSlug } = await params;
  const data = await getTopicData(fieldSlug, topicSlug);

  if (!data || !data.topic) {
    notFound();
  }

  const { field, topic, notes = [] } = data;

  return (
    <>
      <style>{`
        .topic-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 32px;
        }
        .topic-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
        }
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
      `}</style>

      <header className="topic-header">
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          <Link href="/notes">Notes</Link>
          <span>/</span>
          <Link href="/notes/departments">Departments</Link>
          <span>/</span>
          <Link href={`/notes/departments/${field.slug}`}>{field.name}</Link>
        </div>
        <h1 className="topic-title">{topic.name}</h1>
        <p style={{ color: 'var(--sub)' }}>
          Browse all study resources, lecture notes, cheatsheets, and question papers uploaded under {topic.name}.
        </p>
      </header>

      <section>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--sub)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 32, marginBottom: 8 }}>library_books</span>
            <p>No study resources have been uploaded for {topic.name} yet.</p>
            <Link href="/notes/upload" className="btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              Upload Note/PYQ
            </Link>
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
