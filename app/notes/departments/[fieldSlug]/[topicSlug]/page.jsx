import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NoteCard from '../../../../../src/components/notes/NoteCard';
import { fetchApi } from '../../../../../src/utils/notesApi';
import { queryTable } from '../../../../../src/lib/supabaseContent';

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

async function getTopicData(fieldSlug, topicSlug) {
  if (!fieldSlug || !topicSlug) return null;
  const decodedField = decodeURIComponent(fieldSlug).trim();
  const decodedTopic = decodeURIComponent(topicSlug).trim();

  // 1. Query Supabase directly
  try {
    let fields = await queryTable('notes_fields', '*', {
      slug: `ilike.${decodedField}`,
      limit: '1',
    }).catch(() => []);

    let field = fields && fields.length > 0 ? fields[0] : null;
    if (!field) {
      const fieldsById = await queryTable('notes_fields', '*', {
        id: `eq.${decodedField}`,
        limit: '1',
      }).catch(() => []);
      field = fieldsById && fieldsById.length > 0 ? fieldsById[0] : null;
    }

    if (field) {
      let topics = await queryTable('field_topics', '*', {
        field_id: `eq.${field.id}`,
        slug: `ilike.${decodedTopic}`,
        limit: '1',
      }).catch(() => []);

      let topic = topics && topics.length > 0 ? topics[0] : null;
      if (!topic) {
        const topicsById = await queryTable('field_topics', '*', {
          field_id: `eq.${field.id}`,
          id: `eq.${decodedTopic}`,
          limit: '1',
        }).catch(() => []);
        topic = topicsById && topicsById.length > 0 ? topicsById[0] : null;
      }

      if (!topic) {
        const globalTopics = await queryTable('field_topics', '*', {
          slug: `ilike.${decodedTopic}`,
          limit: '1',
        }).catch(() => []);
        if (globalTopics && globalTopics.length > 0) {
          topic = globalTopics[0];
        }
      }

      if (topic) {
        let notes = await queryTable('notes', '*', {
          topic_id: `eq.${topic.id}`,
          order: 'created_at.desc',
        }).catch(() => []);

        if (!notes || notes.length === 0) {
          notes = await queryTable('notes', '*', {
            field_id: `eq.${field.id}`,
            order: 'created_at.desc',
          }).catch(() => []);
        }

        const enrichedNotes = await Promise.all((notes || []).map(async (n) => {
          let collegeName = n.college_name || null;
          if (!collegeName && n.college_id) {
            const cList = await queryTable('colleges', 'name', { id: `eq.${n.college_id}` }).catch(() => []);
            if (cList && cList.length > 0) collegeName = cList[0].name;
          }

          let subjectName = n.subject_name || null;
          if (!subjectName && n.subject_id) {
            const sList = await queryTable('course_subjects', 'name', { id: `eq.${n.subject_id}` }).catch(() => []);
            if (sList && sList.length > 0) subjectName = sList[0].name;
          }

          return {
            ...n,
            college_name: collegeName,
            subject_name: subjectName,
          };
        }));

        return {
          field,
          topic,
          notes: enrichedNotes,
        };
      }
    }
  } catch (err) {
    console.error('Supabase getTopicData failed:', err);
  }

  // 2. Fallback to REST API
  try {
    const res = await fetchApi(`/notes/fields/${decodedField}/topics/${decodedTopic}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error loading topic ${topicSlug}:`, err);
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
