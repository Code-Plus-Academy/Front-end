'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { NoteTypeTag } from './NoteCard';

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

export default function ResourceCard({ resource, note }) {
  const item = resource || note || {};

  if (!item || (!item.title && !item.id && !item.name)) return null;

  // Publisher details
  const publisherName = item.uploader_name || item.uploader?.name || item.uploader_username || item.uploader?.username || item.author || 'CPA Contributor';
  const publisherUsername = item.uploader_username || item.uploader?.username || (publisherName !== 'CPA Contributor' ? publisherName : null);
  const publisherHandle = publisherUsername || publisherName;
  const publisherAvatar = item.uploader_avatar_url || item.uploader?.avatar_url || item.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(publisherHandle || item.uploader_id || 'cpa_contributor')}`;
  const isVerified = Boolean(
    item.uploader_verified || 
    item.uploader?.verified || 
    item.uploader?.verified_contributor || 
    item.uploader?.role === 'admin'
  );

  // Title, Subject & Description
  const displayTitle = item.title || item.name || item.subject_name || 'Academic Study Material';
  const subjectTag = item.subject_name || item.course_name || item.custom_course_name || item.field_name || '';
  const displayDescription = item.description?.trim() || item.summary?.trim() || (
    item.type === 'question_paper' 
      ? `Previous year examination question paper for ${subjectTag || 'students'}.` 
      : `Study notes and academic material for ${subjectTag || 'students'}.`
  );

  // Date & Counts
  const dateFormatted = formatDate(item.created_at || item.published_at);
  const downloadsCount = item.download_count ?? item.downloads ?? 0;
  const viewsCount = item.views_count ?? item.views ?? (downloadsCount > 0 ? downloadsCount * 3 + 12 : 0);

  const resourceUrl = item.slug ? `/notes/resource/${item.slug}` : (item.id ? `/notes/resource/${item.id}` : '#');

  return (
    <Link
      href={resourceUrl}
      style={{
        textDecoration: 'none',
        display: 'block',
        color: 'inherit',
        width: '100%',
        margin: '0 0 12px 0',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="resource-card group"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '1.1rem 1.25rem',
          borderRadius: '14px',
          backgroundColor: 'var(--card-bg, var(--surface, #111827))',
          border: '1px solid var(--border-color, var(--border, rgba(255, 255, 255, 0.1)))',
          margin: 0,
          width: '100%',
          maxWidth: '100%',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
          boxSizing: 'border-box',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
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
            fontSize: '15.5px',
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
            transition: 'color 0.2s',
          }}
          className="group-hover:text-cyan-400"
          title={displayTitle}
        >
          {displayTitle}
        </h3>

        {/* Description */}
        {displayDescription && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '12.5px',
              color: 'var(--sub, #9ca3af)',
              lineHeight: 1.48,
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
          {/* Publisher: Avatar + Name + Verified Badge */}
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
              {publisherUsername && publisherUsername !== publisherName && (
                <span style={{ fontSize: '11px', color: 'var(--sub, #9ca3af)', opacity: 0.8 }}>
                  @{publisherUsername}
                </span>
              )}
            </div>
          </div>

          {/* Date & Views/Downloads */}
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
    </Link>
  );
}
