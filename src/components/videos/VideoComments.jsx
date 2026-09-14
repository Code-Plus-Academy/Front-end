// frontend/src/components/videos/VideoComments.jsx
// Threaded comments with likes, replies, and live post.

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { DARK as D, LIGHT as L } from '../../styles/tokens';
import api from '../../api/axios';
import {
  getGraphQLVideoComments,
  addGraphQLVideoComment,
  toggleGraphQLVideoCommentLike,
} from '../../api/graphql';
import ClapIcon from '../icons/ClapIcon';

function useT() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const base = isDark ? D : L;
  return {
    isDark,
    bg:       isDark ? D.card       : L.surface,
    s2:       isDark ? D.bg3        : L.s2,
    border:   isDark ? D.cardBorder : 'rgba(0,0,0,0.08)',
    text:     base.txt,
    sub:      base.txt2,
    muted:    base.txt3,
    purple:   base.accent,
    purpleDim:isDark ? 'rgba(138,43,255,0.18)' : 'rgba(110,0,255,0.10)',
    inputBg:  isDark ? 'rgba(255,255,255,0.04)' : '#F0F1F4',
    inputBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
  };
}

function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function Avatar({ src, name, size = 32 }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#8A2BFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function CommentItem({ comment, videoId, t, user, onReplyPosted }) {
  const [liked, setLiked]         = useState(comment.viewer_liked || false);
  const [likes, setLikes]         = useState(comment.likes_count  || 0);
  const [showReplies, setShow]    = useState(false);
  const [replies, setReplies]     = useState([]);
  const [loadingR, setLoadingR]   = useState(false);
  const [replying, setReplying]   = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting]     = useState(false);

  const loadReplies = async () => {
    if (loadingR) return;
    if (comment.replies && comment.replies.length > 0) {
      setReplies(comment.replies);
      return;
    }
    setLoadingR(true);
    try {
      const r = await api.get(`/videos/${videoId}/comments/${comment.id}/replies`);
      setReplies(r.data.replies || []);
    } catch {}
    setLoadingR(false);
  };

  const toggleReplies = () => {
    if (!showReplies && !replies.length) loadReplies();
    setShow(p => !p);
  };

  const handleLike = async () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikes(l => l + (next ? 1 : -1));
    try {
      await toggleGraphQLVideoCommentLike(comment.id);
    } catch {
      try {
        await api.post(`/videos/${videoId}/comments/${comment.id}/like`);
      } catch {
        setLiked(!next);
        setLikes(l => l + (next ? -1 : 1));
      }
    }
  };

  const postReply = async () => {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    try {
      const newComment = await addGraphQLVideoComment(videoId, {
        text: replyText.trim(),
        parentId: comment.id,
      });
      setReplies(prev => [...prev, newComment]);
      setReplyText('');
      setReplying(false);
      setShow(true);
      onReplyPosted?.();
    } catch (err) {
      console.warn('[VideoComments GraphQL] Post reply falling back to REST:', err?.message);
      try {
        const r = await api.post(`/videos/${videoId}/comments`, { text: replyText.trim(), parent_id: comment.id });
        setReplies(prev => [...prev, r.data.comment]);
        setReplyText('');
        setReplying(false);
        setShow(true);
        onReplyPosted?.();
      } catch {}
    }
    setPosting(false);
  };

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
      <Avatar src={comment.author_avatar} name={comment.author_name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "'Geist',sans-serif" }}>{comment.author_name}</span>
          <span style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>{timeAgo(comment.created_at)}</span>
        </div>

        {/* Text */}
        <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.6, margin: '0 0 8px', wordBreak: 'break-word', fontFamily: "'Geist',sans-serif" }}>
          {comment.text}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: -6 }}>
          <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', color: liked ? t.purple : t.muted, display: 'flex', alignItems: 'center', gap: 3, padding: 0 }}>
            <ClapIcon size={16} color="currentColor" filled={liked} />
            {likes > 0 && <span style={{ fontSize: 11, fontFamily: "'Geist',sans-serif" }}>{likes}</span>}
          </button>
          {user && (
            <button onClick={() => setReplying(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 99, color: t.muted, fontSize: 12, fontFamily: "'Geist',sans-serif", transition: 'color 0.15s' }}>
              Reply
            </button>
          )}
          {comment.reply_count > 0 && (
            <button onClick={toggleReplies}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 99, color: t.purple, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
              {showReplies ? '▲ hide' : `▼ ${comment.reply_count} repl${comment.reply_count === 1 ? 'y' : 'ies'}`}
            </button>
          )}
        </div>

        {/* Reply input */}
        {replying && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Avatar src={user?.avatar_url} name={user?.name} size={28} />
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              <input
                autoFocus
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postReply()}
                placeholder="Add a reply…"
                style={{ flex: 1, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '7px 12px', fontSize: 13, color: t.text, outline: 'none', fontFamily: "'Geist',sans-serif" }}
              />
              <button onClick={postReply} disabled={posting || !replyText.trim()}
                style={{ background: t.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (!replyText.trim() || posting) ? 0.5 : 1 }}>
                {posting ? '…' : '↑'}
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {showReplies && (
          <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${t.purple}30` }}>
            {loadingR
              ? <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
              : replies.map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <Avatar src={r.author_avatar} name={r.author_name} size={24} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: "'Geist',sans-serif" }}>{r.author_name}</span>
                        <span style={{ fontSize: 10, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>{timeAgo(r.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: t.sub, lineHeight: 1.55, margin: 0, wordBreak: 'break-word' }}>{r.text}</p>
                    </div>
                  </div>
                ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideoComments({ videoId }) {
  const t = useT();
  const { user } = useAuth();
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [posting, setPosting]     = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    setLoading(true);

    const loadComments = async () => {
      try {
        const commentsList = await getGraphQLVideoComments(videoId, { limit: 50 });
        if (!cancelled) setComments(commentsList || []);
      } catch (err) {
        if (cancelled) return;
        console.warn('[VideoComments GraphQL] Falling back to REST:', err?.message);
        api.get(`/videos/${videoId}/comments`)
          .then(r => { if (!cancelled) setComments(r.data.comments || []); })
          .catch(() => {})
          .finally(() => { if (!cancelled) setLoading(false); });
        return;
      }
      if (!cancelled) setLoading(false);
    };

    loadComments();
    return () => { cancelled = true; };
  }, [videoId]);

  const post = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const newComment = await addGraphQLVideoComment(videoId, { text: text.trim() });
      setComments(prev => [newComment, ...prev]);
      setText('');
    } catch (err) {
      console.warn('[VideoComments GraphQL] Post comment falling back to REST:', err?.message);
      try {
        const r = await api.post(`/videos/${videoId}/comments`, { text: text.trim() });
        setComments(prev => [r.data.comment, ...prev]);
        setText('');
      } catch {}
    }
    setPosting(false);
  };

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 16, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>
          Comments
        </span>
        {!loading && (
          <span style={{ background: t.purpleDim, border: `1px solid ${t.purple}30`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: t.purple, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
            {comments.length}
          </span>
        )}
      </div>

      {/* Input */}
      {user && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <Avatar src={user.avatar_url} name={user.name} size={36} />
          <div style={{ flex: 1, display: 'flex', gap: 8 }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && post()}
              placeholder="Add a comment… (Ctrl+Enter to post)"
              rows={2}
              style={{
                flex: 1, background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                borderRadius: 10, padding: '10px 14px', fontSize: 13, color: t.text,
                outline: 'none', resize: 'none', fontFamily: "'Geist',sans-serif",
                lineHeight: 1.5, transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = t.purple}
              onBlur={e => e.target.style.borderColor = t.inputBorder}
            />
            <button onClick={post} disabled={posting || !text.trim()}
              style={{
                background: `linear-gradient(135deg,#00B4D8,${t.purple})`,
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '0 18px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', opacity: (!text.trim() || posting) ? 0.5 : 1,
                transition: 'opacity 0.15s', alignSelf: 'stretch',
              }}>
              {posting ? '…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Comment list */}
      <div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton" style={{ height: 12, width: '30%' }} />
                  <div className="skeleton" style={{ height: 12, width: '80%' }} />
                  <div className="skeleton" style={{ height: 12, width: '60%' }} />
                </div>
              </div>
            ))
          : comments.length === 0
            ? <p style={{ color: t.muted, fontSize: 13, fontFamily: "'Geist',sans-serif", textAlign: 'center', padding: '24px 0' }}>
                No comments yet. Be the first!
              </p>
            : comments.map(c => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  videoId={videoId}
                  t={t}
                  user={user}
                  onReplyPosted={() => {}}
                />
              ))
        }
      </div>
    </div>
  );
}
