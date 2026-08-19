'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Bookmark, Link as LinkIcon, EyeOff, Flag, Pencil, Trash2, Loader2 } from 'lucide-react';
import ReportModal from './ReportModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

let toast = { success: () => {}, error: () => {} };
try {
  toast = require('react-hot-toast').default;
} catch {}

/**
 * Reusable Centralized Content Action Menu
 * 
 * STRICT Authorization Rules:
 * - If currentUserId === contentAuthorId (or admin):
 *     -> Render "Edit" button
 *     -> Render "Delete" button
 *     -> DO NOT render "Report" button
 * - If currentUserId !== contentAuthorId:
 *     -> DO NOT render "Edit" button
 *     -> DO NOT render "Delete" button
 *     -> Render "Report" button
 */
const ContentActionMenu = ({
  contentAuthorId,
  contentType = 'post',
  contentId,
  title,
  contentUrl,
  editHref,
  creatorUsername,
  onEdit,
  onDelete,
  onReport,
  onSave,
  isSaved,
  onHide,
  triggerSize = 20,
  triggerIcon = null,
  triggerClassName = '',
  triggerStyle = {},
  sourceSurface = 'web',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);

  const auth = useAuth();
  const authUser = auth?.user || null;

  const currentUserId = authUser?.id || authUser?.user_id;
  const currentUsername = authUser?.username;
  const isAdmin = authUser?.role === 'admin';

  const authorIdStr = contentAuthorId ? String(contentAuthorId).trim() : '';
  const currentUserIdStr = currentUserId ? String(currentUserId).trim() : '';
  const authorUsernameStr = creatorUsername ? String(creatorUsername).trim().toLowerCase() : '';
  const currentUsernameStr = currentUsername ? String(currentUsername).trim().toLowerCase() : '';

  // Strict ownership check
  const isOwner = Boolean(
    authUser && (
      (authorIdStr && currentUserIdStr && currentUserIdStr === authorIdStr) ||
      (authorUsernameStr && currentUsernameStr && currentUsernameStr === authorUsernameStr) ||
      isAdmin
    )
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyLink = () => {
    let url = contentUrl;
    if (!url && typeof window !== 'undefined') {
      const typePlural = contentType === 'note' ? 'notes' : (contentType === 'short' ? 'shorts' : (contentType === 'article' ? 'articles' : (contentType === 'video' ? 'videos' : 'posts')));
      url = `${window.location.origin}/${typePlural}/${contentId}`;
    }
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => {});
    }
    setIsOpen(false);
  };

  const handleSave = () => {
    if (onSave) onSave();
    setIsOpen(false);
  };

  const handleHide = () => {
    if (onHide) onHide();
    setIsOpen(false);
  };

  const handleEditClick = () => {
    setIsOpen(false);
    if (onEdit) {
      onEdit();
    } else {
      let targetPath = editHref;
      if (!targetPath) {
        if (contentType === 'note' || contentType === 'resource') {
          targetPath = `/notes/${contentId}/edit`;
        } else if (contentType === 'video' || contentType === 'short') {
          targetPath = `/creator/dashboard?edit=${contentId}`;
        } else if (contentType === 'article') {
          targetPath = `/articles/${contentId}/edit`;
        } else {
          targetPath = `/posts/${contentId}/edit`;
        }
      }
      if (typeof window !== 'undefined' && targetPath) {
        window.location.href = targetPath;
      }
    }
  };

  const handleDeleteClick = () => {
    setIsOpen(false);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(contentId);
      } else {
        let endpoint = `/posts/${contentId}`;
        if (contentType === 'note' || contentType === 'resource') endpoint = `/notes/${contentId}`;
        else if (contentType === 'video' || contentType === 'short') endpoint = `/videos/${contentId}`;
        else if (contentType === 'article') endpoint = `/articles/${contentId}`;

        await api.delete(endpoint);
        toast.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} deleted successfully`);
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('[ContentActionMenu.executeDelete]', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to delete content';
      toast.error(typeof msg === 'string' ? msg : 'Unauthorized: You do not own this content.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReportClick = () => {
    setIsOpen(false);
    if (onReport) {
      onReport();
    } else {
      setShowReport(true);
    }
  };

  const menuItemStyle = {
    padding: '11px 16px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text, #191919)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    fontFamily: 'var(--font-body, -apple-system, sans-serif)'
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-flex' }}
      ref={menuRef}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="Content options"
        aria-expanded={isOpen}
        className={triggerClassName}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          color: 'var(--sub, #666)',
          ...triggerStyle
        }}
      >
        {triggerIcon || <MoreHorizontal size={triggerSize} />}
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            [align === 'left' ? 'left' : 'right']: 0,
            zIndex: 9999,
            minWidth: '220px',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* ================= OWNER ACTIONS ================= */}
          {isOwner ? (
            <>
              <button
                onClick={handleEditClick}
                style={{ ...menuItemStyle, color: 'var(--green, #10b981)', fontWeight: 600 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Pencil size={18} color="var(--green, #10b981)" />
                <span>Edit {contentType.charAt(0).toUpperCase() + contentType.slice(1)}</span>
              </button>

              <button
                onClick={handleDeleteClick}
                style={{ ...menuItemStyle, color: '#ef4444', fontWeight: 600 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Trash2 size={18} color="#ef4444" />
                <span>Delete {contentType.charAt(0).toUpperCase() + contentType.slice(1)}</span>
              </button>
            </>
          ) : (
            /* ================= NON-OWNER ACTIONS ================= */
            <>
              {onSave && (
                <button
                  onClick={handleSave}
                  style={menuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              )}

              {onHide && (
                <button
                  onClick={handleHide}
                  style={menuItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <EyeOff size={18} />
                  <span>Not interested</span>
                </button>
              )}
            </>
          )}

          {/* Copy link is available for everyone */}
          <button
            onClick={handleCopyLink}
            style={menuItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <LinkIcon size={18} />
            <span>Copy link</span>
          </button>

          {/* ================= STRICT REPORT GUARD: NON-OWNER ONLY ================= */}
          {!isOwner && (
            <>
              <div style={{ height: 1, background: 'var(--border, #eaeaea)', margin: '4px 0' }} />
              <button
                onClick={handleReportClick}
                style={{
                  ...menuItemStyle,
                  color: '#d93025',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(217,48,37,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Flag size={18} color="#d93025" />
                <span>Report {contentType.charAt(0).toUpperCase() + contentType.slice(1)}</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && isOwner && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--surface, #1e2430)',
              color: 'var(--text, #fff)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 700 }}>
              Delete {contentType.charAt(0).toUpperCase() + contentType.slice(1)}?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--sub, #94a3b8)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this {contentType}? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'var(--s2, rgba(255,255,255,0.08))',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  color: 'var(--text, #fff)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && !isOwner && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          contentId={contentId}
          contentType={contentType}
          sourceSurface={sourceSurface}
          ownerId={authorIdStr}
          creatorUsername={creatorUsername}
        />
      )}
    </div>
  );
};

export default ContentActionMenu;
