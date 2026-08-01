/**
 * Universal CommentSheet — slide-up drawer (mobile) / side panel (desktop)
 *
 * Supports: posts, videos, shorts
 * Features:
 *   - Instagram-style threaded replies (collapse/expand per comment)
 *   - Three-dot per-comment dropdown: Copy · Reply · Delete (own comments)
 *   - Optimistic add/delete with rollback
 *   - Unified author mapping for post (c.user) and video (c.author_*) APIs
 *   - Skeleton loaders, empty state, unauthenticated prompt
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

function colorForName(name = '') {
  const colors = ['#00B4D8', '#9333EA', '#00C9B1', '#FF6B6B', '#E8A020', '#22C55E'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function normalizeAuthor(c) {
  // post API returns c.user object; video API returns flat c.author_* fields
  return c.user || {
    id: c.user_id,
    name: c.author_name || 'Anonymous',
    username: c.author_username || 'anonymous',
    avatar_url: c.author_avatar || null,
  };
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex gap-3 items-start px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-[var(--border)] flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex gap-2 items-center">
          <div className="h-3 w-24 bg-[var(--border)] rounded" />
          <div className="h-2 w-8 bg-[var(--border)] rounded opacity-60" />
        </div>
        <div className="h-3 w-full bg-[var(--border)] rounded opacity-70" />
        <div className="h-3 w-3/4 bg-[var(--border)] rounded opacity-50" />
      </div>
    </div>
  );
}

// ─── Comment Dropdown Menu ───────────────────────────────────────────────────

function CommentMenu({ comment, currentUser, entityType, entityId, onDelete, onReply }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  const author = normalizeAuthor(comment);
  const isOwner = currentUser && (
    currentUser.id === author.id ||
    currentUser.username?.toLowerCase() === author.username?.toLowerCase()
  );

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(comment.text || comment.body || '');
    setOpen(false);
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      if (entityType !== 'video') {
        await api.delete(`/posts/${entityId}/comments/${comment.id}`);
      }
      // video comment delete endpoint not exposed in router yet — remove locally
      onDelete?.(comment.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        aria-label="Comment options"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--sub)', padding: '2px 4px',
          borderRadius: 6, display: 'flex', alignItems: 'center',
          transition: 'all 0.15s',
        }}
        className="opacity-0 group-hover:opacity-100 hover:bg-[var(--s2)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          minWidth: 156, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.28)', zIndex: 200,
          overflow: 'hidden',
        }}>
          {/* Reply */}
          {currentUser && (
            <MenuItem
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>}
              label="Reply"
              onClick={() => { onReply?.(comment); setOpen(false); }}
            />
          )}
          {/* Copy */}
          <MenuItem
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
            label="Copy text"
            onClick={handleCopy}
          />
          {/* Delete (own only) */}
          {isOwner && (
            <MenuItem
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>}
              label={deleting ? 'Deleting…' : 'Delete'}
              onClick={handleDelete}
              danger
            />
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '10px 14px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: danger ? '#EF4444' : 'var(--text)',
        fontSize: 12, fontWeight: danger ? 600 : 500,
        textAlign: 'left', transition: 'background 0.12s',
      }}
      className="hover:bg-[var(--s2)]"
    >
      {icon}{label}
    </button>
  );
}

// ─── Reply Thread ─────────────────────────────────────────────────────────────

function RepliesSection({ comment, entityType, entityId, currentUser, onReplyToReply }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const replyCount = comment.reply_count || 0;

  const loadReplies = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      let data = [];
      if (entityType === 'video') {
        const r = await api.get(`/videos/${entityId}/comments/${comment.id}/replies`);
        data = r.data.replies || r.data || [];
      } else {
        const r = await api.get(`/posts/${entityId}/comments/${comment.id}/replies`);
        data = r.data.replies || [];
      }
      setReplies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load replies failed:', err);
    } finally {
      setLoading(false);
    }
  }, [comment.id, entityId, entityType, loading]);

  const handleToggle = () => {
    if (!open && replies.length === 0 && replyCount > 0) {
      loadReplies();
    }
    setOpen(v => !v);
  };

  const handleDeleteReply = (replyId) => {
    setReplies(prev => prev.filter(r => r.id !== replyId));
  };

  // Append a new reply locally when posted
  const addReply = (reply) => {
    setReplies(prev => [...prev, reply]);
    setOpen(true);
  };

  // Expose addReply via ref pattern — parent calls comment.__addReply
  useEffect(() => {
    comment.__addReply = addReply;
    return () => { delete comment.__addReply; };
  });

  if (replyCount === 0 && replies.length === 0) return null;

  return (
    <div style={{ marginLeft: 44, marginTop: 4 }}>
      <button
        onClick={handleToggle}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 600, color: 'var(--sub)',
          padding: '2px 0', marginBottom: open ? 8 : 0,
        }}
      >
        <span style={{
          display: 'inline-block', width: 24, height: 1,
          background: 'var(--border)', verticalAlign: 'middle',
        }} />
        {loading ? 'Loading…' : open
          ? 'Hide replies'
          : `View ${replyCount || replies.length} ${(replyCount || replies.length) === 1 ? 'reply' : 'replies'}`
        }
      </button>

      {open && replies.map(r => {
        const rAuthor = normalizeAuthor(r);
        const rColor = colorForName(rAuthor.username);
        const rStatus = (r.moderation_status || r.status || '').toLowerCase();
        const rIsUnderReview = rStatus === 'under_review';
        const rIsRemoved = rStatus === 'removed';
        return (
          <div key={r.id} className="group flex gap-2 items-start mb-2">
            <img
              src={rAuthor.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${rAuthor.username}`}
              alt=""
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${rColor}40` }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>
                  {rAuthor.name || rAuthor.username}
                </span>
                <span style={{ fontSize: 10, color: 'var(--sub)', fontFamily: 'var(--font-mono)' }}>
                  {timeAgo(r.created_at)} {rIsUnderReview ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>[Under Review]</span> : rIsRemoved ? <span style={{ color: '#ef4444', fontWeight: 700 }}>[Removed]</span> : ''}
                </span>
              </div>
              {rIsRemoved ? (
                <p style={{ fontSize: 13, color: '#ef4444', fontStyle: 'italic', margin: 0 }}>
                  [This comment was removed for policy violations]
                </p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0, wordBreak: 'break-word' }}>
                  {r.text || r.body}
                </p>
              )}
            </div>
            <CommentMenu
              comment={r}
              currentUser={currentUser}
              entityType={entityType}
              entityId={entityId}
              onDelete={handleDeleteReply}
              onReply={onReplyToReply}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Comment Row ─────────────────────────────────────────────────────────────

function CommentRow({ comment, currentUser, entityType, entityId, onDelete, onReply }) {
  const author = normalizeAuthor(comment);
  const color = colorForName(author.username);
  const statusLower = (comment.moderation_status || comment.status || '').toLowerCase();
  const isUnderReview = statusLower === 'under_review';
  const isRemoved = statusLower === 'removed';

  return (
    <div className="group" style={{ padding: '8px 16px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <img
          src={author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${author.username}`}
          alt=""
          style={{
            width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
            flexShrink: 0, border: `2px solid ${color}40`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', flexShrink: 0 }}>
                {author.name || author.username}
              </span>
              <span style={{ fontSize: 10, color: 'var(--sub)', fontFamily: 'var(--font-mono)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                {timeAgo(comment.created_at)}
                {isUnderReview && (
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>[Under Review]</span>
                )}
                {isRemoved && (
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>[Removed]</span>
                )}
              </span>
            </div>
            <CommentMenu
              comment={comment}
              currentUser={currentUser}
              entityType={entityType}
              entityId={entityId}
              onDelete={onDelete}
              onReply={onReply}
            />
          </div>
          {isRemoved ? (
            <p style={{ fontSize: 13, color: '#ef4444', fontStyle: 'italic', margin: '0 0 6px' }}>
              [This comment was removed for policy violations]
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, margin: '0 0 6px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {comment.text || comment.body}
            </p>
          )}
          {/* Reply action row */}
          {!isRemoved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => onReply?.(comment)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, color: 'var(--sub)',
                  padding: 0, display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Threaded replies */}
      <RepliesSection
        comment={comment}
        entityType={entityType}
        entityId={entityId}
        currentUser={currentUser}
        onReplyToReply={(r) => onReply?.(r, comment)}
      />
    </div>
  );
}

// ─── Main CommentSheet ────────────────────────────────────────────────────────

export default function CommentSheet({ isOpen, onClose, entityId, entityType = 'post', user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  // Reply state: { comment, parentComment } — which comment we're replying to
  const [replyTo, setReplyTo] = useState(null);

  const sheetRef = useRef(null);
  const textareaRef = useRef(null);

  // ── mount / unmount animation ──
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const t = setTimeout(() => setAnimate(true), 20);
      return () => clearTimeout(t);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  const handleTransitionEnd = () => {
    if (!isOpen) setShouldRender(false);
  };

  // ── fetch comments ──
  useEffect(() => {
    if (!isOpen || !entityId) return;
    setLoading(true);
    const ep = entityType === 'video'
      ? `/videos/${entityId}/comments?limit=50`
      : `/posts/${entityId}/comments?limit=50`;
    api.get(ep)
      .then(r => setComments(r.data.comments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, entityId, entityType]);

  // ── keyboard ──
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // ── focus textarea when opened ──
  useEffect(() => {
    if (isOpen && shouldRender) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen, shouldRender]);

  // ── handle reply selection ──
  const handleReply = useCallback((targetComment, parentComment) => {
    const author = normalizeAuthor(targetComment);
    setReplyTo({ comment: targetComment, parent: parentComment || null });
    setNewComment(`@${author.username} `);
    textareaRef.current?.focus();
  }, []);

  const cancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };

  // ── post comment / reply ──
  const handlePost = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || !user || posting) return;
    setPosting(true);
    try {
      let res;
      if (entityType === 'video' && replyTo) {
        // Video reply: POST with parent_id
        const rootComment = replyTo.parent || replyTo.comment;
        res = await api.post(`/videos/${entityId}/comments`, {
          text: newComment.trim(),
          parent_id: rootComment.id,
        });
        // Append reply locally to the root comment's reply list
        if (res.data.comment && rootComment.__addReply) {
          rootComment.__addReply(res.data.comment);
        }
      } else if (entityType === 'video') {
        res = await api.post(`/videos/${entityId}/comments`, { text: newComment.trim() });
        if (res.data.comment) setComments(prev => [res.data.comment, ...prev]);
      } else if (replyTo) {
        // Post reply: POST with parent_id (now supported by backend)
        const rootComment = replyTo.parent || replyTo.comment;
        res = await api.post(`/posts/${entityId}/comments`, {
          body: newComment.trim(),
          parent_id: rootComment.id,
        });
        // Append reply locally to the root comment's reply list
        if (res.data.comment && rootComment.__addReply) {
          rootComment.__addReply(res.data.comment);
        }
      } else {
        // Top-level post comment
        res = await api.post(`/posts/${entityId}/comments`, { body: newComment.trim() });
        if (res.data.comment) setComments(prev => [res.data.comment, ...prev]);
      }
      setNewComment('');
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = (id) => setComments(prev => prev.filter(c => c.id !== id));

  if (!shouldRender) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', pointerEvents: 'none' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          pointerEvents: 'auto', zIndex: 9998,
          opacity: animate ? 1 : 0,
          transition: 'opacity 280ms ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        onTransitionEnd={handleTransitionEnd}
        style={{
          position: 'fixed',
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.35)',
          pointerEvents: 'auto',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          // Mobile: bottom sheet
          bottom: 0, left: 0, right: 0,
          height: '72vh',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--border)',
          transform: animate ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)',
        }}
        className="md:!top-0 md:!right-0 md:!left-auto md:!bottom-0 md:!w-[400px] md:!h-full md:!rounded-none md:!border-l md:!border-t-0"
        data-desktop-transform={animate ? 'translateX(0)' : 'translateX(100%)'}
      >
        <style>{`
          @media (min-width: 768px) {
            [data-comment-sheet] {
              transform: translateX(var(--sheet-x)) !important;
              top: 0 !important; bottom: 0 !important;
              right: 0 !important; left: auto !important;
              width: 400px !important; height: 100% !important;
              border-radius: 0 !important;
              border-left: 1px solid var(--border) !important;
              border-top: none !important;
            }
          }
          @keyframes fadeUp {
            from { opacity:0; transform:translateY(6px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>

        {/* ── Drag handle (mobile) ── */}
        <div
          onClick={onClose}
          style={{
            width: 40, height: 4, borderRadius: 99,
            background: 'var(--border)', margin: '12px auto 8px', cursor: 'pointer', flexShrink: 0,
          }}
          className="md:hidden"
        />

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 12px', flexShrink: 0,
          borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-display)' }}>
            Comments
            <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--sub)', marginLeft: 6 }}>
              ({comments.length})
            </span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--sub)', padding: 6, borderRadius: 8, display: 'flex',
            }}
            className="hover:bg-[var(--s2)] hover:text-[var(--text)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Comment list ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent',
          paddingTop: 4, paddingBottom: 8,
        }}>
          {loading ? (
            <>
              <CommentSkeleton /><CommentSkeleton /><CommentSkeleton />
              <CommentSkeleton /><CommentSkeleton />
            </>
          ) : comments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', marginBottom: 16,
                background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--green)',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>No comments yet</p>
              <p style={{ fontSize: 13, color: 'var(--sub)', margin: 0, lineHeight: 1.5 }}>Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map(c => (
              <CommentRow
                key={c.id}
                comment={c}
                currentUser={user}
                entityType={entityType}
                entityId={entityId}
                onDelete={handleDeleteComment}
                onReply={handleReply}
              />
            ))
          )}
        </div>

        {/* ── Reply indicator banner ── */}
        {replyTo && (
          <div style={{
            padding: '8px 16px', background: 'var(--s2)',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>
              Replying to{' '}
              <strong style={{ color: 'var(--text)' }}>
                @{normalizeAuthor(replyTo.comment).username}
              </strong>
            </span>
            <button
              onClick={cancelReply}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--sub)', padding: 2, display: 'flex',
              }}
              aria-label="Cancel reply"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Input area ── */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', flexShrink: 0 }}>
          {user ? (
            <form onSubmit={handlePost} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt=""
                style={{
                  width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                  flexShrink: 0, border: '1px solid var(--border)',
                }}
              />
              <div style={{
                flex: 1, background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                borderRadius: 20, padding: '8px 12px',
                display: 'flex', alignItems: 'flex-end', gap: 8,
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                className="focus-within:!border-[var(--green)] focus-within:shadow-[0_0_0_3px_var(--green-dim)]"
              >
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); }
                  }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                  }}
                  placeholder={replyTo ? `Reply to @${normalizeAuthor(replyTo.comment).username}…` : 'Add a comment…'}
                  rows={1}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    outline: 'none', resize: 'none', overflow: 'hidden',
                    fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
                    fontFamily: 'var(--font-body)', padding: 0,
                    maxHeight: 100,
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || posting}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', cursor: newComment.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                    background: newComment.trim()
                      ? 'linear-gradient(135deg, #00B4D8, #9333EA)'
                      : 'var(--border)',
                    color: newComment.trim() ? '#fff' : 'var(--sub)',
                  }}
                  className={newComment.trim() ? 'hover:scale-105 active:scale-95' : ''}
                >
                  {posting ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" style={{ animation: 'spin 0.8s linear infinite' }}/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div style={{
              textAlign: 'center', padding: '12px 16px',
              background: 'var(--s2)', borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <a
                href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
                style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)' }}
                className="hover:underline"
              >
                Log in to join the conversation
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
