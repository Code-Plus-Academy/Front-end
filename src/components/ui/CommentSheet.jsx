import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

/**
 * Format timestamp into human-readable relative time (e.g. 5m, 2h, 3d)
 */
function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

// ─── Comment Skeleton Loader for Premium UX ───────────────────────────────────
function CommentSkeleton() {
  return (
    <div className="flex gap-3 items-start p-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-[var(--border-bright)] opacity-20 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-24 bg-[var(--border-bright)] opacity-20 rounded" />
          <div className="h-2 w-8 bg-[var(--border-bright)] opacity-10 rounded" />
        </div>
        <div className="h-3 w-full bg-[var(--border-bright)] opacity-15 rounded mb-1.5" />
        <div className="h-3 w-[75%] bg-[var(--border-bright)] opacity-15 rounded" />
      </div>
    </div>
  );
}

export default function CommentSheet({ isOpen, onClose, entityId, entityType = 'post', user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  const sheetRef = useRef(null);
  const textareaRef = useRef(null);

  // Manage transition mount/unmount states
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Wait for a frame to trigger the transition CSS
      const timer = setTimeout(() => setAnimate(true), 20);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  const handleTransitionEnd = () => {
    if (!isOpen) {
      setShouldRender(false);
    }
  };

  // Fetch comments
  useEffect(() => {
    if (!isOpen || !entityId) return;
    setLoading(true);
    const endpoint = entityType === 'video' ? `/videos/${entityId}/comments` : `/posts/${entityId}/comments`;
    api.get(`${endpoint}?limit=50`)
      .then(r => setComments(r.data.comments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, entityId, entityType]);

  // Handle keyboard close (Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen || !shouldRender || !sheetRef.current) return;

    // Focus the textarea on open
    textareaRef.current?.focus();

    const handleFocusTrap = (e) => {
      if (e.key !== 'Tab') return;

      const focusable = sheetRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          lastEl.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastEl) {
          firstEl.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleFocusTrap);
    return () => window.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen, shouldRender]);

  const handlePost = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || !user || posting) return;
    setPosting(true);
    try {
      const endpoint = entityType === 'video' ? `/videos/${entityId}/comments` : `/posts/${entityId}/comments`;
      const payload = entityType === 'video' ? { text: newComment } : { body: newComment };
      const res = await api.post(endpoint, payload);
      if (res.data.comment) {
        setComments(prev => [res.data.comment, ...prev]);
        setNewComment('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-none">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out pointer-events-auto z-[9998] ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Main Sheet Container */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        onTransitionEnd={handleTransitionEnd}
        style={{
          background: 'color-mix(in srgb, var(--surface) 97%, transparent)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'var(--border)',
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`fixed shadow-2xl flex flex-col pointer-events-auto z-[9999] bottom-0 left-0 right-0 h-[70vh] rounded-t-3xl border-t p-6 pb-safe ${
          animate ? 'translate-y-0' : 'translate-y-full'
        } md:top-0 md:right-0 md:left-auto md:bottom-0 md:w-[400px] md:h-full md:rounded-none md:border-l md:border-t-0 md:p-6 md:translate-y-0 ${
          animate ? 'md:translate-x-0' : 'md:translate-x-full'
        }`}
      >
        {/* Mobile Drag handle */}
        <div 
          onClick={onClose}
          aria-label="Close comments"
          className="w-12 h-1.5 bg-[var(--text)]/10 hover:bg-[var(--text)]/20 rounded-full mx-auto mb-5 cursor-pointer transition-colors md:hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <h3 
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }} 
            className="font-bold text-lg"
          >
            Comments <span className="text-[var(--sub)] font-normal text-sm ml-1.5">({comments.length})</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--sub)] hover:text-[var(--text)] transition-colors p-1.5 rounded-full hover:bg-[var(--s2)] cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable list */}
        <div 
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border-bright) transparent' }}
          className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 mb-4 edm-scroll"
        >
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => <CommentSkeleton key={i} />)}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div 
                style={{ background: 'var(--green-dim)', border: '1px solid var(--green-dim)' }} 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-[var(--green)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }} className="font-bold text-sm mb-1">
                No comments yet
              </h4>
              <p style={{ color: 'var(--sub)' }} className="text-xs max-w-[200px] leading-relaxed">
                Be the first to share your thoughts and start the conversation!
              </p>
            </div>
          ) : (
            comments.map((c) => {
              const commentAuthor = c.user || { name: 'Anonymous', username: 'anonymous' };
              const userColor = commentAuthor.username ? colorForName(commentAuthor.username) : '#00B4D8';
              return (
                <div 
                  key={c.id} 
                  className="flex gap-3 items-start p-3 rounded-2xl hover:bg-[var(--s2)]/40 border border-transparent hover:border-[var(--border)] transition-all duration-200"
                >
                  <img
                    src={commentAuthor.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${commentAuthor.username}`}
                    alt=""
                    style={{ borderColor: `${userColor}40` }}
                    className="w-8 h-8 rounded-full flex-shrink-0 border-2 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span 
                        style={{ color: 'var(--text)' }} 
                        className="font-semibold text-[13px] truncate"
                      >
                        {commentAuthor.name || commentAuthor.username}
                      </span>
                      <span 
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--sub)' }} 
                        className="text-[9px] flex-shrink-0"
                      >
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <p 
                      style={{ color: 'var(--text)' }} 
                      className="text-[13px] opacity-90 leading-relaxed word-break-all whitespace-pre-wrap"
                    >
                      {c.text || c.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Fixed Input at bottom */}
        <div style={{ borderColor: 'var(--border)' }} className="border-t pt-4 mt-auto flex-shrink-0">
          {user ? (
            <form onSubmit={handlePost} className="flex gap-3 items-end">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt=""
                style={{ borderColor: 'var(--border)' }}
                className="w-8 h-8 rounded-full flex-shrink-0 mb-1 object-cover border"
              />
              <div 
                style={{ 
                  background: 'var(--bg)', 
                  borderColor: 'var(--border)'
                }} 
                className="flex-1 border rounded-2xl p-3 flex gap-2 items-end focus-within:border-[var(--green)]/50 focus-within:shadow-[0_0_0_3px_var(--green-dim)] transition-all duration-200"
              >
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePost();
                    }
                  }}
                  placeholder="Add a comment..."
                  rows={1}
                  style={{ height: 'auto', maxHeight: '80px', background: 'transparent', border: 'none', padding: 0 }}
                  className="flex-1 outline-none font-body text-[13px] text-[var(--text)] resize-none max-h-20 leading-relaxed overflow-y-auto"
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || posting}
                  style={{
                    boxShadow: newComment.trim() ? 'var(--green-glow)' : 'none',
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 ${
                    newComment.trim()
                      ? 'bg-gradient-to-tr from-[#00B4D8] to-[#9333EA] text-white'
                      : 'bg-[var(--border-bright)]/10 text-[var(--sub)]/30'
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          ) : (
            <div 
              style={{ background: 'var(--s2)', borderColor: 'var(--border)' }} 
              className="text-center py-3.5 rounded-xl border"
            >
              <a
                href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
                className="font-semibold text-xs text-[var(--green)] hover:underline transition-all"
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

/**
 * Generate a stable visual brand color for username outlines
 */
function colorForName(name) {
  const colors = ['#00B4D8', '#9333EA', '#00C9B1', '#FF6B6B', '#E8A020', '#22C55E'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
