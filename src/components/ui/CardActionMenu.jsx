import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Bookmark, Link as LinkIcon, EyeOff, Flag, Pencil } from 'lucide-react';
import ReportModal from './ReportModal';
import { useAuth } from '../../context/AuthContext';

let toast = { success: () => {} };
try {
  toast = require('react-hot-toast').default;
} catch {}

const CardActionMenu = ({
  contentId,
  contentType,
  contentUrl,
  ownerId,
  creatorId,
  creatorUsername,
  isOwner = false,
  onSave,
  isSaved,
  onHide,
  onReport,
  onEdit,
  triggerSize = 20,
  sourceSurface = 'web'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch {}

  const currentUserId = authUser?.id || authUser?.user_id;
  const currentUsername = authUser?.username;
  const targetOwnerId = ownerId || creatorId;

  // Determine if the current viewer owns this content
  const isContentOwner = Boolean(
    isOwner ||
    (currentUserId && targetOwnerId && String(currentUserId) === String(targetOwnerId)) ||
    (currentUsername && creatorUsername && String(currentUsername).toLowerCase() === String(creatorUsername).toLowerCase())
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
    const url = contentUrl || (typeof window !== 'undefined' ? `${window.location.origin}/${contentType === 'note' ? 'notes' : contentType + 's'}/${contentId}` : '');
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Link copied to clipboard'))
      .catch(() => {});
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

  const handleEdit = () => {
    setIsOpen(false);
    if (onEdit) {
      onEdit();
    } else {
      const typePath = contentType === 'note' ? 'notes' : (contentType === 'article' ? 'articles' : 'posts');
      navigate(`/${typePath}/${contentId}/edit`);
    }
  };

  const handleReport = () => {
    if (onReport) {
      onReport();
    } else {
      setShowReport(true);
    }
    setIsOpen(false);
  };

  const menuItemStyle = {
    padding: '11px 16px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
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
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
        aria-expanded={isOpen}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          padding: '4px',
          color: 'var(--sub, #666)'
        }}
      >
        <MoreHorizontal size={triggerSize} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 50,
            minWidth: '220px',
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e0e0e0)',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }}
        >
          {/* Owner options */}
          {isContentOwner ? (
            <button
              onClick={handleEdit}
              style={{ ...menuItemStyle, color: 'var(--green, #10b981)', fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <Pencil size={18} color="var(--green, #10b981)" />
              Edit Content
            </button>
          ) : (
            <button
              onClick={handleSave}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
          
          <button
            onClick={handleCopyLink}
            style={menuItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <LinkIcon size={18} />
            Copy link
          </button>
          
          {!isContentOwner && (
            <button
              onClick={handleHide}
              style={menuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <EyeOff size={18} />
              Not interested
            </button>
          )}
          
          {/* Show Report ONLY if user is NOT the content owner */}
          {!isContentOwner && (
            <>
              <div style={{ height: 1, background: 'var(--border, #eaeaea)', margin: '4px 0' }} />
              <button
                onClick={handleReport}
                style={{
                  ...menuItemStyle,
                  color: '#d93025',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s2, #f5f5f5)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Flag size={18} color="#d93025" />
                Report
              </button>
            </>
          )}
        </div>
      )}

      {showReport && !isContentOwner && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          contentId={contentId}
          contentType={contentType}
          sourceSurface={sourceSurface}
          ownerId={targetOwnerId}
          creatorUsername={creatorUsername}
        />
      )}
    </div>
  );
};

export default CardActionMenu;
