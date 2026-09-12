'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreHorizontal, 
  Bookmark, 
  Link as LinkIcon, 
  Pencil, 
  Trash2, 
  Send, 
  Loader2,
  CircleUser,
  CheckCircle2,
  XCircle,
  MessageSquareWarning
} from 'lucide-react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (!isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (isOpen && isMobile) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen, isMobile]);

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

  const handleInterestedClick = () => {
    setIsOpen(false);
    toast.success("Got it! We'll show more content like this.");
  };

  const handleHideClick = () => {
    setIsOpen(false);
    if (onHide) {
      onHide();
    } else {
      toast.success("Got it! We'll tune your feed recommendations.");
    }
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
    padding: '13px 20px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--text, #191919)',
    cursor: 'pointer',
    transition: 'background 0.15s ease, transform 0.08s ease',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    fontFamily: 'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  };

  const typeLabel = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  const renderMenuItems = () => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* ================= 1. OWNER ACTIONS (Edit & Delete) ================= */}
      {isOwner && (
        <>
          <button
            type="button"
            onClick={handleEditClick}
            style={{ ...menuItemStyle, color: 'var(--green, #10b981)', fontWeight: 600 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, rgba(0, 0, 0, 0.04))')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil size={22} strokeWidth={1.8} color="var(--green, #10b981)" style={{ flexShrink: 0 }} />
            <span>Edit {typeLabel}</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteClick}
            style={{ ...menuItemStyle, color: '#ef4444', fontWeight: 600 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Trash2 size={22} strokeWidth={1.8} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>Delete {typeLabel}</span>
          </button>

          <div style={{ height: 1, background: 'var(--border, rgba(0, 0, 0, 0.08))', margin: '4px 0' }} />
        </>
      )}

      {/* ================= 2. ABOUT THIS ACCOUNT (Non-Owner with creatorUsername) ================= */}
      {!isOwner && creatorUsername && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            if (typeof window !== 'undefined') {
              window.location.href = `/u/${creatorUsername}`;
            }
          }}
          style={menuItemStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, rgba(0, 0, 0, 0.04))')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <CircleUser size={22} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span>About this account</span>
        </button>
      )}

      {/* ================= 3. SAVE BUTTON (Owner & Non-Owner) ================= */}
      <button
        type="button"
        onClick={handleSaveClick}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, rgba(0, 0, 0, 0.04))')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Bookmark
          size={22}
          strokeWidth={1.8}
          fill={localSaved ? '#f59e0b' : 'none'}
          color={localSaved ? '#f59e0b' : 'currentColor'}
          style={{ flexShrink: 0 }}
        />
        <span>{localSaved ? 'Saved' : 'Save'}</span>
      </button>

      {/* ================= 4. SHARE BUTTON (Owner & Non-Owner) ================= */}
      <button
        type="button"
        onClick={handleShareClick}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, rgba(0, 0, 0, 0.04))')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Send size={22} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span>Share</span>
      </button>

      {/* ================= 5. COPY LINK (Owner & Non-Owner) ================= */}
      <button
        type="button"
        onClick={handleCopyLink}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, rgba(0, 0, 0, 0.04))')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <LinkIcon size={22} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span>Copy link</span>
      </button>

      {/* ================= 6. AUDIENCE FEEDBACK (Non-Owner Only) ================= */}
      {!isOwner && (
        <>
          <div style={{ height: 1, background: 'var(--border, rgba(0, 0, 0, 0.08))', margin: '4px 0' }} />
          
          <button
            type="button"
            onClick={handleInterestedClick}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, rgba(0, 0, 0, 0.04))')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <CheckCircle2 size={22} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span>Interested</span>
          </button>

          <button
            type="button"
            onClick={handleHideClick}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2, rgba(0, 0, 0, 0.04))')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <XCircle size={22} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span>Not interested</span>
          </button>
        </>
      )}

      {/* ================= 7. REPORT (Strict Non-Owner Only) ================= */}
      {!isOwner && (
        <>
          <div style={{ height: 1, background: 'var(--border, rgba(0, 0, 0, 0.08))', margin: '4px 0' }} />
          <button
            type="button"
            onClick={handleReportClick}
            style={{
              ...menuItemStyle,
              color: '#ef4444',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <MessageSquareWarning size={22} strokeWidth={1.8} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>Report {typeLabel}</span>
          </button>
        </>
      )}
    </div>
  );

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
        <>
          <style>{`
            @keyframes igSheetFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes igSheetSlideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>

          {isMobile && mounted ? (
            createPortal(
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 99998,
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  animation: 'igSheetFadeIn 0.18s ease-out',
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Content options"
                  style={{
                    width: '100%',
                    background: 'var(--surface, #ffffff)',
                    borderTop: '1px solid var(--border, rgba(0, 0, 0, 0.08))',
                    borderRadius: '24px 24px 0 0',
                    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
                    paddingTop: '8px',
                    paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
                    animation: 'igSheetSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {/* Top Drag Handle Indicator */}
                  <div
                    style={{
                      width: '38px',
                      height: '4px',
                      borderRadius: '9999px',
                      background: 'var(--sub, #cbd5e1)',
                      opacity: 0.65,
                      margin: '6px auto 14px auto',
                    }}
                  />
                  {renderMenuItems()}
                </div>
              </div>,
              document.body
            )
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              role="menu"
              aria-label="Content options"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                [align === 'left' ? 'left' : 'right']: 0,
                zIndex: 9999,
                minWidth: '240px',
                maxWidth: '280px',
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e0e0e0)',
                borderRadius: '20px',
                boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px var(--border, rgba(0,0,0,0.05))',
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
                padding: '6px 0',
              }}
            >
              {/* Subtle top indicator */}
              <div
                style={{
                  width: '32px',
                  height: '3.5px',
                  borderRadius: '9999px',
                  background: 'var(--sub, #cbd5e1)',
                  opacity: 0.5,
                  margin: '4px auto 8px auto',
                }}
              />
              {renderMenuItems()}
            </div>
          )}
        </>
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
