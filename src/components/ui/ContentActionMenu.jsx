'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Bookmark, Link as LinkIcon, EyeOff, Flag, Pencil, Trash2, Send, Loader2 } from 'lucide-react';
import ReportModal from './ReportModal';
import ShareSheet from './ShareSheet';
import { useAuth } from '../../context/AuthContext';
import { useSaveToContainer } from '../../context/SaveToContainerContext';
import api from '../../api/axios';

let toast = { success: () => {}, error: () => {} };
try {
  toast = require('react-hot-toast').default;
} catch {}

/**
 * Reusable Centralized Content Action Menu
 * 
 * STRICT Authorization Rules:
 * - isOwner is determined strictly by String(currentUserId) === String(contentAuthorId).
 * 
 * If isOwner === true:
 *   -> Render "Edit"
 *   -> Render "Delete"
 *   -> Render "Save"
 *   -> Render "Share"
 *   -> Render "Copy link"
 *   -> DO NOT render "Report"
 * 
 * If isOwner === false:
 *   -> DO NOT render "Edit" or "Delete"
 *   -> Render "Report"
 *   -> Render "Save"
 *   -> Render "Share"
 *   -> Render "Copy link"
 *   -> Render "Not interested" (if onHide provided)
 */
const ContentActionMenu = ({
  contentAuthorId,
  contentType = 'post',
  contentId,
  title = '',
  contentUrl,
  editHref,
  creatorUsername,
  onEdit,
  onDelete,
  onReport,
  onSave,
  isSaved = false,
  onShare,
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
  const [showShare, setShowShare] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { openSaveToContainer } = useSaveToContainer();
  const [localSaved, setLocalSaved] = useState(isSaved);
  const menuRef = useRef(null);

  const auth = useAuth();
  const authUser = auth?.user || null;
  const currentUserId = authUser?.id || authUser?.user_id;

  // Strict String-cast ID comparison to avoid type mismatch
  const isOwner = Boolean(
    currentUserId &&
    contentAuthorId &&
    String(currentUserId).trim() === String(contentAuthorId).trim()
  );

  useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);

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

  const getCanonicalUrl = () => {
    if (contentUrl) return contentUrl;
    if (typeof window !== 'undefined') {
      const typePlural = contentType === 'note' || contentType === 'resource' 
        ? 'notes' 
        : (contentType === 'short' 
            ? 'shorts' 
            : (contentType === 'article' 
                ? 'articles' 
                : (contentType === 'video' ? 'videos' : 'posts')));
      return `${window.location.origin}/${typePlural}/${contentId}`;
    }
    return '';
  };

  const handleCopyLink = () => {
    const url = getCanonicalUrl();
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => {});
    }
    setIsOpen(false);
  };

  const handleSaveClick = async () => {
    setIsOpen(false);
    if (onSave) {
      onSave();
    } else {
      if (!currentUserId) {
        toast.error('Please login to save content');
        return;
      }
      setLocalSaved(true);
      openSaveToContainer({
        id: contentId,
        title: title || 'Saved Item',
        type: contentType,
        item_kind: contentType,
        creator_name: creatorUsername,
      });
    }
  };

  const handleShareClick = () => {
    setIsOpen(false);
    if (onShare) {
      onShare();
    } else {
      setShowShare(true);
    }
  };

  const handleHideClick = () => {
    setIsOpen(false);
    if (onHide) onHide();
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

  const typeLabel = contentType.charAt(0).toUpperCase() + contentType.slice(1);

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
          {/* ================= 1. OWNER ACTIONS (Edit & Delete) ================= */}
          {isOwner && (
            <>
              <button
                onClick={handleEditClick}
                style={{ ...menuItemStyle, color: 'var(--green, #10b981)', fontWeight: 600 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Pencil size={18} color="var(--green, #10b981)" />
                <span>Edit {typeLabel}</span>
              </button>

              <button
                onClick={handleDeleteClick}
                style={{ ...menuItemStyle, color: '#ef4444', fontWeight: 600 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Trash2 size={18} color="#ef4444" />
                <span>Delete {typeLabel}</span>
              </button>

              <div style={{ height: 1, background: 'var(--border, #eaeaea)', margin: '4px 0' }} />
            </>
          )}

          {/* ================= 2. SAVE BUTTON (Owner & Non-Owner) ================= */}
          <button
            onClick={handleSaveClick}
            style={menuItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Bookmark size={18} fill={localSaved ? 'currentColor' : 'none'} color={localSaved ? '#f59e0b' : 'currentColor'} />
            <span>{localSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* ================= 3. SHARE BUTTON (Owner & Non-Owner) ================= */}
          <button
            onClick={handleShareClick}
            style={menuItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <Send size={18} />
            <span>Share</span>
          </button>

          {/* ================= 4. COPY LINK (Owner & Non-Owner) ================= */}
          <button
            onClick={handleCopyLink}
            style={menuItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <LinkIcon size={18} />
            <span>Copy link</span>
          </button>

          {/* ================= 5. NOT INTERESTED (Non-Owner Only) ================= */}
          {!isOwner && onHide && (
            <button
              onClick={handleHideClick}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <EyeOff size={18} />
              <span>Not interested</span>
            </button>
          )}

          {/* ================= 6. REPORT (Strict Non-Owner Only) ================= */}
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
                <span>Report {typeLabel}</span>
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
              Delete {typeLabel}?
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

      {/* Share Sheet */}
      {showShare && (
        <ShareSheet
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          contentType={contentType}
          contentId={contentId}
          contentUrl={getCanonicalUrl()}
          title={title}
          contentAuthor={creatorUsername}
        />
      )}

      {/* Report Modal */}
      {showReport && !isOwner && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          contentId={contentId}
          contentType={contentType}
          sourceSurface={sourceSurface}
          ownerId={contentAuthorId ? String(contentAuthorId) : ''}
          creatorUsername={creatorUsername}
        />
      )}
    </div>
  );
};

export default ContentActionMenu;
