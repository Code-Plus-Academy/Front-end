'use client';

import React, { useState } from 'react';
import ClapIcon from '../icons/ClapIcon';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSaveToContainer } from '../../context/SaveToContainerContext';
import LoginPromptModal from '../ui/LoginPromptModal';
import ReportModal from '../ui/ReportModal';
import ShareSheet from '../ui/ShareSheet';

export default function NoteActionButtons({
  noteId,
  initialUpvoted,
  initialBookmarked,
  initialUpvotes,
  ownerId,
  creatorUsername,
}) {
  const { user } = useAuth();
  const { openSaveToContainer } = useSaveToContainer();
  const [upvoted, setUpvoted] = useState(initialUpvoted || false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false);
  const [upvotes, setUpvotes] = useState(initialUpvotes || 0);
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginActionType, setLoginActionType] = useState('clap');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isOwner = Boolean(
    user &&
    ((ownerId && (user.id === ownerId || user.userId === ownerId || user._id === ownerId)) ||
     (creatorUsername && user.username?.toLowerCase() === creatorUsername?.toLowerCase()))
  );

  const executeUpvote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/upvote`, { method: 'POST' });
      if (res.ok) {
        setUpvoted(prev => !prev);
        setUpvotes(prev => upvoted ? prev - 1 : prev + 1);
        toast.success(upvoted ? 'Upvote removed' : 'Resource upvoted!');
      } else {
        const err = await res.json();
        if (res.status === 401) {
          setLoginActionType('clap');
          setLoginModalOpen(true);
        } else {
          toast.error(err.message || 'Error processing upvote');
        }
      }
    } catch (e) {
      toast.error('Sign in required');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = () => {
    if (!user) {
      setLoginActionType('clap');
      setLoginModalOpen(true);
      return;
    }
    executeUpvote();
  };

  const executeBookmark = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/bookmark`, { method: 'POST' });
      if (res.ok) {
        setBookmarked(prev => !prev);
        toast.success(bookmarked ? 'Removed from saved' : 'Resource saved!');
      } else {
        const err = await res.json();
        if (res.status === 401) {
          setLoginActionType('save');
          setLoginModalOpen(true);
        } else {
          toast.error(err.message || 'Error processing save');
        }
      }
    } catch (e) {
      toast.error('Sign in required');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    if (!user) {
      setLoginActionType('save');
      setLoginModalOpen(true);
      return;
    }
    setBookmarked(true);
    openSaveToContainer({
      id: noteId,
      title: typeof document !== 'undefined' ? document.title : 'Study Resource',
      type: 'note',
      item_kind: 'note',
      creator_name: creatorUsername,
    });
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  const handleReport = () => {
    if (!user) {
      setLoginActionType('report');
      setLoginModalOpen(true);
      return;
    }
    setReportModalOpen(true);
  };

  return (
    <>
      <style>{`
        .action-strip {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          margin-bottom: 20px;
          flex-wrap: nowrap;
          width: 100%;
        }
        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid var(--border-bright, rgba(255, 255, 255, 0.1));
          border-radius: var(--r-md, 12px);
          padding: 10px 8px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text, #fff);
          background: var(--surface, rgba(255, 255, 255, 0.03));
          white-space: nowrap;
        }
        .action-btn:hover {
          background: var(--s2, rgba(255, 255, 255, 0.08));
          border-color: var(--cyan, #00dbe9);
        }
        .action-btn.active {
          background: rgba(0, 219, 233, 0.12);
          border-color: var(--cyan, #00dbe9);
          color: var(--cyan, #00dbe9);
        }
        .action-btn.report-btn:hover {
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }
        @media (max-width: 480px) {
          .action-strip {
            gap: 6px;
          }
          .action-btn {
            padding: 9px 6px;
            font-size: 11.5px;
            gap: 4px;
          }
        }
      `}</style>

      <div className="action-strip">
        <button 
          onClick={handleUpvote}
          disabled={loading}
          className={`action-btn${upvoted ? ' active' : ''}`}
          type="button"
        >
          <ClapIcon size={20} color="currentColor" filled={upvoted} />
          <span>{upvotes} Upvotes</span>
        </button>

        <button 
          onClick={handleBookmark}
          disabled={loading}
          className={`action-btn${bookmarked ? ' active' : ''}`}
          type="button"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18, fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}>
            bookmark
          </span>
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button 
          onClick={handleShare}
          className="action-btn"
          type="button"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
            share
          </span>
          <span>Share</span>
        </button>

        {!isOwner && (
          <button 
            onClick={handleReport}
            className="action-btn report-btn"
            type="button"
            title="Report this resource"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#ef4444' }}>
              flag
            </span>
            <span>Report</span>
          </button>
        )}
      </div>

      <LoginPromptModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        actionType={loginActionType}
        onLoginSuccess={() => {
          if (loginActionType === 'clap') executeUpvote();
          else if (loginActionType === 'save') executeBookmark();
          else if (loginActionType === 'report') setReportModalOpen(true);
        }}
      />

      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          contentId={noteId}
          contentType="resource"
          ownerId={ownerId}
          creatorUsername={creatorUsername}
        />
      )}

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        contentType="note"
        contentId={noteId}
        contentTitle={typeof document !== 'undefined' ? document.title : 'Study Resource'}
        contentAuthor={creatorUsername || ''}
      />
    </>
  );
}

