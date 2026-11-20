/**
 * Universal CommentSheet — slide-up drawer (mobile) / side panel (desktop)
 *
 * Supports: posts, videos, shorts, articles, projects, notes
 * Features:
 *   - Instagram-style threaded replies (collapse/expand per comment)
 *   - Three-dot per-comment dropdown: Copy · Reply · Delete (own comments)
 *   - Server-confirmed create, edit, and delete actions
 *   - Unified author mapping for post (c.user) and video (c.author_*) APIs
 *   - Skeleton loaders, empty state, unauthenticated prompt
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  clearPendingCommentUlid,
  createComment,
  deleteComment,
  editComment,
  getPendingCommentUlid,
  getCommentCount,
  isCommentsV2Enabled,
  listCommentReplies,
  listComments,
} from '../../api/comments';

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

function CommentAttachments({ attachments = [] }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '6px 0 8px' }}>
      {attachments.map((attachment, index) => attachment?.url ? (
        <a key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" rel="noreferrer" aria-label={`${attachment.kind || 'image'} attachment`}>
          <img src={attachment.url} alt="" loading="lazy" style={{ display: 'block', maxWidth: 240, maxHeight: 240, borderRadius: 12, objectFit: 'contain', background: 'var(--s2)' }} />
        </a>
      ) : null)}
    </div>
  );
}

// ─── Comment Dropdown Menu ───────────────────────────────────────────────────

function CommentMenu({ comment, currentUser, entityType, entityId, parentId = null, onDelete, onEdit, onReply }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const menuRef = useRef(null);

  const author = normalizeAuthor(comment);
  const isOwner = currentUser && (
    (currentUser.id != null && author.id != null && String(currentUser.id) === String(author.id)) ||
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
      await deleteComment({ contentType: entityType, contentId: entityId }, comment.id, { parentId });
      onDelete?.(comment.id, parentId);
    } catch (err) {
      console.error('Delete failed:', err);
      setActionError(err?.response?.status === 426
        ? 'Update the app to manage comments for this content.'
        : (err?.response?.data?.message || 'Could not delete your comment. Please try again.'));
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setActionError(''); setOpen(v => !v); }}
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

      {actionError && <p role="alert" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 201, width: 220, margin: '4px 0 0', padding: '8px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: '#ef4444', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{actionError}</p>}
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
          {isOwner && isCommentsV2Enabled() && (
            <MenuItem
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>}
              label="Edit"
              onClick={() => { onEdit?.(comment, parentId); setOpen(false); }}
            />
          )}
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

function RepliesSection({ comment, entityType, entityId, currentUser, onReplyToReply, onDelete, onEdit }) {
  const [replies, setReplies] = useState(comment.replies || []);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [open, setOpen] = useState(false);
  const replyCount = comment.reply_count || (comment.replies ? comment.replies.length : 0);

  useEffect(() => {
    if (comment.replies && comment.replies.length > 0) {
      setReplies(comment.replies);
    }
  }, [comment.replies]);

  const loadReplies = useCallback(async () => {
    if (loading) return;
    if (!isCommentsV2Enabled() && comment.replies && comment.replies.length > 0) {
      setReplies(comment.replies);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const page = await listCommentReplies(
        { contentType: entityType, contentId: entityId },
        comment.id,
        { limit: 20 },
      );
      setReplies(page.comments);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Load replies failed:', err);
      setLoadError(err?.response?.status === 426
        ? 'Update the app to view replies for this content.'
        : 'Could not load replies. Try opening this thread again.');
    } finally {
      setLoading(false);
    }
  }, [comment.id, comment.replies, entityId, entityType, loading]);

  const loadMoreReplies = async () => {
    if (!nextCursor || !hasMore || loading) return;
    setLoading(true);
    setLoadError('');
    try {
      const page = await listCommentReplies(
        { contentType: entityType, contentId: entityId },
        comment.id,
        { limit: 20, cursor: nextCursor },
      );
      setReplies((previous) => {
        const existingIds = new Set(previous.map((reply) => reply.id));
        return [...previous, ...page.comments.filter((reply) => !existingIds.has(reply.id))];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Load more replies failed:', err);
      setLoadError(err?.response?.status === 426
        ? 'Update the app to view replies for this content.'
        : 'Could not load more replies. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open && replies.length === 0 && replyCount > 0) {
      loadReplies();
    }
    setOpen(v => !v);
  };

  // Keep reply mutations in this local list while the root item remains in the sheet state.
  const addReply = (reply) => {
    setReplies((previous) => [...previous, reply]);
    setOpen(true);
  };
  const replaceReply = (reply) => setReplies((previous) => previous.map((item) => item.id === reply.id ? reply : item));
  const removeReply = (replyId) => setReplies((previous) => previous.filter((item) => item.id !== replyId));

  useEffect(() => {
    comment.__addReply = addReply;
    comment.__replaceReply = replaceReply;
    comment.__removeReply = removeReply;
    return () => {
      delete comment.__addReply;
      delete comment.__replaceReply;
      delete comment.__removeReply;
    };
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

      {open && Array.isArray(replies) && replies.map(r => {
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
              {!rIsRemoved && <CommentAttachments attachments={r.attachments} />}
            </div>
            <CommentMenu
              comment={r}
              currentUser={currentUser}
              entityType={entityType}
              entityId={entityId}
              parentId={comment.id}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReplyToReply}
            />
          </div>
        );
      })}
      {open && loadError && <p role="alert" style={{ color: '#ef4444', fontSize: 11, margin: '4px 0 0' }}>{loadError}</p>}
      {open && hasMore && <button type="button" onClick={loadMoreReplies} disabled={loading} style={{ margin: '4px 0 8px 32px', padding: 0, border: 0, background: 'none', color: 'var(--green)', fontSize: 11, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>{loading ? 'Loading…' : 'Load more replies'}</button>}
    </div>
  );
}

// ─── Comment Row ─────────────────────────────────────────────────────────────

function CommentRow({ comment, currentUser, entityType, entityId, onDelete, onEdit, onReply }) {
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
              onEdit={onEdit}
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
          {!isRemoved && <CommentAttachments attachments={comment.attachments} />}
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
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}

// ─── Main CommentSheet ────────────────────────────────────────────────────────

export default function CommentSheet({ isOpen, onClose, entityId, entityType = 'post', user }) {
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationError, setPaginationError] = useState('');
  const [totalCount, setTotalCount] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [editingComment, setEditingComment] = useState(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  // Reply state: { comment, parentComment } — which comment we're replying to
  const [replyTo, setReplyTo] = useState(null);

  const sheetRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaPreviewUrlsRef = useRef(new Set());

  useEffect(() => () => {
    mediaPreviewUrlsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
    mediaPreviewUrlsRef.current.clear();
  }, []);

  const handleMediaSelected = (event) => {
    const incoming = Array.from(event.target.files || []);
    event.target.value = '';
    const valid = incoming.filter((file) => ['image/gif', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type) && file.size > 0 && file.size <= 2 * 1024 * 1024);
    if (valid.length !== incoming.length) setActionError('Choose JPEG, PNG, WebP, or GIF files up to 2 MB each.');
    const remaining = Math.max(0, 3 - selectedMedia.length);
    if (incoming.length > remaining) setActionError('A comment can include up to three images.');
    const next = valid.slice(0, remaining).map((file) => {
      const preview = URL.createObjectURL(file);
      mediaPreviewUrlsRef.current.add(preview);
      return { file, preview, kind: file.type === 'image/gif' ? 'gif' : 'image' };
    });
    setSelectedMedia((previous) => [...previous, ...next]);
  };

  const removeSelectedMedia = (index) => {
    setSelectedMedia((previous) => {
      const removed = previous[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
        mediaPreviewUrlsRef.current.delete(removed.preview);
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
  };

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

  // ── fetch comments only while this target's sheet is open ──
  useEffect(() => {
    if (!isOpen || !entityId) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setActionError('');
    setComments([]);
    setNextCursor(null);
    setHasMore(false);
    setPaginationError('');
    setTotalCount(null);
    getCommentCount({ contentType: entityType, contentId: entityId })
      .then((count) => { if (!cancelled && typeof count === 'number') setTotalCount(count); })
      .catch(() => {});
    listComments({ contentType: entityType, contentId: entityId }, { limit: 50 })
      .then((page) => {
        if (!cancelled) {
          setComments(page.comments);
          setNextCursor(page.nextCursor);
          setHasMore(page.hasMore);
          if (typeof page.count === 'number') {
            setTotalCount(page.count);
          } else if (!isCommentsV2Enabled()) {
            setTotalCount(page.comments.length);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error?.response?.status === 426
            ? 'Update the app to view comments for this content.'
            : 'Could not load comments. Please try again.');
          console.error('Load comments failed:', error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, entityId, entityType, reloadVersion]);

  const handleLoadMore = async () => {
    if (!nextCursor || !hasMore || loadingMore) return;
    setLoadingMore(true);
    setPaginationError('');
    try {
      const page = await listComments(
        { contentType: entityType, contentId: entityId },
        { limit: 50, cursor: nextCursor },
      );
      setComments((previous) => {
        const existingIds = new Set(previous.map((comment) => comment.id));
        return [...previous, ...page.comments.filter((comment) => !existingIds.has(comment.id))];
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error('Load more comments failed:', error);
      setPaginationError(error?.response?.status === 426
        ? 'Update the app to load more comments.'
        : 'Could not load more comments. Try again.');
    } finally {
      setLoadingMore(false);
    }
  };

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

  // ── handle reply/edit selection ──
  const handleReply = useCallback((targetComment, parentComment) => {
    const author = normalizeAuthor(targetComment);
    setEditingComment(null);
    setReplyTo({ comment: targetComment, parent: parentComment || null });
    setNewComment(`@${author.username} `);
    textareaRef.current?.focus();
  }, []);

  const handleEdit = useCallback((comment, parentId = null) => {
    setReplyTo(null);
    setEditingComment({ comment, parentId });
    setNewComment(comment.text || comment.body || '');
    textareaRef.current?.focus();
  }, []);

  const cancelReply = () => {
    setReplyTo(null);
    setEditingComment(null);
    setNewComment('');
  };

  // ── post comment / reply / edit ──
  const handlePost = async (e) => {
    if (e) e.preventDefault();
    const text = newComment.trim();
    if ((!text && selectedMedia.length === 0) || !user || posting || (editingComment && !text)) return;

    const target = { contentType: entityType, contentId: entityId };
    setPosting(true);
    setLoadError('');
    setActionError('');
    try {
      if (editingComment) {
        const saved = await editComment(target, editingComment.comment.id, {
          text,
          parentId: editingComment.parentId,
        });
        const updated = {
          ...editingComment.comment,
          ...(saved || {}),
          text: saved?.text ?? text,
          is_edited: true,
        };
        if (editingComment.parentId) {
          const root = comments.find((comment) => comment.id === editingComment.parentId);
          root?.__replaceReply?.(updated);
          setComments((previous) => previous.map((comment) => comment.id === editingComment.parentId
            ? { ...comment, replies: Array.isArray(comment.replies)
              ? comment.replies.map((reply) => reply.id === updated.id ? updated : reply)
              : comment.replies }
            : comment));
        } else {
          setComments((previous) => previous.map((comment) => comment.id === updated.id ? updated : comment));
        }
      } else {
        const rootComment = replyTo ? (replyTo.parent || replyTo.comment) : null;
        const parentId = rootComment?.id || null;
        const mediaFingerprint = selectedMedia.map(({ file }) => `${file.name}:${file.size}:${file.lastModified}`).join('|');
        const ulid = isCommentsV2Enabled()
          ? getPendingCommentUlid(target, user.id, `${text}\n${mediaFingerprint}`, parentId)
          : undefined;
        const saved = await createComment(target, {
          text,
          parentId,
          ulid,
          files: selectedMedia.map(({ file }) => file),
          attachmentKinds: selectedMedia.map(({ kind }) => kind),
        });
        setTotalCount((count) => {
          if (typeof count === 'number') return count + 1;
          return isCommentsV2Enabled() ? count : comments.length + 1;
        });
        if (isCommentsV2Enabled()) {
          clearPendingCommentUlid(target, user.id, parentId, ulid);
        }
        const persisted = {
          ...(saved || {}),
          id: String(saved?.id || saved?.ulid || ulid || ''),
          user_id: saved?.user_id || user.id,
          author_name: saved?.author_name || user.name,
          author_username: saved?.author_username || user.username,
          author_avatar_url: saved?.author_avatar_url || user.avatar_url,
          author_avatar: saved?.author_avatar_url || user.avatar_url,
          created_at: saved?.created_at || new Date().toISOString(),
          text: saved?.text ?? text,
          status: saved?.status || 'ACTIVE',
          reply_count: Number(saved?.reply_count || 0),
        };
        if (rootComment) {
          if (rootComment.__addReply) rootComment.__addReply(persisted);
          setComments((previous) => previous.map((comment) => comment.id === rootComment.id
            ? { ...comment, reply_count: Number(comment.reply_count || 0) + 1 }
            : comment));
        } else {
          setComments((previous) => [persisted, ...previous]);
        }
      }
      setNewComment('');
      setReplyTo(null);
      setEditingComment(null);
      selectedMedia.forEach(({ preview }) => {
        URL.revokeObjectURL(preview);
        mediaPreviewUrlsRef.current.delete(preview);
      });
      setSelectedMedia([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Comment action failed:', err);
      setActionError(err?.response?.status === 426
        ? 'Update the app to manage comments for this content.'
        : (err?.response?.data?.message || 'Could not save your comment. Please try again.'));
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = (id, parentId = null) => {
    setTotalCount((count) => {
      if (typeof count === 'number') return Math.max(0, count - 1);
      return isCommentsV2Enabled() ? count : Math.max(0, comments.length - 1);
    });
    if (parentId) {
      const root = comments.find((comment) => comment.id === parentId);
      root?.__removeReply?.(id);
      setComments((previous) => previous.map((comment) => comment.id === parentId
        ? { ...comment, reply_count: Math.max(0, Number(comment.reply_count || 0) - 1) }
        : comment));
      return;
    }
    setComments((previous) => previous.filter((comment) => comment.id !== id));
  };

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
              ({typeof totalCount === 'number' ? totalCount : (isCommentsV2Enabled() ? '—' : comments.length)})
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
          ) : loadError ? (
            <div role="alert" style={{ margin: 24, padding: 16, border: '1px solid var(--border)', borderRadius: 12, color: 'var(--sub)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 12px' }}>{loadError}</p>
              <button onClick={() => setReloadVersion((value) => value + 1)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>Try again</button>
            </div>
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
            Array.isArray(comments) && comments.map(c => (
              <CommentRow
                key={c.id}
                comment={c}
                currentUser={user}
                entityType={entityType}
                entityId={entityId}
                onDelete={handleDeleteComment}
                onEdit={handleEdit}
                onReply={handleReply}
              />
            ))
          )}
          {!loading && !loadError && hasMore && (
            <div style={{ padding: '8px 16px 16px', textAlign: 'center' }}>
              {paginationError && <p role="alert" style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{paginationError}</p>}
              <button type="button" onClick={handleLoadMore} disabled={loadingMore} style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '8px 14px', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: loadingMore ? 'default' : 'pointer' }}>{loadingMore ? 'Loading…' : 'Load more comments'}</button>
            </div>
          )}
        </div>

        {/* ── Reply/edit context banner ── */}
        {(replyTo || editingComment) && (
          <div style={{
            padding: '8px 16px', background: 'var(--s2)',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500 }}>
              {editingComment ? 'Editing your comment' : <>Replying to <strong style={{ color: 'var(--text)' }}>@{normalizeAuthor(replyTo.comment).username}</strong></>}
            </span>
            <button
              onClick={cancelReply}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', padding: 2, display: 'flex' }}
              aria-label={editingComment ? 'Cancel edit' : 'Cancel reply'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Input area ── */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', flexShrink: 0 }}>
          {actionError && <p role="alert" style={{ color: '#ef4444', fontSize: 12, margin: '0 0 8px' }}>{actionError}</p>}
          {selectedMedia.length > 0 && <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
            {selectedMedia.map(({ file, preview, kind }, index) => <div key={`${file.name}-${file.lastModified}-${index}`} style={{ position: 'relative', flex: '0 0 64px' }}>
              <img src={preview} alt={`${kind} preview`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
              <button type="button" onClick={() => removeSelectedMedia(index)} aria-label="Remove attachment" style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, border: 0, borderRadius: '50%', background: '#1f2937', color: '#fff', cursor: 'pointer' }}>×</button>
            </div>)}
          </div>}
          {user ? (
            <form onSubmit={handlePost} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input ref={fileInputRef} type="file" accept="image/gif,image/png,image/jpeg,image/webp" multiple hidden onChange={handleMediaSelected} />
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
                {isCommentsV2Enabled() && !editingComment && <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach photo or GIF" title="Attach photo or GIF" style={{ border: 0, background: 'transparent', color: 'var(--sub)', cursor: 'pointer', padding: 2, fontSize: 18, lineHeight: 1 }}>＋</button>}
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
                  disabled={(!newComment.trim() && selectedMedia.length === 0) || posting}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', cursor: (newComment.trim() || selectedMedia.length) ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                    background: (newComment.trim() || selectedMedia.length)
                      ? 'linear-gradient(135deg, #00B4D8, #9333EA)'
                      : 'var(--border)',
                    color: (newComment.trim() || selectedMedia.length) ? '#fff' : 'var(--sub)',
                  }}
                  className={(newComment.trim() || selectedMedia.length) ? 'hover:scale-105 active:scale-95' : ''}
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
