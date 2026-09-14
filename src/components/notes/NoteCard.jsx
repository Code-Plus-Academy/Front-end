'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, BookOpen, Download, Eye, HelpCircle, Layers } from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return 'recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 3600000);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

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
    question_paper: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    notes: { bg: 'rgba(0, 180, 216, 0.15)', color: '#00b4d8', border: 'rgba(0, 180, 216, 0.3)' },
    book: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
    assignment: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    cheatsheet: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    video_link: { bg: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', border: 'rgba(129, 140, 248, 0.3)' },
    project_report: { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },
    lab_manual: { bg: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', border: 'rgba(14, 165, 233, 0.3)' },
    roadmap: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
    other: { bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: 'rgba(107, 114, 128, 0.3)' },
  };

  const currentStyle = styleMap[type] || styleMap.other;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 10,
      fontWeight: 800,
      padding: '2px 7px',
      borderRadius: 4,
      background: currentStyle.bg,
      color: currentStyle.color,
      border: `1px solid ${currentStyle.border}`,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      flexShrink: 0,
    }}>
      {labelMap[type] || 'Resource'}
    </span>
  );
}

function getTypeIcon(type) {
  switch (type) {
    case 'question_paper':
      return <HelpCircle size={32} opacity={0.35} />;
    case 'book':
      return <BookOpen size={32} opacity={0.35} />;
    case 'cheatsheet':
    case 'assignment':
      return <Layers size={32} opacity={0.35} />;
    default:
      return <FileText size={32} opacity={0.35} />;
  }
}

function getTypeGradients(type) {
  switch (type) {
    case 'question_paper':
      return {
        accent: '#ef4444',
        coverBg: 'linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(239,68,68,0.05) 100%)',
        border: 'rgba(239,68,68,0.25)',
      };
    case 'book':
      return {
        accent: '#a855f7',
        coverBg: 'linear-gradient(135deg, rgba(168,85,247,0.22) 0%, rgba(168,85,247,0.05) 100%)',
        border: 'rgba(168,85,247,0.25)',
      };
    case 'cheatsheet':
      return {
        accent: '#10b981',
        coverBg: 'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.05) 100%)',
        border: 'rgba(16,185,129,0.25)',
      };
    case 'assignment':
      return {
        accent: '#3b82f6',
        coverBg: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.05) 100%)',
        border: 'rgba(59,130,246,0.25)',
      };
    default:
      return {
        accent: '#00b4d8',
        coverBg: 'linear-gradient(135deg, rgba(0,180,216,0.22) 0%, rgba(0,180,216,0.05) 100%)',
        border: 'rgba(0,180,216,0.25)',
      };
  }
}

export default function NoteCard({ note, resource }) {
  const item = note || resource || {};

  if (!item || (!item.title && !item.id && !item.name)) return null;

  if (item.moderation_status === 'removed') {
    return (
      <div style={{ padding: 16, borderRadius: '14px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#F87171', fontSize: '12px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
        This content was removed due to a policy violation.
      </div>
    );
  }

  // Publisher details
  const publisherName = item.uploader_name || item.uploader?.name || item.uploader_username || item.uploader?.username || item.author || 'CPA Contributor';
  const publisherUsername = item.uploader_username || item.uploader?.username || (publisherName !== 'CPA Contributor' ? publisherName : null);
  const publisherHandle = publisherUsername || publisherName;
  const publisherAvatar = item.uploader_avatar_url || item.uploader?.avatar_url || item.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(publisherHandle || item.uploader_id || 'cpa_contributor')}`;
  const isVerified = Boolean(
    item.uploader_verified || 
    item.uploader?.verified || 
    item.uploader?.verified_contributor || 
    item.uploader?.role === 'admin' || 
    item.uploader?.account_type === 'professional'
  );

  // Title, Subject & Description
  const displayTitle = item.title || item.name || item.subject_name || 'Academic Study Material';
  const subjectTag = item.subject_name || item.course_name || item.custom_course_name || item.field_name || '';
  const collegeTag = item.college_name || item.university_name || '';
  const displayDescription = (typeof item.description === 'string' ? item.description.trim() : '') ||
    (typeof item.summary === 'string' ? item.summary.trim() : '') || (
      item.type === 'question_paper' 
        ? `Previous year examination question paper for ${subjectTag || 'students'}.` 
        : `Study notes and academic material for ${subjectTag || 'students'}.`
    );

  // Date & Counts
  const dateFormatted = formatDate(item.created_at || item.published_at);
  const downloadsCount = typeof item.download_count === 'number' ? item.download_count : (typeof item.downloads === 'number' ? item.downloads : 0);
  const viewsCount = typeof item.views_count === 'number' ? item.views_count : (typeof item.views === 'number' ? item.views : (downloadsCount > 0 ? downloadsCount * 3 + 12 : 0));

  const resourceUrl = item.slug ? `/notes/resource/${item.slug}` : (item.id ? `/notes/resource/${item.id}` : '#');
  const gradients = getTypeGradients(item.type);

  const isImageFile = Boolean(
    typeof item.file_url === 'string' && (
      item.file_url.match(/\.(png|jpe?g|webp|gif)$/i) ||
      ['image', 'jpg', 'png', 'jpeg', 'webp'].includes((item.file_type || '').toLowerCase())
    )
  );
  const defaultThumbnail = '/notes-default-thumbnail.jpg';
  const thumbnailSrc = item.thumbnail_url || item.thumbnail || item.preview_url || item.media_snapshot_url || (isImageFile ? item.file_url : null) || defaultThumbnail;

  return (
    <Link
      href={resourceUrl}
      style={{
        textDecoration: 'none',
        display: 'block',
        color: 'inherit',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── DESKTOP VIEW: 3:4 Portrait Document Card ─────────────────────── */}
      <div
        className="note-card-desktop group"
        style={{
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          borderRadius: '16px',
          backgroundColor: 'var(--card-bg, var(--surface, #111827))',
          border: '1px solid var(--border-color, var(--border, rgba(255, 255, 255, 0.08)))',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          boxSizing: 'border-box',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {/* Top 3:4 Cover Preview Section */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/10',
            background: 'var(--surface, #111827)',
            borderBottom: `1px solid ${gradients.border}`,
            padding: '12px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Background Thumbnail Image with Fallback */}
          <img
            src={thumbnailSrc}
            alt={displayTitle}
            onError={(e) => {
              if (e.currentTarget.src !== defaultThumbnail && !e.currentTarget.src.includes('notes-default-thumbnail.jpg')) {
                e.currentTarget.src = defaultThumbnail;
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.35s ease',
            }}
            className="group-hover:scale-105"
            loading="lazy"
          />

          {/* Badges Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', zIndex: 1 }}>
            <NoteTypeTag type={item.type} />
            {item.semester && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  color: '#fff',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                SEM {item.semester}
              </span>
            )}
          </div>

          {/* Subject tag pill */}
          {subjectTag && (
            <div style={{ zIndex: 1, marginTop: 'auto' }}>
              <span
                style={{
                  display: 'inline-block',
                  maxWidth: '90%',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${gradients.accent}60`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={subjectTag}
              >
                {subjectTag}
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'space-between',
            gap: '8px',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--text, #f9fafb)',
                lineHeight: 1.35,
                fontFamily: 'var(--font-display, inherit)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                transition: 'color 0.2s',
              }}
              className="group-hover:text-cyan-400"
              title={displayTitle}
            >
              {displayTitle}
            </h3>

            {collegeTag && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '11px',
                  color: 'var(--sub, #9ca3af)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={collegeTag}
              >
                {collegeTag}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              paddingTop: '8px',
              borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <img
                  src={publisherAvatar}
                  alt={publisherName}
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(publisherHandle || 'contributor')}`;
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                    flexShrink: 0,
                    backgroundColor: 'var(--surface)',
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text, #f9fafb)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {publisherName}
                </span>
                {isVerified && (
                  <CheckCircle2
                    size={11}
                    color="var(--green, #00b4d8)"
                    style={{ flexShrink: 0 }}
                  />
                )}
              </div>

              <span style={{ fontSize: '10px', color: 'var(--sub, #9ca3af)', flexShrink: 0 }}>
                {dateFormatted}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--sub, #9ca3af)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Eye size={12} opacity={0.7} />
                <span>{viewsCount > 999 ? `${(viewsCount/1000).toFixed(1)}k` : viewsCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Download size={12} opacity={0.7} />
                <span>{downloadsCount > 999 ? `${(downloadsCount/1000).toFixed(1)}k` : downloadsCount} dl</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE VIEW: Exact Full-Width Horizontal Banner Row ─────────── */}
      <div
        className="note-card-mobile group"
        style={{
          flexDirection: 'column',
          gap: '8px',
          padding: '1rem 1.15rem',
          borderRadius: '14px',
          backgroundColor: 'var(--card-bg, var(--surface, #111827))',
          border: '1px solid var(--border-color, var(--border, rgba(255, 255, 255, 0.1)))',
          margin: '0 0 10px 0',
          width: '100%',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
          boxSizing: 'border-box',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {/* Mobile Preview Banner */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '4px',
            backgroundColor: 'var(--surface, #111827)',
          }}
        >
          <img
            src={thumbnailSrc}
            alt={displayTitle}
            onError={(e) => {
              if (e.currentTarget.src !== defaultThumbnail && !e.currentTarget.src.includes('notes-default-thumbnail.jpg')) {
                e.currentTarget.src = defaultThumbnail;
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        </div>

        {/* Badges & Subject Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', maxWidth: '100%' }}>
          <NoteTypeTag type={item.type} />
          {item.semester && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2.5px 8px',
                borderRadius: '5px',
                background: 'var(--s2, rgba(255, 255, 255, 0.05))',
                color: 'var(--sub, #9ca3af)',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                flexShrink: 0,
              }}
            >
              Sem {item.semester}
            </span>
          )}
          {subjectTag && (
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--green, #00b4d8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              title={subjectTag}
            >
              {subjectTag}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '2px 0 0',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text, #f9fafb)',
            lineHeight: 1.38,
            fontFamily: 'var(--font-display, inherit)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}
          title={displayTitle}
        >
          {displayTitle}
        </h3>

        {/* Description */}
        {displayDescription && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '12px',
              color: 'var(--sub, #9ca3af)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
            }}
          >
            {displayDescription}
          </p>
        )}

        {/* Publisher Profile & Metadata Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '11.5px',
            color: 'var(--sub, #9ca3af)',
            flexWrap: 'wrap',
            marginTop: '4px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
            <img
              src={publisherAvatar}
              alt={publisherName}
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(publisherHandle || 'contributor')}`;
              }}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                flexShrink: 0,
                backgroundColor: 'var(--surface)',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--text, #f9fafb)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {publisherName}
              </span>
              {isVerified && (
                <CheckCircle2
                  size={13}
                  color="var(--green, #00b4d8)"
                  style={{ flexShrink: 0 }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <span>{dateFormatted}</span>
            {viewsCount > 0 && (
              <>
                <span>•</span>
                <span>{viewsCount.toLocaleString()} views</span>
              </>
            )}
            {downloadsCount > 0 && (
              <>
                <span>•</span>
                <span>{downloadsCount.toLocaleString()} dl</span>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .note-card-desktop {
            display: flex !important;
          }
          .note-card-mobile {
            display: none !important;
          }
          .note-card-desktop:hover {
            transform: translateY(-4px);
            border-color: rgba(0, 180, 216, 0.4) !important;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25) !important;
          }
        }
        @media (max-width: 768px) {
          .note-card-desktop {
            display: none !important;
          }
          .note-card-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </Link>
  );
}

export { default as ResourceCard } from './ResourceCard';
