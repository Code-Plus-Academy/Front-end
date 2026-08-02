'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Flag } from 'lucide-react';
import ReportModal from '../ui/ReportModal';

// Kebab (three-dot) menu for a resource's detail page.
// "Edit Resource" only appears for the uploader or an admin (canEdit prop,
// computed server-side). "Report" is always available to any signed-in viewer.
export default function ResourceActionMenu({ noteId, editHref, canEdit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
          {canEdit && (
            <Link
              href={editHref}
              onClick={() => setIsOpen(false)}
              style={{ ...menuItemStyle, color: 'var(--green)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <Pencil size={16} />
              Edit Resource
            </Link>
          )}

          <button
            onClick={() => {
              setShowReport(true);
              setIsOpen(false);
            }}
            style={{ ...menuItemStyle, color: '#d93025' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <Flag size={16} />
            Report
          </button>
        </div>
      )}

      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          contentId={noteId}
          contentType="resource"
        />
      )}
    </div>
  );
}
