import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

/**
 * Format timestamp into human-readable relative time (e.g. 5m, 2h, 3d)
 */
function timeAgo(date) {
  if (!date) return '';
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
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
        className={`fixed bg-[#121214] border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out pointer-events-auto z-[9999]
          /* Mobile: Bottom Sheet */
          bottom-0 left-0 right-0 h-[70vh] rounded-t-3xl border-t p-6 pb-safe
          ${animate ? 'translate-y-0' : 'translate-y-full'}
          
          /* Desktop: Right Side Panel */
          md:top-0 md:right-0 md:left-auto md:bottom-0 md:w-[400px] md:h-full md:rounded-none md:border-l md:border-t-0 md:p-6
          md:translate-y-0 ${animate ? 'md:translate-x-0' : 'md:translate-x-full'}
        `}
      >
        {/* Mobile Drag handle */}
        <div 
          onClick={onClose}
          aria-label="Close comments"
          className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 cursor-pointer hover:bg-white/40 transition-colors md:hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg text-white">
            Comments <span className="text-white/40 text-sm">({comments.length})</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/40 hover:text-white transition-colors p-1 rounded-lg focus-visible:outline-2 focus-visible:outline-cyan-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 mb-4 no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white/80" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-sm text-white/40 font-body">
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map((c) => {
              const commentAuthor = c.user || { name: 'Anonymous', username: 'anonymous' };
              return (
                <div key={c.id} className="flex gap-3 items-start animate-fade-in">
                  <img
                    src={commentAuthor.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${commentAuthor.username}`}
                    alt=""
                    className="w-8 h-8 rounded-full flex-shrink-0 border border-white/10 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display font-semibold text-[13px] text-white truncate">
                        {commentAuthor.name || commentAuthor.username}
                      </span>
                      <span className="font-mono text-[10px] text-white/40 flex-shrink-0">
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <p className="font-body text-[13px] text-white/80 leading-relaxed word-break-all whitespace-pre-wrap">
                      {c.text || c.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Fixed Input at bottom */}
        <div className="border-t border-white/5 pt-4 mt-auto">
          {user ? (
            <form onSubmit={handlePost} className="flex gap-3 items-end">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt=""
                className="w-8 h-8 rounded-full flex-shrink-0 mb-1 object-cover border border-white/10"
              />
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 flex gap-2 items-end focus-within:border-cyan-500/50 transition-colors">
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
                  style={{ height: 'auto', maxHeight: '80px' }}
                  className="flex-1 bg-transparent border-none outline-none font-body text-[13px] text-white resize-none max-h-20 leading-relaxed overflow-y-auto"
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || posting}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                    newComment.trim()
                      ? 'bg-gradient-to-tr from-[#00B4D8] to-[#9333EA] text-white shadow-md'
                      : 'bg-white/10 text-white/30'
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
            <div className="text-center py-3 bg-white/5 rounded-xl border border-white/10">
              <a
                href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
                className="font-display font-semibold text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Log in to comment
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
