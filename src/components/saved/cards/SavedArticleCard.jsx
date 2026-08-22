'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Trash2, FolderPlus, ExternalLink, Clock, Check, Sparkles } from 'lucide-react';

export default function SavedArticleCard({
  item,
  onUnsave,
  onAddToContainer,
  selected = false,
  onToggleSelect,
  selectable = false,
  containers = [],
}) {
  const articleUrl = `/articles/${item.slug || item.id}`;
  const thumbnail = item.thumbnail_url || item.thumbnail || (item.files?.[0]?.storage_url) || null;
  const authorName = item.author?.name || item.creator_name || item.author_name || 'Code+ Author';
  const assignedContainers = containers.filter(c => c.item_ids?.includes(item.id));
  const readTime = item.read_time || item.read_time_minutes || Math.max(2, Math.ceil((item.description?.length || 500) / 250));

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
      {thumbnail && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#0a0e17' }}>
          <img
            src={thumbnail}
            alt={item.title || 'Article'}
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
              aria-label={selected ? 'Deselect article' : 'Select article'}
            >
              {selected && <Check size={13} strokeWidth={3} />}
            </button>
          )}

          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            padding: '2px 7px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Clock size={10} />
            <span>{readTime} min read</span>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 10 }}>
        <div>
          {!thumbnail && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(0, 180, 216, 0.12)',
                color: 'var(--green, #00b4d8)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Article
              </span>
              <span style={{ fontSize: 11, color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={11} /> {readTime}m read
              </span>
            </div>
          )}

          <Link href={articleUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
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
            }} className="group-hover:text-cyan-400 transition-colors">
              {item.title}
            </h3>
          </Link>

          {item.description && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--sub)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description}
            </p>
          )}

          {/* Assigned Containers */}
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
                    background: `${c.color_token || 'var(--green)'}18`,
                    color: c.color_token || 'var(--green)',
                    border: `1px solid ${c.color_token || 'var(--green)'}35`,
                  }}
                >
                  📰 {c.name}
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
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {authorName}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToContainer && onAddToContainer(item);
              }}
              title="Add to Collection"
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
              <span>Collection</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnsave && onUnsave(item.id, 'article');
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
