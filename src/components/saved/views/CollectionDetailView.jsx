'use client';

import React, { useState } from 'react';
import { ArrowLeft, Share2, Trash2, Globe, Lock, Plus, Folder, Sparkles, Check, Download } from 'lucide-react';
import SavedNoteCard from '../cards/SavedNoteCard';
import SavedPostCard from '../cards/SavedPostCard';
import SavedSnippetCard from '../cards/SavedSnippetCard';
import SavedArticleCard from '../cards/SavedArticleCard';
import SavedCourseCard from '../cards/SavedCourseCard';
import SavedVideoCard from '../cards/SavedVideoCard';

export default function CollectionDetailView({
  collection,
  items = [],
  onBack,
  onUnsaveItem,
  onAddToContainer,
  onDeleteCollection,
  onPlayVideo,
}) {
  const collectionItems = items.filter(i => collection.item_ids?.includes(i.id)) || [];
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectable, setIsSelectable] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchRemove = () => {
    selectedIds.forEach(id => {
      onUnsaveItem && onUnsaveItem(id, 'unknown');
    });
    setSelectedIds([]);
    setIsSelectable(false);
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'var(--sub)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 16,
          padding: 0,
        }}
        className="hover:text-cyan-400"
      >
        <ArrowLeft size={16} />
        <span>Back to All Saved</span>
      </button>

      {/* ── Collection Header (Instagram Style) ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md, 16px)',
        padding: '24px',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div style={{ minWidth: '260px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
              background: `${collection.color_token || 'var(--primary)'}20`,
              color: collection.color_token || 'var(--primary)',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {collection.container_type?.replace('_', ' ') || 'Collection'}
            </span>

            <span style={{ fontSize: 11.5, color: 'var(--sub)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {collection.is_public ? <Globe size={12} /> : <Lock size={12} />}
              <span>{collection.is_public ? 'Public' : 'Private'}</span>
            </span>

            <span style={{ fontSize: 11.5, color: 'var(--dim)' }}>•</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              {collectionItems.length} {collectionItems.length === 1 ? 'Item' : 'Items'} Enclosed
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 'clamp(20px, 3.5vw, 28px)',
            fontWeight: 800,
            color: 'var(--text)',
            margin: '0 0 6px',
            lineHeight: 1.25,
          }}>
            {collection.name}
          </h1>

          {collection.description && (
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--sub)', lineHeight: 1.5, maxWidth: 640 }}>
              {collection.description}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setIsSelectable(!isSelectable);
              setSelectedIds([]);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: isSelectable ? 'var(--primary, #3B7CFF)' : 'var(--s2)',
              color: isSelectable ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isSelectable ? 'Done Selecting' : 'Select Items'}
          </button>

          <button
            type="button"
            onClick={handleShare}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--s2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Share2 size={14} />
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteCollection && onDeleteCollection(collection.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--s2)',
              border: '1px solid var(--border)',
              color: 'var(--danger)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Delete Collection"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* ── Selection Action Bar (When in Select Mode) ── */}
      {isSelectable && selectedIds.length > 0 && (
        <div style={{
          position: 'sticky',
          top: 16,
          zIndex: 100,
          background: 'var(--surface)',
          border: '1px solid var(--primary, #3B7CFF)',
          borderRadius: 12,
          padding: '10px 18px',
          marginBottom: 20,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
          </span>
          <button
            type="button"
            onClick={handleBatchRemove}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Trash2 size={14} />
            <span>Remove Selected</span>
          </button>
        </div>
      )}

      {/* ── Items Grid (Instagram Style) ── */}
      {collectionItems.length === 0 ? (
        <div style={{
          padding: '56px 24px',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 16,
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
            This collection is empty
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--sub)', margin: '0 0 16px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Add notes, articles, posts, snippets, or courses to this collection to organize your learning.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {collectionItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            if (item.item_kind === 'note' || item.type === 'notes' || item.type === 'question_paper') {
              return (
                <SavedNoteCard
                  key={item.id}
                  item={item}
                  selectable={isSelectable}
                  selected={isSelected}
                  onToggleSelect={toggleSelect}
                  onUnsave={onUnsaveItem}
                  onAddToContainer={onAddToContainer}
                />
              );
            }
            if (item.item_kind === 'video' || item.type === 'video' || item.type === 'short') {
              return (
                <SavedVideoCard
                  key={item.id}
                  item={item}
                  selectable={isSelectable}
                  selected={isSelected}
                  onToggleSelect={toggleSelect}
                  onUnsave={onUnsaveItem}
                  onAddToContainer={onAddToContainer}
                  onPlayVideo={onPlayVideo}
                />
              );
            }
            if (item.item_kind === 'snippet' || item.type === 'snippet') {
              return (
                <SavedSnippetCard
                  key={item.id}
                  item={item}
                  selectable={isSelectable}
                  selected={isSelected}
                  onToggleSelect={toggleSelect}
                  onUnsave={onUnsaveItem}
                  onAddToContainer={onAddToContainer}
                />
              );
            }
            if (item.item_kind === 'course' || item.type === 'course') {
              return (
                <SavedCourseCard
                  key={item.id}
                  item={item}
                  selectable={isSelectable}
                  selected={isSelected}
                  onToggleSelect={toggleSelect}
                  onUnsave={onUnsaveItem}
                  onAddToContainer={onAddToContainer}
                />
              );
            }
            if (item.item_kind === 'article' || item.type === 'article') {
              return (
                <SavedArticleCard
                  key={item.id}
                  item={item}
                  selectable={isSelectable}
                  selected={isSelected}
                  onToggleSelect={toggleSelect}
                  onUnsave={onUnsaveItem}
                  onAddToContainer={onAddToContainer}
                />
              );
            }
            return (
              <SavedPostCard
                key={item.id}
                item={item}
                selectable={isSelectable}
                selected={isSelected}
                onToggleSelect={toggleSelect}
                onUnsave={onUnsaveItem}
                onAddToContainer={onAddToContainer}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
