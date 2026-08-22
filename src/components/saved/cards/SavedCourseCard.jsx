'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Trash2, FolderPlus, Layers, Check, Trophy } from 'lucide-react';

export default function SavedCourseCard({
  item,
  onUnsave,
  onAddToContainer,
  selected = false,
  onToggleSelect,
  selectable = false,
  containers = [],
}) {
  const courseUrl = `/courses/${item.slug || item.id}`;
  const thumbnail = item.thumbnail_url || item.thumbnail || (item.files?.[0]?.storage_url) || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600';
  const instructor = item.instructor_name || item.creator_name || item.author_name || 'Code+ Academy';
  const progress = item.progress_percentage ?? item.progress ?? 0;
  const modulesCount = item.modules_count || item.lessons_count || 12;
  const assignedContainers = containers.filter(c => c.item_ids?.includes(item.id));

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: selected ? '1px solid var(--primary, #3B7CFF)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md, 14px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: selected ? '0 0 0 2px rgba(59, 124, 255, 0.2), 0 6px 20px rgba(0,0,0,0.25)' : 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
        position: 'relative',
        boxSizing: 'border-box',
        height: '100%',
      }}
      className="group hover:border-blue-500/40"
    >
      {/* Cover Image & Modules Badge */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#0a0e17' }}>
        <img
          src={thumbnail}
          alt={item.title || 'Course'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          className="group-hover:scale-105"
          loading="lazy"
        />

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
              width: 20,
              height: 20,
              borderRadius: 5,
              background: selected ? 'var(--primary, #3B7CFF)' : 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              color: '#fff',
              padding: 0,
            }}
            aria-label={selected ? 'Deselect course' : 'Select course'}
          >
            {selected && <Check size={13} strokeWidth={3} />}
          </button>
        )}

        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(59, 124, 255, 0.85)',
          color: '#fff',
          padding: '2px 7px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          textTransform: 'uppercase',
        }}>
          <Layers size={11} />
          <span>{modulesCount} Modules</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 10 }}>
        <div>
          <Link href={courseUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
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
            }} className="group-hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
          </Link>

          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--sub)' }}>
            {instructor}
          </p>

          {/* Progress Bar */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--sub)', marginBottom: 3, fontWeight: 600 }}>
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #3B7CFF, #34C77B)', borderRadius: 99 }} />
            </div>
          </div>

          {/* Assigned Envelopes (Envelope Standard) */}
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
                  ✉️ {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          fontSize: 11.5,
          color: 'var(--sub)',
        }}>
          <Link href={courseUrl} style={{ color: 'var(--primary, #3B7CFF)', textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
            Continue ➔
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToContainer && onAddToContainer(item);
              }}
              title="Add to Course Envelope"
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
              className="hover:border-blue-400 hover:text-blue-400"
            >
              <FolderPlus size={13} />
              <span>Envelope</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnsave && onUnsave(item.id, 'course');
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
