'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Plus, 
  Link as LinkIcon, 
  Share2, 
  Check, 
  Sparkles,
  MessageSquare,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

let toast = { success: () => {}, error: () => {} };
try {
  toast = require('react-hot-toast').default;
} catch {}

/**
 * High-fidelity Platform SVG Icons
 */
const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 21.95a.75.75 0 0 0 .937.937l4.782-1.388A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm-3.5 6a1 1 0 0 0-1 1v.25c0 1.25.5 2.5 1.5 3.5s2.25 1.5 3.5 1.5H13a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-.5a.5.5 0 0 1-.5-.5v-.5a.5.5 0 0 1 .5-.5H14a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8.5Z" fill="currentColor" />
    <path d="M19.05 4.95A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.84.5 3.57 1.36 5.06L2 22l5.09-1.34A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.05ZM12 20.15c-1.57 0-3.08-.43-4.4-1.24l-.32-.19-3.26.86.87-3.18-.21-.33A8.12 8.12 0 0 1 3.85 12c0-4.5 3.65-8.15 8.15-8.15s8.15 3.65 8.15 8.15c0 4.5-3.65 8.15-8.15 8.15Zm4.5-6.09c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.96-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.36-.77-1.86c-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.02 2.59.12.17 1.76 2.69 4.26 3.77.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.18-.47-.3Z" fill="currentColor"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.016 2c-3.777 0-6.192 2.584-6.192 5.568 0 .86.273 1.95.734 2.766-.462.155-1.11.455-1.282.895-.148.375.05.746.52.922.95.352 1.758.117 2.215-.05.418 1.488 1.492 3.12 3.013 3.492-.476.27-.99.55-1.586.687-.492.113-.789.37-.875.766-.082.378.13.722.586.953 1.055.535 2.535.12 3.867-.281 1.332.402 2.812.816 3.867.281.457-.23.668-.575.586-.953-.086-.395-.383-.652-.875-.766-.598-.137-1.11-.418-1.586-.687 1.52-.371 2.594-2.004 3.012-3.492.457.168 1.266.402 2.215.05.47-.176.668-.547.52-.922-.172-.44-.82-.74-1.281-.895.46-.816.734-1.906.734-2.766 0-2.984-2.414-5.568-6.191-5.568Z"/>
  </svg>
);

function getUserAvatar(u) {
  if (!u) return null;
  const raw = u.avatar_url || u.other_avatar_url || u.other_avatar || u.avatar || u.profile_picture || u.picture || u.image;
  if (raw && typeof raw === 'string' && raw.trim().length > 0 && !raw.includes('undefined') && !raw.includes('null')) {
    return raw.trim();
  }
  const seed = encodeURIComponent(u.username || u.name || 'User');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=6e00ff,00dbe9,3b82f6`;
}

export default function ShareSheet({
  isOpen,
  onClose,
  contentType = 'post',
  contentId,
  contentUrl,
  url,
  contentTitle = '',
  title = '',
  contentThumbnail = null,
  thumbnail_url = null,
  thumbnail = null,
  contentAuthor = '',
  author = '',
  creator_name = '',
}) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingToUser, setSendingToUser] = useState(null);
  const [sentUsers, setSentUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [addingToStory, setAddingToStory] = useState(false);
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const finalTitle = contentTitle || title || '';
  const finalThumbnail = contentThumbnail || thumbnail_url || thumbnail || null;
  const finalAuthor = contentAuthor || author || creator_name || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUser(null);
      setCaption('');
      setSearchQuery('');
    }
  }, [isOpen]);

  const getPathForType = (type) => {
    if (type === 'note' || type === 'notes') return 'notes';
    if (type === 'article' || type === 'articles') return 'articles';
    if (type === 'short' || type === 'shorts') return 'shorts';
    if (type === 'video' || type === 'videos' || type === 'long_video') return 'videos';
    return 'posts';
  };

  // Normalize Content URL
  const normalizedUrl = contentUrl || url || (typeof window !== 'undefined'
    ? `${window.location.origin}/${getPathForType(contentType)}/${contentId}`
    : '');

  // Normalized content type for backend story sharing
  const normalizedContentType = (contentType === 'note' || contentType === 'notes') 
    ? 'notes' 
    : (contentType === 'short' ? 'short' : (contentType === 'article' ? 'article' : (contentType === 'long_video' || contentType === 'video' ? 'long_video' : 'post')));

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // TASK 3: Fetch initial contacts & sort by recent activity (last_message_at / last_interacted_at)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchInitialPeople = async () => {
      setLoadingContacts(true);
      try {
        const myId = user?.id || user?.user_id;
        const [inboxRes, usersRes] = await Promise.allSettled([
          user ? api.get('/direct/inbox') : Promise.reject(),
          api.get('/users?limit=25')
        ]);

        if (!isMounted) return;

        const peopleMap = new Map();

        // 1. Prioritize direct inbox conversations (ordered by recent interactions)
        if (inboxRes.status === 'fulfilled' && Array.isArray(inboxRes.value.data?.conversations)) {
          inboxRes.value.data.conversations.forEach((c, idx) => {
            const uid = c.other_user_id || c.id;
            if (uid && String(uid) !== String(myId)) {
              // Parse last interacted timestamp (fallback to recent index rank)
              const rawTime = c.last_message_at || c.updated_at || c.created_at;
              const lastInteracted = rawTime ? new Date(rawTime).getTime() : (Date.now() - idx * 60000);
              
              peopleMap.set(String(uid), {
                id: uid,
                conversation_id: c.id,
                name: c.other_name || c.name || c.username,
                username: c.other_username || c.username,
                avatar_url: c.other_avatar_url || c.other_avatar || c.avatar_url || null,
                is_online: Boolean(c.is_online || c.online || c.other_is_online),
                last_interacted_at: lastInteracted,
              });
            }
          });
        }

        // 2. Add community users/developers with real profile avatars
        if (usersRes.status === 'fulfilled') {
          const uList = usersRes.value.data?.users || usersRes.value.data?.items || [];
          uList.forEach(u => {
            const uid = u.id || u.user_id;
            if (uid && String(uid) !== String(myId) && !peopleMap.has(String(uid))) {
              peopleMap.set(String(uid), {
                id: uid,
                name: u.name || u.username,
                username: u.username,
                avatar_url: u.avatar_url || u.avatar || null,
                is_online: Boolean(u.is_online || u.online),
                last_interacted_at: u.last_active_at ? new Date(u.last_active_at).getTime() : 0,
              });
            }
          });
        }

        // Sort by most recent interaction first, then online status
        const sorted = Array.from(peopleMap.values()).sort((a, b) => {
          if (b.last_interacted_at !== a.last_interacted_at) {
            return b.last_interacted_at - a.last_interacted_at;
          }
          return (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0);
        });

        setContacts(sorted);
      } catch (err) {
        console.error('Failed to load contacts for share sheet:', err);
      } finally {
        if (isMounted) setLoadingContacts(false);
      }
    };

    fetchInitialPeople();
    return () => { isMounted = false; };
  }, [isOpen, user]);

  // Live Elasticsearch Search with Debouncing
  useEffect(() => {
    if (!isOpen) return;
    const q = searchQuery.trim();

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const myId = user?.id || user?.user_id;
        
        // 1. Search Elasticsearch people index
        let results = [];
        try {
          const esRes = await api.get('/search/section', {
            params: { type: 'people', q, limit: 20 }
          });
          results = esRes.data?.items || [];
        } catch {}

        // 2. Fallback to SQL user search if ES has no hits
        if (!results.length) {
          try {
            const sqlRes = await api.get('/users/search', {
              params: { q, limit: 20 }
            });
            results = sqlRes.data?.users || sqlRes.data?.items || [];
          } catch {
            const fbRes = await api.get('/users', {
              params: { q, limit: 20 }
            });
            results = fbRes.data?.users || [];
          }
        }

        const mapped = results
          .filter(u => String(u.id || u.user_id) !== String(myId))
          .map(u => ({
            id: u.id || u.user_id,
            name: u.name || u.username,
            username: u.username,
            avatar_url: u.avatar_url || u.avatar || u.profile_picture || null,
            is_online: Boolean(u.is_online || u.online),
          }));

        setSearchResults(mapped);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, isOpen, user]);

  // Active list to render
  const activeList = searchQuery.trim() ? searchResults : contacts;
  const isListLoading = searchQuery.trim() ? isSearching : loadingContacts;

  // Action 1: Send via Direct Message
  const handleSendDM = async (targetUser = null) => {
    const contact = targetUser || selectedUser;
    if (!contact) return;

    if (!user) {
      toast.error('Please sign in to send messages');
      return;
    }

    setIsSending(true);
    setSendingToUser(contact.id);
    try {
      const shareText = caption.trim();
      const shareMessage = shareText
        ? `${shareText}\n${finalTitle ? `"${finalTitle}"\n` : ''}${normalizedUrl}`
        : `${finalTitle ? `"${finalTitle}"\n` : ''}${normalizedUrl}`;

      const payload = {
        receiver_id: contact.id,
        to_username: contact.username,
        text: shareText,
        message: shareMessage,
        body: shareMessage,
        type: contentType === 'video' || contentType === 'long_video'
          ? 'shared_video'
          : (contentType === 'short' ? 'shared_short' : 'shared_post'),
        content_attachment: {
          content_type: normalizedContentType,
          content_id: contentId,
          post_id: contentId,
          title: finalTitle || 'Shared Content',
          url: normalizedUrl,
          media_snapshot_url: finalThumbnail || null,
          author: finalAuthor || null,
          author_id: contentAuthor || null
        }
      };

      if (contact.conversation_id) {
        await api.post(`/direct/${contact.conversation_id}`, payload);
      } else {
        await api.post('/direct/new', {
          to_username: contact.username,
          ...payload
        });
      }

      setSentUsers(prev => new Set(prev).add(contact.id));
      toast.success('Sent! ✈️');
      setSelectedUser(null);
      setCaption('');
      onClose();
    } catch (err) {
      console.error('Failed to send DM:', err);
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
      setSendingToUser(null);
    }
  };

  // Action 2: Add to Story
  const handleAddToStory = async () => {
    if (!user) {
      toast.error('Please sign in to add to your story');
      return;
    }
    setAddingToStory(true);
    try {
      await api.post('/stories', {
        shared_content_type: normalizedContentType,
        shared_content_id: contentId,
        content_url: finalThumbnail || null,
        caption: finalTitle || null,
        type: 'image'
      });
      toast.success('Added to your Story! ✨');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to Story');
    } finally {
      setAddingToStory(false);
    }
  };

  // Action 3: Copy Link
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(normalizedUrl)
        .then(() => {
          setCopied(true);
          toast.success('Link copied to clipboard! 📋');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  // Action 4: WhatsApp
  const handleWhatsApp = () => {
    const text = `${finalTitle ? `${finalTitle}\n` : ''}${normalizedUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Action 5: X (Twitter)
  const handleXTwitter = () => {
    const text = finalTitle ? `${finalTitle} via @codeplusacademy` : 'Check this out on Code Plus Academy!';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(normalizedUrl)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Action 6: Snapchat
  const handleSnapchat = () => {
    window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(normalizedUrl)}`, '_blank', 'noopener,noreferrer');
  };

  // Action 7: Native Share
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: finalTitle || 'Code Plus Academy',
          text: finalTitle || 'Check this out on Code Plus Academy',
          url: normalizedUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-md transition-opacity animate-fadeIn"
      style={{
        zIndex: 9999999, // Elevated above all navigation bars and header overlays
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
    >
      <div 
        ref={sheetRef}
        className="w-full sm:max-w-md border rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all transform animate-slideUp"
        style={{
          background: 'var(--surface, #111827)',
          borderColor: 'var(--border, rgba(255,255,255,0.1))',
          color: 'var(--text, #f9fafb)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.7)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 14px)',
          fontFamily: 'var(--font-body, sans-serif)'
        }}
      >
        {/* Drag handle (Mobile) */}
        <div 
          className="w-12 h-1.5 rounded-full mx-auto mt-3 mb-1 sm:hidden" 
          style={{ background: 'var(--border-bright, var(--border, rgba(255,255,255,0.2)))', opacity: 0.7 }}
        />

        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: 'var(--border, rgba(255,255,255,0.08))' }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            <Share2 size={18} style={{ color: 'var(--primary, #3B7CFF)', flexShrink: 0 }} />
            <h2 
              id="share-sheet-title" 
              className="text-sm font-bold tracking-wide truncate"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-display, var(--font-body))' }}
            >
              {selectedUser ? `Send to @${selectedUser.username}` : 'Share Content'}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedUser && (
              <button
                type="button"
                onClick={() => handleSendDM()}
                disabled={isSending}
                className="px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                style={{
                  background: 'var(--primary, #3B7CFF)',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(59, 124, 255, 0.35)'
                }}
              >
                {isSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close share sheet"
              className="p-1.5 rounded-full transition-colors cursor-pointer"
              style={{ color: 'var(--dim, #9ca3af)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--s2, rgba(255,255,255,0.05))'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--dim, #9ca3af)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Optional Content Preview Badge */}
        {finalTitle && (
          <div className="px-5 pt-3 pb-1">
            <div 
              className="p-2.5 rounded-xl border flex items-center gap-3"
              style={{ background: 'var(--s2, #1f2937)', borderColor: 'var(--border, rgba(255,255,255,0.08))' }}
            >
              {finalThumbnail ? (
                <img src={finalThumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--blue-dim, rgba(59, 124, 255, 0.12))',
                    borderColor: 'var(--border, rgba(255,255,255,0.1))',
                    color: 'var(--primary, #3B7CFF)'
                  }}
                >
                  <Sparkles size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {finalTitle}
                </p>
                <p className="text-[11px] capitalize truncate" style={{ color: 'var(--dim, #9ca3af)' }}>
                  {normalizedContentType} {finalAuthor ? `· by @${finalAuthor}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TASK 1 & TASK 4: TOP SECTION — SHARE TO PLATFORMS (Horizontal Row)       */}
        {/* ========================================================================= */}
        <div 
          className="px-5 pt-3.5 pb-4 border-b"
          style={{ borderColor: 'var(--border, rgba(255,255,255,0.08))' }}
        >
          <div 
            className="text-[11px] font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--dim, #9ca3af)', fontFamily: 'var(--font-mono, monospace)' }}
          >
            Share to Platforms
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {/* 1. Add to Story (Instagram Gradient / Brand Primary) */}
            <button
              type="button"
              onClick={handleAddToStory}
              disabled={addingToStory}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-105 group-active:scale-95 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  boxShadow: '0 4px 15px rgba(220, 39, 67, 0.35)',
                }}
              >
                {addingToStory ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={22} strokeWidth={2.5} />
                )}
              </div>
              <span 
                className="text-[10px] font-medium text-center transition-colors group-hover:opacity-100"
                style={{ color: 'var(--sub, #d1d5db)' }}
              >
                Add to Story
              </span>
            </button>

            {/* 2. WhatsApp (#25D366) */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 group-active:scale-95 transition-all"
                style={{
                  background: '#25D366',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                }}
              >
                <WhatsAppIcon />
              </div>
              <span 
                className="text-[10px] font-medium text-center transition-colors"
                style={{ color: 'var(--sub, #d1d5db)' }}
              >
                WhatsApp
              </span>
            </button>

            {/* 3. X (Twitter) (#000000) */}
            <button
              type="button"
              onClick={handleXTwitter}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div 
                className="w-12 h-12 rounded-full border flex items-center justify-center text-white shadow-md group-hover:scale-105 group-active:scale-95 transition-all"
                style={{
                  background: '#000000',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                }}
              >
                <XTwitterIcon />
              </div>
              <span 
                className="text-[10px] font-medium text-center transition-colors"
                style={{ color: 'var(--sub, #d1d5db)' }}
              >
                X (Twitter)
              </span>
            </button>

            {/* 4. Snapchat (#FFFC00) */}
            <button
              type="button"
              onClick={handleSnapchat}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-md group-hover:scale-105 group-active:scale-95 transition-all"
                style={{
                  background: '#FFFC00',
                  boxShadow: '0 4px 14px rgba(255, 252, 0, 0.3)',
                }}
              >
                <SnapchatIcon />
              </div>
              <span 
                className="text-[10px] font-medium text-center transition-colors"
                style={{ color: 'var(--sub, #d1d5db)' }}
              >
                Snapchat
              </span>
            </button>

            {/* 5. Copy Link (Neutral Gray with Link Icon) */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div 
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95 shadow-sm"
                style={{
                  background: copied ? 'var(--green, #10b981)' : 'var(--s2, #1f2937)',
                  borderColor: copied ? 'var(--green, #10b981)' : 'var(--border, rgba(255,255,255,0.12))',
                  color: copied ? '#ffffff' : 'var(--text, #f9fafb)'
                }}
              >
                {copied ? <Check size={20} strokeWidth={2.5} /> : <LinkIcon size={20} />}
              </div>
              <span 
                className="text-[10px] font-medium text-center transition-colors"
                style={{ color: 'var(--sub, #d1d5db)' }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </button>

            {/* 6. Native Share */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              <div 
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95 shadow-sm"
                style={{
                  background: 'var(--s2, #1f2937)',
                  borderColor: 'var(--border, rgba(255,255,255,0.12))',
                  color: 'var(--text, #f9fafb)'
                }}
              >
                <Share2 size={20} />
              </div>
              <span 
                className="text-[10px] font-medium text-center transition-colors"
                style={{ color: 'var(--sub, #d1d5db)' }}
              >
                More
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TASK 1 & TASK 2 & TASK 3: SEND IN DIRECT MESSAGE SECTION                  */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* TASK 2: Sticky Search Bar Container */}
          <div 
            className="sticky top-0 z-10 px-5 pt-3.5 pb-2.5 backdrop-blur-md"
            style={{ 
              background: 'var(--surface, #111827)',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.06))'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--dim, #9ca3af)', fontFamily: 'var(--font-mono, monospace)' }}
              >
                Send in Direct Message
              </span>
            </div>

            <div className="relative">
              <Search 
                size={14} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2" 
                style={{ color: 'var(--dim, #9ca3af)' }} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends or developers..."
                className="w-full pl-9 pr-8 py-2 text-xs border rounded-xl focus:outline-none transition-all"
                style={{
                  background: 'var(--s2, #1f2937)',
                  borderColor: 'var(--border, rgba(255,255,255,0.1))',
                  color: 'var(--text, #f9fafb)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* User List / Grid (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-5 py-3 no-scrollbar max-h-[300px]">
            {isListLoading ? (
              <div className="grid grid-cols-4 gap-3 py-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                    <div className="w-12 h-12 rounded-full" style={{ background: 'var(--s2, #1f2937)' }} />
                    <div className="w-12 h-2.5 rounded" style={{ background: 'var(--s2, #1f2937)' }} />
                  </div>
                ))}
              </div>
            ) : activeList.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 py-1">
                {activeList.map(contact => {
                  const isSelected = selectedUser?.id === contact.id;
                  const isSent = sentUsers.has(contact.id);
                  const isItemSending = sendingToUser === contact.id;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(prev => prev?.id === contact.id ? null : contact);
                      }}
                      disabled={isItemSending}
                      className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl group text-center focus:outline-none cursor-pointer transition-all ${
                        isSelected ? 'bg-blue-500/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={getUserAvatar(contact)}
                          alt={contact.username || contact.name || 'User'}
                          className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                            isSelected 
                              ? 'ring-2 ring-[#3B7CFF] border-[#3B7CFF] scale-105 shadow-md' 
                              : isSent 
                                ? 'ring-2 ring-emerald-500 border-emerald-500 opacity-90' 
                                : 'border-transparent group-hover:scale-105 shadow-sm'
                          }`}
                          style={{
                            borderColor: isSelected 
                              ? 'var(--primary, #3B7CFF)' 
                              : (isSent ? 'var(--green, #10b981)' : 'var(--border, rgba(255,255,255,0.1))'),
                            backgroundColor: 'var(--s2, #1f2937)'
                          }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            const seed = encodeURIComponent(contact.username || contact.name || 'User');
                            e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=6e00ff,00dbe9,3b82f6`;
                          }}
                        />
                        
                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <div 
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow"
                            style={{ background: 'var(--primary, #3B7CFF)', color: '#fff' }}
                          >
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}

                        {/* Sent Confirmation Badge (when not selected) */}
                        {!isSelected && isSent && (
                          <div 
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow"
                            style={{ background: 'var(--green, #10b981)', color: '#fff' }}
                          >
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}

                        {/* Online Indicator Dot (when not selected and not sent) */}
                        {!isSelected && !isSent && contact.is_online && (
                          <span 
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 shadow-sm"
                            style={{ borderColor: 'var(--surface, #111827)' }}
                            title="Online"
                          />
                        )}

                        {/* Loading Spinner */}
                        {isItemSending && (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <div 
                              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" 
                              style={{ borderColor: 'var(--primary, #3B7CFF)', borderTopColor: 'transparent' }} 
                            />
                          </div>
                        )}
                      </div>

                      <span 
                        className="text-[11px] font-medium truncate w-full transition-colors"
                        style={{ 
                          color: isSelected 
                            ? 'var(--primary, #3B7CFF)' 
                            : (isSent ? 'var(--green, #10b981)' : 'var(--text, #f9fafb)'),
                          fontWeight: isSelected ? 700 : 500
                        }}
                      >
                        {isSent ? 'Sent' : `@${contact.username}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-xs" style={{ color: 'var(--dim, #9ca3af)' }}>
                <MessageSquare size={20} className="mb-2 opacity-50" />
                <p>{searchQuery ? `No users found matching "${searchQuery}"` : 'No users available'}</p>
              </div>
            )}
          </div>
        </div>

        {/* TASK 4: Conditional Bottom Caption Input */}
        {selectedUser && (
          <div 
            className="sticky bottom-0 z-20 px-5 pt-3 pb-2 border-t backdrop-blur-md"
            style={{
              background: 'var(--surface, #111827)',
              borderColor: 'var(--border, rgba(255,255,255,0.08))',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendDM();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a message..."
                autoFocus
                className="w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none transition-all"
                style={{
                  background: 'var(--s2, #1f2937)',
                  borderColor: 'var(--border, rgba(255,255,255,0.12))',
                  color: 'var(--text, #f9fafb)',
                }}
              />
              <button
                type="submit"
                disabled={isSending}
                className="p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--primary, #3B7CFF)',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(59, 124, 255, 0.35)'
                }}
                title="Send"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
