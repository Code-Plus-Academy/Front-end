'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import CardActionMenu from '../ui/CardActionMenu';

export function NoteTypeTag({ type }) {
  const labelMap = {
    question_paper: 'PYQ',
    notes: 'Notes',
    book: 'Book',
    assignment: 'Assignment',
    cheatsheet: 'Cheatsheet',
    video_link: 'Video',
    project_report: 'Project',
    lab_manual: 'Lab Manual',
    roadmap: 'Roadmap',
    other: 'Resource',
  };

  const styleMap = {
    question_paper: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
    notes: { bg: 'rgba(0, 180, 216, 0.12)', color: '#38bdf8', border: 'rgba(0, 180, 216, 0.25)' },
    book: { bg: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
    assignment: { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
    cheatsheet: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    video_link: { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
    project_report: { bg: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.25)' },
    lab_manual: { bg: 'rgba(14, 165, 233, 0.12)', color: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
    roadmap: { bg: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
    other: { bg: 'rgba(107, 114, 128, 0.12)', color: '#9ca3af', border: 'rgba(107, 114, 128, 0.25)' },
  };

  const currentStyle = styleMap[type] || styleMap.other;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 10,
      fontWeight: 700,
      padding: '2.5px 7px',
      borderRadius: 5,
      background: currentStyle.bg,
      color: currentStyle.color,
      border: `1px solid ${currentStyle.border}`,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {labelMap[type] || 'Resource'}
    </span>
  );
}

export default function NoteCard({ note }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  if (note.moderation_status === 'removed') {
    return (
      <div style={{ padding: 16, borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#F87171', fontSize: '13px', textAlign: 'center' }}>
        This content was removed due to a policy violation.
      </div>
    );
  }

  // Publisher details
  const publisherName = note.uploader_name || note.uploader?.name || note.uploader_username || note.uploader?.username || 'CPA Contributor';
  const publisherUsername = note.uploader_username || note.uploader?.username || null;
  const publisherAvatar = note.uploader_avatar_url || note.uploader?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${publisherUsername || note.uploader_id || 'cpa_contributor'}`;
  const isVerified = Boolean(
    note.uploader_verified || 
    note.uploader?.verified || 
    note.uploader?.verified_contributor || 
    note.uploader?.role === 'admin' || 
    note.uploader?.account_type === 'professional'
  );

  // Counts
  const downloadsCount = note.download_count ?? note.downloads ?? 0;
  const viewsCount = note.views_count ?? note.views ?? (downloadsCount > 0 ? downloadsCount * 3 + 12 : 0);

  // Description fallback
  const displayDescription = note.description?.trim() || 
    `${note.type === 'question_paper' ? 'Previous year question paper' : 'Academic study material'} for ${note.subject_name || note.college_name || 'students'}. Download PDF and prepare for upcoming exams.`;

  return (
    <>
      <style>{`
        .ratio-note-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-md, 16px);
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          aspect-ratio: 3 / 4;
          min-height: 320px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          text-decoration: none;
        }
        .ratio-note-card:hover {
          border-color: var(--green, #00b4d8);
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0, 180, 216, 0.12);
        }
        .card-top-section {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .card-badge-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .card-sub-badge {
          font-size: 10.5px;
          color: var(--sub);
          font-weight: 600;
          background: var(--s2, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--border);
          padding: 2px 7px;
          border-radius: 5px;
        }
        .card-full-title {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.38;
          margin: 0 0 6px 0;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        .card-subject-tag {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--green, #00b4d8);
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }
        .card-desc-clamp {
          font-size: 12px;
          color: var(--sub);
          line-height: 1.45;
          margin: 0 0 10px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-bottom-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid var(--border);
          padding-top: 10px;
          margin-top: auto;
        }
        .card-publisher-row {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }
        .card-publisher-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid var(--border);
        }
        .card-publisher-name {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .card-stats-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--sub);
        }
        .card-stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
      `}</style>

      <Link href={`/notes/resource/${note.slug}`} style={{ textDecoration: 'none' }}>
        <div className="ratio-note-card">
          <div className="card-top-section">
            {/* Badges & Actions */}
            <div className="card-header-row">
              <div className="card-badge-group">
                <NoteTypeTag type={note.type} />
                {note.semester && (
                  <span className="card-sub-badge">
                    Sem {note.semester}
                  </span>
                )}
                {note.moderation_status === 'under_review' && (
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 5px', borderRadius: 4, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    REVIEW
                  </span>
                )}
              </div>
              <div onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                <CardActionMenu
                  contentId={note.id || note.slug}
                  contentType="note"
                  contentUrl={typeof window !== 'undefined' ? `${window.location.origin}/notes/resource/${note.slug}` : undefined}
                  ownerId={note.uploader_id || note.uploader?.id}
                  creatorId={note.uploader_id || note.uploader?.id}
                  creatorUsername={note.uploader_username || note.uploader?.username}
                  triggerSize={16}
                  onHide={() => setHidden(true)}
                  sourceSurface="notes_feed"
                />
              </div>
            </div>

            {/* Subject / Context Tag */}
            {(note.subject_name || note.course_name || note.custom_course_name || note.field_name) && (
              <span className="card-subject-tag">
                {note.subject_name || note.course_name || note.custom_course_name || note.field_name}
              </span>
            )}

            {/* Full Notes Title */}
            <h4 className="card-full-title" title={note.title}>
              {note.title}
            </h4>

            {/* 1.5 - 2 Line Description */}
            <p className="card-desc-clamp">
              {displayDescription}
            </p>
          </div>

          <div className="card-bottom-section">
            {/* Publisher Row */}
            <div className="card-publisher-row">
              <img 
                src={publisherAvatar} 
                alt={`${publisherName}'s avatar`} 
                className="card-publisher-avatar"
              />
              <span className="card-publisher-name">
                {publisherName}
                {isVerified && (
                  <span className="material-symbols-rounded" style={{ fontSize: 13, color: 'var(--green, #00b4d8)' }}>
                    verified
                  </span>
                )}
              </span>
            </div>

            {/* Stats Row: Download count & View count */}
            <div className="card-stats-row">
              <div className="card-stat-item">
                <span className="material-symbols-rounded" style={{ fontSize: 13.5 }}>visibility</span>
                <span>{viewsCount.toLocaleString()} views</span>
              </div>
              <div className="card-stat-item">
                <span className="material-symbols-rounded" style={{ fontSize: 13.5 }}>download</span>
                <span>{downloadsCount.toLocaleString()} dl</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
