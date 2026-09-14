'use client';

import React from 'react';
import ContentActionMenu from '../ui/ContentActionMenu';

/**
 * ResourceActionMenu - Deprecated wrapper, delegates directly to centralized ContentActionMenu.
 */
export default function ResourceActionMenu({ noteId, editHref, ownerId, creatorUsername, contentUrl, onDelete }) {
  return (
    <ContentActionMenu
      contentId={noteId}
      contentType="resource"
      contentAuthorId={ownerId}
      creatorUsername={creatorUsername}
      contentUrl={contentUrl}
      editHref={editHref}
      onDelete={onDelete}
      triggerSize={20}
      sourceSurface="notes_arena"
    />
  );
}
