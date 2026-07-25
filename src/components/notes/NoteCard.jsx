'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import CardActionMenu from '../ui/CardActionMenu';
import ClapIcon from '../icons/ClapIcon';

export function NoteTypeTag({ type }) {
  const labelMap = {
    question_paper: 'PYQ',
    notes: 'Notes',
    book: 'Book',
    assignment: 'Assignment',
    cheatsheet: 'Cheatsheet',
    video_link: 'Video Link',
    project_report: 'Project',
    lab_manual: 'Lab Manual',
    roadmap: 'Roadmap',
    other: 'Resource',
  };

  const styleMap = {
    question_paper: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }, // Red
    notes: { bg: 'rgba(0, 180, 216, 0.1)', color: '#00b4d8' }, // Teal / Cyan
    book: { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }, // Purple
    assignment: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }, // Amber
    cheatsheet: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }, // Emerald
    video_link: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }, // Blue
    project_report: { bg: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }, // Pink
    lab_manual: { bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }, // Sky
    roadmap: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }, // Indigo
    other: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }, // Gray
  };

  const currentStyle = styleMap[type] || styleMap.other;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 4,
      background: currentStyle.bg,
      color: currentStyle.color,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {labelMap[type] || 'Resource'}
    </span>
  );
}

export default function NoteCard({ note }) {
  const [hidden, setHidden] = useState(false);

  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (hidden) return null;

  return (
    <>
      <style>{`
        .premium-note-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 180px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .premium-note-card:hover {
          border-color: var(--green);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 180, 216, 0.1);
        }
        .note-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.4;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .note-card-meta {
          font-size: 11px;
          color: var(--sub);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .note-card-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>

      <Link href={`/notes/resource/${note.slug}`} style={{ textDecoration: 'none' }}>
        <div className="premium-note-card">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <NoteTypeTag type={note.type} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {note.semester && (
                  <span style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600 }}>
                    Sem {note.semester}
                  </span>
                )}
                <div onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                  <CardActionMenu
                    contentId={note.id || note.slug}
                    contentType="note"
                    contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/notes/resource/${note.slug}` : undefined}
                    triggerSize={16}
                    onHide={() => setHidden(true)}
                  />
                </div>
              </div>
            </div>
            
            <h4 className="note-card-title">{note.title}</h4>
            
            <p style={{ fontSize: 12, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 12 }}>
              {note.subject_name || note.college_name || note.topic_name || 'General Resource'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <img 
                src={note.uploader_avatar_url || note.uploader?.avatar_url || 'https://res.cloudinary.com/dw5aqjqur/image/upload/v1779995620/cpa/avatars/hyonbsm8ojekkds5fk9l.png'} 
                alt={`${note.uploader_name || note.uploader?.name || 'CPA Admin'}'s avatar`} 
                style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} 
              />
              <span style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {note.uploader_name || note.uploader?.name || note.uploader_username || note.uploader?.username || 'CPA Admin'}
              </span>
            </div>

            <div className="note-card-meta">
              <div className="note-card-stat">
                <ClapIcon size={18} color="currentColor" />
                <span>{note.upvote_count || 0}</span>
              </div>
              <div className="note-card-stat">
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>download</span>
                <span>{note.downloads || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
