'use client';

import React from 'react';
import { FolderPlus, Trash2, X, CheckSquare } from 'lucide-react';

export default function SavedBatchActionBar({
  selectedCount = 0,
  onBatchAddToContainer,
  onBatchDelete,
  onDeselectAll,
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(20px + max(16px, env(safe-area-inset-bottom)))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        background: 'var(--surface)',
        border: '1px solid var(--primary, #3B7CFF)',
        borderRadius: 30,
        padding: '8px 18px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.6), 0 0 16px rgba(59, 124, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxSizing: 'border-box',
        maxWidth: 'calc(100vw - 32px)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckSquare size={16} color="var(--primary, #3B7CFF)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {selectedCount} Selected
        </span>
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--border)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onBatchAddToContainer}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: 'var(--primary, #3B7CFF)',
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
          <FolderPlus size={14} />
          <span>Add to Container</span>
        </button>

        <button
          type="button"
          onClick={onBatchDelete}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger, #EF4444)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Trash2 size={14} />
          <span>Remove</span>
        </button>

        <button
          type="button"
          onClick={onDeselectAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sub)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Deselect all"
          aria-label="Deselect all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
