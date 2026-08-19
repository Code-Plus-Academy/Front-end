'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '../ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Share2, Send, Bookmark, ExternalLink, Play, FileText, Code2, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import AddToSnippetModal from './AddToSnippetModal';
import ShareSheet from '../ui/ShareSheet';

export default function StoryModal({ userStories, onClose }) {
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  const timerRef = useRef(null);
  const duration = 5500; // 5.5 seconds per story

  useEffect(() => {
    if (!userStories || userStories.length === 0) return;
    if (isPaused) {
      clearInterval(timerRef.current);
      return;
    }

    const startTime = Date.now() - (progress / 100) * duration;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / duration) * 100;
      
      if (newProgress >= 100) {
        clearInterval(timerRef.current);
        if (activeIndex < userStories.length - 1) {
          setActiveIndex(prev => prev + 1);
          setProgress(0);
        } else {
          onClose();
        }
      } else {
        setProgress(newProgress);
      }
    }, 30);

    return () => clearInterval(timerRef.current);
  }, [activeIndex, userStories, onClose, isPaused]);

  if (!userStories || userStories.length === 0) return null;

  const currentStory = userStories[activeIndex];
  const storyOwnerUsername = currentStory.username || currentStory.user?.username;
  const isOwnStory = Boolean(
    user && (
      currentStory.isOwn ||
      (storyOwnerUsername && user.username?.toLowerCase() === storyOwnerUsername?.toLowerCase())
    )
  );

  const handleNext = () => {
    if (activeIndex < userStories.length - 1) {
      setActiveIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || sendingReply) return;
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }

    setSendingReply(true);
    try {
      const targetUsername = storyOwnerUsername;
      const mediaSnapshot = currentStory.content_url || currentStory.media_url || currentStory.shared_content?.thumbnail_url || '';
      
      await api.post('/direct/new', {
        to_username: targetUsername,
        type: 'story_reply',
        message: replyText.trim(),
        content_attachment: {
          story_id: currentStory.id,
          media_snapshot_url: mediaSnapshot,
          story_owner_id: currentStory.user?.id || currentStory.user_id,
          story_owner_username: targetUsername,
          caption: currentStory.caption || null,
        },
      });

      toast.success(`Reply sent to @${targetUsername}!`);
      setReplyText('');
      setIsPaused(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSharedContentClick = (e) => {
    e.stopPropagation();
    const type = currentStory.shared_content_type;
    const content = currentStory.shared_content;
    const contentId = currentStory.shared_content_id;

    if (type === 'notes' || type === 'resource') {
      window.location.href = `/notes/resource/${content?.slug || contentId}`;
    } else if (type === 'article') {
      window.location.href = `/articles/${content?.slug || contentId}`;
    } else if (type === 'short') {
      window.location.href = `/shorts`;
    } else {
      window.location.href = `/posts/${content?.slug || contentId}`;
    }
  };

  return createPortal(
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.05, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#04070d',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Progress Bars */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12,
        display: 'flex', gap: 4, zIndex: 10000,
      }}>
        {userStories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#00dbe9',
                width: i < activeIndex ? '100%' : (i === activeIndex ? `${progress}%` : '0%'),
                transition: i === activeIndex ? 'width 0.05s linear' : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 24, left: 16, right: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 10000, color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={34} src={currentStory.user_avatar || currentStory.user?.avatar_url} name={storyOwnerUsername} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display, sans-serif)' }}>
              {storyOwnerUsername}
            </span>
            <span style={{ fontSize: 10.5, opacity: 0.7, fontFamily: 'var(--font-mono, monospace)' }}>
              {currentStory.time_ago || 'Recent Story'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isOwnStory && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
                setSnippetModalOpen(true);
              }}
              style={{
                background: 'rgba(0, 219, 233, 0.15)',
                border: '1px solid rgba(0, 219, 233, 0.4)',
                color: '#00dbe9',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Bookmark size={13} />
              <span>Highlight</span>
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 6,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Story Media & Shared Content View */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020408' }}>
        {/* If standard image/video story */}
        {currentStory.content_url && (
          <img
            key={currentStory.id}
            src={currentStory.content_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}

        {/* If shared content (Add to Story) */}
        {currentStory.shared_content_type && (
          <div
            onClick={handleSharedContentClick}
            style={{
              position: 'absolute',
              maxWidth: 320,
              width: '85%',
              background: 'rgba(13, 19, 31, 0.92)',
              border: '1px solid rgba(0, 219, 233, 0.35)',
              borderRadius: 18,
              padding: 16,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 219, 233, 0.15)',
              cursor: 'pointer',
              zIndex: 8,
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease',
            }}
            className="hover:scale-[1.02]"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                fontFamily: 'var(--font-mono, monospace)',
                color: '#00dbe9',
                background: 'rgba(0, 219, 233, 0.12)',
                padding: '2px 8px',
                borderRadius: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {currentStory.shared_content_type}
              </span>
              <ExternalLink size={13} color="#00dbe9" />
            </div>

            {currentStory.shared_content?.thumbnail_url && (
              <div style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', marginBottom: 10, background: '#000' }}>
                <img
                  src={currentStory.shared_content.thumbnail_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <h4 style={{
              margin: '0 0 6px',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {currentStory.shared_content?.title || 'View shared resource'}
            </h4>

            {currentStory.shared_content?.description && (
              <p style={{
                margin: 0,
                fontSize: 11.5,
                color: '#94a3b8',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {currentStory.shared_content.description}
              </p>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 12,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 11,
              color: '#00dbe9',
              fontWeight: 700,
            }}>
              <span>Tap to open</span>
              <span>→</span>
            </div>
          </div>
        )}
        
        {/* Tap Overlays for Next / Prev Navigation */}
        <div onClick={handlePrev} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 5 }} />
        <div onClick={handleNext} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%', cursor: 'pointer', zIndex: 5 }} />
        
        {currentStory.caption && (
          <div style={{
            position: 'absolute', bottom: 100, left: 20, right: 20,
            textAlign: 'center', color: '#fff', fontSize: 14,
            textShadow: '0 2px 8px rgba(0,0,0,0.9)', zIndex: 6,
            background: 'rgba(0, 0, 0, 0.4)', padding: '6px 14px', borderRadius: 12,
            backdropFilter: 'blur(6px)', width: 'fit-content', margin: '0 auto',
          }}>
            {currentStory.caption}
          </div>
        )}
      </div>

      {/* Interactive Reply Footer (Story Reply via DM) */}
      <div style={{
        padding: '14px 18px 36px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
        display: 'flex', alignItems: 'center', gap: 12,
        zIndex: 10000,
      }}>
        {!isOwnStory ? (
          <form
            onSubmit={handleSendReply}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 24,
              padding: '2px 4px 2px 14px',
            }}
          >
            <input
              type="text"
              placeholder={`Reply to @${storyOwnerUsername}…`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => !replyText && setIsPaused(false)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sendingReply}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: replyText.trim() ? '#00dbe9' : 'transparent',
                border: 'none',
                color: replyText.trim() ? '#020617' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: replyText.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        ) : (
          <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            Your Story · Viewed by followers
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, color: '#fff', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIsPaused(true);
              setShareSheetOpen(true);
            }}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
          >
            <Share2 size={22} />
          </button>
        </div>
      </div>

      {/* Add To Snippet (Highlight) Modal */}
      {snippetModalOpen && (
        <AddToSnippetModal
          isOpen={snippetModalOpen}
          onClose={() => {
            setSnippetModalOpen(false);
            setIsPaused(false);
          }}
          storyId={currentStory.id}
          currentStoryUrl={currentStory.content_url || currentStory.media_url}
        />
      )}

      {/* Share Sheet */}
      <ShareSheet
        isOpen={shareSheetOpen}
        onClose={() => {
          setShareSheetOpen(false);
          setIsPaused(false);
        }}
        contentType="post"
        contentId={currentStory?.id}
        contentTitle={`${storyOwnerUsername}'s Story`}
        contentThumbnail={currentStory?.content_url || currentStory?.media_url}
        contentAuthor={storyOwnerUsername}
      />
    </motion.div>,
    document.body
  );
}
