import React from 'react';
import Link from 'next/link';
import { fetchApi } from '../../utils/notesApi';
import { NoteTypeTag } from './NoteCard';

const MOCK_RELATED = [
  { id: '1', title: 'Operating Systems Previous Year Papers (SPPU Comp Sem 5)', slug: 'sppu-comp-sem-5-os-pyqs', type: 'question_paper' },
  { id: '2', title: 'DBMS Complete SQL Queries & Relational Algebra Cheat Sheet', slug: 'dbms-sql-cheat-sheet', type: 'cheatsheet' },
  { id: '3', title: 'Programming in C Complete Guide', slug: 'programming-c-complete-guide', type: 'notes' },
];

async function getRelated(noteId, subjectId, topicId) {
  try {
    const res = await fetchApi(`/notes/related?noteId=${noteId}&subjectId=${subjectId || ''}&topicId=${topicId || ''}`);
    if (res.ok) {
      const data = await res.json();
      return data.related || MOCK_RELATED;
    }
  } catch (err) {
    console.error('Error fetching related notes:', err);
  }
  return MOCK_RELATED;
}

export default async function RelatedNotes({ noteId, subjectId, topicId }) {
  const related = await getRelated(noteId, subjectId, topicId);

  return (
    <>
      <style>{`
        .related-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 20px;
        }
        .related-header {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 16px;
          color: var(--text);
        }
        .related-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .related-item {
          display: block;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
          transition: border-color 0.2s;
        }
        .related-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .related-item:hover .related-title {
          color: var(--green);
        }
        .related-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="related-card">
        <h3 className="related-header">Related Materials</h3>
        {related.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--sub)' }}>No related materials found.</p>
        ) : (
          <div className="related-list">
            {related.map((item) => (
              <Link key={item.id} href={`/notes/resource/${item.slug}`} className="related-item">
                <h4 className="related-title">{item.title}</h4>
                <NoteTypeTag type={item.type} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
