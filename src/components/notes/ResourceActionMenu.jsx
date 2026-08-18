'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Flag, Link as LinkIcon } from 'lucide-react';
import ReportModal from '../ui/ReportModal';
import { useAuth } from '../../context/AuthContext';

let toast = { success: () => {} };
try {
  toast = require('react-hot-toast').default;
} catch {}

// Kebab (three-dot) menu for a resource's detail page.
// "Edit Resource" appears ONLY for the uploader/owner of the resource or an admin.
// "Report" appears for third-party viewers.
export default function ResourceActionMenu({ noteId, editHref, canEdit, ownerId, creatorUsername, contentUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef(null);

  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user || null;
  } catch {}

  const currentUserId = authUser?.id || authUser?.user_id;
  const currentUsername = authUser?.username;
  const targetOwnerId = ownerId ? String(ownerId).trim() : null;
  const targetCreatorUsername = creatorUsername ? String(creatorUsername).trim().toLowerCase() : null;

  // Determine if the current viewer owns this content
  const isOwner = Boolean(
    authUser && (
      (currentUserId && targetOwnerId && String(currentUserId).trim() === targetOwnerId) ||
      (currentUsername && targetCreatorUsername && String(currentUsername).trim().toLowerCase() === targetCreatorUsername)
    )
  );
  const isAdmin = Boolean(authUser && authUser.role === 'admin');

  // ONLY allow edit if client-side auth explicitly confirms the viewer is the uploader or admin.
  // Never expose edit controls for unauthenticated visitors or regular third-party users.
  const isAuthorizedToEdit = Boolean(authUser && (isOwner || isAdmin));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyLink = () => {
    const url = contentUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Resource link copied to clipboard'))
        .catch(() => {});
    }
    setIsOpen(false);
  };

  const menuItemStyle = {
    padding: '11px 16px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    textDecoration: 'none',
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Resource options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          color: 'var(--text)',
        }}
      >
        <MoreHorizontal size={20} />
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            zIndex: 50,
            minWidth: 200,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
          }}
        >
          {isAuthorizedToEdit ? (
            <Link
              href={editHref || `/notes/${noteId}/edit`}
              onClick={() => setIsOpen(false)}
              style={{ ...menuItemStyle, color: 'var(--green, #00b4d8)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Pencil size={16} color="var(--green, #00b4d8)" />
              Edit Resource
            </Link>
          ) : (
            <button
              onClick={() => {
                setShowReport(true);
                setIsOpen(false);
              }}
              style={{ ...menuItemStyle, color: '#d93025' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Flag size={16} color="#d93025" />
              Report
            </button>
          )}

          <button
            onClick={handleCopyLink}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <LinkIcon size={16} color="var(--sub)" />
            Copy Link
          </button>
        </div>
      )}

      {showReport && !isAuthorizedToEdit && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          contentId={noteId}
          contentType="resource"
          ownerId={targetOwnerId}
          creatorUsername={creatorUsername}
        />
      )}
    </div>
  );
}
