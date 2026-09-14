'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '../ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Share2, Send, Bookmark, ExternalLink, Play, FileText, Code2, BookOpen, MapPin, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { startGraphQLDirectMessage } from '../../api/graphql';
import { useAuth } from '../../context/AuthContext';
import AddToSnippetModal from './AddToSnippetModal';
import ShareSheet from '../ui/ShareSheet';

export default function StoryModal({ userStories, onClose, onNextGroup, onPrevGroup }) {
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [activeLocationModal, setActiveLocationModal] = useState(null);
  const [activeLinkModal, setActiveLinkModal] = useState(null);

  const timerRef = useRef(null);
  const duration = 5500; // 5.5 seconds per story

  // Reset indices whenever story payload changes (e.g. transitioning between users)
  useEffect(() => {
    setActiveIndex(0);
    setProgress(0);
  }, [userStories]);

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
        } else if (onNextGroup) {
          onNextGroup();
        } else {
          onClose();
        }
      } else {
        setProgress(newProgress);
      }
    }, 30);

    return () => clearInterval(timerRef.current);
  }, [activeIndex, userStories, onClose, onNextGroup, isPaused, progress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowRight') {
        if (activeIndex < userStories.length - 1) {
          setActiveIndex(prev => prev + 1);
          setProgress(0);
        } else if (onNextGroup) {
          onNextGroup();
        } else {
          onClose?.();
        }
      } else if (e.key === 'ArrowLeft') {
        if (activeIndex > 0) {
          setActiveIndex(prev => prev - 1);
          setProgress(0);
        } else if (onPrevGroup) {
          onPrevGroup();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, userStories, onClose, onNextGroup, onPrevGroup]);

  if (!userStories || userStories.length === 0) return null;

  const currentStory = userStories[activeIndex] || userStories[0];
  const storyOwnerUsername = currentStory?.username || currentStory?.user?.username;
  const isOwnStory = Boolean(
    user && (
      currentStory?.isOwn ||
      (storyOwnerUsername && user.username?.toLowerCase() === storyOwnerUsername?.toLowerCase())
    )
  );

  const handleNext = () => {
    if (activeIndex < userStories.length - 1) {
      setActiveIndex(prev => prev + 1);
      setProgress(0);
    } else if (onNextGroup) {
      onNextGroup();
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      setProgress(0);
    } else if (onPrevGroup) {
      onPrevGroup();
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
      const attachment = {
        story_id: currentStory.id,
        media_snapshot_url: mediaSnapshot,
        story_owner_id: currentStory.user?.id || currentStory.user_id,
        story_owner_username: targetUsername,
        caption: currentStory.caption || null,
      };

      try {
        await startGraphQLDirectMessage({
          toUsername: targetUsername,
          type: 'story_reply',
          message: replyText.trim(),
          contentAttachment: attachment,
        });
      } catch (err) {
        console.warn('[StoryModal GraphQL] startDirectMessage falling back to REST:', err?.message);
        await api.post('/direct/new', {
          to_username: targetUsername,
          type: 'story_reply',
          message: replyText.trim(),
          content_attachment: attachment,
        });
      }

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

  const interactiveMetadata = (() => {
    if (!currentStory?.interactive_metadata) return null;
    if (typeof currentStory.interactive_metadata === 'object') {
      return currentStory.interactive_metadata;
    }
    try {
      return JSON.parse(currentStory.interactive_metadata);
    } catch {
      return null;
    }
  })();

  const locations = Array.isArray(interactiveMetadata?.locations) ? interactiveMetadata.locations : [];
  const links = Array.isArray(interactiveMetadata?.links) ? interactiveMetadata.links : [];

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
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020408', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', aspectRatio: '9 / 16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* If standard image/video story */}
          {currentStory.content_url && (
            <img
              key={currentStory.id}
              src={currentStory.content_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}

          {/* Interactive Location Sticker Hitboxes */}
          {locations.map((loc, idx) => {
            if (!loc.box) return null;
            return (
              <div
                key={loc.id || `loc_${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(true);
                  setActiveLocationModal(loc);
                }}
                className="cursor-pointer group select-none transition-transform active:scale-95"
                style={{
                  position: 'absolute',
                  left: `${(loc.box.x / 1080) * 100}%`,
                  top: `${(loc.box.y / 1920) * 100}%`,
                  width: `${(loc.box.width / 1080) * 100}%`,
                  height: `${(loc.box.height / 1920) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${loc.box.rotation || 0}deg)`,
                  zIndex: 25,
                  borderRadius: '9999px',
                }}
                title={`Location: ${loc.name}`}
              >
                {/* Subtle Interactive Ring / Ripple when hovered */}
                <div className="w-full h-full rounded-full border border-rose-400/0 group-hover:border-rose-400/80 group-hover:bg-rose-500/15 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-200" />
              </div>
            );
          })}

          {/* Interactive Link Sticker Hitboxes */}
          {links.map((lnk, idx) => {
            if (!lnk.box) return null;
            return (
              <div
                key={`link_${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(true);
                  setActiveLinkModal(lnk);
                }}
                className="cursor-pointer group select-none transition-transform active:scale-95"
                style={{
                  position: 'absolute',
                  left: `${(lnk.box.x / 1080) * 100}%`,
                  top: `${(lnk.box.y / 1920) * 100}%`,
                  width: `${(lnk.box.width / 1080) * 100}%`,
                  height: `${(lnk.box.height / 1920) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${lnk.box.rotation || 0}deg)`,
                  zIndex: 25,
                  borderRadius: '9999px',
                }}
                title={`Visit Link: ${lnk.url}`}
              >
                {/* Subtle Interactive Ring / Ripple when hovered */}
                <div className="w-full h-full rounded-full border border-indigo-400/0 group-hover:border-indigo-400/80 group-hover:bg-indigo-500/15 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-200" />
              </div>
            );
          })}

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

      {/* Location Interactive Detail Sheet */}
      {activeLocationModal && (
        <div
          onClick={() => {
            setActiveLocationModal(null);
            setIsPaused(false);
          }}
          className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-gray-900 border border-white/10 p-5 text-white flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-rose-500/20 text-rose-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
                    {activeLocationModal.name}
                  </h3>
                  <p className="text-[11px] text-gray-400">Tagged Location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveLocationModal(null);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              View this tagged place on Google Maps to explore directions and local campus spots.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const query = activeLocationModal.latitude && activeLocationModal.longitude
                    ? `${activeLocationModal.latitude},${activeLocationModal.longitude}`
                    : encodeURIComponent(activeLocationModal.name);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
                  setActiveLocationModal(null);
                  setIsPaused(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Interactive Detail Sheet */}
      {activeLinkModal && (
        <div
          onClick={() => {
            setActiveLinkModal(null);
            setIsPaused(false);
          }}
          className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-gray-900 border border-white/10 p-5 text-white flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
                    {activeLinkModal.text || 'External Link'}
                  </h3>
                  <p className="text-[11px] text-indigo-300 truncate max-w-[200px]">
                    {activeLinkModal.url}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveLinkModal(null);
                  setIsPaused(false);
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              This link takes you to an external website. Always ensure you trust the destination.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.open(activeLinkModal.url, '_blank', 'noopener,noreferrer');
                  setActiveLinkModal(null);
                  setIsPaused(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Website</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>,
    document.body
  );
}
