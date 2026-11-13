'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isCommentsV2Enabled } from '../../api/comments';
import CommentSheet from './CommentSheet';

export default function CommentLauncher({ entityType, entityId, label = 'Comments' }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!entityId || ((entityType === 'note' || entityType === 'project') && !isCommentsV2Enabled())) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid var(--border)', borderRadius: 999,
          padding: '10px 16px', background: 'var(--surface)',
          color: 'var(--text)', fontWeight: 700, cursor: 'pointer',
        }}
      >
        <span aria-hidden="true">💬</span>
        {label}
      </button>
      <CommentSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        entityId={String(entityId)}
        entityType={entityType}
        user={user}
      />
    </>
  );
}
