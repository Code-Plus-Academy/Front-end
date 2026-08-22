'use client';

import React from 'react';
import Link from 'next/link';
import { Download, Eye, ThumbsUp, Trash2, FolderPlus, ExternalLink, GraduationCap, Check } from 'lucide-react';
import { NoteTypeTag } from '../../notes/NoteCard';

export default function SavedNoteCard({ 
  item, 
  onUnsave, 
  onAddToContainer,
  selected = false,
  onToggleSelect,
  selectable = false,
  containers = [] 
}) {
  const isImageFile = Boolean(
    item.file_url && (
      item.file_url.match(/\.(png|jpe?g|webp|gif)$/i) ||
      ['image', 'jpg', 'png', 'jpeg', 'webp'].includes((item.file_type || '').toLowerCase())
    )
  );
  const defaultThumbnail = '/notes-default-thumbnail.jpg';
  const thumbnailSrc = item.thumbnail_url || item.thumbnail || item.preview_url || (isImageFile ? item.file_url : null) || defaultThumbnail;
  const resourceUrl = item.slug ? `/notes/resource/${item.slug}` : (item.id ? `/notes/resource/${item.id}` : '#');
  const assignedContainers = containers.filter(c => c.item_ids?.includes(item.id));

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: selected ? '1px solid var(--green, #00b4d8)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md, 14px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: selected ? '0 0 0 2px rgba(0, 180, 216, 0.2), 0 6px 20px rgba(0,0,0,0.25)' : 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
        position: 'relative',
        boxSizing: 'border-box',
        height: '100%',
      }}
      className="group hover:border-cyan-500/40"
    >
      {/* Top Preview Image & Badges */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden', background: '#ffffff' }}>
        <img
          src={thumbnailSrc}
          alt={item.title || 'Study Material'}
          onError={(e) => {
            if (e.currentTarget.src !== defaultThumbnail && !e.currentTarget.src.includes('notes-default-thumbnail.jpg')) {
              e.currentTarget.src = defaultThumbnail;
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
          className="group-hover:scale-105"
          loading="lazy"
        />

        {/* Selection Checkbox (When selectable mode is on) */}
        {selectable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect(item.id);
            }}
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 22,
              height: 22,
              borderRadius: 6,
              background: selected ? 'var(--green, #00b4d8)' : 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              color: '#000',
              padding: 0,
            }}
            aria-label={selected ? 'Deselect item' : 'Select item'}
          >
            {selected && <Check size={14} strokeWidth={3} />}
          </button>
        )}

        {/* Top Right Type & Semester Badge */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          zIndex: 1,
        }}>
          <NoteTypeTag type={item.type || item.note_type} />
          {item.semester && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#fff',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              SEM {item.semester}
            </span>
          )}
        </div>
      </div>

      {/* Body Information */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 10 }}>
        <div>
          {/* Subject & College breadcrumb tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--green, #00b4d8)', fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <GraduationCap size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.subject_name || item.course_name || item.college_name || 'Academic Material'}
            </span>
          </div>

          <Link href={resourceUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.35,
              margin: '0 0 4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }} className="group-hover:text-cyan-400 transition-colors">
              {item.title}
            </h3>
          </Link>

          {item.college_name && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.college_name}
            </p>
          )}

          {/* Assigned Container Tags (Instagram/YT Style) */}
          {assignedContainers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {assignedContainers.map(c => (
                <span
                  key={c.id}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${c.color_token || 'var(--primary)'}18`,
                    color: c.color_token || 'var(--primary)',
                    border: `1px solid ${c.color_token || 'var(--primary)'}35`,
                  }}
                >
                  📁 {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions & Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          marginTop: 6,
          fontSize: 11.5,
          color: 'var(--sub)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Download size={12} opacity={0.7} /> {item.downloads || item.download_count || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <ThumbsUp size={12} opacity={0.7} /> {item.upvote_count || 0}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Add to Collection / Pack Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToContainer && onAddToContainer(item);
              }}
              title="Add to Study Pack or Collection"
              style={{
                background: 'var(--s2, rgba(255,255,255,0.05))',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              className="hover:border-cyan-400 hover:text-cyan-400"
            >
              <FolderPlus size={13} />
              <span>Organize</span>
            </button>

            {/* Unsave Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnsave && onUnsave(item.id, 'note');
              }}
              title="Remove from saved"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sub)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              className="hover:text-red-400"
              aria-label="Remove bookmark"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
