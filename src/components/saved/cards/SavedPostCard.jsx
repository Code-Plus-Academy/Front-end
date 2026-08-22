'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, Trash2, FolderPlus, ExternalLink, Check, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SavedPostCard({
  item,
  onUnsave,
  onAddToContainer,
  selected = false,
  onToggleSelect,
  selectable = false,
  containers = [],
}) {
  const authorName = item.author?.name || item.creator_name || item.author_name || item.author_username || 'Code+ Developer';
  const authorUsername = item.author?.username || item.creator_username || item.author_username || '';
  const authorAvatar = item.author?.avatar_url || item.creator_avatar_url || item.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorUsername || 'dev')}`;
  const isVerified = Boolean(item.author?.verified || item.is_verified || item.author_verified);
  const postUrl = `/posts/${item.id}`;
  const assignedContainers = containers.filter(c => c.item_ids?.includes(item.id));
  const postImage = item.thumbnail_url || (item.files?.[0]?.storage_url) || (item.media_urls?.[0]) || null;

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: selected ? '1px solid var(--accent-purple, #9333EA)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md, 14px)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: selected ? '0 0 0 2px rgba(147, 51, 234, 0.2), 0 6px 20px rgba(0,0,0,0.25)' : 'var(--shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
        position: 'relative',
        boxSizing: 'border-box',
        gap: 12,
        height: '100%',
      }}
      className="group hover:border-purple-500/40"
    >
      <div>
        {/* Header: Author Info & Selection Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {selectable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect && onToggleSelect(item.id);
                }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: selected ? 'var(--accent-purple, #9333EA)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  color: '#fff',
                  padding: 0,
                }}
                aria-label={selected ? 'Deselect post' : 'Select post'}
              >
                {selected && <Check size={13} strokeWidth={3} />}
              </button>
            )}

            <img
              src={authorAvatar}
              alt={authorName}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            />

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {authorName}
                </span>
                {isVerified && <CheckCircle2 size={13} color="var(--green, #00b4d8)" style={{ flexShrink: 0 }} />}
              </div>
              {authorUsername && (
                <span style={{ fontSize: 11, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  @{authorUsername}
                </span>
              )}
            </div>
          </div>

          <span style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 7px',
            borderRadius: 4,
            background: 'rgba(147, 51, 234, 0.12)',
            color: 'var(--accent-purple, #9333EA)',
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
          }}>
            Community Post
          </span>
        </div>

        {/* Post Content / Body */}
        <Link href={postUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
          <p style={{
            margin: '0 0 10px',
            fontSize: 13.5,
            lineHeight: 1.48,
            color: 'var(--text)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}>
            {item.content || item.text || item.title || 'View community discussion on Code+ Academy.'}
          </p>
        </Link>

        {/* Post Image Attachment Preview if present */}
        {postImage && (
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 10,
            background: '#0a0e17',
          }}>
            <img
              src={postImage}
              alt="Attachment"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        )}

        {/* Assigned Collections (Instagram Style) */}
        {assignedContainers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, marginBottom: 8 }}>
            {assignedContainers.map(c => (
              <span
                key={c.id}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: `${c.color_token || 'var(--accent-purple)'}18`,
                  color: c.color_token || 'var(--accent-purple)',
                  border: `1px solid ${c.color_token || 'var(--accent-purple)'}35`,
                }}
              >
                💡 {c.name}
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
        fontSize: 11.5,
        color: 'var(--sub)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThumbsUp size={12} opacity={0.7} /> {item.claps_count || item.likes_count || item.upvote_count || 0}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageSquare size={12} opacity={0.7} /> {item.comments_count || item.replies_count || 0}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Add to Collection Button (Instagram Standard) */}
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
            className="hover:border-purple-400 hover:text-purple-400"
          >
            <FolderPlus size={13} />
            <span>Collection</span>
          </button>

          {/* Unsave Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnsave && onUnsave(item.id, 'post');
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
    </article>
  );
}
