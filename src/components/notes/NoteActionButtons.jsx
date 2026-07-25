'use client';

import React, { useState } from 'react';
import ClapIcon from '../icons/ClapIcon';
import { toast } from 'react-hot-toast';

export default function NoteActionButtons({ noteId, initialUpvoted, initialBookmarked, initialUpvotes }) {
  const [upvoted, setUpvoted] = useState(initialUpvoted || false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked || false);
  const [upvotes, setUpvotes] = useState(initialUpvotes || 0);
  const [loading, setLoading] = useState(false);

  const handleUpvote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/upvote`, { method: 'POST' });
      if (res.ok) {
        setUpvoted(prev => !prev);
        setUpvotes(prev => upvoted ? prev - 1 : prev + 1);
        toast.success(upvoted ? 'Upvote removed' : 'Resource upvoted!');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Please sign in to upvote');
      }
    } catch (e) {
      toast.error('Sign in required');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/bookmark`, { method: 'POST' });
      if (res.ok) {
        setBookmarked(prev => !prev);
        toast.success(bookmarked ? 'Removed from saved' : 'Resource saved!');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Please sign in to save');
      }
    } catch (e) {
      toast.error('Sign in required');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title || 'Notes Arena',
          url,
        });
      } catch (e) {
        // User cancelled share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (e) {
        toast.error('Could not copy link');
      }
    }
  };

  return (
    <>
      <style>{`
        .action-strip {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid var(--border-bright);
          border-radius: var(--r-md);
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text);
          background: transparent;
          white-space: nowrap;
        }
        .action-btn:hover {
          background: var(--s2);
          border-color: var(--green);
        }
        .action-btn.active {
          background: var(--green-dim);
          border-color: var(--green);
          color: var(--green);
        }
      `}</style>

      <div className="action-strip">
        <button 
          onClick={handleUpvote}
          disabled={loading}
          className={`action-btn${upvoted ? ' active' : ''}`}
          type="button"
        >
          <ClapIcon size={25} color="currentColor" filled={upvoted} />
          <span>{upvotes} Upvotes</span>
        </button>

        <button 
          onClick={handleBookmark}
          disabled={loading}
          className={`action-btn${bookmarked ? ' active' : ''}`}
          type="button"
        >
          <span className="material-symbols-rounded" style={{ fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}>
            bookmark
          </span>
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button 
          onClick={handleShare}
          className="action-btn"
          type="button"
        >
          <span className="material-symbols-rounded">
            share
          </span>
          <span>Share</span>
        </button>
      </div>
    </>
  );
}
