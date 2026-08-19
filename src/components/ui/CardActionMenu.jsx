import React from 'react';
import ContentActionMenu from './ContentActionMenu';

/**
 * CardActionMenu - Deprecated wrapper, delegates directly to centralized ContentActionMenu.
 */
const CardActionMenu = ({
  contentId,
  contentType = 'post',
  contentUrl,
  ownerId,
  creatorId,
  creatorUsername,
  onSave,
  isSaved,
  onHide,
  onReport,
  onEdit,
  onDelete,
  triggerSize = 20,
  sourceSurface = 'web',
  align = 'right'
}) => {
  return (
    <ContentActionMenu
      contentId={contentId}
      contentType={contentType}
      contentAuthorId={ownerId || creatorId}
      creatorUsername={creatorUsername}
      contentUrl={contentUrl}
      onSave={onSave}
      isSaved={isSaved}
      onHide={onHide}
      onReport={onReport}
      onEdit={onEdit}
      onDelete={onDelete}
      triggerSize={triggerSize}
      sourceSurface={sourceSurface}
      align={align}
    />
  );
};

export default CardActionMenu;
