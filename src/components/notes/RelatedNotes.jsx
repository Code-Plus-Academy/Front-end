import React from 'react';
import Link from 'next/link';
import { queryTable } from '../../lib/supabaseContent';
import { NoteTypeTag } from './NoteCard';
import { BookOpen, Sparkles, ArrowRight, Eye, Download } from 'lucide-react';

/**
 * Fetch real related or recommended notes from Supabase Content DB.
 * Randomly picks from relevant subject notes and popular platform notes.
 */
export async function getRealRelatedNotes(currentNoteId, subjectId, topicId, fieldId, collegeId, semester) {
  try {
    let relatedList = [];

    // 1. Try matching by subject or topic if available
    if (subjectId) {
      const subjectMatches = await queryTable(
        'notes',
        'id,title,slug,type,download_count,upvote_count,subject_id,college_id,created_at',
        {
          subject_id: `eq.${subjectId}`,
          id: currentNoteId ? `neq.${currentNoteId}` : undefined,
          limit: '10',
        }
      ).catch(() => []);
      if (Array.isArray(subjectMatches)) {
        relatedList.push(...subjectMatches);
      }
    }

    // 2. Try matching by college if available
    if (collegeId && relatedList.length < 4) {
      const collegeMatches = await queryTable(
        'notes',
        'id,title,slug,type,download_count,upvote_count,subject_id,college_id,created_at',
        {
          college_id: `eq.${collegeId}`,
          id: currentNoteId ? `neq.${currentNoteId}` : undefined,
          limit: '10',
        }
      ).catch(() => []);
      if (Array.isArray(collegeMatches)) {
        relatedList.push(...collegeMatches);
      }
    }

    // 3. Fallback: Fetch recent & popular notes across the platform
    const generalNotes = await queryTable(
      'notes',
      'id,title,slug,type,download_count,upvote_count,subject_id,college_id,created_at',
      {
        id: currentNoteId ? `neq.${currentNoteId}` : undefined,
        order: 'created_at.desc',
        limit: '20',
      }
    ).catch(() => []);

    if (Array.isArray(generalNotes)) {
      relatedList.push(...generalNotes);
    }

    // Deduplicate by ID
    const seen = new Set();
    const unique = [];
    for (const item of relatedList) {
      if (item && item.id && item.slug && !seen.has(item.id) && item.id !== currentNoteId) {
        seen.add(item.id);
        unique.push(item);
      }
    }

    // Randomize the order so visits surface diverse materials
    const shuffled = [...unique].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  } catch (err) {
    console.error('Failed to fetch real related notes:', err);
    return [];
  }
}

/**
 * Sidebar Related Materials Widget
 */
export default async function RelatedNotes({ noteId, subjectId, topicId, fieldId, collegeId, semester }) {
  const related = await getRealRelatedNotes(noteId, subjectId, topicId, fieldId, collegeId, semester);

  return (
    <>
      <style>{`
        .related-card {
          background: var(--surface, #0a0e14);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: var(--r-md, 14px);
          padding: 18px 16px;
        }
        .related-header {
          font-family: var(--font-display, sans-serif);
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 14px;
          color: var(--text, #fff);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .related-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .related-item {
          display: block;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .related-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .related-item:hover .related-title {
          color: var(--cyan, #00dbe9);
        }
        .related-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text, #f0f2f8);
          line-height: 1.4;
          margin: 0 0 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s ease;
        }
        .related-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--sub, #94a3b8);
          font-family: var(--font-mono, monospace);
        }
      `}</style>

      <div className="related-card">
        <h3 className="related-header">
          <span>Related Materials</span>
          <Sparkles size={14} color="var(--cyan, #00dbe9)" />
        </h3>

        {related.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--sub, #94a3b8)', margin: 0 }}>
            No related materials found.
          </p>
        ) : (
          <div className="related-list">
            {related.map((item) => (
              <Link key={item.id} href={`/notes/resource/${item.slug}`} className="related-item">
                <h4 className="related-title">{item.title}</h4>
                <div className="related-meta-row">
                  <NoteTypeTag type={item.type} />
                  <span>{item.download_count || 0} downloads</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Full-width Bottom Related Notes & Discovery Grid
 */
export async function BottomRelatedNotesGrid({ currentNoteId, subjectId, topicId, fieldId, collegeId, semester }) {
  const related = await getRealRelatedNotes(currentNoteId, subjectId, topicId, fieldId, collegeId, semester);

  if (!related || related.length === 0) return null;

  return (
    <div style={{
      marginTop: 40,
      paddingTop: 32,
      borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700,
            color: 'var(--cyan, #00dbe9)', textTransform: 'uppercase', marginBottom: 4,
          }}>
            <Sparkles size={13} />
            <span>Recommended For You</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            fontWeight: 800,
            color: 'var(--text, #fff)',
            margin: 0,
          }}>
            Explore More Study Materials & PYQs
          </h2>
        </div>

        <Link
          href="/notes"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700, color: 'var(--cyan, #00dbe9)',
            textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <span>Browse All Notes</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Grid of Note Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {related.map((item) => (
          <Link
            key={item.id}
            href={`/notes/resource/${item.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--surface, #0a0e14)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              borderRadius: 'var(--r-md, 14px)',
              padding: '16px 18px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
            className="hover:border-cyan-500/40 hover:-translate-y-0.5 group"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <NoteTypeTag type={item.type} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: 'var(--sub, #94a3b8)', fontFamily: 'var(--font-mono, monospace)',
                }}>
                  <Download size={12} />
                  <span>{item.download_count || 0}</span>
                </div>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display, sans-serif)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text, #f0f2f8)',
                lineHeight: 1.4,
                margin: '0 0 10px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }} className="group-hover:text-cyan-400 transition-colors">
                {item.title}
              </h3>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.05))',
              fontSize: 11,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--cyan, #00dbe9)',
              fontWeight: 700,
            }}>
              <span>View Resource</span>
              <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
